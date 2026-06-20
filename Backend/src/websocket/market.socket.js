import WebSocket from 'ws';
import binanceService from '../services/binance.service.js';

const RECONNECT_DELAY_MS  = 3000;
const MAX_RECONNECT_TRIES = 10;

// streamKey (e.g. 'BTCUSDT|trade' or 'BTCUSDT|kline|1m') → { ws, retries }
const activeStreams = new Map();

// Latest cached price per symbol (for REST endpoint)
export const priceCache = new Map();

/**
 * Attaches real-time market streaming to the Socket.IO server.
 * Call once from index.js after Socket.IO is created.
 *
 * @param {import('socket.io').Server} io
 */
const attachMarketSocket = (io) => {
    const nsp = io.of('/market');

    // ── Always-on global broadcast stream (BTCUSDT → root namespace) ─────────
    _openGlobalStream(io);

    nsp.on('connection', (socket) => {
        console.log(`📡 Market client connected: ${socket.id}`);

        // ── subscribe ─────────────────────────────────────────────────────────
        // Accept either a string symbol or an object { symbol, type, interval }
        socket.on('subscribe', (raw) => {
            try {
                const payload = typeof raw === 'string' ? { symbol: raw } : (raw || {});
                const symbol = binanceService.validateSymbol(payload.symbol || 'BTCUSDT');
                const type   = payload.type === 'kline' ? 'kline' : 'trade';
                const interval = payload.interval || '1m';

                const streamKey = type === 'kline' ? `${symbol}|kline|${interval}` : `${symbol}|trade`;

                socket.join(streamKey);
                console.log(`📊 ${socket.id} subscribed → ${streamKey}`);

                // Start Binance stream if not running
                if (!activeStreams.has(streamKey)) {
                    if (type === 'kline') {
                        _openKlineStream(symbol, interval, nsp, 0);
                    } else {
                        _openStream(symbol, nsp, 0);
                    }
                }

                // Send latest cached price immediately on subscribe (for trade)
                if (type === 'trade' && priceCache.has(symbol)) {
                    socket.emit('price', priceCache.get(symbol));
                }

                socket.emit('subscribed', { stream: streamKey, message: `Subscribed to ${streamKey} live stream.` });
            } catch (err) {
                socket.emit('error', { message: err.message || 'Invalid symbol.' });
            }
        });

        // ── unsubscribe ───────────────────────────────────────────────────────
        // unsubscribe may accept same payload shape as subscribe
        socket.on('unsubscribe', (raw) => {
            try {
                const payload = typeof raw === 'string' ? { symbol: raw } : (raw || {});
                const symbol = binanceService.validateSymbol(payload.symbol || 'BTCUSDT');
                const type   = payload.type === 'kline' ? 'kline' : 'trade';
                const interval = payload.interval || '1m';

                const streamKey = type === 'kline' ? `${symbol}|kline|${interval}` : `${symbol}|trade`;

                socket.leave(streamKey);
                console.log(`🔕 ${socket.id} unsubscribed ← ${streamKey}`);

                // Close Binance stream if room is now empty
                _closeStreamIfEmpty(streamKey, nsp);

                socket.emit('unsubscribed', { stream: streamKey });
            } catch (err) {
                socket.emit('error', { message: err.message || 'Invalid symbol.' });
            }
        });

        // ── disconnect ────────────────────────────────────────────────────────
        socket.on('disconnect', (reason) => {
            console.log(`📡 Market client disconnected: ${socket.id} (${reason})`);

            // Clean up any streams where this was the last subscriber
            activeStreams.forEach((_, symbol) => {
                _closeStreamIfEmpty(symbol, nsp);
            });
        });

        // ── ping/pong health check ────────────────────────────────────────────
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Always-on global stream: Binance → root io namespace as "market:price_update"
// Streams all SUPPORTED_SYMBOLS via combined stream
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_SYMBOLS = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt',
    'adausdt', 'dogeusdt', 'avaxusdt', 'dotusdt', 'maticusdt',
    'ltcusdt', 'linkusdt', 'uniusdt', 'atomusdt', 'trxusdt', 'xauusdt', 'xautusdt'];

const _openGlobalStream = (io, retries = 0) => {
    const streams = GLOBAL_SYMBOLS.map(s => `${s}@trade`).join('/');
    const url = `wss://fstream.binance.com/stream?streams=${streams}`;
    const ws  = new WebSocket(url);

    ws.on('open', () => {
        console.log('🟢 Binance global multi-stream opened');
    });

    ws.on('message', (raw) => {
        try {
            const frame = JSON.parse(raw.toString());
            const msg   = frame.data ?? frame;
            if (msg.e !== 'trade') return;

            const payload = {
                symbol:    msg.s,
                price:     parseFloat(msg.p),
                timestamp: msg.T,
            };

            priceCache.set(msg.s, payload);
            io.emit('market:price_update', payload);
        } catch {
            // Silently discard malformed frames
        }
    });

    ws.on('close', (code) => {
        console.warn(`🟡 Binance global stream closed (code=${code})`);
        if (retries >= MAX_RECONNECT_TRIES) {
            console.error('🔴 Max reconnect attempts reached for global stream.');
            return;
        }
        const delay = RECONNECT_DELAY_MS * Math.pow(2, Math.min(retries, 4));
        console.log(`🔁 Reconnecting global stream in ${delay}ms (attempt ${retries + 1})...`);
        setTimeout(() => _openGlobalStream(io, retries + 1), delay);
    });

    ws.on('error', (err) => {
        console.error('🔴 Binance global stream error:', err.message);
        ws.terminate();
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-symbol streams for /market namespace (subscribe/unsubscribe model)
// ─────────────────────────────────────────────────────────────────────────────

const _openStream = (symbol, nsp, retries = 0) => {
    const url = binanceService.getStreamUrl(symbol);
    const ws  = new WebSocket(url);

    // trade streams are keyed by `${symbol}|trade`
    const key = `${symbol}|trade`;
    activeStreams.set(key, { ws, retries });

    ws.on('open', () => {
        console.log(`🟢 Binance WS opened: ${symbol}`);
        const entry = activeStreams.get(symbol);
        if (entry) entry.retries = 0;
    });

    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.e !== 'trade') return;

            const payload = {
                symbol:       msg.s,
                price:        parseFloat(msg.p),
                quantity:     parseFloat(msg.q),
                tradeTime:    msg.T,
                isBuyerMaker: msg.m,
            };

            priceCache.set(msg.s, { symbol: msg.s, price: payload.price, timestamp: msg.T });
            // emit to rooms listening to trade streamKey
            nsp.to(`${msg.s}|trade`).emit('price', payload);
        } catch {
            // Silently discard malformed frames
        }
    });

    ws.on('close', (code) => {
        console.warn(`🟡 Binance WS closed: ${symbol} (code=${code})`);
        activeStreams.delete(key);

        const room = nsp.adapter.rooms.get(key);
        if (!room || room.size === 0) {
            console.log(`🔴 No subscribers left for ${key}. Stream will not reconnect.`);
            return;
        }

        if (retries >= MAX_RECONNECT_TRIES) {
            console.error(`🔴 Max reconnect attempts reached for ${symbol}. Notifying clients.`);
            nsp.to(symbol).emit('stream_error', {
                symbol,
                message: `Live stream for ${symbol} is unavailable. Please refresh.`,
            });
            return;
        }

        const delay = RECONNECT_DELAY_MS * Math.pow(2, Math.min(retries, 4));
        console.log(`🔁 Reconnecting ${symbol} in ${delay}ms (attempt ${retries + 1}/${MAX_RECONNECT_TRIES})...`);
        setTimeout(() => _openStream(symbol, nsp, retries + 1), delay);
    });

    ws.on('error', (err) => {
        console.error(`🔴 Binance WS error (${symbol}):`, err.message);
        ws.terminate();
    });
};

// Open a kline stream for a symbol+interval and emit `kline` events to namespace rooms keyed by `${symbol}|kline|${interval}`
const _openKlineStream = (symbol, interval = '1m', nsp, retries = 0) => {
    const url = binanceService.getKlineStreamUrl(symbol, interval);
    const ws  = new WebSocket(url);

    const key = `${symbol}|kline|${interval}`;
    activeStreams.set(key, { ws, retries });

    ws.on('open', () => {
        console.log(`🟢 Binance KLINE WS opened: ${key}`);
        const entry = activeStreams.get(key);
        if (entry) entry.retries = 0;
    });

    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            // Binance kline frames have an object 'k' for candle
            const k = msg.k ?? msg;
            if (!k) return;

            const payload = {
                symbol: symbol,
                interval: interval,
                startTime: k.t,
                open:  parseFloat(k.o),
                high:  parseFloat(k.h),
                low:   parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v),
                isClosed: !!k.x,
            };

            // Emit to room for this kline stream
            nsp.to(key).emit('kline', payload);
        } catch (err) {
            // discard
        }
    });

    ws.on('close', (code) => {
        console.warn(`🟡 Binance KLINE WS closed: ${key} (code=${code})`);
        activeStreams.delete(key);

        const room = nsp.adapter.rooms.get(key);
        if (!room || room.size === 0) {
            console.log(`🔴 No subscribers left for ${key}. Kline stream will not reconnect.`);
            return;
        }

        if (retries >= MAX_RECONNECT_TRIES) {
            console.error(`🔴 Max reconnect attempts reached for ${key}. Notifying clients.`);
            nsp.to(key).emit('stream_error', {
                stream: key,
                message: `Live kline stream for ${key} is unavailable. Please refresh.`,
            });
            return;
        }

        const delay = RECONNECT_DELAY_MS * Math.pow(2, Math.min(retries, 4));
        console.log(`🔁 Reconnecting ${key} in ${delay}ms (attempt ${retries + 1}/${MAX_RECONNECT_TRIES})...`);
        setTimeout(() => _openKlineStream(symbol, interval, nsp, retries + 1), delay);
    });

    ws.on('error', (err) => {
        console.error(`🔴 Binance KLINE WS error (${key}):`, err.message);
        ws.terminate();
    });
};

const _closeStreamIfEmpty = (streamKey, nsp) => {
    const room = nsp.adapter.rooms.get(streamKey);
    if (room && room.size > 0) return;

    const entry = activeStreams.get(streamKey);
    if (!entry) return;

    entry.ws.terminate();
    activeStreams.delete(streamKey);
    console.log(`🔴 Stream closed (no subscribers): ${streamKey}`);
};

export default attachMarketSocket;

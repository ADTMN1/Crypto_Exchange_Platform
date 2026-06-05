import WebSocket from 'ws';
import binanceService from '../services/binance.service.js';

const RECONNECT_DELAY_MS  = 3000;
const MAX_RECONNECT_TRIES = 10;

// symbol → { ws, retries }
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
        socket.on('subscribe', (rawSymbol) => {
            try {
                const symbol = binanceService.validateSymbol(rawSymbol || 'BTCUSDT');

                socket.join(symbol);
                console.log(`📊 ${socket.id} subscribed → ${symbol}`);

                // Start Binance stream if no one else is running it yet
                if (!activeStreams.has(symbol)) {
                    _openStream(symbol, nsp);
                }

                // Send latest cached price immediately on subscribe
                if (priceCache.has(symbol)) {
                    socket.emit('price', priceCache.get(symbol));
                }

                socket.emit('subscribed', { symbol, message: `Subscribed to ${symbol} live stream.` });
            } catch (err) {
                socket.emit('error', { message: err.message || 'Invalid symbol.' });
            }
        });

        // ── unsubscribe ───────────────────────────────────────────────────────
        socket.on('unsubscribe', (rawSymbol) => {
            try {
                const symbol = binanceService.validateSymbol(rawSymbol || 'BTCUSDT');

                socket.leave(symbol);
                console.log(`🔕 ${socket.id} unsubscribed ← ${symbol}`);

                // Close Binance stream if room is now empty
                _closeStreamIfEmpty(symbol, nsp);

                socket.emit('unsubscribed', { symbol });
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
    'ltcusdt', 'linkusdt', 'uniusdt', 'atomusdt', 'trxusdt'];

const _openGlobalStream = (io, retries = 0) => {
    const streams = GLOBAL_SYMBOLS.map(s => `${s}@trade`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
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

    activeStreams.set(symbol, { ws, retries });

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
            nsp.to(symbol).emit('price', payload);
        } catch {
            // Silently discard malformed frames
        }
    });

    ws.on('close', (code) => {
        console.warn(`🟡 Binance WS closed: ${symbol} (code=${code})`);
        activeStreams.delete(symbol);

        const room = nsp.adapter.rooms.get(symbol);
        if (!room || room.size === 0) {
            console.log(`🔴 No subscribers left for ${symbol}. Stream will not reconnect.`);
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

const _closeStreamIfEmpty = (symbol, nsp) => {
    const room = nsp.adapter.rooms.get(symbol);
    if (room && room.size > 0) return;

    const entry = activeStreams.get(symbol);
    if (!entry) return;

    entry.ws.terminate();
    activeStreams.delete(symbol);
    console.log(`🔴 Stream closed (no subscribers): ${symbol}`);
};

export default attachMarketSocket;

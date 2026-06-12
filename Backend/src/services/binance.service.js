import AppError from '../utils/errorHandling.js';

const BINANCE_REST_BASE  = process.env.BINANCE_REST_BASEURL
const BINANCE_WS_BASE    = process.env.BINANCE_WS_BASEURL
const REQUEST_TIMEOUT_MS = 8000;

export const SUPPORTED_SYMBOLS = [
    'BTCUSDT',  'ETHUSDT',  'BNBUSDT',  'SOLUSDT',  'XRPUSDT',
    'ADAUSDT',  'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT',  'MATICUSDT',
    'LTCUSDT',  'LINKUSDT', 'UNIUSDT',  'ATOMUSDT', 'TRXUSDT',
];

/**
 * Shared fetch wrapper — adds timeout and normalises Binance error responses.
 */
const binanceFetch = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
        response = await fetch(url, { signal: controller.signal });
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new AppError('Binance API request timed out. Please try again.', 504);
        }
        // Network-level failure (DNS, connection refused, etc.)
        throw new AppError('Unable to reach Binance API. Check your network connection.', 503);
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        let binanceMsg = `Binance API returned status ${response.status}.`;
        try {
            const body = await response.json();
            if (body?.msg) binanceMsg = body.msg;
        } catch {
            // Body not JSON — keep default message
        }

        // Map Binance HTTP status to meaningful codes
        if (response.status === 400) throw new AppError(binanceMsg, 400);
        if (response.status === 429) throw new AppError('Binance rate limit exceeded. Please slow down.', 429);
        if (response.status >= 500) throw new AppError('Binance API is temporarily unavailable.', 502);
        throw new AppError(binanceMsg, response.status);
    }

    try {
        return await response.json();
    } catch {
        throw new AppError('Received malformed response from Binance API.', 502);
    }
};

const binanceService = {
    /**
     * Returns the supported symbols list.
     */
    getSupportedSymbols: () => SUPPORTED_SYMBOLS,

    /**
     * Validates a symbol against the supported list.
     */
    validateSymbol: (symbol) => {
        if (!symbol || typeof symbol !== 'string') {
            throw new AppError('Symbol must be a non-empty string.', 400);
        }
        const upper = symbol.toUpperCase().trim();
        if (!SUPPORTED_SYMBOLS.includes(upper)) {
            throw new AppError(
                `Symbol "${upper}" is not supported. Supported: ${SUPPORTED_SYMBOLS.join(', ')}.`,
                400
            );
        }
        return upper;
    },

    /**
     * GET /api/v3/ticker/price?symbol=BTCUSDT
     * Fetches latest price for a single symbol.
     */
    getPrice: async (symbol = 'BTCUSDT') => {
        const upper = binanceService.validateSymbol(symbol);
        const url   = `${BINANCE_REST_BASE}/ticker/price?symbol=${upper}`;
        const data  = await binanceFetch(url);

        if (!data?.symbol || data?.price === undefined) {
            throw new AppError('Unexpected response structure from Binance price endpoint.', 502);
        }

        return {
            symbol: data.symbol,
            price:  parseFloat(data.price),
        };
    },

    /**
     * GET /api/v3/ticker/price (all symbols)
     * Fetches prices for all supported symbols in one request.
     */
    getAllPrices: async () => {
        const url  = `${BINANCE_REST_BASE}/ticker/price`;
        const data = await binanceFetch(url);

        if (!Array.isArray(data)) {
            throw new AppError('Unexpected response structure from Binance prices endpoint.', 502);
        }

        return data
            .filter((item) => SUPPORTED_SYMBOLS.includes(item.symbol))
            .map((item) => ({
                symbol: item.symbol,
                price:  parseFloat(item.price),
            }));
    },

    /**
     * GET /api/v3/ticker/24hr
     * Fetches 24h stats (price change %, volume) for all supported symbols.
     */
    getOverview: async () => {
        const url  = `${BINANCE_REST_BASE}/ticker/24hr`;
        const data = await binanceFetch(url);

        if (!Array.isArray(data)) {
            throw new AppError('Unexpected response structure from Binance 24hr endpoint.', 502);
        }

        return data
            .filter((item) => SUPPORTED_SYMBOLS.includes(item.symbol))
            .map((item) => ({
                symbol:        item.symbol,
                price:         parseFloat(item.lastPrice),
                change24h:     parseFloat(item.priceChangePercent),
                volume24h:     parseFloat(item.quoteVolume),
                high24h:       parseFloat(item.highPrice),
                low24h:        parseFloat(item.lowPrice),
            }));
    },

    /**
     * GET /api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100
     * Fetches full OHLCV candlestick data for charting.
     * For 30s interval, fetches 1s klines and aggregates them.
     */
    getHistory: async (symbol = 'BTCUSDT', interval = '1m', limit = 100) => {
        const upper = binanceService.validateSymbol(symbol);
        
        // Handle 30s interval by fetching 1s klines and aggregating
        if (interval === '30s') {
            const oneSecondLimit = limit * 30;
            const url = `${BINANCE_REST_BASE}/klines?symbol=${upper}&interval=1s&limit=${oneSecondLimit}`;
            const data = await binanceFetch(url);

            if (!Array.isArray(data)) {
                throw new AppError('Unexpected response structure from Binance klines endpoint.', 502);
            }

            const oneSecondCandles = data.map((k) => ({
                time: Math.floor(k[0] / 1000),
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5]),
            }));

            return binanceService.aggregateCandles(oneSecondCandles, 30);
        }

        // Normal case for Binance-supported intervals
        const url = `${BINANCE_REST_BASE}/klines?symbol=${upper}&interval=${interval}&limit=${limit}`;
        const data = await binanceFetch(url);

        if (!Array.isArray(data)) {
            throw new AppError('Unexpected response structure from Binance klines endpoint.', 502);
        }

        return data.map((k) => ({
            time: Math.floor(k[0] / 1000), // UTC seconds for lightweight-charts
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
        }));
    },

    /**
     * Aggregates small-interval candles into larger intervals.
     * @param {Array} candles - Array of smaller-interval candles
     * @param {number} factor - Number of small candles per large candle (e.g., 30 for 1s → 30s)
     * @returns {Array} Aggregated candles
     */
    aggregateCandles: (candles, factor) => {
        if (!candles || candles.length === 0) return [];
        
        const aggregated = [];
        let currentCandle = null;
        let count = 0;

        for (const candle of candles) {
            // Calculate which 30s bucket this candle belongs to
            const bucketTime = Math.floor(candle.time / factor) * factor;
            
            if (!currentCandle || currentCandle.time !== bucketTime) {
                // Start a new aggregated candle
                if (currentCandle) {
                    aggregated.push(currentCandle);
                }
                currentCandle = {
                    time: bucketTime,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                    volume: candle.volume,
                };
                count = 1;
            } else {
                // Update the current aggregated candle
                currentCandle.high = Math.max(currentCandle.high, candle.high);
                currentCandle.low = Math.min(currentCandle.low, candle.low);
                currentCandle.close = candle.close;
                currentCandle.volume += candle.volume;
                count++;
            }
        }

        // Add the last candle if we have one
        if (currentCandle) {
            aggregated.push(currentCandle);
        }

        return aggregated;
    },

    /**
     * Returns the Binance WebSocket trade stream URL for a symbol.
     */
    getStreamUrl: (symbol = 'BTCUSDT') => {
        return `${BINANCE_WS_BASE}/${symbol.toLowerCase()}@trade`;
    },
    /**
     * Returns the Binance WebSocket kline stream URL for a symbol+interval.
     * Example interval: '1m', '5m', '1h'
     */
    getKlineStreamUrl: (symbol = 'BTCUSDT', interval = '1m') => {
        return `${BINANCE_WS_BASE}/${symbol.toLowerCase()}@kline_${interval}`;
    },
};

export default binanceService;

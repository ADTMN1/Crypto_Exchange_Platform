import binanceService from '../services/binance.service.js';
import AppError from '../utils/errorHandling.js';
import { priceCache } from '../websocket/market.socket.js';

const marketController = {
    /**
     * GET /api/market/price
     * GET /api/market/price?symbol=ETHUSDT
     * Returns latest price for a single symbol (default: BTCUSDT).
     */
    getPrice: async (req, res, next) => {
        try {
            const symbol = req.query.symbol?.toString().trim() || 'BTCUSDT';
            const data   = await binanceService.getPrice(symbol);

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/market/price/:symbol
     * Returns latest price for the given route-param symbol.
     */
    getPriceBySymbol: async (req, res, next) => {
        try {
            const symbol = req.params.symbol?.toString().trim();

            if (!symbol) {
                return next(new AppError('Symbol parameter is required.', 400));
            }

            const data = await binanceService.getPrice(symbol);

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/market/prices
     * Returns latest prices for all supported symbols.
     */
    getAllPrices: async (req, res, next) => {
        try {
            const data = await binanceService.getAllPrices();

            return res.status(200).json({
                success: true,
                count: data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/market/coins
     * Returns the list of supported trading symbols.
     */
    getSupportedCoins: async (req, res, next) => {
        try {
            const symbols = binanceService.getSupportedSymbols();

            return res.status(200).json({
                success: true,
                count: symbols.length,
                data: symbols,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/market/overview
     * Returns 24h stats for all supported symbols.
     */
    getOverview: async (req, res, next) => {
        try {
            const data = await binanceService.getOverview();

            return res.status(200).json({
                success: true,
                count: data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/market/history/:symbol
     * Returns recent kline close prices for charting.
     */
    getHistory: async (req, res, next) => {
        try {
            const symbol   = req.params.symbol?.toString().trim();
            const interval = req.query.interval?.toString() || '1m';
            const limit    = parseInt(req.query.limit?.toString() || '100', 10);

            if (!symbol) return next(new AppError('Symbol parameter is required.', 400));

            const data = await binanceService.getHistory(symbol, interval, limit);

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    },
};

export default marketController;

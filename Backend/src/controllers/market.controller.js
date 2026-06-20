import axios from 'axios';
import { query } from '../config/db.config.js';
import { SUPPORTED_SYMBOLS } from '../services/binance.service.js';

const BINANCE_FUTURES_BASE = 'https://fapi.binance.com';

// Get market statistics for a symbol
export const getMarketStats = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Fetch 24hr ticker statistics from Binance Futures
    const response = await axios.get(`${BINANCE_FUTURES_BASE}/fapi/v1/ticker/24hr?symbol=${symbol.toUpperCase()}`);
    const data = response.data;
    
    const marketStats = {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      volumeQuote24h: parseFloat(data.quoteVolume),
      count: parseInt(data.count),
      openPrice: parseFloat(data.openPrice),
      prevClosePrice: parseFloat(data.prevClosePrice)
    };

    res.status(200).json({
      success: true,
      data: marketStats
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching market statistics',
      error: error.message
    });
  }
};

const formatKlineRow = (kline) => ({
  openTime: parseInt(kline[0]),
  open: parseFloat(kline[1]),
  high: parseFloat(kline[2]),
  low: parseFloat(kline[3]),
  close: parseFloat(kline[4]),
  volume: parseFloat(kline[5]),
  closeTime: parseInt(kline[6]),
  quoteAssetVolume: parseFloat(kline[7]),
  numberOfTrades: parseInt(kline[8]),
  takerBuyBaseAssetVolume: parseFloat(kline[9]),
  takerBuyQuoteAssetVolume: parseFloat(kline[10]),
});

/** Paginate Binance klines backwards to fill `days` of history (max 1000 per request). */
async function fetchKlinesByDays(symbol, interval, days, beforeTime = null) {
  const sym = symbol.toUpperCase();
  const anchor = beforeTime || Date.now();
  const endTarget = anchor - days * 24 * 60 * 60 * 1000;
  let fetchEnd = beforeTime ? beforeTime - 1 : Date.now();
  const byTime = new Map();
  const maxBatches = 25;

  for (let i = 0; i < maxBatches; i++) {
    const url = `${BINANCE_FUTURES_BASE}/fapi/v1/klines?symbol=${sym}&interval=${interval}&limit=1000&endTime=${fetchEnd}`;
    const response = await axios.get(url);
    const batch = response.data;
    if (!batch.length) break;

    for (const row of batch) {
      const candle = formatKlineRow(row);
      byTime.set(candle.openTime, candle);
    }

    const oldest = batch[0][0];
    if (oldest <= endTarget || batch.length < 1000) break;
    fetchEnd = oldest - 1;
  }

  return [...byTime.values()]
    .filter((k) => k.openTime >= endTarget)
    .sort((a, b) => a.openTime - b.openTime);
}

// Get historical kline/candlestick data
export const getKlines = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1m', limit = 500, startTime, endTime, days, before } = req.query;

    let formattedData;

    if (interval === '30s') {
      formattedData = await fetch30sKlines(symbol, limit, before ? parseInt(before, 10) : null);
    } else if (days) {
      formattedData = await fetchKlinesByDays(
        symbol,
        interval,
        parseInt(days, 10),
        before ? parseInt(before, 10) : null
      );
    } else {
      let url = `${BINANCE_FUTURES_BASE}/fapi/v1/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${Math.min(parseInt(limit, 10) || 500, 1000)}`;
      if (startTime) url += `&startTime=${startTime}`;
      if (endTime) url += `&endTime=${endTime}`;

      const response = await axios.get(url);
      formattedData = response.data.map(formatKlineRow);
    }

    res.status(200).json({
      success: true,
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error) {
    console.error('Error fetching klines:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching historical data',
      error: error.message,
    });
  }
};

// Get order book depth
export const getOrderBook = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 100 } = req.query;
    
    const response = await axios.get(`${BINANCE_FUTURES_BASE}/fapi/v1/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`);
    const data = response.data;
    
    const orderBook = {
      symbol: symbol.toUpperCase(),
      bids: data.bids.map(bid => ({
        price: parseFloat(bid[0]),
        quantity: parseFloat(bid[1])
      })),
      asks: data.asks.map(ask => ({
        price: parseFloat(ask[0]),
        quantity: parseFloat(ask[1])
      })),
      lastUpdateId: data.lastUpdateId
    };

    res.status(200).json({
      success: true,
      data: orderBook
    });
  } catch (error) {
    console.error('Error fetching order book:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order book',
      error: error.message
    });
  }
};

// Get recent trades
export const getRecentTrades = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 100 } = req.query;
    
    const response = await axios.get(`${BINANCE_FUTURES_BASE}/fapi/v1/trades?symbol=${symbol.toUpperCase()}&limit=${limit}`);
    const trades = response.data;
    
    const formattedTrades = trades.map(trade => ({
      id: trade.id,
      price: parseFloat(trade.price),
      quantity: parseFloat(trade.qty),
      timestamp: trade.time,
      isBuyerMaker: trade.isBuyerMaker
    }));

    res.status(200).json({
      success: true,
      data: formattedTrades
    });
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent trades',
      error: error.message
    });
  }
};

// Get all tickers (market overview)
export const getAllTickers = async (req, res) => {
  try {
    const response = await axios.get(`${BINANCE_FUTURES_BASE}/fapi/v1/ticker/24hr`);
    const tickers = response.data;
    
    // Filter for USDT pairs and format
    const usdtPairs = tickers
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .map(ticker => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChange),
        changePercent24h: parseFloat(ticker.priceChangePercent),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        volume24h: parseFloat(ticker.volume),
        volumeQuote24h: parseFloat(ticker.quoteVolume)
      }));

    // Split into supported and other pairs
    const supportedPairs = SUPPORTED_SYMBOLS.map(sym => 
      usdtPairs.find(t => t.symbol === sym) || null
    ).filter(Boolean);
    
    const otherPairs = usdtPairs
      .filter(t => !SUPPORTED_SYMBOLS.includes(t.symbol))
      .sort((a, b) => b.volumeQuote24h - a.volumeQuote24h);

    // Combine: supported first, then other top pairs, total 50
    const finalPairs = [...supportedPairs, ...otherPairs].slice(0, 50);

    res.status(200).json({
      success: true,
      data: finalPairs
    });
  } catch (error) {
    console.error('Error fetching all tickers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching market data',
      error: error.message
    });
  }
};

// Get exchange information
export const getExchangeInfo = async (req, res) => {
  try {
    const response = await axios.get(`${BINANCE_FUTURES_BASE}/fapi/v1/exchangeInfo`);
    const data = response.data;
    
    // Filter for active USDT pairs
    const usdtSymbols = data.symbols
      .filter(symbol => symbol.quoteAsset === 'USDT' && symbol.status === 'TRADING')
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        status: symbol.status,
        baseAssetPrecision: symbol.baseAssetPrecision,
        quotePrecision: symbol.quotePrecision,
        orderTypes: symbol.orderTypes,
        filters: symbol.filters
      }));

    res.status(200).json({
      success: true,
      data: {
        timezone: data.timezone,
        serverTime: data.serverTime,
        symbols: usdtSymbols
      }
    });
  } catch (error) {
    console.error('Error fetching exchange info:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exchange information',
      error: error.message
    });
  }
};

// Save user's favorite symbols
export const saveFavoriteSymbols = async (req, res) => {
  try {
    const { symbols } = req.body;
    const userId = req.user.id;
    
    // Clear existing favorites
    await query('DELETE FROM user_favorite_symbols WHERE user_id = ?', [userId]);
    
    // Insert new favorites
    if (symbols && symbols.length > 0) {
      const values = symbols.map(symbol => [userId, symbol]);
      await query(
        'INSERT INTO user_favorite_symbols (user_id, symbol) VALUES ?',
        [values]
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Favorite symbols saved successfully'
    });
  } catch (error) {
    console.error('Error saving favorite symbols:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving favorite symbols',
      error: error.message
    });
  }
};

// Get user's favorite symbols
export const getFavoriteSymbols = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const favorites = await query(
      'SELECT symbol FROM user_favorite_symbols WHERE user_id = ?',
      [userId]
    );
    
    const symbols = favorites.map(fav => fav.symbol);
    
    res.status(200).json({
      success: true,
      data: symbols
    });
  } catch (error) {
    console.error('Error fetching favorite symbols:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite symbols',
      error: error.message
    });
  }
};

const aggregateCandles = (candles, factor = 30) => {
  if (!Array.isArray(candles) || candles.length === 0) return [];

  const aggregated = [];
  let current = null;

  for (const candle of candles) {
    const bucketTime = Math.floor(candle.time / factor) * factor;

    if (!current || current.time !== bucketTime) {
      if (current) aggregated.push(current);
      current = {
        openTime: bucketTime * 1000,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        closeTime: (bucketTime + factor) * 1000 - 1,
        time: bucketTime,
      };
    } else {
      current.high = Math.max(current.high, candle.high);
      current.low = Math.min(current.low, candle.low);
      current.close = candle.close;
      current.volume += candle.volume;
    }
  }

  if (current) aggregated.push(current);
  return aggregated;
};

async function fetch30sKlines(symbol, limit = 500, beforeTime = null) {
  const sym = symbol.toUpperCase();
  const requestedLimit = Math.min(parseInt(limit, 10) || 500, 1000);
  const oneMinuteLimit = requestedLimit;
  const endTime = beforeTime ? beforeTime - 1 : Date.now();
  const maxBatches = 30;
  const candlesByTime = new Map();
  let fetchEnd = endTime;

  // Binance Futures doesn't have 1s klines, so fetch 1m klines and split them into two 30s pseudo-candles
  for (let i = 0; i < maxBatches; i++) {
    const url = `${BINANCE_FUTURES_BASE}/fapi/v1/klines?symbol=${sym}&interval=1m&limit=1000&endTime=${fetchEnd}`;
    const response = await axios.get(url);
    const batch = response.data;

    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const row of batch) {
      const candle = formatKlineRow(row);
      candle.time = Math.floor(candle.openTime / 1000);
      candlesByTime.set(candle.time, candle);
    }

    const oldest = batch[0][0];
    if (batch.length < 1000 || candlesByTime.size >= oneMinuteLimit) break;
    fetchEnd = oldest - 1;
  }

  const oneMinuteCandles = [...candlesByTime.values()]
    .sort((a, b) => a.time - b.time);

  // Split 1m klines into two 30s pseudo-candles
  const pseudo30 = [];
  for (const m of oneMinuteCandles) {
    const first = {
      openTime: m.openTime,
      open: m.open,
      high: m.high,
      low: m.low,
      close: m.close,
      volume: m.volume / 2,
      closeTime: m.closeTime - 30000,
      time: Math.floor(m.openTime / 1000),
    };
    const second = {
      openTime: m.openTime + 30000,
      open: m.open,
      high: m.high,
      low: m.low,
      close: m.close,
      volume: m.volume / 2,
      closeTime: m.closeTime,
      time: Math.floor((m.openTime + 30000) / 1000),
    };
    pseudo30.push(first, second);
  }

  return pseudo30.slice(0, requestedLimit);
}
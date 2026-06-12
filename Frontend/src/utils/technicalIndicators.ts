/**
 * Technical Indicators Calculations
 * Implementation of popular trading indicators: EMA, RSI, MACD, Bollinger Bands, etc.
 */

// Simple Moving Average
export function calculateSMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(0); // Not enough data points
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  
  return result;
}

// Exponential Moving Average
export function calculateEMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA value is SMA
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else if (i === period - 1) {
      result.push(ema);
    } else {
      ema = (prices[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }
  
  return result;
}

// Relative Strength Index
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(0);
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
  }
  
  return result;
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  prices: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // Calculate MACD line
  const macd: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (fastEMA[i] === 0 || slowEMA[i] === 0) {
      macd.push(0);
    } else {
      macd.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate Signal line (EMA of MACD)
  const signal = calculateEMA(macd, signalPeriod);
  
  // Calculate Histogram
  const histogram: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] === 0 || signal[i] === 0) {
      histogram.push(0);
    } else {
      histogram.push(macd[i] - signal[i]);
    }
  }
  
  return { macd, signal, histogram };
}

// Bollinger Bands
export function calculateBollingerBands(
  prices: number[], 
  period: number = 20, 
  stdDev: number = 2
): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(0);
      lower.push(0);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + (standardDeviation * stdDev));
      lower.push(mean - (standardDeviation * stdDev));
    }
  }
  
  return { upper, middle, lower };
}

// Stochastic Oscillator
export function calculateStochastic(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  kPeriod: number = 14, 
  dPeriod: number = 3
): {
  k: number[];
  d: number[];
} {
  const k: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      k.push(0);
    } else {
      const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
      const periodLows = lows.slice(i - kPeriod + 1, i + 1);
      const highestHigh = Math.max(...periodHighs);
      const lowestLow = Math.min(...periodLows);
      
      if (highestHigh === lowestLow) {
        k.push(50);
      } else {
        const kValue = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
        k.push(kValue);
      }
    }
  }
  
  const d = calculateSMA(k, dPeriod);
  
  return { k, d };
}

// Williams %R
export function calculateWilliamsR(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  period: number = 14
): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const periodHighs = highs.slice(i - period + 1, i + 1);
      const periodLows = lows.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...periodHighs);
      const lowestLow = Math.min(...periodLows);
      
      if (highestHigh === lowestLow) {
        result.push(-50);
      } else {
        const williamsR = ((highestHigh - closes[i]) / (highestHigh - lowestLow)) * -100;
        result.push(williamsR);
      }
    }
  }
  
  return result;
}

// Average True Range
export function calculateATR(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  period: number = 14
): number[] {
  const trueRanges: number[] = [];
  
  // Calculate True Range for each period
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
    } else {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
  }
  
  // Calculate ATR using EMA of True Range
  return calculateEMA(trueRanges, period);
}

// Commodity Channel Index
export function calculateCCI(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  period: number = 20
): number[] {
  const result: number[] = [];
  const typicalPrices: number[] = [];
  
  // Calculate Typical Price
  for (let i = 0; i < closes.length; i++) {
    typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
  }
  
  const smaTypicalPrice = calculateSMA(typicalPrices, period);
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const slice = typicalPrices.slice(i - period + 1, i + 1);
      const meanDeviation = slice.reduce((sum, tp) => sum + Math.abs(tp - smaTypicalPrice[i]), 0) / period;
      
      if (meanDeviation === 0) {
        result.push(0);
      } else {
        const cci = (typicalPrices[i] - smaTypicalPrice[i]) / (0.015 * meanDeviation);
        result.push(cci);
      }
    }
  }
  
  return result;
}

// Momentum
export function calculateMomentum(prices: number[], period: number = 10): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(0);
    } else {
      result.push(prices[i] - prices[i - period]);
    }
  }
  
  return result;
}

// Rate of Change
export function calculateROC(prices: number[], period: number = 10): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(0);
    } else {
      if (prices[i - period] !== 0) {
        const roc = ((prices[i] - prices[i - period]) / prices[i - period]) * 100;
        result.push(roc);
      } else {
        result.push(0);
      }
    }
  }
  
  return result;
}

// Money Flow Index
export function calculateMFI(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  volumes: number[], 
  period: number = 14
): number[] {
  const result: number[] = [];
  const typicalPrices: number[] = [];
  const rawMoneyFlows: number[] = [];
  
  // Calculate Typical Price and Raw Money Flow
  for (let i = 0; i < closes.length; i++) {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    typicalPrices.push(tp);
    rawMoneyFlows.push(tp * volumes[i]);
  }
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(0);
    } else {
      let positiveMoneyFlow = 0;
      let negativeMoneyFlow = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        if (j > 0) {
          if (typicalPrices[j] > typicalPrices[j - 1]) {
            positiveMoneyFlow += rawMoneyFlows[j];
          } else if (typicalPrices[j] < typicalPrices[j - 1]) {
            negativeMoneyFlow += rawMoneyFlows[j];
          }
        }
      }
      
      if (negativeMoneyFlow === 0) {
        result.push(100);
      } else {
        const moneyFlowRatio = positiveMoneyFlow / negativeMoneyFlow;
        const mfi = 100 - (100 / (1 + moneyFlowRatio));
        result.push(mfi);
      }
    }
  }
  
  return result;
}
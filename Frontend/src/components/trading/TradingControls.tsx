import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, Square, Minus } from 'lucide-react';

interface Order {
  id: string;
  type: 'limit' | 'stop' | 'market';
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  filled?: number;
  status: 'pending' | 'filled' | 'cancelled';
}

interface TradingControlsProps {
  currentPrice: number;
  selectedOrderType: 'market' | 'limit' | 'stop';
  onOrderTypeChange: (type: 'market' | 'limit' | 'stop') => void;
  onOrderPlace: (order: Omit<Order, 'id'>) => void;
  isDrawingMode: boolean;
  onDrawingModeToggle: () => void;
}

export const TradingControls: React.FC<TradingControlsProps> = ({
  currentPrice,
  selectedOrderType,
  onOrderTypeChange,
  onOrderPlace,
  isDrawingMode,
  onDrawingModeToggle,
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [stopPrice, setStopPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [total, setTotal] = useState<string>('');

  // Update price when currentPrice changes
  React.useEffect(() => {
    if (selectedOrderType === 'market') {
      setPrice(currentPrice.toString());
    }
  }, [currentPrice, selectedOrderType]);

  const calculateTotal = (qty: string, prc: string) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(prc) || 0;
    return (q * p).toFixed(2);
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    if (value && price) {
      setTotal(calculateTotal(value, price));
    }
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);
    if (value && quantity) {
      setTotal(calculateTotal(quantity, value));
    }
  };

  const handleTotalChange = (value: string) => {
    setTotal(value);
    if (value && price) {
      const calculatedQuantity = (parseFloat(value) / parseFloat(price)).toFixed(8);
      setQuantity(calculatedQuantity);
    }
  };

  const handleOrderSubmit = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const orderPrice = selectedOrderType === 'market' ? currentPrice : parseFloat(price);
    
    if (selectedOrderType !== 'market' && (!price || orderPrice <= 0)) {
      alert('Please enter a valid price');
      return;
    }

    const order: Omit<Order, 'id'> = {
      type: selectedOrderType === 'market' ? 'limit' : selectedOrderType,
      side,
      price: orderPrice,
      quantity: parseFloat(quantity),
      status: 'pending',
    };

    onOrderPlace(order);

    // Reset form
    setQuantity('');
    setTotal('');
    if (selectedOrderType !== 'market') {
      setPrice('');
    }
  };

  const getButtonColor = () => {
    return side === 'buy' 
      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4">
      <div className="flex flex-wrap gap-4">
        {/* Order Type Selection */}
        <div className="flex bg-gray-700 rounded-lg p-1">
          {(['market', 'limit', 'stop'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onOrderTypeChange(type)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedOrderType === type
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Buy/Sell Toggle */}
        <div className="flex bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setSide('buy')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              side === 'buy'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Buy
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              side === 'sell'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <TrendingDown className="w-4 h-4 mr-1" />
            Sell
          </button>
        </div>

        {/* Price Input */}
        {selectedOrderType !== 'market' && (
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
              className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
              step="0.00000001"
            />
          </div>
        )}

        {/* Stop Price Input (for stop orders) */}
        {selectedOrderType === 'stop' && (
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">Stop Price</label>
            <input
              type="number"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder="0.00"
              className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
              step="0.00000001"
            />
          </div>
        )}

        {/* Quantity Input */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="0.00000000"
            className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
            step="0.00000001"
          />
        </div>

        {/* Total Input */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">Total</label>
          <input
            type="number"
            value={total}
            onChange={(e) => handleTotalChange(e.target.value)}
            placeholder="0.00"
            className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-blue-500"
            step="0.01"
          />
        </div>

        {/* Submit Button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={handleOrderSubmit}
            className={`px-6 py-2 rounded-md text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${getButtonColor()}`}
          >
            {selectedOrderType === 'market' ? `${side.toUpperCase()} Market` : `Place ${side.toUpperCase()} Order`}
          </button>
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center border-l border-gray-600 pl-4 ml-4">
          <button
            onClick={onDrawingModeToggle}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isDrawingMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <Target className="w-4 h-4 mr-1" />
            Draw
          </button>
          
          <div className="flex ml-2 space-x-1">
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Horizontal Line"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex space-x-2 mt-3">
        <span className="text-sm text-gray-400 flex items-center">Quick amounts:</span>
        {[25, 50, 75, 100].map((percentage) => (
          <button
            key={percentage}
            onClick={() => {
              // This would calculate based on available balance
              const exampleBalance = 1000;
              const amount = (exampleBalance * percentage) / 100;
              if (price) {
                const qty = (amount / parseFloat(price)).toFixed(8);
                handleQuantityChange(qty);
              }
            }}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 hover:text-white transition-colors"
          >
            {percentage}%
          </button>
        ))}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';

interface WatchListItem {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  isFavorite: boolean;
}

interface WatchListProps {
  symbols: string[];
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}

export const WatchList: React.FC<WatchListProps> = ({
  symbols,
  selectedSymbol,
  onSymbolSelect,
}) => {
  const [watchList, setWatchList] = useState<WatchListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Generate sample data for watchlist
    const generateWatchList = () => {
      const items: WatchListItem[] = symbols.map(symbol => ({
        symbol,
        price: Math.random() * 50000 + 1000,
        change24h: (Math.random() - 0.5) * 1000,
        changePercent24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 10000 + 100,
        isFavorite: Math.random() > 0.7,
      }));
      setWatchList(items);
    };

    generateWatchList();
    
    // Simulate real-time price updates
    const interval = setInterval(() => {
      setWatchList(prev => prev.map(item => ({
        ...item,
        price: item.price + (Math.random() - 0.5) * 100,
        change24h: item.change24h + (Math.random() - 0.5) * 50,
        changePercent24h: item.changePercent24h + (Math.random() - 0.5) * 0.5,
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [symbols]);

  const toggleFavorite = (symbol: string) => {
    setWatchList(prev => prev.map(item => 
      item.symbol === symbol ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedList = watchList
    .filter(item => 
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.changePercent24h;
          bValue = b.changePercent24h;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-700">
        <input
          type="text"
          placeholder="Search symbols..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Sort Controls */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        <button
          onClick={() => handleSort('symbol')}
          className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
            sortBy === 'symbol' ? 'text-blue-400 bg-gray-700' : 'text-gray-400 hover:text-white'
          }`}
        >
          Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('price')}
          className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
            sortBy === 'price' ? 'text-blue-400 bg-gray-700' : 'text-gray-400 hover:text-white'
          }`}
        >
          Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('change')}
          className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
            sortBy === 'change' ? 'text-blue-400 bg-gray-700' : 'text-gray-400 hover:text-white'
          }`}
        >
          24h {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Watch List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedList.map((item) => {
          const isSelected = item.symbol === selectedSymbol;
          const isPositive = item.changePercent24h >= 0;
          const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
          const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <div
              key={item.symbol}
              onClick={() => onSymbolSelect(item.symbol)}
              className={`flex items-center p-3 border-b border-gray-700/50 cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-blue-600/20 border-blue-500/50' 
                  : 'hover:bg-gray-700/50'
              }`}
            >
              {/* Favorite Star */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.symbol);
                }}
                className="mr-2 text-gray-400 hover:text-yellow-400 transition-colors"
              >
                <Star 
                  className={`w-4 h-4 ${
                    item.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0">
                {/* Symbol and Price */}
                <div className="flex items-center justify-between mb-1">
                  <div className="text-white font-medium">
                    {item.symbol.replace('USDT', '/USDT')}
                  </div>
                  <div className="text-white text-sm font-mono">
                    ${item.price.toLocaleString(undefined, { 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </div>

                {/* Change and Volume */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center space-x-1 ${changeColor} text-xs`}>
                    <ChangeIcon className="w-3 h-3" />
                    <span>
                      {isPositive ? '+' : ''}{item.changePercent24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    Vol: {(item.volume24h / 1000).toFixed(1)}K
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Favorites Section */}
      {watchList.some(item => item.isFavorite) && (
        <>
          <div className="border-t border-gray-700 bg-gray-800 px-3 py-2">
            <div className="text-sm font-medium text-yellow-400 flex items-center">
              <Star className="w-4 h-4 mr-1 fill-current" />
              Favorites
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {watchList
              .filter(item => item.isFavorite)
              .map((item) => {
                const isSelected = item.symbol === selectedSymbol;
                const isPositive = item.changePercent24h >= 0;

                return (
                  <div
                    key={`fav-${item.symbol}`}
                    onClick={() => onSymbolSelect(item.symbol)}
                    className={`flex items-center justify-between p-2 border-b border-gray-700/30 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-600/20' 
                        : 'hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="text-white text-sm font-medium">
                      {item.symbol.replace('USDT', '')}
                    </div>
                    <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{item.changePercent24h.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};
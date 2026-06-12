import React from 'react';
import { TrendingUp, Activity, BarChart3, Volume } from 'lucide-react';

interface ChartIndicatorsProps {
  showIndicators: {
    ema: boolean;
    rsi: boolean;
    macd: boolean;
    volume: boolean;
  };
  onToggle: (indicator: keyof ChartIndicatorsProps['showIndicators']) => void;
}

export const ChartIndicators: React.FC<ChartIndicatorsProps> = ({
  showIndicators,
  onToggle,
}) => {
  const indicators = [
    {
      key: 'ema' as const,
      label: 'EMA(21)',
      icon: TrendingUp,
      color: 'text-yellow-400',
      description: 'Exponential Moving Average',
    },
    {
      key: 'rsi' as const,
      label: 'RSI(14)',
      icon: Activity,
      color: 'text-orange-400',
      description: 'Relative Strength Index',
    },
    {
      key: 'macd' as const,
      label: 'MACD',
      icon: BarChart3,
      color: 'text-blue-400',
      description: 'Moving Average Convergence Divergence',
    },
    {
      key: 'volume' as const,
      label: 'Volume',
      icon: Volume,
      color: 'text-green-400',
      description: 'Trading Volume',
    },
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-400 mr-2">Indicators:</span>
      {indicators.map((indicator) => {
        const Icon = indicator.icon;
        const isActive = showIndicators[indicator.key];
        
        return (
          <button
            key={indicator.key}
            onClick={() => onToggle(indicator.key)}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              isActive
                ? `bg-gray-700 ${indicator.color} shadow-sm`
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
            title={indicator.description}
          >
            <Icon className="w-4 h-4 mr-1.5" />
            {indicator.label}
          </button>
        );
      })}
    </div>
  );
};
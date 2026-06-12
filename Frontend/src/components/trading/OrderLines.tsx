import React, { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, createPriceLine } from 'lightweight-charts';

interface Order {
  id: string;
  type: 'limit' | 'stop';
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  filled?: number;
  status: 'pending' | 'filled' | 'cancelled';
}

interface OrderLinesProps {
  chart: IChartApi | null;
  orders: Order[];
  onOrderUpdate: (orderId: string, updates: Partial<Order>) => void;
}

export const OrderLines: React.FC<OrderLinesProps> = ({
  chart,
  orders,
  onOrderUpdate,
}) => {
  const priceLinesRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!chart) return;

    // Clear existing price lines
    priceLinesRef.current.forEach((priceLine, orderId) => {
      try {
        const series = chart.addLineSeries({});
        series.removePriceLine(priceLine);
        chart.removeSeries(series);
      } catch (error) {
        console.warn('Error removing price line:', error);
      }
    });
    priceLinesRef.current.clear();

    // Add price lines for active orders
    orders
      .filter(order => order.status === 'pending')
      .forEach(order => {
        try {
          // Create a temporary series to add price line to
          const series = chart.addLineSeries({
            color: 'transparent',
            lastValueVisible: false,
            priceLineVisible: false,
          });

          const priceLine = series.createPriceLine({
            price: order.price,
            color: order.side === 'buy' ? '#00d4aa' : '#ff6b6b',
            lineWidth: 2,
            lineStyle: order.type === 'stop' ? 1 : 0, // Dashed for stop orders
            axisLabelVisible: true,
            title: `${order.side.toUpperCase()} ${order.type.toUpperCase()}`,
          });

          priceLinesRef.current.set(order.id, { priceLine, series });

        } catch (error) {
          console.error('Error creating price line for order:', order.id, error);
        }
      });

    // Cleanup function
    return () => {
      priceLinesRef.current.forEach(({ priceLine, series }) => {
        try {
          series.removePriceLine(priceLine);
          chart.removeSeries(series);
        } catch (error) {
          console.warn('Error in cleanup:', error);
        }
      });
      priceLinesRef.current.clear();
    };
  }, [chart, orders]);

  // Handle price line interactions (drag to modify orders)
  useEffect(() => {
    if (!chart) return;

    const handleChartClick = (param: any) => {
      if (param.point && param.time && param.seriesData) {
        const clickedPrice = param.seriesData.values().next().value?.close;
        
        if (clickedPrice) {
          // Check if click is near any order line
          orders
            .filter(order => order.status === 'pending')
            .forEach(order => {
              const priceDiff = Math.abs(order.price - clickedPrice);
              const tolerance = order.price * 0.001; // 0.1% tolerance
              
              if (priceDiff <= tolerance) {
                // Order line was clicked - could trigger edit modal
                console.log('Order line clicked:', order.id);
              }
            });
        }
      }
    };

    chart.subscribeClick(handleChartClick);

    return () => {
      chart.unsubscribeClick(handleChartClick);
    };
  }, [chart, orders, onOrderUpdate]);

  return null; // This component only manages chart overlays
};
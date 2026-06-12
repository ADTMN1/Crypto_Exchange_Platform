import React, { useState } from 'react';
import { Bell, BellOff, X, Plus } from 'lucide-react';

interface Alert {
  id: string;
  price: number;
  type: 'above' | 'below';
  message?: string;
  isActive: boolean;
  triggered: boolean;
}

interface PriceAlertProps {
  currentPrice: number;
  alerts: Alert[];
  onAlertCreate: (price: number, type: 'above' | 'below', message?: string) => void;
  onAlertDelete?: (alertId: string) => void;
  onAlertToggle?: (alertId: string) => void;
}

export const PriceAlert: React.FC<PriceAlertProps> = ({
  currentPrice,
  alerts,
  onAlertCreate,
  onAlertDelete,
  onAlertToggle,
}) => {
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [alertMessage, setAlertMessage] = useState<string>('');

  const handleCreateAlert = () => {
    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    onAlertCreate(price, alertType, alertMessage || undefined);
    
    // Reset form
    setAlertPrice('');
    setAlertMessage('');
    setShowCreateAlert(false);
  };

  const activeAlerts = alerts.filter(alert => alert.isActive && !alert.triggered);
  const triggeredAlerts = alerts.filter(alert => alert.triggered);

  return (
    <div className="absolute top-4 right-4 z-10">
      {/* Alert Button */}
      <div className="relative">
        <button
          onClick={() => setShowCreateAlert(!showCreateAlert)}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
            activeAlerts.length > 0
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title="Price Alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeAlerts.length}
            </span>
          )}
        </button>

        {/* Create Alert Panel */}
        {showCreateAlert && (
          <div className="absolute top-12 right-0 bg-gray-800 rounded-lg shadow-lg p-4 w-80 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create Price Alert</h3>
              <button
                onClick={() => setShowCreateAlert(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Price Display */}
              <div className="text-sm text-gray-400">
                Current Price: <span className="text-white font-mono">${currentPrice.toFixed(2)}</span>
              </div>

              {/* Alert Type */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Alert When Price Is:</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAlertType('above')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      alertType === 'above'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Above
                  </button>
                  <button
                    onClick={() => setAlertType('below')}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      alertType === 'below'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Below
                  </button>
                </div>
              </div>

              {/* Alert Price */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Price:</label>
                <input
                  type="number"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  step="0.01"
                />
              </div>

              {/* Alert Message */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Message (optional):</label>
                <input
                  type="text"
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Enter custom message..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateAlert}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition-colors"
              >
                Create Alert
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Alerts List */}
      {activeAlerts.length > 0 && (
        <div className="mt-2 space-y-2">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-gray-800 rounded-lg p-3 border border-gray-700 min-w-64"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.type === 'above' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-white text-sm font-medium">
                    {alert.type === 'above' ? '↑' : '↓'} ${alert.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {onAlertToggle && (
                    <button
                      onClick={() => onAlertToggle(alert.id)}
                      className="text-gray-400 hover:text-white p-1"
                      title={alert.isActive ? 'Disable Alert' : 'Enable Alert'}
                    >
                      {alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                  )}
                  {onAlertDelete && (
                    <button
                      onClick={() => onAlertDelete(alert.id)}
                      className="text-gray-400 hover:text-red-400 p-1"
                      title="Delete Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {alert.message && (
                <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Current: ${currentPrice.toFixed(2)} | 
                Distance: {Math.abs(currentPrice - alert.price).toFixed(2)} 
                ({(((Math.abs(currentPrice - alert.price) / currentPrice) * 100).toFixed(2))}%)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Triggered Alerts Notifications */}
      {triggeredAlerts.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className="mt-2 bg-yellow-600 border border-yellow-500 rounded-lg p-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">
                Alert Triggered: ${alert.price.toFixed(2)}
              </span>
            </div>
            {onAlertDelete && (
              <button
                onClick={() => onAlertDelete(alert.id)}
                className="text-white hover:text-gray-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {alert.message && (
            <p className="text-sm text-yellow-100 mt-1">{alert.message}</p>
          )}
        </div>
      ))}
    </div>
  );
};
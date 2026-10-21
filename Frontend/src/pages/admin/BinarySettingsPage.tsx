import { useState, useEffect, useCallback } from 'react';
import binaryService, { BinarySettings } from '../../services/binary.service';
import { toast } from 'sonner';

export default function BinarySettingsPage() {
  const [settings, setSettings] = useState<BinarySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    is_enabled: true,
    payout_percentage: 80,
    min_trade_amount: 1,
    max_trade_amount: 10000,
    allowed_expirations: '30,60,300,600',
    allowed_pairs: 'BTC/USDT,ETH/USDT,SOL/USDT',
    duration_payouts: {} as Record<string, number>,
  });
  const [durationInputValues, setDurationInputValues] = useState({} as Record<string, string>);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await binaryService.getSettings();
      setSettings(response.data);
      const initialDurationPayouts = response.data.duration_payouts || {};
      const initialDurationInputs: Record<string, string> = {};
      Object.keys(initialDurationPayouts).forEach(dur => {
        initialDurationInputs[dur] = String(initialDurationPayouts[dur]);
      });
      
      setFormData({
        is_enabled: response.data.is_enabled,
        payout_percentage: response.data.payout_percentage,
        min_trade_amount: response.data.min_trade_amount,
        max_trade_amount: response.data.max_trade_amount,
        allowed_expirations: response.data.allowed_expirations.join(','),
        allowed_pairs: response.data.allowed_pairs.join(','),
        duration_payouts: initialDurationPayouts,
      });
      setDurationInputValues(initialDurationInputs);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load binary settings';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDurationPayoutChange = (duration: string, e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    // Allow only digits and one decimal point
    rawValue = rawValue.replace(/[^0-9.]/g, '');
    
    // Remove extra decimal points
    const parts = rawValue.split('.');
    let sanitizedValue = '';
    if (parts.length === 1) {
      sanitizedValue = parts[0];
    } else if (parts.length >= 2) {
      sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Remove leading zeros (but preserve "0" and "0."
    if (sanitizedValue.length > 0) {
      if (sanitizedValue.startsWith('0') && sanitizedValue.length > 1 && sanitizedValue[1] !== '.') {
        sanitizedValue = sanitizedValue.replace(/^0+/, '');
      }
    }
    
    // Update both the display string state and numeric form data
    setDurationInputValues(prev => ({
      ...prev,
      [duration]: sanitizedValue,
    }));
    
    let numericValue = 0;
    if (sanitizedValue) {
      const parsed = parseFloat(sanitizedValue);
      numericValue = isNaN(parsed) ? 0 : parsed;
    }
    
    setFormData(prev => ({
      ...prev,
      duration_payouts: {
        ...prev.duration_payouts,
        [duration]: numericValue,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await binaryService.updateSettings({
        ...formData,
        allowed_expirations: formData.allowed_expirations.split(',').map(s => parseInt(s.trim())),
        allowed_pairs: formData.allowed_pairs.split(',').map(s => s.trim()),
      });
      toast.success('Binary settings saved successfully!');
      await fetchSettings();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save binary settings';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="nex-admin-section-page">
        <div className="nex-loading">
          <div className="nex-spinner" />
          <p>Loading binary settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Binary Options Settings</h1>
          <p>Configure binary trading parameters</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Trading Configuration</h2>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="is_enabled"
                name="is_enabled"
                checked={formData.is_enabled}
                onChange={handleChange}
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
              <label htmlFor="is_enabled" style={{ fontSize: '1rem', fontWeight: '500' }}>
                Enable Binary Options Trading
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label htmlFor="payout_percentage" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  Payout Percentage (%)
                </label>
                <input
                  type="number"
                  id="payout_percentage"
                  name="payout_percentage"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.payout_percentage}
                  onChange={handleChange}
                  className="nex-input"
                />
              </div>

              <div>
                <label htmlFor="min_trade_amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  Minimum Trade Amount (USDT)
                </label>
                <input
                  type="number"
                  id="min_trade_amount"
                  name="min_trade_amount"
                  step="0.01"
                  min="0"
                  value={formData.min_trade_amount}
                  onChange={handleChange}
                  className="nex-input"
                />
              </div>

              <div>
                <label htmlFor="max_trade_amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  Maximum Trade Amount (USDT)
                </label>
                <input
                  type="number"
                  id="max_trade_amount"
                  name="max_trade_amount"
                  step="0.01"
                  min="0"
                  value={formData.max_trade_amount}
                  onChange={handleChange}
                  className="nex-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="allowed_expirations" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                Allowed Expirations (seconds, comma-separated)
              </label>
              <input
                type="text"
                id="allowed_expirations"
                name="allowed_expirations"
                value={formData.allowed_expirations}
                onChange={handleChange}
                placeholder="30,60,300,600"
                className="nex-input"
              />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Example: 30,60,300,600 (30 sec, 1 min, 5 min, 10 min)
              </div>
            </div>

            <div>
              <label htmlFor="allowed_pairs" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                Allowed Trading Pairs (comma-separated)
              </label>
              <input
                type="text"
                id="allowed_pairs"
                name="allowed_pairs"
                value={formData.allowed_pairs}
                onChange={handleChange}
                placeholder="BTC/USDT,ETH/USDT,SOL/USDT"
                className="nex-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                Duration-Based Payout Percentages (%)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {formData.allowed_expirations.split(',').map(durationStr => {
                  const duration = durationStr.trim();
                  // If no display value exists, initialize it
                  const currentDisplayValue = durationInputValues[duration] ?? 
                    (formData.duration_payouts[duration] !== undefined ? String(formData.duration_payouts[duration]) : '');
                  return (
                    <div key={duration}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {duration}s
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={currentDisplayValue}
                        onChange={(e) => handleDurationPayoutChange(duration, e)}
                        className="nex-input"
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Set different payout percentages for each trade duration
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={isSaving}
                className="nex-button nex-button-primary"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

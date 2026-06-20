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
  });

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await binaryService.getSettings();
      setSettings(response.data);
      setFormData({
        is_enabled: response.data.is_enabled,
        payout_percentage: response.data.payout_percentage,
        min_trade_amount: response.data.min_trade_amount,
        max_trade_amount: response.data.max_trade_amount,
        allowed_expirations: response.data.allowed_expirations.join(','),
        allowed_pairs: response.data.allowed_pairs.join(','),
      });
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
                <label htmlFor="payout_percentage" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(169,255,232,0.12)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label htmlFor="min_trade_amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(169,255,232,0.12)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label htmlFor="max_trade_amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
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
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(169,255,232,0.12)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="allowed_expirations" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Allowed Expirations (seconds, comma-separated)
              </label>
              <input
                type="text"
                id="allowed_expirations"
                name="allowed_expirations"
                value={formData.allowed_expirations}
                onChange={handleChange}
                placeholder="30,60,300,600"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(169,255,232,0.12)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                }}
              />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Example: 30,60,300,600 (30 sec, 1 min, 5 min, 10 min)
              </div>
            </div>

            <div>
              <label htmlFor="allowed_pairs" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Allowed Trading Pairs (comma-separated)
              </label>
              <input
                type="text"
                id="allowed_pairs"
                name="allowed_pairs"
                value={formData.allowed_pairs}
                onChange={handleChange}
                placeholder="BTC/USDT,ETH/USDT,SOL/USDT"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(169,255,232,0.12)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={isSaving}
                className="nex-btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
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

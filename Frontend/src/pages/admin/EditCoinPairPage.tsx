import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import pairService from '../../services/pair.service';

const BACK = '/admin/manage-coin-pair';

export default function EditCoinPairPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    base_currency: '', quote_currency: '',
    min_order_size: '', max_order_size: '',
    price_precision: 8, qty_precision: 8,
    maker_fee: '', taker_fee: '',
    is_active: true,
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await pairService.getPair(id);
        const p = res.data;
        setForm({
          base_currency: p.base_currency,
          quote_currency: p.quote_currency,
          min_order_size: p.min_order_size,
          max_order_size: p.max_order_size,
          price_precision: p.price_precision,
          qty_precision: p.qty_precision,
          maker_fee: p.maker_fee,
          taker_fee: p.taker_fee,
          is_active: p.is_active,
        });
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load pair');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const toPercent = (v: string) =>
    isNaN(parseFloat(v)) ? '0.00%' : `${(parseFloat(v) * 100).toFixed(2)}%`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await pairService.updatePair(id!, form);
      toast.success('Trading pair updated successfully');
      navigate(BACK);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update pair');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="nex-admin-section-page">
        <div className="nex-loading"><div className="nex-spinner" /><p>Loading pair details...</p></div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="nex-admin-section-page">
        <section className="nex-section-header">
          <div><h1>Edit Coin Pair</h1></div>
          <Link to={BACK} className="nex-btn nex-btn-secondary">← Back to List</Link>
        </section>
        <section className="nex-section-body">
          <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="nex-btn nex-btn-primary" style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Edit Coin Pair</h1>
          <p>Update configuration for {form.base_currency}/{form.quote_currency}</p>
        </div>
        <Link to={BACK} className="nex-btn nex-btn-secondary">
          ← Coin Pair List
        </Link>
      </section>

      <section className="nex-section-body">
        <form onSubmit={handleSubmit} style={{ maxWidth: '760px' }}>

          {/* ── Pair Identity ─────────────────────────────── */}
          <div className="nex-card" style={{ marginBottom: '1.5rem' }}>
            <div className="nex-card-title">
              <h2>Pair Identity</h2>
              <span className="nex-badge nex-badge-secondary">Read-only</span>
            </div>
            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="nex-form-group">
                <label>Base Currency</label>
                <input className="nex-input" value={form.base_currency} disabled />
              </div>
              <div className="nex-form-group">
                <label>Quote Currency</label>
                <input className="nex-input" value={form.quote_currency} disabled />
              </div>
            </div>
          </div>

          {/* ── Order Limits ──────────────────────────────── */}
          <div className="nex-card" style={{ marginBottom: '1.5rem' }}>
            <div className="nex-card-title"><h2>Order Limits</h2></div>
            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="nex-form-group">
                <label>Min Order Size *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="nex-input"
                    value={form.min_order_size}
                    onChange={e => set('min_order_size', e.target.value)}
                    required placeholder="0.00001000"
                    style={{ paddingRight: '3.5rem' }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                    {form.base_currency}
                  </span>
                </div>
              </div>
              <div className="nex-form-group">
                <label>Max Order Size *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="nex-input"
                    value={form.max_order_size}
                    onChange={e => set('max_order_size', e.target.value)}
                    required placeholder="100.00000000"
                    style={{ paddingRight: '3.5rem' }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                    {form.base_currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Precision & Fees ──────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="nex-card">
              <div className="nex-card-title"><h2>Precision</h2></div>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="nex-form-group">
                  <label>Price Precision *</label>
                  <input
                    type="number" className="nex-input"
                    value={form.price_precision}
                    onChange={e => set('price_precision', parseInt(e.target.value))}
                    required min="0" max="18"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Decimal places for price display</small>
                </div>
                <div className="nex-form-group">
                  <label>Quantity Precision *</label>
                  <input
                    type="number" className="nex-input"
                    value={form.qty_precision}
                    onChange={e => set('qty_precision', parseInt(e.target.value))}
                    required min="0" max="18"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Decimal places for qty display</small>
                </div>
              </div>
            </div>

            <div className="nex-card">
              <div className="nex-card-title"><h2>Trading Fees</h2></div>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="nex-form-group">
                  <label>
                    Maker Fee *
                    <span className="nex-badge nex-badge-info" style={{ marginLeft: '0.5rem', fontSize: '10px' }}>
                      = {toPercent(form.maker_fee)}
                    </span>
                  </label>
                  <input
                    className="nex-input"
                    value={form.maker_fee}
                    onChange={e => set('maker_fee', e.target.value)}
                    required placeholder="0.0010"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>0.001 = 0.10%</small>
                </div>
                <div className="nex-form-group">
                  <label>
                    Taker Fee *
                    <span className="nex-badge nex-badge-info" style={{ marginLeft: '0.5rem', fontSize: '10px' }}>
                      = {toPercent(form.taker_fee)}
                    </span>
                  </label>
                  <input
                    className="nex-input"
                    value={form.taker_fee}
                    onChange={e => set('taker_fee', e.target.value)}
                    required placeholder="0.0010"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>0.001 = 0.10%</small>
                </div>
              </div>
            </div>
          </div>

          {/* ── Status ────────────────────────────────────── */}
          <div className="nex-card" style={{ marginBottom: '1.5rem' }}>
            <div className="nex-card-title"><h2>Status</h2></div>
            <div style={{ padding: '1.25rem' }}>
              <div
                onClick={() => set('is_active', !form.is_active)}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', width: 'fit-content' }}
              >
                {/* Toggle */}
                <div style={{
                  width: '44px', height: '24px', borderRadius: '12px', position: 'relative',
                  background: form.is_active ? 'var(--color-success, #22c55e)' : 'rgba(255,255,255,0.12)',
                  transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: form.is_active ? '23px' : '3px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: form.is_active ? 'var(--color-success, #22c55e)' : 'var(--text-muted)' }}>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {form.is_active ? 'Pair is available for users to trade' : 'Pair is hidden from users'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Submit ────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link to={BACK} className="nex-btn nex-btn-secondary">Cancel</Link>
            <button
              type="submit"
              disabled={saving}
              className="nex-btn nex-btn-primary"
              style={{ minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {saving ? (
                <>
                  <div className="nex-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>

        </form>
      </section>
    </main>
  );
}

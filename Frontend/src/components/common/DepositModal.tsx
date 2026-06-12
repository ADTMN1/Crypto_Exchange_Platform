import React, { useState } from 'react';

const NETWORKS = [
  { key: 'BTC', label: 'Bitcoin (BTC)', addr: 'bc1qv6u5twcl4hajf2ntrsdv0z7cemmk9wrqxl6rmp' },
  { key: 'USDT-TRC20', label: 'Tether USDT (TRC20)', addr: 'TJUqY79c7SJmP42HmFUxKaCw43FBC7VBce' },
  { key: 'ETH', label: 'Ethereum (ETH)', addr: '0x038ca5fD1Ece24Cf23bE2c773AA0A722ADf93a6a' },
  { key: 'SOL', label: 'Solana (SOL)', addr: 'F81SdYWtkhLLZ4v6fDwvKZn9k2ZKpoz47fpCNFJ5H5mW' },
  { key: 'USDT', label: 'Tether (USDT)', addr: 'TP5bPp5RCbyG4tUCaCAE4Mc7ca5Msq3H9F' },
];

export default function DepositModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [network, setNetwork] = useState(NETWORKS[0].key);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const net = NETWORKS.find((n) => n.key === network) || NETWORKS[0];
  const address = net.addr;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(address)}`;

  const doCopy = async (text: string) => {
    // Try modern clipboard API, fallback to execCommand
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      console.info('Address copied to clipboard');
    } catch (e) {
      console.warn('copy failed', e);
    }
  };

  const copy = async () => doCopy(address);
  const copyFromInput = async () => doCopy(address);

  const share = async () => {
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: `${net.label} deposit`, text: address });
      } catch (e) {
        console.warn('share failed', e);
      }
    } else {
      console.info('Share not supported in this browser');
    }
  };

  const setAmountAndClose = () => {
    onClose();
  };

  return (
    <div className="deposit-overlay" role="dialog" aria-modal="true" aria-labelledby="deposit-title">
      <div className="deposit-modal">
        <header className="deposit-header">
          <div className="deposit-header-left">
            <h3 id="deposit-title" className="deposit-title">Deposit</h3>
            <div className="deposit-net-info">{net.label}</div>
          </div>
          <button className="deposit-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <section className="deposit-body">
          <div className="deposit-main">
            <div className="deposit-main-left">
              <div className="deposit-select">
                <button
                  type="button"
                  className="deposit-select-btn"
                  onClick={() => setDropdownOpen((s) => !s)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                >
                  <div className="deposit-select-left">
                    <div className="net-key">{NETWORKS.find(n=>n.key===network)?.key}</div>
                    <div className="net-label">{NETWORKS.find(n=>n.key===network)?.label}</div>
                  </div>
                  <div className="deposit-select-caret">▾</div>
                </button>

                {dropdownOpen && (
                  <div className="deposit-select-dropdown" role="listbox">
                    {NETWORKS.map((n) => (
                      <button
                        key={n.key}
                        type="button"
                        className={`deposit-select-item ${n.key === network ? 'active' : ''}`}
                        onClick={() => { setNetwork(n.key); setDropdownOpen(false); }}
                        role="option"
                        aria-selected={n.key === network}
                      >
                        <div className="net-key">{n.key}</div>
                        <div className="net-label">{n.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="deposit-form">
                <label className="deposit-label">Amount</label>
                <input className="deposit-amount" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />

                <div className="deposit-btns">
                  <button className="btn" onClick={share} type="button">Share</button>
                  <button className="btn primary" onClick={setAmountAndClose} type="button">Done</button>
                </div>
              </div>
            </div>

            <aside className="deposit-main-right">
              <div className="qr-card">
                <div className="qr-inner">
                  <img src={qrUrl} alt="QR code for deposit address" className="deposit-qr-img" />
                  <div className="qr-badge" aria-hidden>
                    <span className="qr-badge-text">{net.key.split('-')[0]}</span>
                  </div>
                </div>
              </div>
              <div className="deposit-addr-row">
                <input
                  readOnly
                  className="deposit-address-input"
                  value={address}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Deposit address"
                />
                <button className={`btn copy-addr ${copied ? 'copied' : ''}`} onClick={copyFromInput} type="button">{copied ? 'Copied' : 'Copy'}</button>
              </div>
            </aside>
          </div>
        </section>

        <footer className="deposit-note">Only send the selected asset to this address. Other assets will be lost.</footer>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const settingsConfig = [
  { id: 'general',           icon: '⚙️',  title: 'General Settings',         description: 'Configure fundamental site information and basic settings',                    route: '/admin/settings/general',          category: 'Core' },
  { id: 'system',            icon: '🔧',  title: 'System Configuration',      description: 'Control core system modules and technical configurations',                     route: '/admin/settings/system',           category: 'Core' },
  { id: 'logo',              icon: '🎨',  title: 'Logo & Favicon',            description: 'Upload and manage your site logo, favicon, and branding assets',              route: '/admin/settings/branding',         category: 'Design' },
  { id: 'frontend',          icon: '🖥️',  title: 'Manage Frontend',           description: 'Control frontend content, themes, and user interface settings',               route: '/admin/settings/frontend',         category: 'Design' },
  { id: 'custom-css',        icon: '🎭',  title: 'Custom CSS',                description: 'Add custom styles and frontend customizations',                                route: '/admin/settings/custom-css',       category: 'Design' },
  { id: 'notifications',     icon: '🔔',  title: 'Notification Settings',     description: 'Manage system notifications, alerts, and communication settings',             route: '/admin/settings/notifications',    category: 'Communication' },
  { id: 'pusher',            icon: '📡',  title: 'Pusher Configuration',      description: 'Configure real-time notifications and WebSocket connections',                  route: '/admin/settings/pusher',           category: 'Communication' },
  { id: 'payments',          icon: '💳',  title: 'Payment Gateways',          description: 'Configure payment methods, processors, and gateway settings',                 route: '/admin/settings/payments',         category: 'Finance' },
  { id: 'withdrawals',       icon: '💰',  title: 'Withdrawal Methods',        description: 'Setup payout methods and withdrawal processing options',                       route: '/admin/settings/withdrawals',      category: 'Finance' },
  { id: 'charges',           icon: '💵',  title: 'Charge Settings',           description: 'Manage fees, charges, and commission configurations',                          route: '/admin/settings/charges',          category: 'Finance' },
  { id: 'wallet',            icon: '👛',  title: 'Wallet Settings',           description: 'Configure wallet system and financial account settings',                       route: '/admin/settings/wallet',           category: 'Finance' },
  { id: 'currency-provider', icon: '🌍',  title: 'Currency Data Provider',    description: 'Setup exchange rate providers and currency data sources',                     route: '/admin/settings/currency-provider',category: 'Finance' },
  { id: 'charts',            icon: '📊',  title: 'Chart Settings',            description: 'Configure charts, analytics, and data visualization options',                 route: '/admin/settings/charts',           category: 'Analytics' },
  { id: 'seo',               icon: '🌐',  title: 'SEO Configuration',         description: 'Optimize meta tags, keywords, and search engine settings',                    route: '/admin/settings/seo',              category: 'Marketing' },
  { id: 'sitemap',           icon: '🗺️',  title: 'Sitemap XML',               description: 'Generate and manage SEO sitemaps for search engines',                        route: '/admin/settings/sitemap',          category: 'Marketing' },
  { id: 'robots',            icon: '🤖',  title: 'Robots.txt',                description: 'Configure search engine crawler instructions and permissions',                 route: '/admin/settings/robots',           category: 'Marketing' },
  { id: 'kyc',               icon: '🔒',  title: 'KYC Settings',              description: 'Configure user verification fields and identity requirements',                 route: '/admin/settings/kyc',              category: 'Security' },
  { id: 'social-login',      icon: '🔑',  title: 'Social Login Settings',     description: 'Setup Google, Facebook, and other social authentication methods',             route: '/admin/settings/social-login',     category: 'Security' },
  { id: 'pages',             icon: '📄',  title: 'Manage Pages',              description: 'Create and manage dynamic pages, content, and site structure',                route: '/admin/settings/pages',            category: 'Content' },
  { id: 'language',          icon: '🌏',  title: 'Language Settings',         description: 'Manage localization, translations, and multi-language support',               route: '/admin/settings/language',         category: 'Localization' },
  { id: 'extensions',        icon: '🧩',  title: 'Extensions',                description: 'Manage plugins, add-ons, and extra feature modules',                          route: '/admin/settings/extensions',       category: 'System' },
  { id: 'cron',              icon: '⏰',  title: 'Cron Job Settings',         description: 'Configure automation jobs, scheduled tasks, and background processes',        route: '/admin/settings/cron',             category: 'System' },
  { id: 'maintenance',       icon: '🚧',  title: 'Maintenance Mode',          description: 'Enable or disable site maintenance mode and system updates',                  route: '/admin/settings/maintenance',      category: 'System' },
  { id: 'policy',            icon: '📋',  title: 'Policy Pages',              description: 'Manage terms of service, privacy policy, and legal documents',               route: '/admin/settings/policies',         category: 'Legal' },
  { id: 'gdpr',              icon: '🍪',  title: 'GDPR Cookie Settings',      description: 'Configure cookie consent, privacy compliance, and data protection',          route: '/admin/settings/gdpr',             category: 'Legal' },
];

const CATEGORY_COLOUR: Record<string, string> = {
  Core:          'ssc-cat--core',
  Design:        'ssc-cat--design',
  Communication: 'ssc-cat--comm',
  Finance:       'ssc-cat--finance',
  Analytics:     'ssc-cat--analytics',
  Marketing:     'ssc-cat--marketing',
  Security:      'ssc-cat--security',
  Content:       'ssc-cat--content',
  Localization:  'ssc-cat--locale',
  System:        'ssc-cat--system',
  Legal:         'ssc-cat--legal',
};

export default function SystemSettingsPage() {
  const navigate = useNavigate();
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');

  const categories = useMemo(() =>
    ['All', ...Array.from(new Set(settingsConfig.map(s => s.category))).sort()],
    []
  );

  const filtered = useMemo(() =>
    settingsConfig.filter(s => {
      const q = search.toLowerCase();
      const matchQ = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      const matchC = category === 'All' || s.category === category;
      return matchQ && matchC;
    }),
    [search, category]
  );

  const handleClick = (s: typeof settingsConfig[0]) => {
    if (s.id === 'general') {
      navigate(s.route);
    } else {
      toast.info(`Opening ${s.title}…`);
    }
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>System Settings</h1>
          <p>Configure and manage all system components and features</p>
        </div>
        <span className="mu-badge mu-badge--role-user ssc-count-chip">
          {filtered.length} settings
        </span>
      </section>

      <section className="nex-section-body">

        {/* ── Search + filter bar ── */}
        <div className="ssc-controls">
          <div className="mu-search-wrap ssc-search">
            <svg className="mu-search-icon" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="mu-search-input"
              placeholder="Search settings…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="mu-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="ssc-cats">
            {categories.map(cat => (
              <button
                key={cat}
                className={`stp-tab${category === cat ? ' stp-tab--active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Settings grid ── */}
        {filtered.length === 0 ? (
          <div className="nex-empty-state">
            <span style={{ fontSize: 40 }}>🔍</span>
            <p>No settings match your search</p>
            <button className="mu-clear-search-btn" onClick={() => { setSearch(''); setCategory('All'); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="ssc-grid">
            {filtered.map(s => (
              <button key={s.id} className="ssc-card" onClick={() => handleClick(s)}>
                {/* category chip */}
                <span className={`ssc-cat-chip ${CATEGORY_COLOUR[s.category] || 'ssc-cat--system'}`}>
                  {s.category}
                </span>
                {/* icon */}
                <div className="ssc-icon">{s.icon}</div>
                {/* text */}
                <div className="ssc-text">
                  <h3 className="ssc-title">{s.title}</h3>
                  <p className="ssc-desc">{s.description}</p>
                </div>
                {/* arrow */}
                <span className="ssc-arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

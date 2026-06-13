import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingCard } from '../../components/admin/SettingCard';
import { toast } from 'sonner';
import '../../styles/settings-grid.css';

// Icons (using emoji for now - can be replaced with react-icons)
const settingsConfig = [
  {
    id: 'general',
    icon: '⚙️',
    title: 'General Settings',
    description: 'Configure fundamental site information and basic settings',
    route: '/admin/settings/general',
    category: 'Core'
  },
  {
    id: 'logo',
    icon: '🎨',
    title: 'Logo & Favicon',
    description: 'Upload and manage your site logo, favicon, and branding assets',
    route: '/admin/settings/branding',
    category: 'Design'
  },
  {
    id: 'system',
    icon: '🔧',
    title: 'System Configuration',
    description: 'Control core system modules and technical configurations',
    route: '/admin/settings/system',
    category: 'Core'
  },
  {
    id: 'notifications',
    icon: '🔔',
    title: 'Notification Settings',
    description: 'Manage system notifications, alerts, and communication settings',
    route: '/admin/settings/notifications',
    category: 'Communication'
  },
  {
    id: 'payments',
    icon: '💳',
    title: 'Payment Gateways',
    description: 'Configure payment methods, processors, and gateway settings',
    route: '/admin/settings/payments',
    category: 'Finance'
  },
  {
    id: 'withdrawals',
    icon: '💰',
    title: 'Withdrawal Methods',
    description: 'Setup payout methods and withdrawal processing options',
    route: '/admin/settings/withdrawals',
    category: 'Finance'
  },
  {
    id: 'pusher',
    icon: '📡',
    title: 'Pusher Configuration',
    description: 'Configure real-time notifications and WebSocket connections',
    route: '/admin/settings/pusher',
    category: 'Communication'
  },
  {
    id: 'charts',
    icon: '📊',
    title: 'Chart Settings',
    description: 'Configure charts, analytics, and data visualization options',
    route: '/admin/settings/charts',
    category: 'Analytics'
  },
  {
    id: 'charges',
    icon: '💵',
    title: 'Charge Settings',
    description: 'Manage fees, charges, and commission configurations',
    route: '/admin/settings/charges',
    category: 'Finance'
  },
  {
    id: 'wallet',
    icon: '👛',
    title: 'Wallet Settings',
    description: 'Configure wallet system and financial account settings',
    route: '/admin/settings/wallet',
    category: 'Finance'
  },
  {
    id: 'currency-provider',
    icon: '🌍',
    title: 'Currency Data Provider',
    description: 'Setup exchange rate providers and currency data sources',
    route: '/admin/settings/currency-provider',
    category: 'Finance'
  },
  {
    id: 'seo',
    icon: '🌐',
    title: 'SEO Configuration',
    description: 'Optimize meta tags, keywords, and search engine settings',
    route: '/admin/settings/seo',
    category: 'Marketing'
  },
  {
    id: 'frontend',
    icon: '🖥️',
    title: 'Manage Frontend',
    description: 'Control frontend content, themes, and user interface settings',
    route: '/admin/settings/frontend',
    category: 'Design'
  },
  {
    id: 'pages',
    icon: '📄',
    title: 'Manage Pages',
    description: 'Create and manage dynamic pages, content, and site structure',
    route: '/admin/settings/pages',
    category: 'Content'
  },
  {
    id: 'kyc',
    icon: '🔒',
    title: 'KYC Settings',
    description: 'Configure user verification fields and identity requirements',
    route: '/admin/settings/kyc',
    category: 'Security'
  },
  {
    id: 'social-login',
    icon: '🔑',
    title: 'Social Login Settings',
    description: 'Setup Google, Facebook, and other social authentication methods',
    route: '/admin/settings/social-login',
    category: 'Security'
  },
  {
    id: 'language',
    icon: '🌏',
    title: 'Language Settings',
    description: 'Manage localization, translations, and multi-language support',
    route: '/admin/settings/language',
    category: 'Localization'
  },
  {
    id: 'extensions',
    icon: '🧩',
    title: 'Extensions',
    description: 'Manage plugins, add-ons, and extra feature modules',
    route: '/admin/settings/extensions',
    category: 'System'
  },
  {
    id: 'cron',
    icon: '⏰',
    title: 'Cron Job Settings',
    description: 'Configure automation jobs, scheduled tasks, and background processes',
    route: '/admin/settings/cron',
    category: 'System'
  },
  {
    id: 'policy',
    icon: '📋',
    title: 'Policy Pages',
    description: 'Manage terms of service, privacy policy, and legal documents',
    route: '/admin/settings/policies',
    category: 'Legal'
  },
  {
    id: 'maintenance',
    icon: '🚧',
    title: 'Maintenance Mode',
    description: 'Enable or disable site maintenance mode and system updates',
    route: '/admin/settings/maintenance',
    category: 'System'
  },
  {
    id: 'gdpr',
    icon: '🍪',
    title: 'GDPR Cookie Settings',
    description: 'Configure cookie consent, privacy compliance, and data protection',
    route: '/admin/settings/gdpr',
    category: 'Legal'
  },
  {
    id: 'custom-css',
    icon: '🎭',
    title: 'Custom CSS',
    description: 'Add custom styles and frontend customizations',
    route: '/admin/settings/custom-css',
    category: 'Design'
  },
  {
    id: 'sitemap',
    icon: '🗺️',
    title: 'Sitemap XML',
    description: 'Generate and manage SEO sitemaps for search engines',
    route: '/admin/settings/sitemap',
    category: 'Marketing'
  },
  {
    id: 'robots',
    icon: '🤖',
    title: 'Robots.txt',
    description: 'Configure search engine crawler instructions and permissions',
    route: '/admin/settings/robots',
    category: 'Marketing'
  }
];

export default function SystemSettingsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...Array.from(new Set(settingsConfig.map(item => item.category)))];
    return cats.sort();
  }, []);

  // Filter settings based on search and category
  const filteredSettings = useMemo(() => {
    return settingsConfig.filter(setting => {
      const matchesSearch = setting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           setting.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || setting.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleSettingClick = (setting: any) => {
    if (setting.id === 'general') {
      // Navigate to the General Settings page
      navigate('/admin/settings/general');
    } else {
      // For other settings, show a placeholder message
      toast.info(`Opening ${setting.title} configuration...`);
      console.log('Navigate to:', setting.route);
    }
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>System Settings</h1>
          <p>Configure and manage all system components and features</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="nex-badge nex-badge-info">
            {filteredSettings.length} Settings
          </span>
        </div>
      </section>

      <section className="nex-section-body">
        {/* Search and Filter Controls */}
        <div style={{ 
          marginBottom: '2rem',
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {/* Search Bar */}
          <div className="nex-search-box" style={{ maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nex-search-input"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(169,255,232,0.12)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: 'white',
                fontSize: '14px',
                width: '100%',
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`nex-badge ${selectedCategory === category ? 'nex-badge-primary' : 'nex-badge-secondary'}`}
                style={{
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '20px',
                  transition: 'all 0.2s ease',
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Grid */}
        <div className="settings-grid">
          {filteredSettings.map((setting) => (
            <SettingCard
              key={setting.id}
              icon={setting.icon}
              title={setting.title}
              description={setting.description}
              route={setting.route}
              category={setting.category}
              onClick={() => handleSettingClick(setting)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredSettings.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'rgba(255,255,255,0.6)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>No settings found</h3>
            <p style={{ margin: '0' }}>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </section>

      <style>{`
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        @media (min-width: 768px) {
          .settings-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1200px) {
          .settings-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 480px) {
          .settings-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .setting-card:hover .setting-card-arrow {
          opacity: 1;
          transform: translateX(4px);
        }
      `}</style>
    </main>
  );
}
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SettingCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  route?: string;
  onClick?: () => void;
  category?: string;
}

export const SettingCard: React.FC<SettingCardProps> = ({
  icon,
  title,
  description,
  route,
  onClick,
  category = 'system'
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (route) {
      navigate(route);
    } else {
      console.log(`Navigate to: ${title} settings`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="setting-card group"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(169,255,232,0.12)',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const card = e.currentTarget;
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(169,255,232,0.2)';
        card.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))';
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget;
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
        card.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))';
      }}
    >
      {/* Category Badge */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        fontSize: '10px',
        padding: '4px 8px',
        borderRadius: '12px',
        background: 'rgba(169,255,232,0.1)',
        color: 'rgba(169,255,232,0.8)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {category}
      </div>

      {/* Icon */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(169,255,232,0.15), rgba(169,255,232,0.05))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        fontSize: '24px',
        color: 'rgba(169,255,232,0.9)',
      }}>
        {icon}
      </div>

      {/* Content */}
      <div>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          lineHeight: '1.4',
        }}>
          {title}
        </h3>
        <p style={{
          margin: '0',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: '1.5',
        }}>
          {description}
        </p>
      </div>

      {/* Hover Arrow */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        fontSize: '16px',
        color: 'rgba(169,255,232,0.6)',
        transition: 'all 0.3s ease',
        opacity: '0',
      }} 
      className="setting-card-arrow">
        →
      </div>
    </div>
  );
};
import React from 'react';
import { Link } from 'react-router-dom';
import { DownloadCloud } from 'lucide-react';

export default function CTA({ 
  title = "Ready to Download Video & Audio?", 
  subtitle = "Experience high-speed, ad-free downloads with full trimming and quality selection features.",
  btnText = "Go to Downloader",
  linkTo = "/"
}) {
  return (
    <div 
      className="glass-panel animate-slide-up" 
      style={{ 
        width: '100%', 
        padding: '40px 24px', 
        textAlign: 'center', 
        marginTop: '40px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(168, 85, 247, 0.03))',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--accent-blue)', marginBottom: '8px' }}>
        <DownloadCloud size={40} />
      </div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
        {title.split(' ').slice(0, -2).join(' ')} <span className="text-gradient">{title.split(' ').slice(-2).join(' ')}</span>
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', lineHeight: '1.6' }}>
        {subtitle}
      </p>
      <Link 
        to={linkTo} 
        className="neon-button" 
        style={{ 
          marginTop: '8px', 
          padding: '12px 32px', 
          fontSize: '1rem', 
          textDecoration: 'none', 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600'
        }}
      >
        {btnText}
      </Link>
    </div>
  );
}

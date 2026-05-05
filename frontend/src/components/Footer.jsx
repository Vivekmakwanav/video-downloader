import React from 'react';
import { Code, Globe, Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ 
      marginTop: 'auto',
      padding: '40px 20px', 
      borderTop: '1px solid var(--glass-border)',
      background: 'rgba(0,0,0,0.2)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <Code size={24} />
        </a>
        <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <Globe size={24} />
        </a>
        <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <Mail size={24} />
        </a>
      </div>
      
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        Built with <Heart size={16} color="var(--accent-purple)" fill="var(--accent-purple)" /> by Nexus Team
      </div>
      
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        &copy; {new Date().getFullYear()} Nexus Video Downloader. All rights reserved.
      </div>
    </footer>
  );
}

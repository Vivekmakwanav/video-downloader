import React from 'react';
import { Shield, Zap, Globe, DownloadCloud } from 'lucide-react';

export default function About() {
  const features = [
    { icon: <Zap size={24} className="text-gradient" />, title: "Lightning Fast", desc: "Our async backend processes videos instantly, avoiding timeouts and latency." },
    { icon: <Shield size={24} className="text-gradient" />, title: "Secure & Private", desc: "Files are securely processed and immediately deleted from our servers after download." },
    { icon: <Globe size={24} className="text-gradient" />, title: "Universal Platform", desc: "Download from YouTube, Instagram, X (Twitter), Facebook, Vimeo, and more." },
    { icon: <DownloadCloud size={24} className="text-gradient" />, title: "High Quality", desc: "We automatically merge high-res video and lossless audio using industry-leading tools." }
  ];

  return (
    <div className="animate-slide-up about-container">
      
      <div className="about-header">
        <h1 className="hero-title" style={{ marginBottom: '24px' }}>
          About <span className="text-gradient">Vidnexa</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          We built Vidnexa Video Downloader to provide a clean, modern, and ad-free experience for archiving your favorite media across the internet. 
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {features.map((f, i) => (
          <div key={i} className="glass-panel" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

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
    <div className="animate-slide-up" style={{ flex: 1, width: '100%', maxWidth: '900px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '60px' }}>
      
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '24px' }}>
          About <span className="text-gradient">Nexus</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          We built Nexus Video Downloader to provide a clean, modern, and ad-free experience for archiving your favorite media across the internet. 
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {features.map((f, i) => (
          <div key={i} className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(0,240,255,0.05), rgba(138,43,226,0.05))', border: '1px solid rgba(138,43,226,0.2)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px' }}>Our Technology</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '24px' }}>
          Nexus is powered by a high-performance stack designed for scale and speed. The frontend is built with React and Vite, utilizing cutting-edge glassmorphism and modern CSS variables for dynamic theming.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7' }}>
          Under the hood, our Python FastAPI backend leverages asynchronous processing, real-time WebSockets, and the powerful `yt-dlp` library to securely extract and merge media streams via `ffmpeg`.
        </p>
      </div>

    </div>
  );
}

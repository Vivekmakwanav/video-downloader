import React from 'react';
import { Terminal, ShieldAlert, Cpu, ArrowLeft, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function ApiDoc() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'API Documentation', url: '/api-documentation' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
      {/* SEO Integration */}
      <SEO 
        title="API Documentation - Integrate Vidnexa Extractor API" 
        description="Integrate our high-performance video extraction and download backend into your applications. Free developers API endpoints."
        breadcrumbs={breadcrumbs}
      />

      {/* Navigation link */}
      <div>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ArrowLeft size={16} /> Back to Downloader
        </Link>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
          Developer <span className="text-gradient">API Docs</span>
        </h1>
        <p className="hero-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '8px' }}>
          Integrate high-speed platform video analysis and downloads directly into your software.
        </p>
      </div>

      {/* Warning Box */}
      <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(59, 130, 246, 0.15)', background: 'rgba(59, 130, 246, 0.02)', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <ShieldAlert size={28} color="var(--accent-blue)" />
        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Rate Limits:</strong> Our public API is rate-limited to 60 requests per minute per IP address. For commercial limits or dedicated nodes, contact our support desk.
        </div>
      </div>

      {/* Endpoint 1 */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: '#20c997', color: '#000', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800' }}>POST</span>
          <code style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>/api/analyze</code>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Submits a public video URL to extract all available download stream options, thumbnails, subtitles, and duration.
        </p>
        
        {/* Code Snippet */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>CURL Request Example</label>
          <pre style={{ background: '#070a13', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', color: '#a855f7', fontFamily: 'monospace' }}>
{`curl -X POST https://api.vidnexa.space/api/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'`}
          </pre>
        </div>
      </div>

      {/* Endpoint 2 */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: '#20c997', color: '#000', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800' }}>POST</span>
          <code style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>/api/download</code>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Dispatches a background download and trim task on the server. Starts a real-time progress update pipeline.
        </p>
        
        {/* Code Snippet */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>CURL Request Example</label>
          <pre style={{ background: '#070a13', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', color: '#a855f7', fontFamily: 'monospace' }}>
{`curl -X POST https://api.vidnexa.space/api/download \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "format_id": "137+140",
    "client_id": "unique-client-guid",
    "start_time": 10,
    "end_time": 40
  }'`}
          </pre>
        </div>
      </div>

      {/* Dynamic API Specifications Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Terminal size={24} color="var(--accent-blue)" />
          <div>
            <span style={{ display: 'block', fontWeight: '700', fontSize: '0.95rem' }}>Response Format</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Standard JSON payload</span>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Globe size={24} color="var(--accent-purple)" />
          <div>
            <span style={{ display: 'block', fontWeight: '700', fontSize: '0.95rem' }}>CORS Enabled</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full cross-origin access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

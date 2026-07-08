import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { legalData } from '../data/legal';
import SEO from '../components/SEO';
import CTA from '../components/CTA';

export default function LegalLayout() {
  const { slug } = useParams();
  const page = legalData.find(l => l.slug === slug);

  if (!page) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>Policy Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>The policy you are looking for does not exist.</p>
        <Link to="/" className="neon-button" style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Legal Policies', url: '#' },
    { name: page.title, url: `/${page.slug}` }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
      {/* SEO metadata */}
      <SEO 
        title={page.seoTitle} 
        description={page.seoDesc}
        breadcrumbs={breadcrumbs}
      />

      {/* Navigation & Breadcrumbs */}
      <div>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ArrowLeft size={16} /> Back to Downloader
        </Link>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
          <Shield size={24} />
          <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Legal & Compliance</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2' }}>{page.title}</h1>
        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Last modified: July 7, 2026</p>
        </div>
      </div>

      {/* Policy Content */}
      <article style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
        {page.content.map((sec, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>{sec.text}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{sec.p || sec.text && !sec.p ? sec.p || '' : ''}</p>
            {/* Handle simple text-based paragraph blocks */}
            {sec.type === 'p' && <p style={{ color: 'var(--text-secondary)' }}>{sec.text}</p>}
            {sec.type === 'h2' && idx + 1 < page.content.length && page.content[idx + 1].type === 'p' ? null : null}
          </div>
        ))}
        {/* Support contacts */}
        <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>Got Questions About Our Policies?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            For compliance reviews, DMCA notices, or privacy audits, email us at <a href="mailto:legal@vidnexa.space" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>legal@vidnexa.space</a>.
          </p>
        </div>
      </article>

      {/* Reusable CTA */}
      <CTA />
    </div>
  );
}

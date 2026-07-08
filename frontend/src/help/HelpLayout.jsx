import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, BookOpen } from 'lucide-react';
import { helpData } from '../data/help';
import SEO from '../components/SEO';
import CTA from '../components/CTA';

export default function HelpLayout() {
  const { slug } = useParams();
  const guide = helpData.find(h => h.slug === slug);

  if (!guide) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>Guide Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>The help guide you are looking for does not exist.</p>
        <Link to="/help" className="neon-button" style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Help Center
        </Link>
      </div>
    );
  }

  // Get 3 related guides
  const relatedGuides = helpData.filter(h => h.slug !== slug).slice(0, 3);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Help Center', url: '/help' },
    { name: guide.title, url: `/help/${guide.slug}` }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
      {/* SEO metadata */}
      <SEO 
        title={`${guide.title} | Vidnexa Help Center`} 
        description={guide.summary}
        breadcrumbs={breadcrumbs}
      />

      {/* Navigation & Breadcrumbs */}
      <div>
        <Link to="/help" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ArrowLeft size={16} /> Back to Help Center
        </Link>
      </div>

      {/* Guide Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span style={{ alignSelf: 'flex-start', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
          {guide.category}
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2' }}>{guide.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
          {guide.summary}
        </p>
      </div>

      {/* Guide Body */}
      <article style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
        {guide.content.map((sec, idx) => {
          if (sec.type === 'h2') {
            return <h2 key={idx} style={{ fontSize: '1.7rem', fontWeight: '700', marginTop: '24px', marginBottom: '8px' }}>{sec.text}</h2>;
          }
          if (sec.type === 'h3') {
            return <h3 key={idx} style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '16px', marginBottom: '6px' }}>{sec.text}</h3>;
          }
          if (sec.type === 'p') {
            return <p key={idx} style={{ color: 'var(--text-secondary)' }}>{sec.text}</p>;
          }
          if (sec.type === 'ol') {
            return (
              <ol key={idx} style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)' }}>
                {sec.items.map((li, lIdx) => (
                  <li key={lIdx}>{li}</li>
                ))}
              </ol>
            );
          }
          if (sec.type === 'ul') {
            return (
              <ul key={idx} style={{ paddingLeft: '24px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)' }}>
                {sec.items.map((li, lIdx) => (
                  <li key={lIdx}>{li}</li>
                ))}
              </ul>
            );
          }
          return null;
        })}
      </article>

      {/* Reusable CTA */}
      <CTA />

      {/* Related Guides */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '40px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={20} color="var(--accent-purple)" /> Related Help Guides
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {relatedGuides.map(rel => (
            <Link 
              key={rel.slug} 
              to={`/help/${rel.slug}`} 
              className="glass-panel" 
              style={{ padding: '20px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: '600', textTransform: 'uppercase' }}>{rel.category}</span>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '700', lineHeight: '1.4' }}>{rel.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>View Guide &rarr;</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

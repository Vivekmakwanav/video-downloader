import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, FileText, ArrowRight, ShieldQuestion } from 'lucide-react';
import { helpData } from '../data/help';
import SEO from '../components/SEO';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';

export default function HelpIndex() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter help topics based on query
  const filteredHelp = helpData.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(helpData.map(h => h.category))];

  // Helper FAQs
  const helpFaqs = [
    {
      q: 'How does the video trimmer work?',
      a: 'When you analyze a video, click the "Trim" button next to any format, enter your start and end times in MM:SS, and click Download. Our backend uses FFmpeg stream copying to trim the segment instantly without quality loss.'
    },
    {
      q: 'Why does my download stay at 0% or pending?',
      a: 'This usually happens if the server is processing another download or if YouTube is throttling the stream temporarily. Try reloading the page and submitting the link again.'
    },
    {
      q: 'Can I download private social media posts?',
      a: 'No. To respect copyright and user privacy, Vidnexa does not extract videos that are protected by passwords, private profiles, or require account logins.'
    }
  ];

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Help Center', url: '/help' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-slide-up">
      {/* SEO metadata */}
      <SEO 
        title="Vidnexa Help Center | Downloader User Guides & FAQs" 
        description="Find step-by-step instructions, troubleshooting tips, and quality resolution guides for using the Vidnexa online video downloader."
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
          Vidnexa <span className="text-gradient">Help Center</span>
        </h1>
        <p className="hero-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '8px' }}>
          Search user guides, troubleshoot downloader errors, and explore supported platforms.
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text"
          className="neon-input"
          placeholder="Search how-to guides and troubleshooting articles..."
          style={{ paddingLeft: '48px', height: '48px', fontSize: '1rem' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Search Results / Grouped Categories */}
      {searchQuery.trim() ? (
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px' }}>Search Results for "{searchQuery}"</h2>
          {filteredHelp.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <ShieldQuestion size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No guides found matching your query.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredHelp.map(guide => (
                <Link 
                  key={guide.slug} 
                  to={`/help/${guide.slug}`} 
                  className="glass-panel" 
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', textDecoration: 'none', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                >
                  <FileText size={20} color="var(--accent-purple)" />
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: '600' }}>{guide.title}</span>
                    <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{guide.summary}</span>
                  </div>
                  <ArrowRight size={16} color="var(--text-secondary)" />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Grouped Platform Guides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {categories.map((cat, idx) => {
              const guides = helpData.filter(h => h.category === cat);
              return (
                <div key={idx} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HelpCircle size={18} color="var(--accent-purple)" /> {cat} Guides
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {guides.map(guide => (
                      <Link 
                        key={guide.slug} 
                        to={`/help/${guide.slug}`} 
                        style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        <FileText size={14} />
                        <span>{guide.title.split(' (')[0]}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <FAQ faqList={helpFaqs} />
        </>
      )}

      {/* Reusable CTA */}
      <CTA />
    </div>
  );
}

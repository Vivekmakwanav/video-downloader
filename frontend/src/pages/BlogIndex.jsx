import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, Search, ArrowRight } from 'lucide-react';
import { blogData } from '../data/blog';
import SEO from '../components/SEO';
import CTA from '../components/CTA';

export default function BlogIndex() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...new Set(blogData.map(post => post.category))];

  // Filter posts based on search query and active category
  const filteredPosts = blogData.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
      {/* SEO Integration */}
      <SEO 
        title="Vidnexa Blog | Social Media Tips & Downloader Guides"
        description="Learn how to save, clip, and archive HD media from YouTube, Instagram, X (Twitter), and TikTok. Read the latest tips and optimization guides."
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
          Vidnexa <span className="text-gradient">Blog Feed</span>
        </h1>
        <p className="hero-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '8px' }}>
          Tips, tricks, and step-by-step guides to download and archive digital media securely.
        </p>
      </div>

      {/* Search & Category Filter Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text"
            className="neon-input"
            placeholder="Search articles..."
            style={{ paddingLeft: '48px', height: '48px', fontSize: '1rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? 'var(--accent-blue)' : 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (activeCategory === cat ? 'var(--accent-blue)' : 'var(--glass-border)'),
                color: activeCategory === cat ? '#000' : 'var(--text-secondary)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                if (activeCategory !== cat) e.currentTarget.style.borderColor = 'var(--accent-blue)';
              }}
              onMouseOut={e => {
                if (activeCategory !== cat) e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Cards Grid */}
      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No articles match your criteria.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Try resetting your search query or category filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredPosts.map(post => (
            <div 
              key={post.slug}
              className="glass-panel"
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                  {post.category}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {post.readTime}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: '1.4', color: 'var(--text-primary)' }}>{post.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{post.summary}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {post.date}
                </span>
                <Link to={`/blog/${post.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '600' }}>
                  Read <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reusable CTA */}
      <CTA />
    </div>
  );
}

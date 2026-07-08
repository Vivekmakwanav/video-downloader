import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Download, BookOpen, HelpCircle, FileText } from 'lucide-react';
import { toolsData } from '../data/tools';
import { blogData } from '../data/blog';
import { helpData } from '../data/help';

export default function SearchBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tools: [], blog: [], help: [] });
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Run search query filtering
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tools: [], blog: [], help: [] });
      return;
    }
    const q = query.toLowerCase();

    const filteredTools = toolsData.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.shortName.toLowerCase().includes(q) || 
      t.seoDesc.toLowerCase().includes(q)
    );

    const filteredBlog = blogData.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.category.toLowerCase().includes(q) || 
      b.summary.toLowerCase().includes(q)
    );

    const filteredHelp = helpData.filter(h => 
      h.title.toLowerCase().includes(q) || 
      h.category.toLowerCase().includes(q) || 
      h.summary.toLowerCase().includes(q)
    );

    setResults({ tools: filteredTools, blog: filteredBlog, help: filteredHelp });
  }, [query]);

  const hasResults = results.tools.length > 0 || results.blog.length > 0 || results.help.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      {/* Search Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="glass-panel"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 16px', 
          color: 'var(--text-secondary)', 
          background: 'var(--glass-bg)', 
          border: '1px solid var(--glass-border)', 
          borderRadius: '20px', 
          cursor: 'pointer',
          fontSize: '0.9rem',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
        aria-label="Search site"
      >
        <Search size={16} />
        <span>Search...</span>
      </button>

      {/* Fullscreen Search Modal Overlay */}
      {isOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            background: 'rgba(5, 7, 13, 0.85)', 
            backdropFilter: 'blur(12px)',
            zIndex: 9999, 
            display: 'flex', 
            justifyContent: 'center', 
            paddingTop: '80px' 
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div 
            ref={modalRef}
            className="glass-panel animate-slide-up"
            style={{ 
              width: '90%', 
              maxWidth: '650px', 
              maxHeight: '80vh', 
              background: 'var(--glass-bg)', 
              borderRadius: '20px', 
              border: '1px solid var(--glass-border)', 
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflow: 'hidden'
            }}
          >
            {/* Input Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <Search size={22} color="var(--accent-blue)" />
              <input 
                ref={inputRef}
                type="text"
                placeholder="Search downloaders, articles, guides, or FAQs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontFamily: "'Outfit', sans-serif"
                }}
              />
              <button 
                onClick={() => setIsOpen(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  padding: '4px'
                }}
                aria-label="Close search"
              >
                <X size={22} />
              </button>
            </div>

            {/* Results Body */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {!query.trim() ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '1rem', fontWeight: '500' }}>Type something to start searching...</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>E.g. "YouTube", "troubleshoot", "reels", "MP3"</p>
                </div>
              ) : !hasResults ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '1rem', fontWeight: '500' }}>No matches found for "{query}"</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Try double-checking the spelling or using broader terms.</p>
                </div>
              ) : (
                <>
                  {/* Tools Results */}
                  {results.tools.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--accent-blue)', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} /> Downloader Tools
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {results.tools.map(tool => (
                          <Link 
                            key={tool.id} 
                            to={tool.path} 
                            onClick={() => setIsOpen(false)}
                            style={{ display: 'block', textDecoration: 'none', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          >
                            <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{tool.name}</span>
                            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>{tool.heroSub}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Help Center Results */}
                  {results.help.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--accent-purple)', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HelpCircle size={14} /> Help & Guides
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {results.help.map(guide => (
                          <Link 
                            key={guide.slug} 
                            to={`/help/${guide.slug}`} 
                            onClick={() => setIsOpen(false)}
                            style={{ display: 'block', textDecoration: 'none', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          >
                            <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{guide.title}</span>
                            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>{guide.summary}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blog Results */}
                  {results.blog.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#20c997', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> Blog Articles
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {results.blog.map(post => (
                          <Link 
                            key={post.slug} 
                            to={`/blog/${post.slug}`} 
                            onClick={() => setIsOpen(false)}
                            style={{ display: 'block', textDecoration: 'none', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          >
                            <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{post.title}</span>
                            <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>{post.summary}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

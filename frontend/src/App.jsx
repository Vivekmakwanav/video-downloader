import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DownloadCloud, Info, Sun, Moon, Menu, X, ChevronDown, Puzzle } from 'lucide-react';
import React, { useContext, useState, useEffect } from 'react';
import About from './pages/About';
import Footer from './components/Footer';
import SearchBox from './components/SearchBox';
import ToolLayout from './tools/ToolLayout';
import BlogIndex from './pages/BlogIndex';
import BlogLayout from './blog/BlogLayout';
import HelpIndex from './pages/HelpIndex';
import HelpLayout from './help/HelpLayout';
import LegalLayout from './legal/LegalLayout';
import Contact from './pages/Contact';
import ApiDoc from './pages/ApiDoc';
import FAQPage from './pages/FAQPage';
import { useAuth } from './contexts/AuthContext';
import { ThemeContext } from './contexts/ThemeContext';
import { toolsData } from './data/tools';
import { legalData } from './data/legal';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  
  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setIsToolsOpen(false);
  };

  return (
    <nav className="glass-panel navbar" style={{ zIndex: 1000 }}>
      <div className="nav-logo-section">
        <Link to="/" onClick={handleLinkClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DownloadCloud color="white" size={24} />
          </div>
          <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>VIDNEXA</span>
        </Link>
      </div>
      
      {/* Mobile Menu & Theme Toggle */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} className="mobile-only-controls">
        <SearchBox />
        <button 
          onClick={toggleTheme} 
          className="glass-panel" 
          style={{ border: 'none', padding: '10px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'background 0.2s', background: 'var(--glass-bg)' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button 
          className="menu-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop / Collapsible Links Wrapper */}
      <div className={`nav-menu-wrapper ${isMenuOpen ? 'open' : ''}`}>
        <div className="nav-links" style={{ alignItems: 'center' }}>
          
          {/* Tools Dropdown Menu */}
          <div 
            style={{ position: 'relative' }} 
            onMouseLeave={() => setIsToolsOpen(false)}
            className="nav-item-dropdown"
          >
            <button 
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500', fontSize: '1rem', fontFamily: "'Outfit', sans-serif", padding: '8px 0' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={e => { if(!isToolsOpen) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Tools <ChevronDown size={14} />
            </button>
            {isToolsOpen && (
              <div 
                className="glass-panel" 
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: '0', 
                  minWidth: '220px', 
                  padding: '8px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px', 
                  zIndex: 100,
                  marginTop: '8px',
                  background: 'var(--glass-bg)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
              >
                {toolsData.filter(t => t.id !== 'universal').map(t => (
                  <Link 
                    key={t.id} 
                    to={t.path} 
                    onClick={() => { setIsToolsOpen(false); handleLinkClick(); }}
                    style={{ 
                      color: 'var(--text-secondary)', 
                      textDecoration: 'none', 
                      padding: '8px 12px', 
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      display: 'block'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {t.shortName} Downloader
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/blog" onClick={handleLinkClick} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
            Blog
          </Link>
          <Link to="/help" onClick={handleLinkClick} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
            Help Center
          </Link>
          <Link to="/about" onClick={handleLinkClick} style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
            About
          </Link>
          <a href="/vidnexa-extension.zip" download style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <Puzzle size={16} /> Extension
          </a>
        </div>
        
        <div className="nav-actions">
          {/* Desktop-only Search & Theme Toggle */}
          <div className="desktop-only" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <SearchBox />
            <button 
              onClick={toggleTheme} 
              className="glass-panel" 
              style={{ border: 'none', padding: '10px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '50%', alignItems: 'center', transition: 'background 0.2s', display: 'flex' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isEmbed = params.get('embed') === 'true';

  return (
    <>
      {!isEmbed && <Navbar />}
      <main style={{ padding: isEmbed ? '10px' : '40px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Universal & Platform Specific Downloader routes */}
          <Route path="/" element={<ToolLayout tool={toolsData.find(t => t.id === 'universal')} />} />
          {toolsData.filter(t => t.id !== 'universal').map(t => (
            <Route key={t.id} path={t.path} element={<ToolLayout tool={t} />} />
          ))}

          {/* Blog feed & article routes */}
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogLayout />} />

          {/* Help Center feed & article routes */}
          <Route path="/help" element={<HelpIndex />} />
          <Route path="/help/:slug" element={<HelpLayout />} />

          {/* Support index pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/api-documentation" element={<ApiDoc />} />
          <Route path="/faq" element={<FAQPage />} />

          {/* Legal policy routes */}
          {legalData.map(l => (
            <Route key={l.slug} path={`/${l.slug}`} element={<LegalLayout />} />
          ))}
        </Routes>
      </main>
      {!isEmbed && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { DownloadCloud, LayoutDashboard, User as UserIcon, LogOut, Info, Sun, Moon, Menu, X } from 'lucide-react';
import React, { useContext, useState } from 'react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import About from './pages/About';
import Footer from './components/Footer';
import { useAuth } from './contexts/AuthContext';
import { ThemeContext } from './contexts/ThemeContext';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="glass-panel navbar">
      <div className="nav-logo-section">
        <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DownloadCloud color="white" size={24} />
        </div>
        <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>NEXUS</span>
      </div>
      
      {/* Mobile Menu & Theme Toggle */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="mobile-only-controls">
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
        <div className="nav-links">
          <Link to="/" onClick={handleLinkClick} style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <DownloadCloud size={18} /> Download
          </Link>
          <Link to="/about" onClick={handleLinkClick} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
            <Info size={18} /> About
          </Link>
          {user && (
            <Link to="/dashboard" onClick={handleLinkClick} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
          )}
        </div>
        
        <div className="nav-actions">
          {/* Desktop-only theme toggle */}
          <button 
            onClick={toggleTheme} 
            className="glass-panel desktop-only" 
            style={{ border: 'none', padding: '10px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '50%', alignItems: 'center', transition: 'background 0.2s', display: 'flex' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }} className="nav-user-container">
              <span className="nav-user-email" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{user.email}</span>
              <button onClick={() => { logout(); handleLinkClick(); }} className="glass-panel" style={{ border: 'none', padding: '10px', color: '#ff6b6b', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'var(--glass-bg)'} title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={handleLinkClick} className="neon-button" style={{ padding: '8px 16px', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <UserIcon size={16} /> Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;

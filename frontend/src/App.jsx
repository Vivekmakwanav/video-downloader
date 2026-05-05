import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { DownloadCloud, LayoutDashboard, Settings, User as UserIcon, LogOut, Info, Sun, Moon } from 'lucide-react';
import React, { useContext } from 'react';
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
  
  return (
    <nav className="glass-panel" style={{ margin: '20px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', padding: '8px', borderRadius: '12px' }}>
          <DownloadCloud color="white" size={24} />
        </div>
        <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>NEXUS</span>
      </div>
      
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <DownloadCloud size={18} /> Download
        </Link>
        <Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
          <Info size={18} /> About
        </Link>
        {user && (
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button 
          onClick={toggleTheme} 
          className="glass-panel" 
          style={{ border: 'none', padding: '10px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{user.email}</span>
            <button onClick={logout} className="glass-panel" style={{ border: 'none', padding: '10px', color: '#ff6b6b', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'var(--glass-bg)'} title="Sign Out">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link to="/login" className="neon-button" style={{ padding: '8px 16px', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserIcon size={16} /> Sign In
          </Link>
        )}
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

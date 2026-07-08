import React, { useState } from 'react';
import { DownloadCloud, Mail, Heart, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <footer style={{ 
      marginTop: 'auto',
      padding: '60px 20px 30px', 
      borderTop: '1px solid var(--glass-border)',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '40px',
      width: '100%'
    }}>
      <div className="footer-grid">
        {/* Brand Column */}
        <div className="footer-col-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', padding: '8px', borderRadius: '12px', display: 'flex' }}>
              <DownloadCloud color="white" size={20} />
            </div>
            <span className="text-gradient" style={{ fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.5px' }}>VIDNEXA</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: '8px 0' }}>
            A premium, ad-free universal media downloader utility designed to archive digital media securely and efficiently.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'} aria-label="GitHub">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'} aria-label="Twitter">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>
            <a href="mailto:support@vidnexa.space" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'} aria-label="Email">
              <Mail size={20} />
            </a>
          </div>
        </div>

        {/* Tools Column */}
        <div className="footer-col">
          <h4>Tools</h4>
          <ul className="footer-links">
            <li><Link to="/youtube-video-downloader">YouTube Downloader</Link></li>
            <li><Link to="/instagram-reel-downloader">Instagram Downloader</Link></li>
            <li><Link to="/facebook-video-downloader">Facebook Downloader</Link></li>
            <li><Link to="/twitter-video-downloader">Twitter/X Downloader</Link></li>
            <li><Link to="/tiktok-video-downloader">TikTok Downloader</Link></li>
            <li><Link to="/reddit-video-downloader">Reddit Downloader</Link></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div className="footer-col">
          <h4>Resources</h4>
          <ul className="footer-links">
            <li><Link to="/blog">Blog Index</Link></li>
            <li><Link to="/help">Help Center</Link></li>
            <li><Link to="/api-documentation">Developer API</Link></li>
            <li><Link to="/faq">Universal FAQs</Link></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="footer-col">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Support</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service">Terms of Service</Link></li>
            <li><Link to="/dmca-policy">DMCA Policy</Link></li>
            <li><Link to="/cookie-policy">Cookie Policy</Link></li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="footer-col footer-newsletter">
          <h4>Stay Updated</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
            Subscribe to our newsletter for new updates, platform integrations, and feature announcements.
          </p>
          
          {subscribed ? (
            <div style={{ color: '#20c997', fontSize: '0.9rem', fontWeight: '600', padding: '8px 0' }}>
              ✓ Thank you for subscribing!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="footer-newsletter-form">
              <input 
                type="email" 
                placeholder="Enter email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="neon-button">Join</button>
            </form>
          )}
        </div>
      </div>

      <div style={{ 
        width: '100%', 
        maxWidth: '1100px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
        paddingTop: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '16px' 
      }} className="footer-bottom">
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          &copy; {new Date().getFullYear()} Vidnexa Downloader. All rights reserved.
        </div>
        
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Made with <Heart size={14} color="var(--accent-purple)" fill="var(--accent-purple)" style={{ display: 'inline' }} /> by Vidnexa SRE Team
        </div>
      </div>
    </footer>
  );
}

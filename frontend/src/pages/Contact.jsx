import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Contact Support', url: '/contact' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
      {/* SEO Integration */}
      <SEO 
        title="Contact Us | Vidnexa Downloader Support" 
        description="Have questions or feedback? Contact the Vidnexa development and support team directly."
        breadcrumbs={breadcrumbs}
      />

      {/* Nav back link */}
      <div>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ArrowLeft size={16} /> Back to Downloader
        </Link>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', fontWeight: '800' }}>
          Contact <span className="text-gradient">Support</span>
        </h1>
        <p className="hero-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '8px' }}>
          Got an issue, suggestion, or feedback? Send us a message and our team will review it.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-panel" style={{ padding: '32px 24px' }}>
        {isSuccess ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
            <div style={{ color: '#20c997' }}><CheckCircle size={48} /></div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Message Sent Successfully!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '350px', lineHeight: '1.5' }}>
              Thank you for contacting us. Our SRE support desk will review your inquiry and get back to you shortly.
            </p>
            <button 
              onClick={() => setIsSuccess(false)}
              className="neon-button"
              style={{ marginTop: '12px', padding: '8px 24px', fontSize: '0.9rem' }}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Your Name</label>
              <input 
                type="text"
                required
                className="neon-input"
                style={{ fontSize: '0.95rem', padding: '10px 16px', height: '42px' }}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
              <input 
                type="email"
                required
                className="neon-input"
                style={{ fontSize: '0.95rem', padding: '10px 16px', height: '42px' }}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Subject</label>
              <input 
                type="text"
                required
                className="neon-input"
                style={{ fontSize: '0.95rem', padding: '10px 16px', height: '42px' }}
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Message Details</label>
              <textarea 
                required
                rows={5}
                className="neon-input"
                style={{ fontSize: '0.95rem', padding: '12px 16px', resize: 'none' }}
                placeholder="Describe your issue or suggestions in detail..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <button 
              type="submit" 
              className="neon-button" 
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', height: '44px', width: '100%', fontSize: '1rem', marginTop: '10px' }}
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send size={16} /> Send Ticket
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Info Blocks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Mail size={24} color="var(--accent-blue)" />
          <div>
            <span style={{ display: 'block', fontWeight: '700', fontSize: '0.95rem' }}>Direct Support Email</span>
            <a href="mailto:support@vidnexa.app" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>support@vidnexa.app</a>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <MessageSquare size={24} color="var(--accent-purple)" />
          <div>
            <span style={{ display: 'block', fontWeight: '700', fontSize: '0.95rem' }}>Open-Source Code</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }}>GitHub Issues Tracker</a>
          </div>
        </div>
      </div>
    </div>
  );
}

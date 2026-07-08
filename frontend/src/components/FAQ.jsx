import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ({ faqList }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqList || faqList.length === 0) return null;

  return (
    <div className="faq-section animate-slide-up" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 className="faq-title" style={{ fontSize: '2rem', fontWeight: '800' }}>
          Frequently Asked <span className="text-gradient">Questions</span>
        </h2>
        <p className="faq-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '8px' }}>
          Got questions? We've got answers.
        </p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqList.map((faq, i) => (
          <div key={i} className="glass-panel faq-item" style={{ overflow: 'hidden' }}>
            <button 
              className="faq-question" 
              onClick={() => toggleFaq(i)}
              aria-expanded={openIndex === i}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                padding: '20px',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '1.05rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>{faq.q}</span>
              {openIndex === i ? (
                <ChevronUp size={18} color="var(--accent-blue)" />
              ) : (
                <ChevronDown size={18} color="var(--text-secondary)" />
              )}
            </button>
            <div 
              className={`faq-answer ${openIndex === i ? 'open' : ''}`}
              style={{
                maxHeight: openIndex === i ? '500px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-out',
                background: 'rgba(255,255,255,0.01)'
              }}
            >
              <p style={{ padding: '0 20px 20px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

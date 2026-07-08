import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toolsData } from '../data/tools';
import FAQ from '../components/FAQ';
import SEO from '../components/SEO';
import CTA from '../components/CTA';

export default function FAQPage() {
  // Compile FAQs from all tools uniquely
  const allFaqs = toolsData.flatMap(t => t.faqs);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'FAQs', url: '/faq' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
      <SEO 
        title="Frequently Asked Questions (FAQs) | Vidnexa Downloader" 
        description="Find answers to common questions about resolutions, video trimming, platform limits, and technical troubleshooting on Vidnexa."
        breadcrumbs={breadcrumbs}
      />

      {/* Nav back link */}
      <div>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ArrowLeft size={16} /> Back to Downloader
        </Link>
      </div>

      <FAQ faqList={allFaqs} />
      <CTA />
    </div>
  );
}

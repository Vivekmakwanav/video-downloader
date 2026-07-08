import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, BookOpen } from 'lucide-react';
import { blogData } from '../data/blog';
import SEO from '../components/SEO';
import CTA from '../components/CTA';

export default function BlogLayout() {
  const { slug } = useParams();
  const article = blogData.find(b => b.slug === slug);

  if (!article) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>Article Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>The blog post you are looking for does not exist.</p>
        <Link to="/blog" className="neon-button" style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Blog
        </Link>
      </div>
    );
  }

  // Get 3 other related posts
  const relatedPosts = blogData.filter(b => b.slug !== slug).slice(0, 3);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: article.title, url: `/blog/${article.slug}` }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
      {/* SEO metadata */}
      <SEO 
        title={`${article.title} | Vidnexa Blog`} 
        description={article.summary}
        isBlog={true}
        blogMeta={{ datePublished: '2026-07-07' }}
        breadcrumbs={breadcrumbs}
      />

      {/* Navigation & Breadcrumbs */}
      <div>
        <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ArrowLeft size={16} /> Back to Blog Feed
        </Link>
      </div>

      {/* Article Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span style={{ alignSelf: 'flex-start', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
          {article.category}
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2' }}>{article.title}</h1>
        
        {/* Article Meta row */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={15} /> <span>{article.author}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={15} /> <span>{article.date}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={15} /> <span>{article.readTime}</span></div>
        </div>
      </div>

      {/* Dynamic Semantic Body rendering */}
      <article style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
        {article.content.map((sec, idx) => {
          if (sec.type === 'h2') {
            return <h2 key={idx} style={{ fontSize: '1.7rem', fontWeight: '700', marginTop: '24px', marginBottom: '8px' }}>{sec.text}</h2>;
          }
          if (sec.type === 'h3') {
            return <h3 key={idx} style={{ fontSize: '1.35rem', fontWeight: '700', marginTop: '16px', marginBottom: '6px' }}>{sec.text}</h3>;
          }
          if (sec.type === 'p') {
            return <p key={idx} style={{ color: 'var(--text-secondary)' }}>{sec.text}</p>;
          }
          if (sec.type === 'ol') {
            return (
              <ol key={idx} style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                {sec.items.map((li, lIdx) => (
                  <li key={lIdx}>{li}</li>
                ))}
              </ol>
            );
          }
          if (sec.type === 'ul') {
            return (
              <ul key={idx} style={{ paddingLeft: '24px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                {sec.items.map((li, lIdx) => (
                  <li key={lIdx}>{li}</li>
                ))}
              </ul>
            );
          }
          return null;
        })}
      </article>

      {/* Reusable CTA */}
      <CTA />

      {/* Related Posts */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '40px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} color="var(--accent-blue)" /> Related Articles
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {relatedPosts.map(post => (
            <Link 
              key={post.slug} 
              to={`/blog/${post.slug}`} 
              className="glass-panel" 
              style={{ padding: '20px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: '600', textTransform: 'uppercase' }}>{post.category}</span>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '700', lineHeight: '1.4' }}>{post.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>{post.date}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

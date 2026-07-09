import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, Link, Sliders, Download, Archive } from 'lucide-react';
import { useDownload } from '../hooks/useDownload';
import SEO from '../components/SEO';
import VideoPreviewCard from '../components/VideoPreviewCard';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';

export default function ToolLayout({ tool }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [completedDownloadIds, setCompletedDownloadIds] = useState([]);
  const [isZipping, setIsZipping] = useState(false);

  const { downloads, startDownload, clientId } = useDownload();

  // Reset page state on tool change
  useEffect(() => {
    setUrl('');
    setVideoData(null);
    setError('');
    setIsBatchMode(false);
    setCompletedDownloadIds([]);
  }, [tool]);

  const triggerAnalyze = async (targetUrl, isBatch = false) => {
    if (!targetUrl.trim()) return;
    
    setIsLoading(true);
    setError('');
    setVideoData(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.vidnexa.space';
      if (isBatch) {
        const urlsList = targetUrl.split('\n').map(u => u.trim()).filter(Boolean);
        if (urlsList.length === 0) {
          throw new Error('Please enter at least one URL.');
        }
        
        const response = await fetch(`${API_URL}/api/analyze/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: urlsList })
        });
        
        if (!response.ok) {
          throw new Error('Failed to analyze batch URLs.');
        }
        
        const data = await response.json();
        setVideoData(data);
      } else {
        const response = await fetch(`${API_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl })
        });
        
        if (!response.ok) {
          throw new Error('Failed to analyze video. Please check the URL.');
        }
        
        const data = await response.json();
        setVideoData(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipDownloads = async () => {
    setIsZipping(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.vidnexa.space';
      const response = await fetch(`${API_URL}/api/download/zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ download_ids: completedDownloadIds })
      });
      if (!response.ok) {
        throw new Error('Failed to bundle files into ZIP archive');
      }
      const data = await response.json();
      
      // Reset completed list
      setCompletedDownloadIds([]);
      
      // Auto-trigger browser save for the zip file
      const link = document.createElement('a');
      link.href = `${API_URL}/api/file/${data.download_id}`;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsZipping(false);
    }
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    triggerAnalyze(url, isBatchMode);
  };

  // Support direct URL analysis via query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get('url');
    if (queryUrl) {
      setUrl(queryUrl);
      triggerAnalyze(queryUrl, false);
    }
  }, []);

  const videosList = videoData ? (Array.isArray(videoData) ? videoData : [videoData]) : [];
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: tool.name, url: tool.path }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '800px', margin: '0 auto', gap: '40px' }} className="container">
      
      {/* Dynamic SEO Integration */}
      <SEO 
        title={tool.seoTitle} 
        description={tool.seoDesc} 
        faqList={tool.faqs}
        isTool={tool.id !== 'universal'}
        breadcrumbs={breadcrumbs}
      />

      {/* Hero Section */}
      <div style={{ textAlign: 'center', width: '100%' }} className="animate-slide-up">
        <h1 className="hero-title">
          {tool.heroTitle.split(' ').slice(0, -2).join(' ')} <span className="text-gradient">{tool.heroTitle.split(' ').slice(-2).join(' ')}</span>
        </h1>
        <p className="hero-subtitle">
          {tool.heroSub}
        </p>

        {/* Mode Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => { setIsBatchMode(false); setVideoData(null); setUrl(''); setError(''); }}
            style={{
              background: !isBatchMode ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (!isBatchMode ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'),
              color: !isBatchMode ? '#000' : 'var(--text-secondary)',
              padding: '8px 24px',
              borderRadius: '30px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Single Mode
          </button>
          <button
            onClick={() => { setIsBatchMode(true); setVideoData(null); setUrl(''); setError(''); }}
            style={{
              background: isBatchMode ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (isBatchMode ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'),
              color: isBatchMode ? '#000' : 'var(--text-secondary)',
              padding: '8px 24px',
              borderRadius: '30px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Batch Mode
          </button>
        </div>
        
        <form onSubmit={handleAnalyze} className="search-form" style={{ flexDirection: 'column', gap: '16px' }}>
          <div className="search-input-wrapper" style={{ width: '100%' }}>
            {isBatchMode ? (
              <textarea
                className="neon-input"
                placeholder="Paste video URLs here (one per line, up to 5)..."
                rows={4}
                style={{ width: '100%', resize: 'none', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            ) : (
              <>
                <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="neon-input" 
                  placeholder={tool.placeholder} 
                  style={{ paddingLeft: '56px', width: '100%' }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </>
            )}
          </div>
          <button type="submit" className="neon-button" disabled={isLoading || !url.trim()} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto', alignSelf: 'center', minWidth: '150px', justifyContent: 'center' }}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Analyze'}
          </button>
        </form>
        
        {error && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)', borderRadius: '12px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </div>

      {/* Batch ZIP download action banner */}
      {completedDownloadIds.length > 0 && (
        <div className="glass-panel animate-slide-up" style={{ 
          padding: '20px 24px', 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '20px', 
          border: '1px solid rgba(0, 240, 255, 0.2)',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.05)',
          background: 'rgba(0, 240, 255, 0.02)',
          borderRadius: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '12px', color: 'var(--accent-blue)' }}>
              <Archive size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '4px' }}>Batch Download Bundle</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                You have downloaded <strong>{completedDownloadIds.length}</strong> media file{completedDownloadIds.length > 1 ? 's' : ''}. Pack them together as a ZIP archive for a single click download!
              </p>
            </div>
          </div>
          <button 
            className="neon-button" 
            onClick={handleZipDownloads} 
            disabled={isZipping}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 24px', 
              fontSize: '0.95rem',
              borderRadius: '12px',
              minWidth: '180px',
              justifyContent: 'center'
            }}
          >
            {isZipping ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {isZipping ? 'Bundling ZIP...' : 'Download ZIP'}
          </button>
        </div>
      )}

      {/* Video Preview Cards */}
      {videosList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
          {videosList.map((video, idx) => (
            <VideoPreviewCard 
              key={idx} 
              video={video} 
              startDownload={startDownload} 
              downloads={downloads} 
              clientId={clientId}
              onDownloadComplete={(id) => setCompletedDownloadIds(prev => [...prev, id])}
            />
          ))}
        </div>
      )}

      {/* How It Works Section */}
      <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>
            How It <span className="text-gradient">Works</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Download and archive high-quality video or audio from {tool.shortName} in three simple steps.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: '16px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '16px', color: 'var(--accent-blue)' }}>
              <Link size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>1. Paste Video URL</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Copy the video link from {tool.shortName} and paste it into the analyzer box above.
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: '16px', background: 'rgba(138, 43, 226, 0.05)', borderRadius: '16px', color: 'var(--accent-purple)' }}>
              <Sliders size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>2. Choose Format</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Vidnexa will parse and extract high-resolution formats and audio-only streams instantly.
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: '16px', background: 'rgba(32, 201, 151, 0.05)', borderRadius: '16px', color: '#20c997' }}>
              <Download size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>3. Download File</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Click download! Our server downloads and cuts segments dynamically.
            </p>
          </div>
        </div>
      </div>

      {/* Features & Benefits List */}
      <div style={{ width: '100%', marginTop: '20px' }} className="animate-slide-up">
        <h2 style={{ fontSize: '2rem', fontWeight: '800', textAlign: 'center', marginBottom: '24px' }}>
          {tool.shortName} Downloader <span className="text-gradient">Key Features</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {tool.features.map((feat, fIdx) => (
            <div key={fIdx} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }}></div>
              <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Accordion FAQs */}
      <FAQ faqList={tool.faqs} />

      {/* Reusable CTA */}
      {tool.id !== 'universal' && (
        <CTA 
          title={`Start Downloading ${tool.shortName} Videos Now`}
          subtitle={`Paste any public ${tool.shortName} link to extract, crop, or download high-definition media completely free.`}
        />
      )}
    </div>
  );
}

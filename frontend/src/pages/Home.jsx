import React, { useState } from 'react';
import { Search, Loader2, Video, Music, HardDrive, Clock, AlertCircle, CheckCircle, Play, Link, Sliders, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useDownload } from '../hooks/useDownload';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  
  // Custom hook for managing WebSocket connection and download states
  const { downloads, startDownload } = useDownload();
  // Map format_id to download_id for the UI
  const [activeFormatDownloads, setActiveFormatDownloads] = useState({});

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setError('');
    setVideoData(null);
    setIsPlaying(false);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze video. Please check the URL.');
      }
      
      const data = await response.json();
      setVideoData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadClick = async (formatId) => {
    const downloadId = await startDownload(videoData.url, formatId);
    if (downloadId) {
      setActiveFormatDownloads(prev => ({ ...prev, [formatId]: downloadId }));
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s].filter(Boolean).join(':');
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '800px', margin: '0 auto', gap: '40px' }} className="container">
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', width: '100%' }} className="animate-slide-up">
        <h1 className="hero-title">
          Universal <span className="text-gradient">Video Downloader</span>
        </h1>
        <p className="hero-subtitle">
          Extract high-quality media from YouTube, Instagram, X, and more.
        </p>
        
        <form onSubmit={handleAnalyze} className="search-form">
          <div className="search-input-wrapper">
            <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="neon-input" 
              placeholder="Paste video URL here..." 
              style={{ paddingLeft: '56px' }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="neon-button" disabled={isLoading || !url} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Video Preview Card */}
      {videoData && (
        <div className="glass-panel animate-slide-up preview-card" style={{ width: '100%', padding: '24px', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Thumbnail / Player */}
            <div style={{ flex: '1 1 300px', borderRadius: '12px', overflow: 'hidden', position: 'relative', minHeight: '200px', background: '#111' }}>
              {isPlaying && videoData.platform.toLowerCase() === 'youtube' ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${videoData.video_id}?autoplay=1`} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                ></iframe>
              ) : (
                <>
                  <img src={videoData.thumbnail} alt={videoData.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {videoData.platform.toLowerCase() === 'youtube' && (
                    <div 
                      onClick={() => setIsPlaying(true)}
                      style={{ 
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                        background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '16px', 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                        backdropFilter: 'blur(4px)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--accent-blue)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                    >
                      <Play size={32} color="white" fill="white" />
                    </div>
                  )}

                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> {formatDuration(videoData.duration)}
                  </div>
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(138, 43, 226, 0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>
                    {videoData.platform}
                  </div>
                </>
              )}
            </div>
            
            {/* Details & Formats */}
            <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.3' }}>{videoData.title}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Available Formats</h3>
                
                <div className="format-list">
                  {videoData.formats.map((format, idx) => {
                    const downloadId = activeFormatDownloads[format.format_id];
                    const downloadState = downloadId ? downloads[downloadId] : null;
                    const isPending = downloadState && downloadState.status === 'pending';
                    const isDownloading = downloadState && downloadState.status === 'downloading';
                    const isFinished = downloadState && downloadState.status === 'finished';
                    const progress = downloadState ? downloadState.progress : 0;
                    
                    return (
                      <div key={idx} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                        <div className="format-item">
                          <div className="format-item-left">
                            {format.ext === 'mp4' || format.ext === 'webm' ? <Video size={18} color="var(--accent-blue)" /> : <Music size={18} color="var(--accent-purple)" />}
                            <div>
                              <div style={{ fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {format.resolution}
                                <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{format.ext.toUpperCase()}</span>
                              </div>
                              {format.format_note && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{format.format_note}</div>}
                            </div>
                          </div>
                          
                          <div className="format-item-right">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <HardDrive size={14} /> {formatSize(format.filesize)}
                            </span>
                            <button 
                              className="neon-button" 
                              style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px', minWidth: '110px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                              onClick={() => handleDownloadClick(format.format_id)}
                              disabled={isPending || isDownloading || isFinished}
                            >
                              {isFinished ? 'Complete' : isDownloading ? `${progress.toFixed(0)}%` : isPending ? <Loader2 className="animate-spin" size={16} /> : 'Download'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {(isDownloading || isFinished) && (
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: isFinished ? '#20c997' : 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))', transition: 'width 0.3s ease' }}></div>
                          </div>
                        )}
                        {isFinished && (
                          <div style={{ fontSize: '0.85rem', color: '#20c997', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Saved to server
                          </div>
                        )}
                        {downloadState && downloadState.error && (
                          <div style={{ fontSize: '0.85rem', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14} /> {downloadState.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div style={{ width: '100%', marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '12px' }}>
            How It <span className="text-gradient">Works</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Download and archive high-quality video or audio in three simple steps.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: '16px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '16px', color: 'var(--accent-blue)' }}>
              <Link size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>1. Paste Video URL</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Copy the video link from YouTube, Instagram, or Twitter and paste it into the analyzer box above.
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: '16px', background: 'rgba(138, 43, 226, 0.05)', borderRadius: '16px', color: 'var(--accent-purple)' }}>
              <Sliders size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>2. Choose Format</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Nexus will extract high-resolution formats and audio-only streams instantly for your selection.
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', transition: 'transform 0.3s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ padding: '16px', background: 'rgba(32, 201, 151, 0.05)', borderRadius: '16px', color: '#20c997' }}>
              <Download size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>3. Download File</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Click download! Our backend merges separate audio and video tracks on the fly using high-performance engines.
            </p>
          </div>
        </div>
      </div>

      {/* Supported Platforms Section */}
      <div style={{ width: '100%', marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-slide-up">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '12px' }}>
            Supported <span className="text-gradient">Platforms</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Archive videos from your favorite media sharing platforms.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', width: '100%' }}>
          {[
            { name: 'YouTube', color: '#ff0000', bg: 'rgba(255, 0, 0, 0.05)' },
            { name: 'Instagram', color: '#e1306c', bg: 'rgba(225, 48, 108, 0.05)' },
            { name: 'X / Twitter', color: '#ffffff', bg: 'rgba(255, 255, 255, 0.05)' },
            { name: 'TikTok', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.05)' },
            { name: 'Facebook', color: '#1877f2', bg: 'rgba(24, 119, 242, 0.05)' },
            { name: 'Vimeo', color: '#1ab7ea', bg: 'rgba(26, 183, 234, 0.05)' },
            { name: 'Twitch', color: '#9146ff', bg: 'rgba(145, 70, 255, 0.05)' },
            { name: 'SoundCloud', color: '#ff5500', bg: 'rgba(255, 85, 0, 0.05)' }
          ].map((platform, i) => (
            <div 
              key={i} 
              className="glass-panel" 
              style={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                cursor: 'pointer', 
                transition: 'all 0.3s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = platform.bg;
                e.currentTarget.style.borderColor = platform.color + '44';
                e.currentTarget.style.boxShadow = `0 0 15px ${platform.color}11`;
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'var(--glass-bg)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{platform.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="faq-section animate-slide-up">
        <div style={{ textAlign: 'center' }}>
          <h2 className="faq-title">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="faq-subtitle">
            Got questions? We've got answers.
          </p>
        </div>
        
        {[
          {
            q: "Which platforms are supported?",
            a: "Nexus supports downloads from YouTube, Instagram, X (Twitter), Facebook, TikTok, Vimeo, Twitch, SoundCloud, and many other media sharing websites."
          },
          {
            q: "Can I download 1080p and 4K videos with audio?",
            a: "Yes! For formats where YouTube separates high-resolution video and audio streams, our Python backend merges them on the fly using high-performance merger libraries before delivery."
          },
          {
            q: "Is Nexus completely free to use?",
            a: "Absolutely. Nexus is 100% free and free from disruptive advertisements. It was created to provide a clean, modern interface for archiving personal digital media."
          },
          {
            q: "Where are the downloaded files saved?",
            a: "Downloads are stored securely in the configured downloads directory on the server hosting the app. Registered users can view and track their historical downloads directly inside the Dashboard."
          }
        ].map((faq, i) => (
          <div key={i} className="glass-panel faq-item">
            <button className="faq-question" onClick={() => toggleFaq(i)}>
              <span>{faq.q}</span>
              {openFaq === i ? <ChevronUp size={18} color="var(--accent-blue)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
            </button>
            <div className={`faq-answer ${openFaq === i ? 'open' : ''}`}>
              <p>{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}

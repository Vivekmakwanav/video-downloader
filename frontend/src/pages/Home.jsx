import React, { useState } from 'react';
import { Search, Loader2, Video, Music, HardDrive, Clock, AlertCircle, CheckCircle, Play, Link, Sliders, Download, ChevronDown, ChevronUp, Scissors } from 'lucide-react';
import { useDownload } from '../hooks/useDownload';

// Isolated Local Video Preview Card Component
function VideoPreviewCard({ video, startDownload, downloads }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeFormatDownloads, setActiveFormatDownloads] = useState({});
  const [trimStates, setTrimStates] = useState({});
  const [selectedSubtitle, setSelectedSubtitle] = useState('');
  const [isDownloadingSub, setIsDownloadingSub] = useState(false);

  const formatDurationText = (seconds) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(h.toString().padStart(2, '0'));
    parts.push(m.toString().padStart(2, '0'));
    parts.push(s.toString().padStart(2, '0'));
    return parts.join(':');
  };

  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }
    return null;
  };

  const toggleTrim = (formatId) => {
    setTrimStates(prev => {
      const current = prev[formatId] || { active: false, start: '00:00', end: formatDurationText(video.duration || 0) };
      return {
        ...prev,
        [formatId]: {
          ...current,
          active: !current.active
        }
      };
    });
  };

  const handleDownloadClick = async (formatId) => {
    let startSec = null;
    let endSec = null;
    
    if (trimStates[formatId]?.active) {
      startSec = parseTimeToSeconds(trimStates[formatId].start || '');
      endSec = parseTimeToSeconds(trimStates[formatId].end || '');
      
      if (startSec === null || endSec === null || startSec < 0 || endSec < 0 || startSec >= endSec || endSec > video.duration) {
        alert('Please fix the start/end time format or boundaries.');
        return;
      }
    }

    const downloadId = await startDownload(video.url, formatId, startSec, endSec);
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

  const handleSubtitleDownload = async () => {
    if (!selectedSubtitle) return;
    const selected = video.subtitles.find(s => s.lang === selectedSubtitle);
    if (!selected) return;

    setIsDownloadingSub(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/subtitles/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: video.url,
          lang: selected.lang,
          is_auto: selected.is_auto
        })
      });

      if (!response.ok) {
        throw new Error('Failed to download subtitles');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subtitles_${selected.lang}.srt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDownloadingSub(false);
    }
  };

  if (video.title && video.title.startsWith("Error:")) {
    return (
      <div className="glass-panel" style={{ padding: '24px', width: '100%', border: '1px solid rgba(255, 50, 50, 0.2)', color: '#ff6b6b', borderRadius: '12px' }}>
        <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} /> Analysis Failed
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: '8px' }}>
          URL: <a href={video.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>{video.url}</a>
        </div>
        <div style={{ fontSize: '0.85rem' }}>{video.title}</div>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-slide-up preview-card" style={{ width: '100%', padding: '24px' }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Thumbnail / Player */}
        <div style={{ flex: '1 1 300px', borderRadius: '12px', overflow: 'hidden', position: 'relative', minHeight: '200px', background: '#111' }}>
          {isPlaying && video.platform.toLowerCase() === 'youtube' ? (
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1`} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            ></iframe>
          ) : (
            <>
              <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {video.platform.toLowerCase() === 'youtube' && (
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
                <Clock size={14} /> {formatDuration(video.duration)}
              </div>
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(138, 43, 226, 0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>
                {video.platform}
              </div>
            </>
          )}
        </div>
        
        {/* Details & Formats */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.3' }}>{video.title}</h2>

          {/* Subtitles Downloader UI */}
          {video.subtitles && video.subtitles.length > 0 && (
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Download Subtitles</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="neon-input"
                  style={{ flex: 1, padding: '4px 12px', fontSize: '0.9rem', height: '36px', background: '#1a1a24' }}
                  value={selectedSubtitle}
                  onChange={(e) => setSelectedSubtitle(e.target.value)}
                >
                  <option value="">Select language...</option>
                  {video.subtitles.map((sub, sIdx) => (
                    <option key={sIdx} value={sub.lang}>
                      {sub.name} {sub.is_auto ? '(Auto)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="neon-button"
                  style={{ height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleSubtitleDownload}
                  disabled={!selectedSubtitle || isDownloadingSub}
                >
                  {isDownloadingSub ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  Download
                </button>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Available Formats</h3>
            
            <div className="format-list">
              {video.formats.map((format, idx) => {
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
                      
                      <div className="format-item-right" style={{ gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => toggleTrim(format.format_id)}
                          style={{
                            background: trimStates[format.format_id]?.active ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                            color: trimStates[format.format_id]?.active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          disabled={isPending || isDownloading || isFinished}
                        >
                          <Scissors size={14} />
                          {trimStates[format.format_id]?.active ? 'Cancel' : 'Trim'}
                        </button>
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

                    {/* Collapsible Trim Settings Panel */}
                    {trimStates[format.format_id]?.active && (
                      <div style={{
                        marginTop: '4px',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Start Time (MM:SS)</label>
                            <input
                              type="text"
                              className="neon-input"
                              style={{ padding: '6px 12px', fontSize: '0.9rem', width: '100%', height: '36px' }}
                              value={trimStates[format.format_id]?.start || '00:00'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTrimStates(prev => ({
                                  ...prev,
                                  [format.format_id]: { ...prev[format.format_id], start: val }
                                }));
                              }}
                            />
                          </div>
                          <div style={{ flex: '1 1 120px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>End Time (MM:SS)</label>
                            <input
                              type="text"
                              className="neon-input"
                              style={{ padding: '6px 12px', fontSize: '0.9rem', width: '100%', height: '36px' }}
                              value={trimStates[format.format_id]?.end || '00:00'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTrimStates(prev => ({
                                  ...prev,
                                  [format.format_id]: { ...prev[format.format_id], end: val }
                                }));
                              }}
                            />
                          </div>
                        </div>
                        {/* Validation warning */}
                        {(() => {
                          const startSec = parseTimeToSeconds(trimStates[format.format_id]?.start || '');
                          const endSec = parseTimeToSeconds(trimStates[format.format_id]?.end || '');
                          let warningMsg = '';
                          if (startSec === null || endSec === null) {
                            warningMsg = 'Please enter time in MM:SS or HH:MM:SS format';
                          } else if (startSec < 0 || endSec < 0) {
                            warningMsg = 'Time values cannot be negative';
                          } else if (startSec >= endSec) {
                            warningMsg = 'Start time must be less than end time';
                          } else if (endSec > video.duration) {
                            warningMsg = `End time exceeds video duration (${formatDurationText(video.duration)})`;
                          }
                          if (warningMsg) {
                            return (
                              <div style={{ fontSize: '0.8rem', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={12} /> {warningMsg}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                    
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
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  
  // Custom hook for managing WebSocket connection and download states
  const { downloads, startDownload } = useDownload();

  const triggerAnalyze = async (targetUrl, isBatch = false) => {
    if (!targetUrl.trim()) return;
    
    setIsLoading(true);
    setError('');
    setVideoData(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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

  const handleAnalyze = (e) => {
    e.preventDefault();
    triggerAnalyze(url, isBatchMode);
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get('url');
    if (queryUrl) {
      setUrl(queryUrl);
      triggerAnalyze(queryUrl, false);
    }
  }, []);

  const videosList = videoData ? (Array.isArray(videoData) ? videoData : [videoData]) : [];

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
                  placeholder="Paste video URL here..." 
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

        {/* Chrome Extension Download Banner */}
        <div className="glass-panel animate-slide-up" style={{ 
          marginTop: '24px', 
          padding: '16px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '16px', 
          background: 'rgba(0, 240, 255, 0.02)', 
          border: '1px solid rgba(0, 240, 255, 0.1)',
          borderRadius: '12px',
          width: '100%',
          flexWrap: 'wrap',
          textAlign: 'left'
        }}>
          <div style={{ flex: '1 1 350px' }}>
            <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors size={16} color="var(--accent-blue)" /> Download Chrome Extension Helper
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Add a quick "Download with Vidnexa" button directly below YouTube videos!
            </p>
          </div>
          <a href="/vidnexa-extension.zip" download className="neon-button" style={{ 
            fontSize: '0.85rem', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px',
            textDecoration: 'none',
            color: '#000',
            fontWeight: '600'
          }}>
            <Download size={14} /> Get Extension
          </a>
        </div>
      </div>

      {/* Video Preview Cards */}
      {videosList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
          {videosList.map((video, idx) => (
            <VideoPreviewCard 
              key={idx} 
              video={video} 
              startDownload={startDownload} 
              downloads={downloads} 
            />
          ))}
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
              Vidnexa will extract high-resolution formats and audio-only streams instantly for your selection.
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
            a: "Vidnexa supports downloads from YouTube, Instagram, X (Twitter), Facebook, TikTok, Vimeo, Twitch, SoundCloud, and many other media sharing websites."
          },
          {
            q: "Can I download 1080p and 4K videos with audio?",
            a: "Yes! For formats where YouTube separates high-resolution video and audio streams, our Python backend merges them on the fly using high-performance merger libraries before delivery."
          },
          {
            q: "Is Vidnexa completely free to use?",
            a: "Absolutely. Vidnexa is 100% free and free from disruptive advertisements. It was created to provide a clean, modern interface for archiving personal digital media."
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

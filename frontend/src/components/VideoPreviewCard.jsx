import React, { useState } from 'react';
import { Video, Music, HardDrive, Clock, AlertCircle, CheckCircle, Play, Scissors, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function VideoPreviewCard({ video, startDownload, downloads }) {
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

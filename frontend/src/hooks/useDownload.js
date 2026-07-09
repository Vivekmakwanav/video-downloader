import { useState, useEffect, useRef } from 'react';

export function useDownload() {
  const [downloads, setDownloads] = useState({});
  const ws = useRef(null);
  const clientId = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    // Connect to WebSocket
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    ws.current = new WebSocket(`${WS_URL}/${clientId.current}`);
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.download_id) {
        setDownloads((prev) => ({
          ...prev,
          [data.download_id]: {
            status: data.status,
            progress: data.progress,
            speed: data.speed,
            error: data.error
          }
        }));

        if (data.status === 'finished') {
          // Trigger browser download
          const link = document.createElement('a');
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          link.href = `${API_URL}/api/file/${data.download_id}`;
          link.setAttribute('download', '');
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
        }
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const startDownload = async (url, formatId, startTime = null, endTime = null) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          url, 
          format_id: formatId,
          client_id: clientId.current,
          start_time: startTime,
          end_time: endTime
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start download');
      }
      
      const data = await response.json();
      
      // Initialize download state
      setDownloads((prev) => ({
        ...prev,
        [data.download_id]: {
          status: 'pending',
          progress: 0
        }
      }));
      
      return data.download_id;
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return { downloads, startDownload, clientId: clientId.current };
}

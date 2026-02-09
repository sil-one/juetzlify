import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/constants';

const LyricsModal = ({ track, onClose, getAuthHeaders }) => {
  const [lyrics, setLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLyrics();
  }, [track.filename]);

  const fetchLyrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/tracks/${encodeURIComponent(track.filename)}/lyrics`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        setLyrics(data.lyrics || '');
      }
    } catch (err) {
      console.error('Error fetching lyrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/tracks/${encodeURIComponent(track.filename)}/lyrics`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ lyrics }),
        }
      );
      const data = await response.json();
      if (data.success) {
        onClose(true); // true = saved
      } else {
        alert(`Failed to save lyrics: ${data.error}`);
      }
    } catch (err) {
      console.error('Error saving lyrics:', err);
      alert('Failed to save lyrics');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-sp-dark rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sp-gray">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-sp-text truncate">Lyrics</h2>
            <p className="text-sm text-sp-text-secondary truncate">
              {track.title || track.filename}
            </p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-sp-text-muted hover:text-sp-text rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sp-text-secondary">Loading...</span>
            </div>
          ) : (
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paste lyrics here..."
              className="w-full h-full min-h-[300px] bg-sp-black text-sp-text rounded-lg p-4 border border-sp-gray focus:border-sp-green focus:outline-none resize-none font-mono text-sm leading-relaxed"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-sp-gray">
          <button
            onClick={() => onClose(false)}
            className="px-5 py-2 bg-sp-gray hover:bg-sp-light-gray text-sp-text rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-5 py-2 bg-sp-green hover:bg-[#27ae60] text-sp-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LyricsModal;

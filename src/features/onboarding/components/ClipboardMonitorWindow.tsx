/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useEffect, useState } from 'react';
import { Clipboard, X } from 'lucide-react';

export function ClipboardMonitorWindow() {
  const [clipboardContent, setClipboardContent] = useState('');

  useEffect(() => {
    // 1. Clipboard Listener
    if (window.electronAPI?.onClipboardUpdate) {
      const cleanup = window.electronAPI.onClipboardUpdate((text) => {
        setClipboardContent(text);
      });
      return cleanup;
    }
  }, []);

  const handleClose = () => {
    if (window.electronAPI?.setClipboardMonitorState) {
        window.electronAPI.setClipboardMonitorState(false);
    }
  };

  return (
    <>
      <style>{`
        html, body, #root {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent !important;
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
      
      <div style={{
        position: 'absolute', // [CHANGE] Force full fill
        top: '1px',           // [CHANGE] Small safety margin
        left: '1px',
        right: '1px',
        bottom: '1px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#18181b', 
        border: '2px solid #22c55e', 
        borderRadius: '12px',
        color: '#f4f4f5',
        fontFamily: 'sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: 9999
      }}>
        {/* Header - DRAGGABLE */}
        <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '8px 12px', borderBottom: '1px solid #27272a',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            WebkitAppRegion: 'drag' as any, 
            cursor: 'grab',
            flexShrink: 0,
            userSelect: 'none'
        }}>
            <Clipboard size={14} color="#22c55e" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Clipboard Monitor
            </span>

            {/* Close Button - NO DRAG */}
            <button
                onClick={handleClose}
                style={{
                    marginLeft: 'auto',
                    background: 'transparent',
                    border: 'none',
                    color: '#22c55e',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    WebkitAppRegion: 'no-drag' as any 
                }}
            >
                <X size={14} />
            </button>
        </div>

        {/* Content - SCROLLABLE */}
        <div style={{ 
            flex: 1,                 // Fill remaining vertical space
            minHeight: 0,            // Crucial for nested flex scrolling
            padding: '8px 12px', 
            paddingBottom: '12px',
            fontSize: '12px', 
            lineHeight: '1.4', 
            color: '#d4d4d8',
            overflowY: 'auto', 
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            WebkitAppRegion: 'no-drag' as any 
        }}>
            {clipboardContent || <span style={{ color: '#52525b', fontStyle: 'italic' }}>Clipboard is empty...</span>}
        </div>
        
      </div>
    </>
  );
}
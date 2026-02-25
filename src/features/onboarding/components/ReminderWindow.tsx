/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useMemo } from 'react';
import { Keyboard } from 'lucide-react';

export function ReminderWindow() {
  // Parse hotkey from URL query params
  const params = new URLSearchParams(window.location.search);
  const rawHotkey = params.get('hotkey') || 'ALT+P';

  const displayHotkey = useMemo(() => {
    let display = rawHotkey;
    
    // AltGr formatting logic matching FirstRunPopup
    const hasCtrl = /CommandOrControl|Control|Ctrl/i.test(display);
    const hasAlt = /Alt/i.test(display);

    if (hasCtrl && hasAlt) {
        display = display
            .replace(/CommandOrControl/gi, '')
            .replace(/Control/gi, '')
            .replace(/Ctrl/gi, '')
            .replace(/Alt/gi, 'AltGr');
    }

    return display
      .replace(/CommandOrControl/gi, 'Ctrl')
      .replace(/Control/gi, 'Ctrl')
      .replace(/Command/gi, 'Cmd')
      .replace(/Super/gi, 'Win')
      .replace(/\+\+/g, '+')
      .replace(/^\+/, '')
      .replace(/\+$/, '')
      .replace(/\+/g, ' + ')
      .toUpperCase();
  }, [rawHotkey]);

  return (
    <>
      <style>{`
        @keyframes purplePulse {
          0% { border-color: rgba(168, 85, 247, 0.4); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
          50% { border-color: rgba(168, 85, 247, 1); box-shadow: 0 0 15px 2px rgba(168, 85, 247, 0.3); }
          100% { border-color: rgba(168, 85, 247, 0.4); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
        }
        body { 
          background: transparent !important; 
          overflow: hidden; 
          margin: 0; 
          padding: 10px; /* Padding for shadow/glow */
        }
      `}</style>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#18181b', // Zinc 900
        border: '2px solid #a855f7',
        borderRadius: '12px',
        padding: '12px 16px',
        color: '#f4f4f5',
        fontFamily: 'sans-serif',
        animation: 'purplePulse 2s infinite ease-in-out',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%'
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          backgroundColor: 'rgba(234, 179, 8, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#eab308', flexShrink: 0
        }}>
          <Keyboard size={18} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            READY TO SUMMON GOGOPROMPT
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.2 }}>
            Click inside your AI chatbot text window and press <span style={{ color: '#eab308', whiteSpace: 'nowrap' }}>{displayHotkey}</span>
          </span>
        </div>
      </div>
    </>
  );
}
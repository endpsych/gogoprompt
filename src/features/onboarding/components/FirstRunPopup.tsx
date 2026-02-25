/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface FirstRunPopupProps {
  hotkey: string;
  onDismiss: () => void;
}

export function FirstRunPopup({ hotkey, onDismiss }: FirstRunPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Trigger Entrance Animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // 2. ACTIVATE REMINDER MODE
    // This tells the main process to show the floating reminder box 
    // if the user switches focus to another app (like ChatGPT).
    if (window.electronAPI?.setReminderState) {
        window.electronAPI.setReminderState(true, hotkey);
    }

    return () => {
        clearTimeout(timer);
        // 3. CLEANUP
        // Disable reminder mode when this popup is dismissed or unmounted.
        if (window.electronAPI?.setReminderState) {
            window.electronAPI.setReminderState(false, '');
        }
    };
  }, [hotkey]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const formatHotkey = (keyString: string) => {
    let display = keyString;

    // Detect AltGr combo (Electron usually maps this to Ctrl+Alt)
    const hasCtrl = /CommandOrControl|Control|Ctrl/i.test(display);
    const hasAlt = /Alt/i.test(display);

    if (hasCtrl && hasAlt) {
        display = display
            .replace(/CommandOrControl/gi, '')
            .replace(/Control/gi, '')
            .replace(/Ctrl/gi, '')
            .replace(/Alt/gi, 'AltGr');
    }

    // Clean up standard modifiers
    display = display
      .replace(/CommandOrControl/gi, 'Ctrl')
      .replace(/Control/gi, 'Ctrl')
      .replace(/Command/gi, 'Cmd')
      .replace(/Super/gi, 'Win')
      .replace(/\+\+/g, '+')
      .replace(/^\+/, '')
      .replace(/\+$/, '')
      .replace(/\+/g, ' + ');

    // Casing Logic: "AltGr" mixed case, others Uppercase
    return display.split(' + ').map(part => {
        if (part.toLowerCase() === 'altgr') return 'AltGr';
        if (part.length > 1) return part.toUpperCase();
        return part.toUpperCase();
    }).join(' + ');
  };

  return (
    <>
      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translate(-50%, -20px) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes purplePulse {
          0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); }
          100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
        }
        .first-run-popup {
          animation: slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards, 
                     purplePulse 2s infinite;
        }
      `}</style>
      
      <div 
        className="first-run-popup"
        style={{
          position: 'fixed',
          top: '80px', // Positioned at the top
          left: '50%',
          transform: 'translateX(-50%)',
          width: '450px',
          backgroundColor: '#18181b', 
          border: '1px solid #a855f7', // Purple Border
          borderRadius: '16px',
          zIndex: 9999,
          padding: '24px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <button 
          onClick={handleDismiss}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'transparent', border: 'none', color: '#71717a',
            cursor: 'pointer', padding: '4px', borderRadius: '4px',
            transition: 'color 0.2s, background 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e4e4e7'; e.currentTarget.style.backgroundColor = '#27272a'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#f4f4f5' }}>
              Ready to go!
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5' }}>
              GoGoPrompt is running in the background. Follow these steps to use it:
            </p>
          </div>

          <div style={{ 
            display: 'flex', flexDirection: 'column', gap: '12px', 
            marginTop: '8px', fontSize: '13px', color: '#d4d4d8' 
          }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
              <span style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                width: '20px', height: '20px', borderRadius: '50%', 
                backgroundColor: '#27272a', border: '1px solid #3f3f46',
                fontSize: '11px', fontWeight: 700, color: '#a1a1aa'
              }}>1</span>
              <span>Open your AI tool (e.g., ChatGPT, Grok, Claude, Gemini)</span>
            </div>
            
            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
              <span style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                width: '20px', height: '20px', borderRadius: '50%', 
                backgroundColor: '#27272a', border: '1px solid #3f3f46',
                fontSize: '11px', fontWeight: 700, color: '#a1a1aa'
              }}>2</span>
              <span>
                Click inside the <strong style={{ color: '#f4f4f5' }}>message text box</strong> to place your cursor.
              </span>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                width: '20px', height: '20px', borderRadius: '50%', 
                backgroundColor: '#27272a', border: '1px solid #3f3f46',
                fontSize: '11px', fontWeight: 700, color: '#a1a1aa'
              }}>3</span>
              <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                Once there, press the summon hotkey 
                <span style={{ 
                  backgroundColor: '#eab308', color: '#18181b', 
                  padding: '4px 8px', borderRadius: '6px', 
                  fontWeight: 800, fontSize: '12px', 
                  display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 2px 5px rgba(234, 179, 8, 0.2)',
                  letterSpacing: '0.05em'
                }}>
                  <Keyboard size={12} strokeWidth={3} /> {formatHotkey(hotkey)}
                </span>
                to call GoGoPrompt
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
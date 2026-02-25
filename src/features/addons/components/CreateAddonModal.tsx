import React, { useState } from 'react';
import { X, Save, PlusCircle } from 'lucide-react';

interface CreateAddonModalProps {
  onClose: () => void;
  onSave: (label: string, content: string) => void;
}

export const CreateAddonModal = ({ onClose, onSave }: CreateAddonModalProps) => {
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (label.trim() && content.trim()) {
      onSave(label, content);
    }
  };

  const INPUT_BG = '#27272a';
  const BORDER_COLOR = '#3f3f46';
  const TEXT_COLOR = '#e4e4e7';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000 // Higher than everything
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '500px',
          backgroundColor: '#18181b',
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: '12px',
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${BORDER_COLOR}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '14px' }}>
            <PlusCircle size={18} />
            CREATE NEW ADDON
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Label Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>Addon Label</label>
            <input 
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="E.g., Tone: Professional, Format: Bullet Points..."
              style={{
                background: INPUT_BG,
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: '6px',
                padding: '10px',
                color: TEXT_COLOR,
                fontSize: '14px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Content Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>Content</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the prompt instruction text here..."
              rows={5}
              style={{
                background: INPUT_BG,
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: '6px',
                padding: '10px',
                color: TEXT_COLOR,
                fontSize: '14px',
                outline: 'none',
                width: '100%',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${BORDER_COLOR}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${'#ef4444'}`,
              color: '#ef4444',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!label.trim() || !content.trim()}
            style={{
              background: (!label.trim() || !content.trim()) ? '#3f3f46' : '#10b981',
              color: (!label.trim() || !content.trim()) ? '#71717a' : 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: (!label.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={14} />
            Save & Add
          </button>
        </div>
      </div>
    </div>
  );
};
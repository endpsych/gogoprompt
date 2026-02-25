import React, { useState } from 'react';
import { X, Save, FolderPlus } from 'lucide-react';

interface CreateCategoryModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
}

export const CreateCategoryModal = ({ onClose, onSave }: CreateCategoryModalProps) => {
  const [name, setName] = useState('');

  const BORDER_COLOR = '#3f3f46';
  const INPUT_BG = '#27272a';
  const TEXT_COLOR = '#e4e4e7';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100000
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          backgroundColor: '#18181b',
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: '12px',
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${BORDER_COLOR}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '14px' }}>
            <FolderPlus size={18} />
            NEW CATEGORY
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>Category Name</label>
          <input 
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., Marketing, Legal..."
            style={{
              background: INPUT_BG, border: `1px solid ${BORDER_COLOR}`, borderRadius: '6px',
              padding: '10px', color: TEXT_COLOR, fontSize: '14px', outline: 'none', width: '100%'
            }}
          />
        </div>

        <div style={{
          padding: '16px 20px', borderTop: `1px solid ${BORDER_COLOR}`,
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={() => name.trim() && onSave(name)}
            disabled={!name.trim()}
            style={{
              background: !name.trim() ? '#3f3f46' : '#f59e0b',
              color: !name.trim() ? '#71717a' : 'black',
              border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: !name.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Save size={14} /> Create
          </button>
        </div>
      </div>
    </div>
  );
};
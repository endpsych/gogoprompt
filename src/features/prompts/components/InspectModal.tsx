/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Prompt } from '@/types';
import { useSettingsStore } from '@/stores'; 
import { useLanguage } from '@/shared/hooks'; 

interface InspectModalProps {
  isOpen: boolean;
  prompt: Prompt | null;
  onClose: () => void;
}

export function InspectModal({ isOpen, prompt, onClose }: InspectModalProps) {
  const { t } = useLanguage(); 
  const [copied, setCopied] = React.useState(false);
  const getTagColor = useSettingsStore(state => state.getTagColor); 

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !prompt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        return (
          <span key={index} style={{ color: '#fb923c', fontWeight: 500 }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(2px)'
      }}
    >
      <div 
        className="inspect-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '600px', maxWidth: '90vw', maxHeight: '85vh',
          backgroundColor: '#18181b', 
          border: '1px solid #27272a',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex', flexDirection: 'column',
          animation: 'modalFadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid #27272a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          backgroundColor: '#18181b',
          flexShrink: 0 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: '#a855f7', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Prompt
            </span>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#f4f4f5', 
              lineHeight: '1.2' 
            }}>
              {prompt.title || 'Untitled Prompt'}
            </span>
          </div>
          
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', border: 'none', color: '#71717a', 
              cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex' 
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#27272a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Wrapper */}
        <div style={{ 
          padding: '24px', 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, 
          gap: '20px'
        }}>
          {/* Text Box */}
          <div style={{ 
            backgroundColor: '#27272a', 
            borderRadius: '8px', 
            padding: '16px',
            whiteSpace: 'pre-wrap', 
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '13px',
            border: '1px solid #3f3f46',
            color: '#e4e4e7',
            lineHeight: '1.6',
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden'
          }}>
            {renderContent(prompt.content)}
          </div>
          
          {/* Tags */}
          {prompt.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
              {prompt.tags.map(tag => (
                <span key={tag} style={{ 
                  fontSize: '11px', 
                  backgroundColor: getTagColor(tag), 
                  color: '#ffffff', 
                  padding: '4px 10px', 
                  borderRadius: '12px',
                  fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #27272a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#18181b', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px',
          flexShrink: 0 
        }}>
          <button 
            onClick={handleCopy}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'transparent', border: '1px solid #3f3f46',
              color: copied ? '#4ade80' : '#e4e4e7',
              padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#27272a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? (t.common.copied || 'Copied!') : (t.prompts.copyText || 'Copy Text')}
          </button>

          {/* UPDATED: Red Close Button */}
          <button 
            onClick={onClose}
            style={{ 
              background: '#ef4444', color: 'white', border: 'none',
              padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            {t.common.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
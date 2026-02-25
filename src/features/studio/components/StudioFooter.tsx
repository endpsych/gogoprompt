/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React from 'react';
import { closeWindow } from '@/shared/utils/storage/electron';
import { useLanguage } from '@/shared/hooks';

export function StudioFooter() {
  const { t } = useLanguage();

  return (
    <div style={{
        flexShrink: 0,
        borderTop: '1px solid #374151', 
        backgroundColor: '#1f2937',     
        padding: '12px',
        display: 'flex',
        justifyContent: 'flex-end', 
    }}>
        <button 
            onClick={closeWindow}
            style={{
                backgroundColor: 'transparent', 
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                padding: '6px 24px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#ef4444';
                e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ef4444';
            }}
        >
            {t.common?.close || "Close"}
        </button>
    </div>
  );
}
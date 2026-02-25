/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React from 'react';
import { Zap, X } from 'lucide-react';
import { closeWindow } from '@/shared/utils/storage/electron';

interface TitleBarProps {
  onOpenSettings?: () => void;
  onToggleMiniMode?: () => void;
}

export function TitleBar({ onOpenSettings: _onOpenSettings, onToggleMiniMode: _onToggleMiniMode }: TitleBarProps) {
  return (
    <div className="title-bar">
      <div className="title-logo">
        <Zap size={16} fill="currentColor" /> Studio
      </div>
      <div className="window-controls">
        {/* Minimize button removed as requested */}
        
        <button onClick={closeWindow} className="control-btn close-btn">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
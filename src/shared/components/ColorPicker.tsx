/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useRef, useEffect } from 'react';
import { COLOR_PALETTE } from '@/shared/utils/tags';

interface ColorPickerProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

export function ColorPicker({ currentColor, onSelectColor, onClose }: ColorPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="color-picker" ref={pickerRef}>
      <div className="color-picker-grid">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            className={`color-picker-swatch ${color === currentColor ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => {
              onSelectColor(color);
              onClose();
            }}
          />
        ))}
      </div>
    </div>
  );
}

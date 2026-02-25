/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

interface TagChipProps {
  tag: string;
  color: string;
  removable?: boolean;
  onRemove?: () => void;
  onColorChange?: (color: string) => void;
}

export function TagChip({ tag, color, removable, onRemove, onColorChange }: TagChipProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onColorChange) {
      e.preventDefault();
      setShowColorPicker(true);
    }
  };

  return (
    <span
      className="tag-chip"
      style={{ backgroundColor: color }}
      onContextMenu={handleContextMenu}
      title={onColorChange ? 'Right-click to change color' : undefined}
    >
      {tag}
      {removable && onRemove && (
        <button className="tag-remove" onClick={onRemove}>
          <X size={10} />
        </button>
      )}
      {showColorPicker && onColorChange && (
        <ColorPicker
          currentColor={color}
          onSelectColor={onColorChange}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </span>
  );
}

/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X, Pencil, Check, Palette } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

interface TagStatsProps {
  tags: string[];
  tagCounts: Record<string, number>;
  getTagColor: (tag: string) => string;
  onDeleteTag: (tag: string) => void;
  onRenameTag: (oldName: string, newName: string) => void;
  onSetTagColor: (tag: string, color: string) => void;
}

export function TagStats({ tags, tagCounts, getTagColor, onDeleteTag, onRenameTag, onSetTagColor }: TagStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);

  if (tags.length === 0) return null;

  // Sort tags by count (highest first), then alphabetically
  const sortedTags = [...tags].sort((a, b) => {
    const countDiff = (tagCounts[b] || 0) - (tagCounts[a] || 0);
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b);
  });

  const unusedTags = tags.filter((tag) => (tagCounts[tag] || 0) === 0);

  const handleStartRename = (tag: string) => {
    setEditingTag(tag);
    setNewTagName(tag);
    setColorPickerTag(null);
  };

  const handleCancelRename = () => {
    setEditingTag(null);
    setNewTagName('');
  };

  const handleConfirmRename = () => {
    if (!editingTag || !newTagName.trim()) return;
    
    const trimmedName = newTagName.trim().toLowerCase();
    
    // Don't rename if name hasn't changed
    if (trimmedName === editingTag) {
      handleCancelRename();
      return;
    }
    
    // Don't rename if new name already exists
    if (tags.includes(trimmedName)) {
      alert(`Tag "${trimmedName}" already exists. Delete it first or choose a different name.`);
      return;
    }
    
    onRenameTag(editingTag, trimmedName);
    handleCancelRename();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const handleToggleColorPicker = (tag: string) => {
    setColorPickerTag(colorPickerTag === tag ? null : tag);
    setEditingTag(null);
  };

  const handleColorSelect = (tag: string, color: string) => {
    onSetTagColor(tag, color);
    setColorPickerTag(null);
  };

  return (
    <div className="tag-stats">
      <button
        className="tag-stats-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="tag-stats-summary">
          {tags.length} tag{tags.length !== 1 ? 's' : ''}
          {unusedTags.length > 0 && (
            <span className="tag-stats-unused">
              ({unusedTags.length} unused)
            </span>
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="tag-stats-list">
          {sortedTags.map((tag) => {
            const count = tagCounts[tag] || 0;
            const isUnused = count === 0;
            const isEditing = editingTag === tag;
            const showColorPicker = colorPickerTag === tag;
            const tagColor = getTagColor(tag);

            return (
              <div
                key={tag}
                className={`tag-stats-item ${isUnused ? 'unused' : ''}`}
              >
                <button
                  className="tag-stats-dot-btn"
                  style={{ backgroundColor: tagColor }}
                  onClick={() => handleToggleColorPicker(tag)}
                  title="Change color"
                />
                
                {showColorPicker && (
                  <ColorPicker
                    currentColor={tagColor}
                    onSelectColor={(color) => handleColorSelect(tag, color)}
                    onClose={() => setColorPickerTag(null)}
                  />
                )}
                
                {isEditing ? (
                  <input
                    className="tag-stats-rename-input"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleCancelRename}
                    autoFocus
                  />
                ) : (
                  <span className="tag-stats-name">{tag}</span>
                )}
                
                <span className="tag-stats-count">{count}</span>
                
                <div className="tag-stats-actions">
                  {isEditing ? (
                    <button
                      className="tag-stats-action confirm"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleConfirmRename();
                      }}
                      title="Confirm rename"
                    >
                      <Check size={12} />
                    </button>
                  ) : (
                    <>
                      <button
                        className="tag-stats-action color"
                        onClick={() => handleToggleColorPicker(tag)}
                        title="Change color"
                      >
                        <Palette size={12} />
                      </button>
                      <button
                        className="tag-stats-action rename"
                        onClick={() => handleStartRename(tag)}
                        title="Rename tag"
                      >
                        <Pencil size={12} />
                      </button>
                    </>
                  )}
                  {isUnused && !isEditing && (
                    <button
                      className="tag-stats-action delete"
                      onClick={() => onDeleteTag(tag)}
                      title="Delete unused tag"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

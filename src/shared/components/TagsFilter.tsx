/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '@/shared/hooks'; 

export type FilterMode = 'AND' | 'OR';

interface TagsFilterProps {
  tags: string[];
  activeFilters: string[];
  filterMode: FilterMode;
  onFilterChange: (tags: string[]) => void;
  onFilterModeChange: (mode: FilterMode) => void;
  getTagColor: (tag: string) => string;
  renderTrigger?: (props: { isOpen: boolean, onClick: () => void }) => React.ReactNode;
  dropdownStyle?: React.CSSProperties;
  selectedTagsLayout?: 'outside' | 'inside';
}

export function TagsFilter({
  tags,
  activeFilters,
  filterMode,
  onFilterChange,
  onFilterModeChange,
  getTagColor,
  renderTrigger,
  dropdownStyle,
  selectedTagsLayout = 'outside',
}: TagsFilterProps) {
  const { t } = useLanguage(); 
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  if (tags.length === 0) return null;

  const handleTagClick = (tag: string) => {
    if (activeFilters.includes(tag)) {
      onFilterChange(activeFilters.filter((t) => t !== tag));
    } else {
      onFilterChange([...activeFilters, tag]);
    }
  };

  const handleClearAndClose = () => {
    onFilterChange([]);
    setIsOpen(false);
  };

  const handleClearOnly = () => {
    onFilterChange([]);
  };

  const toggleMode = () => {
    onFilterModeChange(filterMode === 'AND' ? 'OR' : 'AND');
  };

  const filteredTags = search
    ? tags.filter(tag => tag.toLowerCase().includes(search.toLowerCase()))
    : tags;

  const sortedTags = [...filteredTags].sort((a, b) => {
    const aActive = activeFilters.includes(a);
    const bActive = activeFilters.includes(b);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return a.localeCompare(b);
  });

  const selectedTagsBlock = activeFilters.length > 0 && (
    <div 
        className="tags-filter-selected" 
        style={selectedTagsLayout === 'inside' ? { 
            padding: '8px 12px', 
            borderBottom: '1px solid #3f3f46',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-start'
        } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        <button 
            className="tag-filter-clear" 
            onClick={handleClearOnly} 
            style={{ 
                margin: 0,
                padding: '0 8px', 
                height: '20px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid #3f3f46', 
                borderRadius: '4px',
                color: '#a1a1aa', 
                fontSize: '10px', 
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#f4f4f5';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#a1a1aa';
            }}
        >
            <X size={10} /> Clear All Tags
        </button>

        {activeFilters.length > 1 && (
          <button 
            className="filter-mode-toggle" 
            onClick={toggleMode}
            style={{ 
                margin: 0, 
                padding: '0 6px', 
                height: '20px',   
                fontSize: '10px', 
                fontWeight: 800,
                textTransform: 'uppercase',
                width: 'auto',
                lineHeight: '18px'
            }}
          >
            {filterMode}
          </button>
        )}
      </div>

      <div className="tags-filter-selected-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <div style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: '#e4e4e7',
            border: '1px solid #a855f7', 
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '10px', 
            padding: '0 6px',
            height: '20px',
            lineHeight: '18px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '20px'
        }}>
            {activeFilters.length}
        </div>

        {activeFilters.map((tag) => (
          <span
            key={tag}
            className="tag-filter-chip"
            style={{ backgroundColor: getTagColor(tag), margin: 0 }}
            onClick={() => handleTagClick(tag)}
          >
            {tag}
            <X size={10} />
          </span>
        ))}
      </div>
    </div>
  );

  return (
    // [CHANGE] Removed className="tags-filter-compact" and added explicit neutral styles
    // This removes the "invisible frame" (margin/border/padding) causing gaps
    <div 
        ref={dropdownRef} 
        style={{ 
            display: 'flex', 
            alignItems: 'center', 
            position: 'relative', 
            margin: 0, 
            padding: 0, 
            border: 'none', 
            outline: 'none',
            background: 'transparent'
        }}
    >
      
      {selectedTagsLayout === 'outside' && activeFilters.length > 0 && (
        <div className="tags-filter-selected">
          {activeFilters.length > 1 && (
            <button className="filter-mode-toggle" onClick={toggleMode}>
              {filterMode === 'AND' ? t.tags.matchAll : t.tags.matchAny}
            </button>
          )}
          <button className="tag-filter-clear" onClick={handleClearAndClose}>
            <X size={10} /> {t.common.reset}
          </button>
          <div className="tags-filter-selected-list">
            {activeFilters.map((tag) => (
              <span
                key={tag}
                className="tag-filter-chip"
                style={{ backgroundColor: getTagColor(tag) }}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
                <X size={10} />
              </span>
            ))}
          </div>
        </div>
      )}
      
      {renderTrigger ? (
        renderTrigger({ isOpen, onClick: () => setIsOpen(!isOpen) })
      ) : (
        <button 
          className={`tags-filter-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{t.tags.filterByTags}</span>
          <ChevronDown size={14} className={isOpen ? 'rotated' : ''} />
        </button>
      )}

      {isOpen && (
        <div 
            className="tags-filter-dropdown" 
            style={{
                ...dropdownStyle,
                border: '1px solid #7c3aed',
                borderTop: '1px solid #7c3aed',
                marginTop: '4px',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }} 
        >
          <div className="tags-filter-search" style={{ borderBottom: '1px solid #3f3f46' }}>
            <Search size={12} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t.tags.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="tags-filter-search-clear" onClick={() => setSearch('')}>
                <X size={10} />
              </button>
            )}
          </div>

          {selectedTagsLayout === 'inside' && selectedTagsBlock}

          <div className="tags-filter-list-compact">
            {sortedTags.map((tag) => (
              <button
                key={tag}
                className={`tag-filter-item ${activeFilters.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                <span 
                  className="tag-filter-dot"
                  style={{ backgroundColor: getTagColor(tag) }}
                />
                <span className="tag-filter-name">{tag}</span>
                {activeFilters.includes(tag) && (
                  <span className="tag-filter-check">✓</span>
                )}
              </button>
            ))}
            {sortedTags.length === 0 && (
              <div className="tags-filter-no-results">{t.tags.noTags}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
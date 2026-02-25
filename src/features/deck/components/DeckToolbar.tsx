/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Filter, GripVertical, ArrowDownAZ, ArrowUpAZ, 
  Calendar, ArrowDownWideNarrow, Search, X, LayoutList, LayoutGrid, Columns, Settings 
} from 'lucide-react';
import { TagsFilter } from '@/shared/components/TagsFilter';
import { useLanguage } from '@/shared/hooks';
import { PromptSortOrder } from '@/types';
import { FilterMode } from '@/features/deck/components/DeckMode';

interface DeckToolbarProps {
  onSwitchToStudio: () => void;
  onOpenCreateModal: () => void;
  onOpenSettings: () => void;
  showCreateButton: boolean;
  
  // Filter Props
  allTags: string[];
  activeTagFilters: string[];
  setActiveTagFilters: (tags: string[]) => void;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  getTagColor: (tag: string) => string;

  // Sort Props
  sortOrder?: PromptSortOrder;
  onSortOrderChange?: (order: PromptSortOrder) => void;

  // Search Props
  search: string;
  setSearch: (s: string) => void;

  // View Mode Props
  viewMode: 'list' | 'grid-2' | 'grid-3';
  onViewModeChange: (mode: 'list' | 'grid-2' | 'grid-3') => void;
}

export function DeckToolbar({
  onSwitchToStudio,
  onOpenCreateModal,
  onOpenSettings,
  showCreateButton,
  allTags,
  activeTagFilters,
  setActiveTagFilters,
  filterMode,
  setFilterMode,
  getTagColor,
  sortOrder,
  onSortOrderChange,
  search,
  setSearch,
  viewMode,
  onViewModeChange
}: DeckToolbarProps) {
  const { t } = useLanguage();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  const getSortIcon = () => {
    switch(sortOrder) {
        case 'custom': return <GripVertical size={14} />;
        case 'alphabetical': return <ArrowDownAZ size={14} />;
        case 'alphabetical-desc': return <ArrowUpAZ size={14} />;
        case 'created-newest': return <Calendar size={14} />;
        case 'created-oldest': return <Calendar size={14} style={{ transform: 'rotate(180deg)' }} />;
        default: return <ArrowDownWideNarrow size={14} />;
    }
  };

  const getViewIcon = () => {
      switch(viewMode) {
          case 'grid-2': return <Columns size={14} />;
          case 'grid-3': return <LayoutGrid size={14} />;
          default: return <LayoutList size={14} />;
      }
  };

  return (
    <div className="deck-mode-header">
      {/* LEFT GROUP: Actions, View, Filter, Sort */}
      {/* [CHANGE] Reduced marginRight from 8px to 4px */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginRight: '4px' }}>
          
          {showCreateButton && (
              <button 
                  className="deck-mode-filter-btn"
                  onClick={onOpenCreateModal}
                  title={t.tooltips.newPrompt}
                  style={{ 
                      color: 'white', 
                      backgroundColor: '#351ff9', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      marginRight: '6px' 
                  }}
              >
                  <Plus size={14} /> {t.common.new}
              </button>
          )}

          {/* View Mode Menu */}
          <div style={{ position: 'relative' }}>
            <button
                className={`deck-mode-filter-btn ${showViewMenu ? 'active' : ''}`}
                onClick={() => { setShowViewMenu(!showViewMenu); setShowSortMenu(false); }}
                title="Change Layout"
            >
                {getViewIcon()}
            </button>

            {showViewMenu && (
                <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowViewMenu(false)} />
                <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '4px', 
                    backgroundColor: '#18181b', border: '1px solid #3f3f46',
                    borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 100, minWidth: '140px', padding: '4px',
                    display: 'flex', flexDirection: 'column', gap: '2px'
                }}>
                    {[
                        { id: 'list', label: 'List View', icon: <LayoutList size={14} /> },
                        { id: 'grid-2', label: 'Grid (2 Cols)', icon: <Columns size={14} /> },
                        { id: 'grid-3', label: 'Grid (3 Cols)', icon: <LayoutGrid size={14} /> },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => { onViewModeChange(opt.id as any); setShowViewMenu(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '6px 8px', borderRadius: '4px',
                                border: 'none', background: viewMode === opt.id ? '#27272a' : 'transparent',
                                color: viewMode === opt.id ? '#f4f4f5' : '#a1a1aa',
                                fontSize: '12px', cursor: 'pointer', textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = viewMode === opt.id ? '#27272a' : 'transparent'}
                        >
                            {opt.icon} {opt.label}
                        </button>
                    ))}
                </div>
                </>
            )}
          </div>

          {allTags.length > 0 && (
              <TagsFilter 
                tags={allTags}
                activeFilters={activeTagFilters}
                filterMode={filterMode}
                onFilterChange={setActiveTagFilters}
                onFilterModeChange={setFilterMode}
                getTagColor={getTagColor}
                dropdownStyle={{ minWidth: '300px' }} 
                selectedTagsLayout="inside" 
                renderTrigger={({ isOpen, onClick }) => (
                    <button 
                    className={`deck-mode-filter-btn ${isOpen || activeTagFilters.length > 0 ? 'active' : ''}`}
                    onClick={onClick}
                    title={t.tooltips.filterByTags}
                    style={{ position: 'relative' }} 
                    >
                    <Filter size={14} />
                    {activeTagFilters.length > 0 && (
                        <span style={{
                                position: 'absolute', top: '-4px', right: '-4px',
                                backgroundColor: '#3b82f6', color: 'white',
                                fontSize: '9px', fontWeight: 'bold', borderRadius: '50%',
                                minWidth: '14px', height: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 0 2px #18181b' 
                            }}
                        >
                            {activeTagFilters.length}
                        </span>
                    )}
                    </button>
                )}
              />
          )}

          {onSortOrderChange && (
              <div style={{ position: 'relative' }}>
                  <button 
                      className={`deck-mode-filter-btn ${showSortMenu ? 'active' : ''}`}
                      onClick={() => { setShowSortMenu(!showSortMenu); setShowViewMenu(false); }}
                      title={t.settings.promptSortOrder}
                  >
                      {getSortIcon()}
                  </button>
                  
                  {showSortMenu && (
                      <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowSortMenu(false)} />
                      <div style={{
                          position: 'absolute', top: '100%', left: 0, marginTop: '4px', 
                          backgroundColor: '#18181b', border: '1px solid #3f3f46',
                          borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          zIndex: 100, minWidth: '140px', padding: '4px',
                          display: 'flex', flexDirection: 'column', gap: '2px'
                      }}>
                          {[
                              { id: 'custom', label: t.settings.sortOrderOptions.custom, icon: <GripVertical size={14} /> },
                              { id: 'az', label: t.settings.sortOrderOptions.alphabetical, icon: <ArrowDownAZ size={14} /> },
                              { id: 'za', label: t.variables.sortNameZA, icon: <ArrowUpAZ size={14} /> },
                              { id: 'newest', label: t.settings.sortOrderOptions.newest, icon: <Calendar size={14} /> },
                              { id: 'oldest', label: t.settings.sortOrderOptions.oldest, icon: <Calendar size={14} style={{ transform: 'rotate(180deg)' }} /> },
                          ].map(opt => (
                              <button
                                  key={opt.id}
                                  onClick={() => { onSortOrderChange(opt.id as PromptSortOrder); setShowSortMenu(false); }}
                                  style={{
                                      display: 'flex', alignItems: 'center', gap: '8px',
                                      padding: '6px 8px', borderRadius: '4px',
                                      border: 'none', background: sortOrder === opt.id ? '#27272a' : 'transparent',
                                      color: sortOrder === opt.id ? '#f4f4f5' : '#a1a1aa',
                                      fontSize: '12px', cursor: 'pointer', textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortOrder === opt.id ? '#27272a' : 'transparent'}
                              >
                                  {opt.icon} {opt.label}
                              </button>
                          ))}
                      </div>
                      </>
                  )}
              </div>
          )}
      </div>

      {/* SEARCH BAR */}
      <div className="deck-mode-search">
        <Search size={14} />
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.miniMode.searchPlaceholder}
          className="deck-mode-search-input"
        />
        {search && <button className="deck-mode-search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
      </div>

      <button 
        onClick={onSwitchToStudio} 
        title={t.tooltips.expand}
        style={{ 
            backgroundColor: '#7c3aed', 
            color: 'white', 
            marginLeft: '4px', 
            padding: '0 12px',
            height: '32px',
            minWidth: '70px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
      >
        STUDIO
      </button>

      {/* Settings Button */}
      <button 
        onClick={onOpenSettings} 
        title={t.settings.title || "Settings"}
        className="deck-mode-filter-btn"
        style={{ 
            marginLeft: '4px',
            color: '#f97316'
        }}
      >
        <Settings size={16} />
      </button>

    </div>
  );
}
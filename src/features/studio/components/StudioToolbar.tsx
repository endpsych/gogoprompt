import React, { useState } from 'react';
import { Plus, Filter, GripVertical, ArrowDownAZ, ArrowUpAZ, Calendar, ArrowDownWideNarrow, Search, Zap } from 'lucide-react';
import { TagsFilter } from '@/shared/components/TagsFilter';
import { useLanguage } from '@/shared/hooks';
import { PromptSortOrder } from '@/types';
import { FilterMode } from '@/stores/uiStore'; // Adjust path if needed

interface StudioToolbarProps {
  onNewPrompt: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  
  // Tag Filter Props
  allTags: string[];
  activeTagFilters: string[];
  setActiveTagFilters: (tags: string[]) => void;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  getTagColor: (tag: string) => string;

  // Sort Props
  sortOrder: PromptSortOrder;
  setSortOrder: (order: PromptSortOrder) => void;
}

export function StudioToolbar({
  onNewPrompt,
  search,
  onSearchChange,
  searchInputRef,
  allTags,
  activeTagFilters,
  setActiveTagFilters,
  filterMode,
  setFilterMode,
  getTagColor,
  sortOrder,
  setSortOrder
}: StudioToolbarProps) {
  const { t } = useLanguage();
  const [showSortMenu, setShowSortMenu] = useState(false);

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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #374151', backgroundColor: '#18181b', flexShrink: 0 }}>
        
        {/* NEW PROMPT BUTTON */}
        <button 
          onClick={onNewPrompt}
          title={t.prompts.newPrompt || "New Prompt"}
          style={{ 
            height: '32px', width: 'fit-content', padding: '0 12px',
            backgroundColor: '#ea580c', border: 'none', borderRadius: '6px',
            color: 'white', fontSize: '12px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f97316'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ea580c'}
        >
          <Plus size={14} strokeWidth={3} /> {t.prompts.newPrompt || "New Prompt"}
        </button>

        {/* Filter Button */}
        <TagsFilter 
          tags={allTags} 
          activeFilters={activeTagFilters} 
          filterMode={filterMode} 
          onFilterChange={setActiveTagFilters} 
          onFilterModeChange={setFilterMode} 
          getTagColor={getTagColor} 
          selectedTagsLayout="inside"
          dropdownStyle={{ minWidth: '300px', left: 0 }}
          renderTrigger={({ isOpen, onClick }) => (
            <button 
              onClick={onClick}
              className={`icon-btn ${isOpen || activeTagFilters.length > 0 ? 'active' : ''}`}
              style={{
                height: '32px', width: '32px', borderRadius: '6px',
                background: isOpen || activeTagFilters.length > 0 ? '#374151' : 'transparent',
                border: '1px solid #3f3f46',
                color: isOpen || activeTagFilters.length > 0 ? '#f9fafb' : '#9ca3af',
                cursor: 'pointer', position: 'relative', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#374151'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = (isOpen || activeTagFilters.length > 0) ? '#374151' : 'transparent'}
            >
              <Filter size={16} />
              {activeTagFilters.length > 0 && (
                <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    backgroundColor: '#3b82f6', color: 'white',
                    fontSize: '9px', fontWeight: 'bold', borderRadius: '50%',
                    minWidth: '14px', height: '14px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #18181b' 
                }}>
                    {activeTagFilters.length}
                </span>
              )}
            </button>
          )}
        />

        {/* Sort Button */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={`icon-btn ${showSortMenu ? 'active' : ''}`}
            style={{
              height: '32px', width: '32px', borderRadius: '6px',
              background: showSortMenu ? '#374151' : 'transparent',
              border: '1px solid #3f3f46',
              color: showSortMenu ? '#f9fafb' : '#9ca3af',
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={t.settings.promptSortOrder}
          >
            {getSortIcon()}
          </button>
          {showSortMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowSortMenu(false)} />
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100, minWidth: '160px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[ { id: 'custom', label: t.settings.sortOrderOptions.custom, icon: <GripVertical size={14} /> }, { id: 'az', label: t.settings.sortOrderOptions.alphabetical, icon: <ArrowDownAZ size={14} /> }, { id: 'za', label: t.variables.sortNameZA, icon: <ArrowUpAZ size={14} /> }, { id: 'newest', label: t.settings.sortOrderOptions.newest, icon: <Calendar size={14} /> }, { id: 'oldest', label: t.settings.sortOrderOptions.oldest, icon: <Calendar size={14} style={{ transform: 'rotate(180deg)' }} /> }, { id: 'word-count-desc', label: 'Word Count (High)', icon: <span style={{ fontSize: '10px', fontWeight: 800 }}>W</span> }, { id: 'word-count-asc', label: 'Word Count (Low)', icon: <span style={{ fontSize: '10px', fontWeight: 800 }}>W</span> }, { id: 'variable-count-desc', label: 'Variables (High)', icon: <span style={{ fontSize: '10px', fontWeight: 800 }}>{'{ }'}</span> }, { id: 'variable-count-asc', label: 'Variables (Low)', icon: <span style={{ fontSize: '10px', fontWeight: 800 }}>{'{ }'}</span> }, { id: 'most-used', label: t.settings.sortOrderOptions.mostUsed || 'Most Used', icon: <Zap size={14} /> }, { id: 'least-used', label: 'Least Used', icon: <Zap size={14} /> } ].map(opt => (
                      <button key={opt.id} onClick={() => { setSortOrder(opt.id as PromptSortOrder); setShowSortMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', border: 'none', background: sortOrder === opt.id ? '#27272a' : 'transparent', color: sortOrder === opt.id ? '#f4f4f5' : '#a1a1aa', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortOrder === opt.id ? '#27272a' : 'transparent'}>{opt.icon} {opt.label}</button>
                  ))}
              </div>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
            <input 
              ref={searchInputRef} 
              className="search-input" 
              placeholder={t.prompts.searchPlaceholder} 
              value={search} 
              onChange={(e) => onSearchChange(e.target.value)} 
              style={{ width: '100%', height: '32px', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', padding: '0 8px 0 30px', fontSize: '13px', color: '#e4e4e7', outline: 'none', boxSizing: 'border-box' }} 
            />
        </div>
    </div>
  );
}
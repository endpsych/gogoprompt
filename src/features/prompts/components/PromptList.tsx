/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Prompt, PromptSortOrder, PromptUsageRecord } from '@/types';
import { Pencil, Trash2, Copy, Search, Zap, ArrowUp, ArrowDown, Minus, X } from 'lucide-react'; 
import { useLanguage } from '@/shared/hooks'; 
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { UsageTooltip } from '@/shared/components/UsageTooltip';
import { HistoryPanel } from '@/features/history/components/HistoryPanel'; 

interface PromptListProps {
  prompts: Prompt[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getTagColor: (tag: string) => string;
  sortOrder?: PromptSortOrder;
  onSortOrderChange?: (order: PromptSortOrder) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onInspect?: (id: string) => void;
}

// --- SORT BUTTON COMPONENT (Visual Only) ---
const SortIndicator = ({ 
    activeSort, 
    ascValue, 
    descValue 
}: { 
    activeSort?: PromptSortOrder, 
    ascValue: PromptSortOrder, 
    descValue: PromptSortOrder 
}) => {
    const isActive = activeSort === ascValue || activeSort === descValue;
    const isAsc = activeSort === ascValue;

    return (
        <span 
            style={{ 
                color: isActive ? '#22c55e' : '#52525b', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: '4px' 
            }}
        >
            {isActive ? (isAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <Minus size={12} />}
        </span>
    );
};

export function PromptList({ 
  prompts, 
  selectedId, 
  onSelect, 
  getTagColor, 
  sortOrder = 'custom', 
  onSortOrderChange, 
  onEdit, 
  onDelete, 
  onInspect 
}: PromptListProps) {
  const { t, currentLanguageCode } = useLanguage(); 
  
  // Hover State for Text Tooltips
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State for Usage Tooltip (Hover)
  const [usageTooltip, setUsageTooltip] = useState<{ rect: DOMRect, stats: { useCount: number, lastUsed: string | null } } | null>(null);

  // State for Full History Modal (Click)
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);

  // Popup State for Variables (Legacy/Existing)
  const [activePopup, setActivePopup] = useState<{ id: string, type: 'vars' } | null>(null);

  const dateLocale = currentLanguageCode === 'es' ? es : enUS;

  // --- COLUMN CONFIGURATION ---
  const COL_WIDTHS = {
      INDEX: '30px',
      LAST: '90px',
      CREATED: '90px',
      WORDS: '85px',
      VARS: '75px',
      USE: '75px',
      ACTIONS: '120px'
  };

  useEffect(() => {
      const handleClickOutside = () => setActivePopup(null);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // --- HOVER DELAY HANDLERS ---
  const handleMouseEnter = (id: string, column: 'last' | 'created' | 'words') => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => {
          setHoveredCell(`${id}-${column}`);
      }, 600); 
  };

  const handleMouseLeave = () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      setHoveredCell(null);
  };

  // --- SORT HANDLER ---
  const handleHeaderClick = (ascValue: PromptSortOrder, descValue: PromptSortOrder) => {
      if (!onSortOrderChange) return;
      if (sortOrder === descValue) {
          onSortOrderChange(ascValue);
      } else {
          onSortOrderChange(descValue);
      }
  };

  const toggleVarsPopup = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (activePopup?.id === id) {
          setActivePopup(null);
      } else {
          setActivePopup({ id, type: 'vars' });
      }
  };

  // Simple restore handler for the history panel (copies to clipboard)
  const handleRestoreFromHistory = (record: PromptUsageRecord) => {
      navigator.clipboard.writeText(record.finalOutput)
        .then(() => {
            console.log("Restored to clipboard");
        })
        .catch(err => console.error("Failed to copy", err));
      setHistoryTargetId(null);
  };

  // --- TOOLTIP RENDERER ---
  const renderTooltip = (text: string, rowIndex: number) => {
      const isTopRow = rowIndex < 2;
      return (
          <div style={{
              position: 'absolute', 
              [isTopRow ? 'top' : 'bottom']: '100%', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              [isTopRow ? 'marginTop' : 'marginBottom']: '8px', 
              padding: '6px 10px',
              backgroundColor: 'rgba(9, 9, 11, 0.95)', 
              border: '1px solid white', 
              color: 'white', 
              borderRadius: '6px', 
              fontSize: '12px', 
              fontWeight: 500, 
              whiteSpace: 'nowrap', 
              zIndex: 1000, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)', 
              pointerEvents: 'none'
          }}>
              {text}
              <div style={{ 
                  position: 'absolute', 
                  [isTopRow ? 'bottom' : 'top']: '100%', 
                  left: '50%', 
                  marginLeft: '-4px', 
                  width: 0, 
                  height: 0, 
                  borderLeft: '4px solid transparent', 
                  borderRight: '4px solid transparent', 
                  [isTopRow ? 'borderBottom' : 'borderTop']: '4px solid white' 
              }} />
          </div>
      );
  };

  return (
    <div className="prompt-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* HEADER ROW */}
      <div 
        className="prompt-list-header" 
        style={{ 
            display: 'flex', alignItems: 'center', gap: '12px', 
            padding: '8px 16px', borderBottom: '1px solid #27272a',
            backgroundColor: '#18181b', color: '#71717a', fontSize: '11px', fontWeight: 600,
            position: 'sticky', top: 0, zIndex: 10, userSelect: 'none'
        }}
      >
        <span style={{ minWidth: COL_WIDTHS.INDEX }}>#</span>
        
        <div 
            onClick={() => handleHeaderClick('alphabetical', 'alphabetical-desc')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            title="Sort by Title"
        >
            <span>Title</span>
            <SortIndicator activeSort={sortOrder} ascValue="alphabetical" descValue="alphabetical-desc" />
        </div>

        <div 
            onClick={() => handleHeaderClick('last-used-oldest', 'last-used-newest')}
            style={{ width: COL_WIDTHS.LAST, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Sort by Last Used"
        >
            <span>Last</span>
            <SortIndicator activeSort={sortOrder} ascValue="last-used-oldest" descValue="last-used-newest" />
        </div>

        <div 
            onClick={() => handleHeaderClick('created-oldest', 'created-newest')}
            style={{ width: COL_WIDTHS.CREATED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Sort by Date Created"
        >
            <span>Created</span>
            <SortIndicator activeSort={sortOrder} ascValue="created-oldest" descValue="created-newest" />
        </div>

        <div 
            onClick={() => handleHeaderClick('word-count-asc', 'word-count-desc')}
            style={{ width: COL_WIDTHS.WORDS, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Sort by Word Count"
        >
            <span>Words</span>
            <SortIndicator activeSort={sortOrder} ascValue="word-count-asc" descValue="word-count-desc" />
        </div>

        <div 
            onClick={() => handleHeaderClick('variable-count-asc', 'variable-count-desc')}
            style={{ width: COL_WIDTHS.VARS, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Sort by Variable Count"
        >
            <span>Vars</span>
            <SortIndicator activeSort={sortOrder} ascValue="variable-count-asc" descValue="variable-count-desc" />
        </div>

        <div 
            onClick={() => handleHeaderClick('least-used', 'most-used')}
            style={{ width: COL_WIDTHS.USE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Sort by Usage Count"
        >
            <span>Use</span>
            <SortIndicator activeSort={sortOrder} ascValue="least-used" descValue="most-used" />
        </div>

        <div style={{ width: COL_WIDTHS.ACTIONS }}></div> 
      </div>

      <div className="prompt-list" style={{ paddingBottom: '20px', overflowY: 'auto' }}>
        {prompts.map((p, index) => {
            const wordCount = p.content ? p.content.trim().split(/\s+/).length : 0;
            const variables = Array.from(new Set(p.content.match(/\{\{([^}]+)\}\}/g) || [])).map(v => v.replace(/\{\{|\}\}/g, ''));
            const variableCount = variables.length;
            const usageCount = (p as any).useCount ?? (p as any).usageCount ?? 0;
            
            const createdDateStr = format(p.updatedAt || p.createdAt, 'MMM dd, yyyy', { locale: dateLocale });
            const createdFullTooltip = format(p.updatedAt || p.createdAt, 'PPpp', { locale: dateLocale });
            const lastUsedStr = p.lastUsed ? format(p.lastUsed, 'MMM dd, yyyy', { locale: dateLocale }) : 'Never';
            const lastUsedTooltip = p.lastUsed ? format(p.lastUsed, 'PPpp', { locale: dateLocale }) : 'Never used';

            return (
            <div
                key={p.id}
                className={`prompt-item ${selectedId === p.id ? 'active' : ''}`}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', 
                    padding: '12px 16px', borderBottom: '1px solid #27272a',
                    cursor: 'default', transition: 'background 0.15s', position: 'relative'
                }}
            >
                <span className="prompt-item-number" style={{ color: '#52525b', fontSize: '12px', minWidth: COL_WIDTHS.INDEX }}>{index + 1}.</span>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                    <span className="prompt-item-title" style={{ color: '#e4e4e7', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title}
                    </span>
                    {p.tags.length > 0 && (
                    <div className="prompt-item-tags" style={{ display: 'flex', gap: '4px' }}>
                        {p.tags.slice(0, 10).map((tag) => (
                        <span key={tag} style={{ backgroundColor: getTagColor(tag), height: '4px', width: '16px', borderRadius: '2px', display: 'inline-block' }} />
                        ))}
                    </div>
                    )}
                </div>

                {/* LAST USED */}
                <div 
                    style={{ width: COL_WIDTHS.LAST, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '11px', cursor: 'default', position: 'relative' }}
                    onMouseEnter={() => handleMouseEnter(p.id, 'last')}
                    onMouseLeave={handleMouseLeave}
                >
                    {lastUsedStr}
                    {hoveredCell === `${p.id}-last` && renderTooltip(lastUsedTooltip, index)}
                </div>

                {/* CREATED */}
                <div 
                    style={{ width: COL_WIDTHS.CREATED, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '11px', cursor: 'default', position: 'relative' }}
                    onMouseEnter={() => handleMouseEnter(p.id, 'created')}
                    onMouseLeave={handleMouseLeave}
                >
                    {createdDateStr}
                    {hoveredCell === `${p.id}-created` && renderTooltip(createdFullTooltip, index)}
                </div>

                {/* WORD COUNT */}
                <div 
                    style={{ width: COL_WIDTHS.WORDS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', color: '#3b82f6', fontSize: '11px', position: 'relative', cursor: 'default' }}
                    onMouseEnter={() => handleMouseEnter(p.id, 'words')}
                    onMouseLeave={handleMouseLeave}
                >
                    <span style={{ fontSize: '10px', fontWeight: 800, lineHeight: 1 }}>W</span>
                    <span>{wordCount}</span>
                    {hoveredCell === `${p.id}-words` && renderTooltip(`Words in the Prompt: ${wordCount}`, index)}
                </div>

                {/* VARIABLE COUNT */}
                <div 
                    onClick={(e) => { if (variableCount > 0) toggleVarsPopup(e, p.id); }}
                    style={{ 
                        width: COL_WIDTHS.VARS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', 
                        color: variableCount > 0 ? '#f97316' : '#52525b', fontSize: '11px', cursor: variableCount > 0 ? 'pointer' : 'default', position: 'relative' 
                    }}
                >
                    <span style={{ fontSize: '10px', fontWeight: 800, lineHeight: 1 }}>{'{ }'}</span>
                    <span>{variableCount}</span>
                    {activePopup?.id === p.id && (
                        <div onClick={e => e.stopPropagation()} style={{
                            position: 'absolute', top: '100%', right: '0', marginTop: '8px',
                            backgroundColor: '#18181b', border: '1px solid white', borderRadius: '8px',
                            padding: '8px', zIndex: 2000, minWidth: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', cursor: 'default'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #3f3f46' }}>
                                Variables ({variableCount})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                                {variables.map(v => (
                                    <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e4e4e7', fontSize: '12px' }}>
                                        <span style={{ color: '#f97316', fontSize: '10px' }}>●</span> {v}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* USE COUNT - Hover for Tooltip, Click for History */}
                <div 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (usageCount > 0) setHistoryTargetId(p.id); 
                    }}
                    onMouseEnter={(e) => {
                        if (usageCount > 0) {
                            setUsageTooltip({
                                rect: e.currentTarget.getBoundingClientRect(),
                                stats: { useCount: usageCount, lastUsed: p.lastUsed || null }
                            });
                        }
                    }}
                    onMouseLeave={() => setUsageTooltip(null)}
                    style={{ 
                        width: COL_WIDTHS.USE, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', 
                        color: usageCount > 0 ? '#eab308' : '#52525b', fontSize: '11px', 
                        cursor: usageCount > 0 ? 'pointer' : 'default', position: 'relative' 
                    }}
                >
                    <Zap size={11} strokeWidth={2.5} fill="currentColor" />
                    <span>{usageCount}</span>
                </div>

                {/* ACTIONS */}
                <div className="prompt-item-actions" style={{ width: COL_WIDTHS.ACTIONS, display: 'flex', gap: '4px', opacity: 0.6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSelect(p.id); }} 
                        title={t.tooltips.copy || 'Copy'}
                        style={{ background: 'transparent', border: 'none', padding: '6px', color: '#a1a1aa', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; e.currentTarget.style.color = '#22c55e'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
                    >
                        <Copy size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onInspect?.(p.id); }} 
                        title={t.prompts.promptPreview || 'Inspect'}
                        style={{ background: 'transparent', border: 'none', padding: '6px', color: '#a1a1aa', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.color = '#3b82f6'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
                    >
                        <Search size={14} /> 
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(p.id); }} 
                        title={t.prompts.editPrompt} 
                        style={{ background: 'transparent', border: 'none', padding: '6px', color: '#a1a1aa', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)'; e.currentTarget.style.color = '#a855f7'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
                    >
                        <Pencil size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} 
                        title={t.prompts.deletePrompt} 
                        style={{ background: 'transparent', border: 'none', padding: '6px', color: '#a1a1aa', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            );
        })}
        {prompts.length === 0 && (
            <div className="prompt-list-empty" style={{ padding: '40px', textAlign: 'center', color: '#52525b' }}>{t.prompts.noPrompts || 'No prompts found'}</div>
        )}
      </div>

      {/* Render Usage Tooltip */}
      {usageTooltip && (
          <UsageTooltip 
            rect={usageTooltip.rect} 
            stats={usageTooltip.stats} 
            onClose={() => setUsageTooltip(null)} 
          />
      )}

      {/* Render Full History Modal */}
      {historyTargetId && (
          <HistoryPanel 
            filterPromptId={historyTargetId} 
            onClose={() => setHistoryTargetId(null)} 
            onRestore={handleRestoreFromHistory} 
          />
      )}

    </div>
  );
}
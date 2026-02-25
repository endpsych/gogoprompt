/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Trash2, Clock, History, Calendar, Download } from 'lucide-react';
import { PromptUsageRecord } from '@/types';
import { getPromptHistory, clearPromptHistory } from '@/features/history/utils/history';
import { HistoryItem } from './HistoryItem';
import { useLanguage } from '@/shared/hooks';

interface HistoryPanelProps {
  onClose: () => void;
  onRestore: (record: PromptUsageRecord) => void;
  filterPromptId?: string | null;
}

export function HistoryPanel({ onClose, onRestore, filterPromptId }: HistoryPanelProps) {
  const { t } = useLanguage();
  const [history, setHistory] = useState<PromptUsageRecord[]>([]);
  const [search, setSearch] = useState('');
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setHistory(getPromptHistory());
  }, []);

  const handleClear = () => {
    if (confirm(t.history.clearConfirm)) {
      clearPromptHistory();
      setHistory([]);
    }
  };

  const handleExport = () => {
    if (filteredHistory.length === 0) return;

    const dataStr = JSON.stringify(filteredHistory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `deployment_history_${dateStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredHistory = useMemo(() => {
    let records = history;
    if (filterPromptId) {
      records = records.filter(r => r.promptId === filterPromptId);
    }

    if (!search.trim()) return records;
    const term = search.toLowerCase();

    return records.filter(record => {
      if (record.promptSnapshot.title.toLowerCase().includes(term)) return true;
      if (record.inputs.variables) {
        const values = Object.values(record.inputs.variables);
        if (values.some(v => v.toLowerCase().includes(term))) return true;
      }
      if (record.inputs.clipboardContent?.toLowerCase().includes(term)) return true;
      if (record.inputs.addons?.some(a => a.toLowerCase().includes(term))) return true;
      return false;
    });
  }, [history, search, filterPromptId]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, PromptUsageRecord[]> = {};
    filteredHistory.forEach(record => {
      const date = new Date(record.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let key = date.toLocaleDateString();
      if (date.toDateString() === today.toDateString()) key = t.history.today;
      else if (date.toDateString() === yesterday.toDateString()) key = t.history.yesterday;

      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });
    return groups;
  }, [filteredHistory, t]); // Added t dependency for translations

  // --- STYLES ---

  const styles = {
    overlay: {
      position: 'fixed' as 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    },
    modal: {
      width: '600px',
      maxWidth: '90vw',
      height: '70vh',
      backgroundColor: '#18181b',
      border: '1px solid #3f3f46',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column' as 'column',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
    },
    header: {
      padding: '14px 20px',
      borderBottom: '2px solid #6366f1',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#27272a',
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px',
      fontWeight: 700,
      color: '#f4f4f5',
      textTransform: 'uppercase' as 'uppercase',
      letterSpacing: '0.05em',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      color: '#71717a',
      cursor: 'pointer',
      padding: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      overflowY: 'auto' as 'auto',
      padding: '0 20px 20px 20px',
      backgroundColor: '#18181b',
      position: 'relative' as 'relative',
    }
  };

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #3f3f46',
    gap: '10px',
    backgroundColor: '#18181b',
  };

  const stickyHeaderStyle = {
    position: 'sticky' as 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: '#18181b',
    padding: '20px 0 10px 0',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#71717a',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase' as 'uppercase',
    letterSpacing: '0.05em',
  };

  const searchContainerStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    position: 'relative' as 'relative',
    backgroundColor: '#202023',
    border: isSearchFocused ? '1px solid #6366f1' : '1px solid #3f3f46',
    borderRadius: '6px',
    padding: '0 10px',
    height: '36px',
    transition: 'all 0.2s ease',
    boxShadow: isSearchFocused ? '0 0 0 1px rgba(99, 102, 241, 0.2)' : 'none',
  };

  const searchInputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    color: '#f4f4f5',
    width: '100%',
    fontSize: '13px',
    marginLeft: '8px',
    height: '100%',
    padding: 0,
  };

  const toolbarBtnStyle = (color: string, bgTint: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: bgTint,
    border: `1px solid ${bgTint.replace('0.1', '0.2')}`, 
    color: color,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
  });

  const modalContent = (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <History size={18} style={{ color: '#6366f1' }} />
            <span>{filterPromptId ? t.history.titlePrompt : t.history.titleGlobal}</span>
          </div>
          <button 
            style={styles.closeBtn} 
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={toolbarStyle}>
          {/* Search Bar */}
          <div style={searchContainerStyle}>
            <Search size={14} color="#71717a" style={{ flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder={t.history.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoFocus
              style={searchInputStyle}
            />
            {search && (
              <button 
                className="search-clear" 
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <X size={12}/>
              </button>
            )}
          </div>
          
          {/* Export Button */}
          {filteredHistory.length > 0 && (
            <button 
              onClick={handleExport}
              title={t.history.export}
              style={toolbarBtnStyle('#818cf8', 'rgba(99, 102, 241, 0.1)')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'; }}
            >
              <Download size={16} />
            </button>
          )}

          {/* Clear Button */}
          {!filterPromptId && history.length > 0 && (
            <button 
              onClick={handleClear}
              title={t.history.clear}
              style={toolbarBtnStyle('#ef4444', 'rgba(239, 68, 68, 0.1)')}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Content List */}
        <div style={styles.content}>
          {filteredHistory.length === 0 ? (
            <div className="history-modal-empty">
              <div className="empty-icon-wrapper">
                <Clock size={32} strokeWidth={1.5} />
              </div>
              <p>{t.history.noHistory}</p>
              <span>{search ? t.history.noHistoryHintSearch : (filterPromptId ? t.history.noHistoryHintPrompt : t.history.noHistoryHintGlobal)}</span>
            </div>
          ) : (
            Object.entries(groupedHistory).map(([dateLabel, records]) => (
              <div key={dateLabel}>
                <div style={stickyHeaderStyle}>
                  <Calendar size={12} />
                  <span>{dateLabel}</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#27272a', marginLeft: '4px' }}></div>
                </div>
                
                <div className="history-group-items">
                  {records.map(record => (
                    <HistoryItem 
                      key={record.id} 
                      record={record} 
                      onRestore={() => onRestore(record)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
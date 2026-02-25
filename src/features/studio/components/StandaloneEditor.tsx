/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { 
  Save, X, Tag, History, PenTool, Search, Download,
  RotateCcw, Sparkles, Clock, Plus, Trash2, AlertTriangle
} from 'lucide-react';
import { usePromptStore, useSettingsStore, useUIStore, useVariableStore } from '@/stores';
import { useLanguage } from '@/shared/hooks';
import { formatDistanceToNow, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale'; 
import { Toast } from '@/shared/components/Toast'; 
import { VariableModal } from '@/features/variables/components/VariableModal';
import { useTrash } from '@/features/trash/contexts/TrashContext';

// --- ROBUST WORD DIFF UTILITY ---
const computeDiff = (oldText: string = '', newText: string = '') => {
    if (!oldText) oldText = "";
    if (!newText) newText = "";

    const splitText = (t: string) => t.split(/(\s+)/);
    const oldTokens = splitText(oldText);
    const newTokens = splitText(newText);
    
    let output = [];
    let i = 0; 
    let j = 0;

    while (i < oldTokens.length || j < newTokens.length) {
        if (i < oldTokens.length && j < newTokens.length && oldTokens[i] === newTokens[j]) {
            output.push({ type: 'same', value: oldTokens[i] });
            i++; j++;
        } else {
            let synced = false;
            for (let offset = 1; offset < 10; offset++) {
                if (j + offset < newTokens.length && oldTokens[i] === newTokens[j + offset]) {
                    for (let k = 0; k < offset; k++) output.push({ type: 'add', value: newTokens[j + k] });
                    j += offset;
                    synced = true;
                    break;
                }
                if (i + offset < oldTokens.length && newTokens[j] === oldTokens[i + offset]) {
                    for (let k = 0; k < offset; k++) output.push({ type: 'remove', value: oldTokens[i + k] });
                    i += offset;
                    synced = true;
                    break;
                }
            }
            if (!synced) {
                if (i < oldTokens.length) { output.push({ type: 'remove', value: oldTokens[i] }); i++; }
                if (j < newTokens.length) { output.push({ type: 'add', value: newTokens[j] }); j++; }
            }
        }
    }
    return output;
};

// --- VERSION HISTORY MODAL ---
interface VersionHistoryModalProps {
    promptId: string;
    onClose: () => void;
    onRestore: (version: any) => void;
    t: any;
    language: string; 
}

function VersionHistoryModal({ promptId, onClose, onRestore, t, language }: VersionHistoryModalProps) {
    const { getPromptVersions } = useSettingsStore();
    const versions = getPromptVersions(promptId) || [];
    const [searchTerm, setSearchTerm] = useState('');

    const dateLocale = language === 'es' ? es : enUS;

    // Handle JSON Export
    const handleDownloadJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(versions, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `history_${promptId}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const filteredVersions = useMemo(() => {
        const sorted = [...versions].sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        if (!searchTerm.trim()) return sorted;
        
        const q = searchTerm.toLowerCase();
        return sorted.filter(v => 
            v.content?.toLowerCase().includes(q) || 
            v.title?.toLowerCase().includes(q) ||
            format(new Date(v.timestamp), "PPpp", { locale: dateLocale }).toLowerCase().includes(q) ||
            v.tags?.some((tag: string) => tag.toLowerCase().includes(q))
        );
    }, [versions, searchTerm, dateLocale]);

    return (
        <div className="modal-overlay" style={{ zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
            <div 
                className="modal" 
                onClick={e => e.stopPropagation()} 
                style={{ 
                    width: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', 
                    backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}
            >
                <div className="modal-header" style={{ padding: '16px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e4e4e7', fontWeight: 700 }}>
                        <History size={18} /> {t.prompts.versions}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                {/* Toolbar: Search and Download Row */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #27272a', display: 'flex', gap: '12px', backgroundColor: '#1f1f23', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search history..."
                            style={{
                                width: '100%', backgroundColor: '#09090b', border: '1px solid #3f3f46',
                                borderRadius: '6px', padding: '6px 12px 6px 32px', fontSize: '13px',
                                color: '#e4e4e7', outline: 'none'
                            }}
                        />
                    </div>
                    <button 
                        onClick={handleDownloadJSON}
                        title="Download history as JSON"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: '32px', width: '32px', flexShrink: 0,
                            backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.4)', 
                            borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                    >
                        <Download size={16} />
                    </button>
                </div>

                <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredVersions.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#71717a', padding: '40px', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <History size={32} strokeWidth={1.5} />
                            <span>{searchTerm ? "No versions match your search." : "No history available for this prompt yet."}</span>
                        </div>
                    ) : (
                        filteredVersions.map((v: any, index: number) => {
                            let relativeTime = '';
                            let exactTime = '';
                            try {
                                const date = new Date(v.timestamp || Date.now());
                                relativeTime = formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
                                exactTime = format(date, "PPpp", { locale: dateLocale });
                            } catch (e) {
                                relativeTime = 'Unknown date';
                            }

                            // Diff against logically next item in the list
                            const prevVersion = filteredVersions[index + 1];
                            const diff = computeDiff(prevVersion ? prevVersion.content : '', v.content || '');
                            
                            return (
                                <div 
                                    key={v.timestamp || index} 
                                    style={{ 
                                        backgroundColor: '#27272a', borderRadius: '8px', border: '1px solid #3f3f46', 
                                        overflow: 'hidden', flexShrink: 0
                                    }}
                                >
                                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3f3f46', backgroundColor: '#202023' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7' }}>{exactTime}</span>
                                                {v.timestamp === Math.max(...versions.map((x:any)=>x.timestamp)) && (
                                                    <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#2563eb', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                                                        {t.prompts.latest}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#a1a1aa' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {relativeTime}</span>
                                                <span>•</span>
                                                <span>{t.prompts.chars.replace('{count}', v.content ? v.content.length : 0)}</span>
                                                <span>•</span>
                                                <span>{t.prompts.tagsCount.replace('{count}', v.tags ? v.tags.length : 0)}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onRestore(v)}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 12px', borderRadius: '6px', backgroundColor: 'transparent', 
                                                border: '1px solid #52525b', color: '#e4e4e7', cursor: 'pointer',
                                                fontSize: '11px', fontWeight: 600, transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3f3f46'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <RotateCcw size={12} /> {t.common.restore}
                                        </button>
                                    </div>

                                    <div style={{ 
                                        padding: '16px', fontSize: '13px', color: '#d4d4d8', fontFamily: 'monospace',
                                        lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: '#18181b',
                                        overflowX: 'auto'
                                    }}>
                                        {(!v.content || v.content.trim().length === 0) ? (
                                            <span style={{ color: '#71717a', fontStyle: 'italic' }}>(No content)</span>
                                        ) : (
                                            <div>
                                                {diff.map((part, i) => (
                                                    <span key={i} style={{ 
                                                        backgroundColor: part.type === 'add' ? 'rgba(34, 197, 94, 0.15)' : part.type === 'remove' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                                        color: part.type === 'add' ? '#4ade80' : part.type === 'remove' ? '#f87171' : 'inherit',
                                                        textDecoration: part.type === 'remove' ? 'line-through' : 'none',
                                                        borderRadius: '2px', padding: '0' 
                                                    }}>
                                                        {part.value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {v.tags && v.tags.length > 0 && (
                                        <div style={{ padding: '8px 16px', backgroundColor: '#202023', borderTop: '1px solid #3f3f46', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <Tag size={10} color="#71717a" />
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {v.tags.map((t: string) => (
                                                    <span key={t} style={{ fontSize: '10px', color: '#a1a1aa', border: '1px solid #3f3f46', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#27272a' }}>{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// --- CONFIRMATION OVERLAY ---
const ConfirmationOverlay = ({ 
    type, title, message, onConfirm, onCancel, confirmLabel, t 
}: { 
    type: 'delete' | 'discard', title: string, message: string, onConfirm: () => void, onCancel: () => void, confirmLabel: string, t: any 
}) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={e => e.stopPropagation()}>
        <div style={{ 
            width: '400px', backgroundColor: '#18181b', border: '1px solid #3f3f46', 
            borderRadius: '12px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
            display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                <AlertTriangle size={24} />
                <span style={{ fontSize: '18px', fontWeight: 700 }}>{title}</span>
            </div>
            
            <div style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5' }}>
                {message}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid #52525b', color: '#e4e4e7', cursor: 'pointer', fontWeight: 600 }}>
                    {type === 'discard' ? t.confirm.keepEditing : t.common.cancel}
                </button>
                <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: '6px', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
);

// --- MAIN EDITOR COMPONENT ---
export function StandaloneEditor() {
  const [promptId, setPromptId] = useState<string | null>(null);
  
  // Destructure 'init' to load data from disk
  const { prompts, updatePrompt, deletePrompt, init: initPrompts } = usePromptStore();
  
  const { getTagColor, getPromptVersions, addVersion } = useSettingsStore();
  const { moveToTrash } = useTrash();
  
  const { variables, addVariable } = useVariableStore();
  const { showToast, toastMessage, toastVariant, hideToast } = useUIStore(); 
  const { t, language } = useLanguage(); 

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const initialState = useRef<{ title: string, content: string, tags: string[] } | null>(null);
  
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0); // NEW: Track highlighted suggestion
  
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [variableSearch, setVariableSearch] = useState(''); 
  const [showCreateVarModal, setShowCreateVarModal] = useState(false);
  const [newlyCreatedVar, setNewlyCreatedVar] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const sharedEditorStyles: React.CSSProperties = {
      fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      letterSpacing: '0px',
      padding: '20px',
      margin: 0,
      border: 'none',
      boxSizing: 'border-box',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      overflowY: 'auto'
  };

  // Initialize Store on Mount
  useEffect(() => {
    initPrompts();
  }, [initPrompts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setPromptId(id);
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        setTitle(prompt.title);
        setContent(prompt.content || ''); 
        setTags(prompt.tags || []);
        
        if (!initialState.current) {
            initialState.current = {
                title: prompt.title,
                content: prompt.content || '',
                tags: [...(prompt.tags || [])]
            };
        }
      }
    }
  }, [prompts]);

  useEffect(() => {
    if (!showVariablePicker) setVariableSearch('');
  }, [showVariablePicker]);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + text + content.substring(end);
        setContent(newContent);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
    } else {
        setContent(prev => prev + text);
    }
  }, [content]);

  useEffect(() => {
    if (newlyCreatedVar) {
        insertAtCursor(`{{${newlyCreatedVar}}}`);
        setNewlyCreatedVar(null);
    }
  }, [newlyCreatedVar, insertAtCursor]);

  const handleSaveNewVariable = (data: any) => {
      const newVar = { ...data, id: Date.now().toString() };
      addVariable(newVar);
      setShowCreateVarModal(false);
      setNewlyCreatedVar(data.key); 
  };

  const versionCount = useMemo(() => {
      if (!promptId || !getPromptVersions) return 0;
      return getPromptVersions(promptId).length;
  }, [promptId, getPromptVersions, prompts]);

  const allTags = useMemo(() => {
    const uniqueTags = new Set<string>();
    prompts.forEach(p => p.tags.forEach(t => uniqueTags.add(t)));
    return Array.from(uniqueTags);
  }, [prompts]);

  useEffect(() => {
    if (!tagInput.trim()) {
        setTagSuggestions([]);
        setShowTagSuggestions(false);
        return;
    }
    const lowerInput = tagInput.toLowerCase();
    const matches = allTags.filter(tag => 
        tag.toLowerCase().includes(lowerInput) && !tags.includes(tag) 
    );
    setTagSuggestions(matches);
    setShowTagSuggestions(matches.length > 0);
    setHighlightedIndex(0); // Reset highlight on new search
  }, [tagInput, allTags, tags]);

  const handleSave = () => {
    if (promptId && title.trim()) {
      updatePrompt(promptId, { title, content, tags });
      addVersion(promptId, { 
          title, 
          content: content || '', 
          tags: [...tags],
          timestamp: Date.now() 
      });
      setTimeout(() => {
          window.close();
      }, 500); 
    }
  };

  const confirmDelete = () => {
      if (!promptId) return;
      const prompt = prompts.find(p => p.id === promptId);
      
      if (prompt) {
          moveToTrash({
              type: 'template',
              originalId: prompt.id,
              label: prompt.title,
              data: prompt,
              origin: 'studio'
          });
          
          deletePrompt(promptId);
          setTimeout(() => {
              window.close();
          }, 100);
      }
  };

  const handleCancel = () => {
      if (!initialState.current) {
          window.close();
          return;
      }

      const isDirty = 
          title !== initialState.current.title ||
          content !== initialState.current.content ||
          JSON.stringify(tags) !== JSON.stringify(initialState.current.tags);

      if (isDirty) {
          setShowDiscardConfirm(true);
      } else {
          window.close();
      }
  };

  const handleRestore = (version: any) => {
      if (version) {
          setTitle(version.title);
          setContent(version.content);
          setTags(version.tags || []);
          setShowHistory(false);
          if (showToast) showToast(t.prompts.versionRestored, 'success');
      }
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
        setTags([...tags, t]);
        setTagInput('');
        setShowTagSuggestions(false);
    }
  };

  const addSuggestion = (tag: string) => {
      if (!tags.includes(tag)) {
          setTags([...tags, tag]);
          setTagInput('');
          setShowTagSuggestions(false);
      }
  };

  // Keyboard navigation for tag suggestions
  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    // Navigation inside suggestions
    if (showTagSuggestions && tagSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev < tagSuggestions.length - 1 ? prev + 1 : 0));
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : tagSuggestions.length - 1));
            return;
        }
        if (e.key === 'Tab' || e.key === 'ArrowRight') {
            e.preventDefault();
            addSuggestion(tagSuggestions[highlightedIndex]);
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            addSuggestion(tagSuggestions[highlightedIndex]);
            return;
        }
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
        setTags(tags.slice(0, -1));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
        backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const renderHighlightedContent = () => {
    const text = content.endsWith('\n') ? content + ' ' : content; 
    return text.split(/(\{\{[a-zA-Z0-9_]+\}\})/).map((part, index) => {
        if (/^\{\{[a-zA-Z0-9_]+\}\}$/.test(part)) {
            return <span key={index} style={{ color: '#ed5e17', fontWeight: 700 }}>{part}</span>;
        }
        return <span key={index}>{part}</span>;
    });
  };

  const filteredVariables = useMemo(() => {
    if (!variableSearch.trim()) return variables;
    const q = variableSearch.toLowerCase();
    return variables.filter(v => v.key.toLowerCase().includes(q));
  }, [variables, variableSearch]);

  if (!promptId) return <div style={{ color: '#fff', padding: 20 }}>Loading...</div>;

  return (
    <div className="app-container" style={{ flexDirection: 'column', height: '100vh', backgroundColor: '#09090b', color: '#e4e4e7' }} onClick={() => setShowVariablePicker(false)}>
      
      {toastMessage && <Toast message={toastMessage} onClose={hideToast} variant={toastVariant} />}

      {showHistory && (
          <VersionHistoryModal 
              promptId={promptId}
              onClose={() => setShowHistory(false)}
              onRestore={handleRestore}
              t={t}
              language={language} 
          />
      )}

      <VariableModal
          isOpen={showCreateVarModal}
          onClose={() => setShowCreateVarModal(false)}
          onSave={handleSaveNewVariable}
          initialData={undefined}
          initialFocus="name"
          // ADDED: Required props for Validation
          prompts={prompts} 
          showToast={showToast} 
      />

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #27272a', backgroundColor: '#09090b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7' }}>
            <PenTool size={16} /> 
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.prompts.editPrompt}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCancel} title={t.common.close} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
            </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, padding: '16px', borderBottom: '1px solid #27272a' }}>
            <input 
                ref={titleRef} 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="title-input" 
                placeholder={t.prompts.promptTitlePlaceholder} 
                style={{ fontSize: '18px', width: '100%', borderBottom: '2px solid #3b82f6', borderRadius: 0, paddingBottom: '6px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', color: '#e4e4e7', fontWeight: 600 }} 
            />
        </div>
        
        <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid #27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Tag size={14} color="#71717a" />
                <div className="tags-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                    {tags.map((tag) => (
                        <div key={tag} style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: getTagColor(tag), color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, gap: '6px' }}>
                            <span>{tag}</span>
                            <button onClick={() => handleRemoveTag(tag)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '14px', height: '14px', cursor: 'pointer', color: 'white' }}><X size={9} strokeWidth={3} /></button>
                        </div>
                    ))}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <input 
                            value={tagInput} 
                            onChange={e => setTagInput(e.target.value)} 
                            onKeyDown={handleKeyDownTag} 
                            onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                            placeholder={tags.length === 0 ? t.prompts.addTag : t.prompts.addTag} 
                            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#a1a1aa', fontSize: '12px', minWidth: '80px' }} 
                        />
                        {showTagSuggestions && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100, minWidth: '150px', maxHeight: '200px', overflowY: 'auto' }}>
                                {tagSuggestions.map((tag, index) => (
                                    <div 
                                        key={tag} 
                                        onClick={() => addSuggestion(tag)} 
                                        style={{ 
                                            padding: '6px 12px', fontSize: '12px', color: '#e4e4e7', 
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                            backgroundColor: index === highlightedIndex ? '#3f3f46' : 'transparent' 
                                        }} 
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                    >
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTagColor(tag) }}></div>{tag}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="editor-toolbar" style={{ flexShrink: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <button 
                className="toolbar-btn" 
                onClick={(e) => { e.stopPropagation(); setShowVariablePicker(!showVariablePicker); }}
                title={t.prompts.insertVariable} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showVariablePicker ? '#27272a' : 'transparent', border: '1px solid #3f3f46', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', color: '#e4e4e7', fontSize: '13px' }}
            >
                <span style={{ display: 'flex', alignItems: 'center', color: '#ed5e17', fontWeight: 700 }}><span>{'{'}</span><Sparkles size={10} style={{ margin: '0 1px' }} /><span>{'}'}</span></span>
                <span>{t.prompts.insertVariable}</span>
            </button>

            {showVariablePicker && (
                <div 
                    onClick={e => e.stopPropagation()}
                    style={{ 
                        position: 'absolute', top: '100%', left: '16px', marginTop: '4px',
                        width: '250px', maxHeight: '300px', backgroundColor: '#18181b', 
                        border: '1px solid #3f3f46', borderRadius: '8px', 
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', zIndex: 100,
                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}
                >
                    {/* HEADER with + New Variable Button (Styled) */}
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>{t.variables.selectVariable}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowCreateVarModal(true); setShowVariablePicker(false); }}
                            style={{ 
                                background: '#ea580c',        // Solid Orange Fill
                                border: '1px solid #ea580c',  // Solid Orange Border
                                borderRadius: '4px',
                                color: 'white',               // White Font
                                padding: '2px 8px',          
                                fontSize: '11px', 
                                fontWeight: 600, 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px' 
                            }}
                        >
                            <Plus size={12} /> {t.variables.newVariable}
                        </button>
                    </div>

                    <div style={{ padding: '8px', borderBottom: '1px solid #27272a' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={12} style={{ position: 'absolute', left: '8px', color: '#71717a', pointerEvents: 'none' }} />
                            <input 
                                value={variableSearch}
                                onChange={(e) => setVariableSearch(e.target.value)}
                                placeholder="Search variables..."
                                autoFocus
                                style={{
                                    width: '100%', backgroundColor: '#27272a', border: '1px solid #3f3f46',
                                    borderRadius: '4px', padding: '6px 8px 6px 26px', fontSize: '12px',
                                    color: '#e4e4e7', outline: 'none'
                                }}
                                onClick={e => e.stopPropagation()} 
                            />
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
                        
                        {filteredVariables.map((v) => (
                            <button 
                                key={v.id}
                                onClick={() => { insertAtCursor(`{{${v.key}}}`); setShowVariablePicker(false); }}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', 
                                    padding: '8px', border: 'none', background: 'transparent', 
                                    color: '#e4e4e7', fontSize: '12px', cursor: 'pointer', textAlign: 'left', borderRadius: '4px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#27272a'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ width: '20px', display: 'flex', justifyContent: 'center', color: '#ed5e17' }}>
                                    <Sparkles size={12} />
                                </div>
                                <span style={{ fontFamily: 'monospace' }}>{v.key}</span>
                            </button>
                        ))}
                        {filteredVariables.length === 0 && variableSearch && (
                            <div style={{ padding: '8px', textAlign: 'center', color: '#71717a', fontSize: '11px' }}>
                                No matching variables
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    title={t.tooltips.deletePrompt}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                >
                    <Trash2 size={16} />
                </button>

                <button onClick={() => setShowHistory(true)} title={t.prompts.versions} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '12px' }}>
                    <History size={16} /> 
                    {versionCount > 0 && <span style={{ backgroundColor: '#3b82f6', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>{versionCount}</span>}
                </button>
            </div>
        </div>

        {/* EDITOR AREA */}
        <div className="editor-body" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}> 
            <div 
                ref={backdropRef}
                style={{
                    ...sharedEditorStyles,
                    color: '#d4d4d8', 
                    pointerEvents: 'none', 
                    zIndex: 0
                }}
            >
                {renderHighlightedContent()}
            </div>

            <textarea 
                ref={textareaRef}
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                onScroll={handleScroll}
                className="content-textarea" 
                placeholder={t.prompts.promptContentPlaceholder} 
                spellCheck={false}
                style={{ 
                    ...sharedEditorStyles,
                    color: 'transparent', 
                    background: 'transparent', 
                    caretColor: 'white', 
                    zIndex: 1,
                    outline: 'none',
                    resize: 'none'
                }} 
            />
        </div>
      </div>

      <div className="modal-footer" style={{ borderTop: '1px solid #27272a', padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#18181b' }}>
          <button onClick={handleCancel} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>{t.common.cancel}</button>
          <button id="save-btn" onClick={handleSave} disabled={!title.trim()} style={{ padding: '8px 20px', borderRadius: '6px', background: title.trim() ? '#a855f7' : '#3f3f46', border: 'none', color: 'white', fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', opacity: title.trim() ? 1 : 0.6 }}>
              <Save size={16} /> {t.common.save}
          </button>
      </div>

      {showDeleteConfirm && (
          <ConfirmationOverlay 
              type="delete"
              title={t.confirm.deleteConfirmTitle}
              message={t.prompts.deletePromptConfirm.replace('{title}', title)}
              onConfirm={confirmDelete}
              onCancel={() => setShowDeleteConfirm(false)}
              confirmLabel={t.variables.moveToTrash} 
              t={t}
          />
      )}

      {showDiscardConfirm && (
          <ConfirmationOverlay 
              type="discard"
              title={t.confirm.unsavedChanges}
              message={t.confirm.unsavedChangesMessage}
              onConfirm={() => window.close()} 
              onCancel={() => setShowDiscardConfirm(false)}
              confirmLabel={t.confirm.discardChanges}
              t={t}
          />
      )}
    </div>
  );
}

export default StandaloneEditor;
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, PenTool, Save, Tag, Sparkles, AlertTriangle, Plus, Search } from 'lucide-react';
import { useLanguage } from '@/shared/hooks';
import { useVariableStore, useProfileStore } from '@/stores'; 

interface CreatePromptModalProps {
    onClose: () => void;
    onSave: (title: string, content: string, tags: string[], profileIds: string[]) => void;
    getTagColor: (tag: string) => string;
    onCreateNewVariable: () => void;
    pendingVariable: string | null;
    onClearPendingVariable: () => void;
    allTags: string[];
}

export function CreatePromptModal({ 
    onClose, 
    onSave, 
    getTagColor, 
    onCreateNewVariable, 
    pendingVariable, 
    onClearPendingVariable, 
    allTags 
}: CreatePromptModalProps) {
    const { t } = useLanguage(); 
    
    // Get active profile from store
    const activeProfileId = useProfileStore((state) => state.activeProfileId);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0); 

    const [showVariablePicker, setShowVariablePicker] = useState(false);
    const [variableSearch, setVariableSearch] = useState(''); 
    const variables = useVariableStore(state => state.variables);

    const titleRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const sharedEditorStyles: React.CSSProperties = {
        fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
        fontSize: '14px', lineHeight: '1.6', letterSpacing: '0px', padding: '20px',
        margin: 0, border: 'none', boxSizing: 'border-box', whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word', width: '100%', height: '100%', position: 'absolute',
        top: 0, left: 0, overflowY: 'auto'
    };

    useEffect(() => titleRef.current?.focus(), []);

    useEffect(() => {
        if (!showVariablePicker) setVariableSearch('');
    }, [showVariablePicker]);

    // Tag Autocomplete
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
        setHighlightedIndex(0); 
    }, [tagInput, allTags, tags]);

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
        if (pendingVariable) {
            insertAtCursor(`{{${pendingVariable}}}`);
            onClearPendingVariable();
        }
    }, [pendingVariable, insertAtCursor, onClearPendingVariable]);

    const addTag = (tagToAdd: string) => {
        const t = tagToAdd.trim();
        if (t && !tags.includes(t)) {
            setTags([...tags, t]);
            setTagInput('');
            setShowTagSuggestions(false);
        }
    };

    const handleKeyDownTag = (e: React.KeyboardEvent) => {
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
            if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'Enter') {
                e.preventDefault();
                addTag(tagSuggestions[highlightedIndex]);
                return;
            }
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim()) addTag(tagInput);
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

    const handleCancel = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (title.trim().length > 0 || content.trim().length > 0 || tags.length > 0) {
            setShowCancelConfirm(true);
        } else {
            onClose();
        }
    };

    // --- DEBUG SAVE HANDLER ---
    const handleSave = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        console.log("SAVE CLICKED", { title, content });

        if (!title.trim() || !content.trim()) {
            console.log("Validation failed: Title or Content missing");
            return;
        }

        // Calculate Profile Assignment
        let profilesToAssign: string[] = [];
        try {
            console.log("Active Profile ID:", activeProfileId);
            if (activeProfileId && activeProfileId !== 'general') {
                profilesToAssign = [activeProfileId];
            }
        } catch (err) {
            console.error("Profile Error:", err);
        }

        console.log("Assigning to profiles:", profilesToAssign);
        
        // Call Parent
        if (typeof onSave === 'function') {
             onSave(title, content, tags, profilesToAssign);
        } else {
             console.error("onSave is not a function!", onSave);
        }
        
        onClose(); 
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

    return ReactDOM.createPortal(
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
            <div className="modal" onClick={e => { e.stopPropagation(); setShowVariablePicker(false); setShowTagSuggestions(false); }} style={{ width: '900px', height: '750px', maxWidth: '95vw', maxHeight: '95vh', display: 'flex', flexDirection: 'column', backgroundColor: '#09090b', position: 'relative' }}>
                
                <div className="modal-header" style={{ padding: '12px 16px', minHeight: 'auto', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7' }}>
                        <PenTool size={14} /> 
                        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.prompts.newPrompt}</span>
                    </div>
                    <button className="modal-close" onClick={handleCancel}><X size={16} /></button>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    
                    <div className="editor-header" style={{ flexShrink: 0, padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                        <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} className="title-input" placeholder={t.prompts.promptTitlePlaceholder} style={{ fontSize: '18px', width: '100%', borderBottom: '2px solid #3b82f6', borderRadius: 0, paddingBottom: '6px', background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none', color: '#e4e4e7' }} />
                    </div>
                    
                    <div className="tags-section" style={{ flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                                            backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100, minWidth: '150px',
                                            maxHeight: '200px', overflowY: 'auto'
                                        }}>
                                            {tagSuggestions.map((tag, index) => (
                                                <div 
                                                    key={tag} onClick={() => addTag(tag)}
                                                    style={{
                                                        padding: '6px 12px', fontSize: '12px', color: '#e4e4e7',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                        backgroundColor: index === highlightedIndex ? '#3f3f46' : 'transparent'
                                                    }}
                                                    onMouseEnter={() => setHighlightedIndex(index)}
                                                >
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTagColor(tag) }}></div>
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="editor-toolbar" style={{ flexShrink: 0, padding: '8px 16px', position: 'relative' }}>
                        <button 
                            className="toolbar-btn" 
                            onClick={(e) => { e.stopPropagation(); setShowVariablePicker(!showVariablePicker); }} 
                            title={t.prompts.insertVariable} 
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showVariablePicker ? '#27272a' : 'transparent', border: '1px solid #3f3f46', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', color: '#e4e4e7', fontSize: '13px' }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', color: '#ed5e17', fontWeight: 700 }}>
                                <span>{'{'}</span><Sparkles size={10} style={{ margin: '0 1px' }} /><span>{'}'}</span>
                            </span>
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
                                <div style={{ padding: '8px 12px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>{t.variables.selectVariable}</span>
                                    <button onClick={(e) => { e.stopPropagation(); onCreateNewVariable(); setShowVariablePicker(false); }} style={{ background: '#ea580c', border: '1px solid #ea580c', borderRadius: '4px', color: 'white', padding: '2px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={12} /> {t.variables.newVariable}</button>
                                </div>
                                <div style={{ padding: '8px', borderBottom: '1px solid #27272a' }}>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <Search size={12} style={{ position: 'absolute', left: '8px', color: '#71717a', pointerEvents: 'none' }} />
                                        <input value={variableSearch} onChange={(e) => setVariableSearch(e.target.value)} placeholder="Search variables..." autoFocus style={{ width: '100%', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '4px', padding: '6px 8px 6px 26px', fontSize: '12px', color: '#e4e4e7', outline: 'none' }} onClick={e => e.stopPropagation()} />
                                    </div>
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
                                    {filteredVariables.map((v) => (
                                        <button key={v.id} onClick={() => { insertAtCursor(`{{${v.key}}}`); setShowVariablePicker(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px', border: 'none', background: 'transparent', color: '#e4e4e7', fontSize: '12px', cursor: 'pointer', textAlign: 'left', borderRadius: '4px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#27272a'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <div style={{ width: '20px', display: 'flex', justifyContent: 'center', color: '#ed5e17' }}><Sparkles size={12} /></div>
                                            <span style={{ fontFamily: 'monospace' }}>{v.key}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="editor-body" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <div 
                            ref={backdropRef}
                            style={{ ...sharedEditorStyles, color: '#d4d4d8', pointerEvents: 'none', zIndex: 0 }}
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
                            style={{ ...sharedEditorStyles, color: 'transparent', background: 'transparent', caretColor: 'white', zIndex: 1, outline: 'none', resize: 'none' }} 
                        />
                    </div>
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#18181b' }}>
                    <button onClick={handleCancel} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>{t.common.cancel}</button>
                    <button 
                        onClick={handleSave} 
                        disabled={!title.trim() || !content.trim()} 
                        style={{ padding: '8px 20px', borderRadius: '6px', background: title.trim() && content.trim() ? '#a855f7' : '#3f3f46', border: 'none', color: 'white', fontWeight: 600, cursor: title.trim() && content.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', opacity: title.trim() && content.trim() ? 1 : 0.6 }}
                    >
                        <Save size={16} /> {t.common.save}
                    </button>
                </div>

                {showCancelConfirm && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); setShowCancelConfirm(false); }}>
                        <div onClick={e => e.stopPropagation()} style={{ width: '400px', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                                <AlertTriangle size={24} />
                                <span style={{ fontSize: '18px', fontWeight: 700 }}>{t.confirm.cancelNewPromptTitle}</span>
                            </div>
                            <div style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5' }}>{t.confirm.cancelNewPromptMessage}</div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                <button onClick={() => setShowCancelConfirm(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', border: '1px solid #52525b', color: '#e4e4e7', cursor: 'pointer', fontWeight: 600 }}>{t.confirm.keepEditing}</button>
                                <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>{t.confirm.discard}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
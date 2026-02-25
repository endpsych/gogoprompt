/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, Zap, Save, Pencil, Type, FileText, MousePointerClick } from 'lucide-react';
import { Prompt, PromptComponent } from '@/types';
import { HighlightSettings } from '@/shared/utils/highlighting';
import { InjectionMenu, AddonCategory, AddonItem } from '@/features/addons/components/InjectionMenu'; 
import { useLanguage } from '@/shared/hooks';
import { useVariableModalLogic } from '@/features/deck/hooks/useVariableModalLogic';
import { PromptPreview } from './PromptPreview';
import { VariableList } from '@/features/deck/components/DeploymentVariableList';
import { AddonList } from '@/features/addons/components/AddonList';
import { MINI_PROMPTS } from '@/features/addons/constants/miniPrompts'; 
import { useTrash } from '@/features/trash/contexts/TrashContext';
import { isAutoPasteModifierHeld, isAutoEnterModifierHeld } from '@/features/settings/components/HotkeysPanel';

interface VariableModalProps {
  prompt: Prompt;
  components: PromptComponent[];
  highlightSettings: HighlightSettings;
  getTypeColor: (typeId: string) => string;
  onClose: () => void;
  onConfirm: (finalContent: string, values: Record<string, string>, instructions: any[], usedTemplate: string, e?: React.MouseEvent) => void;
  initialValues?: Record<string, string>;
  initialInstructions?: string;
  isOnboarding?: boolean;
}

export function VariableModal(props: VariableModalProps) {
  const { t } = useLanguage();
  const logic = useVariableModalLogic(props.prompt, props.initialValues, props.initialInstructions);
  const { moveToTrash } = useTrash();

  const [showDeployWarning, setShowDeployWarning] = useState(false);
  
  // Track modifier keys for Deploy button highlighting
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const [isDeployHovered, setIsDeployHovered] = useState(false);

  const hasVariables = logic.vars.length > 0;

  const [categories, setCategories] = useState<AddonCategory[]>(() => {
    try {
      const saved = localStorage.getItem('deck_mode_addons');
      return saved ? JSON.parse(saved) : MINI_PROMPTS;
    } catch (e) {
      console.error("Failed to load addons", e);
      return MINI_PROMPTS;
    }
  });

  const [editTarget, setEditTarget] = useState<{ type: 'category' | 'item', name: string, data?: any } | null>(null);

  useEffect(() => {
    localStorage.setItem('deck_mode_addons', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    const handleExternalUpdate = () => {
       const saved = localStorage.getItem('deck_mode_addons');
       if (saved) {
           setCategories(JSON.parse(saved));
       }
    };
    window.addEventListener('deck_addons_updated', handleExternalUpdate);
    return () => window.removeEventListener('deck_addons_updated', handleExternalUpdate);
  }, []);

  // Track modifier keys globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlHeld(true);
      if (e.key === 'Alt') setIsAltHeld(true);
      if (e.key === 'Shift') setIsShiftHeld(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlHeld(false);
      if (e.key === 'Alt') setIsAltHeld(false);
      if (e.key === 'Shift') setIsShiftHeld(false);
    };

    const handleBlur = () => {
      setIsCtrlHeld(false);
      setIsAltHeld(false);
      setIsShiftHeld(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const effectiveBaseContent = useMemo(() => {
    const baseItem = logic.structureItems.find(i => i.type === 'base');
    if (baseItem && typeof baseItem.text === 'string' && baseItem.text.length > 0) {
        return baseItem.text;
    }
    return props.prompt.content;
  }, [logic.structureItems, props.prompt.content]);

  const fillWithPlaceholders = (text: string) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const val = logic.variableValues[varName.trim()];
      return (val && val !== '') ? val : match;
    });
  };

  const getFinalContent = () => {
    return logic.structureItems
      .map(item => {
        if (item.type === 'base') {
          return fillWithPlaceholders(effectiveBaseContent);
        }
        return item.text;
      })
      .join('\n\n');
  };

  const handleConfirm = (e: React.MouseEvent) => {
    const addonsData = logic.structureItems
      .filter(i => i.type === 'addon')
      .map(a => ({ text: a.text, isBespoke: a.isBespoke }));
    
    // Create a synthetic event-like object with the tracked modifier states
    const modifierInfo = {
      ctrlKey: isCtrlHeld,
      altKey: isAltHeld,
      shiftKey: isShiftHeld,
      metaKey: isCtrlHeld, // Treat meta same as ctrl
    };
    
    // Pass the modifier info so parent can detect modifiers
    props.onConfirm(getFinalContent(), logic.variableValues, addonsData, effectiveBaseContent, modifierInfo as any);
  };

  const handleMenuSelect = (val: string) => {
      let finalVal = val;
      if (val === '{{variable}}') {
          finalVal = `{{${t.variables.defaultVariable || 'variable'}}}`;
      }
      
      logic.handleInjection(finalVal);
      logic.setShowMenu(false);
  };

  const handleSaveCategory = (name: string) => {
    if (!categories.some(c => c.category === name)) {
      setCategories([...categories, { category: name, items: [] }]);
    }
  };

  const handleSaveSubCategory = (parentName: string, subName: string) => {
    setCategories(prev => {
      const updateRecursive = (cats: AddonCategory[]): AddonCategory[] => {
        return cats.map(cat => {
          const cName = cat.name || cat.category;
          if (cName === parentName) {
             const currentSubs = cat.subCategories || [];
             if (currentSubs.some(s => (s.name || s.category) === subName)) return cat;
             return { ...cat, subCategories: [...currentSubs, { category: subName, items: [] }] };
          }
          if (cat.subCategories) {
            return { ...cat, subCategories: updateRecursive(cat.subCategories) };
          }
          return cat;
        });
      };
      return updateRecursive(prev);
    });
  };

  const handleSaveAddon = (categoryName: string, label: string, content: string) => {
    setCategories(prev => {
      const updateRecursive = (cats: AddonCategory[]): AddonCategory[] => {
        return cats.map(cat => {
          const cName = cat.name || cat.category;
          if (cName === categoryName) {
            return {
              ...cat,
              items: [...cat.items, { label, value: content }]
            };
          }
          if (cat.subCategories) {
            return {
              ...cat,
              subCategories: updateRecursive(cat.subCategories)
            };
          }
          return cat;
        });
      };
      return updateRecursive(prev);
    });
  };

  const handleDeleteFromMenu = (target: { type: 'category'|'item', id?: string, name: string }) => {
    let deletedItemData: any = null;
    const deleteRecursive = (list: AddonCategory[], currentPath: string[]): AddonCategory[] => {
      return list.filter(cat => {
        const catName = cat.name || cat.category || "Untitled";
        if (target.type === 'category' && catName === target.name) {
          deletedItemData = { ...cat, path: currentPath }; 
          return false; 
        }
        if (target.type === 'item') {
           const itemIndex = cat.items.findIndex(i => i.label === target.name);
           if (itemIndex !== -1) {
             deletedItemData = { 
                ...cat.items[itemIndex], 
                parentCategory: catName,
                path: [...currentPath, catName] 
             }; 
             cat.items.splice(itemIndex, 1); 
             return true; 
           }
        }
        if (cat.subCategories && cat.subCategories.length > 0) {
          cat.subCategories = deleteRecursive(cat.subCategories, [...currentPath, catName]);
        }
        return true; 
      });
    };
    
    setCategories(prev => {
        const deepCopy = JSON.parse(JSON.stringify(prev)); 
        const updatedList = deleteRecursive(deepCopy, []); 
        if (deletedItemData) {
             moveToTrash({
                 originalId: target.id || Date.now().toString(),
                 type: target.type === 'category' ? 'category' : 'addon',
                 label: target.name,
                 origin: 'deck_mode',
                 data: deletedItemData
             });
        }
        return updatedList;
    });
  };

  const handleEditFromMenu = (target: { type: 'category'|'item', id?: string, name: string }) => {
    if (target.type === 'category') {
        setEditTarget({ type: 'category', name: target.name });
        return;
    }
    let foundData: AddonItem | null = null;
    const findRecursive = (list: AddonCategory[]) => {
        for (const cat of list) {
            const item = cat.items.find(i => i.label === target.name);
            if (item) {
                foundData = item;
                return;
            }
            if (cat.subCategories) findRecursive(cat.subCategories);
        }
    };
    findRecursive(categories);
    if (foundData) {
        setEditTarget({ type: 'item', name: target.name, data: foundData });
    }
  };

  const applyEdit = (newName: string, newContent?: string) => {
    if (!editTarget) return;
    setCategories(prev => {
        const deepCopy = JSON.parse(JSON.stringify(prev));
        const updateRecursive = (list: AddonCategory[]) => {
            for (const cat of list) {
                const catName = cat.name || cat.category;
                if (editTarget.type === 'category' && catName === editTarget.name) {
                    cat.category = newName; 
                    if(cat.name) cat.name = newName;
                    return;
                }
                if (editTarget.type === 'item') {
                    const item = cat.items.find(i => i.label === editTarget.name);
                    if (item) {
                        item.label = newName;
                        if (newContent !== undefined) item.value = newContent;
                        return;
                    }
                }
                if (cat.subCategories) updateRecursive(cat.subCategories);
            }
        };
        updateRecursive(deepCopy);
        return deepCopy;
    });
    setEditTarget(null);
  };

  const allFilled = logic.vars.every(v => logic.variableValues[v]?.trim());
  const menuBtnRef = useRef<HTMLButtonElement>(null); 
  const highlightIndex = logic.draggedIndex !== null ? logic.draggedIndex : logic.hoveredItemIndex;

  // Check if current modifiers match auto-paste or auto-enter hotkeys
  const showAutoPasteHighlight = allFilled && isAutoPasteModifierHeld(isCtrlHeld, isAltHeld, isShiftHeld);
  const showAutoEnterHighlight = allFilled && isAutoEnterModifierHeld(isCtrlHeld, isAltHeld, isShiftHeld);

  // Get deploy action label based on current modifiers
  const getDeployActionLabel = (): { label: string; color: string } => {
    if (showAutoEnterHighlight) return { label: 'Auto-Send', color: '#ef4444' };
    if (showAutoPasteHighlight) return { label: 'Auto-Paste', color: '#3b82f6' };
    return { label: 'Copy', color: '#22c55e' };
  };

  // Determine deploy button style based on modifiers
  const getDeployButtonStyle = (): React.CSSProperties => {
    const baseDisabled: React.CSSProperties = {
      backgroundColor: '#3f3f46',
      color: '#71717a',
      cursor: 'not-allowed',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '6px 16px',
      fontWeight: 600,
      borderRadius: '6px',
      transition: 'background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      width: '160px' 
    };

    if (!allFilled) return baseDisabled;

    if (showAutoEnterHighlight) {
      // Auto-Send = Red
      return {
        ...baseDisabled,
        backgroundColor: '#ef4444',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.4)',
        border: '1px solid #f87171'
      };
    } else if (showAutoPasteHighlight) {
      // Auto-Paste = Blue
      return {
        ...baseDisabled,
        backgroundColor: '#3b82f6',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)',
        border: '1px solid #60a5fa'
      };
    }

    // Default Copy = Green
    return {
      ...baseDisabled,
      backgroundColor: '#22c55e',
      color: 'white',
      cursor: 'pointer'
    };
  };

  return (
    <div className="deck-variable-overlay">
      <style>{`
        .deck-variable-modal ::-webkit-scrollbar { width: 8px; height: 8px; }
        .deck-variable-modal ::-webkit-scrollbar-track { background: #27272a; border-radius: 4px; }
        .deck-variable-modal ::-webkit-scrollbar-thumb { background: #52525b; border-radius: 4px; }
        .deck-variable-modal ::-webkit-scrollbar-thumb:hover { background: #71717a; }

        @keyframes orangeInputPulse {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.6); border-color: rgba(249, 115, 22, 0.8); }
          70% { box-shadow: 0 0 0 6px rgba(249, 115, 22, 0); border-color: rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); border-color: rgba(249, 115, 22, 0.8); }
        }

        .onboarding-inputs input, .onboarding-inputs textarea {
            animation: orangeInputPulse 2s infinite;
            border: 1px solid #f97316 !important;
        }

        .modal-onboarding-message {
            background-color: #f97316;
            color: white;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            margin-top: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            animation: fadeIn 0.4s ease-out;
            position: relative;
            align-self: center;
        }
        
        .modal-onboarding-message::before {
            content: '';
            position: absolute;
            top: -6px;
            left: 55%; 
            transform: translateX(-50%);
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 6px solid #f97316;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div 
        className="deck-variable-modal"
        onClick={(e) => { e.stopPropagation(); logic.setShowMenu(false); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.ctrlKey) handleConfirm(e as any);
          if (e.key === 'Escape') props.onClose();
        }}
        style={{ resize: 'both', overflow: 'hidden', minWidth: '900px', minHeight: '600px', height: '700px', maxWidth: '95vw', maxHeight: '95vh', display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <div className="deck-variable-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#818cf8' }}>{t.prompts.preDeployment}</span>
            <span style={{ color: '#52525b', fontWeight: 600 }}>:</span>
            <span style={{ fontSize: '16px', color: '#e4e4e7', fontWeight: 500 }}>{props.prompt.title}</span>
          </div>
          <button className="deck-variable-close" onClick={props.onClose}><X size={16} /></button>
        </div>
        
        <div className="deck-variable-body" style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', paddingBottom: '10px', alignItems: 'stretch' }}>
          {/* LEFT SIDE: Variables and Structure */}
          <div style={{ flex: 1, height: '100%', minWidth: '350px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'hidden', boxSizing: 'border-box' }}>
            <div className={props.isOnboarding ? "onboarding-inputs" : ""} style={{ display: 'flex', flexDirection: 'column' }}>
                {hasVariables && (
                  <VariableList 
                    prompt={props.prompt} 
                    vars={logic.vars} 
                    variableValues={logic.variableValues} 
                    hoveredVariable={logic.hoveredVariable}
                    setHoveredVariable={logic.setHoveredVariable} 
                    onVariableChange={logic.handleVariableChange}
                  />
                )}
                
                {props.isOnboarding && hasVariables && (
                    <div className="modal-onboarding-message">
                        <MousePointerClick size={16} fill="currentColor" />
                        <span>
                            Fill in the variable values above, then click 
                            <span style={{ 
                                color: 'white', 
                                backgroundColor: '#3b82f6', 
                                border: '1px solid #3b82f6', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                marginLeft: '5px', 
                                marginRight: '5px' 
                            }}>Deploy</span>
                            to send your prompt. Use <strong>Ctrl</strong> to auto-paste or <strong>Ctrl+Alt</strong> to auto-send!
                        </span>
                    </div>
                )}
            </div>
            
            <AddonList 
              items={logic.structureItems} promptTitle={props.prompt.title} hoveredIndex={highlightIndex}
              draggedIndex={logic.draggedIndex} editingIndex={logic.editingIndex} editValue={logic.editValue}
              setHoveredIndex={logic.setHoveredItemIndex} onRemove={logic.handleRemoveItem} 
              onStartEdit={(idx, txt) => logic.startEditingItem(idx, txt, 'list')}
              onSave={logic.saveItem} onEditChange={logic.setEditValue} onCancelEdit={() => { logic.setEditingIndex(null); logic.setEditValue(''); }}
              onDragStart={logic.handleDragStart} onDragEnd={logic.handleDragEnd} onDragOver={logic.handleDragOver}
              onToggleMenu={logic.toggleMenu} menuBtnRef={menuBtnRef} 
              editSource={logic.editSource}
            />
          </div> 
          
          {/* DIVIDER */}
          <div 
            ref={logic.dividerRef} onMouseDown={logic.handleResizeStart}
            style={{ width: '10px', height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 10, position: 'relative' }}
          >
             <div style={{ width: '1px', height: '100%', background: '#3f3f46' }}></div>
             <div style={{ position: 'absolute', width: '4px', height: '40px', background: '#52525b', borderRadius: '2px' }} />
          </div>
          
          {/* RIGHT SIDE: Preview */}
          <div className="deck-variable-preview" style={{ width: `${logic.previewWidth}px`, height: '100%', flex: '0 0 auto', borderRight: 'none', borderBottom: 'none', padding: '16px 16px 16px 0', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <PromptPreview 
              content={effectiveBaseContent} 
              components={props.components} 
              highlightSettings={props.highlightSettings}
              variableValues={logic.variableValues} 
              structureItems={logic.structureItems} 
              getTypeColor={props.getTypeColor}
              hoveredVariable={logic.hoveredVariable} 
              hoveredItemIndex={highlightIndex}
              setHoveredItemIndex={logic.setHoveredItemIndex}
              onCopy={async () => { await navigator.clipboard.writeText(getFinalContent()); logic.setHeaderCopied(true); setTimeout(() => logic.setHeaderCopied(false), 2000); }}
              headerCopied={logic.headerCopied}
              editingIndex={logic.editingIndex}
              editValue={logic.editValue}
              onEditChange={logic.setEditValue}
              onSave={logic.saveItem}
              onCancelEdit={() => { logic.setEditingIndex(null); logic.setEditValue(''); }}
              onStartEdit={(idx, txt) => logic.startEditingItem(idx, txt, 'preview')} 
              editSource={logic.editSource} 
            />
          </div>
        </div>

        <div className="deck-variable-footer" style={{ justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #3f3f46', marginTop: 0 }}>
          <div className="deck-variable-actions">
            <button className="deck-variable-btn cancel" onClick={props.onClose} style={{ marginRight: '12px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>{t.common.cancel}</button>
            
            <div 
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseEnter={() => { if (!allFilled) setShowDeployWarning(true); setIsDeployHovered(true); }}
              onMouseLeave={() => { setShowDeployWarning(false); setIsDeployHovered(false); }}
            >
              <button 
                className="deck-variable-btn confirm" 
                onClick={handleConfirm} 
                disabled={!allFilled} 
                style={getDeployButtonStyle()}
              >
                Deploy: {getDeployActionLabel().label}
              </button>

              {showDeployWarning && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 10px)',
                  right: 0,
                  backgroundColor: '#27272a',
                  border: '1px solid #eab308',
                  color: '#eab308',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  zIndex: 50,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                }}>
                  {t.prompts.warningVariables}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {logic.showMenu && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, cursor: 'default' }} onClick={() => logic.setShowMenu(false)}>
          <div 
            onMouseDown={logic.handleMenuMouseDown} onClick={e => e.stopPropagation()} 
            style={{ position: 'fixed', top: logic.menuPosition.y, left: logic.menuPosition.x, cursor: logic.isDraggingMenu ? 'grabbing' : 'default', display: 'flex', flexDirection: 'column' }}
          >
            <InjectionMenu 
              categories={categories}
              onSelect={handleMenuSelect} 
              onCreateCategory={handleSaveCategory} 
              onCreateSubCategory={handleSaveSubCategory}
              onCreateAddon={handleSaveAddon} 
              onDelete={handleDeleteFromMenu} 
              onEdit={handleEditFromMenu} 
              direction="bottom" 
            />
          </div>
        </div>,
        document.body
      )}

      {editTarget && editTarget.type === 'category' && (
        <EditCategoryModal 
            currentName={editTarget.name}
            onClose={() => setEditTarget(null)}
            onConfirm={(newName) => applyEdit(newName)}
            t={t}
        />
      )}
      
      {editTarget && editTarget.type === 'item' && editTarget.data && (
        <EditAddonModal 
            currentLabel={editTarget.name}
            currentContent={editTarget.data.value}
            onClose={() => setEditTarget(null)}
            onConfirm={(newLabel, newContent) => applyEdit(newLabel, newContent)}
            t={t}
        />
      )}

    </div>
  );
}

const EditCategoryModal = ({ currentName, onClose, onConfirm, t }: { currentName: string, onClose: () => void, onConfirm: (name: string) => void, t: any }) => {
    const [val, setVal] = useState(currentName);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => inputRef.current?.focus(), []);
    return ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200200 }} onClick={(e) => {e.stopPropagation(); onClose();}}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', width: '380px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '16px' }}>
                    <Pencil size={18} />
                    <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>{t.prompts.renameCategory}</span>
                </div>
                <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: 'white', marginBottom: '16px' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #52525b', color: '#e4e4e7', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>{t.common.cancel}</button>
                    <button onClick={() => { if(val.trim()) onConfirm(val.trim()); }} style={{ background: '#f59e0b', border: 'none', color: 'black', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>{t.common.save}</button>
                </div>
            </div>
        </div>, document.body
    );
};

const EditAddonModal = ({ currentLabel, currentContent, onClose, onConfirm, t }: { currentLabel: string, currentContent: string, onClose: () => void, onConfirm: (label: string, content: string) => void, t: any }) => {
    const [label, setLabel] = useState(currentLabel);
    const [content, setContent] = useState(currentContent);
    const labelRef = useRef<HTMLInputElement>(null);
    useEffect(() => labelRef.current?.focus(), []);
    return ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200200 }} onClick={(e) => {e.stopPropagation(); onClose();}}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', width: '450px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '16px' }}>
                    <Pencil size={18} />
                    <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>{t.components.editComponent}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <Type size={14} color="#71717a"/>
                        <input ref={labelRef} value={label} onChange={e => setLabel(e.target.value)} placeholder={t.components.componentName} style={{ flex:1, padding: '10px', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: 'white' }} />
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                        <FileText size={14} color="#71717a" style={{marginTop:'12px'}}/>
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t.components.componentContent} style={{ flex:1, height:'100px', padding: '10px', borderRadius: '6px', background: '#27272a', border: '1px solid #3f3f46', color: 'white', resize:'none' }} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #52525b', color: '#e4e4e7', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>{t.common.cancel}</button>
                    <button onClick={() => { if(label.trim() && content.trim()) onConfirm(label.trim(), content.trim()); }} style={{ background: '#10b981', border: 'none', color: 'black', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>{t.confirm.saveChanges}</button>
                </div>
            </div>
        </div>, document.body
    );
};

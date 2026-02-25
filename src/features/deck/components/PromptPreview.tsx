import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Pencil } from 'lucide-react';
import { highlightContent, buildStyleFromHighlight, HighlightSettings } from '@/shared/utils/highlighting';
import { PromptComponent } from '@/types';
import { StructureItem } from '@/features/deck/hooks/useVariableModalLogic'; 
import { useLanguage } from '@/shared/hooks';

// --- HELPER COMPONENTS ---

const TextAreaEditor = ({ val, onChange, onSave, onCancel, shouldFocus, t }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
      if (ref.current && shouldFocus) {
          ref.current.focus();
          adjustHeight();
      }
  }, [shouldFocus]);

  const adjustHeight = () => {
      if (ref.current && backdropRef.current) {
          ref.current.style.height = 'auto';
          const newHeight = ref.current.scrollHeight + 'px';
          ref.current.style.height = newHeight;
          backdropRef.current.style.height = newHeight;
      }
  };

  const handleScroll = () => {
      if (ref.current && backdropRef.current) {
          backdropRef.current.scrollTop = ref.current.scrollTop;
      }
  };

  const getVarCounts = (text: string) => {
      const matches = text.match(/\{\{[^}]+\}\}/g) || [];
      const counts: Record<string, number> = {};
      matches.forEach(m => {
          counts[m] = (counts[m] || 0) + 1;
      });
      return counts;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      const currentCursorPos = e.target.selectionStart; 
      const currentCounts = getVarCounts(val);
      const newCounts = getVarCounts(newVal);

      for (const [key, count] of Object.entries(currentCounts)) {
          if ((newCounts[key] || 0) < count) {
              setWarning(t?.prompts?.variableProtected || "Variables inside the prompt text cannot be deleted");
              setTimeout(() => setWarning(null), 2000);
              
              e.target.value = val;
              
              const diff = val.length - newVal.length;
              const restorePos = currentCursorPos + diff;
              e.target.setSelectionRange(restorePos, restorePos);
              return; 
          }
      }

      setWarning(null);
      onChange(newVal);
      adjustHeight();
  };

  const renderHighlights = (text: string) => {
      const parts = text.split(/(\{\{[^}]+\}\})/g);
      return parts.map((part, i) => {
          if (part.match(/^\{\{[^}]+\}\}$/)) {
              return <span key={i} style={{ color: '#f97316' }}>{part}</span>;
          }
          return <span key={i}>{part}</span>;
      });
  };

  const commonStyle: React.CSSProperties = {
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      lineHeight: '1.5',
      padding: '8px',
      margin: 0,
      border: '1px solid',
      boxSizing: 'border-box',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      letterSpacing: 'normal',
      wordSpacing: 'normal',
      width: '100%',
      height: '100%',
      textAlign: 'left',
      tabSize: 4,
      fontVariantLigatures: 'none',
      fontKerning: 'none',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
  };

  return (
      <div style={{ width: '100%', position: 'relative', minHeight: '60px' }}>
          <div 
              ref={backdropRef}
              style={{
                  ...commonStyle,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  color: '#e4e4e7', 
                  borderColor: 'transparent', 
                  pointerEvents: 'none', 
                  overflow: 'hidden',
                  zIndex: 0,
              }}
          >
              {renderHighlights(val)}
              {val.endsWith('\n') && <br />} 
          </div>

          <textarea
              ref={ref}
              value={val}
              onChange={handleChange}
              onScroll={handleScroll}
              onBlur={onSave}
              onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSave();
                  }
                  if(e.key === 'Escape') onCancel();
              }}
              spellCheck={false}
              style={{
                  ...commonStyle,
                  position: 'relative',
                  zIndex: 1,
                  background: 'transparent',
                  color: 'transparent', 
                  caretColor: '#e4e4e7',
                  borderColor: warning ? '#ef4444' : '#52525b',
                  borderStyle: warning ? 'solid' : 'dashed',
                  borderRadius: '4px',
                  resize: 'none',
                  outline: 'none',
                  display: 'block',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  WebkitTextFillColor: 'transparent',
              }}
          />
          
          {warning && (
              <div style={{ 
                  position: 'absolute', 
                  bottom: '-20px', 
                  left: 0, 
                  color: '#ef4444', 
                  fontSize: '11px', 
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 0.2s ease-in-out',
                  zIndex: 10
              }}>
                  {warning}
              </div>
          )}
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }
            textarea::selection {
                background: rgba(168, 85, 247, 0.3); 
                color: transparent; 
            }
          `}</style>
      </div>
  );
};

// Copy Button Component for Preview Overlay
const PreviewCopyBtn = ({ text, color }: { text: string; color: string }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();
  
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <button 
        onClick={handleCopy} 
        title={t.common.copy}
        style={{ 
            background: '#27272a', 
            border: `1px solid ${color}`,
            color: color, 
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center',
            opacity: 0.9
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    );
};

// --- MAIN COMPONENT ---

interface PromptPreviewProps {
  content: string;
  components: PromptComponent[];
  highlightSettings: HighlightSettings;
  variableValues: Record<string, string>;
  structureItems: StructureItem[];
  getTypeColor: (typeId: string) => string;
  hoveredVariable: string | null;
  hoveredItemIndex: number | null;
  setHoveredItemIndex: (index: number | null) => void;
  onCopy: () => void;
  headerCopied: boolean;
  
  editingIndex?: number | null;
  editValue?: string;
  editSource?: 'list' | 'preview' | null;
  onEditChange?: (val: string) => void;
  onSave?: (index: number) => void;
  onCancelEdit?: () => void;
  onStartEdit?: (index: number, text: string) => void;
}

export const PromptPreview = ({
  content,
  components,
  highlightSettings,
  variableValues,
  structureItems,
  getTypeColor,
  hoveredVariable,
  hoveredItemIndex,
  setHoveredItemIndex, 
  onCopy,
  headerCopied,
  editingIndex,
  editValue,
  editSource,
  onEditChange,
  onSave,
  onCancelEdit,
  onStartEdit
}: PromptPreviewProps) => {
  const { t } = useLanguage();

  // --- Colors ---
  const ORANGE_TEXT = '#f97316';
  const ORANGE_GLOW = 'rgba(249, 115, 22, 0.4)';
  const PURPLE_TEXT = '#a855f7';
  const PURPLE_GLOW = 'rgba(168, 85, 247, 0.4)';
  
  // Base Hex Colors
  const GREEN_COLOR = '#10b981';
  const BLUE_COLOR = '#3b82f6';

  const renderBaseTemplate = () => {
    const segments = highlightContent(content, components, highlightSettings);
    
    return segments.map((s, i) => {
      if (s.type === 'normal') return <span key={i}>{s.text}</span>;
      
      if (s.type === 'variable') {
        const varName = s.text.replace(/\{\{|\}\}/g, '').trim();
        const value = variableValues[varName];
        const isHovered = varName === hoveredVariable;
        const isFilled = value && value.trim() !== '';

        let style: React.CSSProperties = {};
        if (highlightSettings.enabled) {
           style = buildStyleFromHighlight(highlightSettings.variableStyle, highlightSettings.variableColor);
        }

        if (isFilled) {
          return (
            <span key={i} style={{ 
              color: PURPLE_TEXT, 
              fontWeight: 500,
              ...(isHovered ? { 
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                padding: '0 2px', 
                borderRadius: '4px',
                boxShadow: `0 0 8px ${PURPLE_GLOW}`
              } : {})
            }}>
              {value}
            </span>
          );
        } else {
          style = {
            ...style,
            color: ORANGE_TEXT, 
            ...(isHovered ? {
              backgroundColor: 'rgba(249, 115, 22, 0.2)', 
              borderRadius: '4px',
              padding: '0 2px',
              transition: 'all 0.2s',
              boxShadow: `0 0 8px ${ORANGE_GLOW}`,
              zIndex: 10,
              position: 'relative'
            } : {})
          };
          return <span key={i} style={style}>{s.text}</span>;
        }
      }
      
      if (highlightSettings.enabled) {
          const color = getTypeColor(s.componentType || 'other');
          const style = buildStyleFromHighlight(highlightSettings.componentStyle, color);
          return <span key={i} style={style}>{s.text}</span>;
      }
      
      return <span key={i}>{s.text}</span>;
    });
  };

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: 'rgba(0, 0, 0, 0.2)', 
      border: '1px solid #3f3f46', 
      borderRadius: '8px', 
      overflow: 'hidden', 
      height: '100%' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 16px', 
        borderBottom: '1px solid #3f3f46', 
        backgroundColor: 'rgba(255, 255, 255, 0.02)' 
      }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          color: '#a1a1aa', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em' 
        }}>
          {t.prompts.promptPreview}
        </div>
        
        <button 
          onClick={onCopy}
          title={headerCopied ? t.common.copied : t.tooltips.copy}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            color: headerCopied ? '#10b981' : '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {headerCopied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ whiteSpace: 'pre-wrap', paddingBottom: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {structureItems.map((item, index) => {
            const isEditing = editingIndex === index;
            const isHovered = index === hoveredItemIndex;
            const showButtons = isHovered && !isEditing;

            const handleEditClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (onStartEdit) {
                    const currentText = item.type === 'base' ? content : item.text;
                    onStartEdit(index, currentText);
                }
            };

            if (isEditing && onEditChange && onSave && onCancelEdit) {
                return (
                    <TextAreaEditor 
                        key={item.id} 
                        val={editValue || ''} 
                        onChange={onEditChange} 
                        onSave={() => onSave(index)} 
                        onCancel={onCancelEdit}
                        shouldFocus={editSource === 'preview'} 
                        t={t}
                    />
                );
            }

            // --- 1. Base Prompt Card (Purple) ---
            if (item.type === 'base') {
              return (
                <div 
                  key={item.id}
                  onMouseEnter={() => setHoveredItemIndex(index)}
                  onMouseLeave={() => setHoveredItemIndex(null)}
                  onDoubleClick={handleEditClick}
                  style={{
                    position: 'relative',
                    transition: 'all 0.2s',
                    borderRadius: '4px',
                    ...(isHovered ? {
                      boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.4)', 
                      backgroundColor: 'rgba(168, 85, 247, 0.05)',
                      padding: '4px',
                      margin: '-4px' 
                    } : {})
                  }}
                >
                  {renderBaseTemplate()}
                  
                  {/* ACTIONS OVERLAY */}
                  {showButtons && onStartEdit && (
                      <div style={{ 
                          position: 'absolute', 
                          bottom: '4px', 
                          right: '4px', 
                          display: 'flex', 
                          gap: '4px',
                          zIndex: 20 
                      }}>
                          <PreviewCopyBtn text={content} color="rgba(168, 85, 247, 0.4)" />
                          <button
                            onClick={handleEditClick}
                            style={{
                                background: '#27272a',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                color: '#a855f7',
                                borderRadius: '4px',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title={t.common.edit}
                          >
                              <Pencil size={12} />
                          </button>
                      </div>
                  )}
                </div>
              );
            }

            // --- 2. Addon Cards (Blue/Green) ---
            const isBespoke = item.isBespoke;
            
            // RGB strings for opacity logic
            const rgbString = isBespoke ? '59, 130, 246' : '16, 185, 129';
            const baseColorHex = isBespoke ? BLUE_COLOR : GREEN_COLOR;

            return (
              <div 
                key={item.id} 
                onMouseEnter={() => setHoveredItemIndex(index)}
                onMouseLeave={() => setHoveredItemIndex(null)}
                onDoubleClick={handleEditClick}
                style={{
                    position: 'relative',
                    transition: 'all 0.2s',
                    borderRadius: '4px',
                    color: baseColorHex,
                    ...(isHovered ? {
                      boxShadow: `0 0 0 2px rgba(${rgbString}, 0.4)`, 
                      backgroundColor: `rgba(${rgbString}, 0.05)`,
                      padding: '4px',
                      margin: '-4px' 
                    } : {})
                }}
              >
                  {item.text}

                  {/* ACTIONS OVERLAY */}
                  {showButtons && onStartEdit && (
                      <div style={{ 
                          position: 'absolute', 
                          bottom: '4px', 
                          right: '4px', 
                          display: 'flex', 
                          gap: '4px',
                          zIndex: 20 
                      }}>
                          <PreviewCopyBtn text={item.text} color={`rgba(${rgbString}, 0.4)`} />
                          <button
                            onClick={handleEditClick}
                            style={{
                                background: '#27272a',
                                border: `1px solid rgba(${rgbString}, 0.4)`,
                                color: baseColorHex,
                                borderRadius: '4px',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title={t.common.edit}
                          >
                              <Pencil size={12} />
                          </button>
                      </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
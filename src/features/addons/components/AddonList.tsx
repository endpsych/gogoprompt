import React, { useState } from 'react';
import { Trash2, Copy, Pencil, Check, GripVertical, Plus, FileText, Lightbulb } from 'lucide-react';
import { StructureItem } from '@/features/deck/hooks/useVariableModalLogic';
import { useLanguage } from '@/shared/hooks';

const CopyBtn = ({ text, color }: { text: string; color: string }) => {
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
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : color, padding: '2px', display: 'flex', alignItems: 'center' }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
};

interface AddonListProps {
  items: StructureItem[];
  hoveredIndex: number | null;
  draggedIndex: number | null;
  editingIndex: number | null;
  editValue: string;
  promptTitle: string;
  setHoveredIndex: (idx: number | null) => void;
  onRemove: (idx: number) => void;
  onStartEdit: (idx: number, text: string) => void;
  onSave: (idx: number) => void;
  onEditChange: (val: string) => void;
  onCancelEdit: () => void;
  onDragStart: (idx: number) => void;
  onDragEnd: () => void;
  onDragOver: (targetIdx: number) => void;
  onToggleMenu: (e: React.MouseEvent) => void;
  menuBtnRef: React.RefObject<HTMLButtonElement>;
  editSource?: 'list' | 'preview' | null;
}

export const AddonList = ({
  items,
  hoveredIndex,
  draggedIndex,
  editingIndex,
  editValue,
  promptTitle,
  setHoveredIndex,
  onRemove,
  onStartEdit,
  onSave,
  onEditChange,
  onCancelEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onToggleMenu,
  menuBtnRef,
  editSource
}: AddonListProps) => {
  const { t } = useLanguage();
  
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', String(index));
    onDragStart(index);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    onDragOver(index);
  };

  const sectionTitleStyle = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#a1a1aa',
    textTransform: 'uppercase' as 'uppercase',
    marginBottom: '0',
    letterSpacing: '0.05em'
  };

  const titleCardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px', 
    borderBottom: '1px solid #3f3f46',
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  };

  const panelContentAreaStyle = {
    flex: 1,
    overflowY: 'auto' as 'auto',
    padding: '16px',
  };

  // Colors
  const PURPLE_COLOR = '#a855f7'; 
  const PURPLE_BORDER = 'rgba(168, 85, 247, 0.4)';
  const GREEN_COLOR = '#10b981';
  const BLUE_COLOR = '#3b82f6';

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: 'rgba(0, 0, 0, 0.2)', 
      border: '1px solid #3f3f46', 
      borderRadius: '8px', 
      minHeight: 0,
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <div style={titleCardHeaderStyle}>
        <div style={sectionTitleStyle}>{t.prompts.promptStructure}</div>
        
        <div style={{ alignSelf: 'flex-start' }}>
          <button 
            ref={menuBtnRef}
            className="deck-variable-btn" 
            onClick={onToggleMenu}
            style={{ 
              padding: '4px 8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: '#10b981',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> {t.prompts.addComponent}
          </button>
        </div>
      </div>
      
      {/* List Body */}
      <div style={{ 
        ...panelContentAreaStyle, 
        paddingRight: '12px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px' 
      }}>
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const isBase = item.type === 'base';
          const isBespoke = item.isBespoke;
          
          // Only enter edit mode in List if the source is 'list'
          const isEditing = editingIndex === idx && editSource === 'list';
          
          let mainColor, dimBorder, txtColor;

          if (isBase) {
            mainColor = PURPLE_COLOR;
            dimBorder = PURPLE_BORDER;
            txtColor = '#e9d5ff'; 
          } else {
            mainColor = isBespoke ? BLUE_COLOR : GREEN_COLOR;
            dimBorder = isBespoke ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)';
            txtColor = isBespoke ? '#dbeafe' : '#d1fae5';
          }

          const Icon = isBespoke ? Lightbulb : Plus;

          return (
            <div 
              key={item.id}
              draggable={true} 
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOverItem(e, idx)}
              onDragEnd={onDragEnd}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                // We keep onStartEdit for double click if desired, or remove it to block list editing for base completely
                if (!isBase) {
                    onStartEdit(idx, item.text);
                }
              }}
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                gap: '8px', 
                alignItems: 'center', 
                width: '100%',
                opacity: draggedIndex === idx ? 0.5 : 1, 
                cursor: 'grab' 
              }}
            >
              <div 
                style={{ 
                  color: '#52525b', 
                  cursor: 'grab', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  paddingRight: '2px',
                  opacity: 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#a1a1aa'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#52525b'}
              >
                <GripVertical size={14} />
              </div>

              <div style={{
                backgroundColor: '#27272a', 
                border: `1px solid ${dimBorder}`,
                color: mainColor,
                width: '28px',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {idx + 1}.
              </div>

              <div style={{
                flex: 1,
                height: '32px',
                backgroundColor: '#27272a',
                border: isHovered ? `1px solid ${mainColor}` : `1px solid ${dimBorder}`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s'
              }}>
                {/* CONTENT RENDERING */}
                {isEditing ? (
                  <input
                    autoFocus={editSource === 'list'}
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSave(idx);
                      if (e.key === 'Escape') onCancelEdit();
                    }}
                    onBlur={() => onSave(idx)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: txtColor,
                      fontSize: '13px',
                      padding: 0
                    }}
                  />
                ) : isBase ? (
                  // BASE TEMPLATE (Static)
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color={PURPLE_COLOR} />
                    <span style={{ color: txtColor, fontSize: '13px', fontStyle: 'italic', fontWeight: 500 }}>
                      Prompt: {promptTitle}
                    </span>
                  </div>
                ) : (
                  // ADDON VIEW
                  <div style={{ 
                    flex: 1, 
                    overflow: 'hidden', 
                    position: 'relative', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px' 
                  }}>
                    <Icon size={14} color={mainColor} />
                    <span 
                      title={item.text}
                      style={{ 
                        whiteSpace: 'nowrap', 
                        color: txtColor, 
                        fontSize: '13px' 
                      }}
                    >
                      {item.text || (isBespoke ? "Type bespoke instruction..." : "")}
                    </span>
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '30px',
                      background: 'linear-gradient(90deg, transparent, #27272a)',
                      pointerEvents: 'none'
                    }}></div>
                  </div>
                )}

                {/* ACTIONS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', flexShrink: 0, zIndex: 5 }}>
                  {isEditing ? (
                    <button
                      onClick={() => onSave(idx)}
                      style={{ background: 'none', border: 'none', color: mainColor, cursor: 'pointer', opacity: 1, padding: '2px', display: 'flex', alignItems: 'center' }}
                      title={t.common.save}
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    <>
                      {/* EDIT BUTTON - Hidden for Base Card */}
                      {!isBase && (
                        <button
                          onClick={() => onStartEdit(idx, item.text)}
                          style={{ background: 'none', border: 'none', color: mainColor, cursor: 'pointer', opacity: 0.7, padding: '2px', display: 'flex', alignItems: 'center' }}
                          title={t.components.editComponent}
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      
                      {/* COPY BUTTON - Available for all */}
                      <CopyBtn text={isBase && !item.text ? "Original Base Content..." : item.text} color={mainColor} />
                      
                      {/* DELETE BUTTON - Hidden for Base Card */}
                      {!isBase && (
                        <button 
                          onClick={() => onRemove(idx)}
                          style={{ background: 'none', border: 'none', color: mainColor, cursor: 'pointer', opacity: 0.7, padding: '2px', display: 'flex', alignItems: 'center' }}
                          title={t.components.deleteComponent}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
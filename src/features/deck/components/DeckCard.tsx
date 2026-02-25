/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useMemo } from 'react';
import { Check, Pencil, ClipboardList, Plus, Sparkles, Clock, Zap, MousePointerClick } from 'lucide-react'; 
import { Prompt, PromptComponent } from '@/types';
import { highlightContent, buildStyleFromHighlight, HighlightSettings } from '@/shared/utils/highlighting';
import { CARD_DISPLAY_MODE, LINE_HEIGHT_PX } from '@/shared/utils/preferences';
import { hasVariables } from '@/features/variables/components/VariableFiller';
import { openEditorWindow } from '@/shared/utils/storage/electron';

interface DeckCardProps {
  prompt: Prompt;
  index: number; 
  displayNumber: number;
  components: PromptComponent[];
  highlightSettings: HighlightSettings;
  getTypeColor: (id: string) => string;
  getTagColor: (tag: string) => string;
  cardMaxLines: number;
  copiedId: string | null;
  isDragging: boolean;
  isDragOver: boolean;
  dropPosition: 'before' | 'after' | null;
  dragHandlers: {
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
  };
  onCardClick: (prompt: Prompt, e: React.MouseEvent) => void;
  onTextInsert: (prompt: Prompt, e: React.MouseEvent) => void;
  onQuickDeploy: (e: React.MouseEvent) => void;
  onOpenDeployment: (prompt: Prompt) => void; 
  onShowHistory: (promptId: string) => void;
  t: any; 
  onDelete?: () => void;
  onSave?: (title: string, content: string, tags: string[]) => void;
  
  // Targeted highlighting props
  highlightInsertBtn?: boolean;
  highlightQuickDeployBtn?: boolean; 
  onboardingMessage?: string;
  
  // Modifier key state for visual feedback
  isCtrlHeld?: boolean;
  isAltHeld?: boolean;
}

// Internal helper for consistent "Ghost" buttons
interface ActionButtonProps {
    onClick: (e: React.MouseEvent) => void;
    icon: React.ElementType;
    baseColor: string;
    hoverBg: string;
    hoverColor?: string; 
    title: string;
    active?: boolean;
    highlight?: boolean;
    highlightColor?: string; 
    message?: string;
}

const ActionButton = ({ onClick, icon: Icon, baseColor, hoverBg, hoverColor, title, active = false, highlight, highlightColor, message }: ActionButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const effectiveHoverColor = hoverColor || '#ffffff';
    
    const hColor = highlightColor || '#3b82f6';
    const animName = hColor === '#f97316' ? 'orangeBtnPulse' : 'blueBtnPulse';
    const bgRgba = hColor === '#f97316' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(59, 130, 246, 0.1)';

    const style: React.CSSProperties = {
        background: isHovered || active ? hoverBg : 'transparent',
        border: '1px solid transparent',
        borderColor: isHovered || active ? baseColor : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '26px', 
        width: '26px',
        borderRadius: '6px',
        color: isHovered || active ? effectiveHoverColor : baseColor,
        transition: 'all 0.2s ease',
        opacity: isHovered || active ? 1 : 0.7,
        ...(highlight ? {
            border: `2px solid ${hColor}`,
            backgroundColor: bgRgba,
            opacity: 1,
            color: hColor,
            animation: `${animName} 2s infinite`,
            zIndex: 50 
        } : {})
    };

    return (
        <div style={{ position: 'relative' }}>
            {highlight && (
                <style>{`
                    @keyframes blueBtnPulse {
                        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6); }
                        70% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                    }
                    @keyframes orangeBtnPulse {
                        0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.6); }
                        70% { box-shadow: 0 0 0 6px rgba(249, 115, 22, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(5px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            )}

            {highlight && message && (
                <div style={{
                    position: 'absolute',
                    bottom: '40px', 
                    right: '-5px',  
                    width: '260px',
                    backgroundColor: hColor,
                    color: 'white',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: '1.4',
                    zIndex: 100,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    animation: 'fadeIn 0.3s ease-out',
                    pointerEvents: 'none', 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MousePointerClick size={16} fill="currentColor" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{message}</span>
                    </div>
                    
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '12px', 
                        width: 0, 
                        height: 0, 
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: `6px solid ${hColor}`
                    }} />
                </div>
            )}

            <button
                onClick={onClick}
                title={title}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={style}
            >
                <Icon size={14} strokeWidth={2} />
            </button>
        </div>
    );
};

export const DeckCard = React.memo(function DeckCard({
  prompt,
  displayNumber,
  components,
  highlightSettings,
  getTypeColor,
  getTagColor,
  cardMaxLines,
  copiedId,
  isDragging,
  isDragOver,
  dropPosition,
  dragHandlers,
  onCardClick,
  onTextInsert,
  onQuickDeploy, 
  onOpenDeployment,
  onShowHistory,
  t,
  highlightInsertBtn,
  highlightQuickDeployBtn, 
  onboardingMessage,
  isCtrlHeld = false,
  isAltHeld = false
}: DeckCardProps) {
  
  const [isHovered, setIsHovered] = useState(false);
  
  const hasVars = useMemo(() => hasVariables(prompt.content), [prompt.content]);
  const showContent = cardMaxLines >= 0;
  const showTags = cardMaxLines !== CARD_DISPLAY_MODE.TITLE_ONLY;
  const isCopied = copiedId === prompt.id;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditorWindow(prompt.id);
  };

  const handleHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowHistory(prompt.id);
  };

  const handleTextInsert = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTextInsert(prompt, e);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenDeployment(prompt);
  };

  const handleQuickDeploy = (e: React.MouseEvent) => {
      e.stopPropagation();
      onQuickDeploy(e);
  };

  const renderHighlightedContent = () => {
    if (!highlightSettings.enabled) return <span>{prompt.content}</span>;
    const segments = highlightContent(prompt.content, components, highlightSettings);
    return segments.map((s, i) => {
      if (s.type === 'normal') return <span key={i}>{s.text}</span>;
      let style: React.CSSProperties = {};
      if (s.type === 'variable') {
        style = buildStyleFromHighlight(highlightSettings.variableStyle, highlightSettings.variableColor);
      } else {
        const color = getTypeColor(s.componentType || 'other');
        style = buildStyleFromHighlight(highlightSettings.componentStyle, color);
      }
      return <span key={i} style={style}>{s.text}</span>;
    });
  };

  // Only show modifier highlight when BOTH hovered AND modifier is held AND it's a non-variable prompt
  const getModifierHighlightStyle = (): React.CSSProperties => {
    if (!isHovered || hasVars) {
      return {};
    }
    
    if (isCtrlHeld && isAltHeld) {
      // Ctrl+Alt = Auto-enter (red)
      return {
        boxShadow: '0 0 0 2px #ef4444, 0 0 12px rgba(239, 68, 68, 0.4)',
        borderColor: '#ef4444'
      };
    } else if (isCtrlHeld) {
      // Ctrl = Auto-paste (blue)
      return {
        boxShadow: '0 0 0 2px #3b82f6, 0 0 12px rgba(59, 130, 246, 0.4)',
        borderColor: '#3b82f6'
      };
    }
    
    return {};
  };

  const cardClassName = [
    'deck-mode-card',
    isCopied ? 'copied' : '',
    isDragging ? 'dragging' : '',
    isDragOver ? `drag-over drag-over-${dropPosition}` : '',
    !showContent ? 'compact' : ''
  ].filter(Boolean).join(' ');

  const contentStyle: React.CSSProperties = showContent ? { 
    maxHeight: cardMaxLines > 0 ? cardMaxLines * LINE_HEIGHT_PX : undefined, 
    overflow: 'hidden',
    lineHeight: `${LINE_HEIGHT_PX}px`,
  } : {};

  const modifierStyle = getModifierHighlightStyle();

  return (
    <div
      draggable
      onDragStart={(e) => dragHandlers.onDragStart(e, prompt.id)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={(e) => dragHandlers.onDragOver(e, prompt.id)}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={(e) => dragHandlers.onDrop(e, prompt.id)}
      className={cardClassName}
      onClick={(e) => onCardClick(prompt, e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...modifierStyle,
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease'
      }}
    >
      {/* HEADER */}
      <div className="deck-mode-card-header">
        <div className="deck-mode-card-title-group">
          <span className="deck-mode-card-number">{displayNumber}</span>
          
          {hasVars && (
            <div title={t.tooltips.hasVariables || 'Prompt has variables'} style={styles.varIndicator}>
                <span style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1, position: 'relative', top: '-1px' }}>{'{'}</span>
                <Sparkles size={11} strokeWidth={2.5} style={{ margin: '0 -1px' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1, position: 'relative', top: '-1px' }}>{'}'}</span>
            </div>
          )}

          <span className="deck-mode-card-title">{prompt.title}</span>
        </div>
        
        <div className="deck-mode-card-actions">
          <button 
            className="deck-mode-edit-btn"
            onClick={handleHistory}
            title={t.tooltips.viewHistory}
          >
            <Clock size={12} />
          </button>

          <button 
            className="deck-mode-edit-btn"
            onClick={handleEdit}
            title={t.tooltips.edit} 
          >
            <Pencil size={12} />
          </button>

          {isCopied && (
            <span className="deck-mode-card-icon">
              <Check size={14} />
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {showContent && (
        <div className="deck-mode-card-content" style={contentStyle}>
          {renderHighlightedContent()}
        </div>
      )}
      
      {/* FOOTER */}
      <div className="deck-mode-card-footer" style={styles.footerContainer}>
          
          {showTags && prompt.tags.length > 0 && (
              <div className="deck-mode-card-tags" style={styles.tagsWrapper}>
                  {prompt.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="deck-mode-tag-colored" 
                        style={{ backgroundColor: getTagColor(tag), ...styles.tagChip }}
                      >
                          {tag}
                      </span>
                  ))}
              </div>
          )}
          
          <div className="deck-mode-card-footer-actions" style={styles.actionsWrapper}>
              
              {hasVars && (
                <ActionButton 
                    onClick={handleQuickDeploy}
                    icon={Zap}
                    title={t.prompts.quickDeploy || 'Quick Deploy'} 
                    baseColor="#f97316"
                    hoverBg="rgba(249, 115, 22, 0.1)" 
                    hoverColor="#ffffff"
                    highlight={highlightQuickDeployBtn}
                    highlightColor="#f97316" 
                    message={onboardingMessage}
                />
              )}

              {!hasVars && (
                <ActionButton 
                    onClick={handleOpenModal}
                    icon={Plus}
                    title={t.prompts.preDeployment || 'Open Deployment'} 
                    baseColor="#10b981"               
                    hoverBg="rgba(16, 185, 129, 0.1)" 
                    hoverColor="#ffffff"              
                />
              )}

              <ActionButton 
                  onClick={handleTextInsert}
                  icon={ClipboardList}
                  title={t.tooltips.insertClipboard} 
                  baseColor="#3b82f6"
                  hoverBg="rgba(59, 130, 246, 0.1)"   
                  highlight={highlightInsertBtn}
                  message={onboardingMessage}
              />
          </div>
      </div>
    </div>
  );
});

const styles = {
    varIndicator: { 
        color: '#ed5e17', 
        display: 'flex', 
        alignItems: 'center',
        gap: '1px', 
        marginRight: '6px'
    } as React.CSSProperties,
    
    footerContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 2px 2px 2px', 
        minHeight: '20px',          
        borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
        marginTop: '4px',            
    } as React.CSSProperties,
    
    tagsWrapper: {
        display: 'flex', alignItems: 'center', borderTop: 'none', marginTop: 0, paddingTop: 0,
        flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', 
        maskImage: 'linear-gradient(to right, black 85%, transparent 100%)', 
        WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)', 
        minWidth: 0, flex: 1, marginRight: '8px', gap: '6px' 
    } as React.CSSProperties,
    tagChip: {
        whiteSpace: 'nowrap', flexShrink: 0 
    } as React.CSSProperties,
    actionsWrapper: {
        marginLeft: 'auto', marginRight: 0, display: 'flex', gap: '4px', alignItems: 'center', position: 'relative' 
    } as React.CSSProperties
};
/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, ArrowRight, List, MousePointerClick } from 'lucide-react';
import { Prompt } from '@/types';
import { useLanguage } from '@/shared/hooks';
import { useVariableStore, useSettingsStore } from '@/stores';
import { isAutoPasteModifierHeld, isAutoEnterModifierHeld } from '@/features/settings/components/HotkeysPanel';

interface MiniVariableModalProps {
  prompt: Prompt;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onConfirm: (finalContent: string, values: Record<string, string>, e?: React.MouseEvent) => void;
  initialValues?: Record<string, string>;
  isOnboarding?: boolean;
}

const parseVariable = (raw: string) => {
  const parts = raw.split(':');
  const name = parts[0].trim();
  let options: string[] = [];
  
  if (parts.length > 1) {
    options = parts[1].split('|').map(o => o.trim()).filter(Boolean);
  }
  return { name, options };
};

export function MiniVariableModal(props: MiniVariableModalProps) {
  const { t } = useLanguage();
  const [variableValues, setVariableValues] = useState<Record<string, string>>(props.initialValues || {});
  const modalRef = useRef<HTMLDivElement>(null);

  const { variables: globalVariables } = useVariableStore();
  const { deckViewMode } = useSettingsStore();

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Track modifier keys for Deploy button highlighting
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const [isDeployHovered, setIsDeployHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const placement = useMemo(() => {
    if (!props.anchorRect) return 'right';

    const POPUP_WIDTH = 400; 
    const POPUP_EST_HEIGHT = 350; 
    const GAP = 12;
    const SAFETY_MARGIN = 20;

    const fitsRight = (props.anchorRect.right + GAP + POPUP_WIDTH + SAFETY_MARGIN) <= windowSize.width;
    const fitsBottom = (props.anchorRect.bottom + GAP + POPUP_EST_HEIGHT + SAFETY_MARGIN) <= windowSize.height;

    if (deckViewMode === 'list') {
        return fitsBottom ? 'bottom' : 'top';
    }

    if (fitsRight) return 'right';
    if (fitsBottom) return 'bottom';
    return 'top';

  }, [props.anchorRect, deckViewMode, windowSize]);

  const variablesObj = useMemo(() => {
    const vars = new Map<string, string[]>(); 
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(props.prompt.content)) !== null) {
      const { name, options: inlineOptions } = parseVariable(match[1]);
      
      const existing = vars.get(name) || [];
      const globalVar = globalVariables.find((gv: any) => gv.key === name);
      let globalOptions: string[] = [];
      
      if (globalVar?.options) {
        globalOptions = Array.isArray(globalVar.options) ? globalVar.options : globalVar.options.split('|');
      } else if (globalVar?.value && typeof globalVar.value === 'string' && globalVar.value.includes('|')) {
         globalOptions = globalVar.value.split('|');
      }

      const mergedOptions = Array.from(new Set([...existing, ...inlineOptions, ...globalOptions]));
      vars.set(name, mergedOptions);
    }
    
    return Array.from(vars.entries()).map(([name, options]) => ({ name, options }));
  }, [props.prompt.content, globalVariables]);

  const handleValueChange = (varName: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [varName]: value }));
  };

  const getFinalContent = () => {
    return props.prompt.content.replace(/\{\{([^}]+)\}\}/g, (match, rawInner) => {
      const { name } = parseVariable(rawInner);
      return variableValues[name] || match;
    });
  };

  const handleConfirm = (e: React.MouseEvent) => {
    // Create a synthetic event-like object with the tracked modifier states
    // This is more reliable than e.ctrlKey when using portals
    const modifierInfo = {
      ctrlKey: isCtrlHeld,
      altKey: isAltHeld,
      shiftKey: isShiftHeld,
      metaKey: isCtrlHeld, // Treat meta same as ctrl
    };
    
    props.onConfirm(getFinalContent(), variableValues, modifierInfo as any);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isDropdown = target.closest('.var-dropdown-portal');

      if (modalRef.current && !modalRef.current.contains(target) && !isDropdown) {
        props.onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [props]);

  const style = useMemo(() => {
    if (!props.anchorRect) return {};
    
    let top, left;
    const GAP = 12;

    if (placement === 'bottom') {
        top = props.anchorRect.bottom + GAP;
        left = props.anchorRect.left + (props.anchorRect.width / 2);
    } else if (placement === 'top') {
        top = props.anchorRect.top - GAP;
        left = props.anchorRect.left + (props.anchorRect.width / 2);
    } else {
        top = props.anchorRect.top + (props.anchorRect.height / 2);
        left = props.anchorRect.right + GAP; 
    }

    return { top: `${top}px`, left: `${left}px`, position: 'fixed' as const };
  }, [props.anchorRect, placement]);

  const allFilled = variablesObj.length === 0 || variablesObj.every(v => variableValues[v.name]?.trim());

  // Check if current modifiers match auto-paste or auto-enter hotkeys
  const showAutoPasteHighlight = allFilled && isAutoPasteModifierHeld(isCtrlHeld, isAltHeld, isShiftHeld);
  const showAutoEnterHighlight = allFilled && isAutoEnterModifierHeld(isCtrlHeld, isAltHeld, isShiftHeld);

  // Get deploy action label based on current modifiers
  const getDeployActionLabel = (): { label: string; color: string } => {
    if (showAutoEnterHighlight) return { label: 'Auto-Send', color: '#ef4444' };
    if (showAutoPasteHighlight) return { label: 'Auto-Paste', color: '#3b82f6' };
    return { label: 'Copy', color: '#22c55e' };
  };

  const getDeployButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      background: 'transparent',
      fontSize: '11px',
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '4px 10px',
      borderRadius: '4px',
      transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
      width: '150px' // Fixed width to match Auto-Paste (longest label)
    };

    if (!allFilled) {
      return { ...baseStyle, color: '#3f3f46', cursor: 'not-allowed' };
    }

    if (showAutoEnterHighlight) {
      return {
        ...baseStyle,
        color: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.3)',
      };
    } else if (showAutoPasteHighlight) {
      return {
        ...baseStyle,
        color: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
      };
    }

    // Default Copy = Green
    return { 
      ...baseStyle, 
      color: '#22c55e',
      backgroundColor: isDeployHovered ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
    };
  };

  return (
    <>
      <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, zIndex: 9998, cursor: 'default' }} />

      <div 
        ref={modalRef}
        className={`deck-mini-popover ${props.isOnboarding ? 'onboarding' : ''}`}
        data-placement={placement}
        style={style}
        onKeyDown={(e) => {
          if (e.key === 'Escape') props.onClose();
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleConfirm(e as any);
        }}
      >
        <style>{`
          @keyframes orangeModalPulse {
            0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.6); border-color: rgba(249, 115, 22, 0.8); }
            70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); border-color: rgba(249, 115, 22, 0); }
            100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); border-color: rgba(249, 115, 22, 0.8); }
          }
          .deck-mini-popover.onboarding {
             animation: orangeModalPulse 2s infinite !important;
             border: 1px solid #f97316 !important;
          }
          .deck-mini-popover {
            z-index: 9999; width: 400px; background-color: #18181b; 
            border: 1px solid #27272a; border-radius: 12px;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
            display: flex; flex-direction: column; overflow: visible; 
          }
          .deck-mini-popover[data-placement="right"] { transform: translateY(-50%); animation: popInRight 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
          @keyframes popInRight { from { opacity: 0; transform: translateY(-50%) scale(0.95) translateX(-5px); } to { opacity: 1; transform: translateY(-50%) scale(1) translateX(0); } }
          .deck-mini-popover[data-placement="right"]::before {
            content: ''; position: absolute; top: 50%; left: -6px; width: 12px; height: 12px;
            background-color: #18181b; border-left: 1px solid #27272a; border-bottom: 1px solid #27272a;
            transform: translateY(-50%) rotate(45deg); z-index: 10000;
          }
          .deck-mini-popover[data-placement="bottom"] { transform: translateX(-50%); animation: popInBottom 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
          @keyframes popInBottom { from { opacity: 0; transform: translateX(-50%) scale(0.95) translateY(-5px); } to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); } }
          .deck-mini-popover[data-placement="bottom"]::before {
            content: ''; position: absolute; top: -6px; left: 50%; width: 12px; height: 12px;
            background-color: #18181b; border-right: 1px solid #27272a; border-bottom: 1px solid #27272a; 
            transform: translateX(-50%) rotate(225deg); z-index: 10000;
          }
          .deck-mini-popover[data-placement="top"] { transform: translateX(-50%) translateY(-100%); animation: popInTop 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
          @keyframes popInTop { from { opacity: 0; transform: translateX(-50%) translateY(-100%) scale(0.95) translateY(5px); } to { opacity: 1; transform: translateX(-50%) translateY(-100%) scale(1) translateY(0); } }
          .deck-mini-popover[data-placement="top"]::before {
            content: ''; position: absolute; bottom: -6px; left: 50%; width: 12px; height: 12px;
            background-color: #18181b; border-left: 1px solid #27272a; border-bottom: 1px solid #27272a; 
            transform: translateX(-50%) rotate(-45deg); z-index: 10000;
          }
          .mini-header { padding: 8px 12px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; border-radius: 12px 12px 0 0; background: rgba(255,255,255,0.01); min-height: 32px; }
          .mini-header-title { font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 1px; }
          .mini-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
          .mini-body-scroll-area { display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto; padding-right: 4px; }
          .mini-body-scroll-area::-webkit-scrollbar { width: 4px; }
          .mini-body-scroll-area::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
          .mini-footer { padding: 8px 12px; border-top: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border-radius: 0 0 12px 12px; min-height: 36px; }
          .btn-cancel { background: transparent; border: none; color: #71717a; font-size: 11px; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: color 0.2s; }
          .btn-cancel:hover { color: #e4e4e7; background: rgba(255,255,255,0.05); }
          .mini-onboarding-message { margin-top: 12px; background-color: #f97316; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; animation: fadeIn 0.3s ease-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div className="mini-header">
          <span className="mini-header-title">{t.prompts.quickFill || "Quick Fill"}</span>
          <button onClick={props.onClose} style={{ background:'none', border:'none', color:'#52525b', cursor:'pointer', padding: 0, display: 'flex' }}><X size={14} /></button>
        </div>

        <div className="mini-body">
          {variablesObj.length === 0 ? (
             <div style={{ textAlign: 'center', color: '#71717a', fontSize: '13px', padding: '10px 0' }}>
                <span style={{ display:'block', marginBottom:'4px' }}>No variables detected.</span>
                <span style={{ fontSize:'11px', opacity:0.7 }}>Ready to deploy.</span>
             </div>
          ) : (
            <div className="mini-body-scroll-area">
              {variablesObj.map((v, idx) => (
                <VariableRow key={v.name} idx={idx} name={v.name} options={v.options} value={variableValues[v.name] || ''} onChange={(val) => handleValueChange(v.name, val)} autoFocus={idx === 0} />
              ))}
            </div>
          )}
          {props.isOnboarding && (
             <div className="mini-onboarding-message">
                <MousePointerClick size={14} fill="currentColor" />
                <span>Fill in the variables, then deploy: <strong>Click</strong> to copy, <strong>Ctrl+Click</strong> to auto-paste, <strong>Ctrl+Alt+Click</strong> to auto-send.</span>
             </div>
          )}
        </div>

        <div className="mini-footer">
          <button className="btn-cancel" onClick={props.onClose}>{t.common.cancel || "Cancel"}</button>
          <button style={getDeployButtonStyle()} onClick={handleConfirm} disabled={!allFilled} onMouseEnter={() => setIsDeployHovered(true)} onMouseLeave={() => setIsDeployHovered(false)}>
            Deploy: {getDeployActionLabel().label}
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );
}

interface VariableRowProps { idx: number; name: string; options: string[]; value: string; onChange: (val: string) => void; autoFocus: boolean; }

function VariableRow({ idx, name, options, value, onChange, autoFocus }: VariableRowProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFocus = () => { if (options.length > 0) { setShowDropdown(true); setActiveIndex(-1); } };
  const handleBlur = () => { setTimeout(() => setShowDropdown(false), 200); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || options.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(prev => (prev + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(prev => (prev - 1 + options.length) % options.length); }
    else if (e.key === 'Enter' || e.key === 'Tab') { if (activeIndex >= 0) { e.preventDefault(); onChange(options[activeIndex]); setShowDropdown(false); if (e.key === 'Enter') e.stopPropagation(); } }
    else if (e.key === 'Escape') { e.preventDefault(); setShowDropdown(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
      <style>{`
        .mini-var-index { color: #71717a; font-size: 12px; font-weight: 600; min-width: 16px; }
        .mini-var-badge { background-color: #3f3f46; color: #f4f4f5; font-weight: 700; font-size: 12px; padding: 4px 8px; border-radius: 4px; white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
        .mini-var-input { flex: 1; background: transparent; border: 1px solid #3f3f46; border-radius: 4px; color: #e4e4e7; font-size: 12px; padding: 5px 8px; outline: none; transition: all 0.2s; font-family: inherit; min-width: 0; }
        .mini-var-input:focus { border-color: #f97316; box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.2); }
      `}</style>
      <span className="mini-var-index">{idx + 1}.</span>
      <div className="mini-var-badge" title={name}>{name}</div>
      <span style={{ color: '#71717a', fontWeight: 600, fontSize: '12px' }}>:</span>
      <div style={{ flex: 1, position: 'relative' }}>
        <input ref={inputRef} className="mini-var-input" placeholder={options.length > 0 ? "Select or type..." : `Fill ${name}...`} value={value} onChange={(e) => { onChange(e.target.value); if (!showDropdown && options.length > 0) setShowDropdown(true); }} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus={autoFocus} autoComplete="off" />
        {showDropdown && options.length > 0 && inputRef.current && <DropdownPortal target={inputRef.current} options={options} activeIndex={activeIndex} onSelect={(val) => { onChange(val); setShowDropdown(false); }} />}
      </div>
    </div>
  );
}

interface DropdownPortalProps { target: HTMLElement; options: string[]; activeIndex: number; onSelect: (val: string) => void; }

function DropdownPortal({ target, options, activeIndex, onSelect }: DropdownPortalProps) {
  const rect = target.getBoundingClientRect();
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (activeIndex >= 0 && listRef.current) { const activeItem = listRef.current.children[activeIndex + 1] as HTMLElement; if (activeItem) activeItem.scrollIntoView({ block: 'nearest' }); } }, [activeIndex]);

  return ReactDOM.createPortal(
    <div ref={listRef} className="var-dropdown-portal" style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 100000, backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.1)', overflowY: 'auto', maxHeight: '200px', animation: 'slideDown 0.1s ease-out' }} onMouseDown={(e) => e.preventDefault()}>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .dropdown-header { padding: 6px 8px; font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #27272a; display: flex; align-items: center; gap: 4px; background: #18181b; position: sticky; top: 0; }
        .dropdown-item { padding: 8px 10px; font-size: 12px; color: #e4e4e7; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.1s; }
        .dropdown-item:hover, .dropdown-item.active { background-color: #27272a; }
        .dropdown-bullet { color: #f97316; font-size: 16px; line-height: 0; display: inline-block; margin-top: -2px; }
        .var-dropdown-portal::-webkit-scrollbar { width: 4px; }
        .var-dropdown-portal::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
      `}</style>
      <div className="dropdown-header"><List size={10} /><span>Possible Values</span></div>
      {options.map((opt, i) => (<div key={opt} className={`dropdown-item ${i === activeIndex ? 'active' : ''}`} onClick={() => onSelect(opt)}><span className="dropdown-bullet">•</span><span>{opt}</span></div>))}
    </div>,
    document.body
  );
}

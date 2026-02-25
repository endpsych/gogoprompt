/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom'; 
import { Copy, Check, List } from 'lucide-react';
import { Prompt } from '@/types';
import { useLanguage } from '@/shared/hooks';
import { useVariableStore } from '@/stores';

const CopyBtn = ({ text, color = '#a1a1aa' }: { text: string; color?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        background: 'rgba(39, 39, 42, 0.8)', 
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        color: copied ? '#10b981' : color,
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
        transition: 'all 0.2s',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
};

// Helper to parse {{name:opt1|opt2}}
const parseVariable = (raw: string) => {
  const parts = raw.split(':');
  const name = parts[0].trim();
  let options: string[] = [];
  if (parts.length > 1) {
    options = parts[1].split('|').map(o => o.trim()).filter(Boolean);
  }
  return { name, options };
};

interface VariableListProps {
  prompt?: Prompt;
  vars: string[];
  variableValues: Record<string, string>;
  hoveredVariable: string | null;
  setHoveredVariable: (v: string | null) => void;
  onVariableChange: (name: string, val: string) => void;
}

export const VariableList = ({ 
  prompt,
  vars, 
  variableValues, 
  hoveredVariable, 
  setHoveredVariable, 
  onVariableChange 
}: VariableListProps) => {
  const { t } = useLanguage();
  const { variables: globalVars } = useVariableStore();
  
  // Memoize options map (Global + Inline)
  const variablesOptionsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    
    const addOpts = (key: string, opts: string[]) => {
        const existing = map.get(key) || [];
        map.set(key, Array.from(new Set([...existing, ...opts])));
    };

    globalVars.forEach(gv => {
        let opts: string[] = [];
        if (gv.options && Array.isArray(gv.options)) opts = gv.options;
        else if (typeof gv.value === 'string' && gv.value.includes('|')) opts = gv.value.split('|');
        if (opts.length > 0) addOpts(gv.key, opts);
    });

    if (prompt) {
        const regex = /\{\{([^}]+)\}\}/g;
        let match;
        while ((match = regex.exec(prompt.content)) !== null) {
            const { name, options } = parseVariable(match[1]);
            if (options.length > 0) addOpts(name, options);
        }
    }
    return map;
  }, [prompt, globalVars]);

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
      <div style={titleCardHeaderStyle}>
        <div style={sectionTitleStyle}>{t.prompts.promptVariables}</div>
      </div>
      
      <div style={{ 
        ...panelContentAreaStyle, 
        paddingRight: '12px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px' 
      }}>
        {vars.map((v, idx) => (
          <VariableRow 
            key={v}
            idx={idx}
            name={v}
            value={variableValues[v] || ''}
            options={variablesOptionsMap.get(v) || []}
            isHovered={hoveredVariable === v}
            setHoveredVariable={setHoveredVariable}
            onVariableChange={onVariableChange}
            t={t}
          />
        ))}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: VariableRow ---

interface VariableRowProps {
    idx: number;
    name: string;
    value: string;
    options: string[];
    isHovered: boolean;
    setHoveredVariable: (v: string | null) => void;
    onVariableChange: (name: string, val: string) => void;
    t: any;
}

const VariableRow = ({ idx, name, value, options, isHovered, setHoveredVariable, onVariableChange, t }: VariableRowProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    const ORANGE_BORDER = '#f97316'; 
    const PURPLE_BORDER = '#a855f7';
    const DEFAULT_BORDER = '#3f3f46';

    const isFilled = value.trim().length > 0;
    
    // Filter options based on current input
    const filteredOptions = options.filter(opt => !value.trim() || opt.toLowerCase().includes(value.toLowerCase()));
    const hasOptions = filteredOptions.length > 0;

    const handleFocus = () => {
        setIsFocused(true);
        if (hasOptions) {
            setShowDropdown(true);
            setActiveIndex(-1);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        // Delay closing to allow clicks on the portal
        setTimeout(() => setShowDropdown(false), 200);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || !hasOptions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % filteredOptions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        } else if (e.key === 'Enter') {
            // Prevent newline/submit if selecting from dropdown
            if (activeIndex >= 0) {
                e.preventDefault();
                onVariableChange(name, filteredOptions[activeIndex]);
                setShowDropdown(false);
            }
        } else if (e.key === 'Tab') {
            if (activeIndex >= 0) {
                e.preventDefault();
                onVariableChange(name, filteredOptions[activeIndex]);
                setShowDropdown(false);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowDropdown(false);
        }
    };

    const labelBorderColor = isHovered 
        ? (isFilled ? PURPLE_BORDER : ORANGE_BORDER) 
        : 'transparent';

    const inputBorderColor = isFilled 
        ? PURPLE_BORDER 
        : (isFocused ? ORANGE_BORDER : DEFAULT_BORDER);

    return (
        <div 
            className="deck-variable-input-group"
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '8px', width: '100%' }}
        >
            {/* Index */}
            <div style={{
                backgroundColor: '#3f3f46', color: '#a1a1aa', width: '28px', height: '32px',
                borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 600, flexShrink: 0
            }}>
                {idx + 1}.
            </div>

            {/* Label */}
            <label 
                className="deck-variable-label"
                title={name}
                onMouseEnter={() => setHoveredVariable(name)}
                onMouseLeave={() => setHoveredVariable(null)}
                style={{
                    backgroundColor: '#3f3f46', color: 'white', width: '120px', minWidth: '120px', maxWidth: '120px',
                    height: '32px', padding: '0 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden',
                    cursor: 'default', transition: 'all 0.2s', border: `1px solid ${labelBorderColor}`
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', width: '100%', display: 'block' }}>{name}</span>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '20px', background: 'linear-gradient(90deg, transparent, #3f3f46)', pointerEvents: 'none' }} />
            </label>

            <span style={{ color: '#71717a', fontWeight: 'bold', fontSize: '14px', marginTop: '6px' }}>:</span>

            {/* Input + Dropdown */}
            <div style={{ position: 'relative', flex: 1 }}>
                <input
                    ref={inputRef}
                    className="deck-variable-input"
                    value={value}
                    onChange={(e) => {
                        onVariableChange(name, e.target.value);
                        if (!showDropdown && options.length > 0) setShowDropdown(true);
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={`${t.prompts.fillVariables || "Fill variable"} ${name}...`}
                    autoComplete="off"
                    style={{ 
                        width: '100%', 
                        minWidth: 0, 
                        height: '32px', // Compact fixed height
                        padding: '0 32px 0 10px', // Padding adjusted for CopyBtn
                        fontFamily: 'inherit', 
                        fontSize: '13px',
                        background: '#27272a', 
                        borderRadius: '6px', 
                        color: 'white', 
                        outline: 'none',
                        transition: 'border-color 0.2s', 
                        border: `1px solid ${inputBorderColor}`
                    }} 
                />
                
                {value && (
                    <div style={{ position: 'absolute', right: '4px', top: '3px', zIndex: 5 }}>
                        <CopyBtn text={value} />
                    </div>
                )}

                {/* Portal Dropdown */}
                {showDropdown && hasOptions && inputRef.current && (
                    <ListDropdownPortal 
                        target={inputRef.current} 
                        options={filteredOptions} 
                        activeIndex={activeIndex}
                        onSelect={(val) => { onVariableChange(name, val); setShowDropdown(false); }} 
                        t={t}
                    />
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Portal Dropdown ---

interface ListDropdownPortalProps {
    target: HTMLElement;
    options: string[];
    activeIndex: number;
    onSelect: (val: string) => void;
    t: any;
}

function ListDropdownPortal({ target, options, activeIndex, onSelect, t }: ListDropdownPortalProps) {
    const rect = target.getBoundingClientRect();
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const activeItem = listRef.current.children[activeIndex + 1] as HTMLElement;
            if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    return ReactDOM.createPortal(
        <div 
            ref={listRef}
            className="possible-values-dropdown"
            onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
            style={{
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 999999,
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.8)',
                overflowY: 'auto',
                maxHeight: '200px',
                animation: 'slideDown 0.1s ease-out',
            }}
        >
            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .list-dropdown-header {
                   padding: 6px 10px; font-size: 10px; font-weight: 700; color: #71717a;
                   text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #27272a;
                   display: flex; align-items: center; gap: 6px; background: #18181b; position: sticky; top: 0;
                }
                .list-dropdown-item {
                   padding: 8px 12px; font-size: 13px; color: #e4e4e7; cursor: pointer;
                   display: flex; align-items: center; gap: 8px; transition: background 0.1s;
                }
                .list-dropdown-item:hover, .list-dropdown-item.active {
                   background-color: #27272a;
                }
                .list-dropdown-bullet {
                   width: 6px; height: 6px; border-radius: 50%; background-color: #ed5e17; flex-shrink: 0;
                }
                .possible-values-dropdown::-webkit-scrollbar { width: 4px; }
                .possible-values-dropdown::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
            `}</style>
            
            <div className="list-dropdown-header">
                <List size={10} />
                <span>{t.variables?.possibleValues || "Possible Values"}</span>
            </div>
            
            {options.map((opt, i) => (
                <div 
                   key={opt} 
                   className={`list-dropdown-item ${i === activeIndex ? 'active' : ''}`}
                   onClick={() => onSelect(opt)}
                >
                   <div className="list-dropdown-bullet" />
                   <span>{opt}</span>
                </div>
            ))}
        </div>,
        document.body
    );
}
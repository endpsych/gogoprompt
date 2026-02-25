/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState } from 'react';
import { Copy, RefreshCw, Clipboard, Zap, ToyBrick, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { PromptUsageRecord } from '@/types';
import { useLanguage } from '@/shared/hooks';

interface HistoryItemProps {
  record: PromptUsageRecord;
  onRestore: () => void;
}

export function HistoryItem({ record, onRestore }: HistoryItemProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedVarKey, setCopiedVarKey] = useState<string | null>(null);
  
  const [isExpanded, setIsExpanded] = useState(false);

  const [hoverRestore, setHoverRestore] = useState(false);
  const [hoverCopy, setHoverCopy] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const timeString = new Date(record.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });

  const handleCopyResult = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(record.finalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyValue = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedVarKey(id);
    setTimeout(() => setCopiedVarKey(null), 1500);
  };

  // --- STYLES ---
  const cardStyle = {
    backgroundColor: '#27272a',
    border: isCardHovered ? '1px solid #71717a' : '1px solid #3f3f46',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    display: 'flex',
    flexDirection: 'column' as 'column',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cursor: 'default'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: isExpanded ? '10px' : '0',
    borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
    marginBottom: isExpanded ? '10px' : '0',
    transition: 'all 0.2s ease'
  };

  const bodyStyle = {
    fontSize: '13px',
    color: '#d4d4d8',
    lineHeight: '1.5',
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '16px',
    animation: 'fadeIn 0.2s ease-in-out'
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: '12px',
    marginTop: '4px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    gap: '8px',
    animation: 'fadeIn 0.2s ease-in-out'
  };

  const btnStyle = (isHovered: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: isHovered ? '#3f3f46' : 'rgba(255, 255, 255, 0.05)', 
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    color: isHovered ? '#ffffff' : '#a1a1aa',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
  });

  const varBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#3f3f46',
    border: '1px solid #52525b',
    borderRadius: '4px',
    padding: '2px 6px',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '11px',
    marginRight: '6px',
    whiteSpace: 'nowrap' as 'nowrap',
    flexShrink: 0, 
  };

  // 1. BASE PROMPT CONTENT (Includes Components at bottom of text)
  const renderFullText = () => {
    if (record.usageMode === 'text_insert') {
       return (
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px', padding: '10px', fontFamily: 'monospace', fontSize: '12px', color: '#a1a1aa', borderLeft: '2px solid #3f3f46' }}>
              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>{t.history.insertedClipboard}</span>
              "{record.inputs.clipboardContent?.slice(0, 150)}..."
          </div>
       );
    }

    const baseContent = record.promptSnapshot.content || '';
    const variables = record.inputs.variables || {};
    const parts = baseContent.split(/(\{\{[^}]+\}\})/g);

    // Prepare components for display inside the text box
    const components = record.inputs.components || [];
    let legacyComponents: string[] = [];
    if (components.length === 0 && typeof record.inputs.customInstructions === 'string') {
        legacyComponents = record.inputs.customInstructions.split('\n').filter(s => s.trim().length > 0);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Title: Deployed Prompt Text (Gray #a1a1aa) */}
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.history.deployedPromptText || "Deployed Prompt Text"}
        </span>
        
        <div style={{ 
            padding: '12px', 
            backgroundColor: '#18181b', 
            border: '1px solid #3f3f46', 
            borderRadius: '6px',
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            color: '#a1a1aa',
        }}>
            {/* Base Prompt Text */}
            {parts.map((part, i) => {
            const match = part.match(/^\{\{([^}]+)\}\}$/);
            if (match) {
                const varName = match[1].trim();
                const value = variables[varName];
                if (value) {
                return (
                    <span key={i} style={{ color: '#a855f7', fontWeight: 600, backgroundColor: 'rgba(168, 85, 247, 0.1)', borderRadius: '2px', padding: '0 2px' }}>
                    {value}
                    </span>
                );
                } else {
                return <span key={i} style={{ color: '#f97316' }}>{part}</span>;
                }
            }
            return <span key={i}>{part}</span>;
            })}

            {/* SPACER for Components */}
            {(components.length > 0 || legacyComponents.length > 0) && <div style={{ height: '16px' }} />}

            {/* Render Components INSIDE Text Box (Visual Context) */}
            {components.map((comp: any, i: number) => {
                const color = comp.isBespoke ? '#3b82f6' : '#10b981';
                return (
                    <div key={`comp-in-text-${i}`} style={{ color: color, marginTop: '4px', display: 'flex', gap: '8px' }}>
                        <span style={{ userSelect: 'none', opacity: 0.5 }}>+</span>
                        <span>{comp.text}</span>
                    </div>
                );
            })}

            {legacyComponents.map((text, i) => (
                <div key={`legacy-in-text-${i}`} style={{ color: '#10b981', marginTop: '4px', display: 'flex', gap: '8px' }}>
                    <span style={{ userSelect: 'none', opacity: 0.5 }}>+</span>
                    <span>{text}</span>
                </div>
            ))}
        </div>
      </div>
    );
  };

  // 2. COMPONENTS (Displayed as Cards below text box)
  const renderComponents = () => {
    const components = record.inputs.components || [];
    let displayItems: { text: string, isBespoke: boolean }[] = [];

    if (components.length > 0) {
        displayItems = components;
    } else if (typeof record.inputs.customInstructions === 'string') {
        const legacyParts = record.inputs.customInstructions.split('\n').filter(s => s.trim().length > 0);
        displayItems = legacyParts.map(text => ({ text, isBespoke: false }));
    }

    if (displayItems.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Title: Deployed Prompt Components (Gray #a1a1aa) */}
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.history.deployedPromptComponents || "Deployed Prompt Components"}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {displayItems.map((comp, idx) => {
                    const compId = `comp-${idx}`;
                    const baseColor = comp.isBespoke ? '#3b82f6' : '#10b981';
                    const bgColor = comp.isBespoke ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)';
                    const borderColor = comp.isBespoke ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)';
                    const textColor = comp.isBespoke ? '#60a5fa' : '#34d399';

                    return (
                        <div key={idx} style={{ 
                            padding: '10px 12px', 
                            backgroundColor: bgColor, 
                            border: `1px solid ${borderColor}`,
                            borderRadius: '6px',
                            color: textColor,
                            fontSize: '12px',
                            lineHeight: '1.4',
                            display: 'flex',
                            alignItems: 'flex-start',
                        }}>
                            <span style={{ flex: 1, paddingRight: '8px', wordBreak: 'break-word' }}>
                                {comp.text}
                            </span>
                            
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCopyValue(compId, comp.text); }}
                                title={t.common.copy}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: copiedVarKey === compId ? baseColor : '#71717a',
                                    transition: 'color 0.2s',
                                    flexShrink: 0,
                                    marginTop: '2px'
                                }}
                                onMouseEnter={(e) => { if(copiedVarKey !== compId) e.currentTarget.style.color = '#f4f4f5'; }}
                                onMouseLeave={(e) => { if(copiedVarKey !== compId) e.currentTarget.style.color = '#71717a'; }}
                            >
                                {copiedVarKey === compId ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  // 3. VARIABLES
  const renderVariables = () => {
    if (!record.inputs.variables || Object.keys(record.inputs.variables).length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Title: Deployed Prompt Variables (Gray #a1a1aa) */}
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.history.deployedPromptVariables || "Deployed Prompt Variables"}
            </span>
            {Object.entries(record.inputs.variables).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.5' }}>
                    {/* KEY: Orange with Brackets */}
                    <span style={{ ...varBadgeStyle, color: '#f97316' }}>
                        {`{{${key}}}`}
                    </span>
                    
                    <span style={{ color: '#52525b', margin: '0 8px', fontWeight: 700, flexShrink: 0 }}>:</span>
                    
                    {/* VALUE: Purple */}
                    <span style={{ color: '#a855f7', wordBreak: 'break-word', flex: 1, paddingRight: '8px' }}>
                        {val}
                    </span>
                    
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopyValue(key, val); }}
                        title={t.common.copy}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            color: copiedVarKey === key ? '#10b981' : '#71717a',
                            transition: 'color 0.2s',
                            flexShrink: 0,
                            marginTop: '2px',
                        }}
                        onMouseEnter={(e) => { if(copiedVarKey !== key) e.currentTarget.style.color = '#f4f4f5'; }}
                        onMouseLeave={(e) => { if(copiedVarKey !== key) e.currentTarget.style.color = '#71717a'; }}
                    >
                        {copiedVarKey === key ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                </div>
            ))}
        </div>
    );
  };

  const ModeIcon = {
    standard: Zap,
    variable_fill: ToyBrick,
    text_insert: Clipboard,
    injection: Zap
  }[record.usageMode] || Zap;

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      {/* HEADER */}
      <div style={headerStyle} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5', fontWeight: 600, fontSize: '13px' }}>
            <ModeIcon size={12} style={{ color: '#818cf8' }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
              {record.promptSnapshot.title}
            </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>{timeString}</span>
            <button
                type="button"
                style={{ 
                    background: 'transparent', border: 'none', color: isExpanded ? '#f4f4f5' : '#71717a', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2px', transition: 'color 0.2s'
                }}
            >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
        </div>
      </div>

      {/* EXPANDABLE BODY */}
      {isExpanded && (
        <>
            <div style={bodyStyle}>
                {renderFullText()}
                {renderComponents()}
                {renderVariables()}
            </div>

            <div style={footerStyle}>
                <button 
                type="button"
                style={btnStyle(hoverRestore)}
                onMouseEnter={() => setHoverRestore(true)}
                onMouseLeave={() => setHoverRestore(false)}
                onClick={onRestore}
                title={t.history.redeploy}
                >
                <RefreshCw size={12} /> <span>{t.history.redeploy}</span>
                </button>
                <button 
                type="button"
                style={btnStyle(hoverCopy)}
                onMouseEnter={() => setHoverCopy(true)}
                onMouseLeave={() => setHoverCopy(false)}
                onClick={handleCopyResult}
                title={t.prompts.copyToClipboard}
                >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? t.common.copied : t.common.copy}</span>
                </button>
            </div>
        </>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
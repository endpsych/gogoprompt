/**
 * HotkeysPanel.tsx
 * Description: Complete implementation of the Hotkeys & Shortcuts panel. 
 * Manages the Global Summon hotkey, Modifier-click hotkeys (Quick Deploy, Auto-Paste, Auto-Enter), 
 * and customizable app shortcuts. Includes necessary exports for QuickDeployModal.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, RotateCcw, Plus, Clipboard, Send, Zap } from 'lucide-react';
import { Shortcut } from '@/shared/utils/shortcuts';
import { useLanguage } from '@/shared/hooks';

interface HotkeysPanelProps {
  shortcuts: Shortcut[];
  onUpdate: (id: string, keys: string) => void;
  onReset: (id: string) => void;
  onResetAll: () => void;
  onAdd: (label: string, keys: string) => void;
  onClose: () => void;
  onBack: () => void;
  // Summon Hotkey Props
  globalHotkey: string;
  isRecordingSummon: boolean;
  onToggleRecordingSummon: () => void;
  summonStatus: { type: 'success' | 'error'; message: string } | null;
}

// Default modifier hotkeys configuration
export const DEFAULT_MODIFIER_HOTKEYS: Record<string, { modifiers: string[]; label: string; description: string }> = {
  'quick-deploy': { modifiers: ['Shift'], label: 'Quick Deploy', description: 'Open mini deployment modal for variable prompts' },
  'auto-paste': { modifiers: ['Ctrl'], label: 'Auto-Paste', description: 'Copy and paste to previous app' },
  'auto-enter': { modifiers: ['Ctrl', 'Alt'], label: 'Auto-Enter', description: 'Copy, paste, and press Enter' },
};

export type ModifierHotkeyId = 'quick-deploy' | 'auto-paste' | 'auto-enter';

// Helper to get stored modifier hotkeys
export function getModifierHotkeys(): Record<ModifierHotkeyId, { modifiers: string[]; label: string; description: string }> {
  try {
    const stored = localStorage.getItem('modifier_hotkeys');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        'quick-deploy': { ...DEFAULT_MODIFIER_HOTKEYS['quick-deploy'], ...parsed['quick-deploy'] },
        'auto-paste': { ...DEFAULT_MODIFIER_HOTKEYS['auto-paste'], ...parsed['auto-paste'] },
        'auto-enter': { ...DEFAULT_MODIFIER_HOTKEYS['auto-enter'], ...parsed['auto-enter'] },
      };
    }
  } catch (e) {
    console.error('Failed to load modifier hotkeys', e);
  }
  return { 
    'quick-deploy': { ...DEFAULT_MODIFIER_HOTKEYS['quick-deploy'] },
    'auto-paste': { ...DEFAULT_MODIFIER_HOTKEYS['auto-paste'] },
    'auto-enter': { ...DEFAULT_MODIFIER_HOTKEYS['auto-enter'] },
  };
}

// Helper to save modifier hotkeys
export function saveModifierHotkey(id: ModifierHotkeyId, modifiers: string[]) {
  try {
    const current = getModifierHotkeys();
    current[id] = { ...current[id], modifiers };
    localStorage.setItem('modifier_hotkeys', JSON.stringify(current));
    window.dispatchEvent(new Event('modifier_hotkeys_updated'));
  } catch (e) {
    console.error('Failed to save modifier hotkey', e);
  }
}

// Helper to check if modifiers match a hotkey
export function checkModifierHotkey(id: ModifierHotkeyId, e: React.MouseEvent | MouseEvent): boolean {
  const hotkeys = getModifierHotkeys();
  const config = hotkeys[id];
  if (!config) return false;
  
  const requiredMods = config.modifiers.map(m => m.toLowerCase());
  
  const ctrlPressed = e.ctrlKey || e.metaKey;
  const altPressed = e.altKey;
  const shiftPressed = e.shiftKey;
  
  const hasCtrl = requiredMods.includes('ctrl');
  const hasAlt = requiredMods.includes('alt');
  const hasShift = requiredMods.includes('shift');
  
  return (
    ctrlPressed === hasCtrl &&
    altPressed === hasAlt &&
    shiftPressed === hasShift
  );
}

// Check if auto-paste modifier is held
export function isAutoPasteModifierHeld(ctrlHeld: boolean, altHeld: boolean, shiftHeld: boolean): boolean {
  const hotkeys = getModifierHotkeys();
  const config = hotkeys['auto-paste'];
  const mods = config.modifiers.map(m => m.toLowerCase());
  return ctrlHeld === mods.includes('ctrl') && altHeld === mods.includes('alt') && shiftHeld === mods.includes('shift');
}

// Check if auto-enter modifier is held
export function isAutoEnterModifierHeld(ctrlHeld: boolean, altHeld: boolean, shiftHeld: boolean): boolean {
  const hotkeys = getModifierHotkeys();
  const config = hotkeys['auto-enter'];
  const mods = config.modifiers.map(m => m.toLowerCase());
  return ctrlHeld === mods.includes('ctrl') && altHeld === mods.includes('alt') && shiftHeld === mods.includes('shift');
}

// Format modifiers for display
function formatModifiers(modifiers: string[]): string {
  return modifiers.join(' + ') + ' + Click';
}

export function HotkeysPanel({ 
    shortcuts, 
    onUpdate, 
    onReset, 
    onResetAll, 
    onAdd,
    onClose, 
    onBack,
    globalHotkey,
    isRecordingSummon,
    onToggleRecordingSummon,
    summonStatus
}: HotkeysPanelProps) {
    const { t } = useLanguage();
    const [recordingId, setRecordingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newKey, setNewKey] = useState('');
    
    // Modifier hotkeys state
    const [modifierHotkeys, setModifierHotkeys] = useState(getModifierHotkeys());
    const [recordingModifierId, setRecordingModifierId] = useState<ModifierHotkeyId | null>(null);
    const [recordedModifiers, setRecordedModifiers] = useState<string[]>([]);
    const recordingRef = useRef<HTMLDivElement>(null);

    // Reload when storage changes
    useEffect(() => {
      const handleUpdate = () => setModifierHotkeys(getModifierHotkeys());
      window.addEventListener('modifier_hotkeys_updated', handleUpdate);
      return () => window.removeEventListener('modifier_hotkeys_updated', handleUpdate);
    }, []);

    // Auto-focus recording element
    useEffect(() => {
      if (recordingModifierId && recordingRef.current) {
        recordingRef.current.focus();
      }
    }, [recordingModifierId]);

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const modifiers = [];
        if (e.metaKey || e.ctrlKey) modifiers.push('Ctrl');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');

        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

        const key = e.key.toUpperCase();
        const shortcutString = [...modifiers, key].join('+');

        if (id === 'NEW') {
            setNewKey(shortcutString);
        } else {
            onUpdate(id, shortcutString);
            setRecordingId(null);
        }
    };

    const handleModifierKeyDown = (e: React.KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const modifiers: string[] = [];
        if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');

        if (modifiers.length > 0) {
            setRecordedModifiers(modifiers);
        }
    };

    const handleModifierKeyUp = (e: React.KeyboardEvent) => {
        if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && recordedModifiers.length > 0 && recordingModifierId) {
            saveModifierHotkey(recordingModifierId, recordedModifiers);
            setModifierHotkeys(getModifierHotkeys());
            setRecordingModifierId(null);
            setRecordedModifiers([]);
        }
    };

    const startRecordingModifier = (id: ModifierHotkeyId) => {
        setRecordingModifierId(id);
        setRecordedModifiers([]);
    };

    const cancelRecordingModifier = () => {
        setRecordingModifierId(null);
        setRecordedModifiers([]);
    };

    const resetModifierHotkey = (id: ModifierHotkeyId) => {
        saveModifierHotkey(id, DEFAULT_MODIFIER_HOTKEYS[id].modifiers);
        setModifierHotkeys(getModifierHotkeys());
    };

    const confirmAdd = () => {
        if (newLabel && newKey) {
            onAdd(newLabel, newKey);
            setIsAdding(false);
            setNewLabel('');
            setNewKey('');
            setRecordingId(null);
        }
    };

    const builtinHotkeys: { id: ModifierHotkeyId; icon: any; color: string }[] = [
        { id: 'quick-deploy', icon: Zap, color: '#f97316' },
        { id: 'auto-paste', icon: Clipboard, color: '#3b82f6' },
        { id: 'auto-enter', icon: Send, color: '#ef4444' },
    ];

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <button className="settings-back-btn" onClick={onBack}>
                        <ArrowLeft size={18} />
                    </button>
                    <h2 className="settings-title">{t.settings.hotkeys || 'Hotkeys'}</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => {
                                onResetAll();
                                Object.keys(DEFAULT_MODIFIER_HOTKEYS).forEach(id => {
                                    resetModifierHotkey(id as ModifierHotkeyId);
                                });
                            }} 
                            style={{ 
                                padding: '4px 8px', borderRadius: '4px', border: '1px solid #3f3f46',
                                background: 'transparent', color: '#a1a1aa', fontSize: '11px', cursor: 'pointer'
                            }}
                        >
                            Reset All
                        </button>
                        <button className="settings-close" onClick={onClose}><X size={18} /></button>
                    </div>
                </div>

                <div className="settings-content" style={{ padding: '0', maxHeight: '70vh', overflowY: 'auto' }}>
                    
                    {/* 1. Global Commands Section */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #27272a', backgroundColor: '#1a1a1d' }}>
                        <div style={{ 
                            fontSize: '11px', fontWeight: 800, color: '#f97316', 
                            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' 
                        }}>
                            Global Commands
                        </div>
                        <div style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '12px', backgroundColor: isRecordingSummon ? '#2c1e14' : '#27272a', 
                            borderRadius: '8px', border: isRecordingSummon ? '1px solid #f97316' : '1px solid #3f3f46' 
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ backgroundColor: '#f9731620', padding: '6px', borderRadius: '6px' }}>
                                    <Zap size={16} color="#f97316" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>Summon GoGoPrompt</span>
                                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Toggle visibility from anywhere</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <button 
                                    onClick={onToggleRecordingSummon}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
                                        backgroundColor: isRecordingSummon ? '#ef4444' : '#18181b',
                                        color: isRecordingSummon ? 'white' : '#f97316',
                                        border: `1px solid ${isRecordingSummon ? '#ef4444' : '#3f3f46'}`,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {isRecordingSummon ? (t.settings.pressKeys || 'Press keys...') : globalHotkey}
                                </button>
                                {summonStatus && (
                                    <span style={{ fontSize: '9px', color: summonStatus.type === 'error' ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                                        {summonStatus.message}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Modifier Hotkeys Section */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #27272a', backgroundColor: '#1a1a1d' }}>
                        <div style={{ 
                            fontSize: '11px', fontWeight: 600, color: '#71717a', 
                            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'
                        }}>
                            Modifier Hotkeys
                        </div>
                        <div style={{ fontSize: '11px', color: '#52525b', marginBottom: '12px', lineHeight: '1.4' }}>
                            Hold modifier keys (Ctrl, Alt, Shift) then release to save.
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {builtinHotkeys.map((hotkey) => {
                                const Icon = hotkey.icon;
                                const config = modifierHotkeys[hotkey.id];
                                const isRecording = recordingModifierId === hotkey.id;
                                const isDefault = JSON.stringify(config.modifiers) === JSON.stringify(DEFAULT_MODIFIER_HOTKEYS[hotkey.id].modifiers);
                                
                                return (
                                    <div 
                                        key={hotkey.id} 
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                            padding: '10px 12px', backgroundColor: isRecording ? '#1e3a5f' : '#27272a', 
                                            borderRadius: '6px', border: isRecording ? '1px solid #3b82f6' : `1px solid ${hotkey.color}20`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ 
                                                width: '28px', height: '28px', borderRadius: '6px', 
                                                backgroundColor: `${hotkey.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Icon size={14} color={hotkey.color} />
                                            </div>
                                            <div>
                                                <div style={{ color: '#e4e4e7', fontSize: '13px', fontWeight: 500 }}>{config.label}</div>
                                                <div style={{ color: '#71717a', fontSize: '11px' }}>{config.description}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {isRecording ? (
                                                <div
                                                    ref={recordingRef} tabIndex={0}
                                                    onKeyDown={handleModifierKeyDown} onKeyUp={handleModifierKeyUp} onBlur={cancelRecordingModifier}
                                                    style={{
                                                        padding: '4px 10px', borderRadius: '4px', backgroundColor: '#3b82f6', color: 'white',
                                                        fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', minWidth: '120px', textAlign: 'center', outline: 'none'
                                                    }}
                                                >
                                                    {recordedModifiers.length > 0 ? formatModifiers(recordedModifiers) : 'Hold keys...'}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startRecordingModifier(hotkey.id)}
                                                    style={{
                                                        padding: '4px 10px', borderRadius: '4px', backgroundColor: '#18181b', border: '1px solid #3f3f46',
                                                        color: hotkey.color, fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', minWidth: '120px', cursor: 'pointer'
                                                    }}
                                                >
                                                    {formatModifiers(config.modifiers)}
                                                </button>
                                            )}
                                            {!isDefault && (
                                                <button onClick={() => resetModifierHotkey(hotkey.id)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
                                                    <RotateCcw size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Keyboard Shortcuts Section */}
                    <div style={{ padding: '16px' }}>
                        <div style={{ 
                            fontSize: '11px', fontWeight: 600, color: '#71717a', 
                            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' 
                        }}>
                            {t.settings.keyboardShortcuts || 'Keyboard Shortcuts'}
                        </div>
                        
                        {!isAdding ? (
                            <button 
                                onClick={() => { setIsAdding(true); setRecordingId('NEW'); }}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '6px', border: '1px dashed #3f3f46',
                                    background: 'transparent', color: '#a1a1aa', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    fontSize: '13px', marginBottom: '12px'
                                }}
                            >
                                <Plus size={16} /> {t.settings.addNewShortcut || 'Add New Shortcut'}
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                                <input 
                                    autoFocus placeholder={t.settings.actionNamePlaceholder || "Action Name"}
                                    value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                                    style={{ width: '100%', background: '#18181b', border: '1px solid #3f3f46', padding: '8px', borderRadius: '4px', color: 'white', fontSize: '13px' }}
                                />
                                <div 
                                    tabIndex={0} onKeyDown={(e) => handleKeyDown(e, 'NEW')} onClick={() => setRecordingId('NEW')}
                                    style={{
                                        width: '100%', background: recordingId === 'NEW' ? '#3b82f6' : '#27272a', 
                                        border: '1px solid #3f3f46', padding: '8px', borderRadius: '4px', 
                                        color: 'white', fontSize: '13px', textAlign: 'center', cursor: 'pointer'
                                    }}
                                >
                                    {newKey || (recordingId === 'NEW' ? 'Press keys...' : 'Click to record')}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={confirmAdd} disabled={!newLabel || !newKey} style={{ flex: 1, padding: '8px', background: '#10b981', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', opacity: (!newLabel || !newKey) ? 0.5 : 1 }}>Save</button>
                                    <button onClick={() => { setIsAdding(false); setRecordingId(null); setNewLabel(''); setNewKey(''); }} style={{ flex: 1, padding: '8px', background: '#3f3f46', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {shortcuts.map((shortcut) => (
                                <div key={shortcut.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                                    <span style={{ color: '#e4e4e7', fontSize: '13px' }}>{shortcut.label || shortcut.id}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => setRecordingId(shortcut.id)}
                                            onKeyDown={(e) => recordingId === shortcut.id && handleKeyDown(e, shortcut.id)}
                                            style={{
                                                padding: '4px 8px', borderRadius: '4px', background: recordingId === shortcut.id ? '#3b82f6' : '#27272a',
                                                border: '1px solid #3f3f46', color: '#fff', fontSize: '12px', minWidth: '80px', cursor: 'pointer', fontFamily: 'monospace'
                                            }}
                                        >
                                            {recordingId === shortcut.id ? 'Press keys...' : shortcut.keys}
                                        </button>
                                        <button onClick={() => onReset(shortcut.id)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
                                            <RotateCcw size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { HotkeysPanel as ShortcutsPanel };
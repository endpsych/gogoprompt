/**
 * SettingsModal.tsx
 * Description: Main settings interface providing navigation between language preferences, 
 * data backup/restore logic, and the integrated hotkeys management panel. 
 * Orchestrates the Global Summon hotkey recording state and passes it to the HotkeysPanel.
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Database, Keyboard, ChevronRight, Zap, Layers, Globe, 
  ArrowLeft, Download, Upload, AlertTriangle, FileJson
} from 'lucide-react';
import { HotkeysPanel } from './HotkeysPanel';
import { Shortcut } from '@/shared/utils/shortcuts';
import { AppPreferences, CARD_HEIGHT_OPTIONS } from '@/shared/utils/preferences';
import { useLanguage } from '@/shared/hooks';
import { useSettingsStore } from '@/stores';

type SettingsSection = 'menu' | 'backup' | 'hotkeys';

export interface FullAppBackup {
  version: number;
  timestamp: string;
  data: {
    prompts: any[];
    variables: any[];
    deckAddons: any[];
  };
}

interface SettingsModalProps {
  shortcuts: Shortcut[];
  onUpdateShortcut: (id: string, keys: string) => void;
  onResetShortcut: (id: string) => void;
  onResetAllShortcuts: () => void;
  onAddShortcut: (label: string, keys: string) => void;
  onExport: () => FullAppBackup;
  onImport: (data: FullAppBackup) => void;
  preferences: AppPreferences;
  onToggleAutoMinimize: () => void;
  onSetCardMaxLines: (lines: number) => void;
  onClose: () => void;
}

export function SettingsModal({
  shortcuts,
  onUpdateShortcut,
  onResetShortcut,
  onResetAllShortcuts,
  onAddShortcut,
  onExport,
  onImport,
  preferences,
  onToggleAutoMinimize,
  onSetCardMaxLines,
  onClose,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('menu');
  const { language, setLanguage, languages, t } = useLanguage();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // Summon Hotkey State
  const { globalHotkey, setGlobalHotkey } = useSettingsStore();
  const [isRecordingSummon, setIsRecordingSummon] = useState(false);
  const [summonStatus, setSummonStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'settings-portal';
    document.body.appendChild(container);
    setPortalContainer(container);
    return () => {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Handle Summon Hotkey Recording
  useEffect(() => {
    if (!isRecordingSummon) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Command');

      const key = e.key.toUpperCase();
      
      if (['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) return;

      const newHotkey = [...modifiers, key].join('+');
      setIsRecordingSummon(false);

      const result = await setGlobalHotkey(newHotkey);
      if (result.success) {
        setSummonStatus({ type: 'success', message: 'Hotkey updated successfully' });
      } else {
        setSummonStatus({ type: 'error', message: result.message || 'Failed to register hotkey' });
      }

      setTimeout(() => setSummonStatus(null), 3000);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isRecordingSummon, setGlobalHotkey]);

  const handleBack = () => {
    setActiveSection('menu');
  };

  const handleExportClick = () => {
    try {
      const data = onExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gogoprompt-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to create backup file.");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImport(json);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose(); 
      } catch (err) {
        console.error('Import failed', err);
        alert('Invalid Backup File: Could not parse JSON.');
      }
    };
    reader.readAsText(file);
  };

  if (!portalContainer) return null;

  const renderBackupSection = () => (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <button className="settings-back-btn" onClick={handleBack}>
            <ArrowLeft size={18} />
          </button>
          <h2 className="settings-title">{t.settings.backup}</h2>
          <button className="settings-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="settings-content" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '24px', color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5' }}>
            {t.settings.backupDescription}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              backgroundColor: '#27272a', borderRadius: '8px', padding: '16px', 
              border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e4e4e7', fontWeight: 600 }}>
                <Download size={18} color="#3b82f6" />
                <span>{t.settings.exportData}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                {t.settings.exportDataDesc}
              </div>
              <button 
                onClick={handleExportClick}
                style={{ 
                  marginTop: '4px', padding: '8px 12px', borderRadius: '6px', 
                  backgroundColor: '#3b82f6', color: 'white', border: 'none', 
                  cursor: 'pointer', fontWeight: 600, fontSize: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: 'fit-content'
                }}
              >
                <FileJson size={14} /> {t.settings.downloadBackup}
              </button>
            </div>

            <div style={{ 
              backgroundColor: '#27272a', borderRadius: '8px', padding: '16px', 
              border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e4e4e7', fontWeight: 600 }}>
                <Upload size={18} color="#10b981" />
                <span>{t.settings.importData}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                {t.settings.importDataDesc}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#f59e0b' }}>
                  <AlertTriangle size={12} />
                  <span>{t.settings.existingItemsSkipped}</span>
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  marginTop: '4px', padding: '8px 12px', borderRadius: '6px', 
                  backgroundColor: '#27272a', color: '#10b981', border: '1px solid #10b981', 
                  cursor: 'pointer', fontWeight: 600, fontSize: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: 'fit-content'
                }}
              >
                <Upload size={14} /> {t.settings.selectFile}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleImportFile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeSection === 'backup') return renderBackupSection();

    if (activeSection === 'hotkeys') {
      return (
        <HotkeysPanel
          shortcuts={shortcuts}
          onUpdate={onUpdateShortcut}
          onReset={onResetShortcut}
          onResetAll={onResetAllShortcuts}
          onAdd={onAddShortcut}
          onClose={onClose}
          onBack={handleBack}
          globalHotkey={globalHotkey}
          isRecordingSummon={isRecordingSummon}
          onToggleRecordingSummon={() => setIsRecordingSummon(!isRecordingSummon)}
          summonStatus={summonStatus}
        />
      );
    }

    const getCardHeightLabel = (optionValue: number) => {
        switch(optionValue) {
            case -2: return t.settings.cardHeightOptions.titleOnly;
            case -1: return t.settings.cardHeightOptions.titleTags;
            case 2: return t.settings.cardHeightOptions.twoLines;
            case 4: return t.settings.cardHeightOptions.fourLines;
            case 6: return t.settings.cardHeightOptions.sixLines;
            case 10: return t.settings.cardHeightOptions.tenLines;
            case 0: return t.settings.cardHeightOptions.unlimited;
            default: return `${optionValue} lines`;
        }
    };

    return (
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <h2 className="settings-title">{t.settings.title}</h2>
            <button className="settings-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="settings-content">
            <div className="settings-menu">
              
              {/* Language */}
              <div className="settings-select-item">
                <div className="settings-select-info">
                  <div className="settings-select-icon language"><Globe size={18} /></div>
                  <div className="settings-select-text">
                    <span className="settings-select-label">{t.settings.language}</span>
                    <span className="settings-select-description">{t.settings.languageDescription}</span>
                  </div>
                </div>
                <select
                  className="settings-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.nativeName}</option>
                  ))}
                </select>
              </div>

              {/* Backup Navigation */}
              <button className="settings-menu-item" onClick={() => setActiveSection('backup')}>
                <div className="settings-menu-icon"><Database size={18} /></div>
                <div className="settings-menu-info">
                  <span className="settings-menu-label">{t.settings.backup}</span>
                  <span className="settings-menu-description">{t.settings.backupDesc}</span>
                </div>
                <ChevronRight size={16} className="settings-menu-arrow" />
              </button>

              {/* Hotkeys Navigation */}
              <button className="settings-menu-item" onClick={() => setActiveSection('hotkeys')}>
                <div className="settings-menu-icon"><Keyboard size={18} /></div>
                <div className="settings-menu-info">
                  <span className="settings-menu-label">{t.settings.hotkeys || 'Hotkeys'}</span>
                  <span className="settings-menu-description">{t.settings.hotkeysDesc || 'View and customize hotkeys'}</span>
                </div>
                <ChevronRight size={16} className="settings-menu-arrow" />
              </button>

              <div className="settings-divider" />

              {/* Quick Copy Mode */}
              <div className="settings-toggle-item">
                <div className="settings-toggle-info">
                  <div className="settings-toggle-icon"><Zap size={18} /></div>
                  <div className="settings-toggle-text">
                    <span className="settings-toggle-label">{t.settings.quickCopyMode}</span>
                    <span className="settings-toggle-description">{t.settings.quickCopyModeDesc}</span>
                  </div>
                </div>
                <div
                  className={`settings-toggle ${preferences.autoMinimizeAfterCopy ? 'active' : ''}`}
                  onClick={onToggleAutoMinimize}
                >
                  <div className="settings-toggle-knob" />
                </div>
              </div>

              {/* Card Height Setting */}
              <div className="settings-select-item">
                <div className="settings-select-info">
                  <div className="settings-select-icon"><Layers size={18} /></div>
                  <div className="settings-select-text">
                    <span className="settings-select-label">{t.settings.cardHeight}</span>
                    <span className="settings-select-description">{t.settings.cardHeightDesc}</span>
                  </div>
                </div>
                <select
                  className="settings-select"
                  value={preferences.miniModeCardMaxLines}
                  onChange={(e) => onSetCardMaxLines(Number(e.target.value))}
                >
                  {CARD_HEIGHT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{getCardHeightLabel(option.value)}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <div className="settings-footer">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span className="settings-version">GoGoPrompt v0.1.0 • Made by Ender De Freitas</span>
              <span style={{ fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>
                © 2026 • All Rights Reserved • Non-Commercial Use Only
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return createPortal(renderContent(), portalContainer);
}
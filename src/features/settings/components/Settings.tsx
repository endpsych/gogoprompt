/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Download,
  Upload,
  Keyboard,
  Package,
  RotateCcw,
  ChevronRight,
  AlertTriangle,
  FileJson,
} from 'lucide-react';
import { Shortcut, eventToShortcutString, formatShortcut } from '@/shared/utils/shortcuts';

// Types
export interface AppBackupData {
  version: number;
  exportedAt: string;
  prompts: any[];
  components: any[];
  glossary: any[];
  tagColors: Record<string, string>;
}

export type ImportMode = 'replace' | 'merge';

interface SettingsProps {
  // Backup props
  onExport: () => AppBackupData;
  onImport: (data: AppBackupData, mode: ImportMode) => void;
  // Shortcuts props
  shortcuts: Shortcut[];
  onUpdateShortcut: (id: string, keys: string) => void;
  onResetShortcut: (id: string) => void;
  onResetAllShortcuts: () => void;
  // General
  onClose: () => void;
}

type SettingsSection = 'backup' | 'shortcuts';

const BACKUP_VERSION = 1;

export function Settings({
  onExport,
  onImport,
  shortcuts,
  onUpdateShortcut,
  onResetShortcut,
  onResetAllShortcuts,
  onClose,
}: SettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('backup');

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">
            <SettingsIcon size={18} />
            <span>Settings</span>
          </div>
          <button className="settings-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="settings-body">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <button
              className={`settings-nav-item ${activeSection === 'backup' ? 'active' : ''}`}
              onClick={() => setActiveSection('backup')}
            >
              <Package size={16} />
              <span>Backup & Restore</span>
              <ChevronRight size={14} className="settings-nav-arrow" />
            </button>
            <button
              className={`settings-nav-item ${activeSection === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveSection('shortcuts')}
            >
              <Keyboard size={16} />
              <span>Keyboard Shortcuts</span>
              <ChevronRight size={14} className="settings-nav-arrow" />
            </button>
          </div>

          {/* Content */}
          <div className="settings-content">
            {activeSection === 'backup' && (
              <BackupSection onExport={onExport} onImport={onImport} />
            )}
            {activeSection === 'shortcuts' && (
              <ShortcutsSection
                shortcuts={shortcuts}
                onUpdate={onUpdateShortcut}
                onReset={onResetShortcut}
                onResetAll={onResetAllShortcuts}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Backup Section Component
interface BackupSectionProps {
  onExport: () => AppBackupData;
  onImport: (data: AppBackupData, mode: ImportMode) => void;
}

function BackupSection({ onExport, onImport }: BackupSectionProps) {
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importData, setImportData] = useState<AppBackupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = onExport();
    const backup: AppBackupData = {
      ...data,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
    };

    const content = JSON.stringify(backup, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const filename = `prompter-backup-${date}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportData(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !Array.isArray(data.prompts)) {
        setError('Invalid backup file format');
        return;
      }

      if (data.version > BACKUP_VERSION) {
        setError('This backup was created with a newer version of GoGoPrompt.');
        return;
      }

      setImportData(data);
    } catch (err) {
      setError('Failed to read backup file.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!importData) return;
    onImport(importData, importMode);
    setImportData(null);
    setFileName(null);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Backup & Restore</h3>
      <p className="settings-section-desc">
        Export all your data or restore from a backup file.
      </p>

      {/* Export */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Download size={16} />
          <span>Export Data</span>
        </div>
        <p className="settings-card-desc">
          Download a complete backup including all prompts, components, glossary terms, and tag colors.
        </p>
        <button className="settings-btn primary" onClick={handleExport}>
          <Download size={14} />
          Download Backup
        </button>
      </div>

      {/* Import */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Upload size={16} />
          <span>Import Data</span>
        </div>
        <p className="settings-card-desc">
          Restore your data from a backup file.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <button
          className="settings-btn secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} />
          Select Backup File
        </button>

        {error && <div className="settings-error">{error}</div>}

        {importData && (
          <div className="settings-import-preview">
            <div className="settings-import-file">
              <FileJson size={16} />
              <span>{fileName}</span>
            </div>
            <div className="settings-import-info">
              <div className="settings-import-row">
                <span>Exported:</span>
                <span>{formatDate(importData.exportedAt)}</span>
              </div>
              <div className="settings-import-row">
                <span>Prompts:</span>
                <span>{importData.prompts?.length || 0}</span>
              </div>
              <div className="settings-import-row">
                <span>Components:</span>
                <span>{importData.components?.length || 0}</span>
              </div>
              <div className="settings-import-row">
                <span>Glossary Terms:</span>
                <span>{importData.glossary?.length || 0}</span>
              </div>
            </div>

            <div className="settings-import-mode">
              <span className="settings-import-mode-label">Import mode:</span>
              <div className="settings-import-mode-options">
                <button
                  className={`settings-mode-btn ${importMode === 'merge' ? 'active' : ''}`}
                  onClick={() => setImportMode('merge')}
                >
                  <span className="settings-mode-name">Merge</span>
                  <span className="settings-mode-desc">Add to existing data</span>
                </button>
                <button
                  className={`settings-mode-btn ${importMode === 'replace' ? 'active' : ''}`}
                  onClick={() => setImportMode('replace')}
                >
                  <span className="settings-mode-name">Replace</span>
                  <span className="settings-mode-desc">Delete existing first</span>
                </button>
              </div>
            </div>

            {importMode === 'replace' && (
              <div className="settings-warning">
                <AlertTriangle size={14} />
                <span>This will delete all your current data!</span>
              </div>
            )}

            <button className="settings-btn primary" onClick={handleImport}>
              Import Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Shortcuts Section Component
interface ShortcutsSectionProps {
  shortcuts: Shortcut[];
  onUpdate: (id: string, keys: string) => void;
  onReset: (id: string) => void;
  onResetAll: () => void;
}

function ShortcutsSection({ shortcuts, onUpdate, onReset, onResetAll }: ShortcutsSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setRecordedKeys('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, _id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setEditingId(null);
      setRecordedKeys('');
      return;
    }

    const keys = eventToShortcutString(e.nativeEvent);

    if (['Ctrl', 'Shift', 'Alt', 'Ctrl+Shift', 'Ctrl+Alt', 'Shift+Alt', 'Ctrl+Shift+Alt'].includes(keys)) {
      setRecordedKeys(keys + '+...');
      return;
    }

    setRecordedKeys(keys);
  };

  const handleKeyUp = (_e: React.KeyboardEvent, id: string) => {
    if (recordedKeys && !recordedKeys.endsWith('+...')) {
      onUpdate(id, recordedKeys);
      setEditingId(null);
      setRecordedKeys('');
    }
  };

  const handleBlur = () => {
    setEditingId(null);
    setRecordedKeys('');
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div>
          <h3 className="settings-section-title">Keyboard Shortcuts</h3>
          <p className="settings-section-desc">
            Click on a shortcut to edit it. Press your desired key combination.
          </p>
        </div>
        <button className="settings-btn secondary small" onClick={onResetAll}>
          <RotateCcw size={12} />
          Reset All
        </button>
      </div>

      <div className="settings-shortcuts-list">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.id} className="settings-shortcut-row">
            <div className="settings-shortcut-info">
              <span className="settings-shortcut-label">{shortcut.label}</span>
              <span className="settings-shortcut-desc">{shortcut.description}</span>
            </div>
            <div className="settings-shortcut-keys-wrapper">
              {editingId === shortcut.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  className="settings-shortcut-input"
                  value={recordedKeys || 'Press keys...'}
                  readOnly
                  onKeyDown={(e) => handleKeyDown(e, shortcut.id)}
                  onKeyUp={(e) => handleKeyUp(e, shortcut.id)}
                  onBlur={handleBlur}
                />
              ) : (
                <button
                  className="settings-shortcut-keys"
                  onClick={() => handleStartEdit(shortcut.id)}
                >
                  {formatShortcut(shortcut.keys)}
                </button>
              )}
              {shortcut.keys !== shortcut.defaultKeys && (
                <button
                  className="settings-shortcut-reset"
                  onClick={() => onReset(shortcut.id)}
                  title="Reset to default"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

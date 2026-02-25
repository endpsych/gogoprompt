/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useRef, useState } from 'react';
import { Upload, Download, X, Package, AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { PromptVersion } from '@/types';
import { sanitizeBackup } from '@/shared/utils/sanitize';
import { LoadingSpinner } from '@/shared/components/Loading';
import { SCHEMA_VERSIONS } from '@/shared/utils/storage/migrations';

interface AppBackupProps {
  onExport: () => AppBackupData;
  onImport: (data: AppBackupData, mode: ImportMode) => void;
  onClose: () => void;
  onBack?: () => void;
}

export interface AppBackupData {
  version: number;
  schemaVersions?: Record<string, number>; // Schema versions at time of export
  exportedAt: string;
  prompts: any[];
  components: any[];
  glossary: any[];
  tagColors: Record<string, string>;
  versions?: PromptVersion[];
}

export type ImportMode = 'replace' | 'merge';

const BACKUP_VERSION = 2;

export function AppBackup({ onExport, onImport, onClose, onBack }: AppBackupProps) {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importData, setImportData] = useState<AppBackupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const data = onExport();
      const backup: AppBackupData = {
        ...data,
        version: BACKUP_VERSION,
        schemaVersions: { ...SCHEMA_VERSIONS }, // Include current schema versions
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
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportData(null);
    setFileName(file.name);
    setIsReading(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.version || !Array.isArray(data.prompts)) {
        setError('Invalid backup file format');
        return;
      }

      // Check version compatibility
      if (data.version > BACKUP_VERSION) {
        setError('This backup was created with a newer version of GoGoPrompt. Please update the app.');
        return;
      }

      // Sanitize the imported data to prevent XSS
      const sanitizedData = sanitizeBackup(data);
      if (!sanitizedData) {
        setError('Failed to process backup file');
        return;
      }

      setImportData(sanitizedData);
    } catch (err) {
      setError('Failed to read backup file. Please check the file format.');
    } finally {
      setIsReading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!importData) return;
    
    setIsImporting(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      onImport(importData, importMode);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="app-backup-overlay" onClick={onClose}>
      <div className="app-backup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="app-backup-header">
          {onBack && (
            <button className="settings-back-btn" onClick={onBack}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="app-backup-tabs">
            <button
              className={`app-backup-tab ${mode === 'export' ? 'active' : ''}`}
              onClick={() => setMode('export')}
            >
              <Download size={14} />
              Export
            </button>
            <button
              className={`app-backup-tab ${mode === 'import' ? 'active' : ''}`}
              onClick={() => setMode('import')}
            >
              <Upload size={14} />
              Import
            </button>
          </div>
          <button className="app-backup-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {mode === 'export' ? (
          <div className="app-backup-body">
            <div className="app-backup-section">
              <div className="app-backup-icon">
                <Package size={48} />
              </div>
              <h3 className="app-backup-title">Export All Data</h3>
              <p className="app-backup-desc">
                Download a complete backup of your GoGoPrompt data including:
              </p>
              <ul className="app-backup-list">
                <li>All prompts with tags</li>
                <li>All components</li>
                <li>All glossary terms</li>
                <li>Custom tag colors</li>
              </ul>
              <button 
                className="app-backup-export-btn" 
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner size={16} />
                    Exporting...
                  </>
                ) : exportSuccess ? (
                  <>
                    <Check size={16} />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Backup
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="app-backup-body">
            <div className="app-backup-section">
              <p className="app-backup-desc">
                Restore your data from a GoGoPrompt backup file.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <button
                className="app-backup-file-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isReading}
              >
                {isReading ? (
                  <>
                    <LoadingSpinner size={16} />
                    Reading file...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Select Backup File (.json)
                  </>
                )}
              </button>

              {error && <div className="app-backup-error">{error}</div>}

              {importData && (
                <div className="app-backup-preview">
                  <div className="app-backup-preview-header">
                    <Package size={16} />
                    <span>{fileName}</span>
                  </div>
                  <div className="app-backup-preview-info">
                    <div className="app-backup-preview-row">
                      <span>Exported:</span>
                      <span>{formatDate(importData.exportedAt)}</span>
                    </div>
                    <div className="app-backup-preview-row">
                      <span>Prompts:</span>
                      <span>{importData.prompts?.length || 0}</span>
                    </div>
                    <div className="app-backup-preview-row">
                      <span>Components:</span>
                      <span>{importData.components?.length || 0}</span>
                    </div>
                    <div className="app-backup-preview-row">
                      <span>Glossary Terms:</span>
                      <span>{importData.glossary?.length || 0}</span>
                    </div>
                  </div>

                  <div className="app-backup-import-mode">
                    <span className="app-backup-mode-label">Import mode:</span>
                    <div className="app-backup-mode-options">
                      <button
                        className={`app-backup-mode-btn ${importMode === 'merge' ? 'active' : ''}`}
                        onClick={() => setImportMode('merge')}
                      >
                        <span className="app-backup-mode-name">Merge</span>
                        <span className="app-backup-mode-desc">Add to existing data</span>
                      </button>
                      <button
                        className={`app-backup-mode-btn ${importMode === 'replace' ? 'active' : ''}`}
                        onClick={() => setImportMode('replace')}
                      >
                        <span className="app-backup-mode-name">Replace</span>
                        <span className="app-backup-mode-desc">Delete existing data first</span>
                      </button>
                    </div>
                  </div>

                  {importMode === 'replace' && (
                    <div className="app-backup-warning">
                      <AlertTriangle size={14} />
                      <span>This will delete all your current data!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="app-backup-footer">
              <button className="app-backup-btn cancel" onClick={onClose} disabled={isImporting}>
                Cancel
              </button>
              <button
                className="app-backup-btn confirm"
                onClick={handleImport}
                disabled={!importData || isImporting}
              >
                {isImporting ? (
                  <>
                    <LoadingSpinner size={14} />
                    Importing...
                  </>
                ) : (
                  'Import Data'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

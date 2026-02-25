/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useRef, useState } from 'react';
import { Upload, Download, X, FileSpreadsheet, FileJson, FileText, Check } from 'lucide-react';
import { GlossaryTerm, GLOSSARY_CATEGORIES } from '@/types';
import { sanitizeString } from '@/shared/utils/sanitize';
import { LoadingSpinner } from '@/shared/components/Loading';
import * as XLSX from 'xlsx';

interface GlossaryImportExportProps {
  terms: GlossaryTerm[];
  onImport: (terms: Array<{ term: string; definition: string; category?: string }>) => void;
  onClose: () => void;
}

type FileFormat = 'json' | 'csv' | 'xlsx';
type Mode = 'import' | 'export';

export function GlossaryImportExport({
  terms,
  onImport,
  onClose,
}: GlossaryImportExportProps) {
  const [mode, setMode] = useState<Mode>('import');
  const [_format, setFormat] = useState<FileFormat>('json');
  const [_importData, setImportData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Array<{ term: string; definition: string; category?: string }>>([]);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview([]);
    setIsReading(true);

    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Excel file
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
        
        const parsed = data.map((row) => ({
          term: sanitizeString(row.term || row.Term || ''),
          definition: sanitizeString(row.definition || row.Definition || ''),
          category: sanitizeString(row.category || row.Category || '') || undefined,
        })).filter((t) => t.term && t.definition);
        
        setPreview(parsed);
        setFormat('xlsx');
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        setImportData(text);
        parseJson(text);
        setFormat('json');
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        setImportData(text);
        parseCsv(text);
        setFormat('csv');
      } else {
        setError('Unsupported file format. Please use .json, .csv, or .xlsx');
      }
    } catch (err) {
      setError('Failed to read file. Please check the format.');
    } finally {
      setIsReading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseJson = (text: string) => {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setError('JSON must be an array of terms');
        return;
      }
      const parsed = data
        .map((item: any) => ({
          term: sanitizeString(item.term || ''),
          definition: sanitizeString(item.definition || ''),
          category: sanitizeString(item.category || '') || undefined,
        }))
        .filter((t) => t.term && t.definition);
      setPreview(parsed);
      setError(null);
    } catch {
      setError('Invalid JSON format');
      setPreview([]);
    }
  };

  const parseCsv = (text: string) => {
    try {
      const lines = text.split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        setError('CSV must have a header row and at least one data row');
        return;
      }

      // Parse header
      const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
      const termIdx = header.indexOf('term');
      const defIdx = header.indexOf('definition');
      const catIdx = header.indexOf('category');

      if (termIdx === -1 || defIdx === -1) {
        setError('CSV must have "term" and "definition" columns');
        return;
      }

      const parsed = lines.slice(1).map((line) => {
        const cols = parseCsvLine(line);
        return {
          term: sanitizeString(cols[termIdx]?.trim() || ''),
          definition: sanitizeString(cols[defIdx]?.trim() || ''),
          category: catIdx !== -1 ? sanitizeString(cols[catIdx]?.trim() || '') || undefined : undefined,
        };
      }).filter((t) => t.term && t.definition);

      setPreview(parsed);
      setError(null);
    } catch {
      setError('Invalid CSV format');
      setPreview([]);
    }
  };

  // Simple CSV line parser that handles quoted values
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      setError('No valid terms to import');
      return;
    }
    
    setIsImporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      onImport(preview);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async (exportFormat: FileFormat) => {
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const data = terms.map((t) => ({
        term: t.term,
        definition: t.definition,
        category: t.category || '',
      }));

      let content: string | Blob;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          filename = 'glossary.json';
          mimeType = 'application/json';
          break;
        case 'csv':
          const csvHeader = 'term,definition,category';
          const csvRows = data.map((t) => 
            `"${escapeCsv(t.term)}","${escapeCsv(t.definition)}","${escapeCsv(t.category)}"`
          );
          content = [csvHeader, ...csvRows].join('\n');
          filename = 'glossary.csv';
          mimeType = 'text/csv';
          break;
        case 'xlsx':
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Glossary');
          const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          content = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          filename = 'glossary.xlsx';
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
      }

      // Download
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
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

  const escapeCsv = (str: string): string => {
    return str.replace(/"/g, '""');
  };

  return (
    <div className="import-export-overlay" onClick={onClose}>
      <div className="import-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="import-export-header">
          <div className="import-export-tabs">
            <button
              className={`import-export-tab ${mode === 'import' ? 'active' : ''}`}
              onClick={() => setMode('import')}
            >
              <Upload size={14} />
              Import
            </button>
            <button
              className={`import-export-tab ${mode === 'export' ? 'active' : ''}`}
              onClick={() => setMode('export')}
            >
              <Download size={14} />
              Export
            </button>
          </div>
          <button className="import-export-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {mode === 'import' ? (
          <div className="import-export-body">
            <div className="import-section">
              <p className="import-instructions">
                Import terms from a JSON, CSV, or Excel file. Files must have "term" and "definition" columns/fields.
                Optional "category" field can be: {GLOSSARY_CATEGORIES.join(', ')}.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <button
                className="import-file-btn"
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
                    Select File (.json, .csv, .xlsx)
                  </>
                )}
              </button>

              {error && <div className="import-error">{error}</div>}

              {preview.length > 0 && (
                <div className="import-preview">
                  <div className="import-preview-header">
                    <span className="import-preview-title">
                      Preview ({preview.length} terms)
                    </span>
                  </div>
                  <div className="import-preview-list">
                    {preview.slice(0, 10).map((t, i) => (
                      <div key={i} className="import-preview-item">
                        <span className="import-preview-term">{t.term}</span>
                        {t.category && (
                          <span className="import-preview-category">{t.category}</span>
                        )}
                        <span className="import-preview-def">
                          {t.definition.substring(0, 60)}
                          {t.definition.length > 60 ? '...' : ''}
                        </span>
                      </div>
                    ))}
                    {preview.length > 10 && (
                      <div className="import-preview-more">
                        ...and {preview.length - 10} more terms
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="import-export-footer">
              <button className="import-export-btn cancel" onClick={onClose} disabled={isImporting}>
                Cancel
              </button>
              <button
                className="import-export-btn confirm"
                onClick={handleImport}
                disabled={preview.length === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <LoadingSpinner size={14} />
                    Importing...
                  </>
                ) : (
                  `Import ${preview.length > 0 ? `${preview.length} Terms` : ''}`
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="import-export-body">
            <div className="export-section">
              <p className="export-instructions">
                Export your {terms.length} glossary terms to a file.
              </p>

              {exportSuccess && (
                <div className="export-success">
                  <Check size={14} />
                  Download started!
                </div>
              )}

              <div className="export-formats">
                <button 
                  className="export-format-btn" 
                  onClick={() => handleExport('json')}
                  disabled={isExporting || terms.length === 0}
                >
                  {isExporting ? <LoadingSpinner size={24} /> : <FileJson size={24} />}
                  <span className="export-format-name">JSON</span>
                  <span className="export-format-desc">Structured data format</span>
                </button>

                <button 
                  className="export-format-btn" 
                  onClick={() => handleExport('csv')}
                  disabled={isExporting || terms.length === 0}
                >
                  {isExporting ? <LoadingSpinner size={24} /> : <FileText size={24} />}
                  <span className="export-format-name">CSV</span>
                  <span className="export-format-desc">Comma-separated values</span>
                </button>

                <button 
                  className="export-format-btn" 
                  onClick={() => handleExport('xlsx')}
                  disabled={isExporting || terms.length === 0}
                >
                  {isExporting ? <LoadingSpinner size={24} /> : <FileSpreadsheet size={24} />}
                  <span className="export-format-name">Excel</span>
                  <span className="export-format-desc">Excel spreadsheet</span>
                </button>
              </div>

              {terms.length === 0 && (
                <div className="export-empty">
                  No terms to export. Add some terms first!
                </div>
              )}
            </div>

            <div className="import-export-footer">
              <button className="import-export-btn cancel" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

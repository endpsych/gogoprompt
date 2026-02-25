/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useMemo } from 'react';
import { X, History, RotateCcw, Trash2, ChevronDown, ChevronRight, Clock, FileText, Tag, Plus, Minus } from 'lucide-react';
import { PromptVersion } from '@/types';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useLanguage } from '@/shared/hooks/useLanguage'; // Ensure path is correct

interface VersionHistoryProps {
  promptId: string;
  promptTitle: string;
  versions: PromptVersion[];
  onRestore: (version: PromptVersion) => void;
  onDelete: (versionId: string) => void;
  onClose: () => void;
}

export function VersionHistory({
  promptId,
  promptTitle,
  versions,
  onRestore,
  onDelete,
  onClose,
}: VersionHistoryProps) {
  const { t, language } = useLanguage(); // Retrieve current language code (e.g., 'ja', 'es', 'en')
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; versionId: string | null }>({
    isOpen: false,
    versionId: null,
  });

  // Ensure locale is compatible with browser Intl API
  const activeLocale = language || 'en';

  // Format relative date (e.g., "11分前" in Japanese, "hace 11 minutos" in Spanish)
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = timestamp - now.getTime(); // Past dates must result in negative numbers
    
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    // Browser API handles all translations automatically based on the activeLocale
    const rtf = new Intl.RelativeTimeFormat(activeLocale, { numeric: 'auto' });

    if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, 'second');
    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day');
    
    // Absolute date for versions older than a week
    return date.toLocaleDateString(activeLocale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Format full absolute date for tooltips and comparison headers
  const formatFullDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(activeLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCompareSelect = (id: string) => {
    if (compareIds[0] === null) {
      setCompareIds([id, null]);
    } else if (compareIds[0] === id) {
      setCompareIds([null, null]);
    } else if (compareIds[1] === id) {
      setCompareIds([compareIds[0], null]);
    } else {
      setCompareIds([compareIds[0], id]);
    }
  };

  const comparedVersions = useMemo(() => {
    if (!compareIds[0] || !compareIds[1]) return null;
    const v1 = versions.find((v) => v.id === compareIds[0]);
    const v2 = versions.find((v) => v.id === compareIds[1]);
    if (!v1 || !v2) return null;
    return v1.createdAt < v2.createdAt ? [v1, v2] : [v2, v1];
  }, [compareIds, versions]);

  const getLineDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff: { type: 'same' | 'added' | 'removed'; text: string }[] = [];
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      if (oldLine === newLine) {
        if (oldLine !== undefined) diff.push({ type: 'same', text: oldLine });
      } else {
        if (oldLine !== undefined) diff.push({ type: 'removed', text: oldLine });
        if (newLine !== undefined) diff.push({ type: 'added', text: newLine });
      }
    }
    return diff;
  };

  return (
    <div className="version-history-overlay" onClick={onClose}>
      <div className="version-history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="version-history-header">
          <div className="version-history-title">
            <History size={18} />
            <span>{t.prompts.versions}</span>
          </div>
          <div className="version-history-subtitle">{promptTitle}</div>
          <button className="version-history-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="version-history-toolbar">
          <button
            className={`version-compare-toggle ${compareMode ? 'active' : ''}`}
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareIds([null, null]);
            }}
          >
            {t.prompts.compareVersions}
          </button>
          {compareMode && (
            <span className="version-compare-hint">
              {compareIds[0] === null
                ? t.prompts.selectVersion1
                : compareIds[1] === null
                ? t.prompts.selectVersion2
                : t.prompts.comparing}
            </span>
          )}
        </div>

        {/* Compare View */}
        {compareMode && comparedVersions && (
          <div className="version-compare-view">
            <div className="version-compare-header">
              <div className="version-compare-col">
                <span className="version-compare-label">{t.prompts.older}</span>
                <span className="version-compare-date">{formatFullDate(comparedVersions[0].createdAt)}</span>
              </div>
              <div className="version-compare-col">
                <span className="version-compare-label">{t.prompts.newer}</span>
                <span className="version-compare-date">{formatFullDate(comparedVersions[1].createdAt)}</span>
              </div>
            </div>
            
            {comparedVersions[0].title !== comparedVersions[1].title && (
              <div className="version-compare-section">
                <div className="version-compare-section-title">{t.prompts.titleChanged}</div>
                <div className="version-compare-diff">
                  <div className="diff-line removed">{comparedVersions[0].title}</div>
                  <div className="diff-line added">{comparedVersions[1].title}</div>
                </div>
              </div>
            )}
            
            <div className="version-compare-section">
              <div className="version-compare-section-title">{t.prompts.promptContent}</div>
              <div className="version-compare-diff">
                {getLineDiff(comparedVersions[0].content, comparedVersions[1].content).map((line, i) => (
                  <div key={i} className={`diff-line ${line.type}`}>
                    {line.type === 'added' && <Plus size={12} />}
                    {line.type === 'removed' && <Minus size={12} />}
                    <span>{line.text || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Version List */}
        {!comparedVersions && (
          <div className="version-history-content">
            {versions.length === 0 ? (
              <div className="version-history-empty">
                <History size={32} />
                <p>{t.prompts.noVersions}</p>
                <span>{t.prompts.noVersionsHint}</span>
              </div>
            ) : (
              <div className="version-list">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`version-item ${expandedId === version.id ? 'expanded' : ''} ${
                      compareMode && (compareIds[0] === version.id || compareIds[1] === version.id) ? 'selected' : ''
                    }`}
                  >
                    <div
                      className="version-item-header"
                      onClick={() => compareMode ? handleCompareSelect(version.id) : toggleExpand(version.id)}
                    >
                      {compareMode ? (
                        <div className={`version-checkbox ${compareIds.includes(version.id) ? 'checked' : ''}`}>
                          {compareIds[0] === version.id ? '1' : compareIds[1] === version.id ? '2' : ''}
                        </div>
                      ) : (
                        <button className="version-expand-btn">
                          {expandedId === version.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                      
                      <div className="version-item-info">
                        <div className="version-item-time">
                          <Clock size={12} />
                          <span title={formatFullDate(version.createdAt)}>{formatDate(version.createdAt)}</span>
                          {index === 0 && <span className="version-badge">{t.prompts.latest}</span>}
                        </div>
                        {version.message && (
                          <div className="version-item-message">{version.message}</div>
                        )}
                        <div className="version-item-meta">
                          <span><FileText size={10} /> {t.prompts.chars.replace('{count}', version.content.length.toString())}</span>
                          <span><Tag size={10} /> {t.prompts.tagsCount.replace('{count}', version.tags.length.toString())}</span>
                        </div>
                      </div>
                      
                      {!compareMode && (
                        <div className="version-item-actions">
                          <button
                            className="version-action-btn restore"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(t.prompts.restoreVersionConfirm)) {
                                onRestore(version);
                              }
                            }}
                            title={t.prompts.restoreVersion}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            className="version-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ isOpen: true, versionId: version.id });
                            }}
                            title={t.common.delete}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {expandedId === version.id && !compareMode && (
                      <div className="version-item-content">
                        <div className="version-preview-title">
                          <strong>{t.prompts.promptTitle}:</strong> {version.title}
                        </div>
                        <div className="version-preview-tags">
                          <strong>{t.prompts.tags}:</strong> {version.tags.length > 0 ? version.tags.join(', ') : t.common.none}
                        </div>
                        <div className="version-preview-content">
                          <strong>{t.prompts.promptContent}:</strong>
                          <pre>{version.content}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="version-history-footer">
          <span className="version-history-count">
            {versions.length === 1 
              ? t.prompts.versionCount.replace('{count}', versions.length.toString())
              : t.prompts.versionsCount.replace('{count}', versions.length.toString())
            }
          </span>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={t.prompts.deleteVersion}
        message={t.trash.cannotUndo}
        variant="danger"
        confirmLabel={t.common.delete}
        onConfirm={() => {
          if (deleteConfirm.versionId) {
            onDelete(deleteConfirm.versionId);
          }
          setDeleteConfirm({ isOpen: false, versionId: null });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, versionId: null })}
      />
    </div>
  );
}
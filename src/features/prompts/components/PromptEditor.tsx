/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, Save, Edit3, Puzzle, History, X } from 'lucide-react'; // Removed BookOpen
import { Prompt, PromptComponent, PromptVersion } from '@/types'; // Removed GlossaryTerm
import { TagInput } from '@/shared/components/TagInput';
import { ComponentPicker } from '@/features/blocks/components/ComponentPicker';
import { VersionHistory } from './VersionHistory';
import { HighlightedTextarea, HighlightedTextView } from '@/shared/components/HighlightedTextarea';
import { HighlightSettings } from '@/shared/utils/highlighting';

interface PromptEditorProps {
  prompt: Prompt | null;
  isNew: boolean;
  allTags: string[];
  components: PromptComponent[];
  getTagColor: (tag: string) => string;
  getTypeColor: (typeId: string) => string;
  onSave: (title: string, content: string, tags: string[]) => void;
  onDelete: () => void;
  onSetTagColor: (tag: string, color: string) => void;
  showToast?: (message: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  versions?: PromptVersion[];
  onSaveVersion?: (promptId: string, title: string, content: string, tags: string[]) => void;
  onRestoreVersion?: (version: PromptVersion) => void;
  onDeleteVersion?: (versionId: string) => void;
  highlightSettings?: HighlightSettings;
  autoEdit?: boolean;
}

export function PromptEditor({
  prompt,
  isNew,
  allTags,
  components,
  getTagColor,
  getTypeColor,
  onSave,
  onDelete,
  onSetTagColor,
  showToast,
  onDirtyChange,
  versions = [],
  onSaveVersion,
  onRestoreVersion: _onRestoreVersion,
  onDeleteVersion,
  highlightSettings,
  autoEdit = false,
}: PromptEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [originalTags, setOriginalTags] = useState<string[]>([]);

  const isDirty = isEditing && (
    title !== originalTitle ||
    content !== originalContent ||
    JSON.stringify(tags) !== JSON.stringify(originalTags)
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setTags(prompt.tags || []);
      setOriginalTitle(prompt.title);
      setOriginalContent(prompt.content);
      setOriginalTags(prompt.tags || []);
      setIsEditing(isNew || autoEdit);
    }
  }, [prompt, isNew, autoEdit]);

  useEffect(() => {
    if (isNew) {
      setTitle('');
      setContent('');
      setTags([]);
      setOriginalTitle('');
      setOriginalContent('');
      setOriginalTags([]);
      setIsEditing(true);
    }
  }, [isNew]);

  useEffect(() => {
    const handleSaveShortcut = () => {
      if (isEditing && title.trim()) {
        handleSave();
      }
    };
    
    window.addEventListener('shortcut-save', handleSaveShortcut);
    return () => window.removeEventListener('shortcut-save', handleSaveShortcut);
  }, [isEditing, title, content, tags]);

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    
    if (prompt && !isNew && onSaveVersion && (
      originalTitle !== title || 
      originalContent !== content || 
      JSON.stringify(originalTags) !== JSON.stringify(tags)
    )) {
      onSaveVersion(prompt.id, originalTitle, originalContent, originalTags);
    }
    
    onSave(title, content, tags);
    setOriginalTitle(title);
    setOriginalContent(content);
    setOriginalTags(tags);
    setIsEditing(false);
  }, [title, content, tags, onSave, prompt, isNew, onSaveVersion, originalTitle, originalContent, originalTags]);

  const handleRestoreVersion = useCallback((version: PromptVersion) => {
    setTitle(version.title);
    setContent(version.content);
    setTags(version.tags);
    setIsEditing(true);
    setShowVersionHistory(false);
    showToast?.('Version restored - save to apply changes');
  }, [showToast]);

  useEffect(() => {
    const handleExternalSave = () => {
      if (isDirty && title.trim()) {
        handleSave();
      }
    };
    
    window.addEventListener('force-save-prompt', handleExternalSave);
    return () => window.removeEventListener('force-save-prompt', handleExternalSave);
  }, [isDirty, title, handleSave]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showToast?.('Copied to clipboard');
  };

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleInsertContent = (insertContent: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) +
        insertContent +
        content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + insertContent.length,
          start + insertContent.length
        );
      }, 0);
    } else {
      setContent(content + (content ? '\n\n' : '') + insertContent);
    }
  };

  if (!prompt && !isNew) {
    return <div className="empty-state">Select a prompt</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      <div className="editor-header" style={{ flexShrink: 0 }}>
        {isEditing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            placeholder="Title..."
            autoFocus={isNew}
            style={{ flex: 1, minWidth: 0 }} 
          />
        ) : (
          <span className="prompt-title">{prompt?.title}</span>
        )}
        
        <div className="header-actions">
          {isEditing ? (
            <button onClick={handleSave} className="action-btn save" title="Save changes">
              <Save size={16} />
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="action-btn" title="Edit prompt">
              <Edit3 size={16} />
            </button>
          )}

          {!isNew && (
            <button
              onClick={() => setShowVersionHistory(true)}
              className="action-btn history"
              title={`Version history (${versions.length})`}
            >
              <History size={16} />
              {versions.length > 0 && (
                <span className="version-count">{versions.length}</span>
              )}
            </button>
          )}
          
          <button onClick={onDelete} className="action-btn delete" title="Delete prompt">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="tags-section" style={{ flexShrink: 0 }}>
        <div className="tags-list">
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: getTagColor(tag),
                color: 'white',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                marginRight: '6px',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <span>{tag}</span>
              {isEditing && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  title="Remove tag"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer',
                    color: 'white',
                    padding: 0,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)';
                  }}
                >
                  <X size={9} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}
          
          {isEditing && (
            <TagInput
              existingTags={tags}
              allTags={allTags}
              onAddTag={handleAddTag}
              getTagColor={getTagColor}
            />
          )}
          {!isEditing && tags.length === 0 && (
            <span className="tags-empty">No tags</span>
          )}
        </div>
      </div>

      <div className="editor-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {isEditing ? (
          <>
            <div className="editor-toolbar" style={{ flexShrink: 0 }}>
              <button
                className="toolbar-btn"
                onClick={() => setShowComponentPicker(true)}
                title="Insert component"
              >
                <Puzzle size={14} />
                <span>Insert Component</span>
              </button>
              {/* Insert Term Button Removed */}
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {highlightSettings ? (
                <HighlightedTextarea
                  value={content}
                  onChange={setContent}
                  placeholder="Enter prompt content..."
                  components={components}
                  highlightSettings={highlightSettings}
                  getTypeColor={getTypeColor}
                  textareaRef={textareaRef}
                />
              ) : (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="content-textarea"
                  placeholder="Enter prompt content..."
                  style={{ flex: 1, resize: 'none', height: '100%', boxSizing: 'border-box' }}
                />
              )}
            </div>

            {showComponentPicker && (
              <ComponentPicker
                components={components}
                onInsert={handleInsertContent}
                onClose={() => setShowComponentPicker(false)}
              />
            )}
          </>
        ) : (
          <div 
            className="content-view-card" 
            onClick={handleCopy} 
            title="Click to copy"
            style={{ flex: 1, overflowY: 'auto', height: '100%' }}
          >
            {highlightSettings ? (
              <HighlightedTextView
                content={prompt?.content || ''}
                components={components}
                highlightSettings={highlightSettings}
                getTypeColor={getTypeColor}
              />
            ) : (
              <div className="content-text">{prompt?.content}</div>
            )}
          </div>
        )}
      </div>

      {showVersionHistory && prompt && (
        <VersionHistory
          promptId={prompt.id}
          promptTitle={prompt.title}
          versions={versions}
          onRestore={handleRestoreVersion}
          onDelete={(versionId) => {
            onDeleteVersion?.(versionId);
          }}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
}
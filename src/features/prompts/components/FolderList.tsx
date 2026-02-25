/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal,
  Edit2,
  Trash2,
  FileText,
  GripVertical
} from 'lucide-react';
import { PromptFolder, Prompt, FOLDER_COLORS } from '@/types';
import { useLanguage } from '@/shared/hooks';

interface FolderListProps {
  folders: PromptFolder[];
  prompts: Prompt[];
  selectedFolderId: string | null | undefined; // undefined = all, null = unfiled
  onSelectFolder: (folderId: string | null | undefined) => void;
  onCreateFolder: (name: string, color?: string) => void;
  onUpdateFolder: (id: string, updates: Partial<PromptFolder>) => void;
  onDeleteFolder: (id: string) => void;
  onReorderFolder?: (dragId: string, dropId: string) => void;
  onMovePromptToFolder?: (promptId: string, folderId: string | null) => void;
}

export function FolderList({
  folders,
  prompts,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onReorderFolder,
  onMovePromptToFolder,
}: FolderListProps) {
  const { t } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Count prompts per folder
  const getPromptCount = useCallback((folderId: string | null) => {
    if (folderId === null) {
      return prompts.filter(p => !p.folderId).length;
    }
    return prompts.filter(p => p.folderId === folderId).length;
  }, [prompts]);

  const totalPrompts = prompts.length;
  const unfiledCount = getPromptCount(null);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setNewFolderColor(FOLDER_COLORS[0]);
      setIsCreating(false);
    }
  };

  const handleStartEdit = (folder: PromptFolder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
    setMenuOpenId(null);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleSaveEdit = (folderId: string) => {
    if (editName.trim()) {
      onUpdateFolder(folderId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDeleteFolder = (folderId: string) => {
    onDeleteFolder(folderId);
    setMenuOpenId(null);
    if (selectedFolderId === folderId) {
      onSelectFolder(undefined); // Go back to "All"
    }
  };

  const toggleExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Drag and drop for reordering folders
  const handleDragStart = (e: React.DragEvent, folderId: string) => {
    setDraggedId(folderId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', folderId);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    if (!draggedId || draggedId === folderId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (draggedId && onReorderFolder && draggedId !== dropId) {
      onReorderFolder(draggedId, dropId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Handle dropping a prompt onto a folder
  const handlePromptDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const promptId = e.dataTransfer.getData('prompt-id');
    if (promptId && onMovePromptToFolder) {
      onMovePromptToFolder(promptId, folderId);
    }
    setDragOverId(null);
  };

  const handlePromptDragOver = (e: React.DragEvent, folderId: string | null) => {
    const hasPromptData = e.dataTransfer.types.includes('prompt-id');
    if (hasPromptData) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverId(folderId || 'unfiled');
    }
  };

  return (
    <div className="folder-list">
      {/* All Prompts */}
      <div
        className={`folder-item ${selectedFolderId === undefined ? 'active' : ''}`}
        onClick={() => onSelectFolder(undefined)}
      >
        <FileText size={14} className="folder-icon" />
        <span className="folder-name">{t.folders.allPrompts}</span>
        <span className="folder-count">{totalPrompts}</span>
      </div>

      {/* Unfiled Prompts */}
      <div
        className={`folder-item ${selectedFolderId === null ? 'active' : ''} ${dragOverId === 'unfiled' ? 'drag-over' : ''}`}
        onClick={() => onSelectFolder(null)}
        onDragOver={(e) => handlePromptDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handlePromptDrop(e, null)}
      >
        <Folder size={14} className="folder-icon" />
        <span className="folder-name">{t.folders.unfiled}</span>
        <span className="folder-count">{unfiledCount}</span>
      </div>

      {/* Folder separator */}
      {folders.length > 0 && <div className="folder-separator" />}

      {/* Folders */}
      {folders.map((folder) => {
        const isEditing = editingId === folder.id;
        const isMenuOpen = menuOpenId === folder.id;
        const isExpanded = expandedFolders.has(folder.id);
        const promptCount = getPromptCount(folder.id);
        const isDragging = draggedId === folder.id;
        const isDragOver = dragOverId === folder.id;

        return (
          <div key={folder.id} className="folder-item-wrapper">
            <div
              className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onClick={() => !isEditing && onSelectFolder(folder.id)}
              draggable={!isEditing && !!onReorderFolder}
              onDragStart={(e) => handleDragStart(e, folder.id)}
              onDragOver={(e) => {
                handleDragOver(e, folder.id);
                handlePromptDragOver(e, folder.id);
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                handleDrop(e, folder.id);
                handlePromptDrop(e, folder.id);
              }}
              onDragEnd={handleDragEnd}
            >
              {onReorderFolder && !isEditing && (
                <div className="folder-drag-handle" onClick={(e) => e.stopPropagation()}>
                  <GripVertical size={12} />
                </div>
              )}
              
              {promptCount > 0 && (
                <button
                  className="folder-expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(folder.id);
                  }}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}
              
              <Folder 
                size={14} 
                className="folder-icon" 
                style={{ color: folder.color || FOLDER_COLORS[0] }}
                fill={folder.color || FOLDER_COLORS[0]}
              />
              
              {isEditing ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleSaveEdit(folder.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(folder.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="folder-edit-input"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="folder-name">{folder.name}</span>
              )}
              
              <span className="folder-count">{promptCount}</span>
              
              <button
                className={`folder-menu-btn ${isMenuOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(isMenuOpen ? null : folder.id);
                }}
              >
                <MoreHorizontal size={14} />
              </button>
              
              {isMenuOpen && (
                <div className="folder-menu" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleStartEdit(folder)}>
                    <Edit2 size={12} /> Rename
                  </button>
                  <button onClick={() => {
                    setMenuOpenId(null);
                    // Show color picker - for now just cycle colors
                    const currentIndex = FOLDER_COLORS.indexOf(folder.color || FOLDER_COLORS[0]);
                    const nextColor = FOLDER_COLORS[(currentIndex + 1) % FOLDER_COLORS.length];
                    onUpdateFolder(folder.id, { color: nextColor });
                  }}>
                    <Folder size={12} /> Change Color
                  </button>
                  <button className="danger" onClick={() => handleDeleteFolder(folder.id)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
            
            {/* Show prompts in folder when expanded */}
            {isExpanded && promptCount > 0 && (
              <div className="folder-prompts">
                {prompts
                  .filter(p => p.folderId === folder.id)
                  .slice(0, 5)
                  .map(p => (
                    <div key={p.id} className="folder-prompt-item">
                      <FileText size={10} />
                      <span>{p.title}</span>
                    </div>
                  ))}
                {promptCount > 5 && (
                  <div className="folder-prompt-more">
                    +{promptCount - 5} more
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Create new folder */}
      {isCreating ? (
        <div className="folder-create-form">
          <div className="folder-create-input-row">
            <button
              className="folder-color-btn"
              style={{ backgroundColor: newFolderColor }}
              onClick={() => {
                const currentIndex = FOLDER_COLORS.indexOf(newFolderColor);
                setNewFolderColor(FOLDER_COLORS[(currentIndex + 1) % FOLDER_COLORS.length]);
              }}
              title="Change color"
            />
            <input
              ref={inputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="folder-name-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              autoFocus
            />
          </div>
          <div className="folder-create-actions">
            <button className="folder-cancel-btn" onClick={() => setIsCreating(false)}>
              Cancel
            </button>
            <button 
              className="folder-save-btn" 
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </button>
          </div>
        </div>
      ) : (
        <button 
          className="folder-add-btn"
          onClick={() => {
            setIsCreating(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <FolderPlus size={14} />
          <span>{t.folders.newFolder}</span>
        </button>
      )}

      {/* Click outside to close menu */}
      {menuOpenId && (
        <div 
          className="folder-menu-backdrop" 
          onClick={() => setMenuOpenId(null)}
        />
      )}
    </div>
  );
}

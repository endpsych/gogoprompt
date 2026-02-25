/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useCallback, useState } from 'react';
import { 
  usePromptStore, 
  useFolderStore, 
  useUIStore, 
  useSettingsStore,
  useVariableStore
} from '@/stores';
import { useUndoRedo, useLanguage } from './';
import { Prompt } from '@/types';
import { useTrash } from '@/features/trash/contexts/TrashContext';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogState {
    isOpen: boolean;
    title: string;
    message: string;
    variant: ConfirmDialogVariant;
    confirmLabel: string;
    onConfirm: () => void;
}

export function useAppActions(selectedFolderId: string | null | undefined) {
    const { t, interpolate } = useLanguage(); 
    const { moveToTrash } = useTrash(); 

    const { 
        selectedId, checkUnsavedChanges, setSelectedId, setIsNewPrompt, 
        setIsDirty, showToast 
    } = useUIStore();
    
    const { pushAction } = useUndoRedo();

    const { addPrompt, updatePrompt, deletePrompt: deletePromptFromStore, getPrompt, clearFolderFromPrompts } = usePromptStore();
    const { createFolder, deleteFolder: deleteFolderFromStore, getFolder } = useFolderStore();
    const { versions, deletePromptVersions } = useSettingsStore();
    
    const { 
        deleteVariable: deleteVariableFromStore, 
        getVariable, 
        addVariable, 
        variables 
    } = useVariableStore((state) => ({
        deleteVariable: state.deleteVariable,
        getVariable: (id: string) => state.variables.find(v => v.id === id),
        addVariable: state.addVariable,
        variables: state.variables
    }));

    const extractAndSaveVariables = useCallback((content: string) => {
        if (!content) return;
        const regex = /\{\{\s*([^}]+)\s*\}\}/g;
        const matches = [...content.matchAll(regex)];
        
        let addedCount = 0;
        matches.forEach(match => {
            const rawKey = match[1].trim(); 
            if (!rawKey) return;
            const exists = variables.some(v => v.key.toLowerCase() === rawKey.toLowerCase());
            
            if (!exists) {
                addVariable({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    key: rawKey,
                    type: 'text', 
                    value: '',
                    description: 'Auto-extracted from prompt'
                });
                addedCount++;
            }
        });
    }, [variables, addVariable]);

    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        confirmLabel: 'Delete',
        onConfirm: () => {},
    });

    const showConfirmDialog = useCallback((options: {
        title: string;
        message: string;
        variant?: ConfirmDialogVariant;
        confirmLabel?: string;
        onConfirm: () => void;
    }) => {
        setConfirmDialog({
            isOpen: true,
            title: options.title,
            message: options.message,
            variant: options.variant || 'danger',
            confirmLabel: options.confirmLabel || t.prompts.deleteButton || 'Delete', 
            onConfirm: options.onConfirm,
        });
    }, [t.prompts.deleteButton, t.common.delete]);

    const hideConfirmDialog = useCallback(() => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleNewPrompt = useCallback(() => {
        checkUnsavedChanges(() => {
            setSelectedId('NEW');
            setIsNewPrompt(true);
            setIsDirty(false);
        });
    }, [checkUnsavedChanges, setSelectedId, setIsNewPrompt, setIsDirty]);

    const handleCreatePrompt = useCallback((title: string, content: string, tags: string[], profileIds?: string[]) => {
        extractAndSaveVariables(content);

        const folderId = selectedFolderId === undefined ? null : selectedFolderId;
        
        // 1. Create with standard arguments
        const newPrompt = addPrompt(title, content, tags, folderId);
        
        // 2. If profileIds exist, update immediately
        if (profileIds && profileIds.length > 0) {
             usePromptStore.getState().updatePrompt(newPrompt.id, { profileIds });
        }

        // Setup Undo
        pushAction(createPromptAction(
            'prompt-create',
            `Create prompt "${title}"`,
            () => {
                deletePromptFromStore(newPrompt.id);
                if (useUIStore.getState().selectedId === newPrompt.id) {
                     setSelectedId(null);
                }
            },
            () => {
                const restored = addPrompt(title, content, tags, folderId);
                if (profileIds && profileIds.length > 0) {
                    usePromptStore.getState().updatePrompt(restored.id, { profileIds });
                }
                setSelectedId(restored.id);
            }
        ));
        
        setSelectedId(newPrompt.id);
        setIsNewPrompt(false);
        showToast(t.prompts.promptSaved || "Prompt created", 'success');
    }, [selectedFolderId, addPrompt, deletePromptFromStore, setSelectedId, setIsNewPrompt, showToast, pushAction, extractAndSaveVariables, t]);

    const handleAddFromTemplate = useCallback((title: string, content: string, tags: string[]) => {
        handleCreatePrompt(title, content, tags);
        showToast(`Added "${title}" from templates`);
    }, [handleCreatePrompt, showToast]);

    const handleSavePrompt = useCallback((title: string, content: string, tags: string[]) => {
        extractAndSaveVariables(content);
        
        const isUpdating = selectedId && selectedId !== 'NEW';

        if (!isUpdating) {
            handleCreatePrompt(title, content, tags);
        } else {
            const oldPrompt = getPrompt(selectedId!);
            if (oldPrompt) {
                const oldTitle = oldPrompt.title;
                const oldContent = oldPrompt.content;
                const oldTags = [...oldPrompt.tags];
                
                pushAction(createPromptAction(
                    'prompt-update',
                    `Edit prompt "${oldTitle}"`,
                    () => {
                        updatePrompt(selectedId!, { title: oldTitle, content: oldContent, tags: oldTags });
                    },
                    () => {
                        updatePrompt(selectedId!, { title, content, tags });
                    }
                ));
            }
            
            updatePrompt(selectedId!, { title, content, tags });
            showToast(t.prompts.promptSaved);
        }
    }, [selectedId, handleCreatePrompt, updatePrompt, getPrompt, pushAction, t.prompts.promptSaved, extractAndSaveVariables, showToast]);

    const handleDeletePrompt = useCallback((targetId?: string) => {
        const id = targetId || useUIStore.getState().selectedId;
        if (!id || id === 'NEW') return;
        
        const prompt = usePromptStore.getState().getPrompt(id);
        if (!prompt) return;
        
        const promptTitle = prompt.title && prompt.title.trim() !== '' ? prompt.title : (t.prompts.untitled || 'Untitled Prompt');

        showConfirmDialog({
            title: t.prompts.deletePromptTitle || 'Confirm Prompt Deletion',
            message: interpolate(t.prompts.deletePromptConfirm, { title: promptTitle }),
            variant: 'danger',
            confirmLabel: t.prompts.deleteButton || 'Delete', 
            
            onConfirm: () => {
                moveToTrash({
                    type: 'prompt', 
                    originalId: prompt.id,
                    label: promptTitle,
                    data: prompt,
                    origin: 'prompts'
                });

                deletePromptVersions(id);
                usePromptStore.getState().deletePrompt(id);
                
                if (useUIStore.getState().selectedId === id) {
                    setSelectedId(null);
                    setIsNewPrompt(false);
                }
                
                showToast(t.prompts.promptDeleted);
                hideConfirmDialog();
            },
        });
    }, [getPrompt, versions, deletePromptVersions, deletePromptFromStore, setSelectedId, setIsNewPrompt, showToast, showConfirmDialog, hideConfirmDialog, moveToTrash, t, interpolate]);

    const handleCreateFolder = useCallback((name: string, color?: string) => {
        useFolderStore.getState().addFolder(name, color);
        showToast(`Folder "${name}" created`);
    }, [showToast]);

    const handleDeleteFolder = useCallback((folderId: string) => {
        const folder = getFolder(folderId);
        if (!folder) return;
        
        showConfirmDialog({
            title: t.folders.deleteFolder,
            message: `Are you sure you want to move the folder "${folder.name}" to the trash? Items inside will be moved to the trash as well.`,
            variant: 'warning',
            confirmLabel: t.variables.moveToTrash || "Move to Trash", 
            onConfirm: () => {
                moveToTrash({
                    type: 'folder',
                    originalId: folder.id,
                    label: folder.name,
                    data: folder,
                    origin: 'folders'
                });

                clearFolderFromPrompts(folderId);
                deleteFolderFromStore(folderId);
                
                if (selectedFolderId === folderId) {
                useUIStore.getState().setSelectedId(null);
                }
                showToast("Folder moved to trash");
                hideConfirmDialog();
            },
        });
    }, [getFolder, clearFolderFromPrompts, deleteFolderFromStore, showConfirmDialog, hideConfirmDialog, showToast, t.folders.deleteFolder, selectedFolderId, moveToTrash, t]);

    const handleMovePromptToFolder = useCallback((promptId: string, folderId: string | undefined) => {
        const prompt = getPrompt(promptId);
        if (prompt) {
            usePromptStore.getState().updatePrompt(promptId, { folderId });
        }
    }, [getPrompt]);

    const handleDeleteVariable = useCallback((id: string) => {
        const variable = getVariable(id);
        if (!variable) return;

        showConfirmDialog({
            title: t.variables.deleteTitle,
            message: interpolate(t.variables.deleteConfirm, { variable: `{{${variable.key}}}` }),
            variant: 'danger',
            confirmLabel: t.variables.moveToTrash,
            onConfirm: () => {
                moveToTrash({
                    type: 'other',
                    originalId: variable.id,
                    label: `{{${variable.key}}}`,
                    data: variable,
                    origin: 'variables'
                });

                deleteVariableFromStore(id);
                showToast(t.variables.variableMovedToTrash);
                hideConfirmDialog();
            },
        });
    }, [getVariable, deleteVariableFromStore, showConfirmDialog, hideConfirmDialog, showToast, moveToTrash, t, interpolate]);

    return {
        confirmDialog,
        showConfirmDialog,
        hideConfirmDialog,
        handleNewPrompt,
        handleAddFromTemplate,
        handleSavePrompt,
        handleCreatePrompt, 
        handleDeletePrompt,
        handleCreateFolder,
        handleDeleteFolder,
        handleMovePromptToFolder: usePromptStore.getState().moveToFolder, 
        handleDeleteVariable, 
    };
}
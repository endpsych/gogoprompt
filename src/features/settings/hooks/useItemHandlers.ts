/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useCallback, useMemo } from 'react';
import { Prompt, PromptComponent, GlossaryTerm, ComponentType } from '@/types';
import { Tab } from '@/shared/hooks/useAppState';

interface UseItemHandlersProps {
  // State
  activeTab: Tab;
  selectedId: string | null;
  isNewPrompt: boolean;
  isNewComponent: boolean;
  isNewTerm: boolean;
  activeTagFilters: string[];

  // State setters
  setSelectedId: (id: string | null) => void;
  setIsNewPrompt: (isNew: boolean) => void;
  setIsNewComponent: (isNew: boolean) => void;
  setIsNewTerm: (isNew: boolean) => void;
  setActiveTagFilters: (tags: string[]) => void;
  setIsDirty: (dirty: boolean) => void;
  checkUnsavedChanges: (action: () => void) => void;

  // Data operations
  addPrompt: (title: string, content: string, tags: string[]) => Prompt;
  editPrompt: (id: string, updates: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  deletePromptVersions: (promptId: string) => void;
  deleteTag: (tag: string) => void;
  renameTag: (oldName: string, newName: string) => void;

  addComponent: (name: string, type: ComponentType, content: string) => PromptComponent;
  editComponent: (id: string, updates: Partial<PromptComponent>) => void;
  deleteComponent: (id: string) => void;

  addTerm: (term: string, definition: string, category?: string) => GlossaryTerm;
  editTerm: (id: string, updates: Partial<GlossaryTerm>) => void;
  deleteTerm: (id: string) => void;

  // UI feedback
  showToast: (message: string) => void;
}

export function useItemHandlers({
  activeTab,
  selectedId,
  isNewPrompt,
  isNewComponent,
  isNewTerm,
  activeTagFilters,
  setSelectedId,
  setIsNewPrompt,
  setIsNewComponent,
  setIsNewTerm,
  setActiveTagFilters,
  setIsDirty,
  checkUnsavedChanges,
  addPrompt,
  editPrompt,
  deletePrompt,
  deletePromptVersions,
  deleteTag,
  renameTag,
  addComponent,
  editComponent,
  deleteComponent,
  addTerm,
  editTerm,
  deleteTerm,
  showToast,
}: UseItemHandlersProps) {
  // Prompt handlers
  const handleNewPrompt = useCallback(() => {
    checkUnsavedChanges(() => {
      setSelectedId('NEW');
      setIsNewPrompt(true);
      setIsDirty(false);
    });
  }, [checkUnsavedChanges, setSelectedId, setIsNewPrompt, setIsDirty]);

  const handleSelectPrompt = useCallback((id: string) => {
    if (id === selectedId) return;
    checkUnsavedChanges(() => {
      setSelectedId(id);
      setIsNewPrompt(false);
      setIsDirty(false);
    });
  }, [selectedId, checkUnsavedChanges, setSelectedId, setIsNewPrompt, setIsDirty]);

  const handleSavePrompt = useCallback((title: string, content: string, tags: string[]) => {
    if (isNewPrompt) {
      const newPrompt = addPrompt(title, content, tags);
      setSelectedId(newPrompt.id);
      setIsNewPrompt(false);
      showToast('Prompt created');
    } else if (selectedId) {
      editPrompt(selectedId, { title, content, tags });
      showToast('Prompt saved');
    }
  }, [isNewPrompt, selectedId, addPrompt, editPrompt, setSelectedId, setIsNewPrompt, showToast]);

  const handleDeletePrompt = useCallback(() => {
    if (selectedId && confirm('Delete this prompt?')) {
      deletePromptVersions(selectedId);
      deletePrompt(selectedId);
      setSelectedId(null);
      setIsNewPrompt(false);
      showToast('Prompt deleted');
    }
  }, [selectedId, deletePromptVersions, deletePrompt, setSelectedId, setIsNewPrompt, showToast]);

  const handleDeleteTag = useCallback((tag: string) => {
    if (activeTagFilters.includes(tag)) {
      setActiveTagFilters(activeTagFilters.filter((t) => t !== tag));
    }
    deleteTag(tag);
    showToast(`Tag "${tag}" deleted`);
  }, [activeTagFilters, setActiveTagFilters, deleteTag, showToast]);

  const handleRenameTag = useCallback((oldName: string, newName: string) => {
    if (activeTagFilters.includes(oldName)) {
      setActiveTagFilters(activeTagFilters.map((t) => (t === oldName ? newName : t)));
    }
    renameTag(oldName, newName);
    showToast(`Tag renamed to "${newName}"`);
  }, [activeTagFilters, setActiveTagFilters, renameTag, showToast]);

  // Component handlers
  const handleNewComponent = useCallback(() => {
    checkUnsavedChanges(() => {
      setSelectedId('NEW');
      setIsNewComponent(true);
      setIsDirty(false);
    });
  }, [checkUnsavedChanges, setSelectedId, setIsNewComponent, setIsDirty]);

  const handleSelectComponent = useCallback((id: string) => {
    if (id === selectedId) return;
    checkUnsavedChanges(() => {
      setSelectedId(id);
      setIsNewComponent(false);
      setIsDirty(false);
    });
  }, [selectedId, checkUnsavedChanges, setSelectedId, setIsNewComponent, setIsDirty]);

  const handleSaveComponent = useCallback((name: string, type: ComponentType, content: string) => {
    if (isNewComponent) {
      const newComp = addComponent(name, type, content);
      setSelectedId(newComp.id);
      setIsNewComponent(false);
      showToast('Component created');
    } else if (selectedId) {
      editComponent(selectedId, { name, type, content });
      showToast('Component saved');
    }
  }, [isNewComponent, selectedId, addComponent, editComponent, setSelectedId, setIsNewComponent, showToast]);

  const handleDeleteComponent = useCallback(() => {
    if (selectedId && confirm('Delete this component?')) {
      deleteComponent(selectedId);
      setSelectedId(null);
      setIsNewComponent(false);
      showToast('Component deleted');
    }
  }, [selectedId, deleteComponent, setSelectedId, setIsNewComponent, showToast]);

  // Glossary handlers
  const handleNewTerm = useCallback(() => {
    checkUnsavedChanges(() => {
      setSelectedId('NEW');
      setIsNewTerm(true);
      setIsDirty(false);
    });
  }, [checkUnsavedChanges, setSelectedId, setIsNewTerm, setIsDirty]);

  const handleSelectTerm = useCallback((id: string) => {
    if (id === selectedId) return;
    checkUnsavedChanges(() => {
      setSelectedId(id);
      setIsNewTerm(false);
      setIsDirty(false);
    });
  }, [selectedId, checkUnsavedChanges, setSelectedId, setIsNewTerm, setIsDirty]);

  const handleSaveTerm = useCallback((term: string, definition: string, category?: string) => {
    if (isNewTerm) {
      const newTerm = addTerm(term, definition, category);
      setSelectedId(newTerm.id);
      setIsNewTerm(false);
      showToast('Term added to glossary');
    } else if (selectedId) {
      editTerm(selectedId, { term, definition, category });
      showToast('Term saved');
    }
  }, [isNewTerm, selectedId, addTerm, editTerm, setSelectedId, setIsNewTerm, showToast]);

  const handleDeleteTerm = useCallback(() => {
    if (selectedId && confirm('Delete this term?')) {
      deleteTerm(selectedId);
      setSelectedId(null);
      setIsNewTerm(false);
      showToast('Term deleted');
    }
  }, [selectedId, deleteTerm, setSelectedId, setIsNewTerm, showToast]);

  // Generic new item handler based on active tab
  const handleNewItem = useCallback(() => {
    if (activeTab === 'prompts') handleNewPrompt();
    else if (activeTab === 'components') handleNewComponent();
    else if (activeTab === 'glossary') handleNewTerm();
  }, [activeTab, handleNewPrompt, handleNewComponent, handleNewTerm]);

  // Generic delete handler based on active tab
  const handleDeleteItem = useCallback(() => {
    if (activeTab === 'prompts' && selectedId) handleDeletePrompt();
    else if (activeTab === 'components' && selectedId) handleDeleteComponent();
    else if (activeTab === 'glossary' && selectedId) handleDeleteTerm();
  }, [activeTab, selectedId, handleDeletePrompt, handleDeleteComponent, handleDeleteTerm]);

  return {
    // Prompt handlers
    handleNewPrompt,
    handleSelectPrompt,
    handleSavePrompt,
    handleDeletePrompt,
    handleDeleteTag,
    handleRenameTag,

    // Component handlers
    handleNewComponent,
    handleSelectComponent,
    handleSaveComponent,
    handleDeleteComponent,

    // Glossary handlers
    handleNewTerm,
    handleSelectTerm,
    handleSaveTerm,
    handleDeleteTerm,

    // Generic handlers
    handleNewItem,
    handleDeleteItem,
  };
}

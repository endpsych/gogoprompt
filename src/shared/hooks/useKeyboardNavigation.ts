/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useCallback, useMemo, useRef } from 'react';
import { Prompt, PromptComponent, GlossaryTerm } from '@/types';
import { Tab } from '@/shared/hooks/useAppState';

interface UseKeyboardNavigationProps {
  activeTab: Tab;
  selectedId: string | null;
  filteredPrompts: Prompt[];
  components: PromptComponent[];
  terms: GlossaryTerm[];
  activePrompt: Prompt | null | undefined;
  activeComponent: PromptComponent | null | undefined;
  activeTerm: GlossaryTerm | null | undefined;
  checkUnsavedChanges: (action: () => void) => void;
  setSelectedId: (id: string | null) => void;
  setIsNewPrompt: (isNew: boolean) => void;
  setIsNewComponent: (isNew: boolean) => void;
  setIsNewTerm: (isNew: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  showToast: (message: string) => void;
}

export function useKeyboardNavigation({
  activeTab,
  selectedId,
  filteredPrompts,
  components,
  terms,
  activePrompt,
  activeComponent,
  activeTerm,
  checkUnsavedChanges,
  setSelectedId,
  setIsNewPrompt,
  setIsNewComponent,
  setIsNewTerm,
  setIsDirty,
  showToast,
}: UseKeyboardNavigationProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get current list of items for navigation
  const currentItems = useMemo(() => {
    if (activeTab === 'prompts') return filteredPrompts;
    if (activeTab === 'components') return components;
    if (activeTab === 'glossary') return terms;
    return [];
  }, [activeTab, filteredPrompts, components, terms]);

  // Navigate to previous/next item in list
  const navigateList = useCallback((direction: 'up' | 'down') => {
    if (currentItems.length === 0) return;
    
    const currentIndex = selectedId 
      ? currentItems.findIndex((item) => item.id === selectedId)
      : -1;
    
    let newIndex: number;
    if (direction === 'up') {
      newIndex = currentIndex <= 0 ? currentItems.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= currentItems.length - 1 ? 0 : currentIndex + 1;
    }
    
    const newItem = currentItems[newIndex];
    if (newItem && newItem.id !== selectedId) {
      checkUnsavedChanges(() => {
        setSelectedId(newItem.id);
        setIsNewPrompt(false);
        setIsNewComponent(false);
        setIsNewTerm(false);
        setIsDirty(false);
      });
    }
  }, [
    currentItems,
    selectedId,
    checkUnsavedChanges,
    setSelectedId,
    setIsNewPrompt,
    setIsNewComponent,
    setIsNewTerm,
    setIsDirty,
  ]);

  // Handle copy content shortcut
  const handleCopyContent = useCallback(() => {
    let content = '';
    if (activeTab === 'prompts' && activePrompt) {
      content = activePrompt.content;
    } else if (activeTab === 'components' && activeComponent) {
      content = activeComponent.content;
    } else if (activeTab === 'glossary' && activeTerm) {
      content = `${activeTerm.term}: ${activeTerm.definition}`;
    }
    
    if (content) {
      navigator.clipboard.writeText(content);
      showToast('Copied to clipboard');
    }
  }, [activeTab, activePrompt, activeComponent, activeTerm, showToast]);

  // Handle save shortcut
  const handleSaveShortcut = useCallback(() => {
    // Trigger save by dispatching a custom event that editors can listen to
    window.dispatchEvent(new CustomEvent('shortcut-save'));
  }, []);

  // Focus search input
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  return {
    searchInputRef,
    navigateList,
    handleCopyContent,
    handleSaveShortcut,
    focusSearch,
  };
}

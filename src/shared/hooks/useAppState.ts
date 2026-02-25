/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useCallback } from 'react';
import { FilterMode } from '../components/TagsFilter';

export type Tab = 'prompts' | 'components' | 'glossary';

const MINI_MODE_KEY = 'prompter-mini-mode';

export interface AppState {
  activeTab: Tab;
  selectedId: string | null;
  search: string;
  activeTagFilters: string[];
  filterMode: FilterMode;
  isNewPrompt: boolean;
  isNewComponent: boolean;
  isNewTerm: boolean;
  showSettings: boolean;
  isDirty: boolean;
  isMiniMode: boolean;
}

export function useAppState() {
  const [activeTab, setActiveTab] = useState<Tab>('prompts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('AND');
  const [isNewPrompt, setIsNewPrompt] = useState(false);
  const [isNewComponent, setIsNewComponent] = useState(false);
  const [isNewTerm, setIsNewTerm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isMiniMode, setIsMiniMode] = useState(() => {
    const saved = localStorage.getItem(MINI_MODE_KEY);
    return saved === 'true';
  });

  // Mini mode toggle
  const toggleMiniMode = useCallback(() => {
    setIsMiniMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(MINI_MODE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Helper to check unsaved changes before navigation
  const checkUnsavedChanges = useCallback((action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
    } else {
      action();
    }
  }, [isDirty]);

  // Handle saving from unsaved changes dialog
  const handleSaveAndProceed = useCallback(() => {
    // Trigger save based on current tab
    if (activeTab === 'prompts') {
      window.dispatchEvent(new CustomEvent('force-save-prompt'));
    } else if (activeTab === 'components') {
      window.dispatchEvent(new CustomEvent('force-save-component'));
    } else if (activeTab === 'glossary') {
      window.dispatchEvent(new CustomEvent('force-save-glossary'));
    }
    
    // Execute pending action after a brief delay to allow save to complete
    setTimeout(() => {
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    }, 50);
  }, [activeTab, pendingAction]);

  // Handle discarding changes
  const handleDiscardChanges = useCallback(() => {
    setIsDirty(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  // Cancel the pending action
  const handleCancelNavigation = useCallback(() => {
    setPendingAction(null);
  }, []);

  // Reset selection when switching tabs
  const handleTabChange = useCallback((tab: Tab) => {
    checkUnsavedChanges(() => {
      setActiveTab(tab);
      setSelectedId(null);
      setIsNewPrompt(false);
      setIsNewComponent(false);
      setIsNewTerm(false);
      setIsDirty(false);
    });
  }, [checkUnsavedChanges]);

  // Clear all "new" flags
  const clearNewFlags = useCallback(() => {
    setIsNewPrompt(false);
    setIsNewComponent(false);
    setIsNewTerm(false);
  }, []);

  // Reset selection state
  const resetSelection = useCallback(() => {
    setSelectedId(null);
    clearNewFlags();
    setIsDirty(false);
  }, [clearNewFlags]);

  return {
    // State
    activeTab,
    selectedId,
    search,
    activeTagFilters,
    filterMode,
    isNewPrompt,
    isNewComponent,
    isNewTerm,
    showSettings,
    isDirty,
    isMiniMode,
    pendingAction,

    // Setters
    setActiveTab,
    setSelectedId,
    setSearch,
    setActiveTagFilters,
    setFilterMode,
    setIsNewPrompt,
    setIsNewComponent,
    setIsNewTerm,
    setShowSettings,
    setIsDirty,

    // Actions
    toggleMiniMode,
    checkUnsavedChanges,
    handleSaveAndProceed,
    handleDiscardChanges,
    handleCancelNavigation,
    handleTabChange,
    clearNewFlags,
    resetSelection,
  };
}

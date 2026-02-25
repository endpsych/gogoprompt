/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { create } from 'zustand';

// Type exports
export type Tab = 'prompts' | 'components' | 'variables' | 'glossary' | 'profiles' | 'settings';
export type FilterMode = 'AND' | 'OR';  // Changed to match actual usage

// Define the options passed when opening the dialog
interface ConfirmDialogOptions {
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

// Define the full state including the isOpen flag
interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
}

interface UIState {
  // --- Navigation & Filter State ---
  activeTab: string;
  selectedId: string | null;
  search: string;
  activeTagFilters: string[];
  filterMode: FilterMode;
  
  // --- App Logic State ---
  isNewPrompt: boolean;
  isDirty: boolean;
  showSettings: boolean;
  pendingAction: (() => void) | null;
  appMode: 'studio' | 'deck';
  
  // Track if the post-summoning hint on the first card should be shown
  showPostSummonHint: boolean;
  
  // --- Notification State ---
  toastMessage: string | null;
  toastVariant: 'success' | 'error' | 'warning' | 'info';
  
  // --- CONFIRM DIALOG STATE (New) ---
  confirmDialog: ConfirmDialogState;

  // --- Actions ---
  setActiveTab: (tab: string) => void;
  setSelectedId: (id: string | null) => void;
  setSearch: (search: string) => void;
  setActiveTagFilters: (tags: string[]) => void;
  setFilterMode: (mode: FilterMode) => void;
  setIsNewPrompt: (isNew: boolean) => void;
  setIsDirty: (isDirty: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setPendingAction: (action: (() => void) | null) => void;
  toggleAppMode: () => void;
  
  // Setter for the hint
  setShowPostSummonHint: (show: boolean) => void;
  
  // Toast Actions
  showToast: (message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
  
  // Dialog Actions (New)
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  hideConfirmDialog: () => void;

  // Complex Logic Actions
  handleTabChange: (tab: string) => void;
  resetSelection: () => void;
  checkUnsavedChanges: (action: () => void) => boolean;
  handleSaveAndProceed: () => void;
  handleDiscardChanges: () => void;
  handleCancelNavigation: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'prompts',
  selectedId: null,
  search: '',
  activeTagFilters: [],
  filterMode: 'AND',
  isNewPrompt: false,
  isDirty: false,
  showSettings: false,
  pendingAction: null,
  appMode: 'studio',
  showPostSummonHint: false,
  toastMessage: null,
  toastVariant: 'info',

  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: () => {},
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedId: (id) => set({ selectedId: id }),
  setSearch: (search) => set({ search }),
  setActiveTagFilters: (tags) => set({ activeTagFilters: tags }),
  setFilterMode: (mode) => set({ filterMode: mode }),
  setIsNewPrompt: (isNew) => set({ isNewPrompt: isNew }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setShowSettings: (show) => set({ showSettings: show }),
  setPendingAction: (action) => set({ pendingAction: action }),
  
  toggleAppMode: () => set((state) => ({ 
    appMode: state.appMode === 'studio' ? 'deck' : 'studio' 
  })),

  setShowPostSummonHint: (show) => set({ showPostSummonHint: show }),

  showToast: (message, variant = 'info') => {
    set({ toastMessage: message, toastVariant: variant });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },
  hideToast: () => set({ toastMessage: null }),

  showConfirmDialog: (options) => set({
    confirmDialog: { 
        ...options, 
        isOpen: true, 
        variant: options.variant || 'info', 
        confirmLabel: options.confirmLabel || 'Confirm', 
        cancelLabel: options.cancelLabel || 'Cancel' 
    }
  }),
  
  hideConfirmDialog: () => set((state) => ({
    confirmDialog: { ...state.confirmDialog, isOpen: false }
  })),

  handleTabChange: (tab) => {
    const { isDirty, checkUnsavedChanges, setActiveTab } = get();
    if (isDirty) {
      checkUnsavedChanges(() => setActiveTab(tab));
    } else {
      setActiveTab(tab);
    }
  },

  resetSelection: () => set({ selectedId: null, isNewPrompt: false, isDirty: false }),

  checkUnsavedChanges: (action) => {
    const { isDirty, setPendingAction } = get();
    if (isDirty) {
      setPendingAction(() => action);
      return false;
    }
    action();
    return true;
  },

  handleSaveAndProceed: () => {
    set({ isDirty: false, pendingAction: null });
  },

  handleDiscardChanges: () => {
    const { pendingAction } = get();
    if (pendingAction) pendingAction();
    set({ isDirty: false, pendingAction: null, isNewPrompt: false });
  },

  handleCancelNavigation: () => set({ pendingAction: null }),
}));
/**
 * settingsStore.ts
 * Description: Global state management for application preferences, hotkeys, 
 * highlighting styles, and prompt versioning using Zustand with persistent file storage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PromptVersion, PromptSortOrder } from '@/types';
import { HighlightSettings, HighlightStyle, DEFAULT_HIGHLIGHT_SETTINGS } from '@/shared/utils/highlighting';
import { createFileStorage } from '@/shared/utils/storage/fileStorage';
import { sanitizeString, sanitizeColor } from '@/shared/utils/sanitize';
import { registerGlobalHotkey } from '@/shared/utils/storage/electron';

interface SettingsState {
  // Preferences
  autoMinimizeAfterCopy: boolean;
  autoEnter: boolean;
  miniModeCardMaxLines: number;
  promptSortOrder: PromptSortOrder;
  
  // Summoning Hotkey
  globalHotkey: string;

  // Pipeline Tracking
  activeTargetApp: string;

  // View Mode
  deckViewMode: 'list' | 'grid-2' | 'grid-3';

  // Tag colors
  tagColors: Record<string, string>;
  
  // Highlighting
  highlightSettings: HighlightSettings;
  
  // Versions
  versions: PromptVersion[];
  
  // Preference actions
  setAutoMinimizeAfterCopy: (value: boolean) => void;
  toggleAutoMinimize: () => void;
  toggleAutoEnter: () => void;
  setCardMaxLines: (lines: number) => void;
  setSortOrder: (order: PromptSortOrder) => void;
  setDeckViewMode: (mode: 'list' | 'grid-2' | 'grid-3') => void;

  // Hotkey actions
  setGlobalHotkey: (hotkey: string) => Promise<{ success: boolean; message?: string }>;

  // Pipeline actions
  setActiveTargetApp: (appName: string) => void;

  // Tag color actions
  getTagColor: (tag: string) => string;
  setTagColor: (tag: string, color: string) => void;
  setAllTagColors: (colors: Record<string, string>) => void;
  
  // Highlighting actions
  updateComponentStyle: (style: Partial<HighlightStyle>) => void;
  updateVariableStyle: (style: Partial<HighlightStyle>) => void;
  updateVariableColor: (color: string) => void;
  toggleHighlighting: () => void;
  resetHighlighting: () => void;
  
  // Version actions
  getPromptVersions: (promptId: string) => any[]; 
  addVersion: (promptId: string, versionData: { title: string, content: string, tags: string[], timestamp?: number }) => void;
  deleteVersion: (versionId: string) => void;
  deletePromptVersions: (promptId: string) => void;
  setAllVersions: (versions: PromptVersion[]) => void;
}

const DEFAULT_TAG_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      autoMinimizeAfterCopy: true,
      autoEnter: false,
      miniModeCardMaxLines: 4,
      promptSortOrder: 'created-newest',
      globalHotkey: 'Alt+E',
      activeTargetApp: 'None',
      deckViewMode: 'list',
      tagColors: {},
      highlightSettings: DEFAULT_HIGHLIGHT_SETTINGS,
      versions: [],

      // Preference actions
      setAutoMinimizeAfterCopy: (value) => set({ autoMinimizeAfterCopy: value }),
      
      toggleAutoMinimize: () => set((state) => ({ 
        autoMinimizeAfterCopy: !state.autoMinimizeAfterCopy 
      })),

      toggleAutoEnter: () => set((state) => ({
        autoEnter: !state.autoEnter
      })),
      
      setCardMaxLines: (lines) => set({ miniModeCardMaxLines: lines }),
      
      setSortOrder: (order) => set({ promptSortOrder: order }),

      setDeckViewMode: (mode) => set({ deckViewMode: mode }),

      // Hotkey actions
      setGlobalHotkey: async (hotkey: string) => {
        const result = await registerGlobalHotkey(hotkey);
        if (result.success) {
          set({ globalHotkey: hotkey });
        }
        return result;
      },

      // Pipeline actions
      setActiveTargetApp: (appName: string) => set({ activeTargetApp: appName }),

      // Tag color actions
      getTagColor: (tag) => {
        const { tagColors } = get();
        if (tagColors[tag]) return tagColors[tag];
        
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
          hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        return DEFAULT_TAG_COLORS[Math.abs(hash) % DEFAULT_TAG_COLORS.length];
      },

      setTagColor: (tag, color) => {
        set((state) => ({
          tagColors: { ...state.tagColors, [sanitizeString(tag)]: sanitizeColor(color) },
        }));
      },

      setAllTagColors: (colors) => {
        const sanitizedColors: Record<string, string> = {};
        for (const [tag, color] of Object.entries(colors)) {
          sanitizedColors[sanitizeString(tag)] = sanitizeColor(color);
        }
        set({ tagColors: sanitizedColors });
      },

      // Highlighting actions
      updateComponentStyle: (style) => {
        set((state) => ({
          highlightSettings: {
            ...state.highlightSettings,
            componentStyle: { ...state.highlightSettings.componentStyle, ...style },
          },
        }));
      },

      updateVariableStyle: (style) => {
        set((state) => ({
          highlightSettings: {
            ...state.highlightSettings,
            variableStyle: { ...state.highlightSettings.variableStyle, ...style },
          },
        }));
      },

      updateVariableColor: (color) => {
        set((state) => ({
          highlightSettings: { ...state.highlightSettings, variableColor: color },
        }));
      },

      toggleHighlighting: () => {
        set((state) => ({
          highlightSettings: { ...state.highlightSettings, enabled: !state.highlightSettings.enabled },
        }));
      },

      resetHighlighting: () => set({ highlightSettings: DEFAULT_HIGHLIGHT_SETTINGS }),

      // Version actions
      getPromptVersions: (promptId) => {
        return get().versions
          .filter((v) => v.promptId === promptId)
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(v => ({ ...v, timestamp: v.createdAt }));
      },

      addVersion: (promptId, versionData) => {
        const newVersion: PromptVersion = {
          id: generateId(),
          promptId,
          title: versionData.title,
          content: versionData.content,
          tags: versionData.tags,
          createdAt: versionData.timestamp || Date.now(),
          message: '', 
        };
        set((state) => ({ versions: [newVersion, ...state.versions] }));
      },

      deleteVersion: (versionId) => {
        set((state) => ({
          versions: state.versions.filter((v) => v.id !== versionId),
        }));
      },

      deletePromptVersions: (promptId) => {
        set((state) => ({
          versions: state.versions.filter((v) => v.promptId !== promptId),
        }));
      },

      setAllVersions: (versions) => set({ versions }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => createFileStorage('app-settings')),
    }
  )
);
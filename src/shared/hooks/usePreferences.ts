/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useCallback } from 'react';
import {
  AppPreferences,
  loadAppPreferences,
  saveAppPreferences,
  DEFAULT_APP_PREFERENCES,
} from '@/shared/utils/preferences';
import { PromptSortOrder } from '@/types';

export function usePreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(loadAppPreferences);

  const updatePreferences = useCallback((updates: Partial<AppPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      saveAppPreferences(updated);
      return updated;
    });
  }, []);

  const toggleAutoMinimize = useCallback(() => {
    setPreferences((prev) => {
      const updated = { ...prev, autoMinimizeAfterCopy: !prev.autoMinimizeAfterCopy };
      saveAppPreferences(updated);
      return updated;
    });
  }, []);

  const setCardMaxLines = useCallback((lines: number) => {
    setPreferences((prev) => {
      const updated = { ...prev, miniModeCardMaxLines: lines };
      saveAppPreferences(updated);
      return updated;
    });
  }, []);

  const setSortOrder = useCallback((order: PromptSortOrder) => {
    setPreferences((prev) => {
      const updated = { ...prev, promptSortOrder: order };
      saveAppPreferences(updated);
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    saveAppPreferences(DEFAULT_APP_PREFERENCES);
    setPreferences(DEFAULT_APP_PREFERENCES);
  }, []);

  return {
    preferences,
    updatePreferences,
    toggleAutoMinimize,
    setCardMaxLines,
    setSortOrder,
    resetToDefaults,
  };
}

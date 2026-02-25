/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useCallback } from 'react';
import {
  HighlightSettings,
  HighlightStyle,
  loadHighlightSettings,
  saveHighlightSettings,
  DEFAULT_HIGHLIGHT_SETTINGS,
} from '@/shared/utils/highlighting';

export function useHighlighting() {
  const [settings, setSettings] = useState<HighlightSettings>(loadHighlightSettings);

  const updateSettings = useCallback((newSettings: Partial<HighlightSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveHighlightSettings(updated);
      return updated;
    });
  }, []);

  const updateComponentStyle = useCallback((style: Partial<HighlightStyle>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        componentStyle: { ...prev.componentStyle, ...style },
      };
      saveHighlightSettings(updated);
      return updated;
    });
  }, []);

  const updateVariableStyle = useCallback((style: Partial<HighlightStyle>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        variableStyle: { ...prev.variableStyle, ...style },
      };
      saveHighlightSettings(updated);
      return updated;
    });
  }, []);

  const updateVariableColor = useCallback((color: string) => {
    setSettings((prev) => {
      const updated = { ...prev, variableColor: color };
      saveHighlightSettings(updated);
      return updated;
    });
  }, []);

  const toggleEnabled = useCallback(() => {
    setSettings((prev) => {
      const updated = { ...prev, enabled: !prev.enabled };
      saveHighlightSettings(updated);
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    saveHighlightSettings(DEFAULT_HIGHLIGHT_SETTINGS);
    setSettings(DEFAULT_HIGHLIGHT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    updateComponentStyle,
    updateVariableStyle,
    updateVariableColor,
    toggleEnabled,
    resetToDefaults,
  };
}

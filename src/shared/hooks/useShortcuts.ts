/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shortcut,
  loadShortcuts,
  saveShortcuts,
  matchesShortcut,
} from '@/shared/utils/shortcuts';

type ShortcutHandler = () => void;
type ShortcutHandlers = Partial<Record<string, ShortcutHandler>>;

export function useShortcuts(handlers: ShortcutHandlers) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(loadShortcuts);
  const [isEnabled, setIsEnabled] = useState(true);

  // Update a shortcut's keys
  const updateShortcut = useCallback((id: string, keys: string) => {
    setShortcuts((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, keys } : s));
      saveShortcuts(updated);
      return updated;
    });
  }, []);

  // Reset a shortcut to default
  const resetShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, keys: s.defaultKeys } : s
      );
      saveShortcuts(updated);
      return updated;
    });
  }, []);

  // Reset all shortcuts to defaults
  const resetAllShortcuts = useCallback(() => {
    setShortcuts((prev) => {
      const updated = prev.map((s) => ({ ...s, keys: s.defaultKeys }));
      saveShortcuts(updated);
      return updated;
    });
  }, []);

  // Get shortcut by id
  const getShortcut = useCallback(
    (id: string) => shortcuts.find((s) => s.id === id),
    [shortcuts]
  );

  // Keyboard event handler
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (except for specific ones)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut.keys)) {
          const handler = handlers[shortcut.id];
          
          // Some shortcuts should work even in inputs
          const alwaysActive = ['close-modal', 'save', 'show-shortcuts', 'toggle-sidebar'];
          
          if (handler && (!isInput || alwaysActive.includes(shortcut.id))) {
            e.preventDefault();
            handler();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, handlers, isEnabled]);

  return {
    shortcuts,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    getShortcut,
    setIsEnabled,
  };
}

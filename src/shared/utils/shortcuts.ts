/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

// Keyboard shortcuts utility

export interface Shortcut {
  id: string;
  label: string;
  description: string;
  keys: string; // e.g., "Ctrl+N", "Ctrl+Shift+S"
  defaultKeys: string;
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'new-item',
    label: 'New Item',
    description: 'Create new prompt/component/term',
    keys: 'Ctrl+N',
    defaultKeys: 'Ctrl+N',
  },
  {
    id: 'save',
    label: 'Save',
    description: 'Save current item',
    keys: 'Ctrl+S',
    defaultKeys: 'Ctrl+S',
  },
  {
    id: 'delete',
    label: 'Delete',
    description: 'Delete current item',
    keys: 'Ctrl+Delete',
    defaultKeys: 'Ctrl+Delete',
  },
  {
    id: 'copy-content',
    label: 'Copy Content',
    description: 'Copy content to clipboard',
    keys: 'Ctrl+Shift+C',
    defaultKeys: 'Ctrl+Shift+C',
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Focus search input',
    keys: 'Ctrl+F',
    defaultKeys: 'Ctrl+F',
  },
  {
    id: 'tab-prompts',
    label: 'Prompts Tab',
    description: 'Switch to Prompts tab',
    keys: 'Ctrl+1',
    defaultKeys: 'Ctrl+1',
  },
  {
    id: 'tab-components',
    label: 'Components Tab',
    description: 'Switch to Components tab',
    keys: 'Ctrl+2',
    defaultKeys: 'Ctrl+2',
  },
  {
    id: 'tab-glossary',
    label: 'Glossary Tab',
    description: 'Switch to Glossary tab',
    keys: 'Ctrl+3',
    defaultKeys: 'Ctrl+3',
  },
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    description: 'Show/hide sidebar',
    keys: 'Ctrl+B',
    defaultKeys: 'Ctrl+B',
  },
  {
    id: 'close-modal',
    label: 'Close Modal',
    description: 'Close any open modal',
    keys: 'Escape',
    defaultKeys: 'Escape',
  },
  {
    id: 'navigate-up',
    label: 'Navigate Up',
    description: 'Select previous item in list',
    keys: 'Ctrl+ArrowUp',
    defaultKeys: 'Ctrl+ArrowUp',
  },
  {
    id: 'navigate-down',
    label: 'Navigate Down',
    description: 'Select next item in list',
    keys: 'Ctrl+ArrowDown',
    defaultKeys: 'Ctrl+ArrowDown',
  },
  {
    id: 'show-shortcuts',
    label: 'Show Shortcuts',
    description: 'Open keyboard shortcuts panel',
    keys: 'Ctrl+/',
    defaultKeys: 'Ctrl+/',
  },
  {
    id: 'undo',
    label: 'Undo',
    description: 'Undo last action',
    keys: 'Ctrl+Z',
    defaultKeys: 'Ctrl+Z',
  },
  {
    id: 'redo',
    label: 'Redo',
    description: 'Redo last undone action',
    keys: 'Ctrl+Y',
    defaultKeys: 'Ctrl+Y',
  },
];

const SHORTCUTS_STORAGE_KEY = 'prompter-shortcuts';

// Load shortcuts from localStorage
export function loadShortcuts(): Shortcut[] {
  try {
    const saved = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (saved) {
      const savedShortcuts = JSON.parse(saved) as Partial<Shortcut>[];
      // Merge saved shortcuts with defaults (in case new shortcuts were added)
      return DEFAULT_SHORTCUTS.map((defaultShortcut) => {
        const saved = savedShortcuts.find((s) => s.id === defaultShortcut.id);
        return saved ? { ...defaultShortcut, keys: saved.keys || defaultShortcut.keys } : defaultShortcut;
      });
    }
  } catch (err) {
    console.error('Failed to load shortcuts:', err);
  }
  return DEFAULT_SHORTCUTS;
}

// Save shortcuts to localStorage
export function saveShortcuts(shortcuts: Shortcut[]): void {
  try {
    // Only save id and keys to minimize storage
    const toSave = shortcuts.map(({ id, keys }) => ({ id, keys }));
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save shortcuts:', err);
  }
}

// Parse a keyboard event into a shortcut string
export function eventToShortcutString(e: KeyboardEvent): string {
  const parts: string[] = [];
  
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  
  // Get the key
  let key = e.key;
  
  // Normalize key names
  if (key === ' ') key = 'Space';
  else if (key === 'ArrowUp') key = 'ArrowUp';
  else if (key === 'ArrowDown') key = 'ArrowDown';
  else if (key === 'ArrowLeft') key = 'ArrowLeft';
  else if (key === 'ArrowRight') key = 'ArrowRight';
  else if (key === 'Escape') key = 'Escape';
  else if (key === 'Enter') key = 'Enter';
  else if (key === 'Backspace') key = 'Backspace';
  else if (key === 'Delete') key = 'Delete';
  else if (key === 'Tab') key = 'Tab';
  else if (key.length === 1) key = key.toUpperCase();
  
  // Don't include modifier keys alone
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    return parts.join('+');
  }
  
  parts.push(key);
  return parts.join('+');
}

// Check if a keyboard event matches a shortcut string
export function matchesShortcut(e: KeyboardEvent, shortcutString: string): boolean {
  const eventString = eventToShortcutString(e);
  return eventString.toLowerCase() === shortcutString.toLowerCase();
}

// Format shortcut for display (prettier version)
export function formatShortcut(keys: string): string {
  return keys
    .replace(/Ctrl/g, '⌃')
    .replace(/Shift/g, '⇧')
    .replace(/Alt/g, '⌥')
    .replace(/ArrowUp/g, '↑')
    .replace(/ArrowDown/g, '↓')
    .replace(/ArrowLeft/g, '←')
    .replace(/ArrowRight/g, '→')
    .replace(/Escape/g, 'Esc')
    .replace(/Delete/g, 'Del')
    .replace(/\+/g, ' ');
}

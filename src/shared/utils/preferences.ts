/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

// App preferences settings

import { PromptSortOrder } from '@/types';

export interface AppPreferences {
  autoMinimizeAfterCopy: boolean;
  miniModeCardMaxLines: number; // number of content lines, 0 means unlimited, negative values are special modes
  promptSortOrder: PromptSortOrder;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  autoMinimizeAfterCopy: false,
  miniModeCardMaxLines: 4, // default 4 lines
  promptSortOrder: 'created-newest',
};

// Special display modes use negative values
export const CARD_DISPLAY_MODE = {
  TITLE_ONLY: -1,      // Only show prompt title
  TITLE_AND_TAGS: -2,  // Show title and tags, no content
};

// Line height in mini mode is approximately 18px (14px font * 1.3 line-height)
export const LINE_HEIGHT_PX = 18;

export const CARD_HEIGHT_OPTIONS = [
  { label: 'Title only', value: CARD_DISPLAY_MODE.TITLE_ONLY },
  { label: 'Title + Tags', value: CARD_DISPLAY_MODE.TITLE_AND_TAGS },
  { label: '2 lines', value: 2 },
  { label: '4 lines', value: 4 },
  { label: '6 lines', value: 6 },
  { label: '10 lines', value: 10 },
  { label: 'Unlimited', value: 0 },
];

const PREFERENCES_STORAGE_KEY = 'prompter-preferences';

export function loadAppPreferences(): AppPreferences {
  try {
    const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: convert old pixel-based values to line-based
      if (parsed.miniModeCardMaxHeight !== undefined && parsed.miniModeCardMaxLines === undefined) {
        // Convert old pixel values to approximate line counts
        const oldHeight = parsed.miniModeCardMaxHeight;
        let newLines: number;
        if (oldHeight < 0) {
          // Special modes stay the same
          newLines = oldHeight;
        } else if (oldHeight === 0) {
          // Unlimited stays unlimited
          newLines = 0;
        } else {
          // Convert pixels to lines (approximate) and clamp to available options
          const approxLines = Math.round(oldHeight / LINE_HEIGHT_PX);
          if (approxLines <= 2) newLines = 2;
          else if (approxLines <= 4) newLines = 4;
          else if (approxLines <= 7) newLines = 6;
          else newLines = 10;
        }
        parsed.miniModeCardMaxLines = newLines;
        delete parsed.miniModeCardMaxHeight;
      }
      return {
        ...DEFAULT_APP_PREFERENCES,
        ...parsed,
      };
    }
  } catch (err) {
    console.error('Failed to load app preferences:', err);
  }
  return DEFAULT_APP_PREFERENCES;
}

export function saveAppPreferences(preferences: AppPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (err) {
    console.error('Failed to save app preferences:', err);
  }
}

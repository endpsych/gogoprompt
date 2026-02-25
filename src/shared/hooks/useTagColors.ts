/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCustomTagColors, setTagColor as saveTagColor, getTagColor as getColor, saveCustomTagColors } from '@/shared/utils/tags';

export function useTagColors() {
  const [customColors, setCustomColors] = useState<Record<string, string>>({});

  // Load custom colors on mount
  useEffect(() => {
    setCustomColors(getCustomTagColors());
  }, []);

  // Get color for a tag
  const getTagColor = useCallback(
    (tag: string) => getColor(tag, customColors),
    [customColors]
  );

  // Set custom color for a tag
  const setTagColor = useCallback((tag: string, color: string) => {
    setCustomColors((prev) => saveTagColor(tag, color, prev));
  }, []);

  // Set all custom colors (for import)
  const setAllCustomColors = useCallback((colors: Record<string, string>) => {
    setCustomColors(colors);
    saveCustomTagColors(colors);
  }, []);

  return {
    customColors,
    getTagColor,
    setTagColor,
    setAllCustomColors, // For import
  };
}

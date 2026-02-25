/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

// Default tag colors - used when no custom color is set
export const DEFAULT_TAG_COLORS: Record<string, string> = {
  coding: '#3b82f6',
  writing: '#10b981',
  analysis: '#f59e0b',
  creative: '#ec4899',
  business: '#8b5cf6',
  research: '#06b6d4',
  image: '#f43f5e',
  claude: '#818cf8',
  gpt: '#22c55e',
  gemini: '#4285f4',
  system: '#ef4444',
  template: '#14b8a6',
};

// Color palette for custom tag colors
export const COLOR_PALETTE = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#6b7280', // gray
];

// Storage keys
const CUSTOM_COLORS_KEY = 'prompter-tag-colors';

// Get custom colors from localStorage
export function getCustomTagColors(): Record<string, string> {
  try {
    const saved = localStorage.getItem(CUSTOM_COLORS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// Save custom colors to localStorage
export function saveCustomTagColors(colors: Record<string, string>): void {
  localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors));
}

// Get color for a specific tag (custom first, then default, then fallback)
export function getTagColor(tag: string, customColors: Record<string, string>): string {
  const normalizedTag = tag.toLowerCase();
  return customColors[normalizedTag] || DEFAULT_TAG_COLORS[normalizedTag] || '#6b7280';
}

// Set custom color for a tag
export function setTagColor(tag: string, color: string, customColors: Record<string, string>): Record<string, string> {
  const normalizedTag = tag.toLowerCase();
  const newColors = { ...customColors, [normalizedTag]: color };
  saveCustomTagColors(newColors);
  return newColors;
}

// Filter and sort tag suggestions based on input
export function getTagSuggestions(
  input: string,
  existingTags: string[],
  allTags: string[],
  maxSuggestions: number = 5
): string[] {
  if (!input.trim()) return [];
  
  const normalizedInput = input.toLowerCase().trim();
  
  return allTags
    .filter((tag) => {
      // Don't suggest tags that are already added
      if (existingTags.includes(tag)) return false;
      // Match tags that start with or contain the input
      return tag.toLowerCase().includes(normalizedInput);
    })
    .sort((a, b) => {
      // Prioritize tags that start with the input
      const aStarts = a.toLowerCase().startsWith(normalizedInput);
      const bStarts = b.toLowerCase().startsWith(normalizedInput);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, maxSuggestions);
}

/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

// Highlighting settings for components and variables
import { PromptComponent } from '@/types';

export interface HighlightStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
}

export interface HighlightSettings {
  enabled: boolean;
  componentStyle: HighlightStyle;
  variableStyle: HighlightStyle;
  variableColor: string;
}

export const DEFAULT_HIGHLIGHT_SETTINGS: HighlightSettings = {
  enabled: true,
  componentStyle: {
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
  },
  variableStyle: {
    bold: false,
    italic: false,
    underline: false,
    uppercase: false,
  },
  variableColor: '#f59e0b', // amber
};

const HIGHLIGHT_STORAGE_KEY = 'prompter-highlight-settings';

export function loadHighlightSettings(): HighlightSettings {
  try {
    const saved = localStorage.getItem(HIGHLIGHT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle new properties
      return {
        ...DEFAULT_HIGHLIGHT_SETTINGS,
        ...parsed,
        componentStyle: { ...DEFAULT_HIGHLIGHT_SETTINGS.componentStyle, ...parsed.componentStyle },
        variableStyle: { ...DEFAULT_HIGHLIGHT_SETTINGS.variableStyle, ...parsed.variableStyle },
      };
    }
  } catch (err) {
    console.error('Failed to load highlight settings:', err);
  }
  return DEFAULT_HIGHLIGHT_SETTINGS;
}

export function saveHighlightSettings(settings: HighlightSettings): void {
  try {
    localStorage.setItem(HIGHLIGHT_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save highlight settings:', err);
  }
}

// Build CSS style object from HighlightStyle
export function buildStyleFromHighlight(style: HighlightStyle, color: string): React.CSSProperties {
  return {
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecoration: style.underline ? 'underline' : 'none',
    textTransform: style.uppercase ? 'uppercase' : 'none',
    color: color,
  };
}

// Extract variable names from content ({{variableName}})
export function extractVariableNames(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    variables.push(match[1].trim());
  }
  return [...new Set(variables)];
}

export interface HighlightSegment {
  text: string;
  type: 'normal' | 'component' | 'variable';
  componentType?: string; // For component segments, the type (persona, format, etc.)
}

// Highlight content with components and variables
export function highlightContent(
  content: string,
  components: PromptComponent[],
  settings: HighlightSettings
): HighlightSegment[] {
  if (!settings.enabled || content.length === 0) {
    return [{ text: content, type: 'normal' }];
  }

  const result: HighlightSegment[] = [];
  
  // Build a map of component names to their types
  const componentMap = new Map<string, string>();
  components.forEach((c) => {
    componentMap.set(c.name.toLowerCase(), c.type);
  });
  
  // Build regex for variables: {{...}}
  const variableRegex = /(\{\{[^}]+\}\})/g;
  
  // Build regex for component names (whole words, case-insensitive)
  const escapedNames = components
    .map((c) => c.name)
    .filter(name => name.length > 0)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  // Combined regex
  let combinedPattern: string;
  if (escapedNames.length > 0) {
    combinedPattern = `(\\{\\{[^}]+\\}\\})|\\b(${escapedNames.join('|')})\\b`;
  } else {
    combinedPattern = `(\\{\\{[^}]+\\}\\})`;
  }
  
  const combinedRegex = new RegExp(combinedPattern, 'gi');
  
  let lastIndex = 0;
  let match;
  
  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      result.push({
        text: content.substring(lastIndex, match.index),
        type: 'normal',
      });
    }
    
    // Determine match type
    const matchedText = match[0];
    const isVariable = matchedText.startsWith('{{') && matchedText.endsWith('}}');
    
    if (isVariable) {
      result.push({
        text: matchedText,
        type: 'variable',
      });
    } else {
      // Find the component type for this name
      const componentType = componentMap.get(matchedText.toLowerCase()) || 'other';
      result.push({
        text: matchedText,
        type: 'component',
        componentType,
      });
    }
    
    lastIndex = match.index + matchedText.length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    result.push({
      text: content.substring(lastIndex),
      type: 'normal',
    });
  }
  
  return result.length > 0 ? result : [{ text: content, type: 'normal' }];
}

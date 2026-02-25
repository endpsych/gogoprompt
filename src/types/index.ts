/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

export interface PromptVersion {
  id: string;
  promptId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  message?: string;
}

export interface PromptFolder {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  customOrder?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  profileIds?: string[];
  folderId?: string | null;
  createdAt: number;
  updatedAt: number;
  useCount?: number;
  lastUsed?: number;
  customOrder?: number;
}

export type PromptSortOrder = 
  | 'alphabetical' 
  | 'alphabetical-desc'
  | 'created-newest' 
  | 'created-oldest'
  | 'last-used-newest'
  | 'last-used-oldest'
  | 'most-used' 
  | 'least-used'
  | 'custom'
  | 'word-count-asc'
  | 'word-count-desc'
  | 'variable-count-asc'
  | 'variable-count-desc';

export const SORT_ORDER_OPTIONS: { value: PromptSortOrder; label: string }[] = [
  { value: 'alphabetical', label: 'Alphabetical (A-Z)' },
  { value: 'alphabetical-desc', label: 'Alphabetical (Z-A)' },
  { value: 'created-newest', label: 'Newest First' },
  { value: 'created-oldest', label: 'Oldest First' },
  { value: 'last-used-newest', label: 'Last Used (Newest)' },
  { value: 'last-used-oldest', label: 'Last Used (Oldest)' },
  { value: 'most-used', label: 'Most Used' },
  { value: 'least-used', label: 'Least Used' },
  { value: 'word-count-desc', label: 'Word Count (High)' },
  { value: 'word-count-asc', label: 'Word Count (Low)' },
  { value: 'variable-count-desc', label: 'Variables (High)' },
  { value: 'variable-count-asc', label: 'Variables (Low)' },
  { value: 'custom', label: 'Custom Order' },
];

export const FOLDER_COLORS = [
  '#6b7280',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
] as const;

export interface TagColor {
  name: string;
  color: string;
}

export interface AppSettings {
  tagColors: Record<string, string>;
}

export type ComponentType = string;

export interface ComponentTypeConfig {
  id: string;
  label: string;
  color: string;
}

export interface PromptComponent {
  id: string;
  name: string;
  type: ComponentType;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_COMPONENT_TYPES: ComponentTypeConfig[] = [
  { id: 'persona', label: 'Persona', color: '#3b82f6' },
  { id: 'format', label: 'Format', color: '#10b981' },
  { id: 'constraint', label: 'Constraint', color: '#f59e0b' },
  { id: 'context', label: 'Context', color: '#8b5cf6' },
  { id: 'other', label: 'Other', color: '#6b7280' },
];

export const COMPONENT_TYPE_COLORS: Record<string, string> = DEFAULT_COMPONENT_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.id]: type.color }),
  {}
);

export const COMPONENT_TYPE_LABELS: Record<string, string> = DEFAULT_COMPONENT_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.id]: type.label }),
  {}
);

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export const GLOSSARY_CATEGORIES = [
  'Prompting',
  'AI/ML',
  'Technical',
  'Domain',
  'Other',
] as const;

export type GlossaryCategory = typeof GLOSSARY_CATEGORIES[number];

export interface PromptUsageRecord {
  id: string;
  promptId: string;
  timestamp: string;
  usageMode: 'standard' | 'variable_fill' | 'text_insert' | 'injection';
  promptSnapshot: {
    title: string;
    content: string;
  };
  inputs: {
    variables?: Record<string, string>;
    clipboardContent?: string;
    addons?: string[];
    customInstructions?: string;
    components?: any[];  // Added for compatibility
  };
  finalOutput: string;
}

// Re-export FilterMode from uiStore
export type { FilterMode, Tab } from '@/stores/uiStore';
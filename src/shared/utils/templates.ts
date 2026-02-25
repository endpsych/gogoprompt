/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { Language, LANGUAGES } from './i18n';
import { ENGLISH_TEMPLATES } from './templates-en';
import { SPANISH_TEMPLATES } from './templates-es';
import { TEMPLATES_JA } from './templates-ja';

export interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: TemplateCategory;
  description: string;
  language: Language;
}

export type TemplateCategory = 
  | 'writing'
  | 'coding'
  | 'analysis'
  | 'creative'
  | 'business'
  | 'learning'
  | 'productivity';

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; icon: string }[] = [
  { id: 'writing', icon: '✍️' },
  { id: 'coding', icon: '💻' },
  { id: 'analysis', icon: '🔍' },
  { id: 'creative', icon: '🎨' },
  { id: 'business', icon: '💼' },
  { id: 'learning', icon: '📚' },
  { id: 'productivity', icon: '⚡' },
];

// --- 1. Load Existing Handcrafted Templates ---

// Helper to process raw Japanese templates
const JAPANESE_TEMPLATES: PromptTemplate[] = TEMPLATES_JA.map((t, index) => ({
  id: `ja-${t.category}-${index}`,
  title: t.title,
  content: t.content,
  tags: t.tags,
  category: t.category as TemplateCategory,
  description: t.content.substring(0, 100).replace(/\n/g, ' ') + '...',
  language: 'ja',
}));

// --- 2. Generator for New Languages ---

/**
 * Creates a generic set of templates for a given language code.
 * Ideally, you will replace these with real translations later.
 */
function createStarterTemplates(lang: Language): PromptTemplate[] {
  // We use English as the base content for the "Starter" templates
  return ENGLISH_TEMPLATES.map(t => ({
    ...t,
    id: `${lang}-${t.id}`, // Unique ID: e.g., 'de-email-pro'
    language: lang,
    // Optional: You could append (DE) to title to verify it works
    // title: `${t.title} (${lang.toUpperCase()})` 
  }));
}

// --- 3. Build the Master List ---

// Get all languages that DON'T have handcrafted files yet
const otherLanguages = LANGUAGES
  .map(l => l.code)
  .filter(code => code !== 'en' && code !== 'es' && code !== 'ja');

// Generate templates for them
const GENERATED_TEMPLATES = otherLanguages.flatMap(lang => 
  createStarterTemplates(lang as Language)
);

// Combine everything
export const ALL_TEMPLATES: PromptTemplate[] = [
  ...ENGLISH_TEMPLATES, 
  ...SPANISH_TEMPLATES, 
  ...JAPANESE_TEMPLATES,
  ...GENERATED_TEMPLATES
];

// --- 4. Exports ---

/**
 * Get templates by language
 */
export function getTemplatesByLanguage(lang: Language): PromptTemplate[] {
  return ALL_TEMPLATES.filter(t => t.language === lang);
}

/**
 * Get templates by category and language
 */
export function getTemplatesByCategory(category: TemplateCategory, lang: Language): PromptTemplate[] {
  return ALL_TEMPLATES.filter(t => t.category === category && t.language === lang);
}

/**
 * Search templates in a specific language
 */
export function searchTemplates(query: string, lang: Language): PromptTemplate[] {
  const queryLower = query.toLowerCase();
  return getTemplatesByLanguage(lang).filter(t => 
    t.title.toLowerCase().includes(queryLower) ||
    t.description.toLowerCase().includes(queryLower) ||
    t.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
    t.content.toLowerCase().includes(queryLower)
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get count of templates by category for a language
 */
export function getTemplateCounts(lang: Language): Record<TemplateCategory, number> {
  const templates = getTemplatesByLanguage(lang);
  const counts: Record<TemplateCategory, number> = {
    writing: 0,
    coding: 0,
    analysis: 0,
    creative: 0,
    business: 0,
    learning: 0,
    productivity: 0,
  };
  
  templates.forEach(t => {
    if (counts[t.category] !== undefined) {
      counts[t.category]++;
    }
  });
  
  return counts;
}
/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

/**
 * Input Sanitization Utilities
 * 
 * Prevents XSS attacks and ensures data integrity when:
 * - Importing backup files
 * - Importing glossary terms
 * - Processing user input
 * 
 * While React escapes content by default, this adds defense-in-depth for:
 * - Data stored in localStorage/files that gets rendered
 * - Future features that might use innerHTML
 * - Export/import operations
 */

// HTML entities that could be used for XSS
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities in a string
 * This is a defense-in-depth measure - React already escapes these,
 * but this protects against future code that might use innerHTML
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove potentially dangerous patterns from strings
 * - javascript: URLs
 * - data: URLs (except safe ones)
 * - Event handlers (onclick, onerror, etc.)
 * - Script tags
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  
  // Remove null bytes
  let result = str.replace(/\0/g, '');
  
  // Remove javascript: and vbscript: protocols
  result = result.replace(/javascript\s*:/gi, '');
  result = result.replace(/vbscript\s*:/gi, '');
  
  // Remove data: URLs except for safe image types
  result = result.replace(/data\s*:[^;]*;/gi, (match) => {
    const lower = match.toLowerCase();
    if (lower.startsWith('data:image/png') || 
        lower.startsWith('data:image/jpeg') ||
        lower.startsWith('data:image/gif') ||
        lower.startsWith('data:image/webp')) {
      return match;
    }
    return '';
  });
  
  // Remove event handlers (on*)
  result = result.replace(/\bon\w+\s*=/gi, '');
  
  // Remove script tags
  result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<script[^>]*>/gi, '');
  
  // Remove iframe tags
  result = result.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  result = result.replace(/<iframe[^>]*>/gi, '');
  
  // Remove object/embed tags
  result = result.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  result = result.replace(/<embed[^>]*>/gi, '');
  
  // Remove style tags (can contain expressions)
  result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove expression() in CSS
  result = result.replace(/expression\s*\(/gi, '');
  
  return result;
}

/**
 * Validate and sanitize a color string
 * Only allow hex colors, rgb/rgba, hsl/hsla, and named colors
 */
export function sanitizeColor(color: string): string {
  if (typeof color !== 'string') return '#6b7280'; // Default gray
  
  const trimmed = color.trim().toLowerCase();
  
  // Hex colors
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return trimmed;
  }
  
  // RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/i.test(trimmed)) {
    return trimmed;
  }
  
  // HSL/HSLA
  if (/^hsla?\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\)$/i.test(trimmed)) {
    return trimmed;
  }
  
  // Named colors (limited set)
  const namedColors = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan',
    'white', 'black', 'gray', 'grey', 'brown', 'transparent', 'inherit',
    'indigo', 'violet', 'magenta', 'lime', 'teal', 'navy', 'maroon',
  ];
  
  if (namedColors.includes(trimmed)) {
    return trimmed;
  }
  
  return '#6b7280'; // Default gray
}

/**
 * Sanitize a prompt object
 */
export function sanitizePrompt(prompt: any): any {
  if (!prompt || typeof prompt !== 'object') return null;
  
  return {
    id: typeof prompt.id === 'string' ? sanitizeString(prompt.id) : generateId(),
    title: typeof prompt.title === 'string' ? sanitizeString(prompt.title) : 'Untitled',
    content: typeof prompt.content === 'string' ? sanitizeString(prompt.content) : '',
    tags: Array.isArray(prompt.tags) 
      ? prompt.tags.filter((t: any) => typeof t === 'string').map(sanitizeString)
      : [],
    createdAt: typeof prompt.createdAt === 'number' ? prompt.createdAt : Date.now(),
    updatedAt: typeof prompt.updatedAt === 'number' ? prompt.updatedAt : Date.now(),
    useCount: typeof prompt.useCount === 'number' ? Math.max(0, prompt.useCount) : 0,
    order: typeof prompt.order === 'number' ? prompt.order : 0,
  };
}

/**
 * Sanitize a component object
 */
export function sanitizeComponent(component: any): any {
  if (!component || typeof component !== 'object') return null;
  
  return {
    id: typeof component.id === 'string' ? sanitizeString(component.id) : generateId(),
    name: typeof component.name === 'string' ? sanitizeString(component.name) : 'Untitled',
    type: typeof component.type === 'string' ? sanitizeString(component.type) : 'other',
    content: typeof component.content === 'string' ? sanitizeString(component.content) : '',
    createdAt: typeof component.createdAt === 'number' ? component.createdAt : Date.now(),
    updatedAt: typeof component.updatedAt === 'number' ? component.updatedAt : Date.now(),
  };
}

/**
 * Sanitize a glossary term object
 */
export function sanitizeGlossaryTerm(term: any): any {
  if (!term || typeof term !== 'object') return null;
  
  return {
    id: typeof term.id === 'string' ? sanitizeString(term.id) : generateId(),
    term: typeof term.term === 'string' ? sanitizeString(term.term) : 'Untitled',
    definition: typeof term.definition === 'string' ? sanitizeString(term.definition) : '',
    category: typeof term.category === 'string' ? sanitizeString(term.category) : 'General',
    createdAt: typeof term.createdAt === 'number' ? term.createdAt : Date.now(),
    updatedAt: typeof term.updatedAt === 'number' ? term.updatedAt : Date.now(),
  };
}

/**
 * Sanitize tag colors map
 */
export function sanitizeTagColors(colors: any): Record<string, string> {
  if (!colors || typeof colors !== 'object') return {};
  
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof key === 'string' && typeof value === 'string') {
      result[sanitizeString(key)] = sanitizeColor(value);
    }
  }
  return result;
}

/**
 * Sanitize component type config
 */
export function sanitizeComponentType(type: any): any {
  if (!type || typeof type !== 'object') return null;
  
  return {
    id: typeof type.id === 'string' ? sanitizeString(type.id) : generateId(),
    label: typeof type.label === 'string' ? sanitizeString(type.label) : 'Other',
    color: sanitizeColor(type.color),
  };
}

/**
 * Sanitize a complete backup object
 */
export function sanitizeBackup(backup: any): any {
  if (!backup || typeof backup !== 'object') return null;
  
  const result: any = {
    version: typeof backup.version === 'number' ? backup.version : 1,
    exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : new Date().toISOString(),
  };
  
  // Preserve schema versions if present (for migration tracking)
  if (backup.schemaVersions && typeof backup.schemaVersions === 'object') {
    result.schemaVersions = {};
    for (const [key, value] of Object.entries(backup.schemaVersions)) {
      if (typeof key === 'string' && typeof value === 'number') {
        result.schemaVersions[key] = value;
      }
    }
  }
  
  // Sanitize prompts
  if (Array.isArray(backup.prompts)) {
    result.prompts = backup.prompts
      .map(sanitizePrompt)
      .filter((p: any) => p !== null);
  }
  
  // Sanitize components
  if (Array.isArray(backup.components)) {
    result.components = backup.components
      .map(sanitizeComponent)
      .filter((c: any) => c !== null);
  }
  
  // Sanitize glossary terms
  if (Array.isArray(backup.glossary)) {
    result.glossary = backup.glossary
      .map(sanitizeGlossaryTerm)
      .filter((t: any) => t !== null);
  }
  
  // Sanitize tag colors
  if (backup.tagColors) {
    result.tagColors = sanitizeTagColors(backup.tagColors);
  }
  
  // Sanitize component types
  if (Array.isArray(backup.componentTypes)) {
    result.componentTypes = backup.componentTypes
      .map(sanitizeComponentType)
      .filter((t: any) => t !== null);
  }
  
  // Sanitize versions
  if (Array.isArray(backup.versions)) {
    result.versions = backup.versions
      .map((v: any) => {
        if (!v || typeof v !== 'object') return null;
        return {
          id: typeof v.id === 'string' ? sanitizeString(v.id) : generateId(),
          promptId: typeof v.promptId === 'string' ? sanitizeString(v.promptId) : '',
          title: typeof v.title === 'string' ? sanitizeString(v.title) : '',
          content: typeof v.content === 'string' ? sanitizeString(v.content) : '',
          tags: Array.isArray(v.tags) ? v.tags.map((t: any) => sanitizeString(String(t))) : [],
          createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
          message: typeof v.message === 'string' ? sanitizeString(v.message) : undefined,
        };
      })
      .filter((v: any) => v !== null && v.promptId);
  }
  
  return result;
}

/**
 * Sanitize glossary import data (CSV or JSON)
 */
export function sanitizeGlossaryImport(terms: any[]): any[] {
  if (!Array.isArray(terms)) return [];
  
  return terms
    .map(sanitizeGlossaryTerm)
    .filter((t: any) => t !== null && t.term);
}

/**
 * Validate that a string is a valid ID (alphanumeric + dash/underscore)
 */
export function isValidId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Generate a safe random ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Sanitize user input for search/filter operations
 * This escapes regex special characters to prevent ReDoS attacks
 */
export function sanitizeSearchInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Escape regex special characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Truncate string to max length (prevents memory issues with huge inputs)
 */
export function truncateString(str: string, maxLength: number = 100000): string {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength);
}

/**
 * Sanitize and validate a URL
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    
    return parsed.href;
  } catch {
    return null;
  }
}

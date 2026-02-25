/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

// Use namespace import to avoid module resolution errors during startup
import * as LocalesData from '@/locales';

// Base Language type on the imported object structure
export type Language = keyof typeof LocalesData.locales;


export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const LANGUAGES = [
  // --- ACTIVE LANGUAGES ---
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  
  // Iberian Regional
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },

  // Western Europe
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },

  // Asian
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },

  // --- TEMPORARILY DEACTIVATED ---
  /*
  // Western Europe (Other)
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },

  // Nordic
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },

  // Eastern / Central Europe
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' }, 
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },

  // Baltic
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },

  // Southern / Balkan / Mediterranean
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },

  // Asian (Other)
  { code: 'zh-CN', name: 'Mandarin', nativeName: '简体中文' },
  { code: 'zh-HK', name: 'Cantonese', nativeName: '繁體中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },

  // Middle East
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  */
];

// Infer the shape of the translations from the default language (English)
export type Translations = typeof import('@/locales/en').en;

export function getTranslations(lang: Language): Translations {
  // Fallback to English if the requested language isn't found
  // CHANGE 3: Reference the namespace import
  const translations = LocalesData.locales[lang] as Translations | undefined;
  return translations || LocalesData.locales.en;
}

// Helper function to check for RTL language
export function isRtl(langCode: string): boolean {
  return RTL_LANGUAGES.includes(langCode.toLowerCase());
}

export function interpolate(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    text
  );
}
/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { PromptUsageRecord } from '@/types';

const HISTORY_STORAGE_KEY = 'gogoprompt_usage_history';
const MAX_HISTORY_ITEMS = 1000;

/**
 * Generates a standard UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Simple heuristic to detect potential API keys or sensitive secrets.
 * Returns true if the content looks suspicious (e.g., starts with 'sk-', 'ghp_').
 */
function containsSensitiveData(text?: string): boolean {
  if (!text) return false;
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{32,}/,       // OpenAI style keys
    /ghp_[a-zA-Z0-9]{30,}/,      // GitHub tokens
    /xox[baprs]-/,               // Slack tokens
    /-----BEGIN PRIVATE KEY-----/ // Private keys
  ];
  return sensitivePatterns.some(pattern => pattern.test(text));
}

/**
 * Retrieves the full history from storage.
 */
export function getPromptHistory(): PromptUsageRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PromptUsageRecord[];
  } catch (err) {
    console.error('Failed to parse history:', err);
    return [];
  }
}

/**
 * Saves a new usage record.
 * Handles ID generation, timestamping, and sensitive data masking.
 */
export function savePromptUsage(
  data: Omit<PromptUsageRecord, 'id' | 'timestamp'>
): void {
  try {
    const history = getPromptHistory();

    // 1. Create the full record
    const newRecord: PromptUsageRecord = {
      ...data,
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      inputs: {
        ...data.inputs,
        // Privacy: If clipboard content looks like a key, redact it.
        clipboardContent: containsSensitiveData(data.inputs.clipboardContent)
          ? '[REDACTED SENSITIVE DATA]'
          : data.inputs.clipboardContent
      }
    };

    // 2. Prepend to history (newest first)
    const updatedHistory = [newRecord, ...history];

    // 3. Enforce limits (Trim oldest)
    if (updatedHistory.length > MAX_HISTORY_ITEMS) {
      updatedHistory.length = MAX_HISTORY_ITEMS;
    }

    // 4. Save
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    
  } catch (err) {
    console.error('Failed to save prompt usage:', err);
  }
}

/**
 * Clears all history.
 */
export function clearPromptHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

/**
 * Returns history filtered by a specific prompt ID.
 */
export function getHistoryForPrompt(promptId: string): PromptUsageRecord[] {
  const allHistory = getPromptHistory();
  return allHistory.filter(record => record.promptId === promptId);
}
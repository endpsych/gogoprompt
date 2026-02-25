/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { PromptVersion } from '@/types';

const VERSIONS_STORAGE_KEY = 'prompter-versions';
const MAX_VERSIONS_PER_PROMPT = 50; // Limit versions to prevent storage bloat

// Load all versions from localStorage
export function loadVersions(): PromptVersion[] {
  try {
    const data = localStorage.getItem(VERSIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load versions:', err);
    return [];
  }
}

// Save all versions to localStorage
export function saveVersions(versions: PromptVersion[]): void {
  try {
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(versions));
  } catch (err) {
    console.error('Failed to save versions:', err);
  }
}

// Get versions for a specific prompt
export function getVersionsForPrompt(promptId: string): PromptVersion[] {
  const versions = loadVersions();
  return versions
    .filter((v) => v.promptId === promptId)
    .sort((a, b) => b.createdAt - a.createdAt); // Most recent first
}

// Add a new version
export function addVersion(
  promptId: string,
  title: string,
  content: string,
  tags: string[],
  message?: string
): PromptVersion {
  const versions = loadVersions();
  
  const newVersion: PromptVersion = {
    id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    promptId,
    title,
    content,
    tags,
    createdAt: Date.now(),
    message,
  };
  
  versions.push(newVersion);
  
  // Limit versions per prompt
  const promptVersions = versions.filter((v) => v.promptId === promptId);
  if (promptVersions.length > MAX_VERSIONS_PER_PROMPT) {
    // Remove oldest versions for this prompt
    const sortedPromptVersions = promptVersions.sort((a, b) => a.createdAt - b.createdAt);
    const versionsToRemove = sortedPromptVersions.slice(0, promptVersions.length - MAX_VERSIONS_PER_PROMPT);
    const idsToRemove = new Set(versionsToRemove.map((v) => v.id));
    const filteredVersions = versions.filter((v) => !idsToRemove.has(v.id));
    saveVersions(filteredVersions);
    return newVersion;
  }
  
  saveVersions(versions);
  return newVersion;
}

// Delete a specific version
export function deleteVersion(versionId: string): void {
  const versions = loadVersions();
  const filtered = versions.filter((v) => v.id !== versionId);
  saveVersions(filtered);
}

// Delete all versions for a prompt
export function deleteVersionsForPrompt(promptId: string): void {
  const versions = loadVersions();
  const filtered = versions.filter((v) => v.promptId !== promptId);
  saveVersions(filtered);
}

// Get version count for a prompt
export function getVersionCount(promptId: string): number {
  const versions = loadVersions();
  return versions.filter((v) => v.promptId === promptId).length;
}

// Compare two versions and get diff summary
export function getVersionDiff(oldVersion: PromptVersion, newVersion: PromptVersion): {
  titleChanged: boolean;
  contentChanged: boolean;
  tagsChanged: boolean;
  contentLengthDiff: number;
} {
  return {
    titleChanged: oldVersion.title !== newVersion.title,
    contentChanged: oldVersion.content !== newVersion.content,
    tagsChanged: JSON.stringify(oldVersion.tags) !== JSON.stringify(newVersion.tags),
    contentLengthDiff: newVersion.content.length - oldVersion.content.length,
  };
}

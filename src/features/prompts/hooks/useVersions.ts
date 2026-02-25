/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useCallback } from 'react';
import { PromptVersion } from '@/types';
import {
  loadVersions,
  saveVersions,
  getVersionsForPrompt,
  addVersion as addVersionUtil,
  deleteVersion as deleteVersionUtil,
  deleteVersionsForPrompt,
  getVersionCount,
} from '../utils/versions';

export function useVersions() {
  const [versions, setVersions] = useState<PromptVersion[]>(loadVersions);

  // Refresh versions from storage
  const refreshVersions = useCallback(() => {
    setVersions(loadVersions());
  }, []);

  // Get versions for a specific prompt
  const getPromptVersions = useCallback((promptId: string): PromptVersion[] => {
    return versions
      .filter((v) => v.promptId === promptId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [versions]);

  // Add a new version
  const addVersion = useCallback((
    promptId: string,
    title: string,
    content: string,
    tags: string[],
    message?: string
  ): PromptVersion => {
    const newVersion = addVersionUtil(promptId, title, content, tags, message);
    setVersions(loadVersions());
    return newVersion;
  }, []);

  // Delete a version
  const deleteVersion = useCallback((versionId: string) => {
    deleteVersionUtil(versionId);
    setVersions(loadVersions());
  }, []);

  // Delete all versions for a prompt
  const deletePromptVersions = useCallback((promptId: string) => {
    deleteVersionsForPrompt(promptId);
    setVersions(loadVersions());
  }, []);

  // Get version count for a prompt
  const getPromptVersionCount = useCallback((promptId: string): number => {
    return versions.filter((v) => v.promptId === promptId).length;
  }, [versions]);

  // Set all versions (for import)
  const setAllVersions = useCallback((newVersions: PromptVersion[]) => {
    saveVersions(newVersions);
    setVersions(newVersions);
  }, []);

  return {
    versions,
    getPromptVersions,
    addVersion,
    deleteVersion,
    deletePromptVersions,
    getPromptVersionCount,
    setAllVersions,
    refreshVersions,
  };
}

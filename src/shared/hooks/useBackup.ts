/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useCallback } from 'react';
import { Prompt, PromptComponent, GlossaryTerm, PromptVersion } from '@/types';
import { AppBackupData, ImportMode } from '@/features/settings/components/AppBackup';

interface UseBackupProps {
  // Current data
  prompts: Prompt[];
  components: PromptComponent[];
  terms: GlossaryTerm[];
  customColors: Record<string, string>;
  versions: PromptVersion[];

  // Setters
  setPrompts: (prompts: Prompt[] | ((prev: Prompt[]) => Prompt[])) => void;
  setComponents: (components: PromptComponent[] | ((prev: PromptComponent[]) => PromptComponent[])) => void;
  setTerms: (terms: GlossaryTerm[] | ((prev: GlossaryTerm[]) => GlossaryTerm[])) => void;
  setAllCustomColors: (colors: Record<string, string>) => void;
  setAllVersions: (versions: PromptVersion[] | ((prev: PromptVersion[]) => PromptVersion[])) => void;

  // Callbacks
  onImportComplete: () => void;
  showToast: (message: string) => void;
}

export function useBackup({
  prompts,
  components,
  terms,
  customColors,
  versions,
  setPrompts,
  setComponents,
  setTerms,
  setAllCustomColors,
  setAllVersions,
  onImportComplete,
  showToast,
}: UseBackupProps) {
  const handleExport = useCallback((): AppBackupData => {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      prompts,
      components,
      glossary: terms,
      tagColors: customColors,
      versions,
    };
  }, [prompts, components, terms, customColors, versions]);

  const handleImport = useCallback((data: AppBackupData, mode: ImportMode) => {
    if (mode === 'replace') {
      // Replace all data
      setPrompts(data.prompts || []);
      setComponents(data.components || []);
      setTerms(data.glossary || []);
      setAllCustomColors(data.tagColors || {});
      setAllVersions((data as any).versions || []);
    } else {
      // Merge data (add to existing)
      setPrompts((prev) => [...(data.prompts || []), ...prev]);
      setComponents((prev) => [...(data.components || []), ...prev]);
      setTerms((prev) => [...(data.glossary || []), ...prev]);
      setAllCustomColors({ ...customColors, ...(data.tagColors || {}) });
      setAllVersions((prev) => [...((data as any).versions || []), ...prev]);
    }
    
    onImportComplete();
    
    const totalItems = (data.prompts?.length || 0) + (data.components?.length || 0) + (data.glossary?.length || 0);
    showToast(`Imported ${totalItems} items`);
  }, [
    customColors,
    setPrompts,
    setComponents,
    setTerms,
    setAllCustomColors,
    setAllVersions,
    onImportComplete,
    showToast,
  ]);

  return {
    handleExport,
    handleImport,
  };
}

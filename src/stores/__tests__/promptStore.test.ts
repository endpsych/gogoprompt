/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePromptStore } from '../promptStore';

describe('usePromptStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => usePromptStore());
    act(() => {
      // Clear all prompts
      result.current.setPrompts([]);
    });
  });

  describe('addPrompt', () => {
    it('should add a new prompt', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Test Title', 'Test Content', ['tag1']);
      });
      
      expect(result.current.prompts).toHaveLength(1);
      expect(result.current.prompts[0].title).toBe('Test Title');
      expect(result.current.prompts[0].content).toBe('Test Content');
      expect(result.current.prompts[0].tags).toContain('tag1');
    });

    it('should generate unique IDs', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Prompt 1', 'Content 1', []);
        result.current.addPrompt('Prompt 2', 'Content 2', []);
      });
      
      const ids = result.current.prompts.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should set timestamps on creation', () => {
      const { result } = renderHook(() => usePromptStore());
      const beforeCreate = Date.now();
      
      act(() => {
        result.current.addPrompt('Test', 'Content', []);
      });
      
      const prompt = result.current.prompts[0];
      expect(prompt.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(prompt.updatedAt).toBeGreaterThanOrEqual(beforeCreate);
    });

    it('should initialize useCount to 0', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Test', 'Content', []);
      });
      
      expect(result.current.prompts[0].useCount).toBe(0);
    });

    it('should return the created prompt', () => {
      const { result } = renderHook(() => usePromptStore());
      
      let newPrompt: any;
      act(() => {
        newPrompt = result.current.addPrompt('Test', 'Content', ['tag']);
      });
      
      expect(newPrompt).toBeDefined();
      expect(newPrompt.title).toBe('Test');
    });
  });

  describe('updatePrompt', () => {
    it('should update prompt fields', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Original', 'Original Content', ['original']);
      });
      
      const promptId = result.current.prompts[0].id;
      
      act(() => {
        result.current.updatePrompt(promptId, {
          title: 'Updated',
          content: 'Updated Content',
          tags: ['updated'],
        });
      });
      
      const updated = result.current.prompts[0];
      expect(updated.title).toBe('Updated');
      expect(updated.content).toBe('Updated Content');
      expect(updated.tags).toContain('updated');
    });

    it('should not affect other prompts', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Prompt 1', 'Content 1', []);
        result.current.addPrompt('Prompt 2', 'Content 2', []);
      });
      
      const firstId = result.current.prompts[0].id;
      
      act(() => {
        result.current.updatePrompt(firstId, { title: 'Updated 1' });
      });
      
      expect(result.current.prompts[1].title).toBe('Prompt 2');
    });
  });

  describe('deletePrompt', () => {
    it('should remove prompt from store', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Test', 'Content', []);
      });
      
      const promptId = result.current.prompts[0].id;
      
      act(() => {
        result.current.deletePrompt(promptId);
      });
      
      expect(result.current.prompts).toHaveLength(0);
    });

    it('should not affect other prompts when deleting', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Prompt 1', 'Content 1', []);
      });
      
      const firstId = result.current.prompts[0].id;
      
      act(() => {
        result.current.addPrompt('Prompt 2', 'Content 2', []);
      });
      
      act(() => {
        result.current.deletePrompt(firstId);
      });
      
      expect(result.current.prompts).toHaveLength(1);
      expect(result.current.prompts[0].title).toBe('Prompt 2');
    });
  });

  describe('incrementUseCount', () => {
    it('should increment useCount', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Test', 'Content', []);
      });
      
      const promptId = result.current.prompts[0].id;
      
      act(() => {
        result.current.incrementUseCount(promptId);
      });
      
      expect(result.current.prompts[0].useCount).toBe(1);
      
      act(() => {
        result.current.incrementUseCount(promptId);
        result.current.incrementUseCount(promptId);
      });
      
      expect(result.current.prompts[0].useCount).toBe(3);
    });
  });

  describe('getPrompt', () => {
    it('should return prompt by ID', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Test', 'Content', ['tag']);
      });
      
      const promptId = result.current.prompts[0].id;
      const prompt = result.current.getPrompt(promptId);
      
      expect(prompt).toBeDefined();
      expect(prompt?.title).toBe('Test');
    });

    it('should return undefined for non-existent ID', () => {
      const { result } = renderHook(() => usePromptStore());
      
      const prompt = result.current.getPrompt('non-existent');
      expect(prompt).toBeUndefined();
    });
  });

  describe('setPrompts', () => {
    it('should replace all prompts', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Original', 'Content', []);
      });
      
      const newPrompts = [
        {
          id: 'new-1',
          title: 'New Prompt 1',
          content: 'New Content 1',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          useCount: 0,
        },
        {
          id: 'new-2',
          title: 'New Prompt 2',
          content: 'New Content 2',
          tags: ['imported'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          useCount: 5,
        },
      ];
      
      act(() => {
        result.current.setPrompts(newPrompts);
      });
      
      expect(result.current.prompts).toHaveLength(2);
      expect(result.current.prompts[0].title).toBe('New Prompt 1');
      expect(result.current.prompts[1].title).toBe('New Prompt 2');
    });
  });

  describe('tags management', () => {
    it('should delete tag from all prompts', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Prompt 1', 'Content', ['tag1', 'tag2']);
        result.current.addPrompt('Prompt 2', 'Content', ['tag1', 'tag3']);
      });
      
      act(() => {
        result.current.deleteTag('tag1');
      });
      
      result.current.prompts.forEach((p) => {
        expect(p.tags).not.toContain('tag1');
      });
    });

    it('should rename tag in all prompts', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Prompt 1', 'Content', ['oldTag']);
        result.current.addPrompt('Prompt 2', 'Content', ['oldTag', 'other']);
      });
      
      act(() => {
        result.current.renameTag('oldTag', 'newTag');
      });
      
      result.current.prompts.forEach((p) => {
        expect(p.tags).not.toContain('oldTag');
        expect(p.tags).toContain('newTag');
      });
    });
  });

  describe('getAllTags', () => {
    it('should return all unique tags', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Prompt 1', 'Content', ['tag1', 'tag2']);
        result.current.addPrompt('Prompt 2', 'Content', ['tag2', 'tag3']);
      });
      
      const allTags = result.current.getAllTags();
      
      expect(allTags).toContain('tag1');
      expect(allTags).toContain('tag2');
      expect(allTags).toContain('tag3');
      expect(allTags).toHaveLength(3);
    });
  });

  describe('getTagCounts', () => {
    it('should return tag usage counts', () => {
      const { result } = renderHook(() => usePromptStore());
      
      act(() => {
        result.current.addPrompt('Prompt 1', 'Content', ['tag1', 'tag2']);
        result.current.addPrompt('Prompt 2', 'Content', ['tag1']);
      });
      
      const counts = result.current.getTagCounts();
      
      expect(counts['tag1']).toBe(2);
      expect(counts['tag2']).toBe(1);
    });
  });
});

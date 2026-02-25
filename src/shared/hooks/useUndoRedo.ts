/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Action types that can be undone/redone
 */
export type UndoableActionType = 
  | 'prompt-create'
  | 'prompt-update'
  | 'prompt-delete'
  | 'prompt-reorder'
  | 'prompt-move-folder'
  | 'component-create'
  | 'component-update'
  | 'component-delete'
  | 'component-reorder'
  | 'term-create'
  | 'term-update'
  | 'term-delete'
  | 'folder-create'
  | 'folder-update'
  | 'folder-delete'
  | 'tag-delete'
  | 'tag-rename';

/**
 * Represents a single undoable action
 */
export interface UndoableAction {
  id: string;
  type: UndoableActionType;
  timestamp: number;
  description: string;
  undo: () => void;
  redo: () => void;
}

/**
 * Configuration for the undo/redo system
 */
interface UndoRedoConfig {
  maxHistorySize?: number;
  onUndo?: (action: UndoableAction) => void;
  onRedo?: (action: UndoableAction) => void;
}

const DEFAULT_MAX_HISTORY = 50;

/**
 * Hook for managing undo/redo functionality
 */
export function useUndoRedo(config: UndoRedoConfig = {}) {
  const { 
    maxHistorySize = DEFAULT_MAX_HISTORY,
    onUndo,
    onRedo,
  } = config;

  // History stacks
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);
  
  // Track if we're currently performing an undo/redo to prevent recursion
  const isUndoingRef = useRef(false);

  /**
   * Generate unique ID for actions
   */
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Push a new action onto the undo stack
   */
  const pushAction = useCallback((action: Omit<UndoableAction, 'id' | 'timestamp'>) => {
    // Don't record actions while undoing/redoing
    if (isUndoingRef.current) return;

    const newAction: UndoableAction = {
      ...action,
      id: generateId(),
      timestamp: Date.now(),
    };

    setUndoStack(prev => {
      const newStack = [...prev, newAction];
      // Trim to max size
      if (newStack.length > maxHistorySize) {
        return newStack.slice(-maxHistorySize);
      }
      return newStack;
    });

    // Clear redo stack when new action is performed
    setRedoStack([]);
  }, [generateId, maxHistorySize]);

  /**
   * Undo the last action
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) return false;

    const action = undoStack[undoStack.length - 1];
    
    isUndoingRef.current = true;
    try {
      action.undo();
      onUndo?.(action);
    } finally {
      isUndoingRef.current = false;
    }

    // Move from undo to redo stack
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);

    return true;
  }, [undoStack, onUndo]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) return false;

    const action = redoStack[redoStack.length - 1];
    
    isUndoingRef.current = true;
    try {
      action.redo();
      onRedo?.(action);
    } finally {
      isUndoingRef.current = false;
    }

    // Move from redo to undo stack
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);

    return true;
  }, [redoStack, onRedo]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  /**
   * Check if undo is available
   */
  const canUndo = undoStack.length > 0;

  /**
   * Check if redo is available
   */
  const canRedo = redoStack.length > 0;

  /**
   * Get description of next undo action
   */
  const nextUndoDescription = undoStack.length > 0 
    ? undoStack[undoStack.length - 1].description 
    : null;

  /**
   * Get description of next redo action
   */
  const nextRedoDescription = redoStack.length > 0 
    ? redoStack[redoStack.length - 1].description 
    : null;

  return {
    pushAction,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    undoStack,
    redoStack,
    nextUndoDescription,
    nextRedoDescription,
  };
}

/**
 * Create an undoable action for prompt operations
 */
export function createPromptAction(
  type: UndoableActionType,
  description: string,
  undoFn: () => void,
  redoFn: () => void
): Omit<UndoableAction, 'id' | 'timestamp'> {
  return {
    type,
    description,
    undo: undoFn,
    redo: redoFn,
  };
}

/**
 * Hook return type
 */
export type UseUndoRedoReturn = ReturnType<typeof useUndoRedo>;

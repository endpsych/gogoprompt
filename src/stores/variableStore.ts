/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Variable {
  id: string;
  key: string;
  value: string;
  type: string; // 'text' | 'select' | 'long-text'
  description?: string;
  options?: string[];
  // Tracking fields
  createdAt?: number;
  updatedAt?: number;
  lastUsed?: number;
  useCount?: number;
}

interface VariableState {
  variables: Variable[];
  addVariable: (variable: Variable) => void;
  updateVariable: (id: string, updates: Partial<Variable>) => void;
  deleteVariable: (id: string) => void;
  setVariables: (variables: Variable[]) => void;
  incrementVariableUsage: (keys: string[]) => void; // NEW: To track stats
}

export const useVariableStore = create<VariableState>()(
  persist(
    (set, get) => ({
      variables: [], // Will be hydrated from localStorage automatically

      addVariable: (variable) => {
        const state = get();
        // Prevent duplicates
        if (state.variables.some(v => v.key === variable.key)) return;

        const newVar: Variable = {
            ...variable,
            // Ensure timestamps are initialized
            createdAt: variable.createdAt || Date.now(),
            updatedAt: Date.now(),
            useCount: 0,
            lastUsed: 0
        };

        set((state) => ({ variables: [...state.variables, newVar] }));
      },

      updateVariable: (id, updates) =>
        set((state) => ({
          variables: state.variables.map((v) => 
            v.id === id ? { ...v, ...updates, updatedAt: Date.now() } : v
          ),
        })),

      deleteVariable: (id) =>
        set((state) => ({
          variables: state.variables.filter((v) => v.id !== id),
        })),

      setVariables: (variables) => set({ variables }),

      // Updates usage stats when a prompt is copied
      incrementVariableUsage: (keys) => {
        if (!keys || keys.length === 0) return;
        
        // Normalize keys: trim whitespace and convert to lowercase
        const searchKeys = keys.map(k => k.trim().toLowerCase());

        set((state) => ({
            variables: state.variables.map((v) => {
                // Check against stored key (also trimmed/lowercased for safety)
                if (searchKeys.includes(v.key.trim().toLowerCase())) {
                    return {
                        ...v,
                        useCount: (v.useCount || 0) + 1,
                        lastUsed: Date.now()
                    };
                }
                return v;
            })
        }));
      }
    }),
    {
      name: 'gogoprompt-variables', // Keeps your existing data
    }
  )
);
import { useState, useMemo, useRef, useCallback } from 'react';
import { Prompt, PromptSortOrder } from '@/types';
import { useSettingsStore } from '@/stores';

export function useDeckData(
  prompts: Prompt[],
  onReorder?: (dragId: string, dropId: string) => void
) {
  const { deckViewMode, setDeckViewMode } = useSettingsStore();
  const [search, setSearch] = useState('');
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>('AND');
  const [sortOrder, setSortOrder] = useState<PromptSortOrder>('manual');

  // Drag & Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const isDragEnabled = !!onReorder && !search && activeTagFilters.length === 0;

  // Filter Logic
  const filteredPrompts = useMemo(() => {
    let results = prompts;

    // 1. Tag Filter
    if (activeTagFilters.length > 0) {
        results = results.filter((p) => {
            if (filterMode === 'AND') return activeTagFilters.every((tag) => p.tags.includes(tag));
            return activeTagFilters.some((tag) => p.tags.includes(tag));
        });
    }

    // 2. Search Filter
    if (search) {
        const searchLower = search.trim().toLowerCase(); 
        results = results.filter((p) => {
            const textMatch = 
                p.title.toLowerCase().includes(searchLower) ||
                p.content.toLowerCase().includes(searchLower) ||
                p.tags.some((t) => t.toLowerCase().includes(searchLower));
            const numberMatch = (p as any).customOrder != null && String((p as any).customOrder).includes(searchLower);
            return textMatch || numberMatch;
        });
    }

    // 3. Sorting
    if (sortOrder === 'alpha') {
        return [...results].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortOrder === 'usage') {
        return [...results].sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
    }
    if (sortOrder === 'recent') {
        return [...results].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    }

    return results;
  }, [prompts, search, activeTagFilters, filterMode, sortOrder]);

  // Drag Handlers
  const dragHandlers = {
    onDragStart: useCallback((e: React.DragEvent, id: string) => {
      if (!isDragEnabled || deckViewMode.startsWith('grid')) return;
      setDraggedId(id);
      dragNodeRef.current = e.currentTarget as HTMLDivElement;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      requestAnimationFrame(() => dragNodeRef.current?.classList.add('dragging'));
    }, [isDragEnabled, deckViewMode]),

    onDragEnd: useCallback(() => {
      dragNodeRef.current?.classList.remove('dragging');
      setDraggedId(null);
      setDragOverId(null);
      setDropPosition(null);
      dragNodeRef.current = null;
    }, []),

    onDragOver: useCallback((e: React.DragEvent, id: string) => {
      if (!isDragEnabled || !draggedId || draggedId === id || deckViewMode.startsWith('grid')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      setDragOverId(id);
      setDropPosition(e.clientY < midpoint ? 'before' : 'after');
    }, [isDragEnabled, draggedId, deckViewMode]),

    onDragLeave: useCallback((e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverId(null);
        setDropPosition(null);
      }
    }, []),

    onDrop: useCallback((e: React.DragEvent, dropId: string) => {
      e.preventDefault();
      if (!isDragEnabled || !draggedId || !onReorder || draggedId === dropId || deckViewMode.startsWith('grid')) {
        // Just reset if invalid drop
        dragNodeRef.current?.classList.remove('dragging');
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
        dragNodeRef.current = null;
        return;
      }
      
      // Calculate indices to determine exact drop logic
      const dragIndex = filteredPrompts.findIndex(p => p.id === draggedId);
      const dropIndex = filteredPrompts.findIndex(p => p.id === dropId);
      
      if (dragIndex !== -1 && dropIndex !== -1) {
        let targetIndex = dropIndex;
        // Adjust target index based on drop position relative to drag source
        if (dropPosition === 'after' && dragIndex > dropIndex) targetIndex = dropIndex + 1;
        else if (dropPosition === 'before' && dragIndex < dropIndex) targetIndex = dropIndex - 1;

        const targetPrompt = filteredPrompts[targetIndex];
        // Only trigger reorder if we actually moved
        if (targetPrompt && targetPrompt.id !== draggedId) {
            onReorder(draggedId, targetPrompt.id);
        } else if (dropIndex !== -1) {
            // Fallback for edge cases
            onReorder(draggedId, dropId);
        }
      }
      
      // Cleanup
      dragNodeRef.current?.classList.remove('dragging');
      setDraggedId(null);
      setDragOverId(null);
      setDropPosition(null);
      dragNodeRef.current = null;
    }, [isDragEnabled, draggedId, onReorder, filteredPrompts, dropPosition, deckViewMode])
  };

  return {
    search, setSearch,
    activeTagFilters, setActiveTagFilters,
    filterMode, setFilterMode,
    sortOrder, setSortOrder,
    deckViewMode, setDeckViewMode,
    filteredPrompts,
    dragHandlers,
    dragState: { draggedId, dragOverId, dropPosition },
    isDragEnabled
  };
}
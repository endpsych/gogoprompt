/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { extractVariables } from '@/features/variables/components/VariableFiller'; 
import { Prompt } from '../../../types';

export interface StructureItem {
  id: string;
  type: 'base' | 'addon';
  text: string;
  isBespoke?: boolean;
}

export function useVariableModalLogic(
  prompt: Prompt,
  initialValues?: Record<string, string>,
  initialInstructions?: string
) {
  // --- Data State ---
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [structureItems, setStructureItems] = useState<StructureItem[]>([
    { id: 'base-template', type: 'base', text: '' }
  ]);

  const vars = extractVariables(prompt.content);

  // --- UI State ---
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [headerCopied, setHeaderCopied] = useState(false);
  
  // --- Dragging & Resizing Refs ---
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  const [hasUserMovedMenu, setHasUserMovedMenu] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const dividerRef = useRef<HTMLDivElement>(null);
  
  // --- Addon Reordering State ---
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- Edit State ---
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSource, setEditSource] = useState<'list' | 'preview' | null>(null); // NEW STATE
  
  // --- Hover State ---
  const [hoveredVariable, setHoveredVariable] = useState<string | null>(null);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);

  // --- Resizing State ---
  const [previewWidth, setPreviewWidth] = useState(450);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // --- Initialization ---
  useEffect(() => {
    if (initialValues) setVariableValues(initialValues);
    if (initialInstructions) {
      const lines = initialInstructions.split('\n').filter(l => l.trim());
      const newAddons: StructureItem[] = lines.map((text, i) => ({
        id: `addon-${Date.now()}-${i}`,
        type: 'addon',
        text,
        isBespoke: false
      }));
      
      setStructureItems([
        { id: 'base-template', type: 'base', text: '' },
        ...newAddons
      ]);
    }
  }, [initialValues, initialInstructions]);

  // --- Handlers ---

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleInjection = (text: string) => {
    const newId = `addon-${Date.now()}`;
    
    if (text === '__BESPOKE__') {
      const newAddon: StructureItem = { id: newId, type: 'addon', text: '', isBespoke: true };
      const newIndex = structureItems.length;
      
      setEditValue('');
      setEditingIndex(newIndex);
      setEditSource('list'); // Default to list for new items
      setStructureItems(prev => [...prev, newAddon]);
      
    } else {
      if (structureItems.some(item => item.text === text && item.type === 'addon')) {
        setShowMenu(false);
        return;
      }
      const newAddon: StructureItem = { id: newId, type: 'addon', text, isBespoke: false };
      setStructureItems(prev => [...prev, newAddon]);
    }
    setShowMenu(false);
  };

  const handleRemoveItem = (index: number) => {
    if (structureItems[index].type === 'base') return; 
    setStructureItems(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
        setEditingIndex(null);
        setEditSource(null);
    }
  };

  // Accepts source
  const startEditingItem = (index: number, text: string, source: 'list' | 'preview' = 'list') => {
    setEditingIndex(index);
    setEditValue(text);
    setEditSource(source);
  };

  const saveItem = (index: number) => {
    const item = structureItems[index];
    
    if (!editValue.trim()) {
       if (item && item.type === 'base') {
         setStructureItems(prev => {
            const next = [...prev];
            if (next[index]) next[index] = { ...next[index], text: '' };
            return next;
         });
       } else {
         handleRemoveItem(index);
       }
    } else {
      setStructureItems(prev => {
        const next = [...prev];
        if (next[index]) next[index] = { ...next[index], text: editValue };
        return next;
      });
    }
    setEditingIndex(null);
    setEditValue('');
    setEditSource(null);
  };

  // --- Drag Handlers ---

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newItems = [...structureItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    if (editingIndex === draggedIndex) {
      setEditingIndex(targetIndex);
    } else if (editingIndex === targetIndex) {
      setEditingIndex(draggedIndex); 
    }

    setStructureItems(newItems);
    setDraggedIndex(targetIndex);
  };

  // --- Menu Positioning ---
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu && !hasUserMovedMenu && dividerRef.current) {
      const rect = dividerRef.current.getBoundingClientRect();
      setMenuPosition({ x: rect.left, y: rect.top });
    }
    setShowMenu(!showMenu);
  };

  const handleMenuMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.clientY - e.currentTarget.getBoundingClientRect().top > 50) return;

    setIsDraggingMenu(true);
    setHasUserMovedMenu(true);
    dragStartOffset.current = {
      x: e.clientX - menuPosition.x,
      y: e.clientY - menuPosition.y
    };
  };

  // --- Resize ---
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = previewWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleWindowMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingMenu) {
      setMenuPosition({
        x: e.clientX - dragStartOffset.current.x,
        y: e.clientY - dragStartOffset.current.y
      });
    }
    if (isResizing.current) {
      const deltaX = e.clientX - startX.current;
      const newWidth = startWidth.current + deltaX;
      if (newWidth > 300 && newWidth < 1200) setPreviewWidth(newWidth);
    }
  }, [isDraggingMenu]);

  const handleWindowMouseUp = useCallback(() => {
    setIsDraggingMenu(false);
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [handleWindowMouseMove, handleWindowMouseUp]);

  return {
    vars,
    variableValues,
    structureItems,
    showMenu,
    setShowMenu,
    menuPosition,
    isDraggingMenu,
    previewWidth,
    dividerRef,
    hoveredVariable,
    setHoveredVariable,
    hoveredItemIndex,
    setHoveredItemIndex,
    editingIndex,
    setEditingIndex,
    editValue,
    setEditValue,
    editSource, // EXPORTED
    headerCopied,
    setHeaderCopied,
    draggedIndex,
    handleVariableChange,
    handleInjection,
    handleRemoveItem,
    startEditingItem,
    saveItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    toggleMenu,
    handleMenuMouseDown,
    handleResizeStart
  };
}
/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Plus, Variable, GripVertical } from 'lucide-react';
import { PromptComponent, ComponentType, ComponentTypeConfig } from '@/types';
import { hasVariables } from '@/features/variables/components/VariableFiller';
import { useLanguage } from '@/shared/hooks';

interface ComponentListProps {
  components: PromptComponent[];
  componentTypes: ComponentTypeConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onReorder?: (dragId: string, dropId: string) => void;
}

export function ComponentList({ components, componentTypes, selectedId, onSelect, onNew, onReorder }: ComponentListProps) {
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<ComponentType | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const isDragEnabled = !!onReorder && !typeFilter; // Only allow drag when not filtered

  const getTypeColor = (typeId: string) => {
    const typeConfig = componentTypes.find((t) => t.id === typeId);
    return typeConfig?.color || '#6b7280';
  };

  const getTypeLabel = (typeId: string) => {
    const typeConfig = componentTypes.find((t) => t.id === typeId);
    return typeConfig?.label || typeId;
  };

  const filteredComponents = typeFilter
    ? components.filter((c) => c.type === typeFilter)
    : components;

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    if (!isDragEnabled) return;
    
    setDraggedId(id);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    
    requestAnimationFrame(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.classList.add('dragging');
      }
    });
  }, [isDragEnabled]);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.classList.remove('dragging');
    }
    setDraggedId(null);
    setDragOverId(null);
    setDropPosition(null);
    dragNodeRef.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    if (!isDragEnabled || !draggedId || draggedId === id) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';
    
    setDragOverId(id);
    setDropPosition(position);
  }, [isDragEnabled, draggedId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverId(null);
      setDropPosition(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    
    if (!isDragEnabled || !draggedId || !onReorder || draggedId === dropId) {
      handleDragEnd();
      return;
    }

    const dragIndex = filteredComponents.findIndex(c => c.id === draggedId);
    const dropIndex = filteredComponents.findIndex(c => c.id === dropId);
    
    if (dragIndex === -1 || dropIndex === -1) {
      handleDragEnd();
      return;
    }

    let targetIndex = dropIndex;
    if (dropPosition === 'after' && dragIndex < dropIndex) {
      // Moving down, dropping after - no adjustment
    } else if (dropPosition === 'before' && dragIndex > dropIndex) {
      // Moving up, dropping before - no adjustment
    } else if (dropPosition === 'after' && dragIndex > dropIndex) {
      targetIndex = dropIndex + 1;
    } else if (dropPosition === 'before' && dragIndex < dropIndex) {
      targetIndex = dropIndex - 1;
    }

    const targetComponent = filteredComponents[targetIndex];
    if (targetComponent && targetComponent.id !== draggedId) {
      onReorder(draggedId, targetComponent.id);
    }

    handleDragEnd();
  }, [isDragEnabled, draggedId, onReorder, filteredComponents, dropPosition, handleDragEnd]);

  return (
    <div className="component-list-container">
      <div className="component-list-header">
        <button onClick={onNew} className="new-btn">
          <Plus size={14} /> {t.components.newComponent}
        </button>
      </div>

      {/* Type filter */}
      <div className="component-type-filter">
        <button
          className={`component-type-btn ${typeFilter === null ? 'active' : ''}`}
          onClick={() => setTypeFilter(null)}
        >
          {t.components.all}
        </button>
        {componentTypes.map((type) => (
          <button
            key={type.id}
            className={`component-type-btn ${typeFilter === type.id ? 'active' : ''}`}
            style={{ '--type-color': type.color } as React.CSSProperties}
            onClick={() => setTypeFilter(typeFilter === type.id ? null : type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Component list */}
      <div className="component-list">
        {filteredComponents.map((c) => {
          const isDragging = draggedId === c.id;
          const isDragOver = dragOverId === c.id;
          
          return (
            <div
              key={c.id}
              draggable={isDragEnabled}
              onDragStart={(e) => handleDragStart(e, c.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, c.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, c.id)}
              onClick={() => onSelect(c.id)}
              className={`component-item ${selectedId === c.id ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? `drag-over drag-over-${dropPosition}` : ''}`}
            >
              {isDragEnabled && (
                <div 
                  className="drag-handle"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <GripVertical size={14} />
                </div>
              )}
              <span
                className="component-type-dot"
                style={{ backgroundColor: getTypeColor(c.type) }}
              />
              <span className="component-item-name">{c.name}</span>
              {hasVariables(c.content) && (
                <span className="component-has-variables" title="Has variables">
                  <Variable size={12} />
                </span>
              )}
            </div>
          );
        })}
        {filteredComponents.length === 0 && (
          <div className="component-list-empty">
            {typeFilter ? `${t.components.noComponents}` : t.components.noComponents}
          </div>
        )}
      </div>
    </div>
  );
}

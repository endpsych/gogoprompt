/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  Plus, Search, Sparkles, Pencil, Trash2, Link2, 
  Clock, Zap, AlertTriangle, Type, AlignLeft, List,
  ArrowUpDown, ChevronUp, ChevronDown
} from 'lucide-react';
import { Variable } from '@/stores/variableStore';
import { Prompt } from '@/types';
import { useLanguage } from '@/shared/hooks';

interface VariablesListProps {
  variables: Variable[];
  prompts: Prompt[];
  onAdd: () => void;
  onEdit: (id: string, focus?: 'name' | 'options') => void;
  onDelete: (id: string) => void;
  getTagColor?: (tag: string) => string;
}

type SortField = 'name' | 'type' | 'lastUsed' | 'useCount' | 'created';
type SortDirection = 'asc' | 'desc';

// Confirmation Dialog for Delete
interface ConfirmDeleteDialogProps {
  variableName: string;
  linkedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({ variableName, linkedCount, onConfirm, onCancel }: ConfirmDeleteDialogProps) {
  const { t } = useLanguage();
  
  return ReactDOM.createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200300
      }}
      onClick={(e) => { e.stopPropagation(); onCancel(); }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: '12px',
          width: '420px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: linkedCount > 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={20} color={linkedCount > 0 ? '#eab308' : '#ef4444'} />
          </div>
          <div>
            <h3 style={{ color: '#f4f4f5', fontSize: '16px', fontWeight: 600, margin: 0 }}>
              {t.variables?.confirmDeleteTitle || 'Delete Variable'}
            </h3>
            <p style={{ color: '#71717a', fontSize: '13px', margin: '4px 0 0 0' }}>
              {linkedCount > 0 
                ? (t.variables?.confirmDeleteWarning || 'This variable is used in prompts')
                : (t.variables?.confirmDeleteSubtitle || 'This action cannot be undone')
              }
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#27272a',
          border: '1px solid #3f3f46',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px'
        }}>
          <p style={{ color: '#a1a1aa', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
            {t.variables?.confirmDeleteMessage || 'Are you sure you want to delete the variable'}
            {' '}
            <span style={{ 
              color: '#f97316', 
              fontWeight: 600,
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {`{{${variableName}}}`}
            </span>
            {'?'}
          </p>
        </div>

        {linkedCount > 0 && (
          <div style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Link2 size={16} color="#eab308" />
            <p style={{ color: '#eab308', fontSize: '13px', margin: 0, fontWeight: 500 }}>
              {t.variables?.linkedPromptsWarning?.replace('{count}', String(linkedCount)) 
                || `This variable is linked to ${linkedCount} prompt(s). Deleting it may break those prompts.`}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #3f3f46',
              backgroundColor: 'transparent',
              color: '#e4e4e7',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.common?.cancel || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Trash2 size={14} />
            {t.common?.delete || 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Type badge component
function TypeBadge({ type }: { type: string }) {
  const config = {
    'text': { label: 'TEXT', color: '#3b82f6', icon: Type },
    'long-text': { label: 'LONG', color: '#8b5cf6', icon: AlignLeft },
    'select': { label: 'SELECT', color: '#10b981', icon: List }
  }[type] || { label: type.toUpperCase(), color: '#71717a', icon: Type };

  const Icon = config.icon;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: `${config.color}20`,
      color: config.color,
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.5px'
    }}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

// Format relative time
function formatRelativeTime(timestamp: number | undefined): string {
  if (!timestamp) return 'Never';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

// Format date
function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function VariablesList({ 
  variables, 
  prompts, 
  onAdd, 
  onEdit, 
  onDelete 
}: VariablesListProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; linkedCount: number } | null>(null);

  // Count linked prompts for each variable
  const linkedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    variables.forEach(v => {
      const regex = new RegExp(`\\{\\{\\s*${v.key}\\s*\\}\\}`, 'gi');
      counts[v.id] = prompts.filter(p => regex.test(p.content)).length;
    });
    return counts;
  }, [variables, prompts]);

  // Filter and sort
  const filteredVariables = useMemo(() => {
    let result = [...variables];
    
    // Filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(v => 
        v.key.toLowerCase().includes(searchLower) ||
        v.description?.toLowerCase().includes(searchLower) ||
        v.type?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.key.localeCompare(b.key);
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
        case 'lastUsed':
          comparison = (a.lastUsed || 0) - (b.lastUsed || 0);
          break;
        case 'useCount':
          comparison = (a.useCount || 0) - (b.useCount || 0);
          break;
        case 'created':
          comparison = (a.createdAt || 0) - (b.createdAt || 0);
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [variables, search, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDeleteClick = (variable: Variable) => {
    setDeleteTarget({
      id: variable.id,
      name: variable.key,
      linkedCount: linkedCounts[variable.id] || 0
    });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    return sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #27272a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.variables?.searchPlaceholder || 'Search variables...'}
              style={{
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                padding: '8px 12px 8px 32px',
                color: '#f4f4f5',
                fontSize: '13px',
                width: '200px',
                outline: 'none'
              }}
            />
          </div>
          <span style={{ color: '#71717a', fontSize: '12px' }}>
            {filteredVariables.length} {t.variables?.variablesCount || 'variables'}
          </span>
        </div>

        <button
          onClick={onAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#f97316',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          {t.variables?.addVariable || 'Add Variable'}
        </button>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 80px 100px 80px 80px 70px',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#1a1a1d',
        borderBottom: '1px solid #27272a',
        fontSize: '11px',
        fontWeight: 600,
        color: '#71717a',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        <div>#</div>
        <div 
          onClick={() => handleSort('name')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {t.variables?.name || 'Name'} <SortIcon field="name" />
        </div>
        <div 
          onClick={() => handleSort('type')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {t.variables?.type || 'Type'} <SortIcon field="type" />
        </div>
        <div 
          onClick={() => handleSort('lastUsed')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {t.variables?.lastUsed || 'Last Used'} <SortIcon field="lastUsed" />
        </div>
        <div 
          onClick={() => handleSort('created')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {t.variables?.created || 'Created'} <SortIcon field="created" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link2 size={10} /> {t.variables?.linked || 'Linked'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={10} /> {t.variables?.uses || 'Uses'}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredVariables.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#71717a' 
          }}>
            {search ? (t.variables?.noResults || 'No variables found') : (t.variables?.empty || 'No variables yet. Create one to get started!')}
          </div>
        ) : (
          filteredVariables.map((variable, index) => (
            <div
              key={variable.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 80px 100px 80px 80px 70px',
                gap: '8px',
                padding: '12px 16px',
                borderBottom: '1px solid #27272a',
                alignItems: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f1f23'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Index */}
              <div style={{ color: '#52525b', fontSize: '12px', fontWeight: 600 }}>
                {index + 1}
              </div>

              {/* Name + Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: '#f97316',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  <Sparkles size={14} />
                  <span style={{ color: '#71717a' }}>{'{{'}</span>
                  <span>{variable.key}</span>
                  <span style={{ color: '#71717a' }}>{'}}'}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                  <button
                    onClick={() => onEdit(variable.id)}
                    title={t.common?.edit || 'Edit'}
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#71717a',
                      cursor: 'pointer',
                      display: 'flex'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f4f4f5'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(variable)}
                    title={t.common?.delete || 'Delete'}
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#71717a',
                      cursor: 'pointer',
                      display: 'flex'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <TypeBadge type={variable.type || 'text'} />
              </div>

              {/* Last Used */}
              <div style={{ color: '#71717a', fontSize: '12px' }}>
                {formatRelativeTime(variable.lastUsed)}
              </div>

              {/* Created */}
              <div style={{ color: '#71717a', fontSize: '12px' }}>
                {formatDate(variable.createdAt)}
              </div>

              {/* Linked */}
              <div style={{ 
                color: linkedCounts[variable.id] > 0 ? '#3b82f6' : '#52525b', 
                fontSize: '12px',
                fontWeight: 500
              }}>
                {linkedCounts[variable.id] || 0}
              </div>

              {/* Use Count */}
              <div style={{ 
                color: (variable.useCount || 0) > 0 ? '#f97316' : '#52525b', 
                fontSize: '12px',
                fontWeight: 500
              }}>
                {variable.useCount || 0}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          variableName={deleteTarget.name}
          linkedCount={deleteTarget.linkedCount}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

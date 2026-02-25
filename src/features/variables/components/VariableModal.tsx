/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, Trash2, Type, AlignLeft, List, AlertTriangle } from 'lucide-react';
import { Variable } from '@/stores/variableStore';
import { useLanguage } from '@/shared/hooks';

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Variable, 'id'>) => void;
  onDelete?: (id: string) => void;
  initialData?: Variable;
  initialFocus?: 'name' | 'options';
}

// Confirmation Dialog Component
interface ConfirmDeleteDialogProps {
  variableName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({ variableName, onConfirm, onCancel }: ConfirmDeleteDialogProps) {
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
          width: '400px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ color: '#f4f4f5', fontSize: '16px', fontWeight: 600, margin: 0 }}>
              {t.variables?.confirmDeleteTitle || 'Delete Variable'}
            </h3>
            <p style={{ color: '#71717a', fontSize: '13px', margin: '4px 0 0 0' }}>
              {t.variables?.confirmDeleteSubtitle || 'This action cannot be undone'}
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#27272a',
          border: '1px solid #3f3f46',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px'
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#27272a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
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

export function VariableModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  initialData,
  initialFocus = 'name'
}: VariableModalProps) {
  const { t } = useLanguage();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const optionsInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'long-text' | 'select'>('text');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.key || '');
        setType((initialData.type as any) || 'text');
        setDescription(initialData.description || '');
        setOptions(initialData.options?.join(', ') || initialData.value || '');
      } else {
        setName('');
        setType('text');
        setDescription('');
        setOptions('');
      }
      
      // Focus appropriate field
      setTimeout(() => {
        if (initialFocus === 'options' && optionsInputRef.current) {
          optionsInputRef.current.focus();
        } else if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, initialData, initialFocus]);

  const handleSave = () => {
    if (!name.trim()) return;

    const variableData: Omit<Variable, 'id'> = {
      key: name.trim(),
      type,
      description: description.trim(),
      value: type === 'select' ? options : '',
      options: type === 'select' ? options.split(',').map(o => o.trim()).filter(Boolean) : undefined
    };

    onSave(variableData);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && name.trim()) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200200
      }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          backgroundColor: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: '12px',
          width: '450px',
          maxWidth: '90vw',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #27272a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="#f97316" />
            <span style={{ 
              color: '#f97316', 
              fontSize: '13px', 
              fontWeight: 700, 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {initialData ? (t.variables?.editVariable || 'Edit Variable') : (t.variables?.newVariable || 'New Variable')}
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f4f4f5';
              e.currentTarget.style.backgroundColor = '#27272a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#71717a';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Variable Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              color: '#a1a1aa', 
              fontSize: '12px', 
              fontWeight: 600,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {t.variables?.variableName || 'Variable Name'}
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              padding: '0 12px',
              gap: '4px'
            }}>
              <span style={{ color: '#f97316', fontSize: '16px', fontWeight: 600 }}>{'{{'}</span>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.variables?.namePlaceholder || 'variable_name'}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f4f4f5',
                  fontSize: '14px',
                  padding: '12px 0'
                }}
              />
              <span style={{ color: '#f97316', fontSize: '16px', fontWeight: 600 }}>{'}}'}</span>
            </div>
          </div>

          {/* Type Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              color: '#a1a1aa', 
              fontSize: '12px', 
              fontWeight: 600,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {t.variables?.type || 'Type'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'text', label: t.variables?.typeText || 'Text', icon: Type },
                { value: 'long-text', label: t.variables?.typeLongText || 'Long Text', icon: AlignLeft },
                { value: 'select', label: t.variables?.typeSelect || 'Select', icon: List }
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = type === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setType(option.value as any)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #f97316' : '1px solid #3f3f46',
                      backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.1)' : '#27272a',
                      color: isSelected ? '#f97316' : '#a1a1aa',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options (only for select type) */}
          {type === 'select' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                color: '#a1a1aa', 
                fontSize: '12px', 
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t.variables?.options || 'Options'} 
                <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: '6px', opacity: 0.7 }}>
                  ({t.variables?.optionsHint || 'comma separated'})
                </span>
              </label>
              <input
                ref={optionsInputRef}
                type="text"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder={t.variables?.optionsPlaceholder || 'option1, option2, option3'}
                style={{
                  width: '100%',
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  outline: 'none',
                  color: '#f4f4f5',
                  fontSize: '14px',
                  padding: '12px'
                }}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label style={{ 
              display: 'block', 
              color: '#a1a1aa', 
              fontSize: '12px', 
              fontWeight: 600,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {t.variables?.description || 'Description'} 
              <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: '6px', opacity: 0.7 }}>
                ({t.common?.optional || 'Optional'})
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.variables?.descriptionPlaceholder || 'What is this variable for?'}
              rows={3}
              style={{
                width: '100%',
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                outline: 'none',
                color: '#f4f4f5',
                fontSize: '14px',
                padding: '12px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderTop: '1px solid #27272a',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0 0 12px 12px'
        }}>
          {/* Delete button (only for existing variables) */}
          {initialData && onDelete ? (
            <button
              onClick={handleDeleteClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                backgroundColor: 'transparent',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={14} />
              {t.common?.delete || 'Delete'}
            </button>
          ) : (
            <div />
          )}

          {/* Cancel and Save buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#27272a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {t.common?.cancel || 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: name.trim() ? '#f97316' : '#3f3f46',
                color: name.trim() ? 'white' : '#71717a',
                fontSize: '13px',
                fontWeight: 600,
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              💾 {t.common?.save || 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && initialData && (
        <ConfirmDeleteDialog
          variableName={initialData.key}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>,
    document.body
  );
}

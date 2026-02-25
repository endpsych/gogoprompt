/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  X, Save, User, Briefcase, Microscope, Languages, Sparkles, 
  Code, Megaphone, PenTool, GraduationCap, Gavel, Stethoscope, 
  Terminal, Palette, Gamepad2, Coffee, Music, Camera, Layers,
  ChevronDown, Search, CheckSquare, Square, Copy
} from 'lucide-react';
import { useLanguage } from '@/shared/hooks';
import { usePromptStore } from '@/stores'; 
import { Profile } from '@/stores/profileStore';
import { Prompt } from '@/types'; 
import { InspectModal } from '@/features/prompts/components/InspectModal'; 

export const PROFILE_ICONS: Record<string, any> = {
  Layers, User, Briefcase, Microscope, Languages, Sparkles, Code,
  Megaphone, PenTool, GraduationCap, Gavel, Stethoscope,
  Terminal, Palette, Gamepad2, Coffee, Music, Camera
};

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Pick<Profile, 'name' | 'description' | 'icon'>, selectedPromptIds: string[]) => void;
  initialData?: Profile; // For Editing (Updates existing ID)
  prefillData?: { name: string; description: string; icon: string };
  prefillPromptIds?: string[];
}

export function ProfileModal({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData, 
    prefillData, 
    prefillPromptIds 
}: ProfileModalProps) {
  const { t } = useLanguage();
  const { prompts } = usePromptStore(); 
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('User');
  
  // UI State
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [promptSearch, setPromptSearch] = useState('');
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  
  // Inspect State
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  const isGeneral = initialData?.id === 'general';
  const isEditing = !!initialData;
  const isDuplicating = !!prefillData;

  // Filter Logic:
  // Show prompts that are:
  // 1. "General" (no specific profile)
  // 2. Already assigned to the profile being edited
  // 3. Assigned to the profile being duplicated (so they appear in the list)
  const availablePrompts = prompts.filter(p => {
    const isGeneralPrompt = p.profileIds?.includes('general') || !p.profileIds || p.profileIds.length === 0;
    const isAssignedToEdit = initialData ? p.profileIds?.includes(initialData.id) : false;
    const isAssignedToDuplicate = prefillPromptIds ? prefillPromptIds.includes(p.id) : false;
    
    const matchesSearch = 
        p.title.toLowerCase().includes(promptSearch.toLowerCase()) || 
        p.content.toLowerCase().includes(promptSearch.toLowerCase());

    return (isGeneralPrompt || isAssignedToEdit || isAssignedToDuplicate) && matchesSearch;
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // EDIT MODE
        setName(initialData.name);
        setDescription(initialData.description);
        setSelectedIcon(initialData.icon);
        const assignedIds = prompts
            .filter(p => p.profileIds?.includes(initialData.id))
            .map(p => p.id);
        setSelectedPromptIds(assignedIds);
      } else if (prefillData) {
        // DUPLICATE MODE
        setName(prefillData.name);
        setDescription(prefillData.description);
        setSelectedIcon(prefillData.icon);
        setSelectedPromptIds(prefillPromptIds || []);
      } else {
        // CREATE MODE
        setName('');
        setDescription('');
        setSelectedIcon('User');
        setSelectedPromptIds([]); 
      }
      setIsIconPickerOpen(false);
      setPromptSearch('');
      setPreviewPrompt(null);
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialData, prefillData, prefillPromptIds, prompts]);

  // Click Outside Listener for Icon Picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(event.target as Node)) {
        setIsIconPickerOpen(false);
      }
    };
    if (isIconPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isIconPickerOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      icon: selectedIcon
    }, selectedPromptIds);
    onClose();
  };

  const togglePromptSelection = (id: string) => {
    setSelectedPromptIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAllPrompts = () => {
    if (selectedPromptIds.length === availablePrompts.length) {
      setSelectedPromptIds([]);
    } else {
      setSelectedPromptIds(availablePrompts.map(p => p.id));
    }
  };

  const SelectedIconComponent = PROFILE_ICONS[selectedIcon] || User;

  const getHeaderTitle = () => {
      if (isEditing) return 'Edit Profile';
      if (isDuplicating) return 'Duplicate Profile';
      return 'Create New Profile';
  };

  const getSaveButtonLabel = () => {
      if (isEditing) return 'Save Profile';
      if (isDuplicating) return 'Create Duplicate';
      return 'Create Profile';
  };

  const getSaveButtonIcon = () => {
      if (isDuplicating) return Copy;
      return Save;
  }

  const SaveIcon = getSaveButtonIcon();

  return ReactDOM.createPortal(
    <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
            width: '600px', maxHeight: '90vh', 
            backgroundColor: '#18181b', border: '1px solid #3f3f46', 
            display: 'flex', flexDirection: 'column', borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative'
        }}
      >
        {/* HEADER */}
        <div style={{ padding: '16px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5' }}>
                {getHeaderTitle()}
            </span>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                <X size={18} />
            </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
            
            {/* Name & Icon Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Profile Name & Icon</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    
                    {/* Icon Picker */}
                    <div ref={pickerContainerRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => !isGeneral && setIsIconPickerOpen(!isIconPickerOpen)}
                            disabled={isGeneral}
                            style={{
                                width: '42px', height: '42px', borderRadius: '6px',
                                border: '1px solid #3f3f46', backgroundColor: '#27272a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#eab308', cursor: isGeneral ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <SelectedIconComponent size={20} />
                        </button>

                        {isIconPickerOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                                width: '280px', backgroundColor: '#18181b', border: '1px solid #3f3f46',
                                borderRadius: '8px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                zIndex: 100, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                                gap: '8px', maxHeight: '200px', overflowY: 'auto'
                            }}>
                                {Object.keys(PROFILE_ICONS).map(iconKey => {
                                    const IconComponent = PROFILE_ICONS[iconKey];
                                    const isSelected = selectedIcon === iconKey;
                                    return (
                                        <button
                                            key={iconKey}
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setSelectedIcon(iconKey); 
                                                setIsIconPickerOpen(false); 
                                            }}
                                            title={iconKey}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '6px',
                                                border: isSelected ? '1px solid #eab308' : '1px solid transparent',
                                                backgroundColor: isSelected ? 'rgba(234, 179, 8, 0.1)' : '#27272a',
                                                color: isSelected ? '#eab308' : '#a1a1aa',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <IconComponent size={16} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Name Input */}
                    <input 
                        ref={nameInputRef}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Creative Writer"
                        disabled={isGeneral} 
                        style={{
                            flex: 1, padding: '0 12px', borderRadius: '6px', border: '1px solid #3f3f46',
                            backgroundColor: isGeneral ? '#27272a' : '#27272a', 
                            color: isGeneral ? '#71717a' : '#e4e4e7',
                            outline: 'none', fontSize: '14px', cursor: isGeneral ? 'not-allowed' : 'text'
                        }}
                    />
                </div>
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Description</label>
                <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What is this profile used for?"
                    rows={2}
                    style={{
                        padding: '10px', borderRadius: '6px', border: '1px solid #3f3f46',
                        backgroundColor: '#27272a', color: '#e4e4e7', outline: 'none', fontSize: '13px', resize: 'none', fontFamily: 'inherit'
                    }}
                />
            </div>

            {/* Prompt Selection List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>
                        {isEditing ? 'Manage Assigned Prompts' : 'Include Prompts'}
                     </label>
                     <div style={{ fontSize: '11px', color: '#71717a' }}>
                         {selectedPromptIds.length} selected
                     </div>
                </div>

                <div style={{ 
                    border: '1px solid #3f3f46', borderRadius: '6px', 
                    backgroundColor: '#18181b', display: 'flex', flexDirection: 'column',
                    height: '250px' 
                }}>
                    {/* Search Bar */}
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #27272a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Search size={14} color="#71717a" />
                        <input 
                            value={promptSearch} 
                            onChange={e => setPromptSearch(e.target.value)} 
                            placeholder="Search prompts..." 
                            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e4e4e7', fontSize: '12px', width: '100%' }}
                        />
                    </div>

                    {/* Headers */}
                    <div style={{ 
                        display: 'grid', gridTemplateColumns: '24px 1.5fr 1fr 24px', gap: '12px',
                        padding: '8px 12px', borderBottom: '1px solid #27272a',
                        fontSize: '11px', fontWeight: 600, color: '#71717a'
                    }}>
                         <div />
                         <div>NAME</div>
                         <div>CONTENT PREVIEW</div>
                         <div />
                    </div>

                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
                        {availablePrompts.length > 0 ? availablePrompts.map(prompt => {
                            const isSelected = selectedPromptIds.includes(prompt.id);
                            return (
                                <div 
                                    key={prompt.id}
                                    style={{ 
                                        display: 'grid', gridTemplateColumns: '24px 1.5fr 1fr 24px', gap: '12px', 
                                        padding: '8px 12px', alignItems: 'center',
                                        borderRadius: '4px',
                                        backgroundColor: isSelected ? 'rgba(234, 179, 8, 0.05)' : 'transparent',
                                        transition: 'background-color 0.1s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(234, 179, 8, 0.1)' : '#27272a'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? 'rgba(234, 179, 8, 0.05)' : 'transparent'}
                                >
                                    {/* Checkbox */}
                                    <div 
                                        onClick={() => togglePromptSelection(prompt.id)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        {isSelected ? <CheckSquare size={14} color="#eab308" /> : <Square size={14} color="#52525b" />}
                                    </div>

                                    {/* Title */}
                                    <div 
                                        onClick={() => togglePromptSelection(prompt.id)}
                                        style={{ fontSize: '12px', color: '#e4e4e7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', fontWeight: 500 }}
                                        title={prompt.title}
                                    >
                                        {prompt.title || 'Untitled Prompt'}
                                    </div>

                                    {/* Preview */}
                                    <div 
                                        onClick={() => togglePromptSelection(prompt.id)}
                                        style={{ fontSize: '11px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                                    >
                                        {prompt.content.replace(/\n/g, ' ')}
                                    </div>

                                    {/* Inspect */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPreviewPrompt(prompt); }}
                                        title="Inspect Content"
                                        style={{ 
                                            background: 'transparent', border: 'none', color: '#a1a1aa', 
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '4px', borderRadius: '4px'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3f3f46'; e.currentTarget.style.color = '#e4e4e7'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
                                    >
                                        <Search size={14} />
                                    </button>
                                </div>
                            );
                        }) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#52525b', fontSize: '12px' }}>
                                No prompts found.
                            </div>
                        )}
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button 
                        onClick={toggleAllPrompts}
                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                        {selectedPromptIds.length === availablePrompts.length ? 'Deselect All' : 'Select All Visible'}
                    </button>
                </div>
            </div>

        </div>

        {/* FOOTER */}
        <div style={{ padding: '16px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
                onClick={onClose}
                style={{
                    padding: '8px 16px', borderRadius: '6px', border: '1px solid #3f3f46',
                    backgroundColor: 'transparent', color: '#e4e4e7', fontWeight: 600, cursor: 'pointer'
                }}
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                disabled={!name.trim()}
                style={{
                    padding: '8px 16px', borderRadius: '6px', border: 'none',
                    backgroundColor: name.trim() ? '#eab308' : '#3f3f46',
                    color: name.trim() ? '#18181b' : '#71717a',
                    fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: '6px'
                }}
            >
                <SaveIcon size={16} /> {getSaveButtonLabel()}
            </button>
        </div>

        <InspectModal 
            isOpen={!!previewPrompt} 
            prompt={previewPrompt} 
            onClose={() => setPreviewPrompt(null)} 
        />

      </div>
    </div>,
    document.body
  );
}
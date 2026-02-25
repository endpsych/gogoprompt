/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState } from 'react';
import { 
  Plus, Trash2, Pencil, Search, User, Layers, FileText, 
  Calendar, Copy, X, Hash
} from 'lucide-react';
import { useProfileStore, Profile } from '@/stores/profileStore';
import { usePromptStore, useUIStore } from '@/stores'; 
import { useTrash } from '@/features/trash/contexts/TrashContext'; 
import { useLanguage } from '@/shared/hooks';
import { ProfileModal, PROFILE_ICONS } from '@/features/profiles/components/ProfileModal';
import { InspectModal } from '@/features/prompts/components/InspectModal'; 
import { Prompt } from '@/types';
import ReactDOM from 'react-dom';

const EXTENDED_ICONS: Record<string, any> = { ...PROFILE_ICONS, Layers };

export function ProfilesList() {
  const { profiles, activeProfileId, setActiveProfile, addProfile, deleteProfile, updateProfile } = useProfileStore();
  const { prompts, updatePrompt } = usePromptStore(); 
  const { showConfirmDialog, hideConfirmDialog, showToast } = useUIStore(); 
  const { moveToTrash } = useTrash(); 
  const { t } = useLanguage();
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);
  
  // State for Duplication
  const [duplicateData, setDuplicateData] = useState<{name: string, description: string, icon: string} | undefined>(undefined);
  const [duplicatePromptIds, setDuplicatePromptIds] = useState<string[] | undefined>(undefined);

  const [inspectingProfile, setInspectingProfile] = useState<Profile | null>(null);
  const [inspectingPrompt, setInspectingPrompt] = useState<Prompt | null>(null);

  const filteredProfiles = profiles
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
        if (a.id === 'general') return -1;
        if (b.id === 'general') return 1;
        return 0; 
    });

  const handleOpenCreate = () => {
    setEditingProfile(undefined);
    setDuplicateData(undefined);
    setDuplicatePromptIds(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    setEditingProfile(profile);
    setDuplicateData(undefined);
    setDuplicatePromptIds(undefined);
    setIsModalOpen(true);
  };

  const handleDuplicate = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    
    // 1. Calculate new name
    let newName = `${profile.name} (1)`;
    let counter = 1;
    const existingNames = profiles.map(p => p.name.toLowerCase());
    
    // Regex to detect if name already ends in (N)
    const match = profile.name.match(/^(.*) \((\d+)\)$/);
    let baseName = profile.name;
    if (match) {
        baseName = match[1];
        counter = parseInt(match[2]);
    }

    while (existingNames.includes(`${baseName} (${counter})`.toLowerCase())) {
        counter++;
    }
    newName = `${baseName} (${counter})`;

    // 2. Get currently assigned prompts
    const assignedIds = prompts
        .filter(p => p.profileIds?.includes(profile.id))
        .map(p => p.id);

    // 3. Set state for modal
    setDuplicateData({
        name: newName,
        description: "",
        icon: profile.icon
    });
    setDuplicatePromptIds(assignedIds);
    setEditingProfile(undefined); 
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    showConfirmDialog({
        title: "Delete Profile", 
        message: `Are you sure you want to delete the profile "${profile.name}"?`,
        variant: 'danger',
        confirmLabel: "Delete", 
        cancelLabel: "Cancel",
        onConfirm: () => {
            moveToTrash({
                type: 'profile', origin: 'profiles', originalId: profile.id,
                label: profile.name, data: profile
            });

            if (activeProfileId === profile.id) {
                setActiveProfile('general');
            }

            deleteProfile(profile.id);
            showToast(`Profile "${profile.name}" moved to trash`, 'success');
            hideConfirmDialog();
        }
    });
  };

  const handleSaveProfile = (data: Pick<Profile, 'name' | 'description' | 'icon'>, selectedPromptIds: string[]) => {
    if (editingProfile) {
        updateProfile(editingProfile.id, data);
        prompts.forEach(p => {
            const currentProfiles = p.profileIds || [];
            const isAssigned = currentProfiles.includes(editingProfile.id);
            const shouldBeAssigned = selectedPromptIds.includes(p.id);

            if (shouldBeAssigned && !isAssigned) {
                updatePrompt(p.id, { profileIds: [...currentProfiles, editingProfile.id] });
            } else if (!shouldBeAssigned && isAssigned) {
                updatePrompt(p.id, { profileIds: currentProfiles.filter(id => id !== editingProfile.id) });
            }
        });
        showToast('Profile updated', 'success');
    } else {
        const newId = Date.now().toString();
        addProfile({
            id: newId, ...data, isActive: false, createdAt: Date.now()
        });

        let count = 0;
        if (selectedPromptIds && selectedPromptIds.length > 0) {
            selectedPromptIds.forEach(id => {
                const prompt = prompts.find(p => p.id === id);
                if (prompt) {
                    const currentProfiles = prompt.profileIds || [];
                    if (!currentProfiles.includes(newId)) {
                        updatePrompt(prompt.id, { profileIds: [...currentProfiles, newId] });
                        count++;
                    }
                }
            });
        }
        showToast(duplicateData ? `Profile duplicated with ${count} prompts` : 'Profile created successfully', 'success');
    }
  };

  const getPromptCount = (profileId: string) => {
      if (profileId === 'general') return prompts.length;
      return prompts.filter(p => p.profileIds?.includes(profileId)).length;
  };

  const getAssociatedPrompts = (profileId: string) => {
      if (profileId === 'general') return prompts;
      return prompts.filter(p => p.profileIds?.includes(profileId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* TOOLBAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #374151', backgroundColor: '#18181b', flexShrink: 0 }}>
          <button 
            onClick={handleOpenCreate} 
            title="Create New Profile"
            style={{ 
                height: '32px', width: 'fit-content', padding: '0 12px',
                backgroundColor: '#ea580c', border: 'none', borderRadius: '6px',
                color: 'white', fontSize: '12px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s'
            }}
          >
            <Plus size={14} strokeWidth={3} /> New Profile
          </button>

          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search profiles..."
              style={{
                width: '100%', height: '32px', backgroundColor: '#18181b', border: '1px solid #3f3f46',
                borderRadius: '6px', padding: '0 8px 0 30px', fontSize: '12px', color: '#e4e4e7',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', alignContent: 'start' }}>
        {filteredProfiles.map(profile => {
          const Icon = EXTENDED_ICONS[profile.icon] || User;
          const isActive = profile.id === activeProfileId;
          const isGeneral = profile.id === 'general';
          const promptCount = getPromptCount(profile.id);

          const activeColor = isGeneral ? '#a855f7' : '#eab308'; 
          const activeBg = isGeneral ? 'rgba(168, 85, 247, 0.05)' : 'rgba(234, 179, 8, 0.05)';
          const activeBorder = isGeneral ? '#a855f7' : '#eab308';

          return (
            <div 
              key={profile.id}
              onClick={() => setActiveProfile(profile.id)}
              style={{
                backgroundColor: isActive ? activeBg : '#27272a',
                border: isActive ? `1px solid ${activeBorder}` : '1px solid #3f3f46',
                borderRadius: '12px', padding: '16px',
                cursor: 'pointer', transition: 'all 0.2s ease',
                position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '8px', 
                    backgroundColor: isActive ? activeBorder : '#3f3f46', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? '#18181b' : '#a1a1aa'
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isActive ? activeColor : '#f4f4f5' }}>{profile.name}</div>
                    <div style={{ fontSize: '11px', color: '#71717a' }}>{isActive ? 'Active Profile' : 'Inactive'}</div>
                  </div>
                </div>
                
                <div style={{ 
                    backgroundColor: isActive ? activeColor : '#3f3f46', 
                    borderRadius: '12px', padding: '4px 8px', 
                    display: 'flex', alignItems: 'center', gap: '4px',
                    color: isActive ? '#fff' : '#a1a1aa'
                }}>
                    <FileText size={10} />
                    <span style={{ fontSize: '10px', fontWeight: 700 }}>{promptCount}</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '1.4', height: '34px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {profile.description || "No description provided."}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: isActive ? `1px solid ${activeColor}33` : '1px solid #323238' }}>
                 
                 <button 
                    onClick={(e) => { e.stopPropagation(); setInspectingProfile(profile); }}
                    style={{ 
                        flex: 1, padding: '8px', borderRadius: '6px', border: 'none', 
                        backgroundColor: '#3f3f46', color: '#e4e4e7', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3b82f6'} // BLUE
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3f3f46'}
                    title="Inspect Profile"
                 >
                    <Search size={16} />
                 </button>

                 {!isGeneral && (
                    <>
                        <button 
                            onClick={(e) => handleOpenEdit(e, profile)}
                            style={{ 
                                flex: 1, padding: '8px', borderRadius: '6px', border: 'none', 
                                backgroundColor: '#3f3f46', color: '#e4e4e7', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#a855f7'} // PURPLE
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3f3f46'}
                            title="Edit Profile"
                        >
                            <Pencil size={16} />
                        </button>

                        <button 
                            onClick={(e) => handleDuplicate(e, profile)}
                            style={{ 
                                flex: 1, padding: '8px', borderRadius: '6px', border: 'none', 
                                backgroundColor: '#3f3f46', color: '#e4e4e7', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#22c55e'} // GREEN
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3f3f46'}
                            title="Duplicate Profile"
                        >
                            <Copy size={16} />
                        </button>

                        <button 
                            onClick={(e) => handleDelete(e, profile)}
                            style={{ 
                                flex: 1, padding: '8px', borderRadius: '6px', border: 'none', 
                                backgroundColor: 'transparent', color: '#ef4444', 
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} // RED TINT
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Delete Profile"
                        >
                            <Trash2 size={16} /> 
                        </button>
                    </>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      <ProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProfile}
        initialData={editingProfile}
        prefillData={duplicateData}
        prefillPromptIds={duplicatePromptIds}
      />

      {/* INSPECT OVERVIEW MODAL */}
      {inspectingProfile && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }} onClick={() => setInspectingProfile(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '90vw', maxHeight: '85vh', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Header */}
                <div style={{ 
                    padding: '20px 24px', 
                    backgroundColor: '#18181b', 
                    borderBottom: '1px solid #3f3f46',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            {React.createElement(EXTENDED_ICONS[inspectingProfile.icon] || User, { size: 24 })}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Profile Overview
                            </span>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#f4f4f5' }}>
                                {inspectingProfile.name}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setInspectingProfile(null)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Description */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                        <div style={{ fontSize: '14px', color: '#e4e4e7', lineHeight: '1.6', backgroundColor: '#27272a', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46' }}>
                            {inspectingProfile.description || "No description provided for this profile."}
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        
                        {/* 1. History Box */}
                        <div style={{ backgroundColor: '#27272a', padding: '16px', borderRadius: '8px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} color="#a855f7" />
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>HISTORY</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#f4f4f5' }}>
                                <div>Created: {inspectingProfile.createdAt ? new Date(inspectingProfile.createdAt).toLocaleDateString() : 'System'}</div>
                                <div>Last Used: {activeProfileId === inspectingProfile.id ? 'Now' : 'Unknown'}</div>
                            </div>
                        </div>

                        {/* 2. Assigned Prompts Box */}
                        <div style={{ backgroundColor: '#27272a', padding: '16px', borderRadius: '8px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', marginBottom: '8px' }}>
                                <FileText size={14} color="#eab308" />
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>
                                    Assigned Prompts
                                </span>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5', textAlign: 'center' }}>
                                {getAssociatedPrompts(inspectingProfile.id).length}
                            </div>
                        </div>

                        {/* 3. ID Box */}
                        <div style={{ backgroundColor: '#27272a', padding: '16px', borderRadius: '8px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', marginBottom: '8px' }}>
                                <Hash size={14} color="#3b82f6" />
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>ID</span>
                            </div>
                            <div style={{ fontSize: '16px', color: '#f4f4f5', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'center' }}>
                                {inspectingProfile.id}
                            </div>
                        </div>
                    </div>

                    {/* Associated Prompts List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Associated Prompts
                        </span>
                        <div style={{ 
                            backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', 
                            maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column' 
                        }}>
                            {getAssociatedPrompts(inspectingProfile.id).length > 0 ? (
                                getAssociatedPrompts(inspectingProfile.id).map((p, index) => (
                                    <div key={p.id} style={{ 
                                        padding: '10px 14px', borderBottom: '1px solid #3f3f46', 
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        fontSize: '13px', color: '#e4e4e7'
                                    }}>
                                        <span style={{ color: '#71717a', fontSize: '11px', minWidth: '20px' }}>{index + 1}.</span>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || 'Untitled'}</div>
                                            <div style={{ fontSize: '11px', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                                {p.content.replace(/\n/g, ' ')}
                                            </div>
                                        </div>
                                        {/* Inspect Prompt Button */}
                                        <button 
                                            onClick={() => setInspectingPrompt(p)}
                                            style={{ 
                                                background: 'transparent', border: 'none', color: '#71717a', 
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: '4px', borderRadius: '4px'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3f3f46'; e.currentTarget.style.color = '#e4e4e7'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#71717a'; }}
                                            title="Inspect Prompt"
                                        >
                                            <Search size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '24px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                                    No prompts assigned to this profile.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid #3f3f46', backgroundColor: '#18181b', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={() => setInspectingProfile(null)} 
                        style={{ 
                            padding: '8px 24px', borderRadius: '6px', border: 'none', 
                            background: '#ef4444', color: 'white', fontWeight: 600, 
                            cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* PROMPT INSPECT MODAL */}
      <InspectModal 
        isOpen={!!inspectingPrompt} 
        prompt={inspectingPrompt} 
        onClose={() => setInspectingPrompt(null)} 
      />

    </div>
  );
}
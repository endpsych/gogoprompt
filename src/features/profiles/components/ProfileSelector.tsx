/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { Briefcase, Microscope, Languages, Sparkles, User, Code, ChevronUp, Check, Layers, Search } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Briefcase, Microscope, Languages, Sparkles, User, Code, Layers
};

export function ProfileSelector() {
  const { profiles, activeProfileId, setActiveProfile } = useProfileStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const ActiveIcon = activeProfile ? (ICON_MAP[activeProfile.icon] || User) : User;
  
  const isGeneral = activeProfileId === 'general';
  const activeColor = isGeneral ? '#a855f7' : '#eab308'; 

  const toggleOpen = () => {
      setIsOpen(!isOpen);
      if (!isOpen) {
          setSearch(''); // Reset search on open
          setTimeout(() => searchInputRef.current?.focus(), 100);
      }
  };

  const filteredProfiles = profiles.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={toggleOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: '8px',
          border: '1px solid #3f3f46',
          backgroundColor: isOpen ? '#27272a' : 'transparent',
          color: '#e4e4e7',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '160px',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ActiveIcon size={16} color={activeColor} />
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProfile?.name || 'Select Profile'}
            </span>
        </div>
        <ChevronUp size={14} color="#a1a1aa" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropup Menu */}
      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 49 }} 
            onClick={() => setIsOpen(false)} 
          />
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            width: '260px',
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '12px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden' // Clip corners
          }}>
            
            {/* Search Bar */}
            <div style={{ padding: '8px', borderBottom: '1px solid #27272a' }} onClick={e => e.stopPropagation()}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={12} style={{ position: 'absolute', left: '10px', color: '#71717a', pointerEvents: 'none' }} />
                    <input 
                        ref={searchInputRef}
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        placeholder="Search profiles..." 
                        style={{ 
                            width: '100%', backgroundColor: '#27272a', border: '1px solid #3f3f46', 
                            borderRadius: '6px', padding: '6px 8px 6px 30px', fontSize: '12px', 
                            color: '#e4e4e7', outline: 'none' 
                        }} 
                    />
                </div>
            </div>

            {/* Profile List */}
            <div style={{ 
                maxHeight: '250px', 
                overflowY: 'auto', 
                padding: '4px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '2px' 
            }}>
                {filteredProfiles.length > 0 ? (
                    filteredProfiles.map(profile => {
                    const Icon = ICON_MAP[profile.icon] || User;
                    const isActive = profile.id === activeProfileId;
                    const isThisGeneral = profile.id === 'general';
                    const thisColor = isThisGeneral ? '#a855f7' : '#eab308';

                    return (
                        <button
                        key={profile.id}
                        onClick={() => {
                            setActiveProfile(profile.id);
                            setIsOpen(false);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                            color: isActive ? '#f4f4f5' : '#a1a1aa',
                            fontSize: '13px',
                            fontWeight: isActive ? 600 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isActive ? 'rgba(255, 255, 255, 0.08)' : '#27272a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent'}
                        >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <Icon size={16} color={isActive ? thisColor : '#71717a'} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</span>
                        </div>
                        {isActive && <Check size={14} color={thisColor} />}
                        </button>
                    );
                    })
                ) : (
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#52525b' }}>
                        No profiles found.
                    </div>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
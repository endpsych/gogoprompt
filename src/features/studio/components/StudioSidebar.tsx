/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React from 'react';
import { 
  FileText, Sparkles, Users, Package, Archive, Settings 
} from 'lucide-react';
import { useLanguage } from '@/shared/hooks';

interface StudioSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenTemplates: () => void;
  onOpenTrash: () => void;
  onOpenSettings: () => void;
}

export function StudioSidebar({
  activeTab,
  onTabChange,
  onOpenTemplates,
  onOpenTrash,
  onOpenSettings
}: StudioSidebarProps) {
  const { t } = useLanguage();

  const getButtonStyle = (isActive = false) => ({
    height: '32px',
    padding: '0 10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    marginBottom: '12px', fontSize: '13px', flex: 1, whiteSpace: 'nowrap' as const,
    backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer',
    ...(isActive && { color: '#f9fafb' }) 
  });

  const iconBtnStyle = {
    height: '32px', minWidth: '32px', padding: '0 6px',
    borderRadius: '6px', background: 'transparent', border: 'none',
    color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'all 0.2s ease', marginBottom: '12px'
  };

  return (
    <div className="sidebar-tabs" style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '0 8px', borderBottom: '1px solid #374151', height: '54px', flexShrink: 0 }}>
      

      {/* Tabs */}
      <button 
        className={`sidebar-tab ${activeTab === 'prompts' ? 'active' : ''}`} 
        onClick={() => onTabChange('prompts')} 
        title={t.tabs.prompts}
        style={getButtonStyle(activeTab === 'prompts')}
      >
        <FileText size={16} /> <span>{t.tabs.prompts}</span>
      </button>

      <button 
        className={`sidebar-tab ${activeTab === 'variables' ? 'active' : ''}`} 
        onClick={() => onTabChange('variables')} 
        title={t.variables.title}
        style={getButtonStyle(activeTab === 'variables')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: activeTab === 'variables' ? '#ed5e17' : 'inherit' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>{'{'}</span>
            <Sparkles size={12} strokeWidth={2.5} style={{ margin: '0 -1px' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>{'}'}</span>
        </div>
        <span style={{ marginLeft: '4px' }}>{t.variables.title}</span>
      </button>

      <button 
        className={`sidebar-tab ${activeTab === 'profiles' ? 'active' : ''}`} 
        onClick={() => onTabChange('profiles')} 
        title="Profiles"
        style={getButtonStyle(activeTab === 'profiles')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: activeTab === 'profiles' ? '#eab308' : 'inherit' }}>
            <Users size={16} />
        </div>
        <span style={{ marginLeft: '4px' }}>Profiles</span>
      </button>

      {/* Spacer */}
      <div style={{ width: '1px', height: '20px', background: '#374151', margin: '0 4px', marginBottom: '18px' }} />
      
      {/* Utility Buttons */}
      <button style={iconBtnStyle} className="hover:bg-gray-700" onClick={onOpenTemplates} title={t.tooltips.browseTemplates}><Package size={18} /></button>
      <button style={iconBtnStyle} className="hover:bg-gray-700" onClick={onOpenTrash} title={t.tooltips.recyclingBin}><Archive size={18} /></button>
      <button style={iconBtnStyle} className="hover:bg-gray-700" onClick={onOpenSettings} title={t.tooltips.settings}><Settings size={18} /></button>
    </div>
  );
}
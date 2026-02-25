/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { 
  usePromptStore, useUIStore, useSettingsStore, useVariableStore 
} from '@/stores'; 
import { useProfileStore } from '@/stores/profileStore'; 
import { useShortcuts, useUndoRedo, useLanguage, LanguageProvider } from '@/shared/hooks'; 
import { useAppPrompts } from '@/features/prompts/hooks/useAppPrompts'; 
import { useAppActions } from '@/shared/hooks/useAppActions'; 
import { onDataUpdate, openEditorWindow } from '@/shared/utils/storage/electron';
import { isRtl } from '@/shared/utils/i18n'; 
import {
  TitleBar, UnsavedChangesDialog, Toast, ConfirmDialog
} from '@/shared/components';
import { PromptList } from '@/features/prompts/components/PromptList';
import { SettingsModal } from '@/features/settings/components/SettingsModal';
import { DeckMode } from '@/features/deck/components/DeckMode';
import { TemplateGallery } from '@/features/prompts/components/TemplateGallery';
import { StandaloneEditor } from '@/features/studio/components/StandaloneEditor';
import { CreatePromptModal } from '@/features/deck/components/CreatePromptModal'; 
import { InspectModal } from '@/features/prompts/components/InspectModal'; 
import { VariablesList } from '@/features/variables/components/VariablesList';
import { Variable } from '@/stores/variableStore';
import { ProfilesList } from '@/features/profiles/components/ProfilesList'; 
import { VariableModal } from '@/features/variables/components/VariableModal'; 
import { OnboardingOverlay } from '@/features/onboarding/components/OnboardingOverlay';
import { FirstRunPopup } from '@/features/onboarding/components/FirstRunPopup'; 
import { ReminderWindow } from '@/features/onboarding/components/ReminderWindow';
import { ClipboardMonitorWindow } from '@/features/onboarding/components/ClipboardMonitorWindow'; 
import { DeploymentWindow } from '@/features/deck/components/DeploymentWindow';
import { DeploymentMonitor } from '@/features/monitor/DeploymentMonitor'; // Diagnostic monitor
import { TrashModal } from '@/features/trash/components/TrashModal';
import { TrashProvider, TrashItem, useTrash } from '@/features/trash/contexts/TrashContext';
import { PromptSortOrder } from '@/types';

import { StudioSidebar } from '@/features/studio/components/StudioSidebar';
import { StudioToolbar } from '@/features/studio/components/StudioToolbar';
import { StudioFooter } from '@/features/studio/components/StudioFooter';

class ModalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Modal Error:", error, errorInfo); }
  render() { return this.state.hasError ? null : this.props.children; }
}

function AppLayout({ initialMode }: { initialMode?: string | null }) {
  const {
    activeTab, search, activeTagFilters, filterMode, pendingAction, appMode,
    toggleAppMode, toastMessage, toastVariant, setSearch, setActiveTagFilters,
    setFilterMode, setShowSettings, showSettings, showToast, hideToast,
    handleTabChange, checkUnsavedChanges, handleSaveAndProceed, handleDiscardChanges,
    handleCancelNavigation,
    confirmDialog, 
    hideConfirmDialog,
    isNewPrompt,
    setIsNewPrompt,
    setSelectedId,
    setShowPostSummonHint
  } = useUIStore();

  const { t, interpolate, currentLanguageCode = 'en' } = useLanguage(); 

  const {
    autoMinimizeAfterCopy, miniModeCardMaxLines, promptSortOrder, tagColors, highlightSettings,
    toggleAutoMinimize, setCardMaxLines, setSortOrder, getTagColor,
    autoEnter,
    toggleAutoEnter,
    globalHotkey // Added for summoning registration
  } = useSettingsStore();
  
  const direction = useMemo(() => isRtl(currentLanguageCode) ? 'rtl' : 'ltr', [currentLanguageCode]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
  }, [direction]);

  // Initial Startup Logic
  useEffect(() => {
    usePromptStore.getState().init();
    useProfileStore.getState().init(); 
    
    const currentMode = useUIStore.getState().appMode;

    if (initialMode === 'studio') {
        if (currentMode === 'deck') {
            useUIStore.getState().toggleAppMode();
        }
    } else {
        if (currentMode === 'studio') {
            useUIStore.getState().toggleAppMode();
        }
    }

    // Automatically open the Deployment Monitor on startup
    if (window.electronAPI?.openDeploymentMonitor) {
      window.electronAPI.openDeploymentMonitor();
    }

    // Re-register the global summoning hotkey on launch
    if (globalHotkey && window.electronAPI?.registerGlobalHotkey) {
      window.electronAPI.registerGlobalHotkey(globalHotkey);
    }
  }, [initialMode, globalHotkey]);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [firstRunHotkey, setFirstRunHotkey] = useState<string | null>(null);

  useEffect(() => {
    if (window.electronAPI?.getAppSettings) {
      window.electronAPI.getAppSettings().then((settings: any) => {
        if (!settings.hasCompletedOnboarding) setShowOnboarding(true);
      });
    }
    
    // Listener for when Electron successfully handles the global hotkey
    if (window.electronAPI?.onHotkeyTrigger) {
      const cleanup = window.electronAPI.onHotkeyTrigger(() => {
        if (useUIStore.getState().appMode !== 'deck') {
            useUIStore.getState().toggleAppMode();
        }
        
        setFirstRunHotkey((current) => {
            if (current) {
                useUIStore.getState().setShowPostSummonHint(true);
                return null;
            }
            return current;
        });
      });
      return cleanup;
    }
  }, []);

  const { prompts, incrementUseCount, reorderPrompt, reloadPrompts } = usePromptStore();
  
  const { 
    variables, addVariable, updateVariable, deleteVariable, setVariables, incrementVariableUsage 
  } = useVariableStore();

  const { reloadTrash, moveToTrash } = useTrash();

  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showTrash, setShowTrash] = useState(false); 
  const [inspectingPrompt, setInspectingPrompt] = useState<any | null>(null); 
  
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | undefined>(undefined);
  const [variableModalFocus, setVariableModalFocus] = useState<'name' | 'options'>('name');
  
  const [pendingVariable, setPendingVariable] = useState<string | null>(null);

  const { undo, redo, canUndo, canRedo } = useUndoRedo({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        if (!isInput) {
           e.preventDefault();
           if (canUndo) undo();
        }
      }

      if (
        ((e.metaKey || e.ctrlKey) && e.key === 'y') ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z')
      ) {
        if (!isInput) {
           e.preventDefault();
           if (canRedo) redo();
        }
      }

      if (e.key === 'Escape') {
        if (showSettings) { setShowSettings(false); e.preventDefault(); return; }
        if (showVariableModal) { setShowVariableModal(false); e.preventDefault(); return; }
        if (showTemplateGallery) { setShowTemplateGallery(false); e.preventDefault(); return; }
        if (showTrash) { setShowTrash(false); e.preventDefault(); return; }
        if (inspectingPrompt) { setInspectingPrompt(null); e.preventDefault(); return; }
        if (firstRunHotkey) { setFirstRunHotkey(null); e.preventDefault(); return; }
        if (confirmDialog.isOpen) { hideConfirmDialog(); e.preventDefault(); return; }
        
        if (appMode !== 'deck') {
             if (isNewPrompt) { setIsNewPrompt(false); e.preventDefault(); return; }
             if (search) { setSearch(''); e.preventDefault(); return; }
             if (activeTagFilters.length > 0) { setActiveTagFilters([]); e.preventDefault(); return; }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo, redo, canUndo, canRedo, 
    showSettings, setShowSettings, 
    showVariableModal, setShowVariableModal, 
    showTemplateGallery, setShowTemplateGallery,
    showTrash, setShowTrash,
    inspectingPrompt, setInspectingPrompt,
    firstRunHotkey, setFirstRunHotkey,
    confirmDialog, hideConfirmDialog,
    isNewPrompt, setIsNewPrompt,
    search, setSearch,
    activeTagFilters, setActiveTagFilters,
    appMode
  ]);

  useEffect(() => {
    const currentVars = useVariableStore.getState().variables;
    const uniqueVars: Variable[] = [];
    const seenKeys = new Set<string>();
    currentVars.forEach(v => {
        const normKey = v.key.trim().toLowerCase();
        if (!seenKeys.has(normKey)) {
            seenKeys.add(normKey);
            uniqueVars.push(v);
        }
    });
    if (uniqueVars.length !== currentVars.length) {
        useVariableStore.getState().setVariables(uniqueVars);
    }
  }, []);

  useEffect(() => {
    const cleanup = onDataUpdate(() => {
      reloadPrompts();
      reloadTrash();
    });
    return cleanup;
  }, [reloadPrompts, reloadTrash]);

  const { allTags, sidebarFilteredPrompts, sortedPrompts } = useAppPrompts(
    search, activeTagFilters, filterMode, promptSortOrder
  );

  const {
    handleNewPrompt, handleCreatePrompt, handleDeletePrompt
  } = useAppActions(null); 

  const handlePromptClick = useCallback((id: string) => {
    const p = prompts.find(p => p.id === id);
    if (p) {
        navigator.clipboard.writeText(p.content);
        showToast(t.prompts.copiedToClipboard);
        incrementUseCount(id);
        const matches = p.content.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
            const keys = matches.map(m => m.replace(/\{\{|\}\}/g, '').trim());
            incrementVariableUsage(keys);
        }
        useUIStore.getState().setShowPostSummonHint(false);
    }
  }, [prompts, showToast, incrementUseCount, incrementVariableUsage, t]);

  const handleInspectPrompt = useCallback((id: string) => {
    const p = prompts.find(p => p.id === id);
    if (p) setInspectingPrompt(p); 
  }, [prompts]);

  const handleEditPrompt = useCallback((id: string) => {
    openEditorWindow(id);
  }, []);

  const handleStudioSavePrompt = (title: string, content: string, tags: string[], profileIds: string[]) => {
      const newPrompt = usePromptStore.getState().addPrompt(title, content, tags, null);
      if (profileIds && profileIds.length > 0) {
          usePromptStore.getState().updatePrompt(newPrompt.id, { profileIds });
      }
      showToast(t.prompts.promptCreated || 'Prompt created', 'success');
      setIsNewPrompt(false);
      setSelectedId(newPrompt.id);
  };

  const handleDeckSavePromptWrapper = (title: string, content: string, tags: string[], profileIds: string[]) => {
      const newPrompt = usePromptStore.getState().addPrompt(title, content, tags, null);
      if (profileIds && profileIds.length > 0) {
          usePromptStore.getState().updatePrompt(newPrompt.id, { profileIds });
      }
      showToast(t.prompts.promptCreated || 'Prompt created', 'success');
  };

  const handleTemplateAddWrapper = (title: string, content: string, tags: string[]) => {
      handleCreatePrompt(title, content, tags);
  };

  const handleNewVariableWrapper = () => {
      setEditingVariable(undefined);
      setVariableModalFocus('name');
      setShowVariableModal(true);
  };

  const handleEditVariable = (id: string, focus: 'name' | 'options' = 'name') => {
      const v = variables.find(x => x.id === id);
      if (v) {
          setEditingVariable(v);
          setVariableModalFocus(focus);
          setShowVariableModal(true);
      }
  };

  const handleDeleteVariableWrapper = (id: string) => {
      const variable = variables.find(v => v.id === id);
      if (!variable) return;
      const regex = new RegExp(`\\{\\{\\s*${variable.key}\\s*\\}\\}`, 'i');
      const linkedPrompts = prompts.filter(p => regex.test(p.content));
      if (linkedPrompts.length > 0) {
          const msg = interpolate(t.variables.cannotDelete, { count: linkedPrompts.length });
          showToast(msg, 'warning');
          return;
      }
      setShowVariableModal(false); 
  };

  const handleSaveVariable = (variableData: Omit<Variable, 'id'>) => {
      if (editingVariable) {
          updateVariable(editingVariable.id, variableData);
          showToast('Variable updated');
      } else {
          const exists = variables.some(v => v.key.toLowerCase() === variableData.key.toLowerCase());
          if (exists) {
              showToast('Variable already exists', 'warning');
              return;
          }
          const newVar: Variable = { 
              ...variableData,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              useCount: 0,
              lastUsed: 0
          };
          addVariable(newVar);
          showToast('Variable created');
      }
      setShowVariableModal(false);
  };

  const handleRestoreItem = (item: TrashItem) => {
    if (item.origin === 'variables') {
        const exists = useVariableStore.getState().variables.some(v => v.key === item.data.key);
        if (exists) {
            showToast(interpolate(t.variables.exists || 'Variable "{name}" exists', { name: item.data.key }), 'warning');
            return;
        }
        useVariableStore.getState().addVariable(item.data);
        return;
    }
    if (item.origin === 'profiles') {
        const exists = useProfileStore.getState().profiles.some(p => p.id === item.data.id);
        if (exists) {
            showToast(`Profile "${item.data.name}" already exists`, 'warning');
            return;
        }
        useProfileStore.getState().addProfile(item.data);
        return;
    }
    if (item.origin === 'deck_mode') {
        const currentStr = localStorage.getItem('deck_mode_addons');
        let currentList = currentStr ? JSON.parse(currentStr) : [];
        if (item.type === 'category') {
             const catName = item.data.name || item.data.category;
             if (!currentList.some((c: any) => (c.name || c.category) === catName)) {
                 currentList.push(item.data);
             }
        } else {
             const targetCatName = item.data.parentCategory || "Restored";
             let cat = currentList.find((c: any) => (c.name || c.category) === targetCatName);
             if (!cat) {
                 cat = { category: targetCatName, items: [] };
                 currentList.push(cat);
             }
             const { parentCategory, ...cleanData } = item.data;
             cat.items.push(cleanData);
        }
        localStorage.setItem('deck_mode_addons', JSON.stringify(currentList));
        window.dispatchEvent(new Event('deck_addons_updated'));
        return;
    }
    if (item.type === 'template' || item.type === 'category') { 
        usePromptStore.getState().addPrompt(item.data); 
    }
  };

  const handleAppExport = useCallback(() => {
      const currentPrompts = usePromptStore.getState().prompts;
      const currentVariables = useVariableStore.getState().variables;
      const deckAddons = JSON.parse(localStorage.getItem('deck_mode_addons') || '[]');
      return {
          version: 2,
          timestamp: new Date().toISOString(),
          data: { prompts: currentPrompts, variables: currentVariables, deckAddons: deckAddons }
      };
  }, []);

  const handleAppImport = useCallback((backup: any) => {
      if (!backup || !backup.data) {
          showToast('Invalid backup file', 'error');
          return;
      }
      let promptCount = 0;
      let varCount = 0;
      if (Array.isArray(backup.data.prompts)) {
          const currentPrompts = usePromptStore.getState().prompts;
          const currentIds = new Set(currentPrompts.map(p => p.id));
          backup.data.prompts.forEach((p: any) => {
              if (!currentIds.has(p.id)) {
                  usePromptStore.getState().addPrompt(p); 
                  promptCount++;
              }
          });
      }
      if (Array.isArray(backup.data.variables)) {
          const currentVars = useVariableStore.getState().variables;
          const currentKeys = new Set(currentVars.map(v => v.key));
          backup.data.variables.forEach((v: any) => {
              if (!currentKeys.has(v.key)) {
                  useVariableStore.getState().addVariable(v);
                  varCount++;
              }
          });
      }
      if (Array.isArray(backup.data.deckAddons)) {
          localStorage.setItem('deck_mode_addons', JSON.stringify(backup.data.deckAddons));
          window.dispatchEvent(new Event('deck_addons_updated'));
      }
      reloadPrompts(); 
      showToast(`Imported: ${promptCount} prompts, ${varCount} variables`, 'success');
  }, [reloadPrompts, showToast]);

  const handleAddShortcut = useCallback((label: string, keys: string) => {
      showToast(`Shortcut "${label}" added successfully`, 'success'); 
  }, [showToast]);

  const settingsModalProps = {
    shortcuts: [], 
    onUpdateShortcut: () => {}, 
    onResetShortcut: () => {}, 
    onResetAllShortcuts: () => {},
    onExport: handleAppExport,
    onImport: handleAppImport,
    onAddShortcut: handleAddShortcut,
    preferences: { autoMinimizeAfterCopy, miniModeCardMaxLines, promptSortOrder },
    onToggleAutoMinimize: toggleAutoMinimize,
    onSetCardMaxLines: setCardMaxLines,
    onClose: () => setShowSettings(false),
  };

  return (
    <div className={`app-container ${appMode === 'deck' ? 'deck' : ''}`} dir={direction}>
      
      {showOnboarding && (
        <OnboardingOverlay 
          onComplete={(hotkey) => {
            setShowOnboarding(false);
            if (hotkey) setFirstRunHotkey(hotkey);
          }} 
        />
      )}

      {firstRunHotkey && (
        <FirstRunPopup 
          hotkey={firstRunHotkey} 
          onDismiss={() => setFirstRunHotkey(null)} 
        />
      )}

      {showSettings && <ModalErrorBoundary><SettingsModal {...settingsModalProps} /></ModalErrorBoundary>}
      {pendingAction && <UnsavedChangesDialog onSave={handleSaveAndProceed} onDiscard={handleDiscardChanges} onCancel={handleCancelNavigation} />}
      {toastMessage && <Toast message={toastMessage} onClose={hideToast} variant={toastVariant} />}
      
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen} 
        title={confirmDialog.title} 
        message={confirmDialog.message} 
        variant={confirmDialog.variant} 
        confirmLabel={confirmDialog.confirmLabel} 
        onConfirm={confirmDialog.onConfirm} 
        onCancel={hideConfirmDialog} 
      />

      <InspectModal isOpen={!!inspectingPrompt} prompt={inspectingPrompt} onClose={() => setInspectingPrompt(null)} />
      
      <VariableModal 
        isOpen={showVariableModal} onClose={() => setShowVariableModal(false)}
        onSave={handleSaveVariable} onDelete={handleDeleteVariableWrapper} 
        initialData={editingVariable} initialFocus={variableModalFocus} 
        prompts={prompts} showToast={showToast}
      />

      {showTrash && <TrashModal onClose={() => setShowTrash(false)} onRestore={handleRestoreItem} />}

      {appMode === 'deck' ? (
        <DeckMode
          prompts={sortedPrompts}
          components={[]} 
          highlightSettings={highlightSettings}
          getTypeColor={() => '#6b7280'}
          getTagColor={getTagColor}
          allTags={allTags}
          onSwitchToStudio={toggleAppMode}
          onOpenSettings={() => setShowSettings(true)}
          autoMinimizeAfterCopy={autoMinimizeAfterCopy}
          onToggleAutoMinimize={toggleAutoMinimize}
          autoEnter={autoEnter}
          onToggleAutoEnter={toggleAutoEnter}
          cardMaxLines={miniModeCardMaxLines}
          onIncrementUseCount={incrementUseCount}
          onReorder={reorderPrompt}
          sortOrder={promptSortOrder}
          onSortOrderChange={setSortOrder}
          onDeletePrompt={handleDeletePrompt}
          onSavePrompt={handleDeckSavePromptWrapper} 
        />
      ) : (
        <>
          <TitleBar onOpenSettings={() => {}} onToggleMiniMode={() => {}} />
          
          {isNewPrompt && (
            <CreatePromptModal
                onClose={() => {
                    setIsNewPrompt(false);
                    if (useUIStore.getState().selectedId === 'NEW') {
                        setSelectedId(null);
                    }
                }}
                onSave={handleStudioSavePrompt}
                getTagColor={getTagColor}
                allTags={allTags}
                onCreateNewVariable={handleNewVariableWrapper}
                pendingVariable={pendingVariable}
                onClearPendingVariable={() => setPendingVariable(null)}
            />
          )}

          <div className="main-content" style={{ flexDirection: 'column' }}> 
            <div className="studio-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              <StudioSidebar 
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onOpenTemplates={() => setShowTemplateGallery(true)}
                onOpenTrash={() => setShowTrash(true)}
                onOpenSettings={() => setShowSettings(true)}
              />

              {activeTab === 'prompts' && (
                <StudioToolbar 
                  onNewPrompt={handleNewPrompt}
                  search={search}
                  onSearchChange={setSearch}
                  searchInputRef={searchInputRef}
                  allTags={allTags}
                  activeTagFilters={activeTagFilters}
                  setActiveTagFilters={setActiveTagFilters}
                  filterMode={filterMode}
                  setFilterMode={setFilterMode}
                  getTagColor={getTagColor}
                  sortOrder={promptSortOrder}
                  setSortOrder={setSortOrder}
                />
              )}

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'prompts' && (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <PromptList 
                            prompts={sidebarFilteredPrompts} selectedId={null} onSelect={handlePromptClick} 
                            getTagColor={getTagColor} sortOrder={promptSortOrder} onSortOrderChange={setSortOrder} 
                            onEdit={handleEditPrompt} onDelete={handleDeletePrompt} onInspect={handleInspectPrompt} 
                        />
                    </div>
                )}
                {activeTab === 'variables' && (
                    <VariablesList 
                        variables={variables} prompts={prompts} onAdd={handleNewVariableWrapper} 
                        onEdit={handleEditVariable} onDelete={handleDeleteVariableWrapper} getTagColor={getTagColor}
                    />
                )}
                {activeTab === 'profiles' && <ProfilesList />}
              </div>

              <StudioFooter />

            </div>
          </div>

          <TemplateGallery 
            isOpen={showTemplateGallery} 
            onClose={() => setShowTemplateGallery(false)} 
            onAddTemplate={handleTemplateAddWrapper}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  // Route for Clipboard Monitor
  if (mode === 'clipboard-monitor') {
    return <ClipboardMonitorWindow />;
  }

  // Route for Reminder
  if (mode === 'reminder') {
    return <ReminderWindow />;
  }

  // Route for Deployment Window (Pre-deployment as separate window)
  if (mode === 'deployment') {
    return <DeploymentWindow />;
  }

  // Route for Deployment Diagnostic Monitor
  if (mode === 'deployment-monitor') {
    return <DeploymentMonitor />;
  }

  const isEditorMode = mode === 'editor';

  return (
    <LanguageProvider>
      <TrashProvider>
        {isEditorMode ? <StandaloneEditor /> : <AppLayout initialMode={mode} />}
      </TrashProvider>
    </LanguageProvider>
  );
}
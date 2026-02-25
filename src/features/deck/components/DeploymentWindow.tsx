/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 * * DeploymentWindow - Standalone window for pre-deployment of variable prompts
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { X, Minus, Zap } from 'lucide-react';
import { usePromptStore, useSettingsStore, useVariableStore } from '@/stores';
import { useLanguage, LanguageProvider } from '@/shared/hooks';
import { useVariableModalLogic } from '@/features/deck/hooks/useVariableModalLogic';
import { PromptPreview } from '@/features/deck/components/PromptPreview';
import { VariableList } from '@/features/deck/components/DeploymentVariableList';
import { AddonList } from '@/features/addons/components/AddonList';
import { InjectionMenu, AddonCategory } from '@/features/addons/components/InjectionMenu';
import { MINI_PROMPTS } from '@/features/addons/constants/miniPrompts';
import { isAutoPasteModifierHeld, isAutoEnterModifierHeld } from '@/features/settings/components/HotkeysPanel';
import { closeWindow, minimizeWindow, minimizeAndPaste } from '@/shared/utils/storage/electron';
import { Prompt } from '@/types';
import { TrashProvider } from '@/features/trash/contexts/TrashContext';

// Parse URL params including Onboarding flag
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const promptId = params.get('promptId') || '';
  const isOnboarding = params.get('isOnboarding') === 'true'; 
  let initialValues: Record<string, string> = {};
  try {
    const iv = params.get('initialValues');
    if (iv) initialValues = JSON.parse(iv);
  } catch (e) {}
  return { promptId, initialValues, isOnboarding };
}

function DeploymentWindowContent() {
  const { t } = useLanguage();
  // Read initial params
  const { promptId: urlPromptId, initialValues: urlInitialValues, isOnboarding: urlIsOnboarding } = useMemo(() => getUrlParams(), []);
  
  const { highlightSettings } = useSettingsStore();
  const prompts = usePromptStore((s) => s.prompts);
  const incrementUseCount = usePromptStore((s) => s.incrementUseCount);
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [initialValues, setInitialValues] = useState<Record<string, string>>(urlInitialValues);
  const [isOnboarding, setIsOnboarding] = useState(urlIsOnboarding);

  // Initialize stores
  useEffect(() => {
    const promptStore = usePromptStore.getState();
    if ('init' in promptStore && typeof (promptStore as any).init === 'function') {
      (promptStore as any).init();
    }

    const variableStore = useVariableStore.getState();
    if ('init' in variableStore && typeof (variableStore as any).init === 'function') {
      (variableStore as any).init();
    }

    const settingsStore = useSettingsStore.getState();
    if ('init' in settingsStore && typeof (settingsStore as any).init === 'function') {
      (settingsStore as any).init();
    }
  }, []);

  // Handshake: Tell Main Process we are ready to receive data
  useEffect(() => {
    if (window.electronAPI?.deploymentReady) {
       setTimeout(() => window.electronAPI.deploymentReady(), 100);
    }
  }, []);

  // Find the initial prompt
  useEffect(() => {
    if (urlPromptId && prompts.length > 0) {
      const found = prompts.find(p => p.id === urlPromptId);
      if (found) setPrompt(found);
    }
  }, [urlPromptId, prompts]);

  // Listen for updates (Window Reuse)
  useEffect(() => {
    if ((window as any).electronAPI?.onLoadDeployment) {
      const cleanup = (window as any).electronAPI.onLoadDeployment((data: { promptId: string; initialValues?: Record<string, string>; isOnboarding?: boolean }) => {
        const found = usePromptStore.getState().prompts.find(p => p.id === data.promptId);
        if (found) {
          setPrompt(found);
          setInitialValues(data.initialValues || {});
          if (data.isOnboarding !== undefined) setIsOnboarding(data.isOnboarding);
        }
      });
      return cleanup;
    }
  }, []);

  if (!prompt) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#18181b',
        color: '#a1a1aa',
        gap: '10px'
      }}>
        <Zap className="animate-pulse" size={20} />
        <span>Loading prompt...</span>
      </div>
    );
  }

  return (
    <DeploymentPanel 
      prompt={prompt} 
      initialValues={initialValues}
      highlightSettings={highlightSettings}
      onClose={closeWindow}
      incrementUseCount={incrementUseCount}
      t={t}
      isOnboarding={isOnboarding}
    />
  );
}

interface DeploymentPanelProps {
  prompt: Prompt;
  initialValues: Record<string, string>;
  highlightSettings: any;
  onClose: () => void;
  incrementUseCount: (id: string) => void;
  t: any;
  isOnboarding: boolean;
}

function DeploymentPanel({ prompt, initialValues, highlightSettings, onClose, incrementUseCount, t, isOnboarding }: DeploymentPanelProps) {
  const logic = useVariableModalLogic(prompt, initialValues, '');
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const [showDeployWarning, setShowDeployWarning] = useState(false);
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const [isDeployHovered, setIsDeployHovered] = useState(false);

  const hasVariables = logic.vars.length > 0;

  const [categories, setCategories] = useState<AddonCategory[]>(() => {
    try {
      const saved = localStorage.getItem('deck_mode_addons');
      return saved ? JSON.parse(saved) : MINI_PROMPTS;
    } catch (e) {
      return MINI_PROMPTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('deck_mode_addons', JSON.stringify(categories));
  }, [categories]);

  // Track modifier keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlHeld(true);
      if (e.key === 'Alt') setIsAltHeld(true);
      if (e.key === 'Shift') setIsShiftHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlHeld(false);
      if (e.key === 'Alt') setIsAltHeld(false);
      if (e.key === 'Shift') setIsShiftHeld(false);
    };
    const handleBlur = () => {
      setIsCtrlHeld(false);
      setIsAltHeld(false);
      setIsShiftHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const effectiveBaseContent = useMemo(() => {
    return prompt.content;
  }, [prompt.content]);

  const getFinalContent = () => {
    let c = effectiveBaseContent;
    for (const [k, v] of Object.entries(logic.variableValues)) {
      c = c.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi'), v);
    }
    const addonsText = logic.structureItems
      .filter(i => i.type !== 'prompt')
      .map(i => i.text)
      .join('\n');
    return addonsText ? `${c}\n\n${addonsText}` : c;
  };

  const allFilled = logic.vars.every(v => logic.variableValues[v]?.trim());
  const highlightIndex = logic.draggedIndex !== null ? logic.draggedIndex : logic.hoveredItemIndex;

  const showAutoPasteHighlight = allFilled && isAutoPasteModifierHeld(isCtrlHeld, isAltHeld, isShiftHeld);
  const showAutoEnterHighlight = allFilled && isAutoEnterModifierHeld(isCtrlHeld, isAltHeld, isShiftHeld);

  const getDeployActionLabel = (): { label: string; color: string } => {
    if (showAutoEnterHighlight) return { label: 'Auto-Send', color: '#ef4444' };
    if (showAutoPasteHighlight) return { label: 'Auto-Paste', color: '#3b82f6' };
    return { label: 'Copy', color: '#22c55e' };
  };

  const getDeployButtonStyle = (): React.CSSProperties => {
    const baseDisabled: React.CSSProperties = {
      backgroundColor: '#3f3f46',
      color: '#71717a',
      cursor: 'not-allowed',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '6px 16px',
      fontWeight: 600,
      borderRadius: '6px',
      transition: 'background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      width: '160px'
    };

    if (!allFilled) return baseDisabled;

    if (showAutoEnterHighlight) {
      return {
        ...baseDisabled,
        backgroundColor: '#ef4444',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.3), 0 0 20px rgba(239, 68, 68, 0.4)',
        border: '1px solid #f87171'
      };
    } else if (showAutoPasteHighlight) {
      return {
        ...baseDisabled,
        backgroundColor: '#3b82f6',
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)',
        border: '1px solid #60a5fa'
      };
    }

    return {
      ...baseDisabled,
      backgroundColor: '#22c55e',
      color: 'white',
      cursor: 'pointer'
    };
  };

  const handleConfirm = async (e: React.MouseEvent) => {
    if (!allFilled) return;
    
    const finalContent = getFinalContent();
    const shouldAutoPaste = isAutoPasteModifierHeld(isCtrlHeld, isAltHeld, isShiftHeld);
    const shouldAutoEnter = isAutoEnterModifierHeld(isCtrlHeld, isAltHeld, isShiftHeld);

    try {
      if (window.electronAPI?.confirmDeployment) {
         window.electronAPI.confirmDeployment({ content: finalContent, variables: logic.variableValues });
      }

      await navigator.clipboard.writeText(finalContent);
      incrementUseCount(prompt.id);

      if (shouldAutoPaste || shouldAutoEnter) {
        setTimeout(() => {
          minimizeAndPaste(shouldAutoEnter);
        }, 100);
      }

      setTimeout(() => onClose(), shouldAutoPaste || shouldAutoEnter ? 200 : 500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="deployment-window-container" style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#18181b',
      color: '#f4f4f5',
      overflow: 'hidden'
    }}>
      <style>{`
        .deployment-window { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .deployment-titlebar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px; background: #09090b; -webkit-app-region: drag;
          border-bottom: 1px solid #27272a;
        }
        .deployment-titlebar .logo { display: flex; align-items: center; gap: 6px; color: #f97316; font-weight: 700; font-size: 13px; }
        .deployment-titlebar .controls { display: flex; gap: 4px; -webkit-app-region: no-drag; }
        .deployment-titlebar .control-btn {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          border: none; border-radius: 4px; cursor: pointer; background: transparent; color: #a1a1aa;
          transition: all 0.15s;
        }
        .deployment-titlebar .control-btn:hover { background: #27272a; color: #f4f4f5; }
        .deployment-titlebar .close-btn:hover { background: #ef4444; color: white; }
        
        .deployment-header {
          padding: 12px 16px; border-bottom: 1px solid #27272a;
          display: flex; align-items: center; gap: 8px;
        }
        .deployment-body { flex: 1; display: flex; overflow: hidden; position: relative; }
        .deployment-footer {
          padding: 12px 16px; border-top: 1px solid #27272a;
          display: flex; justify-content: flex-end; gap: 12px;
        }
        .deployment-cancel-btn {
          background: transparent; border: 1px solid #ef4444; color: #ef4444;
          padding: 6px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;
        }
        .deployment-cancel-btn:hover { background: rgba(239, 68, 68, 0.1); }

        /* Variable Highlight Pulsating Animation */
        @keyframes pulse-orange {
          0% { border-color: #f97316; box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.2); }
          50% { border-color: #fb923c; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.4); }
          100% { border-color: #f97316; box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.2); }
        }

        .onboarding-highlight-vars input, 
        .onboarding-highlight-vars textarea {
          border: 1px solid #f97316 !important;
          animation: pulse-orange 2s infinite ease-in-out;
        }
        .onboarding-highlight-vars label {
          color: #f97316 !important;
        }
      `}</style>

      {/* Titlebar */}
      <div className="deployment-titlebar">
        <div className="logo"><Zap size={14} fill="currentColor" /> Pre-Deployment</div>
        <div className="controls">
          <button onClick={minimizeWindow} className="control-btn"><Minus size={14} /></button>
          <button onClick={onClose} className="control-btn close-btn"><X size={14} /></button>
        </div>
      </div>

      {/* Header */}
      <div className="deployment-header">
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#818cf8' }}>{t.prompts?.preDeployment || 'Pre-Deployment'}</span>
        <span style={{ color: '#52525b', fontWeight: 600 }}>:</span>
        <span style={{ fontSize: '16px', color: '#e4e4e7', fontWeight: 500 }}>{prompt.title}</span>
      </div>

      {/* Body */}
      <div className="deployment-body">
        {/* Left: Variables and Structure */}
        <div style={{ flex: 1, minWidth: '350px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          
          {/* Onboarding Instruction Box */}
          {isOnboarding && (
            <div style={{
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              border: '2px solid #f97316',
              borderRadius: '8px',
              padding: '14px 18px',
              flexShrink: 0,
              marginBottom: '4px'
            }}>
              <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>
                <strong style={{ color: '#f97316', display: 'block', fontSize: '15px', marginBottom: '4px' }}>
                  Variable Prompts
                </strong>
                Fill in the variable values below, then click <strong>Deploy</strong> to use your prompt.
                <span style={{ display: 'block', marginTop: '8px', color: '#fdba74', fontSize: '12px' }}>
                  Tip: Hold <strong>Ctrl</strong> to auto-paste or <strong>Ctrl+Alt</strong> to auto-send directly to your active window.
                </span>
              </div>
            </div>
          )}

          <div className={isOnboarding ? "onboarding-highlight-vars" : ""}>
            {hasVariables && (
              <VariableList 
                prompt={prompt}
                vars={logic.vars}
                variableValues={logic.variableValues}
                hoveredVariable={logic.hoveredVariable}
                setHoveredVariable={logic.setHoveredVariable}
                onVariableChange={logic.handleVariableChange}
              />
            )}
          </div>
          
          <AddonList 
            items={logic.structureItems}
            promptTitle={prompt.title}
            hoveredIndex={highlightIndex}
            draggedIndex={logic.draggedIndex}
            editingIndex={logic.editingIndex}
            editValue={logic.editValue}
            setHoveredIndex={logic.setHoveredItemIndex}
            onRemove={logic.handleRemoveItem}
            onStartEdit={(idx, txt) => logic.startEditingItem(idx, txt, 'list')}
            onSave={logic.saveItem}
            onEditChange={logic.setEditValue}
            onCancelEdit={() => { logic.setEditingIndex(null); logic.setEditValue(''); }}
            onDragStart={logic.handleDragStart}
            onDragEnd={logic.handleDragEnd}
            onDragOver={logic.handleDragOver}
            onToggleMenu={logic.toggleMenu}
            menuBtnRef={menuBtnRef}
            editSource={logic.editSource}
          />
        </div>

        {/* Divider */}
        <div 
          ref={logic.dividerRef}
          onMouseDown={logic.handleResizeStart}
          style={{ 
            width: '10px', cursor: 'col-resize', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', flexShrink: 0, zIndex: 10 
          }}
        >
          <div style={{ width: '1px', height: '100%', background: '#3f3f46' }} />
          <div style={{ position: 'absolute', width: '4px', height: '40px', background: '#52525b', borderRadius: '2px' }} />
        </div>

        {/* Right: Preview */}
        <div style={{ width: `${logic.previewWidth}px`, padding: '16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <PromptPreview 
            content={effectiveBaseContent}
            components={[]}
            highlightSettings={highlightSettings}
            variableValues={logic.variableValues}
            structureItems={logic.structureItems}
            getTypeColor={() => '#6b7280'}
            hoveredVariable={logic.hoveredVariable}
            hoveredItemIndex={highlightIndex}
            setHoveredItemIndex={logic.setHoveredItemIndex}
            onCopy={async () => { 
              await navigator.clipboard.writeText(getFinalContent()); 
              logic.setHeaderCopied(true); 
              setTimeout(() => logic.setHeaderCopied(false), 2000); 
            }}
            headerCopied={logic.headerCopied}
            editingIndex={logic.editingIndex}
            editValue={logic.editValue}
            onEditChange={logic.setEditValue}
            onSave={logic.saveItem}
            onCancelEdit={() => { logic.setEditingIndex(null); logic.setEditValue(''); }}
            onStartEdit={(idx, txt) => logic.startEditingItem(idx, txt, 'preview')}
            editSource={logic.editSource}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="deployment-footer">
        <button className="deployment-cancel-btn" onClick={onClose}>
          {t.common?.cancel || 'Cancel'}
        </button>
        
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => { if (!allFilled) setShowDeployWarning(true); setIsDeployHovered(true); }}
          onMouseLeave={() => { setShowDeployWarning(false); setIsDeployHovered(false); }}
        >
          <button 
            onClick={handleConfirm}
            disabled={!allFilled}
            style={getDeployButtonStyle()}
          >
            Deploy: {getDeployActionLabel().label}
          </button>

          {showDeployWarning && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              right: 0,
              backgroundColor: '#27272a',
              border: '1px solid #eab308',
              color: '#eab308',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              zIndex: 50,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}>
              {t.prompts?.warningVariables || 'Fill in all variables first'}
            </div>
          )}
        </div>
      </div>

      {/* Injection Menu Portal */}
      {logic.showMenu && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }} 
          onClick={() => logic.setShowMenu(false)}
        >
          <div 
            style={{ 
              position: 'fixed', 
              top: logic.menuPosition.y, 
              left: logic.menuPosition.x 
            }}
            onClick={e => e.stopPropagation()}
          >
            <InjectionMenu 
              categories={categories}
              onInject={logic.handleInjectAddon}
              onSaveCategories={setCategories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Export wrapped with providers
export function DeploymentWindow() {
  return (
    <LanguageProvider>
      <TrashProvider>
        <DeploymentWindowContent />
      </TrashProvider>
    </LanguageProvider>
  );
}

export default DeploymentWindow;
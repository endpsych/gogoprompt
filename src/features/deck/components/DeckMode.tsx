/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Zap, Minus, X, MousePointerClick } from 'lucide-react';
import { Prompt, PromptComponent, PromptSortOrder, PromptUsageRecord } from '@/types';
import { HighlightSettings } from '@/shared/utils/highlighting';
import { minimizeWindow, closeWindow, minimizeAndPaste, openStudioWindow, openDeploymentWindow } from '@/shared/utils/storage/electron';
import { hasVariables } from '@/features/variables/components/VariableFiller';
import { useLanguage } from '@/shared/hooks';
import { savePromptUsage } from '@/features/history/utils/history';
import { useVariableStore, useUIStore, useSettingsStore } from '@/stores'; 
import { checkModifierHotkey } from '@/features/settings/components/HotkeysPanel';

import { DeckCard } from '@/features/deck/components/DeckCard';
import { DeckToolbar } from '@/features/deck/components/DeckToolbar';
import { DeckFooter } from '@/features/deck/components/DeckFooter';

import { useDeckData } from '@/features/deck/hooks/useDeckData';
import { useOnboarding } from '@/features/deck/hooks/useOnboarding';
import { DeckOnboardingUI, getOnboardingCardStyles } from '@/features/deck/components/DeckOnboardingUI';
import { DeckModals } from '@/features/deck/components/DeckModals';

interface DeckModeProps {
  prompts: Prompt[];
  components: PromptComponent[];
  highlightSettings: HighlightSettings;
  getTypeColor: (typeId: string) => string;
  getTagColor: (tag: string) => string;
  allTags: string[];
  onSwitchToStudio: () => void;
  onOpenSettings: () => void;
  cardMaxLines: number;
  onIncrementUseCount: (id: string) => void;
  onReorder?: (dragId: string, dropId: string) => void;
  sortOrder?: PromptSortOrder; 
  onSortOrderChange?: (order: PromptSortOrder) => void; 
  onDeletePrompt?: (id: string) => void;
  onSavePrompt?: (title: string, content: string, tags: string[], profileIds: string[]) => void; 
}

export function DeckMode(props: DeckModeProps) {
  const { t } = useLanguage();
  
  // 1. Data & Filter Logic
  const deckData = useDeckData(props.prompts, props.onReorder);
  
  // 2. Onboarding Logic
  const onboarding = useOnboarding(deckData.filteredPrompts);

  // 3. UI State (Local)
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modals State
  const [variablePrompt, setVariablePrompt] = useState<Prompt | null>(null);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [miniModalAnchor, setMiniModalAnchor] = useState<DOMRect | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [showCreateVarModal, setShowCreateVarModal] = useState(false);
  const [newlyCreatedVar, setNewlyCreatedVar] = useState<string | null>(null);
  
  // History State
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);
  const [restoreValues, setRestoreValues] = useState<Record<string, string> | undefined>(undefined);
  const [restoreInstructions, setRestoreInstructions] = useState<string>('');

  // Modifier Keys Tracking
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);

  const { addVariable } = useVariableStore();

  // --- Keyboard & Focus Handlers ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlHeld(true);
      if (e.key === 'Alt') setIsAltHeld(true);
      
      // Escape Handling
      if (e.key === 'Escape') {
         if (historyTargetId) { setHistoryTargetId(null); return; }
         if (variablePrompt) {
             setVariablePrompt(null);
             setRestoreValues(undefined);
             setIsMiniMode(false);
             return;
         }
         if (showCreateModal) { setShowCreateModal(false); return; }
         if (deckData.search) { deckData.setSearch(''); return; }
         closeWindow(); 
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsCtrlHeld(false);
      if (e.key === 'Alt') setIsAltHeld(false);
    };
    const handleBlur = () => { setIsCtrlHeld(false); setIsAltHeld(false); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [historyTargetId, variablePrompt, showCreateModal, deckData.search]);

  // --- External Deployment Listener ---

  useEffect(() => {
    if ((window as any).electronAPI?.onDeploymentComplete) {
      const cleanup = (window as any).electronAPI.onDeploymentComplete((type: string) => {
        // If we are waiting at Step 4, advance automatically when external window finishes
        if (onboarding.step === 4 && onboarding.isActive) {
           onboarding.advance('variable-deployed');
        }
      });
      return cleanup;
    }
  }, [onboarding.step, onboarding.isActive]);


  // --- Action Handlers ---

  const handleCopyChain = async (content: string, promptId: string, shouldAutoPaste = false, shouldAutoEnter = false) => {
     // Enforce Onboarding Constraints
     if (onboarding.showPostSummonHint && !onboarding.showContinue) {
        if (onboarding.step === 1 && (shouldAutoPaste || shouldAutoEnter)) {
            onboarding.showWarningToast('Step 1: Use a regular click without modifiers');
            return;
        }
        if (onboarding.step === 2 && (!shouldAutoPaste || shouldAutoEnter)) {
            onboarding.showWarningToast('Step 2: Hold Ctrl and click (not Ctrl+Alt)');
            return;
        }
        if (onboarding.step === 3 && !shouldAutoEnter) {
            onboarding.showWarningToast('Step 3: Hold Ctrl+Alt and click');
            return;
        }
     }

     try {
       await navigator.clipboard.writeText(content);
       
       if (shouldAutoEnter) onboarding.advance('autosend');
       else if (shouldAutoPaste) onboarding.advance('autopaste');
       else onboarding.advance('copy');

       setCopiedId(promptId);
       props.onIncrementUseCount(promptId);
       
       if (shouldAutoPaste || shouldAutoEnter) {
         setTimeout(() => { 
           minimizeAndPaste(shouldAutoEnter); 
           setCopiedId(null); 
         }, 100);
       } else {
         setTimeout(() => setCopiedId(null), 1500);
       }
     } catch (err) { console.error(err); }
  };

  const handleCardClick = (prompt: Prompt, e?: React.MouseEvent) => {
    const promptHasVars = hasVariables(prompt.content);

    // Variable Prompt Logic
    if (promptHasVars) {
      // Step 3 Onboarding Logic: Just continue if they happen to click a variable prompt
      if (onboarding.step === 3 && onboarding.isActive) {
          openDeploymentWindow(prompt.id);
          onboarding.advance('continue');
          return;
      }

      // Step 4 Onboarding Logic (Variable Prompts - The Focus)
      if (onboarding.isActive && onboarding.step === 4) {
         if (e && (e.ctrlKey || e.altKey || e.shiftKey)) {
             onboarding.showWarningToast('Step 4: Use a regular click without modifiers');
             return;
         }
         
         // Arguments: (promptId, initialValues, isOnboarding)
         openDeploymentWindow(prompt.id, undefined, true);
         
         // We do NOT call onboarding.advance() here.
         // We wait for 'onDeploymentComplete' event from the useEffect above.
         return;
      }
      
      // Step 5 Onboarding Logic (Quick Fill)
      if (onboarding.isActive && onboarding.step === 5) {
         if (e && !checkModifierHotkey('quick-deploy', e)) {
             onboarding.showWarningToast('Step 5: Hold Shift and click, or use the ⚡ button');
             return;
         }
      }

      if (e && checkModifierHotkey('quick-deploy', e)) {
         // Quick Deploy (Internal Mini Modal)
         const target = (e.currentTarget as HTMLElement);
         if (target) setMiniModalAnchor(target.getBoundingClientRect());
         setVariablePrompt(prompt);
         setRestoreValues(undefined);
         setIsMiniMode(true);
      } else {
         // Standard Open
         if (onboarding.isActive && onboarding.step === 5) {
             const target = (e?.currentTarget as HTMLElement);
             if (target) setMiniModalAnchor(target.getBoundingClientRect());
             setVariablePrompt(prompt);
             setIsMiniMode(true);
         } else {
             // Standard behavior: Open external window
             openDeploymentWindow(prompt.id);
         }
      }
      return;
    }

    // Standard Prompt Logic
    const shouldAutoPaste = e ? checkModifierHotkey('auto-paste', e) : false;
    const shouldAutoEnter = e ? checkModifierHotkey('auto-enter', e) : false;
    handleCopyChain(prompt.content, prompt.id, shouldAutoPaste, shouldAutoEnter);
    
    savePromptUsage({
      promptId: prompt.id,
      usageMode: 'standard',
      promptSnapshot: { title: prompt.title, content: prompt.content },
      inputs: {},
      finalOutput: prompt.content
    });
  };

  // Helper for quick actions (lightning button)
  const handleQuickDeploy = (prompt: Prompt, e: React.MouseEvent) => {
     const target = e.currentTarget as HTMLElement;
     const card = target.closest('.deck-mode-card') || target;
     if (card) setMiniModalAnchor(card.getBoundingClientRect());
     setVariablePrompt(prompt);
     setIsMiniMode(true);
  };

  const handleSaveNewVariable = (data: any) => {
      const newVar = { ...data, id: Date.now().toString() };
      addVariable(newVar);
      setShowCreateVarModal(false);
      setNewlyCreatedVar(data.key);
  };

  // Deployment Confirm Handlers
  const handleVariableConfirm = (finalContent: string, values: any, instructions: any[], usedTemplate: string, e?: React.MouseEvent) => {
      if (!variablePrompt) return;
      const shouldAutoPaste = e ? checkModifierHotkey('auto-paste', e) : false;
      const shouldAutoEnter = e ? checkModifierHotkey('auto-enter', e) : false;
      
      // Fallback safety for onboarding
      if (onboarding.step === 4) onboarding.advance('variable-deployed');

      handleCopyChain(finalContent, variablePrompt.id, shouldAutoPaste, shouldAutoEnter);
      
      savePromptUsage({
          promptId: variablePrompt.id,
          usageMode: 'variable_fill',
          promptSnapshot: { title: variablePrompt.title, content: usedTemplate },
          inputs: { variables: values, customInstructions: instructions.map(i=>i.text).join('\n'), components: instructions },
          finalOutput: finalContent
      });
      setVariablePrompt(null);
  };

  const handleMiniConfirm = (finalContent: string, values: any, e?: React.MouseEvent) => {
      if (!variablePrompt) return;
      const shouldAutoPaste = e ? checkModifierHotkey('auto-paste', e) : false;
      const shouldAutoEnter = e ? checkModifierHotkey('auto-enter', e) : false;
      
      if (onboarding.step === 5) onboarding.advance('quickdeploy-done');

      handleCopyChain(finalContent, variablePrompt.id, shouldAutoPaste, shouldAutoEnter);
      
      savePromptUsage({
          promptId: variablePrompt.id,
          usageMode: 'variable_fill',
          promptSnapshot: { title: variablePrompt.title, content: variablePrompt.content },
          inputs: { variables: values, customInstructions: '', components: [] },
          finalOutput: finalContent
      });
      setVariablePrompt(null);
      setIsMiniMode(false);
  };

  return (
    <div className="deck-mode">
      {/* Onboarding Visuals */}
      <DeckOnboardingUI 
         step={onboarding.step}
         showContinue={onboarding.showContinue}
         warning={onboarding.warning}
         onAdvance={onboarding.advance}
         isActive={onboarding.isActive}
      />

      {/* Titlebar */}
      <div className="deck-mode-titlebar">
        <div className="deck-mode-logo"><Zap size={14} fill="currentColor" /> GoGoPrompt</div>
        <div className="deck-mode-controls">
          <button onClick={minimizeWindow} className="control-btn minimize-btn"><Minus size={14} /></button>
          <button onClick={closeWindow} className="control-btn close-btn"><X size={14} /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ position: 'relative', zIndex: 20 }}>
        <DeckToolbar 
           onSwitchToStudio={props.onSwitchToStudio}
           onOpenCreateModal={() => setShowCreateModal(true)}
           onOpenSettings={props.onOpenSettings}
           showCreateButton={!!props.onSavePrompt}
           allTags={props.allTags}
           activeTagFilters={deckData.activeTagFilters}
           setActiveTagFilters={deckData.setActiveTagFilters}
           filterMode={deckData.filterMode}
           setFilterMode={deckData.setFilterMode}
           getTagColor={props.getTagColor}
           sortOrder={deckData.sortOrder}
           onSortOrderChange={deckData.setSortOrder}
           search={deckData.search}
           setSearch={deckData.setSearch}
           viewMode={deckData.deckViewMode}
           onViewModeChange={deckData.setDeckViewMode}
        />
      </div>

      {/* List */}
      <div className={`deck-mode-list ${deckData.deckViewMode === 'grid-3' ? 'grid-view-3' : deckData.deckViewMode === 'grid-2' ? 'grid-view-2' : ''}`}>
        {deckData.filteredPrompts.map((prompt, index) => {
            const rawCustomOrder = (prompt as any).customOrder || 0;
            const displayNumber = deckData.search ? rawCustomOrder : rawCustomOrder + 1;
            
            const styleProps = getOnboardingCardStyles(index, onboarding.step, onboarding.isActive, onboarding.showContinue);
            
            const Card = (
                <DeckCard
                    key={prompt.id}
                    index={index}
                    prompt={prompt}
                    displayNumber={displayNumber}
                    components={props.components}
                    highlightSettings={props.highlightSettings}
                    getTypeColor={props.getTypeColor}
                    getTagColor={props.getTagColor}
                    cardMaxLines={props.cardMaxLines}
                    copiedId={copiedId}
                    isDragging={deckData.dragState.draggedId === prompt.id}
                    isDragOver={deckData.dragState.dragOverId === prompt.id}
                    dropPosition={deckData.dragState.dropPosition}
                    dragHandlers={deckData.dragHandlers}
                    onCardClick={handleCardClick}
                    onTextInsert={(p, e) => handleCopyChain(p.content + ' ' + navigator.clipboard.readText(), p.id, false, false)} 
                    onOpenDeployment={() => {
                        if (onboarding.isActive && onboarding.step !== 4) { setVariablePrompt(prompt); setIsMiniMode(false); }
                        else openDeploymentWindow(prompt.id);
                    }}
                    onQuickDeploy={(e) => handleQuickDeploy(prompt, e)}
                    onShowHistory={(id) => setHistoryTargetId(id)}
                    t={t}
                    onDelete={() => props.onDeletePrompt?.(prompt.id)}
                    onSave={props.onSavePrompt ? (t, c, tags) => props.onSavePrompt!(t, c, tags, []) : undefined}
                    highlightInsertBtn={false}
                    highlightQuickDeployBtn={styleProps.highlightQuickDeployBtn}
                    isCtrlHeld={isCtrlHeld}
                    isAltHeld={isAltHeld}
                    disableExtraButtons={styleProps.isDisabled && !styleProps.highlightQuickDeployBtn}
                />
            );

            if (styleProps.wrapperClass) {
                return (
                    <div key={prompt.id} className={styleProps.wrapperClass}>
                        {Card}
                        <div className={styleProps.messageBoxClass}>
                           <MousePointerClick size={16} fill="currentColor" />
                           {styleProps.messageText}
                        </div>
                    </div>
                );
            }

            if (styleProps.isDisabled) {
                return <div key={prompt.id} className="deck-card-disabled">{Card}</div>;
            }

            return Card;
        })}
        
        {deckData.filteredPrompts.length === 0 && (
             <div className="deck-mode-empty">
                 {deckData.search || deckData.activeTagFilters.length > 0 
                    ? t.templateGallery.noResults.replace('{query}', deckData.search) 
                    : t.prompts.noPrompts}
             </div>
        )}
      </div>

      <DeckFooter />

      {/* Modals Container */}
      <DeckModals 
         historyTargetId={historyTargetId}
         setHistoryTargetId={setHistoryTargetId}
         onRestoreHistory={(rec) => { /* logic */ }} // Simplified
         
         variablePrompt={variablePrompt}
         setVariablePrompt={setVariablePrompt}
         isMiniMode={isMiniMode}
         setIsMiniMode={setIsMiniMode}
         miniModalAnchor={miniModalAnchor}
         setMiniModalAnchor={setMiniModalAnchor}
         restoreValues={restoreValues}
         setRestoreValues={setRestoreValues}
         restoreInstructions={restoreInstructions}
         setRestoreInstructions={setRestoreInstructions}
         
         onConfirmDeployment={handleVariableConfirm}
         onConfirmMini={handleMiniConfirm}
         
         showCreateModal={showCreateModal}
         setShowCreateModal={setShowCreateModal}
         onSavePrompt={props.onSavePrompt}
         
         showCreateVarModal={showCreateVarModal}
         setShowCreateVarModal={setShowCreateVarModal}
         onSaveNewVariable={handleSaveNewVariable}
         newlyCreatedVar={newlyCreatedVar}
         setNewlyCreatedVar={setNewlyCreatedVar}
         
         components={props.components}
         highlightSettings={props.highlightSettings}
         getTypeColor={props.getTypeColor}
         getTagColor={props.getTagColor}
         allTags={props.allTags}
         
         showPostSummonHint={onboarding.showPostSummonHint}
         onboardingStep={onboarding.step}
      />
    </div>
  );
}
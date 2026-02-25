import React from 'react';
import { Prompt, PromptComponent } from '@/types';
import { HighlightSettings } from '@/shared/utils/highlighting';
import { HistoryPanel } from '@/features/history/components/HistoryPanel';
import { MiniVariableModal } from '@/features/deck/components/QuickDeployModal';
import { CreatePromptModal } from '@/features/deck/components/CreatePromptModal';
import { VariableModal as CreateVariableModal } from '@/features/variables/components/VariableModal';

// import { VariableModal as PromptDeploymentModal } from '@/features/deck/components/DeploymentModal';

interface DeckModalsProps {
  // History
  historyTargetId: string | null;
  setHistoryTargetId: (id: string | null) => void;
  onRestoreHistory: (record: any) => void;

  // Deployment
  variablePrompt: Prompt | null;
  setVariablePrompt: (p: Prompt | null) => void;
  isMiniMode: boolean;
  setIsMiniMode: (v: boolean) => void;
  miniModalAnchor: DOMRect | null;
  setMiniModalAnchor: (rect: DOMRect | null) => void;
  restoreValues: Record<string, string> | undefined;
  setRestoreValues: (v: any) => void;
  restoreInstructions: any;
  setRestoreInstructions: (v: any) => void;
  
  // Deployment Handlers
  onConfirmDeployment: (content: string, vars: any, inst: any[], temp: string, e?: React.MouseEvent) => void;
  onConfirmMini: (content: string, vars: any, e?: React.MouseEvent) => void;
  
  // Create Prompt
  showCreateModal: boolean;
  setShowCreateModal: (v: boolean) => void;
  onSavePrompt?: (title: string, content: string, tags: string[], profileIds: string[]) => void;
  
  // Create Variable
  showCreateVarModal: boolean;
  setShowCreateVarModal: (v: boolean) => void;
  onSaveNewVariable: (data: any) => void;
  newlyCreatedVar: string | null;
  setNewlyCreatedVar: (key: string | null) => void;
  
  // Shared Data
  components: PromptComponent[];
  highlightSettings: HighlightSettings;
  getTypeColor: (id: string) => string;
  getTagColor: (tag: string) => string;
  allTags: string[];
  
  // Context
  showPostSummonHint: boolean;
  onboardingStep: number;
}

export function DeckModals(props: DeckModalsProps) {
  return (
    <>
      {props.historyTargetId && (
        <HistoryPanel 
            filterPromptId={props.historyTargetId}
            onClose={() => props.setHistoryTargetId(null)}
            onRestore={props.onRestoreHistory}
        />
      )}

      {/* Mini Modal (Quick Fill - Step 5) */}
      {props.variablePrompt && props.isMiniMode && (
        <MiniVariableModal 
          prompt={props.variablePrompt}
          anchorRect={props.miniModalAnchor}
          onClose={() => {
            props.setVariablePrompt(null);
            props.setRestoreValues(undefined);
            props.setIsMiniMode(false);
            props.setMiniModalAnchor(null);
          }}
          onConfirm={props.onConfirmMini}
          initialValues={props.restoreValues}
          isOnboarding={props.onboardingStep === 5 && props.showPostSummonHint}
        />
      )}

      {props.showCreateModal && props.onSavePrompt && (
          <CreatePromptModal 
             onClose={() => { props.setShowCreateModal(false); props.setNewlyCreatedVar(null); }}
             onSave={(t, c, tags, profileIds) => props.onSavePrompt!(t, c, tags, profileIds)}
             getTagColor={props.getTagColor}
             onCreateNewVariable={() => props.setShowCreateVarModal(true)}
             pendingVariable={props.newlyCreatedVar}
             onClearPendingVariable={() => props.setNewlyCreatedVar(null)}
             allTags={props.allTags}
          />
      )}

      <CreateVariableModal
          isOpen={props.showCreateVarModal}
          onClose={() => props.setShowCreateVarModal(false)}
          onSave={props.onSaveNewVariable}
          initialData={undefined}
          initialFocus="name"
      />
    </>
  );
}
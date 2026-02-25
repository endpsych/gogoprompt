import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { Prompt } from '@/types';

export function useOnboarding(filteredPrompts: Prompt[]) {
  const { showPostSummonHint, setShowPostSummonHint } = useUIStore();
  
  // Steps: 1=Copy, 2=AutoPaste, 3=AutoSend, 4=VariablePrompt, 5=QuickDeploy
  const [step, setStep] = useState(1);
  const [showContinue, setShowContinue] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Reset logic when the tutorial mode is toggled via Store
  useEffect(() => {
    if (showPostSummonHint) {
      setStep(1);
      setShowContinue(false);
      setWarning(null);
    }
  }, [showPostSummonHint]);

  const showWarningToast = (message: string) => {
    setWarning(message);
    setTimeout(() => setWarning(null), 2500);
  };

  const advance = (action: 'copy' | 'autopaste' | 'autosend' | 'variable-deployed' | 'quickdeploy-done' | 'continue') => {
    if (!showPostSummonHint) return;

    // Step 1: Copy -> Continue
    if (step === 1 && action === 'copy') {
      setShowContinue(true);
    }
    else if (step === 1 && action === 'continue') {
      setShowContinue(false);
      setStep(2);
    }
    // Step 2: AutoPaste -> Continue
    else if (step === 2 && action === 'autopaste') {
      setShowContinue(true);
    }
    else if (step === 2 && action === 'continue') {
      setShowContinue(false);
      setStep(3);
    }
    // Step 3: AutoSend -> Continue
    else if (step === 3 && action === 'autosend') {
      setShowContinue(true);
    }
    else if (step === 3 && action === 'continue') {
      setShowContinue(false);
      // Skip to 4 only if there are enough prompts, otherwise end
      if (filteredPrompts.length > 1) {
        setStep(4);
      } else {
        setShowPostSummonHint(false);
      }
    }
    // Step 4: Variable Deployed -> Continue
    else if (step === 4 && action === 'variable-deployed') {
      setShowContinue(true);
    }
    else if (step === 4 && action === 'continue') {
      setShowContinue(false);
      setStep(5);
    }
    // Step 5: Quick Deploy Done -> Continue
    else if (step === 5 && action === 'quickdeploy-done') {
      setShowContinue(true);
    }
    else if (step === 5 && action === 'continue') {
      setShowPostSummonHint(false);
    }
  };

  const isActive = showPostSummonHint && filteredPrompts.length > 0;

  return {
    step,
    showContinue,
    warning,
    showWarningToast,
    advance,
    isActive,
    showPostSummonHint
  };
}
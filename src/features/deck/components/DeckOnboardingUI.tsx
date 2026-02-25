import React from 'react';

interface DeckOnboardingUIProps {
  step: number;
  showContinue: boolean;
  warning: string | null;
  onAdvance: (action: 'continue') => void;
  isActive: boolean;
}

export function DeckOnboardingUI({ step, showContinue, warning, onAdvance, isActive }: DeckOnboardingUIProps) {
  if (!isActive && !warning) return null;

  return (
    <>
      <style>{`
        /* PURPLE PULSE (STEP 1 - Copy) */
        @keyframes purpleBorderPulse {
          0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.6); border-color: rgba(168, 85, 247, 0.8); }
          70% { box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); border-color: rgba(168, 85, 247, 0); }
          100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); border-color: rgba(168, 85, 247, 0.8); }
        }
        
        /* AMBER PULSE (STEP 2 - Auto-Paste) */
        @keyframes amberBorderPulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); border-color: rgba(245, 158, 11, 0.8); }
          70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); border-color: rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); border-color: rgba(245, 158, 11, 0.8); }
        }
        
        /* TEAL PULSE (STEP 3 - Auto-Send) */
        @keyframes tealBorderPulse {
          0% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.6); border-color: rgba(20, 184, 166, 0.8); }
          70% { box-shadow: 0 0 0 10px rgba(20, 184, 166, 0); border-color: rgba(20, 184, 166, 0); }
          100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); border-color: rgba(20, 184, 166, 0.8); }
        }
        
        /* ORANGE PULSE (STEP 4 - Variable Prompts) */
        @keyframes orangeBorderPulse {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.6); border-color: rgba(249, 115, 22, 0.8); }
          70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); border-color: rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); border-color: rgba(249, 115, 22, 0.8); }
        }
        
        /* PINK PULSE (STEP 5 - Quick Deploy) */
        @keyframes pinkBorderPulse {
          0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.6); border-color: rgba(236, 72, 153, 0.8); }
          70% { box-shadow: 0 0 0 10px rgba(236, 72, 153, 0); border-color: rgba(236, 72, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); border-color: rgba(236, 72, 153, 0.8); }
        }
        
        .hint-wrapper, .hint-wrapper-amber, .hint-wrapper-teal, .hint-wrapper-orange, .hint-wrapper-pink {
          position: relative;
          border-radius: 12px;
          margin-bottom: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
        }

        .hint-wrapper::after {
          content: ''; position: absolute; inset: -4px; border: 2px solid #a855f7; border-radius: 16px;
          animation: purpleBorderPulse 2s infinite; pointer-events: none; z-index: 10;
        }

        .hint-wrapper-amber::after {
          content: ''; position: absolute; inset: -4px; border: 2px solid #f59e0b; border-radius: 16px;
          animation: amberBorderPulse 2s infinite; pointer-events: none; z-index: 10;
        }

        .hint-wrapper-teal::after {
          content: ''; position: absolute; inset: -4px; border: 2px solid #14b8a6; border-radius: 16px;
          animation: tealBorderPulse 2s infinite; pointer-events: none; z-index: 10;
        }

        .hint-wrapper-orange::after {
          content: ''; position: absolute; inset: -4px; border: 2px solid #f97316; border-radius: 16px;
          animation: orangeBorderPulse 2s infinite; pointer-events: none; z-index: 10;
        }

        .hint-wrapper-pink::after {
          content: ''; position: absolute; inset: -4px; border: 2px solid #ec4899; border-radius: 16px;
          animation: pinkBorderPulse 2s infinite; pointer-events: none; z-index: 10;
        }

        /* Common Message Box */
        .hint-message-box, .hint-message-box-amber, .hint-message-box-teal, .hint-message-box-orange, .hint-message-box-pink {
          position: absolute;
          bottom: -45px; 
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          animation: fadeInUp 0.3s ease-out;
          pointer-events: none;
          color: white;
        }

        .hint-message-box { background-color: #a855f7; }
        .hint-message-box::after {
          content: ''; position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
          border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #a855f7; 
        }

        .hint-message-box-amber { background-color: #f59e0b; color: #18181b; }
        .hint-message-box-amber::after {
          content: ''; position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
          border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #f59e0b; 
        }

        .hint-message-box-teal { background-color: #14b8a6; }
        .hint-message-box-teal::after {
          content: ''; position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
          border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #14b8a6; 
        }

        .hint-message-box-orange { background-color: #f97316; }
        .hint-message-box-orange::after {
          content: ''; position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
          border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #f97316; 
        }

        .hint-message-box-pink { background-color: #ec4899; }
        .hint-message-box-pink::after {
          content: ''; position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
          border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 6px solid #ec4899; 
        }
        
        /* Onboarding Warning Toast */
        .onboarding-warning-toast {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #27272a;
          border: 1px solid #ef4444;
          color: #fca5a5;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          z-index: 9999;
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
          animation: toastSlideIn 0.3s ease-out;
        }
        
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        /* Continue button for onboarding */
        .onboarding-continue-overlay {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          animation: fadeInUp 0.3s ease-out;
        }
        
        .onboarding-success-message {
          background: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 12px;
          padding: 16px 24px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        
        .onboarding-continue-btn {
          padding: 10px 24px;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        
        .onboarding-continue-btn:hover {
          transform: scale(1.05);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {warning && (
        <div className="onboarding-warning-toast">
          ⚠️ {warning}
        </div>
      )}

      {showContinue && (
        <div className="onboarding-continue-overlay">
          <div className="onboarding-success-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {step === 1 && (
              <>
                <div style={{ fontSize: '14px', color: '#a855f7', fontWeight: 700, marginBottom: '8px' }}>
                  ✓ Prompt copied to clipboard!
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '12px', textAlign: 'center' }}>
                  Check the Clipboard Monitor at the bottom to see the copied content.
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 700, marginBottom: '8px' }}>
                  ✓ Auto-paste successful!
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '12px', textAlign: 'center' }}>
                  The prompt was pasted into your AI chat or text-based app.
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div style={{ fontSize: '14px', color: '#14b8a6', fontWeight: 700, marginBottom: '8px' }}>
                  ✓ Auto-send successful!
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '12px', textAlign: 'center' }}>
                  The prompt was pasted and sent to your AI chat or text-based app.
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <div style={{ fontSize: '14px', color: '#f97316', fontWeight: 700, marginBottom: '8px' }}>
                  ✓ Variable prompt deployed!
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '12px', textAlign: 'center' }}>
                  Great! Now let's try the Quick Fill feature for faster deployment.
                </div>
              </>
            )}
            {step === 5 && (
              <>
                <div style={{ fontSize: '14px', color: '#ec4899', fontWeight: 700, marginBottom: '8px' }}>
                  🎉 Onboarding Complete!
                </div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '12px', lineHeight: 1.5, textAlign: 'center' }}>
                  You've mastered all deployment methods.<br/>
                  Check the <strong style={{ color: '#f4f4f5' }}>instructions.md</strong> file for more features and tips.
                </div>
              </>
            )}
            <button 
              className="onboarding-continue-btn"
              style={{ 
                backgroundColor: step === 1 ? '#a855f7' : 
                                 step === 2 ? '#f59e0b' : 
                                 step === 3 ? '#14b8a6' : 
                                 step === 4 ? '#f97316' : '#ec4899',
                color: step === 2 ? '#18181b' : 'white'
              }}
              onClick={() => onAdvance('continue')}
            >
              {step === 3 ? 'Continue to Variable Prompts' : 
               step === 4 ? 'Continue to Quick Fill' :
               step === 5 ? 'Finish Onboarding' : 'Continue to Next Step'}
              <span style={{ fontSize: '16px' }}>{step === 5 ? '✓' : '→'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Helper to determine card styling
export function getOnboardingCardStyles(index: number, step: number, isActive: boolean, showContinue: boolean) {
    if (!isActive || showContinue) return { wrapperClass: '', messageText: '', messageBoxClass: '', isDisabled: showContinue, highlightQuickDeployBtn: false };

    if (step === 1 && index === 0) {
      return { 
        wrapperClass: 'hint-wrapper', 
        messageBoxClass: 'hint-message-box', 
        messageText: 'Click the prompt to copy it to your clipboard', 
        isDisabled: false, 
        highlightQuickDeployBtn: false 
      };
    }
    if (step === 2 && index === 0) {
      return { 
        wrapperClass: 'hint-wrapper-amber', 
        messageBoxClass: 'hint-message-box-amber', 
        messageText: 'Open your AI chat, place cursor in the input, summon GoGoPrompt (Alt+E), then Ctrl+Click here', 
        isDisabled: false, 
        highlightQuickDeployBtn: false 
      };
    }
    if (step === 3 && index === 0) {
      return { 
        wrapperClass: 'hint-wrapper-teal', 
        messageBoxClass: 'hint-message-box-teal', 
        messageText: 'Now try Ctrl+Alt+Click to auto-send the prompt directly', 
        isDisabled: false, 
        highlightQuickDeployBtn: false 
      };
    }
    // Note: Step 4 and 5 target index 1 (the variable prompt)
    if (step === 4 && index === 1) {
      return { 
        wrapperClass: 'hint-wrapper-orange', 
        messageBoxClass: 'hint-message-box-orange', 
        messageText: '✨ Variable prompt — click to open Pre-Deployment and define variables', 
        isDisabled: false, 
        highlightQuickDeployBtn: false 
      };
    }
    if (step === 5 && index === 1) {
      return { 
        wrapperClass: 'hint-wrapper-pink', 
        messageBoxClass: 'hint-message-box-pink', 
        messageText: 'Click the ⚡ button or Shift+Click for Quick Fill — then deploy with modifiers', 
        isDisabled: false, 
        highlightQuickDeployBtn: true 
      };
    }
    
    // Default disabled for non-active cards during tutorial
    return { wrapperClass: '', messageText: '', messageBoxClass: '', isDisabled: true, highlightQuickDeployBtn: false };
}
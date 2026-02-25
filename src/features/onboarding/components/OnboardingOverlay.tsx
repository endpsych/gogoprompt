import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, ChevronRight, Command, AlertTriangle, Keyboard, CheckCircle2, 
  Globe, ChevronDown, Rocket, MousePointer, Copy, Send, Settings
} from 'lucide-react';
import { useLanguage } from '@/shared/hooks';
import { useProfileStore } from '@/stores/profileStore';

interface OnboardingOverlayProps {
  onComplete: (hotkey: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'gl', label: 'Galego' },
  { code: 'eu', label: 'Euskara' },
  { code: 'ca', label: 'Català' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
];

const ONBOARDING_TEXTS: Record<string, any> = {
  en: {
    languageTitle: "Select Language",
    languageSub: "choose your preferred language to get started.",
    please: "Please",
    continue: "Continue",
    finish: "Finish Setup",
    skip: "Skip",
    welcomeTitle: "Welcome to GoGoPrompt",
    welcomeSub: "Your personal prompt library, always one hotkey away.",
    hotkeyTitle: "Set Your Summon Key",
    hotkeySub: "Choose a global hotkey to instantly summon GoGoPrompt from anywhere.",
    practiceTitle: "Practice Makes Perfect",
    practiceSub: "Use your new hotkey 10 times to build muscle memory.",
    controlsTitle: "Deployment Shortcuts",
    controlsSub: "Master these modifier keys to deploy prompts at lightning speed.",
    featureInstantTitle: "Instant Prompt Access",
    featureInstantDesc: "Access your entire prompt library with a single hotkey press. Your prompts are always just one keystroke away.",
    featureHotkeyTitle: "Global Hotkey",
    featureHotkeyDesc: "Set a custom hotkey that works anywhere on your computer. Press it anytime to summon your prompt library instantly.",
    featureDeployTitle: "Quick Prompt Deployment",
    featureDeployDesc: "Deploy prompts your way: copy to clipboard, auto-paste into your AI chat, or send directly with a single click.",
    controlCopyTitle: "Copy Only",
    controlCopyDesc: "Click any prompt card to copy it to your clipboard.",
    controlPasteTitle: "Auto-Paste",
    controlPasteDesc: "Hold Ctrl while clicking to copy and automatically paste into your AI chat.",
    controlSendTitle: "Auto-Send",
    controlSendDesc: "Hold Ctrl+Alt while clicking to copy, paste, and send your prompt instantly.",
    settingsNote: "You can customize these shortcuts anytime in Settings → Hotkeys",
  },
  es: {
    languageTitle: "Seleccionar Idioma",
    languageSub: "elige tu idioma preferido para comenzar.",
    please: "Por favor",
    continue: "Continuar",
    finish: "Finalizar",
    skip: "Saltar",
    welcomeTitle: "Bienvenido a GoGoPrompt",
    welcomeSub: "Tu biblioteca de prompts personal, siempre a una tecla de distancia.",
    hotkeyTitle: "Configura tu Tecla de Invocación",
    hotkeySub: "Elige un atajo global para invocar GoGoPrompt desde cualquier lugar.",
    practiceTitle: "La Práctica Hace al Maestro",
    practiceSub: "Usa tu nuevo atajo 10 veces para desarrollar memoria muscular.",
    controlsTitle: "Atajos de Despliegue",
    controlsSub: "Domina estas teclas modificadoras para desplegar prompts rápidamente.",
    featureInstantTitle: "Acceso Instantáneo a Prompts",
    featureInstantDesc: "Accede a toda tu biblioteca de prompts con una sola tecla.",
    featureHotkeyTitle: "Tecla Global",
    featureHotkeyDesc: "Configura un atajo que funciona en cualquier parte de tu computadora.",
    featureDeployTitle: "Despliegue Rápido de Prompts",
    featureDeployDesc: "Despliega prompts a tu manera: copia, pega automáticamente o envía directamente.",
    controlCopyTitle: "Solo Copiar",
    controlCopyDesc: "Haz clic en cualquier tarjeta para copiar al portapapeles.",
    controlPasteTitle: "Auto-Pegar",
    controlPasteDesc: "Mantén Ctrl mientras haces clic para copiar y pegar automáticamente.",
    controlSendTitle: "Auto-Enviar",
    controlSendDesc: "Mantén Ctrl+Alt mientras haces clic para copiar, pegar y enviar.",
    settingsNote: "Puedes personalizar estos atajos en Configuración → Teclas de acceso rápido",
  },
};

declare global {
  interface Window {
    electronAPI: {
      registerGlobalHotkey: (accelerator: string) => Promise<{ success: boolean; message?: string }>;
      completeOnboarding: () => Promise<boolean>;
      getAppSettings: () => Promise<any>;
      onHotkeyTrigger: (callback: () => void) => () => void;
    };
  }
}

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const { setLanguage, currentLanguageCode } = useLanguage();
  const { setActiveProfile } = useProfileStore();

  const txt = (key: string) => {
    const lang = ONBOARDING_TEXTS[currentLanguageCode] || ONBOARDING_TEXTS['en'];
    return lang[key] || ONBOARDING_TEXTS['en'][key];
  };

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [accelerator, setAccelerator] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [practiceCount, setPracticeCount] = useState(0);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [hasReleasedSinceLastSuccess, setHasReleasedSinceLastSuccess] = useState(true);

  const getElectronTriggerKey = (e: KeyboardEvent): string | null => {
    if (['Control', 'Shift', 'Alt', 'Meta', 'AltGraph', 'ContextMenu'].includes(e.key)) return null;
    if (e.code === 'Space') return 'Space';
    if (e.code.startsWith('Key')) return e.code.replace('Key', '');
    if (e.code.startsWith('Digit')) return e.code.replace('Digit', '');
    if (e.code.startsWith('F') && e.code.length <= 3) return e.code;
    if (e.key.length === 1) return e.key.toUpperCase();
    return e.code; 
  };

  const handleRecordKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isListening) return;
    e.preventDefault();
    e.stopPropagation();

    const keys: string[] = [];
    const modifiers: string[] = [];
    const isAltGrActive = e.getModifierState('AltGraph');

    if (isAltGrActive) {
        keys.push('AltGr');
        modifiers.push('CommandOrControl', 'Alt'); 
    } else {
        if (e.ctrlKey) { keys.push('Ctrl'); modifiers.push('CommandOrControl'); }
        if (e.altKey) { keys.push('Alt'); modifiers.push('Alt'); }
        if (e.metaKey) { keys.push('Super'); modifiers.push('Command'); }
    }
    if (e.shiftKey) { keys.push('Shift'); modifiers.push('Shift'); }

    const triggerKey = getElectronTriggerKey(e);
    if (triggerKey) {
      keys.push(triggerKey);
      const finalAccelerator = [...modifiers, triggerKey].join('+');
      setRecordedKeys(keys);
      setAccelerator(finalAccelerator);
      setError(null);
    } else {
        setRecordedKeys(keys);
        setAccelerator(''); 
    }
  }, [isListening]);

  const handlePracticeKeys = useCallback((e: KeyboardEvent, isDown: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveKeys(prev => {
        const next = new Set(prev);
        let keyLabel = '';

        if (e.code === 'AltRight' || e.key === 'AltGraph') keyLabel = 'AltGr';
        else if (e.code === 'ControlLeft' || e.code === 'ControlRight') keyLabel = 'Ctrl';
        else if (e.code === 'AltLeft') keyLabel = 'Alt';
        else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keyLabel = 'Shift';
        else if (e.code === 'MetaLeft' || e.code === 'MetaRight') keyLabel = 'Super';
        else {
            const trigger = getElectronTriggerKey(e);
            if (trigger) keyLabel = trigger;
        }

        if (keyLabel) {
            if (isDown) next.add(keyLabel);
            else next.delete(keyLabel);
        }

        if (!e.shiftKey) next.delete('Shift');
        if (!e.ctrlKey) next.delete('Ctrl');
        if (!e.metaKey) next.delete('Super');
        if (!e.altKey && !e.getModifierState('AltGraph')) {
            next.delete('Alt');
            next.delete('AltGr');
        }
        return next;
    });
  }, []);

  useEffect(() => {
    if (step !== 4) return;
    const allPressed = recordedKeys.every(k => activeKeys.has(k));
    if (allPressed && hasReleasedSinceLastSuccess) {
        if (practiceCount < 10) {
            setPracticeCount(c => c + 1);
            setHasReleasedSinceLastSuccess(false); 
        }
    }
    if (activeKeys.size === 0) {
        setHasReleasedSinceLastSuccess(true); 
    }
  }, [activeKeys, recordedKeys, step, practiceCount, hasReleasedSinceLastSuccess]);

  useEffect(() => {
    if (step === 3 && isListening) {
      window.addEventListener('keydown', handleRecordKeyDown);
      return () => window.removeEventListener('keydown', handleRecordKeyDown);
    }
    if (step === 4) {
        const onDown = (e: KeyboardEvent) => handlePracticeKeys(e, true);
        const onUp = (e: KeyboardEvent) => handlePracticeKeys(e, false);
        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup', onUp);
        window.addEventListener('blur', () => setActiveKeys(new Set()));
        return () => {
            window.removeEventListener('keydown', onDown);
            window.removeEventListener('keyup', onUp);
            window.removeEventListener('blur', () => setActiveKeys(new Set()));
        };
    }
  }, [step, isListening, handleRecordKeyDown, handlePracticeKeys]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value);
  };

  const handleGoToPractice = async () => {
    if (!accelerator) return;
    if (recordedKeys.length < 2 && !accelerator.startsWith('F')) {
        setError('Please include a modifier (e.g. Alt+E)');
        return;
    }
    try {
        const result = await window.electronAPI.registerGlobalHotkey(accelerator);
        if (result.success) {
            await window.electronAPI.registerGlobalHotkey(''); 
            setStep(4);
        } else {
            setError(result.message || 'Failed to register.');
            setAccelerator('');
            setRecordedKeys([]);
            setIsListening(false);
        }
    } catch (err) {
        console.error(err);
        setError('Backend error.');
    }
  };

  const handleGoToControls = async () => {
      try {
          const result = await window.electronAPI.registerGlobalHotkey(accelerator);
          if (result.success) {
              setStep(5);
          } else {
              setStep(3);
              setError('Failed to enable hotkey.');
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleFinalize = async () => {
      setActiveProfile('general');
      await window.electronAPI.completeOnboarding();
      onComplete(accelerator); 
  };

  const getFeedbackText = () => {
      if (practiceCount === 0) return "Give it a try!";
      if (practiceCount < 3) return "Good start!";
      if (practiceCount < 6) return "You're getting the hang of it!";
      if (practiceCount < 9) return "Almost there!";
      if (practiceCount === 9) return "One last time!";
      return "Ready to launch!";
  };

  return (
    <>
    <style>{`
      @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes glowPulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(9, 9, 11, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
      <div style={{ 
        width: '500px', 
        maxWidth: 'calc(100vw - 40px)', 
        backgroundColor: '#18181b', 
        border: '1px solid #3f3f46', 
        borderRadius: '16px', 
        padding: '28px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#27272a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '1px solid #3f3f46' }}>
                <Zap size={28} color="#eab308" fill="currentColor" />
            </div>
            <h2 style={{ color: '#f4f4f5', fontWeight: 700, fontSize: '22px', marginBottom: '6px' }}>
                {step === 1 && txt('languageTitle')}
                {step === 2 && txt('welcomeTitle')}
                {step === 3 && txt('hotkeyTitle')}
                {step === 4 && txt('practiceTitle')}
                {step === 5 && txt('controlsTitle')}
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '13px', margin: 0 }}>
                {step === 1 && <>{txt('please')} <span style={{ color: '#f4f4f5' }}>{txt('languageSub')}</span></>}
                {step === 2 && txt('welcomeSub')}
                {step === 3 && txt('hotkeySub')}
                {step === 4 && txt('practiceSub')}
                {step === 5 && txt('controlsSub')}
            </p>
        </div>

        {/* STEP 1: LANGUAGE */}
        {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                    <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                    <select value={currentLanguageCode} onChange={handleLanguageChange} style={{ width: '100%', appearance: 'none', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px 36px', color: '#f4f4f5', fontSize: '14px', cursor: 'pointer', fontWeight: 500, outline: 'none', textAlign: 'center' }}>
                        {SUPPORTED_LANGUAGES.map(lang => (<option key={lang.code} value={lang.code} style={{ backgroundColor: '#27272a' }}>{lang.label}</option>))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', pointerEvents: 'none' }} />
                </div>
            </div>
        )}

        {/* STEP 2: WELCOME */}
        {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#1f1f23', borderRadius: '10px', border: '1px solid #27272a', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ width: '36px', height: '36px', minWidth: '36px', backgroundColor: 'rgba(234, 179, 8, 0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Keyboard size={18} color="#eab308" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ color: '#f4f4f5', fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{txt('featureInstantTitle')}</h4>
                        <p style={{ color: '#71717a', fontSize: '11px', lineHeight: 1.4, margin: 0 }}>{txt('featureInstantDesc')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#1f1f23', borderRadius: '10px', border: '1px solid #27272a', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ width: '36px', height: '36px', minWidth: '36px', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Command size={18} color="#22c55e" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ color: '#f4f4f5', fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{txt('featureHotkeyTitle')}</h4>
                        <p style={{ color: '#71717a', fontSize: '11px', lineHeight: 1.4, margin: 0 }}>{txt('featureHotkeyDesc')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#1f1f23', borderRadius: '10px', border: '1px solid #27272a', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ width: '36px', height: '36px', minWidth: '36px', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Rocket size={18} color="#3b82f6" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ color: '#f4f4f5', fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{txt('featureDeployTitle')}</h4>
                        <p style={{ color: '#71717a', fontSize: '11px', lineHeight: 1.4, margin: 0 }}>{txt('featureDeployDesc')}</p>
                    </div>
                </div>
            </div>
        )}

        {/* STEP 3: HOTKEY RECORD */}
        {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <div tabIndex={0} onClick={() => setIsListening(true)} onFocus={() => setIsListening(true)} onBlur={() => setIsListening(false)} style={{ width: '100%', maxWidth: '320px', padding: '20px', borderRadius: '10px', backgroundColor: isListening ? '#27272a' : '#1f1f23', border: isListening ? '2px solid #eab308' : '2px solid #3f3f46', cursor: 'pointer', transition: 'all 0.2s', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    {recordedKeys.length > 0 ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {recordedKeys.map((key, i) => (<span key={i} style={{ padding: '10px 16px', backgroundColor: '#3f3f46', borderRadius: '6px', color: '#f4f4f5', fontWeight: 700, fontSize: '16px', border: '2px solid #52525b' }}>{key}</span>))}
                        </div>
                    ) : (
                        <span style={{ color: isListening ? '#eab308' : '#52525b', fontWeight: 600, fontSize: '13px' }}>{isListening ? 'Press your hotkey combination...' : 'Click here and press a hotkey'}</span>
                    )}
                </div>
                {error && (<div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', fontWeight: 500 }}><AlertTriangle size={14} /> {error}</div>)}
                {!error && (<div style={{ fontSize: '11px', color: '#52525b' }}>Recommended: <span style={{ color: '#a1a1aa', fontWeight: 500 }}>Alt + E</span></div>)}
            </div>
        )}

        {/* STEP 4: PRACTICE */}
        {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {recordedKeys.map((k, i) => {
                        const isActive = activeKeys.has(k);
                        return (<div key={i} style={{ minWidth: '50px', padding: '10px 16px', borderRadius: '8px', backgroundColor: isActive ? '#eab308' : '#27272a', color: isActive ? '#18181b' : '#e4e4e7', fontWeight: 700, fontSize: '20px', border: isActive ? '2px solid #eab308' : '2px solid #3f3f46', transform: isActive ? 'scale(0.95) translateY(2px)' : 'scale(1)', transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: isActive ? 'none' : '0 4px 0 #18181b, 0 4px 0 2px #3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k}</div>);
                    })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '70px', justifyContent: 'center' }}>
                    {practiceCount < 10 ? (
                        <>
                            <div style={{ fontSize: '13px', color: '#eab308', fontWeight: 600, opacity: 0.8 }}>{getFeedbackText()}</div>
                            <div style={{ fontSize: '40px', fontWeight: 800, color: '#f4f4f5', fontVariantNumeric: 'tabular-nums' }}>{practiceCount} <span style={{ color: '#52525b' }}>/ 10</span></div>
                            <div style={{ height: '5px', width: '180px', backgroundColor: '#27272a', borderRadius: '3px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${(practiceCount / 10) * 100}%`, backgroundColor: '#eab308', transition: 'width 0.2s ease' }} /></div>
                        </>
                    ) : (
                        <div style={{ animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <div style={{ backgroundColor: '#22c55e', padding: '10px', borderRadius: '50%', boxShadow: '0 8px 16px rgba(34, 197, 94, 0.3)' }}><CheckCircle2 size={28} color="#ffffff" strokeWidth={3} /></div>
                            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '14px' }}>Ready to launch!</span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* STEP 5: DEPLOYMENT CONTROLS */}
        {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Copy Only */}
                <div style={{ display: 'flex', gap: '12px', padding: '10px 12px', backgroundColor: '#1f1f23', borderRadius: '8px', border: '1px solid #27272a', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div style={{ padding: '6px 10px', backgroundColor: '#27272a', borderRadius: '5px', border: '1px solid #3f3f46', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MousePointer size={12} />Click
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}><Copy size={12} color="#a1a1aa" /><span style={{ color: '#f4f4f5', fontWeight: 600, fontSize: '12px' }}>{txt('controlCopyTitle')}</span></div>
                        <p style={{ color: '#71717a', fontSize: '11px', lineHeight: 1.3, margin: 0 }}>{txt('controlCopyDesc')}</p>
                    </div>
                </div>

                {/* Auto-Paste */}
                <div style={{ display: 'flex', gap: '12px', padding: '10px 12px', backgroundColor: '#1f1f23', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <div style={{ padding: '6px 8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '5px', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', fontSize: '11px', fontWeight: 700 }}>Ctrl</div>
                        <span style={{ color: '#52525b', fontSize: '10px' }}>+</span>
                        <div style={{ padding: '6px 10px', backgroundColor: '#27272a', borderRadius: '5px', border: '1px solid #3f3f46', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>Click</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}><Zap size={12} color="#3b82f6" /><span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '12px' }}>{txt('controlPasteTitle')}</span></div>
                        <p style={{ color: '#71717a', fontSize: '11px', lineHeight: 1.3, margin: 0 }}>{txt('controlPasteDesc')}</p>
                    </div>
                </div>

                {/* Auto-Send */}
                <div style={{ display: 'flex', gap: '12px', padding: '10px 12px', backgroundColor: '#1f1f23', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <div style={{ padding: '6px 8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>Ctrl</div>
                        <span style={{ color: '#52525b', fontSize: '10px' }}>+</span>
                        <div style={{ padding: '6px 8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '5px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>Alt</div>
                        <span style={{ color: '#52525b', fontSize: '10px' }}>+</span>
                        <div style={{ padding: '6px 10px', backgroundColor: '#27272a', borderRadius: '5px', border: '1px solid #3f3f46', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>Click</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}><Send size={12} color="#ef4444" /><span style={{ color: '#ef4444', fontWeight: 600, fontSize: '12px' }}>{txt('controlSendTitle')}</span></div>
                        <p style={{ color: '#71717a', fontSize: '11px', lineHeight: 1.3, margin: 0 }}>{txt('controlSendDesc')}</p>
                    </div>
                </div>

                {/* Settings Note */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)', marginTop: '4px' }}>
                    <Settings size={14} color="#eab308" />
                    <p style={{ color: '#a1a1aa', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
                        <span style={{ color: '#eab308', fontWeight: 500 }}>Tip:</span> {txt('settingsNote')}
                    </p>
                </div>
            </div>
        )}

        {/* FOOTER */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            {step !== 1 && step !== 5 && (<button onClick={() => { setStep(prev => (prev - 1) as any); setError(null); setIsListening(false); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: 'transparent', color: '#a1a1aa', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Back</button>)}
            
            {step === 4 && (
                <>
                    {practiceCount >= 3 && practiceCount < 10 && (<button onClick={handleGoToControls} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: 'transparent', color: '#a1a1aa', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>{txt('skip')}</button>)}
                    <button onClick={handleGoToControls} disabled={practiceCount < 10} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: practiceCount < 10 ? '#27272a' : '#22c55e', color: practiceCount < 10 ? '#52525b' : '#ffffff', fontWeight: 700, cursor: practiceCount < 10 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', transition: 'all 0.2s', animation: practiceCount === 10 ? 'glowPulse 2s infinite' : 'none' }}>{practiceCount < 10 ? `Use hotkey ${10 - practiceCount} more times` : txt('continue')}</button>
                </>
            )}

            {step === 5 && (<button onClick={handleFinalize} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#eab308', color: '#18181b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>{txt('finish')}<ChevronRight size={16} /></button>)}

            {step === 3 && (<button onClick={() => handleGoToPractice()} disabled={!accelerator || !!error} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: (!accelerator || !!error) ? '#27272a' : '#eab308', color: (!accelerator || !!error) ? '#52525b' : '#18181b', fontWeight: 700, cursor: (!accelerator || !!error) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>{txt('continue')}<ChevronRight size={16} /></button>)}

            {(step === 1 || step === 2) && (<button onClick={() => { if (step === 1) setStep(2); else { setStep(3); setIsListening(true); } }} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#eab308', color: '#18181b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>{txt('continue')}<ChevronRight size={16} /></button>)}
        </div>
      </div>
    </div>
    </>
  );
}

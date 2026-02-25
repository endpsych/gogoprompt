/**
 * DeploymentMonitor.tsx
 * Description: Diagnostic UI visualizing the 4-stage deployment pipeline.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ClipboardCheck, 
  MonitorSmartphone, 
  ClipboardPaste, 
  CornerDownLeft, 
  X,
  RefreshCcw,
  GripVertical,
  Loader2, 
  CheckCircle2 
} from 'lucide-react';

type Status = 'idle' | 'processing' | 'success' | 'error';

export function DeploymentMonitor() {
  const [clipboardStatus, setClipboardStatus] = useState<Status>('idle');
  const [focusStatus, setFocusStatus] = useState<Status>('idle');
  const [pasteStatus, setPasteStatus] = useState<Status>('idle');
  const [enterStatus, setEnterStatus] = useState<Status>('idle');
  
  const [targetAppName, setTargetAppName] = useState('');
  const [externalTargetApp, setExternalTargetApp] = useState('None');
  const [errorDetail, setErrorDetail] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Constants for styling
  const THEME_ORANGE = '#f97316';
  const ERROR_RED = '#ef4444';
  const STANDBY_GRAY = '#d1d5db'; // Light silver for better visibility in dark theme

  // Inject Pulse Animation for active targeting
  useEffect(() => {
    const styleId = 'monitor-glow-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes targetPulse {
          0% { box-shadow: 0 0 0px rgba(249, 115, 22, 0.2); opacity: 0.9; }
          50% { box-shadow: 0 0 12px rgba(249, 115, 22, 0.5); opacity: 1; }
          100% { box-shadow: 0 0 0px rgba(249, 115, 22, 0.2); opacity: 0.9; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleFlush = useCallback(() => {
    setClipboardStatus('idle');
    setFocusStatus('idle');
    setPasteStatus('idle');
    setEnterStatus('idle');
    setTargetAppName('');
    setErrorDetail('');
    setIsActive(false);
  }, []);

  // Listener for pipeline status and technical updates
  useEffect(() => {
    if (!(window as any).electronAPI?.onMonitorUpdate) return;

    const cleanup = (window as any).electronAPI.onMonitorUpdate((data: any) => {
      const { stage, status, detail } = data;
      setIsActive(true);

      if (stage === 'clipboard') setClipboardStatus(status);
      
      if (stage === 'focus') {
        setFocusStatus(status);
        if (detail && detail.startsWith('Target:')) {
          setTargetAppName(detail.replace('Target: ', ''));
        } else if (status === 'success' && detail) {
          setTargetAppName(detail);
        }
      }

      if (stage === 'paste') setPasteStatus(status);
      if (stage === 'enter') setEnterStatus(status);
      
      if (detail && !detail.startsWith('Target:')) setErrorDetail(detail);

      const isComplete = (stage === 'enter' && status === 'success') || 
                         (stage === 'paste' && status === 'success' && enterStatus === 'idle');

      if (isComplete || status === 'error') {
        setTimeout(() => {
          setIsActive(false);
          setTimeout(handleFlush, 500);
        }, 5000);
      }
    });

    return cleanup;
  }, [enterStatus, handleFlush]);

  // Listener for OS-level active application updates
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.onActiveAppUpdate) return;
    
    const cleanup = api.onActiveAppUpdate((appName: string) => {
      setExternalTargetApp(appName);
      if (appName !== 'None') {
        setTargetAppName(appName);
      }
    });
    
    return cleanup;
  }, []);

  const getStatusColor = (status: Status) => {
    switch(status) {
      case 'processing': return '#3b82f6';
      case 'success': return '#22c55e';
      case 'error': return ERROR_RED;
      default: return STANDBY_GRAY;
    }
  };

  const StageIcon = ({ status, icon: Icon, label }: { status: Status, icon: any, label: string }) => {
    let displaySubLabel = '';
    let subLabelColor = THEME_ORANGE;
    
    // Logic for REFOCUS sub-label states
    if (label === 'REFOCUS') {
      if (status === 'error') {
        displaySubLabel = 'REFOCUS FAILED';
        subLabelColor = ERROR_RED;
      } else if (!isActive || status === 'idle') {
        displaySubLabel = 'STANDBY';
      } else {
        displaySubLabel = externalTargetApp !== 'None' ? externalTargetApp : 'ACTIVE';
      }
    }

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '4px',
        color: getStatusColor(status),
        transition: 'all 0.3s ease',
        opacity: status === 'idle' ? 0.75 : 1, // High visibility even in standby
        minWidth: '60px'
      }}>
        <div style={{ position: 'relative', marginBottom: '2px' }}>
          <Icon size={24} />
          {status === 'processing' && (
            <Loader2 size={12} className="animate-spin" style={{ position: 'absolute', top: -4, right: -4 }} />
          )}
          {status === 'success' && (
            <CheckCircle2 size={12} style={{ position: 'absolute', top: -4, right: -4 }} />
          )}
        </div>
        <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {displaySubLabel && (
          <span style={{ 
            fontSize: '8px', 
            color: subLabelColor, 
            fontWeight: 900, 
            maxWidth: '70px', 
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '-2px'
          }}>
            {displaySubLabel}
          </span>
        )}
      </div>
    );
  };

  const handleClose = () => {
    if ((window as any).electronAPI?.closeWindow) {
      (window as any).electronAPI.closeWindow();
    }
  };

  const getProgressWidth = () => {
    if (enterStatus === 'success') return '100%';
    if (pasteStatus === 'success') return '75%';
    if (focusStatus === 'success') return '50%';
    if (clipboardStatus === 'success') return '25%';
    return '0%';
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '12px 16px',
      backgroundColor: 'rgba(9, 9, 11, 0.98)',
      border: '1px solid #27272a',
      borderRadius: '12px',
      backdropFilter: 'blur(16px)',
      color: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      fontFamily: 'sans-serif',
      opacity: isActive ? 1 : 0.95, // Max brightness in standby
      transition: 'opacity 0.5s ease-in-out',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        cursor: 'default'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          WebkitAppRegion: 'drag' as any,
          flex: 1
        }}>
          <GripVertical size={12} style={{ color: '#52525b' }} />
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 900, 
            color: THEME_ORANGE, 
            letterSpacing: '0.1em' 
          }}>
            DEPLOYMENT MONITOR
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', WebkitAppRegion: 'no-drag' as any }}>
          <button 
            onClick={handleFlush}
            title="Flush Pipeline"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#71717a', 
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCcw size={14} />
          </button>

          <button 
            onClick={handleClose}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#71717a', 
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 4-Stage Icons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flex: 1,
        padding: '0 4px',
        marginTop: '4px'
      }}>
        <StageIcon status={clipboardStatus} icon={ClipboardCheck} label="Copy" />
        <div style={{ height: '1px', flex: 1, background: '#27272a', margin: '12px 4px 0', maxWidth: '15px' }} />
        
        <StageIcon 
          status={focusStatus} 
          icon={MonitorSmartphone} 
          label="REFOCUS" 
        />
        <div style={{ height: '1px', flex: 1, background: '#27272a', margin: '12px 4px 0', maxWidth: '15px' }} />
        
        <StageIcon status={pasteStatus} icon={ClipboardPaste} label="Paste" />
        <div style={{ height: '1px', flex: 1, background: '#27272a', margin: '12px 4px 0', maxWidth: '15px' }} />
        
        <StageIcon status={enterStatus} icon={CornerDownLeft} label="Enter" />
      </div>
      
      {/* Footer Status Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
        <div style={{ 
          height: '2px', 
          width: '100%', 
          background: '#27272a', 
          borderRadius: '1px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            width: getProgressWidth(), 
            backgroundColor: errorDetail ? ERROR_RED : THEME_ORANGE,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '9px', 
            fontWeight: 900, 
            color: THEME_ORANGE,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '2px 10px',
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            borderRadius: '4px',
            border: `1px solid rgba(249, 115, 22, ${externalTargetApp !== 'None' ? '0.3' : '0.1'})`,
            animation: externalTargetApp !== 'None' ? 'targetPulse 2s infinite ease-in-out' : 'none',
            transition: 'all 0.3s ease'
          }}>
            {externalTargetApp !== 'None' ? `TARGET: ${externalTargetApp}` : 'NO TARGET APP DETECTED'}
          </span>
        </div>
      </div>
    </div>
  );
}
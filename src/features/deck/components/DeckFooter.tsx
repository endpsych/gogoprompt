/**
 * DeckFooter.tsx
 * Description: Component footer providing toggles for Clipboard and Deployment monitors.
 * Features: Profile selector and dual-monitor state management with IPC synchronization.
 */

import { useState, useEffect } from 'react'; 
import { Clipboard, MonitorSmartphone } from 'lucide-react'; 
import { ProfileSelector } from '@/features/profiles/components/ProfileSelector';

export function DeckFooter() {
  const [clipboardMonitorEnabled, setClipboardMonitorEnabled] = useState(false);
  const [deploymentMonitorEnabled, setDeploymentMonitorEnabled] = useState(false);

  useEffect(() => {
    // Load initial settings
    if (window.electronAPI?.getAppSettings) {
      window.electronAPI.getAppSettings().then(settings => {
        if (settings) {
          setClipboardMonitorEnabled(!!settings.clipboardMonitorEnabled);
          setDeploymentMonitorEnabled(!!settings.deploymentMonitorEnabled);
        }
      });
    }

    // Sync state changes from the Main Process (e.g., if window is closed via X)
    let cleanupClipboard: (() => void) | undefined;
    let cleanupDeployment: (() => void) | undefined;

    if (window.electronAPI?.onClipboardMonitorStateChange) {
      cleanupClipboard = window.electronAPI.onClipboardMonitorStateChange((isEnabled: boolean) => {
        setClipboardMonitorEnabled(isEnabled);
      });
    }

    if (window.electronAPI?.onDeploymentMonitorStateChange) {
      cleanupDeployment = window.electronAPI.onDeploymentMonitorStateChange((isEnabled: boolean) => {
        setDeploymentMonitorEnabled(isEnabled);
      });
    }

    return () => {
      if (cleanupClipboard) cleanupClipboard();
      if (cleanupDeployment) cleanupDeployment();
    };
  }, []);

  const toggleClipboardMonitor = () => {
    const newState = !clipboardMonitorEnabled;
    setClipboardMonitorEnabled(newState);
    if (window.electronAPI?.setClipboardMonitorState) {
      window.electronAPI.setClipboardMonitorState(newState);
    }
  };

  const toggleDeploymentMonitor = () => {
    const newState = !deploymentMonitorEnabled;
    setDeploymentMonitorEnabled(newState);
    if (window.electronAPI?.setDeploymentMonitorState) {
      window.electronAPI.setDeploymentMonitorState(newState);
    }
  };

  return (
    <div style={{
        flexShrink: 0,
        borderTop: '1px solid #374151',
        backgroundColor: '#1f2937',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
    }}>
        <ProfileSelector />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* --- DEPLOYMENT MONITOR TOGGLE (Orange) --- */}
            <div 
              onClick={toggleDeploymentMonitor} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              title="Deployment Monitor: Track the 4-stage paste pipeline"
            >
                <MonitorSmartphone size={16} color="#f97316" fill={deploymentMonitorEnabled ? "currentColor" : "none"} />
                
                <div style={{
                    width: '32px',
                    height: '18px',
                    backgroundColor: deploymentMonitorEnabled ? 'rgba(249, 115, 22, 0.2)' : '#3f3f46',
                    borderRadius: '9px',
                    position: 'relative',
                    border: `1px solid ${deploymentMonitorEnabled ? '#f97316' : '#52525b'}`,
                    transition: 'all 0.2s ease'
                }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: deploymentMonitorEnabled ? '#f97316' : '#a1a1aa',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: deploymentMonitorEnabled ? '16px' : '2px',
                        transition: 'left 0.2s ease'
                    }} />
                </div>
            </div>

            {/* --- CLIPBOARD MONITOR TOGGLE (Green) --- */}
            <div 
              onClick={toggleClipboardMonitor} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              title="Clipboard Monitor: Show a floating window tracking your clipboard"
            >
                <Clipboard size={16} color="#22c55e" fill={clipboardMonitorEnabled ? "currentColor" : "none"} />
                
                <div style={{
                    width: '32px',
                    height: '18px',
                    backgroundColor: clipboardMonitorEnabled ? 'rgba(34, 197, 94, 0.2)' : '#3f3f46',
                    borderRadius: '9px',
                    position: 'relative',
                    border: `1px solid ${clipboardMonitorEnabled ? '#22c55e' : '#52525b'}`,
                    transition: 'all 0.2s ease'
                }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: clipboardMonitorEnabled ? '#22c55e' : '#a1a1aa',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: clipboardMonitorEnabled ? '16px' : '2px',
                        transition: 'left 0.2s ease'
                    }} />
                </div>
            </div>
        </div>
    </div>
  );
}
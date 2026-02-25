/**
 * main.js
 * Description: Main process entry with focused External App Tracking and Caret Guard.
 * Features: High-frequency focus detection and UI Automation to verify text field focus.
 */

console.log('Main process starting...');

const { app, globalShortcut, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const wm = require('./windowManager');
const ipc = require('./ipc');

// App tracking state
let lastExternalApp = 'None';
let trackingInterval = null;
let activeWinModule = null;

/**
 * Loads the active-win module dynamically (ESM-in-CJS compatibility).
 */
async function getActiveWinFn() {
  try {
    if (activeWinModule) return activeWinModule;
    const mod = await import('active-win');
    activeWinModule = mod.activeWindow || (mod.default && mod.default.activeWindow) || mod.default;
    if (typeof activeWinModule !== 'function') return null;
    return activeWinModule;
  } catch (err) {
    console.error('[PIPELINE ERROR] Import failed:', err.message);
    return null;
  }
}

/**
 * Polling function to detect the active window.
 */
async function trackActiveWindow() {
  const activeWindow = await getActiveWinFn();
  if (!activeWindow) return;

  try {
    const active = await activeWindow();
    if (!active || !active.owner) return;

    const appName = active.owner.name;
    const processPath = active.owner.path || '';

    const internalNames = [
      'GoGoPrompt', 'Electron', 'Helper', 'Widgets', 
      'ShellExperienceHost', 'SearchHost', 'Taskmgr', 'Explorer.EXE'
    ];
    
    const isInternal = internalNames.some(name => 
      appName.includes(name) || processPath.includes(name)
    );

    if (!isInternal && appName !== lastExternalApp) {
      lastExternalApp = appName;
      broadcastAppUpdate(lastExternalApp);
    }
  } catch (err) {
    // Silent fail for performance
  }
}

/**
 * Caret Guard: Verifies if the focused element in the target app is a text field.
 * Uses Windows UI Automation via PowerShell.
 */
async function isTextFocusActive() {
  return new Promise((resolve) => {
    // ControlType 50004 = Edit, 50030 = Document
    const script = `
      Add-Type -AssemblyName UIAutomationClient
      try {
        $focused = [Windows.Automation.AutomationElement]::FocusedElement
        $typeId = $focused.Current.ControlType.Id
        $isText = ($typeId -eq 50004 -or $typeId -eq 50030)
        Write-Output $isText
      } catch {
        Write-Output "False"
      }
    `;

    exec(`powershell -ExecutionPolicy Bypass -Command "${script.replace(/\n/g, '')}"`, (error, stdout) => {
      if (error) return resolve(false);
      resolve(stdout.trim() === 'True');
    });
  });
}

/**
 * Sends the target app name to all open renderer windows.
 */
function broadcastAppUpdate(appName) {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('active-app-updated', appName);
    }
  });
}

// --- IPC HANDLERS FOR CARET GUARD ---

ipcMain.handle('verify-text-focus', async () => {
  return await isTextFocusActive();
});

// --- APP LIFECYCLE ---

app.whenReady().then(() => {
  console.log('App ready');
  wm.createMainWindow();
  wm.createTray();
  ipc.registerIpcHandlers();

  trackingInterval = setInterval(trackActiveWindow, 400);

  app.on('browser-window-blur', () => {
    setTimeout(trackActiveWindow, 100); 
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (trackingInterval) clearInterval(trackingInterval);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) wm.createMainWindow();
});
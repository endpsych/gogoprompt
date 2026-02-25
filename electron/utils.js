/**
 * utils.js
 * Description: Core utility functions for Electron main process, including window state, 
 * settings management, and OS-level keyboard simulation for the 4-stage pipeline.
 */

const { app, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

const isDev = !app.isPackaged;
const SETTINGS_FILE = path.join(app.getPath('userData'), 'app-settings.json');

// --- PATHS ---

function getIconPath() {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  if (isDev) {
    return path.join(__dirname, '../build', iconName);
  }
  return path.join(process.resourcesPath, 'build', iconName);
}

function getDataPath() {
  const userDataPath = app.getPath('userData');
  const dataPath = path.join(userDataPath, 'data');
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  return dataPath;
}

function getWindowStatePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

// --- SETTINGS ---

const defaultSettings = {
  hasCompletedOnboarding: false,
  globalHotkey: null,
  clipboardMonitorEnabled: false, 
};

function getAppSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return defaultSettings;
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...defaultSettings, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error reading settings:', error);
    return defaultSettings;
  }
}

function saveAppSettings(settings) {
  const current = getAppSettings();
  const updated = { ...current, ...settings };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// --- WINDOW STATE ---

const DEFAULT_STUDIO_SIZE = { width: 1100, height: 750 };
const DEFAULT_DECK_SIZE = { width: 720, height: 790 }; 
const DEFAULT_DEPLOYMENT_SIZE = { width: 1100, height: 750 }; 

function getDefaultWindowState() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  return {
    studio: { width: DEFAULT_STUDIO_SIZE.width, height: Math.min(DEFAULT_STUDIO_SIZE.height, height - 100), x: 50, y: 50 },
    deck: { width: DEFAULT_DECK_SIZE.width, height: Math.min(DEFAULT_DECK_SIZE.height, height - 100), x: width - DEFAULT_DECK_SIZE.width - 50, y: 50 },
    deployment: { width: DEFAULT_DEPLOYMENT_SIZE.width, height: Math.min(DEFAULT_DEPLOYMENT_SIZE.height, height - 100), x: Math.round((width - DEFAULT_DEPLOYMENT_SIZE.width) / 2), y: Math.round((height - DEFAULT_DEPLOYMENT_SIZE.height) / 2) },
    lastMode: 'deck', 
  };
}

function validatePosition(state) {
  const displays = screen.getAllDisplays();
  return displays.some((d) => {
    return state.x >= d.bounds.x - 100 &&
           state.x < d.bounds.x + d.bounds.width && 
           state.y >= d.bounds.y - 50 && 
           state.y < d.bounds.y + d.bounds.height;
  });
}

function loadWindowState() {
  try {
    const p = getWindowStatePath();
    if (fs.existsSync(p)) {
      const state = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (state.normal) { state.studio = state.normal; delete state.normal; }
      if (state.mini) { state.deck = state.mini; delete state.mini; }
      if (state.lastMode === 'normal') state.lastMode = 'studio';
      if (state.lastMode === 'mini') state.lastMode = 'deck';
      
      if (state.studio && !validatePosition(state.studio)) state.studio = getDefaultWindowState().studio;
      if (state.deck && !validatePosition(state.deck)) state.deck = getDefaultWindowState().deck;
      
      return state;
    }
  } catch (err) {
    console.error('Error loading window state:', err);
  }
  return getDefaultWindowState();
}

function saveWindowState(mainWindow, currentMode) {
  if (!mainWindow) return;
  try {
    const p = getWindowStatePath();
    let state = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : getDefaultWindowState();
    const b = mainWindow.getBounds();
    state[currentMode] = { width: b.width, height: b.height, x: b.x, y: b.y };
    state.lastMode = currentMode;
    fs.writeFileSync(p, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Error saving window state:', err);
  }
}

function getCurrentModeState(ws, mode) {
  return ws[mode] || getDefaultWindowState()[mode];
}

// --- TARGET APPLICATION DETECTION ---

/**
 * Fetches the name/title of the currently active window in the OS.
 * Used by Deployment Monitor to show where text will be pasted.
 */
async function getActiveWindowTitle() {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const ps = 'Add-Type -TypeDefinition "using System; using System.Runtime.InteropServices; public class User32 { [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount); }"; $hwnd = [User32]::GetForegroundWindow(); $sb = New-Object System.Text.StringBuilder 256; [User32]::GetWindowText($hwnd, $sb, $sb.Capacity); $sb.ToString()';
      exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`, (err, stdout) => {
        resolve(stdout ? stdout.trim() : 'Unknown App');
      });
    } else if (process.platform === 'darwin') {
      const as = `osascript -e 'tell application "System Events" to get name of first process whose frontmost is true'`;
      exec(as, (err, stdout) => {
        resolve(stdout ? stdout.trim() : 'Unknown App');
      });
    } else {
      resolve('Linux Target');
    }
  });
}

// --- PASTE & KEYSTROKE SIMULATION ---

/**
 * Simulates the OS paste command (Ctrl+V / Cmd+V).
 * Isolation for Deployment Monitor stage 3.
 */
function simulatePaste(shouldEnter = false) {
  if (process.platform === 'win32') {
    const psPath = path.join(os.tmpdir(), 'gogo_paste.ps1');
    const psContent = `
Add-Type -AssemblyName System.Windows.Forms
Start-Sleep -m 100
[System.Windows.Forms.SendKeys]::SendWait("^v")
${shouldEnter ? 'Start-Sleep -m 400\n[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")' : ''}
    `;
    try {
      fs.writeFileSync(psPath, psContent);
      exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psPath}"`, () => {
        try { fs.unlinkSync(psPath); } catch (e) {}
      });
    } catch (err) { console.error(err); }

  } else if (process.platform === 'darwin') {
    const script = shouldEnter
      ? `osascript -e 'tell application "System Events" to keystroke "v" using command down' -e 'delay 0.5' -e 'tell application "System Events" to keystroke return'`
      : `osascript -e 'tell application "System Events" to keystroke "v" using command down'`;
    exec(script);
  } else {
    const script = shouldEnter
      ? `xdotool key ctrl+v; sleep 0.5; xdotool key Return`
      : `xdotool key ctrl+v`;
    exec(script);
  }
}

/**
 * Simulates the OS Enter/Return key.
 * Isolation for Deployment Monitor stage 4.
 */
function simulateEnter() {
  if (process.platform === 'win32') {
    const psPath = path.join(os.tmpdir(), 'gogo_enter.ps1');
    const psContent = `
Add-Type -AssemblyName System.Windows.Forms
Start-Sleep -m 50
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    `;
    try {
      fs.writeFileSync(psPath, psContent);
      exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psPath}"`, () => {
        try { fs.unlinkSync(psPath); } catch (e) {}
      });
    } catch (err) { console.error(err); }

  } else if (process.platform === 'darwin') {
    exec(`osascript -e 'tell application "System Events" to keystroke return'`);
  } else {
    exec(`xdotool key Return`);
  }
}

module.exports = {
  isDev,
  getIconPath,
  getDataPath,
  getWindowStatePath,
  getAppSettings,
  saveAppSettings,
  loadWindowState,
  saveWindowState,
  getCurrentModeState,
  getActiveWindowTitle,
  simulatePaste,
  simulateEnter
};
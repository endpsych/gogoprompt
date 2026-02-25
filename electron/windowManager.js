/**
 * windowManager.js
 * Description: Orchestrates all BrowserWindow instances for GoGoPrompt.
 * Updated: Robust tracking for DeploymentMonitorWindow to support DeckFooter toggling.
 */

const { BrowserWindow, screen, Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const utils = require('./utils');
const clip = require('./clipboard');

let mainWindow = null;
let editorWindow = null;
let studioWindow = null;
let deploymentWindow = null;
let clipboardMonitorWindow = null;
let reminderWindow = null;
let deploymentMonitorWindow = null; 
let tray = null;
let currentMode = 'studio';

let pendingDeploymentData = null;

const NOTIFICATION_WIDTH = 350; 
const NOTIFICATION_MARGIN_X = 20;
const NOTIFICATION_MARGIN_Y = 20;

const getMainWindow = () => mainWindow;
const getDeploymentWindow = () => deploymentWindow;
const getClipboardMonitorWindow = () => clipboardMonitorWindow;
const getDeploymentMonitorWindow = () => deploymentMonitorWindow;
const getReminderWindow = () => reminderWindow;
const getCurrentMode = () => currentMode;
const setCurrentMode = (mode) => { currentMode = mode; };

// --- MAIN WINDOW ---

function createMainWindow() {
  const ws = utils.loadWindowState();
  currentMode = 'deck'; 
  const ms = utils.getCurrentModeState(ws, currentMode);

  mainWindow = new BrowserWindow({
    x: ms.x, y: ms.y, width: ms.width, height: ms.height, 
    minWidth: 280, minHeight: 200,
    show: false, 
    frame: false, 
    transparent: true,
    backgroundColor: '#00000000',
    icon: utils.getIconPath(),
    webPreferences: { 
        nodeIntegration: false,
        contextIsolation: true, 
        sandbox: true, 
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true, 
        allowRunningInsecureContent: false 
    },
  });

  if (utils.isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('resize', () => utils.saveWindowState(mainWindow, currentMode));
  mainWindow.on('move', () => utils.saveWindowState(mainWindow, currentMode));
  mainWindow.on('close', (e) => { 
    if (!app.isQuitting) { 
      e.preventDefault(); 
      mainWindow.hide(); 
    } 
    return false; 
  });

  ['blur', 'focus', 'show', 'hide', 'minimize', 'restore'].forEach(ev => {
      mainWindow.on(ev, () => updateReminderVisibility());
  });

  return mainWindow;
}

// --- DEPLOYMENT WINDOW ---

function createDeploymentWindow(promptId, initialValues, isOnboarding = false) {
  pendingDeploymentData = { promptId, initialValues, isOnboarding };

  if (deploymentWindow && !deploymentWindow.isDestroyed()) {
    deploymentWindow.webContents.send('load-deployment', pendingDeploymentData);
    deploymentWindow.focus();
    return deploymentWindow;
  }

  const ws = utils.loadWindowState();
  const state = ws.deployment || { width: 1100, height: 750 }; 

  let startX = state.x;
  let startY = state.y;
  if (mainWindow && !mainWindow.isDestroyed()) {
    const mainBounds = mainWindow.getBounds();
    startX = mainBounds.x + Math.round((mainBounds.width - state.width) / 2);
    startY = mainBounds.y + 50;
  }

  deploymentWindow = new BrowserWindow({
    width: state.width, height: state.height, x: startX, y: startY,
    minWidth: 800, minHeight: 500,
    show: false, frame: false, modal: false, 
    icon: utils.getIconPath(),
    webPreferences: { 
      nodeIntegration: false, contextIsolation: true, sandbox: true, 
      preload: path.join(__dirname, 'preload.js'), webSecurity: true 
    }
  });

  const params = new URLSearchParams();
  params.set('mode', 'deployment');
  params.set('promptId', promptId);
  if (initialValues) params.set('initialValues', JSON.stringify(initialValues));
  if (isOnboarding) params.set('isOnboarding', 'true'); 
  
  const q = `?${params.toString()}`;
  if (utils.isDev) deploymentWindow.loadURL(`http://localhost:5173${q}`);
  else deploymentWindow.loadFile(path.join(__dirname, '../dist/index.html'), { search: q });

  deploymentWindow.once('ready-to-show', () => deploymentWindow.show());
  deploymentWindow.on('close', () => { deploymentWindow = null; });

  return deploymentWindow;
}

function closeDeploymentWindow() {
  if (deploymentWindow && !deploymentWindow.isDestroyed()) deploymentWindow.close();
}

function sendPendingDeploymentData() {
  if (deploymentWindow && !deploymentWindow.isDestroyed() && pendingDeploymentData) {
    deploymentWindow.webContents.send('load-deployment', pendingDeploymentData);
  }
}

// --- DEPLOYMENT PROCESS MONITOR ---

function createDeploymentMonitorWindow() {
  if (deploymentMonitorWindow && !deploymentMonitorWindow.isDestroyed()) {
    deploymentMonitorWindow.showInactive();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { height } = primaryDisplay.workAreaSize;
  
  const winWidth = NOTIFICATION_WIDTH;
  const winHeight = 160; 
  
  let yPos = height - winHeight - NOTIFICATION_MARGIN_Y;
  if (clipboardMonitorWindow && !clipboardMonitorWindow.isDestroyed()) { 
      yPos = height - 135 - 10 - winHeight; 
  }

  deploymentMonitorWindow = new BrowserWindow({
    width: winWidth, height: winHeight, x: NOTIFICATION_MARGIN_X, y: yPos,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, focusable: false,
    show: false, resizable: false, movable: true,
    webPreferences: { 
      nodeIntegration: false, contextIsolation: true, 
      preload: path.join(__dirname, 'preload.js') 
    }
  });

  const q = `?mode=deployment-monitor`;
  if (utils.isDev) deploymentMonitorWindow.loadURL(`http://localhost:5173${q}`);
  else deploymentMonitorWindow.loadFile(path.join(__dirname, '../dist/index.html'), { search: q });

  deploymentMonitorWindow.once('ready-to-show', () => deploymentMonitorWindow.showInactive());

  deploymentMonitorWindow.on('closed', () => {
    deploymentMonitorWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('deployment-monitor-state-changed', false);
    }
  });
}

// --- EDITOR & STUDIO WINDOWS ---

function createEditorWindow(promptId) {
    if (editorWindow) {
        editorWindow.focus();
        editorWindow.webContents.send('load-prompt', promptId);
        return;
    }
    let startX, startY;
    if (mainWindow) {
        const b = mainWindow.getBounds();
        startX = b.x + 100; startY = b.y + 100;
    }
    editorWindow = new BrowserWindow({
        width: 800, height: 500, x: startX, y: startY,
        parent: mainWindow, modal: false, frame: false, show: false, icon: utils.getIconPath(),
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js'), webSecurity: true }
    });
    const q = `?mode=editor&id=${promptId}`;
    if (utils.isDev) editorWindow.loadURL(`http://localhost:5173${q}`);
    else editorWindow.loadFile(path.join(__dirname, '../dist/index.html'), { search: q });
    
    editorWindow.once('ready-to-show', () => editorWindow.show());
    editorWindow.on('closed', () => { editorWindow = null; });
}

function createStudioWindow() {
    if (studioWindow && !studioWindow.isDestroyed()) {
        studioWindow.focus();
        return;
    }
    const ws = utils.loadWindowState();
    const state = ws.studio || { width: 1100, height: 750, x: 50, y: 50 }; 

    studioWindow = new BrowserWindow({
        width: state.width, height: state.height, x: state.x + 30, y: state.y + 30,
        minWidth: 800, minHeight: 600, show: false, frame: false, parent: mainWindow, modal: false, icon: utils.getIconPath(),
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.js'), webSecurity: true }
    });
    const q = `?mode=studio`;
    if (utils.isDev) studioWindow.loadURL(`http://localhost:5173${q}`);
    else studioWindow.loadFile(path.join(__dirname, '../dist/index.html'), { search: q });

    studioWindow.once('ready-to-show', () => studioWindow.show());
    studioWindow.on('close', () => { studioWindow = null; });
}

// --- CLIPBOARD MONITOR WINDOW ---

function createClipboardMonitorWindow() {
  if (clipboardMonitorWindow && !clipboardMonitorWindow.isDestroyed()) return;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { height } = primaryDisplay.workAreaSize;
  
  const winWidth = NOTIFICATION_WIDTH;
  const winHeight = 115; 
  const yPos = height - winHeight - NOTIFICATION_MARGIN_Y;

  clipboardMonitorWindow = new BrowserWindow({
    width: winWidth, height: winHeight, minWidth: 200, minHeight: 100, 
    x: NOTIFICATION_MARGIN_X, y: yPos, 
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, focusable: false, 
    show: false, resizable: true, movable: true, 
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  });

  const q = `?mode=clipboard-monitor`;
  if (utils.isDev) clipboardMonitorWindow.loadURL(`http://localhost:5173${q}`);
  else clipboardMonitorWindow.loadFile(path.join(__dirname, '../dist/index.html'), { search: q });

  clipboardMonitorWindow.setIgnoreMouseEvents(false);
  clipboardMonitorWindow.on('closed', () => { 
      clipboardMonitorWindow = null; 
      clip.stopClipboardMonitoring(); 
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clipboard-monitor-state-changed', false);
      }
  });
}

// --- REMINDER WINDOW ---

function createReminderWindow(hotkey) {
  if (reminderWindow && !reminderWindow.isDestroyed()) return;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { height } = primaryDisplay.workAreaSize;
  
  const winWidth = NOTIFICATION_WIDTH; 
  const winHeight = 110; 

  let yPos = height - winHeight - NOTIFICATION_MARGIN_Y;
  if (clipboardMonitorWindow && !clipboardMonitorWindow.isDestroyed()) { 
      yPos = height - 135 - 10 - winHeight; 
  }

  reminderWindow = new BrowserWindow({
    width: winWidth, height: winHeight, x: NOTIFICATION_MARGIN_X, y: yPos, 
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, focusable: false, 
    show: false, resizable: false, movable: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  });

  const q = `?mode=reminder&hotkey=${encodeURIComponent(hotkey || '')}`;
  if (utils.isDev) reminderWindow.loadURL(`http://localhost:5173${q}`);
  else reminderWindow.loadFile(path.join(__dirname, '../dist/index.html'), { search: q });

  reminderWindow.setIgnoreMouseEvents(false); 
  reminderWindow.on('closed', () => { reminderWindow = null; });
}

let windowManager_isReminderActive = false;
let windowManager_reminderHotkey = '';

function updateReminderVisibility() {
    if (windowManager_isReminderActive && (!mainWindow || !mainWindow.isVisible() || !mainWindow.isFocused())) {
        if (reminderWindow && !reminderWindow.isDestroyed()) {
             const primaryDisplay = screen.getPrimaryDisplay();
             const { height } = primaryDisplay.workAreaSize;
             const winHeight = 110;
             let yPos = height - winHeight - NOTIFICATION_MARGIN_Y;
             if (clipboardMonitorWindow && !clipboardMonitorWindow.isDestroyed()) {
                yPos = height - 135 - 10 - winHeight;
             }
             reminderWindow.setPosition(NOTIFICATION_MARGIN_X, yPos);
             reminderWindow.showInactive();
        } else {
             createReminderWindow(windowManager_reminderHotkey);
             if(reminderWindow) reminderWindow.showInactive();
        }
    } else {
        if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
    }
}

function setReminderState(active, hotkey) {
    windowManager_isReminderActive = active;
    windowManager_reminderHotkey = hotkey;
    if (active) {
        createReminderWindow(hotkey);
        updateReminderVisibility();
    } else {
        if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.close();
    }
}

function createTray() {
  const p = utils.getIconPath();
  tray = new Tray(nativeImage.createFromPath(p));
  tray.setToolTip('GoGoPrompt');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show GoGoPrompt', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]));
  tray.on('click', () => {
    if (mainWindow && mainWindow.isVisible()) mainWindow.hide();
    else mainWindow?.show();
  });
}

module.exports = {
  createMainWindow,
  getMainWindow,
  createDeploymentWindow,
  getDeploymentWindow,
  closeDeploymentWindow,
  sendPendingDeploymentData,
  createDeploymentMonitorWindow,
  getDeploymentMonitorWindow,
  createEditorWindow,
  createStudioWindow,
  createClipboardMonitorWindow,
  getClipboardMonitorWindow,
  createTray,
  getCurrentMode,
  setCurrentMode,
  createReminderWindow,
  setReminderState,
  updateReminderVisibility
};
/**
 * ipc.js
 * Description: Registers all Inter-Process Communication (IPC) handlers for GoGoPrompt.
 */

const { ipcMain, globalShortcut, app, BrowserWindow, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const wm = require('./windowManager');
const utils = require('./utils');
const clip = require('./clipboard');

function registerIpcHandlers() {

  // --- MONITOR UTILITY ---
  const notifyMonitor = (stage, status, detail = '') => {
    const monitor = wm.getDeploymentMonitorWindow();
    if (monitor && !monitor.isDestroyed()) {
      monitor.webContents.send('monitor-update', { stage, status, detail });
    }
  };

  // --- WINDOW CONTROLS ---
  ipcMain.on('minimize-window', (e) => { 
    const w = BrowserWindow.fromWebContents(e.sender);
    if (w) w.minimize();
  });
  
  ipcMain.on('close-window', (e) => { 
    const w = BrowserWindow.fromWebContents(e.sender);
    if (w) {
       if (w === wm.getMainWindow()) {
          if (process.platform === 'darwin') app.hide(); 
          else w.hide(); 
       } else {
          w.close();
       }
    }
  });

  ipcMain.on('hide-window', () => { 
    const win = wm.getMainWindow();
    if (win) win.hide(); 
  });

  ipcMain.on('set-app-mode', (e, mode) => {
    const win = wm.getMainWindow();
    if (!win) return;
    utils.saveWindowState(win, wm.getCurrentMode());
    wm.setCurrentMode(mode);
    const ms = utils.getCurrentModeState(utils.loadWindowState(), mode);
    win.setBounds({ x: ms.x, y: ms.y, width: ms.width, height: ms.height });
  });

  ipcMain.handle('get-window-mode', () => wm.getCurrentMode());

  // --- WINDOW OPENERS ---
  ipcMain.on('open-editor-window', (e, promptId) => wm.createEditorWindow(promptId));
  ipcMain.on('open-studio-window', () => wm.createStudioWindow());
  
  ipcMain.on('open-deployment-window', (event, { promptId, initialValues, isOnboarding }) => {
    wm.createDeploymentWindow(promptId, initialValues, isOnboarding);
  });
  
  ipcMain.on('close-deployment-window', () => wm.closeDeploymentWindow());

  ipcMain.on('deployment-ready', () => {
    wm.sendPendingDeploymentData();
  });

  ipcMain.on('open-deployment-monitor', () => {
    wm.createDeploymentMonitorWindow();
  });

  // --- MONITOR TOGGLE HANDLER ---
  ipcMain.on('set-deployment-monitor-state', (e, enabled) => {
    utils.saveAppSettings({ deploymentMonitorEnabled: enabled });
    if (enabled) {
      wm.createDeploymentMonitorWindow();
    } else {
      const monitor = wm.getDeploymentMonitorWindow();
      if (monitor && !monitor.isDestroyed()) {
        monitor.close();
      }
    }
  });

  // ==========================================================================
  // DEPLOYMENT & PASTE LOGIC (OPTIMIZED 4-STAGE PIPELINE)
  // ==========================================================================

  ipcMain.on('minimize-and-paste', async (event, shouldEnter) => { 
    const win = wm.getMainWindow();
    const targetApp = await utils.getActiveWindowTitle();
    
    // Stage 1: Clipboard Verification
    notifyMonitor('clipboard', 'processing');
    const currentBuffer = clipboard.readText();
    if (currentBuffer.length > 0) {
      notifyMonitor('clipboard', 'success');
    } else {
      notifyMonitor('clipboard', 'error', 'Clipboard is empty');
      return;
    }

    if (win) { 
      // Stage 2: Focus Reversion
      notifyMonitor('focus', 'processing', `Target: ${targetApp}`);
      win.minimize(); 

      // 600ms settling time for OS focus handoff
      setTimeout(async () => {
        if (!win.isFocused()) {
          notifyMonitor('focus', 'success', targetApp);

          // Stage 3: Paste Simulation with 150ms buffer
          setTimeout(() => {
            notifyMonitor('paste', 'processing');
            utils.simulatePaste(false); 
            
            setTimeout(() => {
              notifyMonitor('paste', 'success');

              // Stage 4: Enter Simulation
              if (shouldEnter) {
                notifyMonitor('enter', 'processing');
                utils.simulateEnter();
                setTimeout(() => notifyMonitor('enter', 'success'), 200);
              }
            }, 300);
          }, 150);
        } else {
          notifyMonitor('focus', 'error', 'Focus stayed on App');
        }

        win.webContents.send('deployment-complete', 'pasted');
      }, 600); 
    } 
  });

  ipcMain.on('deployment-confirmed', async (event, data) => {
      const { content, variables, shouldAutoPaste, shouldAutoEnter } = data;
      const mainWin = wm.getMainWindow();
      const targetApp = await utils.getActiveWindowTitle();

      // Stage 1: Clipboard Write
      notifyMonitor('clipboard', 'processing');
      try {
        clipboard.writeText(content);
        notifyMonitor('clipboard', 'success');
      } catch (err) {
        notifyMonitor('clipboard', 'error', 'Write failed');
        return;
      }

      if (mainWin) {
          mainWin.webContents.send('deployment-result', { content, variables });
          mainWin.webContents.send('deployment-complete', 'confirmed');
      }

      if (shouldAutoPaste || shouldAutoEnter) {
          // Stage 2: Focus Reversion
          notifyMonitor('focus', 'processing', `Target: ${targetApp}`);
          if (mainWin && mainWin.isVisible()) {
              mainWin.minimize();
          }
          wm.closeDeploymentWindow();

          setTimeout(async () => {
              notifyMonitor('focus', 'success', targetApp);

              // Stage 3: Paste Simulation with 150ms buffer
              setTimeout(() => {
                notifyMonitor('paste', 'processing');
                utils.simulatePaste(false);
                
                setTimeout(() => {
                  notifyMonitor('paste', 'success');

                  // Stage 4: Enter Simulation
                  if (shouldAutoEnter) {
                    notifyMonitor('enter', 'processing');
                    utils.simulateEnter();
                    setTimeout(() => notifyMonitor('enter', 'success'), 200);
                  }
                }, 300);
              }, 150);
          }, 600);
      } else {
          wm.closeDeploymentWindow();
      }
  });

  // --- REMAINING HANDLERS ---
  
  ipcMain.on('prompt-updated-externally', () => {
    const win = wm.getMainWindow();
    if(win) win.webContents.send('refresh-data');
  });

  ipcMain.on('set-clipboard-monitor-state', (e, enabled) => {
    utils.saveAppSettings({ clipboardMonitorEnabled: enabled });
    clip.setClipboardMonitorState(enabled);
    const win = wm.getMainWindow();
    if (win) win.webContents.send('clipboard-monitor-state-changed', enabled);
    wm.updateReminderVisibility(); 
  });

  ipcMain.on('set-reminder-state', (e, enabled, hotkey) => {
    wm.setReminderState(enabled, hotkey);
  });

  ipcMain.handle('complete-onboarding', () => {
    utils.saveAppSettings({ hasCompletedOnboarding: true, clipboardMonitorEnabled: true });
    clip.setClipboardMonitorState(true);
    const win = wm.getMainWindow();
    if (win) win.webContents.send('clipboard-monitor-state-changed', true);
    wm.updateReminderVisibility();
    return true;
  });

  ipcMain.handle('register-global-hotkey', (e, accelerator) => {
    const win = wm.getMainWindow();
    globalShortcut.unregisterAll();
    if (!accelerator) return { success: false };
    try {
      const ret = globalShortcut.register(accelerator, () => {
        if (win) {
           if (win.isVisible() && !win.isMinimized() && win.isFocused()) {
             win.hide();
           } else {
             if (win.isMinimized()) win.restore();
             win.show();
             win.focus();
             win.webContents.send('trigger-deck-mode');
           }
        }
        wm.updateReminderVisibility(); 
      });
      if(ret) {
        utils.saveAppSettings({ globalHotkey: accelerator });
        return { success: true };
      }
      return { success: false, message: 'Failed to register hotkey' };
    } catch(err) {
      console.error(err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('get-app-settings', () => utils.getAppSettings());

  // --- STORAGE HANDLERS ---
  ipcMain.handle('store-read', async (event, storeName) => {
    try {
      const p = path.join(utils.getDataPath(), `${storeName}.json`);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        return JSON.parse(content);
      }
      return null;
    } catch (err) { return null; }
  });

  ipcMain.handle('store-write', async (event, storeName, data) => {
    try {
      const p = path.join(utils.getDataPath(), `${storeName}.json`);
      fs.writeFileSync(p, JSON.stringify(data, null, 2));
      const allWindows = BrowserWindow.getAllWindows();
      const senderId = event.sender.id;
      allWindows.forEach((win) => {
        if (win.webContents.id !== senderId) win.webContents.send('refresh-data', storeName);
      });
      return true;
    } catch (err) { return false; }
  });

  ipcMain.handle('store-delete', async (event, storeName) => {
    try {
      const p = path.join(utils.getDataPath(), `${storeName}.json`);
      if (fs.existsSync(p)) fs.unlinkSync(p);
      return true;
    } catch (err) { return false; }
  });

  ipcMain.handle('store-list', async () => {
    try {
      const files = fs.readdirSync(utils.getDataPath());
      return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch (err) { return []; }
  });

  ipcMain.handle('store-info', async () => {
    try {
      const dp = utils.getDataPath();
      const files = fs.readdirSync(dp);
      let totalSize = 0;
      const stores = [];
      for (const f of files) {
        if (f.endsWith('.json')) {
          const s = fs.statSync(path.join(dp, f));
          totalSize += s.size;
          stores.push({ name: f.replace('.json', ''), size: s.size, modified: s.mtime });
        }
      }
      return { path: dp, totalSize, stores };
    } catch (err) { return null; }
  });

  ipcMain.handle('store-export-all', async () => {
    try {
      const dp = utils.getDataPath();
      const files = fs.readdirSync(dp);
      const backup = { version: 2, exportedAt: new Date().toISOString(), stores: {} };
      for (const f of files) {
        if (f.endsWith('.json')) {
          const content = fs.readFileSync(path.join(dp, f), 'utf8');
          backup.stores[f.replace('.json', '')] = JSON.parse(content);
        }
      }
      return backup;
    } catch (err) { return null; }
  });

  ipcMain.handle('store-import-all', async (event, backup) => {
    try {
      if (!backup || !backup.stores) throw new Error('Invalid backup');
      const dp = utils.getDataPath();
      for (const [name, data] of Object.entries(backup.stores)) {
        fs.writeFileSync(path.join(dp, `${name}.json`), JSON.stringify(data, null, 2));
      }
      return true;
    } catch (err) { return false; }
  });

  ipcMain.handle('store-migrate-from-localstorage', async (event, data) => {
    try {
      const dp = utils.getDataPath();
      for (const [key, value] of Object.entries(data)) {
        fs.writeFileSync(path.join(dp, `${key}.json`), value);
      }
      return true;
    } catch (err) { return false; }
  });
}

module.exports = { registerIpcHandlers };
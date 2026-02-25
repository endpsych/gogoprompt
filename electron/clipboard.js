const { clipboard } = require('electron');


let isClipboardMonitorActive = false;
let clipboardInterval = null;
let lastClipboardText = '';

function getIsActive() {
    return isClipboardMonitorActive;
}

function startClipboardMonitoring() {
    // Lazy load windowManager to handle circular reference
    const wm = require('./windowManager');
    
    if (clipboardInterval) clearInterval(clipboardInterval);
    lastClipboardText = clipboard.readText();
    
    clipboardInterval = setInterval(() => {
        const text = clipboard.readText();
        if (text !== lastClipboardText) {
            lastClipboardText = text;
            const win = wm.getClipboardMonitorWindow();
            if (win && !win.isDestroyed()) {
                win.webContents.send('clipboard-update', text);
            }
        }
    }, 1000);
}

function stopClipboardMonitoring() {
    if (clipboardInterval) clearInterval(clipboardInterval);
    clipboardInterval = null;
}

function setClipboardMonitorState(isActive) {
    const wm = require('./windowManager'); // Lazy load
    
    isClipboardMonitorActive = isActive;
    if (isActive) {
        wm.createClipboardMonitorWindow();
        const win = wm.getClipboardMonitorWindow();
        if (win) {
             win.showInactive();
             startClipboardMonitoring();
        }
    } else {
        const win = wm.getClipboardMonitorWindow();
        if (win) win.close();
        stopClipboardMonitoring();
    }
}

module.exports = {
  setClipboardMonitorState,
  getIsActive, // Added missing export
  stopClipboardMonitoring
};
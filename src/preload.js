/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const { contextBridge, ipcRenderer } = require('electron');
const { v4: uuidv4 } = require('uuid');

contextBridge.exposeInMainWorld('electron', {
  showDirectoryPicker: () => {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();
      ipcRenderer.send('select-directory', { requestId });
      ipcRenderer.once('select-directory-response', (event, resBase, { directory }) => {
        if (resBase.requestId === requestId && resBase.resultCode === 'OK') {
          resolve({ directory });
        }
      });
    });
  },
  saveFiles: ({ rootDir, files }) => {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();
      ipcRenderer.send('save-files', { requestId }, { rootDir, files });
      ipcRenderer.once('save-files-response', (event, resBase) => {
        if (resBase.requestId === requestId) {
          if (resBase.resultCode === 'OK') {
            resolve();
          } else {
            reject(new Error(resBase.resultMessage)); 
          }
        }
      });
    });
  },
});


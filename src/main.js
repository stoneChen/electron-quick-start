// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('fs');

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // 启用 contextIsolation
      nodeIntegration: false, // 禁用 nodeIntegration
      enableRemoteModule: false, // 确保远程模块也被禁用
      sandbox: false,
      devTools: process.env.NODE_ENV === 'development',
    }
  })

  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')

  mainWindow.loadURL('http://localhost:3000');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('select-directory', async (event, { requestId }) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const directory = result.filePaths[0];
    event.reply('select-directory-response', { requestId, resultCode: 'OK' }, { directory });
  }
});

ipcMain.on('save-files', (event, { requestId }, { rootDir, files }) => {
  if (!fs.existsSync(rootDir)) {
    event.reply('save-files-response', { requestId, resultCode: 'ERROR', resultMessage: `Root directory '${rootDir}' does not exist` });
    return;
  }
  files.forEach((file) => {
    const { content, filePath } = file;
    const fullFilePath = path.join(rootDir, filePath);

    const dirname = path.dirname(fullFilePath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    // 暂时用同步方式，如果有性能问题再改为异步
    fs.writeFileSync(fullFilePath, content);
  });
  event.reply('save-files-response', { requestId, resultCode: 'OK' });
});

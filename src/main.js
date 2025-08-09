const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const LLMAnalyzer = require('./utils/llm-analyzer');

// Initialize the LLM analyzer
const analyzer = new LLMAnalyzer();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'LabLens - Clinical Lab Results Tool'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle file selection
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Lab Results', extensions: ['png', 'jpg', 'jpeg', 'pdf'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const fileBuffer = fs.readFileSync(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    
    return {
      success: true,
      filePath: filePath,
      fileName: path.basename(filePath),
      fileData: fileBuffer.toString('base64'),
      fileType: fileExtension
    };
  }
  
  return { success: false };
});

// Handle lab results analysis
ipcMain.handle('analyze-lab-results', async (event, fileData, fileType) => {
  try {
    const result = await analyzer.analyzeLabResults(fileData, fileType);
    return result;
  } catch (error) {
    console.error('Error analyzing lab results:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle getting available models
ipcMain.handle('get-available-models', async () => {
  try {
    return analyzer.getAvailableModels();
  } catch (error) {
    console.error('Error getting available models:', error);
    return [];
  }
});

// Handle updating analyzer configuration
ipcMain.handle('update-analyzer-config', async (event, config) => {
  try {
    analyzer.updateConfig(config);
    return { success: true };
  } catch (error) {
    console.error('Error updating analyzer config:', error);
    return { success: false, error: error.message };
  }
});

// Handle patient message generation
ipcMain.handle('generate-patient-message', async (event, labData) => {
  try {
    const message = await analyzer.generatePatientMessage(labData);
    return { success: true, message };
  } catch (error) {
    console.error('Error generating patient message:', error);
    return { success: false, error: error.message };
  }
});

// Handle staff message generation
ipcMain.handle('generate-staff-message', async (event, labData) => {
  try {
    const message = await analyzer.generateStaffMessage(labData);
    return { success: true, message };
  } catch (error) {
    console.error('Error generating staff message:', error);
    return { success: false, error: error.message };
  }
});

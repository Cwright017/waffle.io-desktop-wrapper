'use strict';
import { ipcMain, app, Menu, Tray, BrowserWindow } from 'electron';
import fetch from 'node-fetch';
const environment = process.env.NODE_ENV || 'production';

let mainWindow;
let appIcon;
let projectName;
let headers;

function clearBadge() {
  appIcon.setTitle('');
  app.dock.setBadge('');
}

function focusWindow() {
  mainWindow.focus();
}

function hideWindow() {
  mainWindow.hide();
  appIcon.setImage(`${__dirname}/images/hidden.png`);
}

function showWindow() {
  mainWindow.show();
  mainWindow.focus();
  appIcon.setImage(`${__dirname}/images/visible.png`);
}

function getPullRequests() {
  fetch(`https://api.waffle.io/${projectName}/cards`, { headers })
  .then((res) => res.json())
  .then((json) =>
    json.filter((item) => item.githubMetadata.pull_request && item.githubMetadata.state === 'open'))
  .then((res) => {
    if (res.length > 0) {
      appIcon.setTitle(res.length.toString());
      app.dock.setBadge(res.length.toString());
    } else {
      clearBadge();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 800, height: 600, alwaysOnTop: false, frame: false });
  mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  mainWindow.maximize();
  mainWindow.setResizable(false);

  appIcon = new Tray(`${__dirname}/images/visible.png`);

  setInterval(() => {
    if (projectName) {
      getPullRequests();
    }
  }, 5000);

  const template = [
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    const name = app.getName();
    template.unshift({
      label: name,
      submenu: [
        {
          label: `About ${name}`,
          role: 'about',
        },
        {
          type: 'separator',
        },
        {
          label: 'Services',
          role: 'services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          label: `Hide ${name}`,
          accelerator: 'Command+H',
          role: 'hide',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers',
        },
        {
          label: 'Show All',
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => app.quit(),
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Hide Window', click: () => hideWindow() },
  ]);

  appIcon.setToolTip('Waffle.io');
  appIcon.on('click', () => {
    if (mainWindow.isVisible()) {
      focusWindow();
    } else {
      showWindow();
    }
  });

  appIcon.on('right-click', () => {
    appIcon.popUpContextMenu(contextMenu);
  });

  if (environment === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const filter = {
    urls: ['https://api.waffle.io/*'],
  };

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    if (details.requestHeaders.Authorization) {
      headers = details.requestHeaders;
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    showWindow();
  }
});

ipcMain.on('project-changed', (event, data) => {
  clearBadge();
  projectName = data.title;
});

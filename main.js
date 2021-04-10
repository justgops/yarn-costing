const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');
const server = require(path.resolve(__dirname, 'server.js'));
const migrate = require(path.resolve(__dirname, 'db', 'migrate.js'));

function createWindow () {
  // Create the browser window.
  let mainWin = new BrowserWindow({
    minWidth: 1200,
    minHeight: 750,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false,
    },
    backgroundColor: '#fff'
  });

  var template = [
    {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
        { label: "Toggle Dev tools", click: function() { mainWin.webContents.toggleDevTools();}}
    ]}
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  globalShortcut.register('CommandOrControl+R', function() {
		mainWin.reload()
  });

  migrate.run();
  app.server = server();

  // and load the index.html of the app.
  mainWin.loadURL('http://localhost:8787/');
}

app.on('ready', createWindow)
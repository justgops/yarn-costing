const { app, BrowserWindow, Menu, globalShortcut, dialog } = require('electron');
const path = require('path');
const server = require(path.resolve(__dirname, 'server.js'));
const migrate = require(path.resolve(__dirname, 'db', 'migrate.js'));
const getPort = require('get-port');

function createWindow () {
  // Create the browser window.
  let mainWin = new BrowserWindow({
    minWidth: 1200,
    minHeight: 750,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false,
    },
    backgroundColor: '#fff',
    show: false
  });
  mainWin.maximize();

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

  if(app.isPackaged) {
    mainWin.setMenu(null);
  }
  mainWin.loadFile(path.resolve(__dirname,'loading.html'));
  mainWin.show();

  globalShortcut.register('CommandOrControl+R', function() {
		mainWin.reload()
  });
  globalShortcut.register('Control+Shift+D', function() {
		mainWin.webContents.openDevTools({mode: 'detach'});
  });

  migrate.run();
  getPort({port: getPort.makeRange(8000, 8999)})
  .then((port)=>{
    app.server = server(port);
    // and load the index.html of the app.
    mainWin.loadURL(`http://localhost:${port}/`);
  }).catch((err)=>{
    dialog.showErrorBox('Failed', 'Failed to start app -' + err.stack);
  });
}

app.on('ready', createWindow)
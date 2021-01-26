const electron = require('electron')
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const { Menu,ipcMain } =  require('electron');
const path = require('path')
const url = require('url')
/*console.log(Menu);*/
let subWindow;
//控制菜单栏
const template = [
    {
        label: '文件',
        submenu: [
            { role: 'quit' }
        ]
    },
    {
        label: '设置',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: '关于',
        submenu: [
            {
                label: '求助',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://electronjs.org')
                }
            },{
                label: '版本号',
                click: ()=>{
                    subWindow = new BrowserWindow({
                        width:300,
                        height:300,
                        webPreferences: {
                            nodeIntegration: true,
                        },
                        title:'版本号',
                        modal:true,
                        autoHideMenuBar:true,
                       // resizable:false
                    });
                    subWindow.loadURL(url.format({
                        pathname: path.join(__dirname, 'version.html'),
                        protocol: 'file:',
                        slashes: true
                    }));

                    subWindow.on('close',()=>{
                        subWindow = null;
                    })
                }
        }
        ]
    },

]

/*组件通信*/
ipcMain.on('closeWindow',(event,arg)=>{
    alert('收到');
    subWindow.close();
});


//const menu = Menu.buildFromTemplate(template);
//Menu.setApplicationMenu(menu);



// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow


console.log('node:',process.versions.node);
console.log('electron:',process.versions.electron);
console.log('node_modules:',process.versions.modules);

app.allowRendererProcessReuse = false;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
           // preload: path.join(__dirname, 'preload.js')
        },
        title:'45002上位机软件（AE版-V1.0）'
    })

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    mainWindow.onbeforeunload = (e) => {
        console.log('I do not want to be closed')

        // 与通常的浏览器不同,会提示给用户一个消息框,
        //返回非空值将默认取消关闭
        //建议使用对话框 API 让用户确认关闭应用程序.
        e.returnValue = false // 相当于 `return false` ，但是不推荐使用
    }

}


// This method will be called when Electron has finished

// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    app.quit()
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
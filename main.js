const electron = require("electron");
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const process = require("process");

const Config = require("electron-config");
const config = new Config();
const { ipcMain, ipcRenderer } = require("electron");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow,
  winsize = config.get("winsize"),
  winWidth = 0,
  winHeight = 0,
  itemsarr,
  todos = config.get("todo-list"),
  isOnTop = config.get("is-on-top"),
  nextId = config.get("next-id"),
  sentItems = {},
  icon_filename = "",
  // settings
  text_notifications = config.get("text-notifications"),
  email_notifications = config.get("email-notifications");

const createWindow = () => {
  // Create the browser window.
  winWidth = winsize ? config.get("winsize.width") : 800;
  winHeight = winsize ? config.get("winsize.height") : 600;
  itemsarr = todos !== undefined && todos.length > 0 ? todos : [];
  isOnTop = isOnTop !== undefined ? isOnTop : false;
  nextId = nextId && itemsarr.length > 0 ? nextId : 0;
  icon_filename = process.platform === "darwin" ? "icon.png" : "icon.icns";

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth: 300,
    minHeight: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: isOnTop,
    icon: path.join(__dirname, "src", "icons", icon_filename)
  });
  mainWindow.component_type = "app";
  mainWindow.setResizable(true);
  // un-comment this if you like to keep the same aspect ratio when
  // mainWindow.setAspectRatio(1.3)
  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true
    })
  );
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  if (process.env.ELECTRON_ENABLE_LOGGING) {
    // Set ReactDevTools location based on OS
    let extension_path = "";
    if (process.platform === "darwin") {
      extension_path = path.join(
        "/Users",
        "acjanus",
        "Library",
        "Application Support",
        "Google",
        "Chrome",
        "Default",
        "Extensions",
        "fmkadmapgofadopljbjfkapdkoienihi",
        "2.1.9_0"
      );
    } else {
      extension_path = path.join(
        "C:",
        "Users",
        "Antoinette",
        "AppData",
        "Local",
        "Google",
        "Chrome",
        "User Data",
        "Default",
        "Extensions",
        "fmkadmapgofadopljbjfkapdkoienihi",
        "2.1.9_0"
      );
    }
    BrowserWindow.addDevToolsExtension(extension_path);
  }
  createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("minimize", function(event, args) {
  mainWindow.minimize();
});

ipcMain.on("new-window", function(event, args) {
  // var win = new BrowserWindow({width: 800, height: 600, frame: false, transparent: true})
  var win = new BrowserWindow({
    width: 400,
    height: 350,
    frame: false,
    transparent: true
  });
  // and load the index.html of the app.
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true
    })
  );
  win.component_type = args.type;
  // win.webContents.openDevTools();
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
});

ipcMain.on("get-items", (event, args) => {
  sentItems = {
    todoItems: itemsarr,
    nextId: nextId
  };
  event.sender.send("send-items", sentItems);
});

ipcMain.on("add-to-do", (event, args) => {
  args.completeDate = null;
  itemsarr.push(args);
  nextId = itemsarr.length === 0 ? 1 : args.id + 1;
  config.set("next-id", nextId);
  sentItems.nextId = nextId;
  sentItems.todoItems = itemsarr;
  config.set("todo-list", itemsarr);
  event.sender.send("send-items", sentItems);
});

ipcMain.on("completed-action", (event, args) => {
  itemsarr.filter((item, index) => {
    if (item.id === args) {
      itemsarr[index].complete = !itemsarr[index].complete;
      itemsarr[index].completeDate = itemsarr[index].complete ? new Date() : null;
      sentItems.todoItems = itemsarr;
      sentItems.updateType = "complete";
      config.set("todo-list", itemsarr);
      event.sender.send("item-action", sentItems);
    }
  });
});

ipcMain.on("update-prefs", (event, args) => {
  // console.log(args)
  // makeAPICall("POST", "/user/add", function(resp){
  //   console.log(resp)
  // }, function(err){
  //   console.log(err)
  // }, args);
});

ipcMain.on("updated-details", (event, args) => {
  itemsarr.filter((item, index) => {
    if (item.id === args.id) {
      itemsarr[index].details = args.details;
      sentItems.todoItems = itemsarr;
      sentItems.updateType = "set-details";
      config.set("todo-list", itemsarr);
      event.sender.send("set-details", sentItems);
    }
  });
});
//  Delete all tasks on click
ipcMain.on("delete-tasks", (event, args) => {
  itemsarr = [];
  config.set("todo-list", itemsarr);
  sentItems = {
    todoItems: itemsarr,
    nextId: nextId
  };
  event.sender.send("send-items", sentItems);
});
// Reset all tasks
ipcMain.on("reset-tasks", (event, args) => {
  itemsarr.forEach(item => {
    item.complete = false;
    item.completeDate = null;
  });
  config.set("todo-list", itemsarr);
  sentItems = {
    todoItems: itemsarr,
    nextId: nextId
  };
  event.sender.send("reset-all", sentItems);
});

// Resets only tasks that are old
ipcMain.on("reset-old-tasks", (event, args) => {
  if (itemsarr.length > 0) {
    var today_date_in_sec = new Date().getTime() / 1000;
    var today_date_in_days = today_date_in_sec / 60 / 60 / 24;
    itemsarr.forEach(item => {
      if (item.completeDate !== null) {
        var item_date_in_sec = item.completeDate.getTime() / 1000;
        var item_date_in_days = item_date_in_sec / 60 / 60 / 24;
        if (
          today_date_in_days - item_date_in_days > 0 &&
          today_date_in_sec - item_date_in_sec > 5
        ) {
          item.complete = false;
          item.completeDate = null;
        }
      }
    });
  }

  config.set("todo-list", itemsarr);
  sentItems = {
    todoItems: itemsarr,
    nextId: nextId
  };
  event.sender.send("reset-all", sentItems);
});

ipcMain.on("delete-item", (event, args) => {
  itemsarr.filter((item, index) => {
    if (item.id === args.id) {
      itemsarr.splice(index, 1);
      config.set("todo-list", itemsarr);
      sentItems.todoItems = itemsarr;
      sentItems.updateType = "delete";
      event.sender.send("send-items", sentItems);
    }
  });
});
ipcMain.on("app-on-top", (event, args) => {
  isOnTop = !isOnTop;
  config.set("is-on-top", isOnTop);
  mainWindow.setAlwaysOnTop(isOnTop);
  event.sender.send("send-top-status", isOnTop);
});
ipcMain.on("get-top-status", function(event, args) {
  event.sender.send("send-top-status", isOnTop);
});

ipcMain.on("app-close", (event, args) => {
  winHeight = mainWindow.getSize()[1];
  winWidth = mainWindow.getSize()[0];
  config.set("winsize.height", winHeight);
  config.set("winsize.width", winWidth);
  config.set("todo-list", itemsarr);
  app.quit();
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// FIREBASE API SETUP FOR REUSABLE FUNCTION
function makeAPICall(type, endpoint, success_fn, error_fn, params = null) {
  var xhr = new XMLHttpRequest(),
    method = type,
    url = (fullUrl = "https://daily-todo-150e4.firebaseio.com/" + endpoint),
    params_as_query_string = "",
    params_to_send_with_request = {};
  params = params ? params : [];

  for (var i = 0; i < params.length; i++) {
    params_as_query_string += i === 0 ? "?" : "&";
    params_as_query_string += params[i].key;
    params_as_query_string += "=" + params[i].value;
  }
  fullUrl += params_as_query_string;

  xhr.open(method, fullUrl, true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        var parsed_JSON = JSON.parse(xhr.responseText).entity;
        success_fn(parsed_JSON);
      } else {
        error_fn({
          status: xhr.status,
          response: JSON.parse(xhr.responseText)
        });
      }
    }
  };
  if (/POST/gi.test(type)) {
    for (var i = 0; i < params.length; i++) {
      params_to_send_with_request[params[i].key] = params[i].value;
    }
    params_to_send_with_request = JSON.stringify(params_to_send_with_request);
  }
  xhr.send(params_to_send_with_request);
}

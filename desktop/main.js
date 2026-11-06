// Centrika OnePortal for Windows and Mac.
//
// A desktop window onto the live OnePortal (https://oneportal.centrika.rw), so staff keep using the
// same accounts and data, and every OnePortal update reaches the app without reinstalling.
// It opens when the computer starts (like Discord), lives in the tray / menu bar when its window is
// closed, and only one copy runs at a time.

const { app, BrowserWindow, Menu, Tray, nativeImage, shell, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const APP_URL = process.env.ONEPORTAL_URL || "https://oneportal.centrika.rw";
const APP_ORIGIN = new URL(APP_URL).origin;
const PARTITION = "persist:oneportal"; // keeps people signed in between restarts
const isMac = process.platform === "darwin";

let win = null;
let tray = null;
let quitting = false;

// ---------- small settings file (window size, whether we've set up "open at login") ----------
const settingsFile = () => path.join(app.getPath("userData"), "settings.json");
function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
  } catch {
    return {};
  }
}
function writeSettings(patch) {
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify({ ...readSettings(), ...patch }, null, 2));
  } catch {
    // Not being able to remember the window size isn't worth failing over
  }
}

// ---------- one copy only: opening it again just brings the window forward ----------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => showWindow());
}

app.setAppUserModelId("rw.centrika.oneportal"); // Windows: notifications and taskbar grouping

// ---------- open at login ----------
function openAtLogin() {
  return app.getLoginItemSettings().openAtLogin;
}
function setOpenAtLogin(enabled) {
  app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: false });
  writeSettings({ openAtLogin: enabled });
  buildTrayMenu();
}

// ---------- the window ----------
function createWindow() {
  const saved = readSettings().bounds;
  win = new BrowserWindow({
    width: saved?.width ?? 1320,
    height: saved?.height ?? 860,
    x: saved?.x,
    y: saved?.y,
    minWidth: 380,
    minHeight: 560,
    show: false,
    title: "Centrika OnePortal",
    backgroundColor: "#FFFAE8",
    icon: path.join(__dirname, "build", "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      partition: PARTITION,
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });
  if (saved?.maximized) win.maximize();

  // Lets OnePortal know it's running in the desktop app (e.g. for desktop-only features later)
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} OnePortalDesktop/${app.getVersion()}`);

  win.once("ready-to-show", () => win.show());
  win.loadURL(APP_URL);

  // No internet / server unreachable: a friendly page that keeps retrying
  win.webContents.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3) return; // -3: navigation was replaced, not a failure
    win.loadFile(path.join(__dirname, "offline.html"), { query: { url: url && url.startsWith(APP_ORIGIN) ? url : APP_URL } });
  });

  // Links to other sites open in the normal browser; OnePortal's own pop-ups (e.g. viewing a file) stay in the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_ORIGIN) || url.startsWith("blob:") || url === "about:blank") {
      return { action: "allow", overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: path.join(__dirname, "build", "icon.png") } };
    }
    if (/^(https?|mailto|tel):/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (url.startsWith(APP_ORIGIN) || url.startsWith("file:")) return;
    e.preventDefault();
    if (/^(https?|mailto|tel):/.test(url)) shell.openExternal(url);
  });

  // Closing the window keeps OnePortal running (tray / menu bar), like Discord. Quit from the tray menu.
  win.on("close", (e) => {
    const maximized = win.isMaximized();
    writeSettings({ bounds: { ...(maximized ? readSettings().bounds : win.getBounds()), maximized } });
    if (!quitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function showWindow() {
  if (!win) return createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

// ---------- tray (Windows) / menu bar (Mac) ----------
function buildTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open OnePortal", click: showWindow },
      { label: "Reload", click: () => win && win.loadURL(APP_URL) },
      { type: "separator" },
      { label: "Open when my computer starts", type: "checkbox", checked: openAtLogin(), click: (item) => setOpenAtLogin(item.checked) },
      { type: "separator" },
      { label: "Quit OnePortal", click: () => { quitting = true; app.quit(); } },
    ]),
  );
}

function createTray() {
  const file = isMac ? "trayTemplate.png" : "tray.png";
  const image = nativeImage.createFromPath(path.join(__dirname, "build", file));
  if (isMac) image.setTemplateImage(true);
  tray = new Tray(image);
  tray.setToolTip("Centrika OnePortal");
  buildTrayMenu();
  // Windows: clicking the tray icon shows or hides the window
  if (!isMac) tray.on("click", () => (win && win.isVisible() && win.isFocused() ? win.hide() : showWindow()));
}

// ---------- app menu: keeps copy/paste, reload and zoom shortcuts working (essential on Mac) ----------
function createMenu() {
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => win && win.webContents.reload() },
        { label: "Go to dashboard", accelerator: "CmdOrCtrl+Shift+H", click: () => win && win.loadURL(APP_URL) },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------- permissions: notifications and clipboard; nothing else ----------
function setPermissions() {
  const allowed = new Set(["notifications", "clipboard-sanitized-write", "fullscreen"]);
  const s = session.fromPartition(PARTITION);
  s.setPermissionRequestHandler((wc, permission, callback) => {
    callback(allowed.has(permission) && wc.getURL().startsWith(APP_ORIGIN));
  });
}

app.whenReady().then(() => {
  // First run of the installed app: open at login by default (HR's request). People can turn it off
  // from the tray menu. Never while developing, so a development copy doesn't register itself.
  if (app.isPackaged && readSettings().openAtLogin === undefined) setOpenAtLogin(true);
  setPermissions();
  createMenu();
  createWindow();
  createTray();
  app.on("activate", showWindow); // Mac: clicking the Dock icon
});

app.on("before-quit", () => {
  quitting = true;
});

// The app keeps running in the tray when its window is closed
app.on("window-all-closed", () => {});

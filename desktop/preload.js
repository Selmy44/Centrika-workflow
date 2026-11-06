// Runs before OnePortal's page in the desktop app. Only tells the page it's in the desktop app;
// it gives the page no access to the computer.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("onePortalDesktop", { isDesktop: true, platform: process.platform });

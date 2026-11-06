// Smoke test: starts the app, waits for OnePortal to load, saves a picture of the window and quits.
// Run with: npx electron scripts/smoke.js <output.png>
const { app } = require("electron");
const fs = require("node:fs");
const out = process.argv[process.argv.length - 1];

app.on("browser-window-created", (_e, win) => {
  win.webContents.once("did-finish-load", () => {
    setTimeout(async () => {
      const image = await win.webContents.capturePage();
      fs.writeFileSync(out, image.toPNG());
      console.log(JSON.stringify({ url: win.webContents.getURL(), title: win.getTitle(), userAgent: win.webContents.getUserAgent().split(" ").pop() }));
      app.exit(0);
    }, 4000);
  });
});
setTimeout(() => app.exit(1), 40_000);
require("../main.js");

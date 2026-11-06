# Centrika OnePortal: desktop app (Windows and Mac)

A desktop window onto the live OnePortal at **https://oneportal.centrika.rw**. Staff sign in with their usual
OnePortal account. Every OnePortal update shows up in the app automatically; the app itself only needs
reinstalling when this desktop shell changes.

What it does:
- **Opens when the computer starts** (turned on the first time it runs). Each person can turn this off from the
  tray / menu-bar icon: *Open when my computer starts*.
- **Closing the window keeps it running** in the system tray (Windows, bottom right) or menu bar (Mac, top right),
  like Discord. *Quit OnePortal* in that menu closes it completely.
- **Only one copy runs.** Opening it again brings the window forward.
- Stays signed in between restarts (subject to OnePortal's normal sign-in rules).
- Shows a "Can't reach OnePortal" page when there's no internet, and reconnects by itself.
- Links to other websites open in the normal browser. Downloads (PDF, CSV) and printing work as usual.

## Installers

Built into `dist/`:

| | File |
|---|---|
| Windows 10 / 11 (64-bit) | `Centrika-OnePortal-Setup-1.0.0.exe` |
| Mac (Intel and Apple silicon) | `Centrika-OnePortal-1.0.0-mac.dmg` |

### Installing on Windows
1. Run `Centrika-OnePortal-Setup-1.0.0.exe`. No administrator rights are needed; it installs for the signed-in user
   and opens straight away, with a desktop and Start-menu shortcut.
2. The installer isn't code-signed yet, so Windows may show **"Windows protected your PC"**. Click
   **More info → Run anyway**.

Installing on many PCs without clicks: `Centrika-OnePortal-Setup-1.0.0.exe /S` (silent).

### Installing on a Mac
1. Open the `.dmg` and drag **Centrika OnePortal** into **Applications**.
2. The app isn't notarised by Apple yet, so the first time, macOS blocks it. Open **System Settings → Privacy &
   Security**, scroll down and click **Open Anyway** next to "Centrika OnePortal". (On older macOS: right-click the
   app → **Open** → **Open**.) After that it opens normally, including at login.

## Building the installers

```sh
npm install
npm run dist:win   # Windows installer
npm run dist:mac   # Mac installer (universal)
```

`npm start` runs it for development (it won't register itself to open at login while developing).
To point it at another OnePortal (e.g. a test server): `ONEPORTAL_URL=https://… npm start`.

## Next steps (not done yet)
- **Code signing**, so Windows and macOS stop warning on install: a Windows code-signing certificate, and an
  Apple Developer account ($99/year) for notarisation.
- **Automatic updates of the desktop app itself** (OnePortal's content already updates on its own).
- Desktop notifications for deadline alerts, approvals and the 08:45 clock-in reminder.

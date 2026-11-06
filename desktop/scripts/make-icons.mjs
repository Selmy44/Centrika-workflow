// Builds the app and tray icons from the Centrika logo (build/logo-source.png): the three squares
// with "Centrika", without the tagline underneath.
import sharp from "sharp";

const source = new URL("../build/logo-source.png", import.meta.url).pathname;
const logo = await sharp(source).extract({ left: 185, top: 0, width: 505, height: 492 }).trim().png().toBuffer();
const out = (name) => new URL(`../build/${name}`, import.meta.url).pathname;

// App icon: the logo on a white rounded tile, 1024px (electron-builder makes .ico and .icns from it)
const size = 1024;
const pad = 190;
const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect x="40" y="40" width="${size - 80}" height="${size - 80}" rx="200" fill="#ffffff"/></svg>`);
const mark = await sharp(logo).resize(size - pad * 2, size - pad * 2, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp(tile).composite([{ input: mark, gravity: "center" }]).png().toFile(out("icon.png"));

// Windows tray: the colour logo, small
for (const s of [16, 32]) {
  await sharp(logo).resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out(s === 16 ? "tray.png" : "tray@2x.png"));
}

// Mac menu bar: a black "template" image that macOS recolours for light and dark mode. The three
// overlapping squares as outlines (filled squares would merge into one blob in a single colour).
const template = (s) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 18 18">
  <g fill="none" stroke="#000" stroke-width="1.4">
    <rect x="1.7" y="6.2" width="8.4" height="10.1"/>
    <rect x="5.2" y="3.7" width="8.2" height="8.2"/>
    <rect x="8.4" y="1.7" width="7.9" height="7.9"/>
  </g></svg>`);
for (const [s, name] of [[18, "trayTemplate.png"], [36, "trayTemplate@2x.png"]]) {
  await sharp(template(s)).png().toFile(out(name));
}
console.log("icons written to build/");

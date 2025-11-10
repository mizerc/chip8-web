// buildRomListJsonFile.js
// This script builds a JSON file that contains a list of all the ROMs in the roms folder.
// The JSON file is used to populate the ROM selector in the HTML file.

import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicFolder = path.join(__dirname, "../public");
const romsFolder = path.join(__dirname, "../public/roms");
const roms = fs.readdirSync(romsFolder).filter((file) => file.endsWith(".ch8"));

const romList = roms.map((rom) => ({
  name: rom,
  path: `/roms/${rom}`,
}));

fs.writeFileSync(`${publicFolder}/romList.json`, JSON.stringify(romList, null, 2));
console.log("ROM list JSON file built successfully");
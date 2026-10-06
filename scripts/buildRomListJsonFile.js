/**
 * This script scans the ROMs folder and generates a JSON file containing the list of ROMs.
 * The generated JSON file is saved in the public folder as romList.json.
 * Later the HTML file can use this JSON file to populate the ROM DOM selector.
 */

import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

// READ FROM ROMS FOLDER
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicFolder = path.join(__dirname, "../public");
const romsFolder = path.join(__dirname, "../public/roms");
const romFilenames = fs
  .readdirSync(romsFolder)
  .filter((file) => file.endsWith(".ch8"));

// TRANSFORM TO JSON
const romList = romFilenames.map((filename) => ({
  name: filename,
  path: `/roms/${filename}`,
}));

// WRITE JSON
fs.writeFileSync(
  `${publicFolder}/romList.json`,
  JSON.stringify(romList, null, 2),
);

// BYE
console.log("Done;");

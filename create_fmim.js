const fs = require("fs");

if (!fs.existsSync("./mindex")) fs.mkdirSync("./mindex");

const wmaFile = fs.readFileSync("./test_audio.wma");

const fmimFile = Buffer.alloc(3336 + wmaFile.byteLength);
let fmimOffset = 0;

fmimFile.write("FMIM", fmimOffset); fmimOffset += 4; // Magic
fmimFile.writeBigUInt64BE(0x0000000100010001n, fmimOffset); fmimOffset += 8; // Unknown
fmimOffset += 1; // x360 music organizer does this but i suspect its wrong???????
fmimFile.write("Test", fmimOffset, "utf-16le"); fmimOffset += 512; // Track
// fmimFile.write("Album", fmimOffset, "utf-16le"); fmimOffset += 512; // Album
fmimFile.write("Artist", fmimOffset, "utf-16le"); fmimOffset += 512; // Artist
// fmimFile.write("Artist", fmimOffset, "utf-16le"); fmimOffset += 512; // Artist (?)
// fmimFile.write("Genre", fmimOffset, "utf-16le"); fmimOffset += 512; // Genre
// fmimFile.write("Genre", fmimOffset, "utf-16le"); fmimOffset += 512; // Genre (?)
// fmimFile.writeUInt32LE(281000, fmimOffset); fmimOffset += 4; // Track length (ms)
// fmimFile.writeUInt32LE(1, fmimOffset); fmimOffset += 4; // Track number (starts from 1)
fmimOffset += 243; // Unknown - meant to be 244
wmaFile.copy(fmimFile, fmimOffset); fmimOffset += wmaFile.byteLength;

fs.mkdirSync("./mindex/media/0000", { recursive: true });
fs.writeFileSync("./mindex/media/0000/0008", fmimFile);
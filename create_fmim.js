const fs = require("fs");
const cp = require("child_process");

if (!fs.existsSync("./mindex")) fs.mkdirSync("./mindex");

const wmaFile = fs.readFileSync("./test_audio.wma");

const fmimFile = Buffer.alloc(3336 + wmaFile.byteLength);

let offset = 0;
fmimFile.write("FMIM", offset); offset += 4; // Magic
fmimFile.writeBigUInt64BE(0x0000000100010001n, offset); offset += 8; // Unknown
offset += 1; // x360 music organizer does this but i swear its wrong???????
fmimFile.write("This is the name of the track", offset, "utf-16le"); offset += 512; // Track
fmimFile.write("This is the name of the album", offset, "utf-16le"); offset += 512; // Album
fmimFile.write("This is the name of the artist", offset, "utf-16le"); offset += 512; // Artist
fmimFile.write("This is the name of the artist", offset, "utf-16le"); offset += 512; // Artist (?)
fmimFile.write("This is the name of the genre", offset, "utf-16le"); offset += 512; // Genre
fmimFile.write("This is the name of the genre", offset, "utf-16le"); offset += 512; // Genre (?)
fmimFile.writeUInt32LE(69000, offset); offset += 4; // Track length (ms)
fmimFile.writeUInt32LE(69, offset); offset += 4; // Track number (starts from 1)
offset += 243; // Unknown - meant to be 244
wmaFile.copy(fmimFile, offset); offset += wmaFile.byteLength;

fs.mkdirSync("./mindex/media/0000", { recursive: true });
fs.writeFileSync("./mindex/media/0000/0000", fmimFile);
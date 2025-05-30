const fs = require("fs");

const mindexTemplate = Buffer.from(require("./mindex.js"));

if (!fs.existsSync("./mindex")) fs.mkdirSync("./mindex");

const mindexFile = Buffer.alloc(6603);
let mindexOffset = 0;

mindexTemplate.copy(mindexFile, mindexOffset);

const album = Buffer.alloc(82);
album.write("Album", 0, "utf-16le");

const title = Buffer.alloc(82);
title.write("Test", 0, "utf-16le");

const artist = Buffer.alloc(82);
artist.write("Artist", 0, "utf-16le");

const genre = Buffer.alloc(82);
genre.write("Genre", 0, "utf-16le");

album.copy(mindexFile, 4217);
title.copy(mindexFile, 4817);
artist.copy(mindexFile, 5417);
genre.copy(mindexFile, 6017);
// mindexFile.write("A album", 1079, "utf-16le");
// mindexFile.write("Test", 4817, "utf-16le");
// mindexFile.write("A artist", 5417, "utf-16le");
// mindexFile.write("A genre", 6017, "utf-16le");
mindexFile.writeUIntBE(281000 * 2, 4944, 3);

fs.writeFileSync("./mindex/mindex.xmi", mindexFile);
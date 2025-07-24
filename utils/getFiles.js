const fs = require("fs");
const path = require("path");

function getFiles(dir) {
    const files = [];

    (function readDir(dirPath = dir) {
        const dirFiles = fs.readdirSync(dirPath);
        for (const file of dirFiles) {
            const filePath = path.resolve(dirPath, file);
            
            if (fs.statSync(filePath).isDirectory()) {
                readDir(filePath);
            } else {
                files.push(filePath);
            }
        }
    })();

    return files;
};

module.exports = getFiles;
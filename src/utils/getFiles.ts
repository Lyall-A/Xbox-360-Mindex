import fs from 'fs';
import path from 'path';

export default function getFiles(dir: string) {
    const files: string[] = [];

    (function readDir(dirPath = dir) {
        const dirFiles = fs.readdirSync(dirPath);
        for (const file of dirFiles) {
            const filePath = path.join(dirPath, file);
            
            if (fs.statSync(filePath).isDirectory()) {
                readDir(filePath);
            } else {
                files.push(filePath);
            }
        }
    })();

    return files;
};
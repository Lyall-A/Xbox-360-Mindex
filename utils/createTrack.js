const path = require("path");
const child_process = require("child_process");

const config = require("../config.json");

function createTrack(trackPath, wmaPath) {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = child_process.spawn(config.ffmpegPath, [
            "-i", trackPath,
            "-c:a", "wmav2",
            "-b:a", "192k",
            "-ar", "44100",
            "-compression_level", "0",
            "-ac", "2",
            "-vn",
            "-y",
            wmaPath
        ]);
    
        const ffmpegOutputBufferArray = [];
    
        ffmpegProcess.stderr.on("data", data => ffmpegOutputBufferArray.push(...data));
    
        ffmpegProcess.on("exit", async (code) => {
            const ffmpegOutput = Buffer.from(ffmpegOutputBufferArray).toString();
            
            if (code !== 0) return reject(`FFmpeg closed with code ${code}! FFmepg output: ${ffmpegOutput}`);
            
            const durationMatch = ffmpegOutput.match(/duration: ([\d.]+):([\d.]+):([\d.]+)/i);

            const track = {
                trackPath: trackPath,
                wmaPath: wmaPath,
                title: ffmpegOutput.match(/(?<=title           : ).*/i)?.[0] || config.defaultTitle || path.basename(trackPath, path.extname(trackPath)),
                artist: ffmpegOutput.match(/(?<=artist          : ).*/i)?.[0] || config.defaultArtist,
                album: ffmpegOutput.match(/(?<=album           : ).*/i)?.[0] || config.defaultAlbum,
                genre: ffmpegOutput.match(/(?<=genre           : ).*/i)?.[0] || config.defaultGenre,
                track: parseInt(ffmpegOutput.match(/(?<=track           : ).*/i)?.[0]) || 1,
                length: parseFloat(durationMatch[1]) * 3600000 + parseFloat(durationMatch[2]) * 60000 + parseFloat(durationMatch[3]) * 1000
            };
            track.formattedTitle = config.titleFormat
                    .replace(/{title}/g, track.title || "")
                    .replace(/{artist}/g, track.artist || "")
                    .replace(/{album}/g, track.album || "")
                    .replace(/{genre}/g, track.genre || "")
                    .replace(/{track}/g, track.track || "");

            return resolve(track);
        });
    });
};

module.exports = createTrack;
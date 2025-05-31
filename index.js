const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const createMindexBuffer = require("./utils/createMindexBuffer");
const createFmimBuffer = require("./utils/createFmimBuffer");

const config = require("./config.json");

const tracks = fs.readdirSync(config.tracksPath).filter(file => !fs.statSync(path.join(config.tracksPath, file)).isDirectory()).map(file => ({ path: path.resolve(config.tracksPath, file) }));
// const tracks = fs.readdirSync(tracksPath).filter(file => supportedFormats.includes(path.extname(file).toLowerCase().substring(1))).map(file => ({ path: path.resolve(config.tracksPath, file) }));

const fmimPath = path.join(config.mindexOutput, "media/0000");
if (fs.existsSync(config.mindexOutput)) fs.renameSync(config.mindexOutput, `${config.mindexOutput}_${Date.now()}`);
if (!fs.existsSync(fmimPath)) fs.mkdirSync(fmimPath, { recursive: true });

(function convertTrack(trackIndex) {
    const track = tracks[trackIndex];
    const wmaPath = path.join(config.tracksPath, `temp/${path.basename(track.path, path.extname(track.path))}.wma`);
    if (!fs.existsSync(path.dirname(wmaPath))) fs.mkdirSync(path.dirname(wmaPath), { recursive: true });
    
    console.log(`Converting track ${trackIndex + 1} of ${tracks.length} (${path.basename(track.path)})...`);

    const ffmpegProcess = cp.spawn(config.ffmpegPath, [
        "-i", track.path,
        "-c:a", "wmav2",
        "-b:a", "192k",
        "-ar", "44100",
        "-compression_level", "0",
        "-ac", "2",
        "-vn",
        ...(config.pipeOutput ? [
            // Output to pipe (doesn't work)
            "-f", "asf",
            "-"
        ] : [
            // Output as file
            "-y",
            wmaPath
        ]),
    ]);

    const ffmpegOutputBufferArray = [];
    const wmaBufferArray = [];

    ffmpegProcess.stderr.on("data", data => ffmpegOutputBufferArray.push(...data));
    ffmpegProcess.stdout.on("data", data => wmaBufferArray.push(...data));

    ffmpegProcess.on("exit", exitCode => {
        const ffmpegOutput = Buffer.from(ffmpegOutputBufferArray).toString();
        const wmaBuffer = Buffer.from(wmaBufferArray);

        const durationMatch = ffmpegOutput.match(/duration: ([\d.]+):([\d.]+):([\d.]+)/i);

        if (exitCode !== 0) {
            if (!config.pipeOutput) fs.rmSync(wmaPath);
            return console.log(`Failed to convert track! FFmpeg log:\n${ffmpegOutput}`);
        }

        if (!durationMatch) {
            if (!config.pipeOutput) fs.rmSync(wmaPath);
            return console.log("Failed to get track duration!");
        }

        track.title = ffmpegOutput.match(/(?<=title           : ).*/i)?.[0] || config.defaultTitle || path.basename(track.path, path.extname(track.path));
        track.artist = ffmpegOutput.match(/(?<=artist          : ).*/i)?.[0] || config.defaultArtist;
        track.album = ffmpegOutput.match(/(?<=album           : ).*/i)?.[0] || config.defaultAlbum;
        track.genre = ffmpegOutput.match(/(?<=genre           : ).*/i)?.[0] || config.defaultGenre;
        track.track = parseInt(ffmpegOutput.match(/(?<=track           : ).*/i)?.[0]) || 1;
        track.length = parseFloat(durationMatch[1]) * 3600000 + parseFloat(durationMatch[2]) * 60000 + parseFloat(durationMatch[3]) * 1000;
        track.formattedTitle = config.titleFormat.replace(/{title}/g, track.title || "").replace(/{artist}/g, track.artist || "").replace(/{album}/g, track.album || "").replace(/{genre}/g, track.genre || "").replace(/{track}/g, track.track || "");

        const fmimBuffer = createFmimBuffer(config.pipeOutput ? wmaBuffer : fs.readFileSync(wmaPath), track);
        fs.writeFileSync(path.join(fmimPath, (!trackIndex ? 8 : 10 + trackIndex).toString(16).padStart(4, "0").toUpperCase()), fmimBuffer);
        if (!config.pipeOutput) fs.rmSync(wmaPath);

        if (tracks[++trackIndex]) {
            return convertTrack(trackIndex);
        } else {
            console.log(`Generating mindex.xmi file...`);
            const mindexBuffer = createMindexBuffer(config.albumTitle, config.artistTitle, config.genreTitle, tracks);
            fs.writeFileSync(path.join(config.mindexOutput, "mindex.xmi"), mindexBuffer);
        }
    });
})(0);
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const createMindexBuffer = require("./utils/createMindexBuffer");
const createFmimBuffer = require("./utils/createFmimBuffer");

const {
    albumTitle,
    artistTitle,
    genreTitle,
    titleFormat,
    ffmpegPath,
    tracksPath,
    mindexOutput,
    supportedFormats,
    pipeOutput // pipe doesn't work btw
} = require("./config.json");

const tracks = fs.readdirSync(tracksPath).filter(file => supportedFormats.includes(path.extname(file).toLowerCase().substring(1))).map(file => ({ path: path.resolve(tracksPath, file) }));

const fmimPath = path.join(mindexOutput, "media/0000");
if (fs.existsSync(mindexOutput)) fs.rmSync(mindexOutput, { recursive: true, force: true });
if (!fs.existsSync(fmimPath)) fs.mkdirSync(fmimPath, { recursive: true });

(function convertTrack(trackIndex) {
    const track = tracks[trackIndex];
    const wmaPath = path.join(tracksPath, `${path.basename(track.path, path.extname(track.path))}.wma`);
    
    console.log(`Converting track ${trackIndex + 1} of ${tracks.length} (${path.basename(track.path)})...`);

    const ffmpegProcess = cp.spawn(ffmpegPath, [
        "-i", track.path,
        "-c:a", "wmav2",
        "-b:a", "192k",
        "-ar", "44100",
        "-compression_level", "0",
        "-ac", "2",
        ...(pipeOutput ? [
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

    ffmpegProcess.on("exit", () => {
        const ffmpegOutput = Buffer.from(ffmpegOutputBufferArray).toString();
        const wmaBuffer = Buffer.from(wmaBufferArray);

        // console.log(ffmpegOutput);

        const durationMatch = ffmpegOutput.match(/duration: ([\d.]+):([\d.]+):([\d.]+)/i);
        if (!durationMatch) return console.log("Failed to get duration");

        track.title = ffmpegOutput.match(/(?<=title           : ).*/i)?.[0];
        track.artist = ffmpegOutput.match(/(?<=artist          : ).*/i)?.[0];
        track.album = ffmpegOutput.match(/(?<=album           : ).*/i)?.[0];
        track.genre = ffmpegOutput.match(/(?<=genre           : ).*/i)?.[0];
        track.length = parseFloat(durationMatch[1]) * 3600000 + parseFloat(durationMatch[2]) * 60000 + parseFloat(durationMatch[3]) * 1000;
        track.formattedTitle = titleFormat.replace(/{title}/g, track.title).replace(/{artist}/g, track.artist).replace(/{album}/g, track.album).replace(/{genre}/g, track.genre);

        const fmimBuffer = createFmimBuffer(pipeOutput ? wmaBuffer : fs.readFileSync(wmaPath), track, trackIndex + 1);
        fs.writeFileSync(path.join(fmimPath, (!trackIndex ? 8 : 10 + trackIndex).toString(16).padStart(4, "0").toUpperCase()), fmimBuffer);
        if (!pipeOutput) fs.rmSync(wmaPath);

        if (tracks[++trackIndex]) {
            return convertTrack(trackIndex);
        } else {
            console.log(`Creating mindex.xmi file...`);
            const mindexBuffer = createMindexBuffer(albumTitle, artistTitle, genreTitle, tracks);
            fs.writeFileSync(path.join(mindexOutput, "mindex.xmi"), mindexBuffer);
        }
    });
})(0);
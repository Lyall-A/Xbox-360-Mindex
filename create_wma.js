const fs = require("fs");
const cp = require("child_process");

const ffmpegPath = "ffmpeg";
const inputPath = "test_audio";
const outputPath = "test_audio.wma";

const ffmpegProcess = cp.spawn(ffmpegPath, [
    "-i", inputPath,
    "-c:a", "wmav2",
    "-b:a", "192k",
    "-ar", "44100",
    "-compression_level", "0",
    "-y",
    outputPath
]);

ffmpegProcess.stderr.on("data", data => console.log(data.toString()));

// const stream = fs.createWriteStream(outputPath);

// ffmpegProcess.stdout.on("data", data => {
//     stream.write(data);
// });

// ffmpegProcess.on("exit", () => {
//     stream.end();
// });
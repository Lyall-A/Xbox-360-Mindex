const { fmimBufferArray } = require("./constants");

function createFmimBuffer(wmaBuffer, track) {
    const fmimBuffer = Buffer.alloc(3336 + wmaBuffer.byteLength);

    Buffer.from(fmimBufferArray).copy(fmimBuffer, 0);
    
    fmimBuffer.write((track?.title || "").substring(0, 200), 12, "utf-16le"); // Track
    fmimBuffer.write((track?.album || "").substring(0, 200), 524, "utf-16le"); // Album
    fmimBuffer.write((track?.artist || "").substring(0, 200), 1036, "utf-16le"); // Artist
    fmimBuffer.write((track?.artist || "").substring(0, 200), 1548, "utf-16le"); // Artist (?)
    fmimBuffer.write((track?.genre || "").substring(0, 200), 2060, "utf-16le"); // Genre
    fmimBuffer.write((track?.genre || "").substring(0, 200), 2572, "utf-16le"); // Genre (?)
    fmimBuffer.writeUInt32BE(track?.length, 3080); // Track length (ms)
    fmimBuffer.writeUInt32BE(track?.track, 3084); // Track number (starts from 1)

    wmaBuffer.copy(fmimBuffer, 3336);
    
    return fmimBuffer;
};

module.exports = createFmimBuffer;
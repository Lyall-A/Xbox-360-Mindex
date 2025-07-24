const { fmimBufferArray } = require("./constants");
const createUTF16BEBuffer = require("./createUTF16BEBuffer");

function createFmimBuffer(wmaBuffer, track) {
    const fmimBuffer = Buffer.alloc(3336 + wmaBuffer.byteLength);

    Buffer.from(fmimBufferArray).copy(fmimBuffer, 0);
    
    createUTF16BEBuffer(track?.title || "", 200).copy(fmimBuffer, 12); // Title
    createUTF16BEBuffer(track?.album || "", 200).copy(fmimBuffer, 12); // Album
    createUTF16BEBuffer(track?.artist || "", 200).copy(fmimBuffer, 12); // Artist
    createUTF16BEBuffer(track?.artist || "", 200).copy(fmimBuffer, 12); // Artist (?)
    createUTF16BEBuffer(track?.genre || "", 200).copy(fmimBuffer, 12); // Genre
    createUTF16BEBuffer(track?.genre || "", 200).copy(fmimBuffer, 12); // Genre (?)
    fmimBuffer.writeUInt32BE(track?.length, 3080); // Track length (ms)
    fmimBuffer.writeUInt32BE(track?.track, 3084); // Track number (starts from 1)

    wmaBuffer.copy(fmimBuffer, 3336);
    
    return fmimBuffer;
};

module.exports = createFmimBuffer;
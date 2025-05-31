function createFmimBuffer(wmaBuffer, track) {
    const fmimBuffer = Buffer.alloc(3336 + wmaBuffer.byteLength);
    
    fmimBuffer.write("FMIM", 0); // Magic
    fmimBuffer.writeBigUInt64BE(0x0000000100010001n, 4); // Unknown data
    // x360 Music Organizer offsets by an extra 1 byte, I suspect that is incorrect
    // These aren't actually required
    fmimBuffer.write(track?.title || "", 12, "utf-16le"); // Track
    fmimBuffer.write(track?.album || "", 524, "utf-16le"); // Album
    fmimBuffer.write(track?.artist || "", 1036, "utf-16le"); // Artist
    fmimBuffer.write(track?.artist || "", 1548, "utf-16le"); // Artist (?)
    fmimBuffer.write(track?.genre || "", 2060, "utf-16le"); // Genre
    fmimBuffer.write(track?.genre || "", 2572, "utf-16le"); // Genre (?)
    fmimBuffer.writeUInt32LE(track?.length, 3084); // Track length (ms)
    fmimBuffer.writeUInt32LE(track?.track, 3088); // Track number (starts from 1)
    // 244 bytes of unknown data here
    wmaBuffer.copy(fmimBuffer, 3336);

    return fmimBuffer;
}

module.exports = createFmimBuffer;
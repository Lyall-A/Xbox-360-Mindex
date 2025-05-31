const { trackBufferArray, mindexBufferArray } = require("./constants.js");

// TODO: not 100% sure that these are little endian 32-bit

function createMindexBuffer(albumTitle, artistTitle, genreTitle, tracks) {
    const mindexBuffer = Buffer.alloc(6000 + 600 * tracks.length);
    const trackBuffers = tracks.map((track, index) => createTrackBuffer(track, index + 1));

    Buffer.from(mindexBufferArray).copy(mindexBuffer, 0);

    mindexBuffer.writeUInt32LE(7 + tracks.length, 1219);
    mindexBuffer.writeUInt32LE(tracks.length, 1227);
    mindexBuffer.writeUInt32LE(9 + tracks.length, 4299);
    mindexBuffer.writeUInt32LE(tracks.length, 3407);
    mindexBuffer.writeUInt32LE(7 + tracks.length, 5499);
    mindexBuffer.writeUInt32LE(tracks.length, 5507);
    mindexBuffer.writeUInt32LE(7 + tracks.length, 6099);
    mindexBuffer.writeUInt32LE(tracks.length, 6107);

    const albumBuffer = Buffer.alloc(82);
    albumBuffer.write(albumTitle, "utf-16le");
    albumBuffer.copy(mindexBuffer, 4217);

    const artistBuffer = Buffer.alloc(82);
    artistBuffer.write(artistTitle, "utf-16le");
    artistBuffer.copy(mindexBuffer, 5417);

    const genreBuffer = Buffer.alloc(82);
    genreBuffer.write(genreTitle, "utf-16le");
    genreBuffer.copy(mindexBuffer, 6017);

    trackBuffers.forEach((trackBuffer, index) => {
        trackBuffer.copy(mindexBuffer, !index ? 4800 : 6000 + 600 * index);
    });

    return mindexBuffer;

    function createTrackBuffer(track, trackNum) {
        const trackBuffer = Buffer.from(trackBufferArray);

        // what the fuck is this shit
        trackBuffer.writeUInt32LE(trackNum === 1 ? 0x02 : trackNum === tracks.length ? 0x08 : 8 + trackNum, 7);
        trackBuffer.writeUInt32LE(trackNum !== 1 && trackNum === tracks.length ? 0x02 : 10 + trackNum, 11);
        trackBuffer.writeUInt32LE(trackNum === 1 ? 0x07 : 8 + trackNum, 99);
        trackBuffer.writeUInt32LE(trackNum !== 1 && trackNum === tracks.length ? 0x07 : 10 + trackNum, 103);
        trackBuffer.writeUInt32LE(trackNum === 1 ? 0x09 : trackNum === tracks.length ? 0x08 : 7 + trackNum, 111);
        trackBuffer.writeUInt32LE(trackNum === 1 ? 0x0B : trackNum === tracks.length ? 0x09 : 11 + trackNum, 115);
        trackBuffer.writeUInt32LE(trackNum === 1 ? 0x0A : trackNum === tracks.length ? 0x08 : 8 + trackNum, 123);
        trackBuffer.writeUInt32LE(trackNum === 1 ? 0x0B : trackNum === tracks.length ? 0x0B : 10 + trackNum, 127);
        trackBuffer.writeUIntBE(track.length * 2, 144, 3); // TODO: track length might be multiplied by channels rather than just 2
        trackBuffer.writeUInt32LE(1 + 4 * trackNum, 147);

        const titleBuffer = Buffer.alloc(82);
        titleBuffer.write(track.formattedTitle || track.title, "utf-16le");
        titleBuffer.copy(trackBuffer, 17);

        return trackBuffer;
    }
}

module.exports = createMindexBuffer;
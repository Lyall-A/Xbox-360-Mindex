const { trackBufferArray, mindexBufferArray } = require("./constants");
const createUTF16BEBuffer = require("./createUTF16BEBuffer");

function createMindexBuffer(albumTitle, artistTitle, genreTitle, tracks) {
    const mindexBuffer = Buffer.alloc(6000 + 600 * tracks.length);
    const trackBuffers = tracks.map((track, index) => createTrackBuffer(track, index + 1));

    Buffer.from(mindexBufferArray).copy(mindexBuffer, 0);

    mindexBuffer.writeUInt8((7 + tracks.length) % 256, 1216);
    mindexBuffer.writeUInt32BE(tracks.length, 1224);
    mindexBuffer.writeUInt8((9 + tracks.length) % 256, 4296);
    mindexBuffer.writeUInt32BE(tracks.length, 3404);
    mindexBuffer.writeUInt8((7 + tracks.length) % 256, 5496);
    mindexBuffer.writeUInt32BE(tracks.length, 5504);
    mindexBuffer.writeUInt8((7 + tracks.length) % 256, 6096);
    mindexBuffer.writeUInt32BE(tracks.length, 6104);

    createUTF16BEBuffer(albumTitle, 78).copy(mindexBuffer, 4216);
    createUTF16BEBuffer(artistTitle, 78).copy(mindexBuffer, 5416);
    createUTF16BEBuffer(genreTitle, 78).copy(mindexBuffer, 6016);

    trackBuffers.forEach((trackBuffer, index) => {
        trackBuffer.copy(mindexBuffer, !index ? 4800 : 6000 + 600 * index);
    });

    return mindexBuffer;

    function createTrackBuffer(track, trackNum) {
        const trackBuffer = Buffer.from(trackBufferArray);

        // what the fuck is this shit
        trackBuffer.writeUInt32BE(trackNum === 1 ? 0x02 : trackNum === tracks.length ? 0x08 : 0x08 + trackNum, 4);
        trackBuffer.writeUInt32BE(trackNum !== 1 && trackNum === tracks.length ? 0x02 : 0x0A + trackNum, 8);
        createUTF16BEBuffer(track.formattedTitle || track.title, 78).copy(trackBuffer, 16);
        trackBuffer.writeUInt32BE(trackNum === 1 ? 0x07 : 0x08 + trackNum, 96);
        trackBuffer.writeUInt8(trackNum !== 1 && trackNum === tracks.length ? 0x07 : (0x0A + trackNum) % 256, 100);
        trackBuffer.writeUInt32BE(trackNum === 1 ? 0x09 : trackNum === tracks.length ? 0x08 : 0x07 + trackNum, 108);
        trackBuffer.writeUInt32BE(trackNum === 1 ? 0x0B : trackNum === tracks.length ? 0x09 : 0x0B + trackNum, 112);
        trackBuffer.writeUInt32BE(trackNum === 1 ? 0x0A : trackNum === tracks.length ? 0x08 : 0x08 + trackNum, 120);
        trackBuffer.writeUInt32BE(trackNum === 1 ? 0x0B : trackNum === tracks.length ? 0x0B : 0x0A + trackNum, 124);
        trackBuffer.writeUIntBE(track.length * 2, 144, 3);
        trackBuffer.writeUInt8((1 + 4 * trackNum) % 256, 147);

        return trackBuffer;
    }
};

module.exports = createMindexBuffer;
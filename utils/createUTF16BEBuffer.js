function createUTF16BEBuffer(string, size) {
    const buffer = Buffer.alloc(size || string.length * 2);
    buffer.write(string, "utf-16le");

    for (let i = 0; i < buffer.length; i += 2) {
        const byte = buffer[i];
        buffer[i] = buffer[i + 1];
        buffer[i + 1] = byte;
    }

    return buffer;
};

module.exports = createUTF16BEBuffer;
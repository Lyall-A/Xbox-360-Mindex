import NodeBuffer from 'buffer';

export default class Buffer extends Uint8Array {
    view: DataView;
    offset: number;

    constructor(length: number) {
        super(length);
        
        this.view = new DataView(this.buffer);
        this.offset = 0;
    }

    writeUInt8(value: number, offset: number = this.offset) {
        this.view.setUint8(offset, value);
        return this.offset = offset + 1;
    }

    writeUInt16(value: number, offset: number = this.offset) {
        this.view.setUint16(offset, value);
        return this.offset = offset + 2;
    }

    writeUInt24(value: number, offset: number = this.offset) {
        this[offset++] = (value >> 16) & 0xff;
        this[offset++] = (value >> 8) & 0xff;
        this[offset++] = value & 0xff;
        return this.offset = offset;
    }

    writeUInt32(value: number, offset: number = this.offset) {
        this.view.setUint32(offset, value);
        return this.offset = offset + 4;
    }

    writeUTF8(string: string, length: number, offset: number = this.offset) {
        const encoded = new TextEncoder().encode(string);
        this.set(encoded.subarray(0, length), offset);
        return this.offset = offset + length;
    }

    writeUTF16(string: string, length: number, offset: number = this.offset) {
        for (let i = 0; i < length / 2; i++) {
            this.writeUInt16(string.charCodeAt(i), offset);
            offset += 2;
        }
        this.writeUInt16(0, offset - 2); // make sure there is a null byte at the end
        return this.offset = offset;
    }

    readUInt8(offset: number = this.offset) {
        return this.view.getUint8(offset);
    }

    readUInt16(offset: number = this.offset) {
        return this.view.getUint16(offset);
    }

    readUInt24(offset: number = this.offset) {
        return (
            this[offset++] << 16 |
            this[offset++] << 8 |
            this[offset++]
        ) >>> 0;
    }

    readUInt32(offset: number = this.offset) {
        return this.view.getUint32(offset);
    }

    readUTF8(length: number, offset: number = this.offset) {
        return new TextDecoder().decode(this.subarray(offset, offset + length));
    }

    readUTF16(length: number, offset: number = this.offset) {
        let string = '';

        for (let byteIndex = offset; byteIndex < offset + length; byteIndex += 2) {
            const code = this.readUInt16(byteIndex);
            if (code === 0) break; // reached null byte
            string += String.fromCharCode(code);
        }

        return string;
    }

    static fromUint8Array(uint8Array: Uint8Array) {
        const buffer = new Buffer(uint8Array.length);
        buffer.set(uint8Array);
        return buffer;
    }

    static concat(buffers: Buffer[]) {
        const totalLength = buffers.reduce((sum, arr) => sum + arr.length, 0);
        const fullBuffer = new Buffer(totalLength);
        let offset = 0;
        for (const buffer of buffers) {
            fullBuffer.set(buffer, offset);
            offset += buffer.length;
        }
        return fullBuffer;
    }
}
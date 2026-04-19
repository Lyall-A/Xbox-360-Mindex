import Buffer from './Buffer';
import NodeBuffer from 'node:buffer';
import { Track } from './types';

export default class FMIM extends Buffer {
    constructor(track: Track, wmaBuffer: Buffer | NodeBuffer.Buffer) {
        super(FMIM.HEADER_LENGTH + wmaBuffer.length);

        this.writeUTF8('FMIM', 4, 0x00);
        this.writeUInt32(1, 0x04);
        this.writeUInt16(1, 0x08);
        this.writeUInt16(1, 0x0A);

        this.writeUTF16(track.name || '', 512, 0x0C); // Title
        this.writeUTF16(track.album.name || '', 512, 0x020C); // Album
        this.writeUTF16(track.artist.name || '', 512, 0x040C); // Artist
        this.writeUTF16(track.artist.name || '', 512, 0x060C); // Artist
        this.writeUTF16(track.genre.name, 512, 0x080C); // Genre
        this.writeUTF16(track.genre.name, 512, 0x0A0C); // Genre
        this.writeUInt32(track.duration, 0x0C0C); // Track length (ms)
        this.writeUInt32(track.trackNum, 0x0C10); // Track number (starts from 1)
        // NOTE: there is usually random data 0xC18-D07 (maybe 0xC14-D07?) that contains string labels and other stuff, this is also found in the albums chunk data

        this.set(wmaBuffer, FMIM.HEADER_LENGTH); // WMA
        // NOTE: seems to always be 4 null bytes at the end as well
    }

    static HEADER_LENGTH = 0x0D08;
    
    static getWma(fmimBuffer: Buffer) {
        return fmimBuffer.subarray(FMIM.HEADER_LENGTH);
    }
}
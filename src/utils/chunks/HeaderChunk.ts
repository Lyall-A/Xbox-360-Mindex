import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';

export default class HeaderChunk {
    constructor(public mindex: Mindex) { };

    create(): Buffer {
        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.HEADER, 0x00); // Chunk type
        chunk.writeUTF8(' IMX', 4, 0x04);
        chunk.writeUInt32(2, 0x08);
        chunk.writeUInt32(6, 0x0C);
        chunk.writeUInt32(1, 0x10);
        chunk.writeUInt32(6, 0x14);
        return chunk;
    }
}
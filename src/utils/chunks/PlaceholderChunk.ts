import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';

export default class PlaceholderChunk {
    constructor(public mindex: Mindex) { };

    create(index: number): Buffer {
        const { previousIndex, nextIndex } = this.mindex.findClosestChunks(ChunkType.PLACEHOLDER, index, ChunkType.PLACEHOLDER);

        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.PLACEHOLDER, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Previous placeholder or chunk type if first
        chunk.writeUInt32(nextIndex, 0x08); // Next placeholder or chunk type if last
        chunk.writeUInt32(ChunkType.PLACEHOLDER, 0x0C); // Chunk type
        return chunk;
    }
}
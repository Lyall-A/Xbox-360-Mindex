import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';
import { ChunkHeader } from '../types';

export default class ChunkHeaderChunk {
    constructor(public mindex: Mindex) { };

    create(index: number, chunkHeader: ChunkHeader): Buffer {
        const { previousIndex, nextIndex } = this.mindex.findClosestChunks(ChunkType.CHUNK_HEADER, index, 0);
        
        const relatedChunks = this.mindex.findChunks(chunkHeader, undefined,
            // Sort depending on related chunk type
            chunkHeader === ChunkType.TRACK ? this.mindex.trackSortCompare :
            chunkHeader === ChunkType.ALBUM ? this.mindex.albumSortCompare :
            chunkHeader === ChunkType.ARTIST ? this.mindex.artistSortCompare :
            chunkHeader === ChunkType.GENRE ? this.mindex.genreSortCompare :
            chunkHeader === ChunkType.PLAYLIST ? this.mindex.playlistSortCompare :
            undefined,
            // Default index depending on related chunk type
            chunkHeader === ChunkType.PLACEHOLDER ? 1 :
            chunkHeader === ChunkType.TRACK ? 2 :
            chunkHeader === ChunkType.ALBUM ? 3 :
            chunkHeader === ChunkType.ARTIST ? 4 :
            chunkHeader === ChunkType.GENRE ? 5 :
            chunkHeader === ChunkType.PLAYLIST ? -1 :
            undefined
        );

        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.CHUNK_HEADER, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Assumed to be previous chunk header or 0 if first
        chunk.writeUInt32(nextIndex, 0x08); // Assumed to be next chunk header or 0 if last
        chunk.writeUInt32(relatedChunks.lastIndex, 0x10); // Last related chunk or x if none
        chunk.writeUInt32(relatedChunks.firstIndex, 0x14); // First related chunk or x if none
        chunk.writeUInt32(relatedChunks.length, 0x18); // Related chunk count
        chunk.writeUInt32(chunkHeader, 0x1C); // Assumed to be related chunk type
        return chunk;
    }

    parse(chunk: Buffer): ChunkHeader {
        return chunk.readUInt32(0x1C);
    }
}
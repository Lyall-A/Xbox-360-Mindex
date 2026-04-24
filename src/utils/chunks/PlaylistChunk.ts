import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';
import { PlaylistEntry, Playlist } from '../types';

export default class PlaylistChunk {
    constructor(public mindex: Mindex) { };

    create(index: number, playlist: Playlist): Buffer {
        const { previousIndex, nextIndex } = this.mindex.findClosestChunks(ChunkType.PLAYLIST, index, ChunkType.PLAYLIST, this.mindex.playlistSortCompare);

        const playlistEntries = this.mindex.findChunks(ChunkType.PLAYLIST_ENTRY, (playlistEntry: PlaylistEntry) => playlistEntry.playlist === playlist);

        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.PLAYLIST, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Previous playlist or chunk type if first
        chunk.writeUInt32(nextIndex, 0x08); // Next playlist or chunk type if last
        chunk.writeUInt32(ChunkType.PLAYLIST, 0x0C); // Chunk type
        chunk.writeUTF16(playlist.name, 80, 0x10); // Playlist name
        chunk.writeUInt32(playlistEntries.lastIndex, 0x60); // Last playlist entry in playlist
        chunk.writeUInt32(playlistEntries.firstIndex, 0x64); // First playlist entry in playlist
        chunk.writeUInt32(playlistEntries.length, 0x68); // Playlist entry count
        return chunk;
    }

    parse(chunk: Buffer): Playlist {
        return {
            name: chunk.readUTF16(80, 0x10)
        };
    }
}
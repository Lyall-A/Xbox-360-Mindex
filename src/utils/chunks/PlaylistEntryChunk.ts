import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';
import { Track, PlaylistEntry, Playlist } from '../types';

export default class PlaylistEntryChunk {
    constructor(public mindex: Mindex) { };

    create(index: number, playlistEntry: PlaylistEntry): Buffer {
        const playlistIndex = this.mindex.findChunkIndex(playlistEntry.playlist);
        const trackIndex = this.mindex.findChunkIndex(playlistEntry.track);

        const { previousIndex: previousIndexPlaylist, nextIndex: afterIndexPlaylist } = this.mindex.findClosestChunks(ChunkType.PLAYLIST_ENTRY, index, playlistIndex, undefined, ({ playlist }: PlaylistEntry) => playlist === playlistEntry.playlist);
        const { previousIndex: previousIndexTrack, nextIndex: afterIndexTrack } = this.mindex.findClosestChunks(ChunkType.PLAYLIST_ENTRY, index, trackIndex, undefined, ({ track }: PlaylistEntry) => track === playlistEntry.track);

        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.PLAYLIST_ENTRY, 0x00); // Chunk type
        chunk.writeUInt32(previousIndexPlaylist, 0x04); // Previous playlist entry related to playlist or playlist if first
        chunk.writeUInt32(afterIndexPlaylist, 0x08); // Next playlist entry related to playlist or playlist if last
        chunk.writeUInt32(playlistIndex, 0x0C); // Playlist
        chunk.writeUInt32(previousIndexTrack, 0x10); // Previous playlist entry related to track or track if first
        chunk.writeUInt32(afterIndexTrack, 0x14); // Next playlist entry related to track or track if last
        chunk.writeUInt32(trackIndex, 0x18); // Track
        return chunk;
    }

    parse(chunk: Buffer): PlaylistEntry {
        return {
            playlist: this.mindex.chunks[chunk.readUInt32(0x0C)].value as Playlist,
            track: this.mindex.chunks[chunk.readUInt32(0x18)].value as Track,
        };
    }
}
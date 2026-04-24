import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';
import { Track, PlaylistEntry, Album, Artist, Genre } from '../types';

export default class TrackChunk {
    constructor(public mindex: Mindex) { };

    create(index: number, track: Track): Buffer {
        const { previousIndex, nextIndex } = this.mindex.findClosestChunks(ChunkType.TRACK, index, ChunkType.TRACK, this.mindex.trackSortCompare);

        const playlistEntries = this.mindex.findChunks(ChunkType.PLAYLIST_ENTRY, (playlistEntry: PlaylistEntry) => playlistEntry.track === track, undefined, -1);

        const albumIndex = this.mindex.findChunkIndex(track.album);
        const artistIndex = this.mindex.findChunkIndex(track.artist);
        const genreIndex = this.mindex.findChunkIndex(track.genre);

        const { previousIndex: previousIndexAlbum, nextIndex: nextIndexAlbum } = this.mindex.findClosestChunks(ChunkType.TRACK, index, albumIndex, this.mindex.albumTrackSortCompare, ({ album }: Track) => album === track.album);
        const { previousIndex: previousIndexArtist, nextIndex: nextIndexArtist } = this.mindex.findClosestChunks(ChunkType.TRACK, index, artistIndex, this.mindex.artistTrackSortCompare, ({ artist }: Track) => artist === track.artist);
        const { previousIndex: previousIndexGenre, nextIndex: nextIndexGenre } = this.mindex.findClosestChunks(ChunkType.TRACK, index, genreIndex, this.mindex.genreTrackSortCompare, ({ genre }: Track) => genre === track.genre);

        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.TRACK, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Previous track or chunk type if first
        chunk.writeUInt32(nextIndex, 0x08); // Next track or chunk type if last
        chunk.writeUInt32(ChunkType.TRACK, 0x0C); // Chunk type
        chunk.writeUTF16(track.name, 80, 0x10); // Track name
        chunk.writeUInt32(previousIndexAlbum, 0x60); // Previous track related to album or album if first
        chunk.writeUInt32(nextIndexAlbum, 0x64); // Next track related to album or album if last
        chunk.writeUInt32(albumIndex, 0x68); // Album
        chunk.writeUInt32(previousIndexArtist, 0x6C); // Previous track related to artist or artist if first
        chunk.writeUInt32(nextIndexArtist, 0x70); // Next track related to artist or artist if last
        chunk.writeUInt32(artistIndex, 0x74); // Artist
        chunk.writeUInt32(previousIndexGenre, 0x78); // Previous track related to genre or genre if first
        chunk.writeUInt32(nextIndexGenre, 0x7C); // Next track related to genre or genre if last
        chunk.writeUInt32(genreIndex, 0x80); // Genre
        chunk.writeUInt32(playlistEntries.firstIndex, 0x84); // Last playlist entry in track or -1 if none
        chunk.writeUInt32(playlistEntries.lastIndex, 0x88); // First playlist entry in track or -1 if none
        chunk.writeUInt32(playlistEntries.length, 0x8C); // Playlist entry count
        chunk.writeUInt24(track.duration * 2, 0x90); // Track duration multiplied by 2 (channels?)
        chunk.writeUInt8(5 + this.mindex.filterChunks(ChunkType.TRACK, (i: Track, chunk) => i.album === track.album && chunk.data).length * 4, 0x93); // 5 + <track index> * 4 (5, 9, 13, etc. wraps after 255)
        return chunk;
    }

    parse(chunk: Buffer): Track {
        return {
            name: chunk.readUTF16(80, 0x10),
            duration: chunk.readUInt24(0x90) / 2,
            album: this.mindex.chunks[chunk.readUInt32(0x68)].value as Album,
            artist: this.mindex.chunks[chunk.readUInt32(0x74)].value as Artist,
            genre: this.mindex.chunks[chunk.readUInt32(0x80)].value as Genre
        };
    }
}
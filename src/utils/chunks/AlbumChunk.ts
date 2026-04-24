import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';
import { Track, Album, Artist, Genre } from '../types';

export default class AlbumChunk {
    constructor(public mindex: Mindex) { };

    create(index: number, album: Album): Buffer {
        const { previousIndex, nextIndex } = this.mindex.findClosestChunks(ChunkType.ALBUM, index, ChunkType.ALBUM, this.mindex.albumSortCompare);
        
        const tracks = this.mindex.findChunks(ChunkType.TRACK, (track: Track) => track.album === album, this.mindex.albumTrackSortCompare);

        const artistIndex = this.mindex.findChunkIndex(album.artist);
        const genreIndex = this.mindex.findChunkIndex(album.genre);

        const { previousIndex: previousIndexArtist, nextIndex: nextIndexArtist } = this.mindex.findClosestChunks(ChunkType.ALBUM, index, artistIndex, this.mindex.artistAlbumSortCompare, ({ artist }: Album) => artist === album.artist);
        const { previousIndex: previousIndexGenre, nextIndex: nextIndexGenre } = this.mindex.findClosestChunks(ChunkType.ALBUM, index, genreIndex, this.mindex.genreAlbumSortCompare, ({ genre }: Album) => genre === album.genre);
        
        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.ALBUM, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Previous album or chunk type if first
        chunk.writeUInt32(nextIndex, 0x08); // Next album or chunk type if last
        chunk.writeUInt32(ChunkType.ALBUM, 0x0C); // Chunk type
        chunk.writeUTF16(album.name, 80, 0x10); // Album name
        chunk.writeUInt32(tracks.lastIndex, 0x60); // Last track in album
        chunk.writeUInt32(tracks.firstIndex, 0x64); // First track in album
        chunk.writeUInt32(tracks.length, 0x68); // Track count
        chunk.writeUInt32(previousIndexArtist, 0x6C); // Previous album related to artist or artist if first
        chunk.writeUInt32(nextIndexArtist, 0x70); // Next album related to artist or artist if last
        chunk.writeUInt32(artistIndex, 0x74); // Artist
        chunk.writeUInt32(previousIndexGenre, 0x78); // Previous album related to genre or genre if first
        chunk.writeUInt32(nextIndexGenre, 0x7C); // Next album related to genre or genre if last
        chunk.writeUInt32(genreIndex, 0x80); // Genre
        // NOTE: there is usually random data 0x88-177 (maybe 0x84-177?) that contains string labels and other stuff, this is also found in the FMIM data of tracks
        return chunk;
    }

    parse(chunk: Buffer): Album {
        return {
            name: chunk.readUTF16(80, 0x10),
            artist: this.mindex.chunks[chunk.readUInt32(0x74)].value as Artist,
            genre: this.mindex.chunks[chunk.readUInt32(0x80)].value as Genre
        };
    }
}
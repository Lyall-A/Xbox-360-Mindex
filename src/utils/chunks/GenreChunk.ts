import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';
import { Track, Album, Genre } from '../types';

export default class GenreChunk {
    constructor(public mindex: Mindex) { };

    create(index: number, genre: Genre): Buffer {
        const { previousIndex, nextIndex } = this.mindex.findClosestChunks(ChunkType.GENRE, index, ChunkType.GENRE, this.mindex.genreSortCompare);

        const tracks = this.mindex.findChunks(ChunkType.TRACK, (track: Track) => track.genre === genre, this.mindex.genreTrackSortCompare);
        const albums = this.mindex.findChunks(ChunkType.ALBUM, (album: Album) => album.genre === genre, this.mindex.genreAlbumSortCompare);

        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.GENRE, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Previous genre or chunk type if first
        chunk.writeUInt32(nextIndex, 0x08); // Next genre or chunk type if last
        chunk.writeUInt32(ChunkType.GENRE, 0x0C); // Chunk type
        chunk.writeUTF16(genre.name, 80, 0x10); // Genre name
        chunk.writeUInt32(tracks.lastIndex, 0x60); // Last track in genre
        chunk.writeUInt32(tracks.firstIndex, 0x64); // First track in genre
        chunk.writeUInt32(tracks.length, 0x68); // Track count
        chunk.writeUInt32(albums.lastIndex, 0x6C); // Last album in genre
        chunk.writeUInt32(albums.firstIndex, 0x70); // First album in genre
        chunk.writeUInt32(albums.length, 0x74); // Album count
        return chunk;
    }

    parse(chunk: Buffer): Genre {
        return {
            name: chunk.readUTF16(80, 0x10)
        };
    }
}
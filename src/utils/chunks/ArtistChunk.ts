import Buffer from '../Buffer';
import Mindex, { ChunkType } from '../Mindex';
import { Track, Album, Artist } from '../types';

export default class ArtistChunk {
    constructor(public mindex: Mindex) { };

    create(index: number, artist: Artist): Buffer {
        const { previousIndex, nextIndex } = this.mindex.findClosestChunks(ChunkType.ARTIST, index, ChunkType.ARTIST, this.mindex.artistSortCompare);

        const tracks = this.mindex.findChunks(ChunkType.TRACK, (track: Track) => track.artist === artist, this.mindex.artistTrackSortCompare);
        const albums = this.mindex.findChunks(ChunkType.ALBUM, (album: Album) => album.artist === artist, this.mindex.artistAlbumSortCompare);

        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.ARTIST, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Previous artist or chunk type if first
        chunk.writeUInt32(nextIndex, 0x08); // Next artist displayed or chunk type if last
        chunk.writeUInt32(ChunkType.ARTIST, 0x0C); // Chunk type
        chunk.writeUTF16(artist.name, 80, 0x10); // Artist name
        chunk.writeUInt32(tracks.lastIndex, 0x60); // Last track in artist
        chunk.writeUInt32(tracks.firstIndex, 0x64); // First track in artist
        chunk.writeUInt32(tracks.length, 0x68); // Track count
        chunk.writeUInt32(albums.lastIndex, 0x6C); // Last album in artist
        chunk.writeUInt32(albums.firstIndex, 0x70); // First album in artist
        chunk.writeUInt32(albums.length, 0x74); // Album count
        return chunk;
    }

    parse(chunk: Buffer): Artist {
        return {
            name: chunk.readUTF16(80, 0x10)
        };
    }
}
import Buffer from './Buffer';
import { Track, Album, Artist, Genre, Playlist } from './types';

export enum ChunkType {
    PLACEHOLDER = 1, // TODO: proper name?
    TRACK = 2,
    ALBUM = 3,
    ARTIST = 4,
    GENRE = 5,
    PLAYLIST = 6,
    HEADER = 7,
    CHUNK_HEADER = 8,
    UNKNOWN9 = 9, // TODO: proper name, related to playlists
};

export type ChunkHeader =
    | ChunkType.PLACEHOLDER
    | ChunkType.TRACK
    | ChunkType.ALBUM
    | ChunkType.ARTIST
    | ChunkType.GENRE
    | ChunkType.PLAYLIST;

export class Chunk extends Buffer {
    constructor() {
        super(600);
    }
}

export default class Mindex {
    chunks: ((
        { type: ChunkType.PLACEHOLDER; value?: null; } |
        { type: ChunkType.TRACK; value: Track; } |
        { type: ChunkType.ALBUM; value: Album; } |
        { type: ChunkType.ARTIST; value: Artist; } |
        { type: ChunkType.GENRE; value: Genre; } |
        { type: ChunkType.PLAYLIST; value: Playlist; } |
        { type: ChunkType.HEADER; value?: null; } |
        { type: ChunkType.CHUNK_HEADER; value: ChunkHeader; } |
        { type: ChunkType.UNKNOWN9; value?: null; }
    ) & {
        data?: Chunk;
    })[] = [];

    constructor() {
        this.createHeader();
        this.createChunkHeader(ChunkType.PLACEHOLDER);
        this.createChunkHeader(ChunkType.TRACK);
        this.createChunkHeader(ChunkType.ALBUM);
        this.createChunkHeader(ChunkType.ARTIST);
        this.createChunkHeader(ChunkType.GENRE);
        this.createChunkHeader(ChunkType.PLAYLIST);
    }

    createHeader() {
        this.addChunk(ChunkType.HEADER);
        return;
    }

    createChunkHeader(relatedChunkType: ChunkHeader) {
        this.addChunk(ChunkType.CHUNK_HEADER, relatedChunkType);
        return;
    }

    createTrack(name: string, duration: number, trackNum: number, album: Album, artist: Artist, genre: Genre, playlist?: Playlist) {
        const track: Track = {
            name,
            duration,
            trackNum,
            album,
            artist,
            genre,
            playlist
        };
        this.addChunk(ChunkType.TRACK, track);
        return track;
    }

    createAlbum(name: string, artist: Artist, genre: Genre) {
        const album: Album = {
            name,
            artist,
            genre
        };
        this.addChunk(ChunkType.ALBUM, album);
        return album;
    }

    createArtist(name: string) {
        const artist: Artist = {
            name
        };
        this.addChunk(ChunkType.ARTIST, artist);
        return artist;
    }

    createGenre(name: string) {
        const genre: Genre = {
            name
        };
        this.addChunk(ChunkType.GENRE, genre);
        return genre;
    }

    createPlaylist(name: string) {
        // TODO
    }

    addChunk(type: ChunkType, value?: any) {
        const chunk = { type, value };
        return this.chunks.push(chunk) - 1;
    }

    buildChunks() {
        for (let chunkIndex = 0; chunkIndex < this.chunks.length; chunkIndex++) {
            const chunk = this.chunks[chunkIndex];

            if (chunk.type === ChunkType.PLACEHOLDER) chunk.data = this.createPlaceholderChunk(chunkIndex); else
            if (chunk.type === ChunkType.TRACK) chunk.data = this.createTrackChunk(chunkIndex, chunk.value); else
            if (chunk.type === ChunkType.ALBUM) chunk.data = this.createAlbumChunk(chunkIndex, chunk.value); else
            if (chunk.type === ChunkType.ARTIST) chunk.data = this.createArtistChunk(chunkIndex, chunk.value); else
            if (chunk.type === ChunkType.GENRE) chunk.data = this.createGenreChunk(chunkIndex, chunk.value); else
            // if (chunk.type === ChunkType.PLAYLIST) chunk.data = this.createPlaylistChunk(); else
            if (chunk.type === ChunkType.HEADER) chunk.data = this.createHeaderChunk(); else
            if (chunk.type === ChunkType.CHUNK_HEADER) chunk.data = this.createChunkHeaderChunk(chunkIndex, chunk.value);
            // if (chunk.type === ChunkType.UNKNOWN9) chunk.data = this.create();
        }

        return Buffer.concat(this.chunks.map(chunk => chunk.data!));
    }

    findChunkIndex(value: any) {
        const index = this.chunks.findIndex(chunk => chunk.value === value);
        // if (index < 0) throw new Error('Could not find chunk and no default index!');
        return index;
    }

    findChunks(type: ChunkType, defaultIndex?: number, filter?: (value: any, chunk: any) => void) {
        const chunks = this.chunks.filter(chunk => chunk.type === type && (filter ? filter(chunk.value, chunk) : true));
        // if (chunks.length === 0 && defaultIndex === undefined) throw new Error('Could not find chunk and no default index!');
        const firstIndex = chunks.length > 0 ? this.chunks.findIndex(chunk => chunks.includes(chunk)) : defaultIndex!;
        const lastIndex = chunks.length > 0 ? this.chunks.findLastIndex(chunk => chunks.includes(chunk)) : defaultIndex!;
        return {
            firstIndex,
            lastIndex,
            length: chunks.length,
            chunks
        };
    }

    findClosestChunks(type: ChunkType, index: number, defaultIndex?: number) {
        const previousIndex = this.chunks.findLastIndex((chunk, i) => chunk.type === type && i < index);
        const nextIndex = this.chunks.findIndex((chunk, i) => chunk.type === type && i > index);
        // if (previousIndex < 0 && nextIndex < 0) throw new Error('Could not find close chunks!');
        // if ((previousIndex < 0 || nextIndex < 0) && defaultIndex === undefined) throw new Error('Could not find close chunks and no default index!');
        return {
            previousIndex: previousIndex >= 0 ? previousIndex : defaultIndex!,
            nextIndex: nextIndex >= 0 ? nextIndex : defaultIndex!,
        };
    }

    createHeaderChunk() {
        const chunk = new Chunk();
        chunk.writeUInt32(ChunkType.HEADER, 0x00); // Chunk type
        chunk.writeUTF8(' IMX', 4, 0x04);
        chunk.writeUInt32(2, 0x08);
        chunk.writeUInt32(6, 0x0C);
        chunk.writeUInt32(1, 0x10);
        chunk.writeUInt32(6, 0x14);
        return chunk;
    }

    createChunkHeaderChunk(index: number, chunkHeader: ChunkHeader) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.CHUNK_HEADER, index, 0);
        const relatedChunks = this.findChunks(chunkHeader,
            // Default index depending on related chunk type
            chunkHeader === ChunkType.PLACEHOLDER ? 1 :
            chunkHeader === ChunkType.TRACK ? 2 :
            chunkHeader === ChunkType.ALBUM ? 3 :
            chunkHeader === ChunkType.ARTIST ? 4 :
            chunkHeader === ChunkType.GENRE ? 5 :
            chunkHeader === ChunkType.PLAYLIST ? -1 :
            undefined
        );

        const chunk = new Chunk();
        chunk.writeUInt32(ChunkType.CHUNK_HEADER, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Assumed to be chunk index of chunk header above this one or 0 if first chunk header
        chunk.writeUInt32(nextIndex, 0x08); // Assumed to be chunk index of chunk header under this one or 0 if last chunk header
        chunk.writeUInt32(relatedChunks.lastIndex, 0x10); // Chunk index of last related chunk or x if none
        chunk.writeUInt32(relatedChunks.firstIndex, 0x14); // Chunk index of first related chunk or x if none
        chunk.writeUInt32(relatedChunks.length, 0x18); // Related chunk count
        chunk.writeUInt32(chunkHeader, 0x1C); // Assumed to be related chunk type
        return chunk;
    }

    createPlaceholderChunk(index: number) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.PLACEHOLDER, index, ChunkType.PLACEHOLDER);

        const chunk = new Chunk();
        chunk.writeUInt32(ChunkType.PLACEHOLDER, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Chunk index of placeholder above this one or chunk type if first placeholder
        chunk.writeUInt32(nextIndex, 0x08); // Chunk index of placeholder under this one or chunk type if last placeholder
        chunk.writeUInt32(ChunkType.PLACEHOLDER, 0x0C); // Chunk type
        return chunk;
    }

    createAlbumChunk(index: number, album: Album) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.ALBUM, index, ChunkType.ALBUM);
        
        const tracks = this.findChunks(ChunkType.TRACK, undefined, (track: Track) => track.album === album);
        const artistIndex = this.findChunkIndex(album.artist);
        const genreIndex = this.findChunkIndex(album.genre);
        const { previousIndex: previousIndexArtist, nextIndex: nextIndexArtist } = this.findClosestChunks(ChunkType.ALBUM, index, artistIndex);
        const { previousIndex: previousIndexGenre, nextIndex: nextIndexGenre } = this.findClosestChunks(ChunkType.ALBUM, index, genreIndex);
        
        const chunk = new Chunk();
        chunk.writeUInt32(ChunkType.ALBUM, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Chunk index of album displayed above this one or chunk type if first album
        chunk.writeUInt32(nextIndex, 0x08); // Chunk index of album displayed under this one or chunk type if last album
        chunk.writeUInt32(ChunkType.ALBUM, 0x0C); // Chunk type
        chunk.writeUTF16(album.name, 80, 0x10); // Album name
        chunk.writeUInt32(tracks.lastIndex, 0x60); // Chunk index of last track displayed in album
        chunk.writeUInt32(tracks.firstIndex, 0x64); // Chunk index of first track displayed in album
        chunk.writeUInt32(tracks.length, 0x68); // Track count
        chunk.writeUInt32(previousIndexArtist, 0x6C); // Chunk index of album displayed above this one or chunk index of artist if first album
        chunk.writeUInt32(nextIndexArtist, 0x70); // Chunk index of album displayed under this one or chunk index of artist if last album
        chunk.writeUInt32(artistIndex, 0x74); // Chunk index of artist
        chunk.writeUInt32(previousIndexGenre, 0x78); // Chunk index of album displayed above this one or chunk index of genre if first album
        chunk.writeUInt32(nextIndexGenre, 0x7C); // Chunk index of album displayed under this one or chunk index of genre if last album
        chunk.writeUInt32(genreIndex, 0x80); // Chunk index of genre
        // NOTE: there is usually random data 0x88-177 (maybe 0x84-177?) that contains string labels and other stuff, this is also found in the FMIM data of tracks
        return chunk;
    }

    createTrackChunk(index: number, track: Track) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.TRACK, index, ChunkType.TRACK);

        const albumIndex = this.findChunkIndex(track.album);
        const artistIndex = this.findChunkIndex(track.artist);
        const genreIndex = this.findChunkIndex(track.genre);
        const { previousIndex: previousIndexAlbum, nextIndex: nextIndexAlbum } = this.findClosestChunks(ChunkType.TRACK, index, albumIndex);
        const { previousIndex: previousIndexArtist, nextIndex: nextIndexArtist } = this.findClosestChunks(ChunkType.TRACK, index, artistIndex);
        const { previousIndex: previousIndexGenre, nextIndex: nextIndexGenre } = this.findClosestChunks(ChunkType.TRACK, index, genreIndex);

        const chunk = new Chunk();
        chunk.writeUInt32(ChunkType.TRACK, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Chunk index of track displayed above this one or chunk type if first track
        chunk.writeUInt32(nextIndex, 0x08); // Chunk index of track displayed under this one or chunk type if last track
        chunk.writeUInt32(ChunkType.TRACK, 0x0C); // Chunk type
        chunk.writeUTF16(track.name, 80, 0x10); // Track name
        chunk.writeUInt32(previousIndexAlbum, 0x60); // Chunk index of track displayed above this one or chunk index of album if first track in album
        chunk.writeUInt32(nextIndexAlbum, 0x64); // Chunk index of track displayed under this one or chunk index of album if last track in album
        chunk.writeUInt32(albumIndex, 0x68); // Chunk index of album
        chunk.writeUInt32(previousIndexArtist, 0x6C); // Chunk index of track displayed above this one or chunk index of artist if first track in album
        chunk.writeUInt32(nextIndexArtist, 0x70); // Chunk index of track displayed under this one or chunk index of artist if last track in album
        chunk.writeUInt32(artistIndex, 0x74); // Chunk index of artist
        chunk.writeUInt32(previousIndexGenre, 0x78); // Chunk index of track displayed above this one or chunk index of genre if first track in album
        chunk.writeUInt32(nextIndexGenre, 0x7C); // Chunk index of track displayed above this one or chunk index of genre if last track in album
        chunk.writeUInt32(genreIndex, 0x80); // Chunk index of genre
        chunk.writeUInt32(0xFFFFFFFF, 0x84); // TODO: something to do with unknown9 (playlists)
        chunk.writeUInt32(0xFFFFFFFF, 0x88); // TODO: something to do with unknown9 (playlists)
        chunk.writeUInt32(0, 0x8C); // TODO: playlist count i think
        chunk.writeUInt24(track.duration * 2, 0x90); // Track duration multiplied by 2 (channels?)
        chunk.writeUInt8(5 + (track.trackNum - 1) * 4, 0x93); // 5 + <track num - 1> * 4 (5, 9, 13, etc. wraps after 255)
        
        return chunk;
    }

    createArtistChunk(index: number, artist: Artist) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.ARTIST, index, ChunkType.ARTIST);

        const tracks = this.findChunks(ChunkType.TRACK, undefined, (track: Track) => track.artist === artist);
        const albums = this.findChunks(ChunkType.ALBUM, undefined, (album: Album) => album.artist === artist);

        const chunk = new Chunk();
        chunk.writeUInt32(ChunkType.ARTIST, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Chunk index of artist displayed above this one or chunk type if first artist
        chunk.writeUInt32(nextIndex, 0x08); // Chunk index of artist displayed under this one or chunk type if last artist
        chunk.writeUInt32(ChunkType.ARTIST, 0x0C); // Chunk type
        chunk.writeUTF16(artist.name, 80, 0x10); // Artist name
        chunk.writeUInt32(tracks.lastIndex, 0x60); // Chunk index of last track displayed in artist
        chunk.writeUInt32(tracks.firstIndex, 0x64); // Chunk index of first track displayed in artist
        chunk.writeUInt32(tracks.length, 0x68); // Track count
        chunk.writeUInt32(albums.lastIndex, 0x6C); // Chunk index of last album displayed in artist
        chunk.writeUInt32(albums.firstIndex, 0x70); // Chunk index of first album displayed in artist
        chunk.writeUInt32(albums.length, 0x74); // Album count
        return chunk;
    }

    createGenreChunk(index: number, genre: Genre) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.GENRE, index, ChunkType.GENRE);

        const tracks = this.findChunks(ChunkType.TRACK, undefined, (track: Track) => track.genre === genre);
        const albums = this.findChunks(ChunkType.ALBUM, undefined, (album: Album) => album.genre === genre);

        const chunk = new Chunk();
        chunk.writeUInt32(ChunkType.GENRE, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Chunk index of genre displayed above this one or chunk type if first genre
        chunk.writeUInt32(nextIndex, 0x08); // Chunk index of genre displayed under this one or chunk type if last genre
        chunk.writeUInt32(ChunkType.GENRE, 0x0C); // Chunk type
        chunk.writeUTF16(genre.name, 80, 0x10); // Genre name
        chunk.writeUInt32(tracks.lastIndex, 0x60); // Chunk index of last track displayed in genre
        chunk.writeUInt32(tracks.firstIndex, 0x64); // Chunk index of first track displayed in genre
        chunk.writeUInt32(tracks.length, 0x68); // Track count
        chunk.writeUInt32(albums.lastIndex, 0x6C); // Chunk index of last album displayed in genre
        chunk.writeUInt32(albums.firstIndex, 0x70); // Chunk index of first album displayed in genre
        chunk.writeUInt32(albums.length, 0x74); // Album count
        return chunk;
    }

    createPlaylistChunk() {
        const chunk = new Chunk();
        chunk.writeUInt32(ChunkType.PLAYLIST, 0x00);
        // chunk.writeUInt32(0, 0x04); // TODO: Chunk index of playlist displayed above this one or chunk type if first playlist
        // chunk.writeUInt32(0, 0x08); // TODO: Chunk index of playlist displayed under this one or chunk type if last playlist
        chunk.writeUInt32(ChunkType.PLAYLIST, 0x0C);
        return chunk;
    }
}
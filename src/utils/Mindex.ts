import Buffer from './Buffer';
import PlaceholderChunk from './chunks/PlaceholderChunk';
import TrackChunk from './chunks/TrackChunk';
import AlbumChunk from './chunks/AlbumChunk';
import ArtistChunk from './chunks/ArtistChunk';
import GenreChunk from './chunks/GenreChunk';
import PlaylistChunk from './chunks/PlaylistChunk';
import HeaderChunk from './chunks/HeaderChunk';
import ChunkHeaderChunk from './chunks/ChunkHeaderChunk';
import PlaylistEntryChunk from './chunks/PlaylistEntryChunk';
import { Track, Album, Artist, Genre, Playlist, ChunkHeader, PlaylistEntry } from './types';

export enum ChunkType {
    PLACEHOLDER = 1,
    TRACK,
    ALBUM,
    ARTIST,
    GENRE,
    PLAYLIST,
    HEADER,
    CHUNK_HEADER,
    PLAYLIST_ENTRY
};

export type Chunk = (
    | { type: ChunkType.PLACEHOLDER; value: void; }
    | { type: ChunkType.TRACK; value: Track; }
    | { type: ChunkType.ALBUM; value: Album; }
    | { type: ChunkType.ARTIST; value: Artist; }
    | { type: ChunkType.GENRE; value: Genre; }
    | { type: ChunkType.PLAYLIST; value: Playlist; }
    | { type: ChunkType.HEADER; value: void; }
    | { type: ChunkType.CHUNK_HEADER; value: ChunkHeader; }
    | { type: ChunkType.PLAYLIST_ENTRY; value: PlaylistEntry; }
) & {
    data?: Buffer;
};

export default class Mindex {
    chunks: Chunk[] = [];
    trackSortCompare?: (a: any, b: any) => number; // How tracks are sorted
    albumSortCompare?: (a: any, b: any) => number; // How albums are sorted
    albumTrackSortCompare?: (a: any, b: any) => number; // How tracks in a album are sorted
    artistSortCompare?: (a: any, b: any) => number; // How artists are sorted
    artistTrackSortCompare?: (a: any, b: any) => number; // How tracks in a artist are sorted
    artistAlbumSortCompare?: (a: any, b: any) => number; // How albums in a artist are sorted
    genreSortCompare?: (a: any, b: any) => number; // Genre sort
    genreTrackSortCompare?: (a: any, b: any) => number; // How tracks in a genre are sorted
    genreAlbumSortCompare?: (a: any, b: any) => number; // How albums in a genre are sorted (NOTE: not sure what this changes as genre only shows tracks)
    playlistSortCompare?: (a: any, b: any) => number; // How playlists are sorted

    constructor(mindex?: Uint8Array) {
        if (!mindex) {
            // Create new mindex
            this.createHeader();
            this.createChunkHeader(ChunkType.PLACEHOLDER);
            this.createChunkHeader(ChunkType.TRACK);
            this.createChunkHeader(ChunkType.ALBUM);
            this.createChunkHeader(ChunkType.ARTIST);
            this.createChunkHeader(ChunkType.GENRE);
            this.createChunkHeader(ChunkType.PLAYLIST);
        } else {
            // Import mindex
            for (let offset = 0; offset < mindex.length; offset += 600) {
                const data = Buffer.fromUint8Array(mindex.subarray(offset, offset + 600));
                const chunkType = data.readUInt32(0x00);
                this.addChunk(chunkType, { }, data);
            }

            this.parseChunks();
        }
    }

    createPlaceholder() {
        this.addChunk(ChunkType.PLACEHOLDER);
        return;
    }

    // TODO: use object instead of a bunch of args??
    createTrack(name: string, duration: number, album: Album, artist: Artist, genre: Genre) {
        const track: Track = {
            name,
            duration,
            album,
            artist,
            genre
        };
        this.addChunk(ChunkType.TRACK, track);
        return track;
    }

    createAlbum(name: string, artist: Artist, genre: Genre) {
        const album: Album = { name, artist, genre };
        this.addChunk(ChunkType.ALBUM, album);
        return album;
    }

    createArtist(name: string) {
        const artist: Artist = { name };
        this.addChunk(ChunkType.ARTIST, artist);
        return artist;
    }

    createGenre(name: string) {
        const genre: Genre = { name };
        this.addChunk(ChunkType.GENRE, genre);
        return genre;
    }

    createPlaylist(name: string) {
        const playlist: Playlist = { name };
        this.addChunk(ChunkType.PLAYLIST, playlist);
        return playlist;
    }

    createHeader() {
        this.addChunk(ChunkType.HEADER);
        return;
    }

    createChunkHeader(type: ChunkHeader['type']) {
        const chunkHeader: ChunkHeader = { type };
        this.addChunk(ChunkType.CHUNK_HEADER, chunkHeader);
        return chunkHeader;
    }

    createPlaylistEntry(track: Track, playlist: Playlist) {
        const playlistEntry: PlaylistEntry = { track, playlist };
        this.addChunk(ChunkType.PLAYLIST_ENTRY, playlistEntry);
        return playlistEntry;
    }

    setTrackSort(compare: (a: Track, b: Track) => number) { this.trackSortCompare = compare; }
    setAlbumSort(compare: (a: Album, b: Album) => number) { this.albumSortCompare = compare; }
    setAlbumTrackSort(compare: (a: Track, b: Track) => number) { this.albumTrackSortCompare = compare; }
    setArtistSort(compare: (a: Artist, b: Artist) => number) { this.artistSortCompare = compare; }
    setArtistTrackSort(compare: (a: Track, b: Track) => number) { this.artistTrackSortCompare = compare; }
    setArtistAlbumSort(compare: (a: Album, b: Album) => number) { this.artistAlbumSortCompare = compare; }
    setGenreSort(compare: (a: Genre, b: Genre) => number) { this.genreSortCompare = compare; }
    setGenreTrackSort(compare: (a: Track, b: Track) => number) { this.genreTrackSortCompare = compare; }
    setGenreAlbumSort(compare: (a: Album, b: Album) => number) { this.genreAlbumSortCompare = compare; }
    setPlaylistSort(compare: (a: Playlist, b: Playlist) => number) { this.playlistSortCompare = compare; }
    setAllTrackSort(compare: (a: Track, b: Track) => number) {
        this.setTrackSort(compare);
        this.setAlbumTrackSort(compare);
        this.setArtistTrackSort(compare);
        this.setGenreTrackSort(compare);
    }
    setAllAlbumSort(compare: (a: Album, b: Album) => number) {
        this.setAlbumSort(compare);
        this.setArtistAlbumSort(compare);
        this.setGenreAlbumSort(compare);
    }

    addChunk(type: ChunkType, value?: any, data?: any) {
        const chunk = { type, value, data };
        return this.chunks.push(chunk) - 1;
    }

    parseChunks() {
        for (let index = 0; index < this.chunks.length; index++) {
            const chunk = this.chunks[index];

            if (chunk.type === ChunkType.TRACK) Object.assign(chunk.value, this.parseTrackChunk(chunk.data!)); else
            if (chunk.type === ChunkType.ALBUM) Object.assign(chunk.value, this.parseAlbumChunk(chunk.data!)); else
            if (chunk.type === ChunkType.ARTIST) Object.assign(chunk.value, this.parseArtistChunk(chunk.data!)); else
            if (chunk.type === ChunkType.GENRE) Object.assign(chunk.value, this.parseGenreChunk(chunk.data!)); else
            if (chunk.type === ChunkType.PLAYLIST) Object.assign(chunk.value, this.parsePlaylistChunk(chunk.data!)); else
            if (chunk.type === ChunkType.CHUNK_HEADER) Object.assign(chunk.value, this.parseChunkHeaderChunk(chunk.data!)); else
            if (chunk.type === ChunkType.PLAYLIST_ENTRY) Object.assign(chunk.value, this.parsePlaylistEntryChunk(chunk.data!));
        }
    }

    createChunks() {
        for (let index = 0; index < this.chunks.length; index++) {
            const chunk = this.chunks[index];

            if (chunk.type === ChunkType.PLACEHOLDER) chunk.data = this.createPlaceholderChunk(index); else
            if (chunk.type === ChunkType.TRACK) chunk.data = this.createTrackChunk(index, chunk.value); else
            if (chunk.type === ChunkType.ALBUM) chunk.data = this.createAlbumChunk(index, chunk.value); else
            if (chunk.type === ChunkType.ARTIST) chunk.data = this.createArtistChunk(index, chunk.value); else
            if (chunk.type === ChunkType.GENRE) chunk.data = this.createGenreChunk(index, chunk.value); else
            if (chunk.type === ChunkType.PLAYLIST) chunk.data = this.createPlaylistChunk(index, chunk.value); else
            if (chunk.type === ChunkType.HEADER) chunk.data = this.createHeaderChunk(); else
            if (chunk.type === ChunkType.CHUNK_HEADER) chunk.data = this.createChunkHeaderChunk(index, chunk.value); else
            if (chunk.type === ChunkType.PLAYLIST_ENTRY) chunk.data = this.createPlaylistEntryChunk(index, chunk.value);
        }

        return Buffer.concat(this.chunks.map(chunk => chunk.data!));
    }

    // TODO: maybe make compare function decent
    filterChunks(type: ChunkType, filter?: (value: any, chunk: any) => any, sortCompare?: (a: any, b: any) => number) {
        const chunks: { chunk: Chunk; index: number; }[] = this.chunks.map((chunk, index) => ({ chunk, index })).filter(({ chunk }) => chunk.type === type && (filter ? filter(chunk.value, chunk) : true));
        if (sortCompare) chunks.sort((a, b) => sortCompare(a.chunk.value, b.chunk.value));
        return {
            chunks: chunks.map(i => i.chunk),
            indexes: chunks.map(i => i.index),
            length: chunks.length
        };
    }

    findChunkIndex(value: any) {
        const index = this.chunks.findIndex(chunk => chunk.value === value);
        return index;
    }

    findChunks(type: ChunkType, filter?: (value: any, chunk: any) => any, sortCompare?: (a: any, b: any) => number, defaultIndex?: number) {
        const { chunks, indexes, length } = this.filterChunks(type, filter, sortCompare);
        const firstIndex = indexes[0] ?? defaultIndex;
        const lastIndex = indexes[indexes.length - 1] ?? defaultIndex;
        if (firstIndex === undefined || lastIndex === undefined) throw new Error('An index is undefined!');
        return {
            firstIndex,
            lastIndex,
            length,
            chunks
        };
    }

    findClosestChunks(type: ChunkType, index: number, defaultIndex?: number, sortCompare?: (a: any, b: any) => number, filter?: (value: any, chunk: any) => any) {
        const { indexes } = this.filterChunks(type, filter, sortCompare);
        const sortedIndex = indexes.indexOf(index);
        if (sortedIndex < 0) throw new Error('Could not find chunk!');
        const previousIndex = indexes[sortedIndex - 1] ?? defaultIndex;
        const nextIndex = indexes[sortedIndex + 1] ?? defaultIndex;
        if (previousIndex === undefined || nextIndex === undefined) throw new Error('An index is undefined!');
        return {
            previousIndex,
            nextIndex
        };
    }

    createPlaceholderChunk(index: number) { return new PlaceholderChunk(this).create(index); }

    createTrackChunk(index: number, track: Track) { return new TrackChunk(this).create(index, track); }
    parseTrackChunk(chunk: Buffer) { return new TrackChunk(this).parse(chunk); }

    createAlbumChunk(index: number, album: Album) { return new AlbumChunk(this).create(index, album); }
    parseAlbumChunk(chunk: Buffer) { return new AlbumChunk(this).parse(chunk); }

    createArtistChunk(index: number, artist: Artist) { return new ArtistChunk(this).create(index, artist); }
    parseArtistChunk(chunk: Buffer) { return new ArtistChunk(this).parse(chunk); }

    createGenreChunk(index: number, genre: Genre) { return new GenreChunk(this).create(index, genre); }
    parseGenreChunk(chunk: Buffer) { return new GenreChunk(this).parse(chunk); }

    createPlaylistChunk(index: number, playlist: Playlist) { return new PlaylistChunk(this).create(index, playlist); }
    parsePlaylistChunk(chunk: Buffer) { return new PlaylistChunk(this).parse(chunk); }

    createHeaderChunk() { return new HeaderChunk(this).create(); }

    createChunkHeaderChunk(index: number, chunkHeader: ChunkHeader) { return new ChunkHeaderChunk(this).create(index, chunkHeader); }
    parseChunkHeaderChunk(chunk: Buffer) { return new ChunkHeaderChunk(this).parse(chunk); }

    createPlaylistEntryChunk(index: number, playlistEntry: PlaylistEntry) { return new PlaylistEntryChunk(this).create(index, playlistEntry); }
    parsePlaylistEntryChunk(chunk: Buffer) { return new PlaylistEntryChunk(this).parse(chunk); }
}
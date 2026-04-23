import Buffer from './Buffer';
import { Track, Album, Artist, Genre, Playlist, PlaylistEntry } from './types';

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

export enum SortOrder {
    NAME_ASC,
    NAME_DESC,
    TRACK_ASC,
    TRACK_DESC,
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

export type ChunkHeader =
    | ChunkType.PLACEHOLDER
    | ChunkType.TRACK
    | ChunkType.ALBUM
    | ChunkType.ARTIST
    | ChunkType.GENRE
    | ChunkType.PLAYLIST;

export default class Mindex {
    chunks: Chunk[] = [];
    trackSort = SortOrder.NAME_ASC; // How tracks are sorted
    albumSort = SortOrder.NAME_ASC; // How albums are sorted
    albumTrackSort = SortOrder.TRACK_ASC; // How tracks in a album are sorted
    artistSort = SortOrder.NAME_ASC; // How artists are sorted
    artistTrackSort = SortOrder.NAME_ASC; // How tracks in a artist are sorted
    artistAlbumSort = SortOrder.NAME_ASC; // How albums in a artist are sorted
    genreSort = SortOrder.NAME_ASC; // Genre sort
    genreTrackSort = SortOrder.NAME_ASC; // How tracks in a genre are sorted
    genreAlbumSort = SortOrder.NAME_ASC; // How albums in a genre are sorted (NOTE: not sure what this changes as genre only shows tracks)
    playlistSort = SortOrder.NAME_ASC; // How playlists are sorted

    constructor(mindex?: Buffer) {
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
            // TODO: Import mindex
        }
    }

    createPlaceholder() {
        this.addChunk(ChunkType.PLACEHOLDER);
        return;
    }

    // TODO: use object instead of a bunch of args
    createTrack(name: string, duration: number, album: Album, artist: Artist, genre: Genre, trackNum?: number) {
        const track: Track = {
            name,
            duration,
            trackNum: trackNum ?? this.filterChunks(ChunkType.TRACK, (i: Track) => i.album === album).length + 1,
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

    createChunkHeader(relatedChunkType: ChunkHeader) {
        this.addChunk(ChunkType.CHUNK_HEADER, relatedChunkType);
        return;
    }

    createPlaylistEntry(track: Track, playlist: Playlist) {
        const playlistEntry: PlaylistEntry = { track, playlist };
        this.addChunk(ChunkType.PLAYLIST_ENTRY, playlistEntry);
        return playlistEntry;
    }

    addChunk(type: ChunkType, value?: any) {
        const chunk = { type, value };
        return this.chunks.push(chunk) - 1;
    }

    buildChunks() {
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

    // TODO: maybe make sortOrder better and use proper types in sort compare function
    filterChunks(type: ChunkType, filter?: (value: any, chunk: any) => any, sortOrder?: SortOrder) {
        const chunks: { chunk: Chunk; index: number; }[] = this.chunks.map((chunk, index) => ({ chunk, index })).filter(({ chunk }) => chunk.type === type && (filter ? filter(chunk.value, chunk) : true));
        if (sortOrder !== undefined) chunks.sort(({ chunk: a }: { chunk: any; }, { chunk: b }: { chunk: any; }) => {
            if (sortOrder === SortOrder.NAME_ASC) return a.value.name.localeCompare(b.value.name);
            if (sortOrder === SortOrder.NAME_DESC) return b.value.name.localeCompare(a.value.name);
            if (sortOrder === SortOrder.TRACK_ASC) return a.value.trackNum - b.value.trackNum;
            if (sortOrder === SortOrder.TRACK_DESC) return b.value.trackNum - a.value.trackNum;
            return 0;
        });
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

    findChunks(type: ChunkType, filter?: (value: any, chunk: any) => any, sortOrder?: SortOrder, defaultIndex?: number) {
        const { chunks, indexes, length } = this.filterChunks(type, filter, sortOrder);
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

    findClosestChunks(type: ChunkType, index: number, defaultIndex?: number, sortOrder?: SortOrder, filter?: (value: any, chunk: any) => any) {
        const { indexes } = this.filterChunks(type, filter, sortOrder);
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

    createPlaceholderChunk(index: number) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.PLACEHOLDER, index, ChunkType.PLACEHOLDER);

        const chunk = new Buffer(600);
        chunk.writeUInt32(ChunkType.PLACEHOLDER, 0x00); // Chunk type
        chunk.writeUInt32(previousIndex, 0x04); // Previous placeholder or chunk type if first
        chunk.writeUInt32(nextIndex, 0x08); // Next placeholder or chunk type if last
        chunk.writeUInt32(ChunkType.PLACEHOLDER, 0x0C); // Chunk type
        return chunk;
    }

    createTrackChunk(index: number, track: Track) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.TRACK, index, ChunkType.TRACK, this.trackSort);

        const playlistEntries = this.findChunks(ChunkType.PLAYLIST_ENTRY, (playlistEntry: PlaylistEntry) => playlistEntry.track === track, undefined, -1);

        const albumIndex = this.findChunkIndex(track.album);
        const artistIndex = this.findChunkIndex(track.artist);
        const genreIndex = this.findChunkIndex(track.genre);

        const { previousIndex: previousIndexAlbum, nextIndex: nextIndexAlbum } = this.findClosestChunks(ChunkType.TRACK, index, albumIndex, this.albumTrackSort, ({ album }: Track) => album === track.album);
        const { previousIndex: previousIndexArtist, nextIndex: nextIndexArtist } = this.findClosestChunks(ChunkType.TRACK, index, artistIndex, this.artistTrackSort, ({ artist }: Track) => artist === track.artist);
        const { previousIndex: previousIndexGenre, nextIndex: nextIndexGenre } = this.findClosestChunks(ChunkType.TRACK, index, genreIndex, this.genreTrackSort, ({ genre }: Track) => genre === track.genre);

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
        chunk.writeUInt8(5 + this.filterChunks(ChunkType.TRACK, (i: Track, chunk) => i.album === track.album && chunk.data).length * 4, 0x93); // 5 + <track index> * 4 (5, 9, 13, etc. wraps after 255)
        return chunk;
    }

    createAlbumChunk(index: number, album: Album) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.ALBUM, index, ChunkType.ALBUM, this.albumSort);
        
        const tracks = this.findChunks(ChunkType.TRACK, (track: Track) => track.album === album, this.albumTrackSort);

        const artistIndex = this.findChunkIndex(album.artist);
        const genreIndex = this.findChunkIndex(album.genre);

        const { previousIndex: previousIndexArtist, nextIndex: nextIndexArtist } = this.findClosestChunks(ChunkType.ALBUM, index, artistIndex, this.artistAlbumSort, ({ artist }: Album) => artist === album.artist);
        const { previousIndex: previousIndexGenre, nextIndex: nextIndexGenre } = this.findClosestChunks(ChunkType.ALBUM, index, genreIndex, this.genreAlbumSort, ({ genre }: Album) => genre === album.genre);
        
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

    createArtistChunk(index: number, artist: Artist) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.ARTIST, index, ChunkType.ARTIST, this.artistSort);

        const tracks = this.findChunks(ChunkType.TRACK, (track: Track) => track.artist === artist, this.artistTrackSort);
        const albums = this.findChunks(ChunkType.ALBUM, (album: Album) => album.artist === artist, this.artistAlbumSort);

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

    createGenreChunk(index: number, genre: Genre) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.GENRE, index, ChunkType.GENRE, this.genreSort);

        const tracks = this.findChunks(ChunkType.TRACK, (track: Track) => track.genre === genre, this.genreTrackSort);
        const albums = this.findChunks(ChunkType.ALBUM, (album: Album) => album.genre === genre, this.genreAlbumSort);

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

    createPlaylistChunk(index: number, playlist: Playlist) {
        const { previousIndex, nextIndex } = this.findClosestChunks(ChunkType.PLAYLIST, index, ChunkType.PLAYLIST, this.playlistSort);

        const playlistEntries = this.findChunks(ChunkType.PLAYLIST_ENTRY, (playlistEntry: PlaylistEntry) => playlistEntry.playlist === playlist);

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

    createHeaderChunk() {
        const chunk = new Buffer(600);
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
        
        const relatedChunks = this.findChunks(chunkHeader, undefined,
            // Sort depending on related chunk type
            chunkHeader === ChunkType.TRACK ? this.trackSort :
            chunkHeader === ChunkType.ALBUM ? this.albumSort :
            chunkHeader === ChunkType.ARTIST ? this.artistSort :
            chunkHeader === ChunkType.GENRE ? this.genreSort :
            chunkHeader === ChunkType.PLAYLIST ? this.playlistSort :
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

    createPlaylistEntryChunk(index: number, playlistEntry: PlaylistEntry) {
        const playlistIndex = this.findChunkIndex(playlistEntry.playlist);
        const trackIndex = this.findChunkIndex(playlistEntry.track);

        const { previousIndex: previousIndexPlaylist, nextIndex: afterIndexPlaylist } = this.findClosestChunks(ChunkType.PLAYLIST_ENTRY, index, playlistIndex, undefined, ({ playlist }: PlaylistEntry) => playlist === playlistEntry.playlist);
        const { previousIndex: previousIndexTrack, nextIndex: afterIndexTrack } = this.findClosestChunks(ChunkType.PLAYLIST_ENTRY, index, trackIndex, undefined, ({ track }: PlaylistEntry) => track === playlistEntry.track);

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
}
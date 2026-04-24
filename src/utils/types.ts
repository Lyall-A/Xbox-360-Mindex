import { ChunkType } from './Mindex';

export type Track = {
    name: string;
    duration: number;
    album: Album;
    artist: Artist;
    genre: Genre;
};

export type Album = {
    name: string;
    artist: Artist;
    genre: Genre;
};

export type Artist = {
    name: string;
};

export type Genre = {
    name: string;
};

export type Playlist = {
    name: string;
};

export type ChunkHeader =
    | ChunkType.PLACEHOLDER
    | ChunkType.TRACK
    | ChunkType.ALBUM
    | ChunkType.ARTIST
    | ChunkType.GENRE
    | ChunkType.PLAYLIST;

export type PlaylistEntry = {
    playlist: Playlist;
    track: Track;
}
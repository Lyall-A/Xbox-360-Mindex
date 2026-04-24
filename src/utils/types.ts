export type Track = {
    name: string;
    duration: number;
    trackNum?: number;
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

export type PlaylistEntry = {
    playlist: Playlist;
    track: Track;
}
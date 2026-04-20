import fs from 'fs';
import path from 'path';

import { ChunkType } from '../utils/Mindex';

const mindexPath = process.argv[2];

const mindex = fs.readFileSync(mindexPath);
const chunks = mindex.length / 600;

const teardownPath = `${mindexPath}_teardown`;

if (fs.existsSync(teardownPath)) fs.rmSync(teardownPath, { recursive: true });
fs.mkdirSync(teardownPath);

const placeholders = [];
const tracks = [];
const albums = [];
const artists = [];
const genres = [];
const playlists = [];
const headers = [];
const chunkHeaders = [];
const playlistEntries = [];

for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
    const chunk = mindex.subarray(600 * chunkIndex, (600 * chunkIndex) + 600);
    const chunkType = chunk.readUInt32BE();

    const suffix =
        chunkType === ChunkType.PLACEHOLDER ? `placeholder-${placeholders.push(chunk) - 1}` :
        chunkType === ChunkType.TRACK ? `track-${tracks.push(chunk) - 1}` :
        chunkType === ChunkType.ALBUM ? `album-${albums.push(chunk) - 1}` :
        chunkType === ChunkType.ARTIST ? `artist-${artists.push(chunk) - 1}` :
        chunkType === ChunkType.GENRE ? `genre-${genres.push(chunk) - 1}` :
        chunkType === ChunkType.PLAYLIST ? `playlist-${playlists.push(chunk) - 1}` :
        chunkType === ChunkType.HEADER ? `header-${headers.push(chunk) - 1}` :
        chunkType === ChunkType.CHUNK_HEADER ? `chunkheader-${chunkHeaders.push(chunk) - 1}` :
        chunkType === ChunkType.PLAYLIST_ENTRY ? `playlistentry-${playlistEntries.push(chunk) - 1}` :
        undefined

    fs.writeFileSync(path.join(teardownPath, `chunk-${chunkIndex} - ${suffix}`), chunk);
}
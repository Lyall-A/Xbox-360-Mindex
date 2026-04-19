// Libs
import fs from 'fs';
import path from 'path';

// Utils
import Mindex from './utils/Mindex';
import FMIM from './utils/FMIM';
import convertTrack, { TrackMetadata } from './utils/convertTrack';
import getFiles from './utils/getFiles';
import { Album, Artist, Genre, Track } from './utils/types';

import config from '../config.json';

const trackPaths = getFiles(config.tracksPath)
    .filter(file => !config.extensions?.length || config.extensions.includes(path.extname(file).toLowerCase()));
const manifest: {
    trackPath: string;
    wmaPath: string;
    metadata: TrackMetadata;
}[] = (config.manifestOutputPath && fs.existsSync(config.manifestOutputPath)) ?
    JSON.parse(fs.readFileSync(config.manifestOutputPath, 'utf8')) : [];

(async () => {
    const mindex = new Mindex();

    const tracks: Track[] = [];
    const albums: Album[] = [];
    const artists: Artist[] = [];
    const genres: Genre[] = [];
    
    // convert tracks and create manifest
    for (const trackPath of trackPaths) {
        const existingManifest = manifest.find(i => i.trackPath === trackPath);
        if (existingManifest?.wmaPath && fs.existsSync(existingManifest.wmaPath)) continue;

        const wmaPath = path.join(config.wmaOutputPath, `${path.basename(trackPath, path.extname(trackPath))}.wma`);
        console.log(`Converting '${trackPath}' to WMA...`);
        const metadata = await convertTrack(trackPath, wmaPath);
        manifest.push({ trackPath, wmaPath, metadata });
    }

    // rename/delete existing mindex
    if (fs.existsSync(config.mindexOutputPath)) {
        if (config.backupExistingMindex) {
            fs.renameSync(config.mindexOutputPath, `${config.mindexOutputPath}_${Date.now()}`);
        } else {
            console.log('Deleting old mindex!');
            fs.rmSync(config.mindexOutputPath, { recursive: true });
        }
    }

    fs.mkdirSync(config.mindexOutputPath, { recursive: true }); // create mindex directory
    fs.mkdirSync(path.join(config.mindexOutputPath, 'media', '0000'), { recursive: true }); // create fmim directory

    // create mindex
    for (const { trackPath, wmaPath, metadata } of manifest) {
        const trackName = metadata.title ?? config.defaultTitle ?? path.basename(trackPath, path.extname(trackPath));
        const albumName = metadata.album ?? config.defaultAlbum ?? 'Unknown Album';
        const artistName = metadata.artist ?? config.defaultArtist ?? 'Unknown Artist';
        const genreName = metadata.genre ?? config.defaultGenre ?? 'Unknown Genre';

        const album = getAlbum(albumName, artistName, genreName);
        const artist = getArtist(artistName);
        const genre = getGenre(genreName);

        console.log(`Creating track '${trackName}'...`);
        const track = mindex.createTrack(trackName, metadata.length, tracks.filter(track => track.album === album).length + 1, album, artist, genre);
        const fmimBuffer = new FMIM(track, fs.readFileSync(wmaPath)); // create FMIM

        // write FMIM file
        // TODO: maybe the 0000 folder is in case chunk size goes over 65535? either way should probably add a check for this
        fs.writeFileSync(
            path.join(config.mindexOutputPath, 'media', '0000', mindex.findChunkIndex(track).toString(16).padStart(4, '0').toUpperCase()
        ), fmimBuffer);

        tracks.push(track);
    }

    console.log('Writing mindex file...');
    fs.writeFileSync(path.join(config.mindexOutputPath, 'mindex.xmi'), mindex.buildChunks()); // write mindex.xmi

    console.log('Writing manifest file...');
    fs.writeFileSync(config.manifestOutputPath, JSON.stringify(manifest)); // write manifest

    function getAlbum(albumName: string, artistName: string, genreName: string) {
        const album = albums.find(album => album.name === albumName);
        if (album) {
            return album;
        } else {
            const artist = getArtist(artistName);
            const genre = getGenre(genreName);
            console.log(`Creating album '${albumName}'...`);
            const album = mindex.createAlbum(albumName, artist, genre);
            albums.push(album);
            return album;
        }
    }

    function getArtist(artistName: string) {
        const artist = artists.find(artist => artist.name === artistName);
        if (artist) {
            return artist;
        } else {
            console.log(`Creating artist '${artistName}'...`);
            const artist = mindex.createArtist(artistName);
            artists.push(artist);
            return artist;
        }
    }

    function getGenre(genreName: string) {
        const genre = genres.find(genre => genre.name === genreName);
        if (genre) {
            return genre;
        } else {
            console.log(`Creating genre '${genreName}'...`);
            const genre = mindex.createGenre(genreName);
            genres.push(genre);
            return genre;
        }
    }
})();
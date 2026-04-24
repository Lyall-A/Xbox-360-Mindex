// Libs
import fs from 'fs';
import path from 'path';

// Utils
import Mindex from './utils/Mindex';
import FMIM from './utils/FMIM';
import convertTrack, { TrackMetadata } from './utils/convertTrack';
import getFiles from './utils/getFiles';
import { Album, Artist, Genre, Track } from './utils/types';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8')); // TODO: better handling of config

const mindexInputPath = process.argv[2];

(async () => {
    // TODO: optionally import mindexInputPath and extract manifest and WMA from it
    if (!fs.existsSync(config.tracksPath)) return console.log('There is no tracks folder!');

    // TODO: make this a bit better
    const trackPaths = getFiles(config.tracksPath).filter(file => !config.extensions?.length || config.extensions.includes(path.extname(file).toLowerCase()));
    const manifest: {
        trackPath: string;
        wmaPath: string;
        metadata: TrackMetadata;
    }[] = (config.manifestOutputPath && fs.existsSync(config.manifestOutputPath)) ? JSON.parse(fs.readFileSync(config.manifestOutputPath, 'utf8')) : [];

    const mindex = new Mindex();
    mindex.setAllTrackSort((a, b) => a.name.localeCompare(b.name)); // sort tracks by name
    mindex.setAlbumTrackSort((a, b) => {
        // sort tracks in album view by track num or name
        const trackA = tracks.find(({ track }) => track === a)!.metadata;
        const trackB = tracks.find(({ track }) => track === b)!.metadata;
        if (trackA.trackNum !== undefined && trackB.trackNum !== undefined) {
            return trackA.trackNum - trackB.trackNum; // sort by track num
        } else {
            return a.name.localeCompare(b.name); // fallback to name sort
        }
    });
    mindex.setAllAlbumSort((a, b) => a.name.localeCompare(b.name)); // sort albums by name
    mindex.setArtistSort((a, b) => a.name.localeCompare(b.name)); // sort artists by name
    mindex.setGenreSort((a, b) => a.name.localeCompare(b.name)); // sort genres by name
    mindex.setPlaylistSort((a, b) => a.name.localeCompare(b.name)); // sort playlists by name

    const tracks: { track: Track; metadata: TrackMetadata; }[] = [];
    const albums: Album[] = [];
    const artists: Artist[] = [];
    const genres: Genre[] = [];

    if (!fs.existsSync(config.wmaOutputPath)) fs.mkdirSync(config.wmaOutputPath, { recursive: true }); // create WMA directory
    
    // convert tracks and create manifest
    for (const trackPath of trackPaths) {
        const existingManifest = manifest.find(i => i.trackPath === trackPath);
        if (existingManifest?.wmaPath && fs.existsSync(existingManifest.wmaPath)) continue;

        const wmaPath = path.join(config.wmaOutputPath, `${path.basename(trackPath, path.extname(trackPath))}.wma`);
        console.log(`Converting '${trackPath}' to WMA...`);
        const metadata = await convertTrack(trackPath, wmaPath, config.ffmpegPath);
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
    fs.mkdirSync(path.join(config.mindexOutputPath, 'media', '0000'), { recursive: true }); // create FMIM directory

    // create mindex
    for (const { trackPath, wmaPath, metadata } of manifest) {
        if (!fs.existsSync(wmaPath) || (config.checkOriginalFiles && !fs.existsSync(trackPath))) {
            console.log(`The file '${path.basename(trackPath)}' was deleted!`);
            continue;
        };

        const trackName = normalizeName(metadata.title ?? config.defaultTrack ?? path.basename(trackPath, path.extname(trackPath)));
        const albumName = normalizeName(metadata.album ?? config.defaultAlbum ?? 'Unknown Album');
        const artistName = normalizeName(metadata.artist ?? config.defaultArtist ?? 'Unknown Artist', config.artistSeperators, config.artistJoin, config.useSingleArtist);
        const genreName = normalizeName(metadata.genre ?? config.defaultGenre ?? 'Unknown Genre', config.genreSeperators, config.genreJoin, config.useSingleGenre);

        const album = getAlbum(albumName, artistName, genreName);
        const artist = getArtist(artistName);
        const genre = getGenre(genreName);

        console.log(`Creating track '${trackName}'...`);
        const track = mindex.createTrack(trackName, metadata.length, album, artist, genre);
        const fmimBuffer = new FMIM(track, fs.readFileSync(wmaPath), metadata.trackNum); // create FMIM

        // write FMIM file
        // TODO: maybe the 0000 folder is in case chunk size goes over 65535? either way should probably add a check for this
        fs.writeFileSync(
            path.join(config.mindexOutputPath, 'media', '0000', mindex.findChunkIndex(track).toString(16).padStart(4, '0').toUpperCase()
        ), fmimBuffer);

        tracks.push({ track, metadata });
    }

    console.log('Writing mindex file...');
    fs.writeFileSync(path.join(config.mindexOutputPath, 'mindex.xmi'), mindex.createChunks()); // write mindex.xmi

    if (config.keepTracks) {
        // write manifest
        console.log('Writing manifest file...');
        fs.writeFileSync(config.manifestOutputPath, JSON.stringify(manifest));
    } else {
        // delete WMA directory
        console.log('Deleting WMA files...');
        fs.rmSync(config.wmaOutputPath, { recursive: true });
    }

    function normalizeName(name: string, seperators?: string[], join?: string, useSingle?: boolean) {
        if (seperators?.length) {
            for (const seperator of seperators) {
                const split = name.split(seperator)
                name = useSingle ? split[0] : split.join(join ?? seperator);
            }
        }
        return name;
    }

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
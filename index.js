const fs = require("fs");
const path = require("path");

const createMindexBuffer = require("./utils/createMindexBuffer");
const createFmimBuffer = require("./utils/createFmimBuffer");
const createTrack = require("./utils/createTrack");
const getFiles = require("./utils/getFiles");

const config = require("./config.json");

const tracks = [];
const trackPaths = getFiles(config.tracksPath)
    .filter(file => !config.supportedFormats?.length || config.supportedFormats.includes(path.extname(file).toLowerCase().substring(1)));
const allTracks = (config.trackInfoPath && fs.existsSync(config.trackInfoPath)) ? JSON.parse(fs.readFileSync(config.trackInfoPath)) : [];

(async () => {
    // Create WMA's/tracks
    for (let trackIndex = 0; trackIndex < trackPaths.length; trackIndex++) {
        const trackPath = trackPaths[trackIndex];

        const foundTrack = allTracks.find(track => track.trackPath === trackPath);
        if (!foundTrack?.wmaPath || !fs.existsSync(foundTrack.wmaPath)) {
            // Create track
            const wmaPath = path.join(config.wmaOutputPath, `${path.basename(trackPath, path.extname(trackPath))}.wma`);
            if (!fs.existsSync(path.dirname(wmaPath))) fs.mkdirSync(path.dirname(wmaPath), { recursive: true });
            
            console.log(`Converting track ${trackIndex + 1} of ${trackPaths.length} to WMA... (${path.basename(trackPath)})`);
            
            const track = await createTrack(trackPath, wmaPath);

            tracks.push(track);
            allTracks.push(track);
        } else {
            // Track already exists
            tracks.push(foundTrack);
        };
    };

    // All tracks getting converted
    const includedTracks = [...(config.includeOldTracks ? allTracks.filter(track => track?.wmaPath && fs.existsSync(track.wmaPath)) : tracks)].sort((a, b) => {
        // Sort tracks
        if (config.sortType === "title") {
            if (config.sortDirection === "desc") return b.title.localeCompare(a.title);
            return a.title.localeCompare(b.title);
        } else
        if (config.sortType === "artist") {
            if (config.sortDirection === "desc") return b.artist.localeCompare(a.artist);
            return a.artist.localeCompare(b.artist);
        } else
        if (config.sortType === "album") {
            if (config.sortDirection === "desc") return b.album.localeCompare(a.album);
            return a.album.localeCompare(b.album);
        }
    });

    // Create mindex directory
    const fmimPath = path.join(config.mindexOutputPath, "media/0000");
    if (fs.existsSync(config.mindexOutputPath)) fs.renameSync(config.mindexOutputPath, `${path.basename(config.mindexOutputPath)}_${Date.now()}`); // Move existing mindex directory
    if (!fs.existsSync(fmimPath)) fs.mkdirSync(fmimPath, { recursive: true });

    // Create FMIM's
    for (let trackIndex = 0; trackIndex < includedTracks.length; trackIndex++) {
        const track = includedTracks[trackIndex];

        console.log(`Converting track ${trackIndex + 1} of ${includedTracks.length} to FMIM... (${track.title} - ${track.album} - ${track.artist})`);

        // Create FMIM
        const fmimBuffer = createFmimBuffer(fs.readFileSync(track.wmaPath), track);
        fs.writeFileSync(path.join(fmimPath, (trackIndex === 0 ? 8 : 10 + trackIndex).toString(16).padStart(4, "0").toUpperCase()), fmimBuffer);

        if (!config.keepWma) {
            // Delete WMA after FMIM created
            fs.rmSync(track.wmaPath);
            track.wmaPath = null;
        };
    }

    // Create mindex.xmi
    console.log(`Creating mindex.xmi file...`);
    const mindexBuffer = createMindexBuffer(config.albumTitle, config.artistTitle, config.genreTitle, includedTracks);
    fs.writeFileSync(path.join(config.mindexOutputPath, "mindex.xmi"), mindexBuffer);

    if (config.trackInfoPath) {
        // Create tracks info file
        console.log("Generating track info file...");
        fs.writeFileSync(config.trackInfoPath, JSON.stringify(allTracks));
    }
})();
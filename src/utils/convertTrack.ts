import child_process from 'child_process';

import config from '../../config.json';

export type TrackMetadata = {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    trackNum?: number;
    length: number;
};

export default function convertTrack(trackPath: string, wmaPath: string): Promise<TrackMetadata> {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = child_process.spawn(config.ffmpegPath, [
            '-i', trackPath, // Original input path
            '-map', 'a:0', // First audio stream
            '-c:a', 'wmav2', // WMA codec
            '-b:a', '192k', // 192K bitrate
            '-ar', '44100', // 44100Hz
            '-ac', '2', // 2 channels
            '-map_metadata', '-1', // Strip metadata
            wmaPath, // WMA path
            '-y', // Overwrite existing
        ]);

        const ffmpegOutputChunks: Buffer[] = [];
        ffmpegProcess.stderr.on('data', data => ffmpegOutputChunks.push(data));

        ffmpegProcess.on('exit', async (code) => {
            const ffmpegOutput = Buffer.concat(ffmpegOutputChunks).toString();
            if (code !== 0) return reject(`FFmpeg closed with code ${code}! Output: ${ffmpegOutput}`);
            
            const durationMatch = ffmpegOutput.match(/duration: ([\d.]+):([\d.]+):([\d.]+)/i)!;
            const trackMetadata: TrackMetadata = {
                title: ffmpegOutput.match(/(?<=title           : ).*/i)?.[0],
                artist: ffmpegOutput.match(/(?<=artist          : ).*/i)?.[0],
                album: ffmpegOutput.match(/(?<=album           : ).*/i)?.[0],
                genre: ffmpegOutput.match(/(?<=genre           : ).*/i)?.[0],
                trackNum: Number(ffmpegOutput.match(/(?<=track           : ).*/i)?.[0]),
                length: Number(durationMatch[1]) * 3600000 + Number(durationMatch[2]) * 60000 + Number(durationMatch[3]) * 1000
            };
            // track.formattedTitle = config.titleFormat
            //         .replace(/{title}/g, track.title || '')
            //         .replace(/{artist}/g, track.artist || '')
            //         .replace(/{album}/g, track.album || '')
            //         .replace(/{genre}/g, track.genre || '')
            //         .replace(/{track}/g, track.track || '');

            return resolve(trackMetadata);
        });
    });
};
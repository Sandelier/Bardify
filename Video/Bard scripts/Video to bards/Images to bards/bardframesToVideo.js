const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cliProgress = require('cli-progress');
const { execSync } = require('child_process');

console.log("----------------------------------------------------");
console.log("bardframesToVideo.js");
console.log("");

const imagesDir = './bard_frames';
const ffmpegPath = '../../../ffmpeg.exe';


if (!fs.existsSync(ffmpegPath)) {
    try {
        const result = execSync('where ffmpeg', { stdio: ['pipe', 'pipe', 'ignore'] })
            .toString()
            .trim();

        if (!result || result.startsWith('INFO: Could not find')) {
            throw new Error();
        }

        ffmpegPath = result.split(/\r?\n/)[0];
    } catch (err) {
        console.error('ffmpeg.exe not found');
        process.exit(1);
    }
}

if (!fs.existsSync(imagesDir)) {
    console.error('bard_frames folder not found');
    process.exit(1);
}

const imageFiles = fs.readdirSync(imagesDir)
    .filter(file => /^bard_frame_\d{4}_grid\.png$/i.test(file));

if (imageFiles.length === 0) {
    console.error('No images in bard_frames folder');
    process.exit(1);
}

const outputVideo = 'bard_video.mp4';
if (fs.existsSync(outputVideo)) {
    console.log(`${outputVideo} already exists`);
    process.exit(0);
}

const framerate = 30;
const totalDuration = imageFiles.length / framerate;

const args = [
    '-framerate', framerate.toString(),
    '-start_number', '1',
    '-i', path.join(imagesDir, 'bard_frame_%04d_grid.png'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-shortest',
    outputVideo
];

const ffmpeg = spawn(ffmpegPath, args);

// Progress bar

const progressBar = new cliProgress.SingleBar({
    format: 'Converting to video |{bar}| {percentage}% | {eta_formatted}',
    hideCursor: true
}, cliProgress.Presets.shades_classic);

progressBar.start(totalDuration, 0);

ffmpeg.stderr.on('data', data => {
    const line = data.toString();
    const match = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseFloat(match[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        progressBar.update(Math.min(currentTime, totalDuration));
    }
});

ffmpeg.on('close', code => {
    progressBar.update(totalDuration);
    progressBar.stop();
    if (code === 0) {
        console.log('Video created:', outputVideo);
    } else {
        console.error('FFmpeg exited with code', code);
    }
});
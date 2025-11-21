const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Worker } = require("worker_threads");
const cliProgress = require("cli-progress");


console.log("----------------------------------------------------");
console.log("processVideo.js");
console.log("");

const ffmpegPath = '../../ffmpeg.exe';
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

const videoPath = "";
if (!fs.existsSync(videoPath)) {
    console.error('Video not found');
    process.exit(1);
}

const framesDir = `./frames`;
const outputDir = `./rescaled_frames`;
const bardPixelSize = 8;
const numThreads = 4;

if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Extract frames
console.log("Extracting frames");
// add (-vframes x) after videopath if you want to extract x amounth of frames. good for testing
execSync(
    `"${ffmpegPath}" -i "${videoPath}" "${framesDir}\\frame_%04d.png" -hide_banner -loglevel error`,
    { stdio: "inherit" }
);

console.log("Frames extracted");

// workers to rescale + change pixel data of each frame
const frameFiles = fs
    .readdirSync(framesDir)
    .filter(f => f.endsWith(".png"))

const chunkSize = Math.ceil(frameFiles.length / numThreads);
const promises = [];

const progressBar = new cliProgress.SingleBar({
    format: 'Processing Frames |{bar}| {value}/{total} | {eta_formatted}',
    hideCursor: true
}, cliProgress.Presets.shades_classic);


let processedFrames = 0;
progressBar.start(frameFiles.length, 0);

for (let i = 0; i < numThreads; i++) {
    const chunk = frameFiles.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length === 0) continue;

    promises.push(
        new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, "processVideo_Worker.js"), {
                workerData: { chunk, framesDir, outputDir, bardPixelSize }
            });

            worker.on("message", msg => {
                processedFrames++;
                progressBar.update(processedFrames);
            });
            worker.on("error", reject);
            worker.on("exit", code => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
                else resolve();
            });
        })
    );
}

Promise.all(promises).then(() => {
    progressBar.stop();
    console.log("All frames processed");
});
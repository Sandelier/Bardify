const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const cliProgress = require('cli-progress');

console.log("----------------------------------------------------");
console.log("ImagesToBinary.js");
console.log("");

const inputFolder = '../rescaled_frames';
const outputFolder = 'binary_grids';
const bardSize = 8;
const totalBards = 4096 / 4; // must be divisible by four
const bardsPerRow = Math.sqrt(totalBards);
const numThreads = 4;

if (!Number.isInteger(bardsPerRow)) {
    throw new Error('bardsPerRow must be divisible by four');
}

if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}

const files = fs.readdirSync(inputFolder).filter(file => path.extname(file).toLowerCase() === '.png');

const progressBar = new cliProgress.SingleBar({
    format: 'Converting frames to binary |{bar}| {value}/{total} | {eta_formatted}',
    hideCursor: true
}, cliProgress.Presets.shades_classic);
progressBar.start(files.length, 0);

let processedCount = 0;

// chunks for each worker
const chunks = [];
for (let i = 0; i < numThreads; i++) {
    chunks.push([]);
}
files.forEach((file, idx) => {
    chunks[idx % numThreads].push(file);
});

const workerPromises = chunks.map(chunk => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'ImagesToBinary_Worker.js'), {
            workerData: { files: chunk, inputFolder, outputFolder, bardSize, bardsPerRow }
        });

        worker.on('message', () => {
            processedCount++;
            progressBar.update(processedCount);
        });

        worker.on('error', reject);
        worker.on('exit', code => {
            if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            else resolve();
        });
    });
});

Promise.all(workerPromises)
    .then(() => {
        progressBar.stop();
        console.log('All frames converted');
    })
    .catch(err => {
        progressBar.stop();
        console.error(err);
    });
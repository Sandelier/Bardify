const fs = require("fs");
const path = require("path");
const cliProgress = require("cli-progress");
const { Worker } = require("worker_threads");

console.log("----------------------------------------------------");
console.log("BinariesIntoBardImages.js");
console.log("");

const binaryGridsFolder = "./binary_grids";
const outputFolder = "./bard_frames";

if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

async function processAllBardFrames() {
    const binaryFiles = fs.readdirSync(binaryGridsFolder).filter(f => f.endsWith("_grid.txt"));

    const files = binaryFiles.filter(f => {
        const outputPath = path.join(outputFolder, f.replace(".txt", ".png"));
        return !fs.existsSync(outputPath);
    });

    const totalFiles = files.length;

    if (totalFiles === 0) {
        console.log("All files are already processed");
        return;
    }

    // Progress bar
    let completedFiles = 0;
    const startTime = Date.now();

    const progressBar = new cliProgress.SingleBar({
        format: (options, params, payload) => {
            const barSize = options.barsize || 40;
            const completeLength = Math.round(barSize * params.progress);
            const bar = options.barCompleteChar.repeat(completeLength) + options.barIncompleteChar.repeat(barSize - completeLength);
            const percentage = (params.progress * 100).toFixed(1);
            return `Converting binaries into bard images |${bar}| ${percentage}% | ${params.value}/${params.total} | ${payload.eta}s`;
        },
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true
    });

    progressBar.start(totalFiles, 0, {
        eta: 0
    });

    const incrementProgress = () => {
        completedFiles++;
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = totalFiles - completedFiles;
        const eta = completedFiles === 0 ? 0 : Math.round((elapsed / completedFiles) * remaining);
        progressBar.update(completedFiles, {
            eta
        });
    };
    //

    const maxWorkers = 4;
    let currentIndex = 0;

    let lastGridContent = null;
    let lastImageBuffer = null;

    const runWorker = (file) => {
        return new Promise((resolve, reject) => {
            const filePath = path.join(binaryGridsFolder, file);
            const outputPath = path.join(outputFolder, file.replace(".txt", ".png"));

            const gridContent = fs.readFileSync(filePath, "utf-8");

            if (lastGridContent && lastGridContent === gridContent) {
                fs.writeFileSync(outputPath, lastImageBuffer);
                incrementProgress();
                return resolve();
            }

            const worker = new Worker(path.join(__dirname, "BinariesIntoBardImages_Worker.js"), {
                workerData: { filePath }
            });

            worker.on("message", msg => {
                if (msg.type === "done") {
                    fs.writeFileSync(outputPath, msg.imageBuffer);

                    lastGridContent = gridContent;
                    lastImageBuffer = msg.imageBuffer;

                    incrementProgress();
                    resolve();

                } else if (msg.type === "error") {
                    reject(new Error(msg.message));
                }
            });

            worker.on("error", reject);
            worker.on("exit", code => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    };

    const workerQueue = async () => {
        while (currentIndex < files.length) {
            const runningWorkers = [];
            for (let i = 0; i < maxWorkers && currentIndex < files.length; i++) {
                runningWorkers.push(runWorker(files[currentIndex++]));
            }
            await Promise.all(runningWorkers);
        }
    };

    await workerQueue();
    progressBar.stop();
    console.log("All files processed!");
}

processAllBardFrames().catch(err => console.error(err));
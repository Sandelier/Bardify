const fs = require("fs");
const { Jimp } = require('jimp');
const { workerData, parentPort } = require("worker_threads");
const { createBardImage } = require("./placeNotesToPlayarea/placeNotesToPlayarea");

function extractNoteSequence(bardSquare) {
    const notes = [];
    for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 8; row++) {
            const n = bardSquare[row][col];
            if (n !== 0) notes.push(n);
        }
    }
    return notes;
}

async function processBardFile(filePath) {
    const rawLines = fs.readFileSync(filePath, "utf8").trim().split("\n");
    const gridHeight = rawLines.length;
    const gridWidth = rawLines[0].length;
    const numberGrid = rawLines.map(line => line.split("").map(Number));

    const bardRows = Math.floor(gridHeight / 8);
    const bardCols = Math.floor(gridWidth / 8);

    const sampleSquare = numberGrid.slice(0, 8).map(row => row.slice(0, 8));
    const sampleImage = await createBardImage(extractNoteSequence(sampleSquare));
    const singleBardWidth = sampleImage.bitmap.width;
    const singleBardHeight = sampleImage.bitmap.height;

    const finalWidth = bardCols * singleBardWidth;
    const finalHeight = bardRows * singleBardHeight;
    const finalImage = new Jimp({
        width: finalWidth,
        height: finalHeight
    });

    for (let br = 0; br < bardRows; br++) {
        const rowImages = await Promise.all(
            Array.from({ length: bardCols }, (_, bc) => {
                const bardSquare = [];
                for (let r = 0; r < 8; r++) {
                    bardSquare.push(numberGrid[br * 8 + r].slice(bc * 8, bc * 8 + 8));
                }
                return createBardImage(extractNoteSequence(bardSquare));
            })
        );

        for (let bc = 0; bc < bardCols; bc++) {
            finalImage.composite(rowImages[bc], bc * singleBardWidth, br * singleBardHeight);
        }
    }

    return finalImage;
}

processBardFile(workerData.filePath)
    .then(finalImage => finalImage.getBuffer('image/png'))
    .then(buffer => parentPort.postMessage({
        type: "done",
        imageBuffer: buffer
    }))
    .catch(err => parentPort.postMessage({
        type: "error",
        message: err.message
    }));
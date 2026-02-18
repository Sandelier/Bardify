const fs = require('fs');
const path = require('path');
const { Jimp, intToRGBA } = require('jimp');
const { workerData, parentPort } = require('worker_threads');

const { files, inputFolder, outputFolder, bardSize, bardsPerRow } = workerData;

files.forEach(async (file) => {
    const inputFile = path.join(inputFolder, file);
    const outputFile = path.join(outputFolder, file.replace('.png', '_grid.txt'));

    try {
        const image = await Jimp.read(inputFile);
        const totalBardWidth = bardSize * bardsPerRow;
        const totalBardHeight = bardSize * bardsPerRow;
        const scaleX = image.bitmap.width / totalBardWidth;
        const scaleY = image.bitmap.height / totalBardHeight;

        const grid = Array.from({length: totalBardHeight}, () => Array(totalBardWidth).fill(0));

        for (let by = 0; by < bardsPerRow; by++) {
            for (let bx = 0; bx < bardsPerRow; bx++) {
                const startY = by * bardSize;
                const startX = bx * bardSize;

                const columnPlayed = Array(bardSize).fill(false); // Since bards can't play two notes in same column

                for (let y = 0; y < bardSize; y++) {
                    for (let x = 0; x < bardSize; x++) {
                        if (columnPlayed[x]) continue;

                        let notePlayed = false;
                        const pyStart = Math.floor(y * scaleY + by * bardSize * scaleY);
                        const pyEnd = Math.floor((y + 1) * scaleY + by * bardSize * scaleY);
                        const pxStart = Math.floor(x * scaleX + bx * bardSize * scaleX);
                        const pxEnd = Math.floor((x + 1) * scaleX + bx * bardSize * scaleX);

                        // Sets which note to play
                        for (let py = pyStart; py < pyEnd; py++) {
                            if (notePlayed) break;
                            for (let px = pxStart; px < pxEnd; px++) {
                                const { r, g, b } = intToRGBA(image.getPixelColor(px, py));
                                if (r === 255 && g === 255 && b === 255) {
                                    const noteNumber = 8 - y;
                                    grid[startY + y][startX + x] = noteNumber;
                                    columnPlayed[x] = true;
                                    notePlayed = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                // Columns have to be sequential since bard can't just skip a column
                let firstEmptyFound = false;
                let invalidBard = false;

                for (let x = 0; x < bardSize; x++) {
                    const isColumnEmpty = grid
                        .slice(startY, startY + bardSize)
                        .every(row => row[startX + x] === 0);

                    if (isColumnEmpty) firstEmptyFound = true;
                    else if (firstEmptyFound) {
                        invalidBard = true;
                        break;
                    }
                }

                if (invalidBard) {
                    for (let y = 0; y < bardSize; y++) {
                        for (let x = 0; x < bardSize; x++) {
                            grid[startY + y][startX + x] = 0;
                        }
                    }
                    continue;
                }
            }
        }

        const fileStream = fs.createWriteStream(outputFile);
        grid.forEach(row => fileStream.write(row.join('') + '\n'));
        fileStream.end();

        parentPort.postMessage({ file });
    } catch (err) {
        parentPort.postMessage({ file, error: err.message });
    }
});
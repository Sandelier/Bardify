const { parentPort, workerData } = require("worker_threads");
const path = require("path");
const { Jimp } = require('jimp');

(async () => {
    const { chunk, framesDir, outputDir, bardPixelSize } = workerData;
    for (const frameFile of chunk) {
        const framePath = path.join(framesDir, frameFile);
        const image = await Jimp.read(framePath);
        const { width, height } = image.bitmap;
        const binary = [];

        // Convert every pixel into binary
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                const r = image.bitmap.data[index];
                const g = image.bitmap.data[index + 1];
                const b = image.bitmap.data[index + 2];
                const brightness = Math.round((r + g + b) / 3);
                const bit = brightness >= 128 ? 1 : 0;
                row.push(bit);

                const bwColor = bit === 1 ? 255 : 0;
                image.bitmap.data[index] = bwColor;
                image.bitmap.data[index + 1] = bwColor;
                image.bitmap.data[index + 2] = bwColor;
                image.bitmap.data[index + 3] = 255;
            }
            binary.push(row);
        }
        const bardsX = Math.floor(width / bardPixelSize);
        const bardsY = Math.floor(height / bardPixelSize);
        const bardGrid = [];
        for (let by = 0; by < bardsY; by++) {
            const row = [];
            for (let bx = 0; bx < bardsX; bx++) {
                let total = 0;
                for (let py = 0; py < bardPixelSize; py++) {
                    for (let px = 0; px < bardPixelSize; px++) {
                        const x = bx * bardPixelSize + px;
                        const y = by * bardPixelSize + py;
                        total += binary[y][x];
                    }
                }
                row.push(total / (bardPixelSize * bardPixelSize) > 0.5 ? 1 : 0);
            }
            bardGrid.push(row);
        }

        const bardImage = new Jimp({
            width: bardsX,
            height: bardsY,
            color: 0xffffffff
        });

        // just picks the colors as they appear
        for (let y = 0; y < bardsY; y++) {
            for (let x = 0; x < bardsX; x++) {
                const bit = bardGrid[y][x];
                const pixelColor = bit === 1 ? 0xffffffff : 0x000000ff;
                bardImage.setPixelColor(pixelColor, x, y);
            }
        }

        // Picks the most common color and makes it into black

        // const flat = bardGrid.flat();
        //const count1 = flat.filter(v => v === 1).length;
        //const count0 = flat.length - count1;
        //const mostCommonIs = count1 >= count0 ? 1 : 0;
        //for (let y = 0; y < bardsY; y++) {
        //  for (let x = 0; x < bardsX; x++) {
        //    const bit = bardGrid[y][x];
        //    const pixelColor = bit === mostCommonIs ? 0x000000ff : 0xffffffff;
        //    bardImage.setPixelColor(pixelColor, x, y);
        //  }
        //}
        //

        const outImage = bardImage.scale(bardPixelSize);
        const outPath = path.join(outputDir, `bard_${frameFile}`);
        await outImage.write(outPath);
        parentPort.postMessage(`Processed ${frameFile}`);
    }
})();
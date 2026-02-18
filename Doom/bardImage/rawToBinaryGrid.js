const screenWidth = 287;
const screenHeight = 144;

function rawToBinaryGrid(rawBuffer, bardSize = 8, totalBards = 4096 / 4) {
    const bardsPerRow = Math.sqrt(totalBards);

    if (!Number.isInteger(bardsPerRow)) {
        throw new Error('bardsPerRow must be divisible by four');
    }

    if (rawBuffer.length !== screenWidth * screenHeight) {
        throw new Error(`Invalid raw size: ${rawBuffer.length}`);
    }

    const totalBardWidth = bardSize * bardsPerRow;
    const totalBardHeight = bardSize * bardsPerRow;

    const scaleX = screenWidth / totalBardWidth;
    const scaleY = screenHeight / totalBardHeight;

    const grid = Array.from({
            length: totalBardHeight
        },
        () => Array(totalBardWidth)
        .fill(0)
    );

    function isWhite(px, py) {
        const idx = py * screenWidth + px;
        return rawBuffer[idx] !== 0;
    }

    for (let by = 0; by < bardsPerRow; by++) {
        for (let bx = 0; bx < bardsPerRow; bx++) {
            const startY = by * bardSize;
            const startX = bx * bardSize;

            const columnPlayed = Array(bardSize)
                .fill(false);

            for (let y = 0; y < bardSize; y++) {
                for (let x = 0; x < bardSize; x++) {
                    if (columnPlayed[x]) continue;

                    let notePlayed = false;

                    const pyStart = Math.round(y * scaleY + by * bardSize * scaleY);
                    let pyEnd = Math.round((y + 1) * scaleY + by * bardSize * scaleY);
                    if (pyEnd <= pyStart) pyEnd = pyStart + 1;
                    if (pyEnd > screenHeight) pyEnd = screenHeight;

                    const pxStart = Math.round(x * scaleX + bx * bardSize * scaleX);
                    let pxEnd = Math.round((x + 1) * scaleX + bx * bardSize * scaleX);
                    if (pxEnd <= pxStart) pxEnd = pxStart + 1;
                    if (pxEnd > screenWidth) pxEnd = screenWidth;

                    for (let py = pyStart; py < pyEnd; py++) {
                        if (notePlayed) break;

                        for (let px = pxStart; px < pxEnd; px++) {
                            if (isWhite(px, py)) {
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
            }
        }
    }

    return grid;
}

module.exports = rawToBinaryGrid;
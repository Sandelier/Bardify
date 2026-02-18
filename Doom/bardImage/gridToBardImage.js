function extractNotePositions(square, options = {}) {
    const startX = options.startX ?? 26;
    const xIncrement = options.xIncrement ?? 17;
    const startY = options.startY ?? 36;
    const yIncrement = options.yIncrement ?? -4;

    const notes = [];
    for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 8; row++) {
            const n = square[row][col];
            if (n !== 0) {
                const x = startX + xIncrement * col;
                const y = startY + yIncrement * (n - 1);
                notes.push({
                    note: n,
                    x,
                    y
                });
            }
        }
    }
    return notes;
}

function gridToBardImageBuffer(numberGrid, options = {}) {
    if (!numberGrid || !numberGrid.length || !numberGrid[0].length) {
        throw new Error("Invalid grid provided");
    }

    const gridHeight = numberGrid.length;
    const gridWidth = numberGrid[0].length;

    const bardRows = Math.floor(gridHeight / 8);
    const bardCols = Math.floor(gridWidth / 8);

    const bardGrid = [];

    for (let br = 0; br < bardRows; br++) {
        const rowSquares = [];
        for (let bc = 0; bc < bardCols; bc++) {
            const square = [];
            for (let r = 0; r < 8; r++) {
                square.push(numberGrid[br * 8 + r].slice(bc * 8, bc * 8 + 8));
            }
            rowSquares.push({
                baseId: 0,
                notes: extractNotePositions(square, options)
            });
        }
        bardGrid.push(rowSquares);
    }

    return bardGrid;
}

module.exports = {
    gridToBardImageBuffer
};
doomCanvas = document.getElementById('doomCanvas');
const ctx = doomCanvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const playareaCanvas = document.getElementById('playareaCanvas');
const playareaCtx = playareaCanvas.getContext('2d');
playareaCtx.imageSmoothingEnabled = false;

const doomVpWidth = 287;
const doomVpHeight = 144;

const imageData = ctx.createImageData(doomVpWidth, doomVpHeight);

const playAreaWidth = 168;
const playAreaHeight = 51;

const playAreaBase = new Image();
playAreaBase.src = '../bardImage/placeNotesToPlayarea/bardPlayArea.png';
let bardPlayAreaMode = 0;
let previousbardPlayAreaMode = 0;

const noteImages = [];
for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `../bardImage/notes/${i}.png`;
    noteImages.push(img);
}


function drawPlayAreas() {
    playareaCtx.clearRect(0, 0, playareaCanvas.width, playareaCanvas.height);

    const cellWidth = Math.floor(playareaCanvas.width / playAreas_X);
    const imgRatio = playAreaBase.width / playAreaBase.height;
    const cellHeight = Math.floor(cellWidth / imgRatio);

    const gridWidth = cellWidth * playAreas_X;
    const gridHeight = cellHeight * playAreas_Y;

    const offsetGridX = Math.floor((playareaCanvas.width - gridWidth) / 2);
    const offsetGridY = Math.floor((playareaCanvas.height - gridHeight) / 2);

    const drawW = cellWidth;
    const drawH = Math.floor(drawW / imgRatio);

    for (let y = 0; y < playAreas_Y; y++) {
        const drawY = offsetGridY + y * cellHeight;
        const offsetY = Math.floor(drawY + (cellHeight - drawH) / 2);

        for (let x = 0; x < playAreas_X; x++) {
            const drawX = offsetGridX + x * cellWidth;
            const offsetX = Math.floor(drawX);

            if (playAreaBase.complete && bardPlayAreaMode === 0) {
                playareaCtx.drawImage(playAreaBase, offsetX, offsetY, drawW, drawH);
            } else if (bardPlayAreaMode === 1) {
                playareaCtx.strokeStyle = '#324b32';
                playareaCtx.lineWidth = 2;
                playareaCtx.strokeRect(offsetX, offsetY, drawW, drawH);
            }
        }
    }
}

let lastFrameKey = null;
let oldPlayAreaX = null;
function drawBardGrid() {

     if (oldPlayAreaX !== playAreas_X || previousbardPlayAreaMode !== bardPlayAreaMode) {
        playareaCanvas.width = doomCanvas.width
        playareaCanvas.height = doomCanvas.height
        previousbardPlayAreaMode = bardPlayAreaMode;
        drawPlayAreas();
        oldPlayAreaX = playAreas_X;
    }

    const frameKey = JSON.stringify({ mode: bardPlayAreaMode, width: doomCanvas.width, height: doomCanvas.height, data: bardData });
    if (frameKey === lastFrameKey) {
        ws.send(JSON.stringify({ type: 'frameRendered' }));
        return;
    }

    lastFrameKey = frameKey;

    ctx.clearRect(0, 0, doomCanvas.width, doomCanvas.height);

    const cellWidth = Math.floor(doomCanvas.width / playAreas_X);
    const imgRatio = playAreaBase.width / playAreaBase.height;
    const cellHeight = Math.floor(cellWidth / imgRatio);

    const gridWidth = cellWidth * playAreas_X;
    const gridHeight = cellHeight * playAreas_Y;

    const offsetGridX = Math.floor((doomCanvas.width - gridWidth) / 2);
    const offsetGridY = Math.floor((doomCanvas.height - gridHeight) / 2);

    const drawW = cellWidth;
    const drawH = Math.floor(drawW / imgRatio);

    for (let y = 0; y < playAreas_Y; y++) {
        const drawY = offsetGridY + y * cellHeight;
        const offsetY = Math.floor(drawY + (cellHeight - drawH) / 2);

        for (let x = 0; x < playAreas_X; x++) {
            if (!bardData[y] || !bardData[y][x]) continue;
            const square = bardData[y][x];
            const drawX = offsetGridX + x * cellWidth;
            const offsetX = Math.floor(drawX);

            const scaleX = drawW / playAreaWidth;
            const scaleY = drawH / playAreaHeight;

            for (const note of square.notes) {
                const img = noteImages[note.note - 1];
                if (!img.complete) continue;

                const noteX = Math.floor(offsetX + note.x * scaleX);
                const noteY = Math.floor(offsetY + note.y * scaleY);
                const noteW = Math.floor(img.width * scaleX);
                const noteH = Math.floor(img.height * scaleY);

                ctx.drawImage(img, noteX, noteY, noteW, noteH);
            }
        }
    }

    ws.send(JSON.stringify({ type: 'frameRendered' }));
}




function drawShiftedFrame() {
    const shifted = new Uint8Array(doomVpWidth * doomVpHeight);

    for (let y = 0; y < doomVpHeight; y++) {
        const sourceYGlobal = (y - shiftY + doomVpHeight) % doomVpHeight;
        const sourceYLeft = (y - leftSectionShiftY + doomVpHeight) % doomVpHeight;

        for (let x = 0; x < doomVpWidth; x++) {
            const sourceX = (x - shiftX + doomVpWidth) % doomVpWidth;
            shifted[y * doomVpWidth + x] =
                x < shiftX ?
                frame[sourceYLeft * doomVpWidth + sourceX] :
                frame[sourceYGlobal * doomVpWidth + sourceX];
        }
    }

    for (let i = 0; i < shifted.length; i++) {
        const color = shifted[i];
        imageData.data[i * 4 + 0] = color;
        imageData.data[i * 4 + 1] = color;
        imageData.data[i * 4 + 2] = color;
        imageData.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
}
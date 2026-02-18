let doomCanvas = document.getElementById('doomCanvas');
const perfOverlay = document.getElementById('perfOverlay');

doomCanvas.width = doomVpWidth;
doomCanvas.height = doomVpHeight;

let frame = new Uint8Array(doomVpWidth * doomVpHeight);

let shiftX = 0,
    shiftY = 0,
    leftSectionShiftY = 0;

let bardMode = false;

let serverShift = 0;
let serverGrid = 0;
let serverBardImg = 0;
let lastParseTime = 0;
let lastDrawTime = 0;
let lastFrameTime = 0;

let playAreas_X = 32;
let playAreas_Y = 32;

let bardData = [];

const perfTotal = document.getElementById("perfTotal");
const perfSpeed = document.getElementById("perfSpeed");
const perfServerTotal = document.getElementById("perfServerTotal");
const perfServerShift = document.getElementById("perfServerShift");
const perfServerGrid = document.getElementById("perfServerGrid");
const perfServerBardImg = document.getElementById("perfServerBardImg");
const perfParse = document.getElementById("perfParse");
const perfDraw = document.getElementById("perfDraw");
const perfBards = document.getElementById("perfBards");
const perfShiftX = document.getElementById("perfShiftX");
const perfShiftY = document.getElementById("perfShiftY");
const perfSectionShift = document.getElementById("perfSectionShift");
const perfRecording = document.getElementById("perfRecording");

function updatePerfOverlay() {
    const serverTotal = serverShift + serverGrid + serverBardImg;
    const total = serverTotal + lastParseTime + lastDrawTime;

    perfTotal.textContent = total.toFixed(2);

    const speed = 1000 / total;
    perfSpeed.textContent = speed.toFixed(0);

    perfSpeed.style.color = speed <= 35 ? "red" : "";

    perfServerTotal.textContent = serverTotal.toFixed(2);
    perfServerShift.textContent = serverShift.toFixed(2);
    perfServerGrid.textContent = serverGrid.toFixed(2);
    perfServerBardImg.textContent = serverBardImg.toFixed(2);

    perfParse.textContent = lastParseTime.toFixed(2);
    perfDraw.textContent = lastDrawTime.toFixed(2);

    perfBards.textContent = playAreas_X * playAreas_Y;
    perfShiftX.textContent = shiftX;
    perfShiftY.textContent = shiftY;
    perfSectionShift.textContent = leftSectionShiftY;
    perfRecording.textContent = recorder ? recorder.state : "inactive";
}

const ws = new WebSocket('ws://localhost:3000');
ws.binaryType = 'arraybuffer';

ws.onmessage = (msg) => {
    const frameStart = performance.now();
    const buffer = msg.data;

    if (buffer instanceof ArrayBuffer && buffer.byteLength === doomVpWidth * doomVpHeight) {
        if (bardMode) {
            bardMode = false;
            doomCanvas.width = doomVpWidth;
            doomCanvas.height = doomVpHeight;
            resizeCanvasToViewport(doomVpWidth, doomVpHeight);
        }

        doomCanvas.style.filter = 'brightness(100)';
        frame.set(new Uint8Array(buffer));

        const drawStart = performance.now();
        drawShiftedFrame();
        lastDrawTime = performance.now() - drawStart;

        serverShift = 0;
        serverGrid = 0;
        serverBardImg = 0;
        lastParseTime = 0;

        lastFrameTime = performance.now() - frameStart;
        updatePerfOverlay();
        return;
    }

    try {
        const parseStart = performance.now();
        const data = JSON.parse(buffer);
        lastParseTime = performance.now() - parseStart;

        if (data.type === 'bardFrame') {
            serverShift = data.timings?.shift || 0;
            serverGrid = data.timings?.grid || 0;
            serverBardImg = data.timings?.bardImg || 0;
            bardData = data.grid;

            if (!bardMode) {
                bardMode = true;

                //doomCanvas.width = 3840;
                //doomCanvas.height = 2160;

                doomCanvas.width = 1920;
                doomCanvas.height = 1080;

                resizeCanvasToViewport(RECORD_WIDTH, RECORD_HEIGHT);
            }

            doomCanvas.style.filter = 'none';

            const drawStart = performance.now();
            drawBardGrid();
            lastDrawTime = performance.now() - drawStart;

            lastFrameTime = performance.now() - frameStart;
            updatePerfOverlay();
        }
    } catch (err) {}
};

function resizeCanvasToViewport(imgWidth, imgHeight) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const aspect = imgWidth / imgHeight;

    let newWidth = viewportWidth;
    let newHeight = newWidth / aspect;

    if (newHeight > viewportHeight) {
        newHeight = viewportHeight;
        newWidth = newHeight * aspect;
    }

    doomCanvas.style.width = newWidth + 'px';
    doomCanvas.style.height = newHeight + 'px';

    playareaCanvas.style.width = newWidth + 'px';
    playareaCanvas.style.height = newHeight + 'px';
}

function updateGridSize(delta) {
    playAreas_X = Math.max(1, playAreas_X + delta);
    playAreas_Y = Math.max(1, playAreas_Y + delta);

    if (bardMode) {
        drawBardGrid();
    }

    ws.send(
        JSON.stringify({
            type: 'updateGridSize',
            gridSize: playAreas_X
        })
    );
}

resizeCanvasToViewport(doomVpWidth, doomVpHeight);
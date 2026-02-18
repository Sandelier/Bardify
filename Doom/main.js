const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const XXH = require("xxhashjs");
const rawToBinaryGrid = require("./bardImage/rawToBinaryGrid");
const { gridToBardImageBuffer } = require('./bardImage/gridToBardImage');

const CROP_WIDTH = 287; // Doom viewport
const CROP_HEIGHT = 144; // Doom viewport
const FRAME_SIZE = CROP_WIDTH * CROP_HEIGHT;


// Wasnt motivated enough to figure out why the doom frame draws differently everytime we load an level
// So we just have an shift mechanism to fix the pixel locations
let shiftState = { shiftX: 0, shiftY: 0, leftSectionShiftY: 0 };

let processingLocked = false;

const doom = spawn(
    "chocolate-doom.exe path",
  [
    "-iwad",
    "DOOM.WAD path",
    //"-nosound",
    //"-nomusic"
  ], {
        stdio: ["ignore", "pipe", "pipe", "pipe"]
    }
);

const server = http.createServer((req, res) => {});

const wss = new WebSocket.Server({
    server
});

let waitingForClient = false;
let gridSize = 32

wss.on('connection', ws => {
    ws.on('message', msg => {
        try {
            const data = JSON.parse(msg);

            if (data.type === 'updateGridSize') {
                gridSize = data.gridSize;
                console.log('Grid size:', gridSize);

                if (previousImageBuffer && previousFrameBuffer) {
                    frameQueue.unshift(previousFrameBuffer);
                    processQueue(true);
                }

                return;
            }

            if (data.type === 'releaseLock') {
                processingLocked = !processingLocked;

                if (processingLocked) {
                    shiftState.shiftX = data.shiftX;
                    shiftState.shiftY = data.shiftY;
                    shiftState.leftSectionShiftY = data.leftSectionShiftY;

                    previousFrameHash = null;

                    if (previousFrameBuffer) {
                        frameQueue.unshift(previousFrameBuffer);
                        processQueue(true);
                    }

                    console.log('Processing locked', shiftState);
                } else {
                    waitingForClient = false;

                    previousFrameHash = null;
                    previousImageBuffer = null;

                    console.log('Processing unlocked.');
                }
            }

            if (data.type === 'frameRendered') {
                if (waitingForClient) {
                    doom.stdio[3].write(Buffer.from([1]));
                    waitingForClient = false;
                }
            }

        } catch (err) {
            console.error('WS message error:', err);
        }
    });
});

function broadcast(buffer) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(buffer);
        }
    });
}

let frameBuffer = Buffer.alloc(0);
const frameQueue = [];
let processing = false;

doom.stdout.on('data', chunk => {
    frameBuffer = Buffer.concat([frameBuffer, chunk]);

    while (frameBuffer.length >= FRAME_SIZE) {
        const frame = frameBuffer.slice(0, FRAME_SIZE);
        frameQueue.push(frame);
        frameBuffer = frameBuffer.slice(FRAME_SIZE);
    }

    processQueue();
});

function applyShiftToFrame(frame, width, height, shiftState) {
    const { shiftX, shiftY, leftSectionShiftY } = shiftState;
    const shifted = Buffer.allocUnsafe(width * height);

    for (let y = 0; y < height; y++) {
        const sourceYGlobal = (y - shiftY + height) % height;
        const sourceYLeft = (y - leftSectionShiftY + height) % height;

        const rowOffset = y * width;
        const globalRowOffset = sourceYGlobal * width;
        const leftRowOffset = sourceYLeft * width;

        for (let x = 0; x < width; x++) {
            const sourceX = (x - shiftX + width) % width;

            if (x < shiftX) {
                shifted[rowOffset + x] = frame[leftRowOffset + sourceX];
            } else {
                shifted[rowOffset + x] = frame[globalRowOffset + sourceX];
            }
        }
    }

    return shifted;
}

let previousFrameHash = null;
let previousImageBuffer = null;
let previousFrameBuffer = null;

async function processQueue(force = false) {
    if (processing) return;
    processing = true;

    while (frameQueue.length > 0) {
        const frame = frameQueue.shift();
        const frameHash = XXH.h32(frame, 0xABCD).toNumber();

        if (!force && frameHash === previousFrameHash && previousImageBuffer) {
            const t0 = performance.now();

            const payload = {
                ...previousImageBuffer,
                timings: {
                    shift: 0,
                    grid: 0,
                    bardImg: 0,
                    reuse: performance.now() - t0
                }
            };

            broadcast(JSON.stringify(payload));
            doom.stdio[3].write(Buffer.from([1]));
            continue;
        }

        if (processingLocked) {
            try {
                const t0 = performance.now();
                const shiftedFrame = applyShiftToFrame(
                    frame,
                    CROP_WIDTH,
                    CROP_HEIGHT,
                    shiftState
                );
                const t1 = performance.now();

                const grid = rawToBinaryGrid(
                    shiftedFrame,
                    8,
                    gridSize * gridSize
                );
                const t2 = performance.now();

                const bardData = gridToBardImageBuffer(grid, {
                    startX: 26,
                    xIncrement: 17,
                    startY: 36,
                    yIncrement: -4
                });
                const t3 = performance.now();

                const shiftTime = t1 - t0;
                const gridTime = t2 - t1;
                const bardImgTime = t3 - t2;

                const payload = {
                    type: 'bardFrame',
                    grid: bardData,
                    timings: {
                        shift: shiftTime,
                        grid: gridTime,
                        bardImg: bardImgTime
                    }
                };

                previousFrameHash = frameHash;
                previousImageBuffer = payload;
                previousFrameBuffer = frame;

                waitingForClient = true;
                broadcast(JSON.stringify(payload));

            } catch (err) {
                console.error("Bard conversion failed:", err);
                doom.stdio[3].write(Buffer.from([1]));
            }
        } else {
            broadcast(frame);
            doom.stdio[3].write(Buffer.from([1]));
        }
    }

    processing = false;
}



doom.stderr.on('data', data => console.error('Doom error:', data.toString()));
doom.on('close', code => console.log('Doom exited with code', code));

server.listen(3000, () => console.log('Running at http://localhost:3000'));
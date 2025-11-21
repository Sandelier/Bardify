const { Jimp } = require('jimp');
const path = require('path');

const basePath = "./notes/bardPlayArea.png";
const notesPath = "./notes/symbols/base";
const symbolsPath = "./notes/symbols";

const refNoteSize = 7;
const noteScale = 4;
const noteSize = refNoteSize * noteScale; // 28px
const symbolHeight = (refNoteSize - 1) * noteScale; // 24px

let cachedBase = null;
let cachedNotes = {};
let resizedNotes = {};
let cachedSymbols = {};
let resizedSymbols = {};

async function preloadImages() {
    if (!cachedBase) {
        cachedBase = await Jimp.read(basePath);
    }

    for (let i = 1; i <= 8; i++) {
        if (!resizedNotes[i]) {
            if (!cachedNotes[i]) {
                cachedNotes[i] = await Jimp.read(path.join(notesPath, `${i}.png`));
            }

            resizedNotes[i] = cachedNotes[i]
                .clone()
                .resize({
                    w: noteSize,
                    h: noteSize,
                    mode: Jimp.RESIZE_NEAREST_NEIGHBOR
                });
        }
    }

    const symbolFiles = {
        left: "leftSymbol.png",
        right: "rightSymbol.png",
        up: "upSymbol.png",
        down: "downSymbol.png"
    };

    for (const key in symbolFiles) {
        if (!resizedSymbols[key]) {
            if (!cachedSymbols[key]) {
                cachedSymbols[key] = await Jimp.read(path.join(symbolsPath, symbolFiles[key]));
            }

            const symImg = cachedSymbols[key].clone();

            symImg.scaleToFit({
                w: 9999,
                h: symbolHeight,
                mode: Jimp.RESIZE_NEAREST_NEIGHBOR
            });

            resizedSymbols[key] = symImg;
        }
    }
}

async function createBardImage(noteSequence) {
    if (!Array.isArray(noteSequence)) {
        throw new Error("noteSequence must be an array");
    }

    await preloadImages();

    const base = cachedBase.clone();

    // Notes - Symbols
    const startX = 26 * noteScale; // 104 px
    const xIncrement = 17 * noteScale; // 68 px per note
    const startY = 36 * noteScale; // 144 px
    const yIncrement = -4 * noteScale; // -16 px per note number step

    for (let index = 0; index < noteSequence.length; index++) {
        const item = noteSequence[index];

        const noteNumber = typeof item === "object" ? item.number : item;
        const symbols = typeof item === "object" ? (item.symbols || []) : [];

        const numImg = resizedNotes[noteNumber];

        const centerX = startX + xIncrement * index;
        const centerY = startY + yIncrement * (noteNumber - 1);

        const drawX = Math.round(centerX - numImg.bitmap.width / 2);
        const drawY = Math.round(centerY - numImg.bitmap.height / 2);

        for (const symbol of symbols) {
            const symImg = resizedSymbols[symbol];

            let symX, symY;

            switch (symbol) {
                case "left":
                    symX = Math.round(centerX - symImg.bitmap.width / 2);
                    symY = Math.round(drawY + numImg.bitmap.height - Math.round(1.2 * noteScale)); // supposed to be little bit inside the note
                    break;

                case "right":
                    symX = Math.round(centerX - symImg.bitmap.width / 2);
                    symY = Math.round(drawY - symImg.bitmap.height + Math.round(1.2 * noteScale)); // supposed to be little bit inside the note
                    break;

                case "up":
                case "down":
                    symX = Math.round(drawX - symImg.bitmap.width - 2);
                    symY = Math.round(drawY + (numImg.bitmap.height - symImg.bitmap.height) / 2);
                    break;
            }

            base.composite(symImg, symX, symY);
        }

        base.composite(numImg, drawX, drawY);
    }

    return base;
}

module.exports = {
    createBardImage
};
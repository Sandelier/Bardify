const { Jimp } = require('jimp');
const path = require('path');

const basePath = path.join(__dirname, 'bardPlayArea.png');
const notesPath = path.join(__dirname, '..', 'notes');

const refWidth = 168;
const refHeight = 51;
const refNoteSize = 7;

const targetWidth = 60 * 1.5 //168;
const targetHeight = 34 //51;

let startX, xIncrement, startY, yIncrement;
let noteScale = 1;

let cachedBase = null;
let resizedBase = null;
const cachedNotes = {};
const resizedNotes = {};


async function preloadImages() {
    if (!cachedBase) {
        cachedBase = await Jimp.read(basePath);
    }

    if (!resizedBase) {
        if (targetWidth && targetHeight) {
            resizedBase = cachedBase.clone().resize({
                w: targetWidth,
                h: targetHeight,
                mode: Jimp.RESIZE_NEAREST_NEIGHBOR
            });
        } else {
            resizedBase = cachedBase.clone();
        }

        const scaleX = resizedBase.bitmap.width / refWidth;
        const scaleY = resizedBase.bitmap.height / refHeight;

        // position of each note
        startX = 26 * scaleX;
        xIncrement = 17 * scaleX;
        startY = 36 * scaleY;
        yIncrement = -4 * scaleY;

        noteScale = Math.min(scaleX, scaleY);
    }

    for (let i = 1; i <= 8; i++) {
        if (!resizedNotes[i]) {
            if (!cachedNotes[i]) {
                const noteFile = path.join(notesPath, `${i}.png`);
                cachedNotes[i] = await Jimp.read(noteFile);
            }

            const finalSize = Math.round(refNoteSize * noteScale);

            resizedNotes[i] = cachedNotes[i]
                .clone()
                .resize({
                    w: finalSize,
                    h: finalSize,
                    mode: Jimp.RESIZE_NEAREST_NEIGHBOR
                });
        }
    }
}


async function createBardImage(noteSequence) {
    if (!Array.isArray(noteSequence) || noteSequence.some(n => n < 1 || n > 8)) {
        throw new Error('noteSequence must be an array of numbers between 1 and 8');
    }

    await preloadImages();

    const base = resizedBase.clone();

    for (let index = 0; index < noteSequence.length; index++) {
        const noteNumber = noteSequence[index];
        const noteImage = resizedNotes[noteNumber];

        const centerX = startX + xIncrement * index;
        const centerY = startY + yIncrement * (noteNumber - 1);

        const drawX = centerX - noteImage.bitmap.width / 2;
        const drawY = centerY - noteImage.bitmap.height / 2;

        base.composite(noteImage, drawX, drawY);
    }

    return base;
}

module.exports = {
    createBardImage
};
const fs = require('fs');
const path = require('path');
const { createBardImage } = require('./placeNotesToPlayarea');

function parseNoteSymbols(raw) {
    const number = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    const symbols = [];

    if (raw.includes('<')) symbols.push("left");
    if (raw.includes('>')) symbols.push("right");
    if (raw.includes('▲')) symbols.push("up");
    if (raw.includes('▼')) symbols.push("down");

    return {
        number,
        symbols
    };
}

async function generateFrames() {
    const jsonPath = path.join(__dirname, 'recording.json');
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);

    const track = data["1"];
    if (!track) throw new Error(`Track 1 not found`);

    const framesDir = path.join(__dirname, 'frames');
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

    const noteWindow = [];

    // makes the performance tab be filled at start
    //const initialNotes = [">3", ">2", ">2", ">7", ">7", ">6", ">6", ">7"];
    //for (const raw of initialNotes) {
    //  noteWindow.push(parseNoteSymbols(raw));
    //}

    for (let i = 0; i < track.length; i++) {
        const entry = track[i];
        const noteData = parseNoteSymbols(entry.note);

        noteWindow.push(noteData);
        if (noteWindow.length > 8) noteWindow.shift();

        const img = await createBardImage([...noteWindow]);
        const filename = path.join(framesDir, `frame_${i.toString().padStart(4, '0')}.png`);
        await img.write(filename);
    }

    console.log(`Generated ${track.length} frames`);
}

async function main() {
    await generateFrames();
}

main();
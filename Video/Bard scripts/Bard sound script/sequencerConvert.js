const fs = require('fs');

(() => {

    function noteToNumber(note) {
        const noteMap = { C: 1, D: 2, E: 3, F: 4, G: 5, A: 6, B: 7 };
        const letter = note[0];
        const isSharp = note.includes('#');
        const octave = parseInt(note.slice(-1), 10);
        let num = noteMap[letter];

        if (letter === 'C') {
            if (octave !== 4) num = 8;
        }

        let prefix = '';
        if (isSharp) prefix += '▲';
        if (octave <= 3) prefix += '▼';
        else if (octave >= 5) prefix += '>';

        return prefix + num;
    }

    // I know it dosent contain the bars or the time signature so the timing is not perfect
    function parseSequencerString(input, bpm, numBards) {
        const delayPerSpace = 60 / bpm / 4; // 4 spaces per beat
        const noteRegex = /([\d.]+)\s+([A-G]#?\d)\s+[\d.]+\s+\d+/g;
        const matches = [...input.matchAll(noteRegex)];

        const notesByTime = new Map();
        for (const match of matches) {
            const rawTime = parseFloat(match[1]);
            const time = Math.round(rawTime);
            const note = match[2];

            if (!notesByTime.has(time)) notesByTime.set(time, []);
            const group = notesByTime.get(time);

            if (!group.includes(note)) group.push(note); // almost every chart contains stacked notes
        }

        const bardNotes = {};
        for (let i = 1; i <= numBards; i++) {
            bardNotes[i] = [];
        }

        const lastPlayedTime = Array(numBards).fill(null);

        const sortedTimes = [...notesByTime.keys()].sort((a, b) => a - b);

        for (const time of sortedTimes) {
            const notes = notesByTime.get(time);

            for (let i = 0; i < Math.min(notes.length, numBards); i++) {
                const bardIndex = i + 1;
                const note = notes[i];

                const lastTime = lastPlayedTime[i];
                const delaySpaces = lastTime === null ? time : time - lastTime;
                const delay = delaySpaces * delayPerSpace;

                bardNotes[bardIndex].push({
                    note: noteToNumber(note),
                    delay: parseFloat(delay.toFixed(4))
                });

                lastPlayedTime[i] = time;
            }
        }

        return bardNotes;
    }

    const [inputFile, bpmArg, bardsArg] = process.argv.slice(2);

    if (!inputFile) {
        console.error('Provide Online Sequencer notes');
        process.exit(1);
    }

    let input;
    try {
        input = fs.readFileSync(inputFile, 'utf-8').trim();
        fs.unlinkSync(inputFile);
    } catch (err) {
        console.error(`Error reading or deleting file ${inputFile}:`, err);
        process.exit(1);
    }

    const bpm = parseFloat(bpmArg);
    const numBards = parseInt(bardsArg, 10);

    const converted = parseSequencerString(input, bpm, numBards);

    fs.writeFileSync('recording.json', JSON.stringify(converted, null, 2));
    console.log(`Saved ${Object.values(converted).reduce((a, b) => a + b.length, 0)} notes across ${numBards} bard to recording.json`);
})();
import re
import json
import subprocess
import sys

def convertNoteString(noteSequence):
    baseMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']

    # takes normal notes and turns them into >3 and etc
    def noteToBardInputs(note):
        match = re.match(r'^([A-G])([#♯]?)(\d)$', note.strip(), re.IGNORECASE)
        if not match:
            return note

        baseNote, sharp, octave = match.groups()
        baseNote = baseNote.upper()
        octave = int(octave)

        try:
            noteIndex = baseMap.index(baseNote)
        except ValueError:
            return note

        if octave == 3:
            layer = '<'
        elif octave == 4:
            layer = ''
        elif octave == 5:
            layer = '>'
        elif octave == 6 and baseNote == 'C':
            layer = '>'
        else:
            return note

        sharpPrefix = '▲' if sharp else ''
        key = str(noteIndex + 1)

        return sharpPrefix + layer + key

    bardInputs = [noteToBardInputs(note) for note in noteSequence.strip().split()]
    return bardInputs

print("Convert mode started")
action = input("Type (notes / onlineSequencer): ").strip().lower()

if action == "notes":
    userInput = input("Enter notes (C4 D4 E4 F4 G4 A4 B4 C5 etc..): ").strip()
    converted = convertNoteString(userInput)

    structuredOutput = { "1": [{"note": note, "delay": 0} for note in converted] }

    with open("recording.json", "w") as f:
        json.dump(structuredOutput, f, indent=2)

    print(f"Converted {len(converted)} notes and saved to recording.json")

else:
    userInput = input("Enter Online Sequencer notes: ").strip()
    if not userInput:
        print("Exiting")
        sys.exit()

    sequencerNotesTempFile = "sequencerInput.txt"
    with open(sequencerNotesTempFile, "w", encoding="utf-8") as f:
        f.write(userInput)

    try:
        bpm = float(input("Enter BPM: ").strip())
    except ValueError:
        print("Invalid BPM input")
        sys.exit()

    bardInput = input("Enter number of bards (default is 1): ").strip()
    if bardInput == "":
        numBards = 1
    else:
        try:
            numBards = int(bardInput)
            if numBards <= 0:
                raise ValueError
        except ValueError:
            print("Invalid number of bards")
            sys.exit()

    try:
        result = subprocess.run(
            ["node", "sequencerConvert.js", sequencerNotesTempFile, str(bpm), str(numBards)],
            capture_output=True,
            text=True,
            check=True
        )
        output = result.stdout.strip()
        print("Converted notes output:")
        print(output)
    except subprocess.CalledProcessError as e:
        print("Error running sequencerConvert.js:")
        print(e.stderr)
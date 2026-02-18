## Overview
Plays an sequence of notes using the bard's in game notes which you can then record with something like obs.
It has the capability to convert real notes or online sequencer notes into bard's ingame notes.

If you want to convert midi files, i would recommmend pasting it in online sequnecer and convert those notes.

While i was writing this, i noticed that the number "2" is missing in low flats, so one of the notes cannot be played.

the converting is wildly inaccurate, and sometimes you can get illegal combos, so its a lot of trial and error to get it sound good. 


> [!IMPORTANT]
> Unzip "Sounds.zip" file to get all the note sounds. Had to compress them since they are raw from the game, so they are quite big files.

### Files
**`makeSong.py`**  
- Handles free, record, and playback modes. Free and record are basically the same, expect record just saves all the notes you press and the delays. Playback is then used so you can listen and record with like an obs, so you can use it in a video
- the convert mode launches the other scripts.

**`convert.py`**  
- Converts actual notes into bard notes. For example: `"C4 D4 E4 F4"`.

**`sequencerConvert.js`**  
- Converts online sequencer notes into bard notes. Bard's can only play one note at a time, so you should clean up the online sequencer timeline before copy pasting it in.
- It has the ability to make multiple bards play an song together, which is part of an older code that the current "Bard performance tab" does not support, so i would stick with only one bard.
- It does not handle time signatures, but most of the time the timing is quite well.

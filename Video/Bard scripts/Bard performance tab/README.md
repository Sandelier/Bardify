## Overview

Generates and visualizes **Bard sound script** recording.json files into bard's performance mode

### Files

**`makeRecordingFrames.js`**  
- Makes performance tab frames using the recording.js

**`showFrames.py`**  
- Displays the performance tab frames using the delays so it maintains the excat timing of the song made using "bard sound script" which you can then record with like obs.


## Input Format

You can drag in the `recording.json` made by the bard sound script into this folder or make your own json using this structure:

```json
{
  "1": [
    {
      "note": "1",
      "delay": 0
    },
    {
      "note": ">▲2",
      "delay": 0.608
    }
  ]
}
```
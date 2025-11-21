> [!IMPORTANT]
> This project won’t be actively maintained unless someone really wants me to fix something or I get very bored, since i've already finished the video. I know there are issues with the scripts in example, in "Bard sound script" one of the low flats is missing, and when converting notes there can be illegal combos that cannot be played normally, so you have to pay attention to see if any illegal combos appeared.
---

## Overview

This project contains all the scripts that were made for my video where i recreated **Bad Apple** using Neverwinter bard perform mode.

Everything is theoretically possible to do in the game, expect that my script assumes bards can instantly make notes disappear, which is not actually the case since each note in the game takes around 3 seconds to finish, which would make this project impossible. You could say that for each frame of the video we could wait 3 seconds in the game before playing the next frame, and then put the frames together, which would make everything theoretically possible again in the game.

> [!NOTE]
> **Click the image to watch the video**  
> [![Video](https://img.youtube.com/vi/1-boWYKisQ4/0.jpg)](https://youtu.be/1-boWYKisQ4?t=24)

## Requirements

If you want to run this project yourself, then you will need the following:

- **FFmpeg**  
  Place **FFmpeg.exe** directly into this project folder or add it to your system PATH.  
  Tested with version **2025-11-10-git-133a0bcb13**

- **Node.js**  
  Tested with version **25.1.0**  
  Required Node librarys:  
  - `jimp@1.6.0`  
  - `cli-progress@3.12.0`

- **Python**  
  Tested with version **3.14.0**  
  Required Python librarys:  
  - `pygame-ce==2.5.6`  
  - `pynput==1.8.1`

- Unzip the **Sounds** folder in **Bard sound script**

> [!NOTE]
> There is an initialization script in this folder which will automatically install all the libraries, checks if FFmpeg is found and unzips the sounds folder.

## Acknowledgements

<details>
<summary><strong>Node libs</strong></summary>

* [jimp](https://www.npmjs.com/package/jimp): Used for image creation and manipulation in "Bard performance tab" and "Video to bards" 
* [cli-progress](https://www.npmjs.com/package/cli-progress): Used for progress bar in "Video to bards"

</details>

<details>
<summary><strong>Python libs</strong></summary>

* [pygame-ce](https://pypi.org/project/pygame-ce): Used for note playback in "Bard sound script" 
* [pynput](https://pypi.org/project/pynput): Used to handle key presses in "Bard sound script"

</details>

<details>
<summary><strong>Other</strong></summary>

* [FFmpeg](https://www.ffmpeg.org/): Used to extract frames from video and make frames into video
</details>
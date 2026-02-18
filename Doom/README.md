> [!IMPORTANT]
> This project won’t be maintained since i created it just for the video.
---

## Overview

Allows you to real time render Doom with Neverwinter Bard perform mode


> [!NOTE]
> **Click the image to watch the video**  
> [![Video](https://img.youtube.com/vi/1-boWYKisQ4/0.jpg)](https://youtu.be/1-boWYKisQ4?t=24)


## Requirements

If you want to run this project yourself, then you will need the following:

- **Chocolate Doom Source Code**
    - Tested with version **3.1.1**

- **Doom wad**

- **Tool to build Chocolate doom**
    - Like **MINGW64**

- **Node.js**  
  Tested with version **25.1.0**  
  Required Node librarys:  
  - `ws@8.19.0`  
  - `xxhashjs@0.2.2`


## Guide

1. Replace the "src" folder in Chocolate doom source code with the "src" folder in this repository.
2. Compile Chocolate doom using like MINGW64 or similar tool
3. Change the doom executable location in the "main.js" script and "doom.wad" file location
4. Run "npm install ws xxhashjs" in the repository directory
5. Start main.js and then navigate to "website" folder and run the website using: 
```bash 
python -m http.server 8000 --bind 127.0.0.1
``` 
6. Open "localhost:8000" in your browser. Preferably something like Brave, though Firefox also works if you don't plan on recording the canvas (lags a lot more).
7. In doom go into the level and, in the browser, shift the pixels so they align correctly with doom. Then press "O" to enter bard grid mode.

## Keyboard Inputs
<details>
<summary><strong>K</strong></summary>

- Changes the play area (bard lute image)
  - Normal  
  - Green rectangles  
  - None  

</details>

<details>
<summary><strong>R</strong></summary>

- Starts recording the note canvas (does not include the lute)

</details>

<details>
<summary><strong>Arrow Keys</strong></summary>

- Move the canvas position

</details>

<details>
<summary><strong>I</strong></summary>

- Allows you to move the left section to align it correctly with the right section

</details>

<details>
<summary><strong>O</strong></summary>

- Switches from doom frame into bard grid mode

</details>

<details>
<summary><strong>1</strong></summary>

- Decreases grid size by 2

</details>

<details>
<summary><strong>2</strong></summary>

- Increases grid size by 2

</details>


## Acknowledgements

<details>
<summary><strong>Node libs</strong></summary>

* [ws](https://www.npmjs.com/package/ws): Used for main.js and website communication
* [xxhashjs](https://www.npmjs.com/package/xxhashjs): Used to quickly check if the current frame is the same as the previous frame

</details>

<details>
<summary><strong>Other</strong></summary>

* [Chocolate doom](https://github.com/chocolate-doom/chocolate-doom)

</details>
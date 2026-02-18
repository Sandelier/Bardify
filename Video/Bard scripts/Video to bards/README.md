# Overview
Converts a video into multiple bard performance mode tabs that play it. I did not bother to make it handle symbols.


## Files
**`processVideo.js`**  
- Takes a video and extracts all frames into "frames" folder which it then rescales and converts every pixel into either pure black or pure white.

**`ImagesToBinary.js`**  
- Takes the rescaled frames that were generated with **processVideo** and makes them into binary txt files into "binary_grids" folder. its not real binary but it was the best naming i could think of since the values are actually from 0-8 where 1-8 are notes that later gets played.

**`placeNotesToPlayarea.js`**  
- Helper function for **BinariesIntoBardImages** which generates an single performance tab with the provided note sequence

**`BinariesIntoBardImages.js`**  
- Turns all of those binary files we just generated into note sequences, which then with the help of **placeNotesToPlayarea** it generates the bard's performance tabs and then puts them together to make the full frame.

**`bardframesToVideo.js`**  
- Turns the bard's performance tab frames into a video.

## Important things to change in files

> [!IMPORTANT]
> **Bold** means variable

**`processVideo.js`**  
- Change **videoPath** to your own video path.

**`ImagesToBinary.js`**  
- Change **totalBards** if you want more or fewer than 1024 bards. It has to be an number divisible by four.

**`placeNotesToPlayarea.js`**  
- Change **targetWidth** and **targetHeight** to modify the actual size of an invidual bard performance tab, which in turn will change the whole resolution of the final full bard frame.

**`BinariesIntoBardImages.js`**  
- Modify **maxWorkers** if it lags too much. If you have more cores than me (6) then increase it for faster processing since this is the step that takes the longest to complete.

**`bardframesToVideos.js`**  
- The default **framerate** is 30.
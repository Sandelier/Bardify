let lMode = false;


let recorder = null;
let chunks = [];

function setupControls() {
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        if (key === 'k') {
            bardPlayAreaMode = (bardPlayAreaMode + 1) % 3;
            drawBardGrid();
            return;
        }

        if (key === 'l') {
            lMode = !lMode;
            return;
        }

        if (key === 'o') {
            ws.send(
                JSON.stringify({
                    type: 'releaseLock',
                    shiftX,
                    shiftY,
                    leftSectionShiftY
                })
            );
            console.log('Released processing lock');
            return;
        }

        if (key === '1') {
            updateGridSize(-2);
            return;
        }

        if (key === '2') {
            updateGridSize(2);
            return;
        }

        if (key === 'r') {
            if (!doomCanvas) return console.error("No doomCanvas found");

            if (!recorder) {
                const stream = doomCanvas.captureStream(35);
                const options = {
                    mimeType: "video/webm; codecs=vp8",
                    videoBitsPerSecond: 16_000_000
                };
                recorder = new MediaRecorder(stream, options);
                chunks = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: "video/webm" });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "doomRecording.webm";
                    a.click();

                    URL.revokeObjectURL(url);
                    console.log("Recording finished!");
                    recorder = null;
                };

                recorder.start();
                console.log("Recording");
            } else {
                recorder.stop();
                console.log("Stopped recording");
            }

            return;
        }

        if (lMode) {
            if (key === 'arrowup')
                leftSectionShiftY = (leftSectionShiftY - 1 + doomVpHeight) % doomVpHeight;
            if (key === 'arrowdown')
                leftSectionShiftY = (leftSectionShiftY + 1) % doomVpHeight;
        } else {
            switch (key) {
                case 'arrowup':
                    shiftY = (shiftY - 1 + doomVpHeight) % doomVpHeight;
                    break;
                case 'arrowdown':
                    shiftY = (shiftY + 1) % doomVpHeight;
                    break;
                case 'arrowleft':
                    shiftX = (shiftX - 1 + doomVpWidth) % doomVpWidth;
                    break;
                case 'arrowright':
                    shiftX = (shiftX + 1) % doomVpWidth;
                    break;
            }
        }

        drawShiftedFrame();
    });
}

setupControls();
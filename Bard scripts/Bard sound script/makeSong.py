import pygame
from pynput import keyboard
import os
import time
import json
import threading
import subprocess

pygame.mixer.init()
pygame.mixer.set_num_channels(32)

soundsPath = os.path.join("Sounds")

comboMap = {
    frozenset(): "Mid",
    frozenset(["up"]): "Sharp",
    frozenset(["down"]): "Flats",
    frozenset(["left"]): "Low",
    frozenset(["right"]): "High",
    frozenset(["right", "up"]): "High sharps",
    frozenset(["right", "down"]): "High flats",
    frozenset(["left", "up"]): "Low sharps",
    frozenset(["left", "down"]): "Low flats"
}

symbolToDir = {"▲": "up", "▼": "down", "<": "left", ">": "right"}
dirToSymbol = {v: k for k, v in symbolToDir.items()}

heldDirections = set()
recording = False
recordData = []
startTime = None

def playSound(folder, number, directions=None, log=True):
    filepath = os.path.join(soundsPath, folder, f"{number}.wav")
    if os.path.exists(filepath):
        sound = pygame.mixer.Sound(filepath)
        channel = pygame.mixer.find_channel()
        if channel is None:
            pygame.mixer.set_num_channels(pygame.mixer.get_num_channels() + 4)
            channel = pygame.mixer.find_channel()
        if channel:
            channel.play(sound)
        if directions and log:
            symbols = ''.join(dirToSymbol[d] for d in sorted(directions))
            print(f"{symbols}{number}")
        elif log:
            print(number)
    else:
        print(f"Missing file: {folder}/{number}.wav")

def playbackTrack(trackData, bardName=""):
    for entry in trackData:
        note = entry["note"]
        delay = entry["delay"]
        time.sleep(delay)

        directions = [symbolToDir[c] for c in note if c in symbolToDir]
        number = next((c for c in note if c.isdigit()), None)
        folder = comboMap.get(frozenset(directions), "Mid")

        print(f"[{bardName}] Playing: {note}")
        playSound(folder, number, directions, False)

    print(f"[{bardName}] Playback done.")

def escListener():
    def press(key):
        if key == keyboard.Key.esc:
            print("\nPress enter within 2 second to confirm exit...")
            threading.Thread(target=waitForEnter).start()

    def waitForEnter():
        enterPressed = []

        def inputThread():
            input()
            enterPressed.append(True)

        t = threading.Thread(target=inputThread)
        t.daemon = True
        t.start()
        t.join(timeout=2)

        if enterPressed:
            print("Exiting...")
            os._exit(0)
        else:
            print("Exit cancelled")

    listener = keyboard.Listener(on_press=press)
    listener.daemon = True
    listener.start()

escListener()

mode = input("Enter mode (free/record/playback/convert): ").strip().lower()

if mode == "playback":
    try:
        with open('recording.json', 'r', encoding='utf-8') as f:
            raw = json.load(f)
    except FileNotFoundError:
        print("recording.json not found")
        exit()

    if isinstance(raw, list):
        raw = {"1": raw}

    print("Playback started")
    threads = []
    for key, trackData in raw.items():
        t = threading.Thread(target=playbackTrack, args=(trackData, f"Bard {key}"))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    print("All bards finished")
    exit()

elif mode == "record":
    recording = True
    print("Recording mode started. Press ESC to stop")

elif mode == "convert":
    print("Launching convert.py...")
    subprocess.run("python convert.py")
    exit()

else:
    print("Free mode started. Press ESC to exit")

def press(key):
    global startTime

    try:
        k = key.char
    except AttributeError:
        k = str(key)

    if key == keyboard.Key.up:
        heldDirections.add("up")
    elif key == keyboard.Key.down:
        heldDirections.add("down")
    elif key == keyboard.Key.left:
        heldDirections.add("left")
    elif key == keyboard.Key.right:
        heldDirections.add("right")
    elif k in '12345678':
        if {"up", "down"}.issubset(heldDirections) or {"left", "right"}.issubset(heldDirections):
            print("Invalid combo")
            return

        folder = comboMap.get(frozenset(heldDirections), "Mid")
        playSound(folder, k, heldDirections)

        if recording:
            now = time.time()
            delay = 0 if startTime is None else round(now - startTime, 3)
            startTime = now

            symbols = ''.join(dirToSymbol[d] for d in sorted(heldDirections))
            notation = f"{symbols}{k}"
            recordData.append({"note": notation, "delay": delay})

def release(key):
    if key == keyboard.Key.esc:
        print("Exiting...")
        if recording:
            with open('recording.json', 'w', encoding='utf-8') as f:
                json.dump({"1": recordData}, f, indent=2)
            print("Saved to recording.json")
        return False

    if key == keyboard.Key.up:
        heldDirections.discard("up")
    elif key == keyboard.Key.down:
        heldDirections.discard("down")
    elif key == keyboard.Key.left:
        heldDirections.discard("left")
    elif key == keyboard.Key.right:
        heldDirections.discard("right")

with keyboard.Listener(on_press=press, on_release=release) as listener:
    listener.join()
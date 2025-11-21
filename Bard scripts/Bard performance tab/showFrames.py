import json
import time
import tkinter as tk

root = tk.Tk()
root.configure(bg="black")

with open("recording.json", "r") as f:
    data = json.load(f)

track = data["1"]

frames = []
for i, entry in enumerate(track):
    path = f"frames/frame_{i:04d}.png"
    img = tk.PhotoImage(file=path)
    frames.append(img)

label = tk.Label(root, bg="black")
label.pack()

time.sleep(1)

for i, entry in enumerate(track):
    time.sleep(entry.get("delay", 0))

    label.config(image=frames[i])
    label.image = frames[i]

    root.update()

time.sleep(0.2)

label.destroy()
root.configure(bg="red")
root.update()

root.mainloop()
@echo off
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"

if not exist "recording.json" (
    echo %ESC%[0;31m[!] recording.json not found %ESC%[0m
    pause
    exit /b
)

echo %ESC%[0;33mRunning makeRecordingFrames.js...%ESC%[0m
node makeRecordingFrames.js

echo.
echo %ESC%[0;33mRunning showFrames.py...%ESC%[0m
py showFrames.py

echo.
echo %ESC%[0;32mDone!%ESC%[0m
pause
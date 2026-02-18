@echo off
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"

node processVideo.js
if %ERRORLEVEL% neq 0 (
    echo %ESC%[0;31mprocessVideo.js failed%ESC%[0m
    pause
    exit /b %ERRORLEVEL%
)

cd "Images to bards" || (
    echo %ESC%[0;31mCan't find "Images to bards"%ESC%[0m
    pause
    exit /b 1
)

node ImagesToBinary.js
if %ERRORLEVEL% neq 0 (
    echo %ESC%[0;31mImagesToBinary.js failed%ESC%[0m
    pause
    exit /b %ERRORLEVEL%
)

node BinariesIntoBardImages.js
if %ERRORLEVEL% neq 0 (
    echo %ESC%[0;31mBinariesIntoBardImages.js failed%ESC%[0m
    pause
    exit /b %ERRORLEVEL%
)

node bardFramesToVideo.js
if %ERRORLEVEL% neq 0 (
    echo %ESC%[0;31mbardFramesToVideo.js failed%ESC%[0m
    pause
    exit /b %ERRORLEVEL%
)

echo %ESC%[0;32mAll scripts completed successfully%ESC%[0m
pause
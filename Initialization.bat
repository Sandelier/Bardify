@echo off
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"

where pip >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo %ESC%[0;31m[!] pip is not installed or not in PATH %ESC%[0m
    pause
    exit /b
)

where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo %ESC%[0;31m[!] npm is not installed or not in PATH %ESC%[0m
    pause
    exit /b
)

where ffmpeg >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo %ESC%[0;31m[!] ffmpeg is not in current directory or in PATH %ESC%[0m
    pause
    exit /b
)

echo %ESC%[0;33mInstalling Python packages... %ESC%[0m
call pip install pygame-ce==2.5.6 pynput==1.8.1

echo.
echo %ESC%[0;33mInstalling Node.js packages... %ESC%[0m
call npm install jimp@1.6.0 cli-progress@3.12.0

echo.
set soundsZip=Bard scripts\Bard sound script\Sounds.zip
set soundsFolder=Bard scripts\Bard sound script\Sounds

if exist "%soundsFolder%" (
    echo Sounds found
) else (
    if exist "%soundsZip%" (
        powershell -command "Expand-Archive -Path '%soundsZip%' -DestinationPath 'Bard scripts\Bard sound script'"
        echo Sounds unzipped
    ) else (
        echo %ESC%[0;31m[!] Sounds missing in 'Bard sound script' %ESC%[0m
        pause
        exit /b
    )
)

echo.
echo %ESC%[0;32mInitialization Complete %ESC%[0m
pause
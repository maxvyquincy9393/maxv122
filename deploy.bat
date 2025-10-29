@echo off
echo ========================================
echo   MAXVY Auto Deploy to Render
echo ========================================
echo.

:: Check if there are changes
git status --short
if errorlevel 1 (
    echo Error: Git not initialized
    pause
    exit /b 1
)

echo.
echo Checking for changes...
git diff --quiet
if %errorlevel% equ 0 (
    echo No changes detected. Nothing to deploy.
    pause
    exit /b 0
)

echo.
echo Changes detected! Preparing to deploy...
echo.

:: Get commit message
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Update: Auto-deploy to Render

echo.
echo Commit message: %commit_msg%
echo.

:: Add all changes
echo Adding all changes...
git add .

:: Commit
echo Committing changes...
git commit -m "%commit_msg%"

:: Push to GitHub (which triggers Render auto-deploy)
echo.
echo Pushing to GitHub...
echo This will trigger auto-deploy on Render!
echo.
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Deployment Triggered
    echo ========================================
    echo.
    echo Your changes have been pushed to GitHub.
    echo Render will automatically deploy in ~5-10 minutes.
    echo.
    echo Check deployment status at:
    echo https://dashboard.render.com
    echo.
) else (
    echo.
    echo ========================================
    echo   ERROR: Push Failed
    echo ========================================
    echo.
    echo Please check your internet connection
    echo and GitHub credentials.
    echo.
)

pause

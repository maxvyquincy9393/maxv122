@echo off
setlocal enabledelayedexpansion

:: ====================================
:: MAXVY WhatsApp Bot - Windows Setup
:: Version: 3.1.0
:: Created by: maxvy.ai
:: ====================================

:: Set console to UTF-8
chcp 65001 >nul 2>&1

:: Colors
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "PURPLE=[35m"
set "CYAN=[36m"
set "WHITE=[37m"
set "RESET=[0m"

:: Banner
:banner
cls
echo.
echo %CYAN%╔══════════════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%║    ███╗   ███╗ █████╗ ██╗  ██╗██╗   ██╗██╗   ██╗           ║%RESET%
echo %CYAN%║    ████╗ ████║██╔══██╗╚██╗██╔╝██║   ██║╚██╗ ██╔╝           ║%RESET%
echo %CYAN%║    ██╔████╔██║███████║ ╚███╔╝ ██║   ██║ ╚████╔╝            ║%RESET%
echo %CYAN%║    ██║╚██╔╝██║██╔══██║ ██╔██╗ ╚██╗ ██╔╝  ╚██╔╝             ║%RESET%
echo %CYAN%║    ██║ ╚═╝ ██║██║  ██║██╔╝ ██╗ ╚████╔╝    ██║              ║%RESET%
echo %CYAN%║    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝     ╚═╝              ║%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%║          WhatsApp AI Bot - Windows Setup                    ║%RESET%
echo %CYAN%║                    Version 3.1.0                            ║%RESET%
echo %CYAN%║                  Created by maxvy.ai                        ║%RESET%
echo %CYAN%║                                                              ║%RESET%
echo %CYAN%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.

:: Check Node.js
:check_node
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo %CYAN%▶ Checking System Requirements%RESET%
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Node.js is not installed%RESET%
    echo.
    echo %YELLOW%Please install Node.js from: https://nodejs.org%RESET%
    echo %YELLOW%Download the LTS version ^(18.x or higher^)%RESET%
    echo.
    pause
    start https://nodejs.org
    exit /b 1
) else (
    echo %GREEN%✅ Node.js is installed%RESET%

    :: Check Node version
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo %BLUE%   Version: !NODE_VERSION!%RESET%
)

:: Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ npm is not installed%RESET%
    echo.
    pause
    exit /b 1
) else (
    echo %GREEN%✅ npm is installed%RESET%
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo %BLUE%   Version: !NPM_VERSION!%RESET%
)

:: Check git (optional)
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  Git is not installed (optional)%RESET%
) else (
    echo %GREEN%✅ Git is installed%RESET%
)

echo.

:: Create directories
:create_dirs
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo %CYAN%▶ Creating Required Directories%RESET%
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo.

set "dirs=data temp logs auth_info_baileys docs"
for %%d in (%dirs%) do (
    if not exist "%%d" (
        mkdir "%%d"
        echo %GREEN%✅ Created directory: %%d%RESET%
    ) else (
        echo %BLUE%📁 Directory exists: %%d%RESET%
    )
)

echo.

:: Setup environment file
:setup_env
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo %CYAN%▶ Setting up Environment Configuration%RESET%
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo.

if exist ".env" (
    echo %YELLOW%⚠️  .env file already exists%RESET%
    set /p "overwrite=Do you want to overwrite it? (y/N): "
    if /i not "!overwrite!"=="y" (
        echo %BLUE%Keeping existing .env file%RESET%
        goto install_deps
    )
)

:: Copy .env.example or create new .env
if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo %GREEN%✅ Created .env file from template%RESET%
) else (
    echo %YELLOW%⚠️  Creating new .env file%RESET%
    (
        echo # MAXVY Bot Configuration
        echo.
        echo # Required API Keys
        echo GEMINI_API_KEY=
        echo.
        echo # Optional API Keys
        echo HF_TOKEN=
        echo GROQ_API_KEY=
        echo OPENROUTER_API_KEY=
        echo OPENAI_API_KEY=
        echo.
        echo # Bot Configuration
        echo BOT_PREFIXES=.,!,/
        echo AUTO_ACTIVATE_GROUPS=true
        echo AUTO_ACTIVATE_PRIVATE=false
        echo.
        echo # System Configuration
        echo LOG_LEVEL=info
        echo NODE_ENV=production
    ) > .env
    echo %GREEN%✅ Created basic .env file%RESET%
)

echo.
echo %CYAN%🔑 Let's set up your API keys%RESET%
echo %YELLOW%Press Enter to skip any key you don't have yet%RESET%
echo.

:: Get Gemini API Key
set /p "gemini_key=Enter your Gemini API Key (REQUIRED - get from https://makersuite.google.com/app/apikey): "
if not "!gemini_key!"=="" (
    powershell -Command "(Get-Content .env) -replace 'GEMINI_API_KEY=.*', 'GEMINI_API_KEY=!gemini_key!' | Set-Content .env"
    echo %GREEN%✅ Gemini API key saved%RESET%
) else (
    echo %YELLOW%⚠️  Gemini API key is required for the bot to work!%RESET%
    echo %YELLOW%   Get it from: https://makersuite.google.com/app/apikey%RESET%
)

:: Get HuggingFace Token (optional)
echo.
set /p "hf_token=Enter your HuggingFace Token (optional - for image generation): "
if not "!hf_token!"=="" (
    powershell -Command "(Get-Content .env) -replace 'HF_TOKEN=.*', 'HF_TOKEN=!hf_token!' | Set-Content .env"
    echo %GREEN%✅ HuggingFace token saved%RESET%
)

:: Get Groq API Key (optional)
echo.
set /p "groq_key=Enter your Groq API Key (optional - for faster AI): "
if not "!groq_key!"=="" (
    powershell -Command "(Get-Content .env) -replace 'GROQ_API_KEY=.*', 'GROQ_API_KEY=!groq_key!' | Set-Content .env"
    echo %GREEN%✅ Groq API key saved%RESET%
)

echo.

:: Install dependencies
:install_deps
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo %CYAN%▶ Installing Node.js Dependencies%RESET%
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo.

echo %BLUE%📦 Running npm install...%RESET%
echo %YELLOW%This may take a few minutes...%RESET%
echo.

call npm install

if %errorlevel% equ 0 (
    echo.
    echo %GREEN%✅ Dependencies installed successfully%RESET%
) else (
    echo.
    echo %RED%❌ Failed to install dependencies%RESET%
    echo %YELLOW%Please check the error messages above%RESET%
    pause
    exit /b 1
)

echo.

:: Optional PM2 setup
:pm2_setup
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo %CYAN%▶ PM2 Process Manager Setup (Optional)%RESET%
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo.

set /p "install_pm2=Do you want to install PM2 for production deployment? (y/N): "
if /i "!install_pm2!"=="y" (
    echo %BLUE%📦 Installing PM2 globally...%RESET%
    call npm install -g pm2

    :: Create PM2 ecosystem file
    (
        echo module.exports = {
        echo   apps: [{
        echo     name: 'maxvy-bot',
        echo     script: './index.js',
        echo     instances: 1,
        echo     autorestart: true,
        echo     watch: false,
        echo     max_memory_restart: '1G',
        echo     env: {
        echo       NODE_ENV: 'production'
        echo     },
        echo     error_file: './logs/error.log',
        echo     out_file: './logs/output.log',
        echo     log_file: './logs/combined.log',
        echo     time: true
        echo   }]
        echo };
    ) > ecosystem.config.js

    echo %GREEN%✅ PM2 ecosystem file created%RESET%
    echo %BLUE%You can start the bot with: pm2 start ecosystem.config.js%RESET%
)

echo.

:: Test setup
:test_setup
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo %CYAN%▶ Testing Bot Configuration%RESET%
echo %PURPLE%━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%RESET%
echo.

:: Check if .env exists
if exist ".env" (
    echo %GREEN%✅ .env file exists%RESET%

    :: Check if Gemini API key is set
    findstr /C:"GEMINI_API_KEY=." .env >nul
    if !errorlevel! equ 0 (
        echo %GREEN%✅ Gemini API key is configured%RESET%
    ) else (
        echo %YELLOW%⚠️  Gemini API key is not set%RESET%
    )
) else (
    echo %RED%❌ .env file not found%RESET%
)

:: Check if node_modules exists
if exist "node_modules" (
    echo %GREEN%✅ Dependencies are installed%RESET%
) else (
    echo %RED%❌ Dependencies not installed%RESET%
)

:: Check directories
set all_dirs_ok=1
for %%d in (data temp logs auth_info_baileys) do (
    if not exist "%%d" (
        echo %RED%❌ Directory missing: %%d%RESET%
        set all_dirs_ok=0
    )
)

if !all_dirs_ok! equ 1 (
    echo %GREEN%✅ All required directories exist%RESET%
)

echo.

:: Setup complete
:complete
echo %GREEN%╔══════════════════════════════════════════════════════════════╗%RESET%
echo %GREEN%║                                                              ║%RESET%
echo %GREEN%║            ✅ MAXVY Bot Setup Completed!                    ║%RESET%
echo %GREEN%║                                                              ║%RESET%
echo %GREEN%║  Next Steps:                                                ║%RESET%
echo %GREEN%║                                                              ║%RESET%
echo %GREEN%║  1. Make sure you've added your Gemini API key to .env      ║%RESET%
echo %GREEN%║  2. Start the bot with: npm start                          ║%RESET%
echo %GREEN%║  3. Scan the QR code with WhatsApp                         ║%RESET%
echo %GREEN%║  4. Send .help to see available commands                    ║%RESET%
echo %GREEN%║                                                              ║%RESET%
echo %GREEN%║  For PM2 production: pm2 start ecosystem.config.js         ║%RESET%
echo %GREEN%║                                                              ║%RESET%
echo %GREEN%║  Documentation: https://github.com/maxvy/whatsapp-bot      ║%RESET%
echo %GREEN%║  Support: support@maxvy.ai                                  ║%RESET%
echo %GREEN%║                                                              ║%RESET%
echo %GREEN%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.

:: Ask to start bot
set /p "start_now=Do you want to start the bot now? (y/N): "
if /i "!start_now!"=="y" (
    echo.
    echo %CYAN%🚀 Starting MAXVY Bot...%RESET%
    echo.
    call npm start
) else (
    echo.
    echo %BLUE%Run 'npm start' when you're ready to start the bot!%RESET%
    echo.
    pause
)

endlocal

#!/bin/bash

# ====================================
# MAXVY WhatsApp Bot - Setup Script
# Version: 3.1.0
# Created by: maxvy.ai
# ====================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║    ███╗   ███╗ █████╗ ██╗  ██╗██╗   ██╗██╗   ██╗           ║"
    echo "║    ████╗ ████║██╔══██╗╚██╗██╔╝██║   ██║╚██╗ ██╔╝           ║"
    echo "║    ██╔████╔██║███████║ ╚███╔╝ ██║   ██║ ╚████╔╝            ║"
    echo "║    ██║╚██╔╝██║██╔══██║ ██╔██╗ ╚██╗ ██╔╝  ╚██╔╝             ║"
    echo "║    ██║ ╚═╝ ██║██║  ██║██╔╝ ██╗ ╚████╔╝    ██║              ║"
    echo "║    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝     ╚═╝              ║"
    echo "║                                                              ║"
    echo "║          WhatsApp AI Bot - Setup & Installation             ║"
    echo "║                    Version 3.1.0                            ║"
    echo "║                  Created by maxvy.ai                        ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
}

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to print section headers
print_section() {
    echo
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▶ ${1}${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
}

# Function to check command existence
check_command() {
    if command -v $1 &> /dev/null; then
        print_message "✅ $1 is installed" "$GREEN"
        return 0
    else
        print_message "❌ $1 is not installed" "$RED"
        return 1
    fi
}

# Function to check Node.js version
check_node_version() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        REQUIRED_VERSION="18.0.0"

        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_message "✅ Node.js version $NODE_VERSION (meets requirement >= 18.0.0)" "$GREEN"
            return 0
        else
            print_message "⚠️  Node.js version $NODE_VERSION is too old (requires >= 18.0.0)" "$YELLOW"
            return 1
        fi
    else
        print_message "❌ Node.js is not installed" "$RED"
        return 1
    fi
}

# Function to install Node.js
install_nodejs() {
    print_section "Installing Node.js"

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        print_message "📦 Installing Node.js via NodeSource..." "$BLUE"
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            print_message "📦 Installing Node.js via Homebrew..." "$BLUE"
            brew install node
        else
            print_message "❌ Homebrew not found. Please install Node.js manually from https://nodejs.org" "$RED"
            exit 1
        fi
    else
        print_message "⚠️  Unsupported OS. Please install Node.js manually from https://nodejs.org" "$YELLOW"
        exit 1
    fi
}

# Function to setup environment file
setup_env_file() {
    print_section "Setting up Environment Configuration"

    if [ -f ".env" ]; then
        print_message "⚠️  .env file already exists" "$YELLOW"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "Keeping existing .env file" "$BLUE"
            return
        fi
    fi

    # Copy .env.example to .env
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_message "✅ Created .env file from template" "$GREEN"
    else
        print_message "⚠️  .env.example not found, creating basic .env file" "$YELLOW"
        cat > .env << 'EOF'
# MAXVY Bot Configuration

# Required API Keys
GEMINI_API_KEY=

# Optional API Keys
HF_TOKEN=
GROQ_API_KEY=
OPENROUTER_API_KEY=
OPENAI_API_KEY=

# Bot Configuration
BOT_PREFIXES=.,!,/
AUTO_ACTIVATE_GROUPS=true
AUTO_ACTIVATE_PRIVATE=false

# System Configuration
LOG_LEVEL=info
NODE_ENV=production
EOF
        print_message "✅ Created basic .env file" "$GREEN"
    fi

    # Interactive API key setup
    print_message "\n🔑 Let's set up your API keys" "$CYAN"
    print_message "Press Enter to skip any key you don't have yet\n" "$YELLOW"

    # Gemini API Key (Required)
    read -p "Enter your Gemini API Key (REQUIRED - get from https://makersuite.google.com/app/apikey): " gemini_key
    if [ ! -z "$gemini_key" ]; then
        sed -i.bak "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$gemini_key/" .env
        print_message "✅ Gemini API key saved" "$GREEN"
    else
        print_message "⚠️  Gemini API key is required for the bot to work!" "$YELLOW"
    fi

    # HuggingFace Token (Optional)
    read -p "Enter your HuggingFace Token (optional - for image generation): " hf_token
    if [ ! -z "$hf_token" ]; then
        sed -i.bak "s/HF_TOKEN=.*/HF_TOKEN=$hf_token/" .env
        print_message "✅ HuggingFace token saved" "$GREEN"
    fi

    # Groq API Key (Optional)
    read -p "Enter your Groq API Key (optional - for faster AI): " groq_key
    if [ ! -z "$groq_key" ]; then
        sed -i.bak "s/GROQ_API_KEY=.*/GROQ_API_KEY=$groq_key/" .env
        print_message "✅ Groq API key saved" "$GREEN"
    fi

    # Remove backup files
    rm -f .env.bak
}

# Function to install dependencies
install_dependencies() {
    print_section "Installing Node.js Dependencies"

    print_message "📦 Running npm install..." "$BLUE"
    npm install

    if [ $? -eq 0 ]; then
        print_message "✅ Dependencies installed successfully" "$GREEN"
    else
        print_message "❌ Failed to install dependencies" "$RED"
        exit 1
    fi
}

# Function to create necessary directories
create_directories() {
    print_section "Creating Required Directories"

    directories=("data" "temp" "logs" "auth_info_baileys" "docs")

    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_message "✅ Created directory: $dir" "$GREEN"
        else
            print_message "📁 Directory exists: $dir" "$BLUE"
        fi
    done
}

# Function to setup PM2 (optional)
setup_pm2() {
    print_section "PM2 Process Manager Setup (Optional)"

    read -p "Do you want to install PM2 for production deployment? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "📦 Installing PM2 globally..." "$BLUE"
        npm install -g pm2

        # Create PM2 ecosystem file
        cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'maxvy-bot',
    script: './index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
        print_message "✅ PM2 ecosystem file created" "$GREEN"
        print_message "You can start the bot with: pm2 start ecosystem.config.js" "$BLUE"
    fi
}

# Function to test bot setup
test_setup() {
    print_section "Testing Bot Configuration"

    # Check if .env file exists and has required keys
    if [ -f ".env" ]; then
        if grep -q "GEMINI_API_KEY=.\+" .env; then
            print_message "✅ Gemini API key is configured" "$GREEN"
        else
            print_message "⚠️  Gemini API key is not set in .env file" "$YELLOW"
        fi
    else
        print_message "❌ .env file not found" "$RED"
    fi

    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        print_message "✅ Dependencies are installed" "$GREEN"
    else
        print_message "❌ Dependencies not installed" "$RED"
    fi

    # Check if all required directories exist
    all_dirs_exist=true
    for dir in "data" "temp" "logs" "auth_info_baileys"; do
        if [ ! -d "$dir" ]; then
            all_dirs_exist=false
            print_message "❌ Directory missing: $dir" "$RED"
        fi
    done

    if $all_dirs_exist; then
        print_message "✅ All required directories exist" "$GREEN"
    fi
}

# Main setup flow
main() {
    clear
    show_banner

    print_section "Checking System Requirements"

    # Check Node.js
    if ! check_node_version; then
        read -p "Do you want to install/update Node.js? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_nodejs
        else
            print_message "⚠️  Please install Node.js >= 18.0.0 manually" "$YELLOW"
            exit 1
        fi
    fi

    # Check npm
    check_command "npm"

    # Check git
    check_command "git"

    # Create directories
    create_directories

    # Setup environment file
    setup_env_file

    # Install dependencies
    install_dependencies

    # Optional PM2 setup
    setup_pm2

    # Test setup
    test_setup

    # Final message
    print_section "Setup Complete! 🎉"

    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║            ✅ MAXVY Bot Setup Completed!                    ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║  Next Steps:                                                ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║  1. Make sure you've added your Gemini API key to .env      ║${NC}"
    echo -e "${GREEN}║  2. Start the bot with: npm start                          ║${NC}"
    echo -e "${GREEN}║  3. Scan the QR code with WhatsApp                         ║${NC}"
    echo -e "${GREEN}║  4. Send .help to see available commands                    ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║  For PM2 production: pm2 start ecosystem.config.js         ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║  Documentation: https://github.com/maxvy/whatsapp-bot      ║${NC}"
    echo -e "${GREEN}║  Support: support@maxvy.ai                                  ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo

    read -p "Do you want to start the bot now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "\n🚀 Starting MAXVY Bot..." "$CYAN"
        npm start
    else
        print_message "\nRun 'npm start' when you're ready to start the bot!" "$BLUE"
    fi
}

# Run main function
main

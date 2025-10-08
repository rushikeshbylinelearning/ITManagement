#!/bin/bash
# IT Management Monitoring Agent Installer - macOS
# This script installs and configures the monitoring agent on macOS systems

set -e

INSTALL_DIR="/usr/local/it-monitoring-agent"
SERVICE_NAME="com.company.it-monitoring-agent"
PLIST_PATH="$HOME/Library/LaunchAgents/${SERVICE_NAME}.plist"
CONFIG_FILE="config.json"
AGENT_SCRIPT="monitoring_agent.py"
REQUIREMENTS_FILE="requirements.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}IT Management Monitoring Agent Installer${NC}"
echo -e "${GREEN}macOS Version${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root (for installation to /usr/local)
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Note: This script requires sudo privileges${NC}"
    echo ""
fi

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo -e "${YELLOW}Please install Python 3 and try again:${NC}"
    echo -e "  Install via Homebrew: brew install python3"
    echo -e "  Or download from: https://www.python.org/downloads/macos/"
    exit 1
fi

# Check for pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${YELLOW}Installing pip3...${NC}"
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3
fi

# Create installation directory
echo -e "${YELLOW}Creating installation directory...${NC}"
sudo mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Create requirements.txt
echo -e "${YELLOW}Creating requirements file...${NC}"
sudo tee "$REQUIREMENTS_FILE" > /dev/null << 'EOF'
psutil>=5.9.0
requests>=2.28.0
watchdog>=2.1.9
EOF

# Download or copy agent script
if [ -f "/tmp/monitoring_agent.py" ]; then
    sudo cp /tmp/monitoring_agent.py "$INSTALL_DIR/"
else
    echo -e "${YELLOW}Downloading agent script...${NC}"
    echo -e "${RED}Warning: Agent script not found. Please manually copy monitoring_agent.py to $INSTALL_DIR${NC}"
fi

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
sudo pip3 install -r "$REQUIREMENTS_FILE" --quiet

# Prompt for configuration
echo ""
echo -e "${GREEN}Configuration${NC}"
echo -e "${YELLOW}Please enter the following information:${NC}"

read -p "Backend URL (e.g., https://itmanagement.company.com/api/monitoring/events): " BACKEND_URL
read -p "Registration URL (e.g., https://itmanagement.company.com/api/monitoring/register): " REGISTRATION_URL
read -p "Registration Token: " REGISTRATION_TOKEN

# Create configuration file
echo -e "${YELLOW}Creating configuration file...${NC}"
sudo tee "$CONFIG_FILE" > /dev/null << EOF
{
    "backend_url": "$BACKEND_URL",
    "registration_url": "$REGISTRATION_URL",
    "registration_token": "$REGISTRATION_TOKEN",
    "api_key": null,
    "agent_id": null,
    "hostname": "$(hostname)",
    "polling_interval": 60,
    "monitored_directories": [],
    "log_level": "INFO",
    "retry_attempts": 3,
    "retry_backoff": 5,
    "local_cache_file": "telemetry_cache.json"
}
EOF

# Set proper permissions
sudo chmod 600 "$CONFIG_FILE"
sudo chmod 755 "$AGENT_SCRIPT"

# Create LaunchAgent plist
echo -e "${YELLOW}Creating LaunchAgent...${NC}"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>${INSTALL_DIR}/${AGENT_SCRIPT}</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>${INSTALL_DIR}</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>
    
    <key>StandardOutPath</key>
    <string>${INSTALL_DIR}/agent.log</string>
    
    <key>StandardErrorPath</key>
    <string>${INSTALL_DIR}/agent_error.log</string>
    
    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>
EOF

# Set proper permissions for plist
chmod 644 "$PLIST_PATH"

# Load the LaunchAgent
echo -e "${YELLOW}Loading LaunchAgent...${NC}"
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

# Wait a moment for the agent to start
sleep 3

# Check if agent is running
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Installation successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Service Status: ${GREEN}Running${NC}"
    echo -e "Installation Directory: $INSTALL_DIR"
    echo -e "Service Name: $SERVICE_NAME"
    echo ""
    echo -e "Useful commands:"
    echo -e "  View logs: tail -f ${INSTALL_DIR}/agent.log"
    echo -e "  View errors: tail -f ${INSTALL_DIR}/agent_error.log"
    echo -e "  Restart: launchctl unload $PLIST_PATH && launchctl load $PLIST_PATH"
    echo -e "  Stop: launchctl unload $PLIST_PATH"
    echo -e "  Status: launchctl list | grep $SERVICE_NAME"
    echo ""
else
    echo -e "${RED}Warning: Service may not have started correctly${NC}"
    echo -e "Check logs: cat ${INSTALL_DIR}/agent_error.log"
fi





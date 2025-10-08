#!/bin/bash
# IT Management Monitoring Agent Installer - Linux
# This script installs and configures the monitoring agent on Linux systems

set -e

INSTALL_DIR="/opt/it-monitoring-agent"
SERVICE_NAME="it-monitoring-agent"
AGENT_USER="itmonitor"
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
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo -e "${YELLOW}Please install Python 3 and try again:${NC}"
    echo -e "  Ubuntu/Debian: sudo apt-get install python3 python3-pip"
    echo -e "  CentOS/RHEL: sudo yum install python3 python3-pip"
    exit 1
fi

# Check for pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${YELLOW}Installing pip3...${NC}"
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3
fi

# Create installation directory
echo -e "${YELLOW}Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Extract agent files (this would be embedded in production installer)
echo -e "${YELLOW}Extracting agent files...${NC}"

# Create requirements.txt
cat > "$REQUIREMENTS_FILE" << 'EOF'
psutil>=5.9.0
requests>=2.28.0
watchdog>=2.1.9
EOF

# Download or copy agent script
# In production, this would be bundled with the installer
if [ -f "/tmp/monitoring_agent.py" ]; then
    cp /tmp/monitoring_agent.py "$INSTALL_DIR/"
else
    echo -e "${YELLOW}Downloading agent script...${NC}"
    # This URL should point to your backend
    # For now, we'll use a placeholder
    echo -e "${RED}Warning: Agent script not found. Please manually copy monitoring_agent.py to $INSTALL_DIR${NC}"
fi

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip3 install -r "$REQUIREMENTS_FILE" --quiet

# Prompt for configuration
echo ""
echo -e "${GREEN}Configuration${NC}"
echo -e "${YELLOW}Please enter the following information:${NC}"

read -p "Backend URL (e.g., https://itmanagement.company.com/api/monitoring/events): " BACKEND_URL
read -p "Registration URL (e.g., https://itmanagement.company.com/api/monitoring/register): " REGISTRATION_URL
read -p "Registration Token: " REGISTRATION_TOKEN

# Create configuration file
echo -e "${YELLOW}Creating configuration file...${NC}"
cat > "$CONFIG_FILE" << EOF
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
chmod 600 "$CONFIG_FILE"
chmod 755 "$AGENT_SCRIPT"

# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=IT Management Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 $INSTALL_DIR/$AGENT_SCRIPT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo -e "${YELLOW}Reloading systemd...${NC}"
systemctl daemon-reload

# Enable and start service
echo -e "${YELLOW}Enabling and starting service...${NC}"
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# Check status
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
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
    echo -e "  View logs: sudo journalctl -u $SERVICE_NAME -f"
    echo -e "  Restart: sudo systemctl restart $SERVICE_NAME"
    echo -e "  Stop: sudo systemctl stop $SERVICE_NAME"
    echo -e "  Status: sudo systemctl status $SERVICE_NAME"
    echo ""
else
    echo -e "${RED}Warning: Service failed to start${NC}"
    echo -e "Check logs: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi





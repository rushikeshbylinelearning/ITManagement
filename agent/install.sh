#!/bin/bash
# IT Management Monitoring Agent - Installation Script for Linux

set -e

echo "=================================="
echo "IT Management Monitoring Agent"
echo "Installation Script"
echo "=================================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.7 or later."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
echo "Python version: $PYTHON_VERSION"

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Generate default configuration
echo "Generating default configuration..."
python3 monitoring_agent.py --generate-config

echo ""
echo "=================================="
echo "Installation complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Edit config.json and set your backend URL and API key"
echo "2. Run the agent: ./venv/bin/python3 monitoring_agent.py"
echo ""
echo "To run as a systemd service:"
echo "1. Edit monitoring-agent.service and update paths"
echo "2. sudo cp monitoring-agent.service /etc/systemd/system/"
echo "3. sudo systemctl daemon-reload"
echo "4. sudo systemctl enable monitoring-agent"
echo "5. sudo systemctl start monitoring-agent"
echo ""





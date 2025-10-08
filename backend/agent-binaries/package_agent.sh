#!/bin/bash
# Script to package the monitoring agent for distribution
# This creates platform-specific packages with the agent script embedded

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_SOURCE="../../../agent/monitoring_agent.py"
AGENT_REQUIREMENTS="../../../agent/requirements.txt"

echo "========================================"
echo "IT Monitoring Agent Packaging Script"
echo "========================================"
echo ""

# Check if agent source exists
if [ ! -f "$AGENT_SOURCE" ]; then
    # Try alternative path
    AGENT_SOURCE="../../agent/monitoring_agent.py"
    if [ ! -f "$AGENT_SOURCE" ]; then
        echo "Error: monitoring_agent.py not found"
        echo "Expected at: $AGENT_SOURCE"
        exit 1
    fi
fi

echo "✓ Found agent source: $AGENT_SOURCE"

# Copy agent script to binaries directory
echo "Copying agent script..."
cp "$AGENT_SOURCE" "$SCRIPT_DIR/monitoring_agent.py"

if [ -f "$AGENT_REQUIREMENTS" ]; then
    cp "$AGENT_REQUIREMENTS" "$SCRIPT_DIR/requirements.txt"
fi

# Make installer scripts executable
echo "Setting permissions on installer scripts..."
chmod +x "$SCRIPT_DIR/monitoring_agent_installer.sh"
chmod +x "$SCRIPT_DIR/monitoring_agent_installer_macos.sh"

echo ""
echo "✓ Agent packaged successfully!"
echo ""
echo "Distribution files ready:"
echo "  - monitoring_agent.py"
echo "  - monitoring_agent_installer.sh (Linux)"
echo "  - monitoring_agent_installer_macos.sh (macOS)"
echo "  - monitoring_agent_installer.ps1 (Windows)"
echo ""
echo "These files will be served by the backend at:"
echo "  GET /api/monitoring/agent/download/:os"
echo ""





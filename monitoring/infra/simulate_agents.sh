#!/bin/bash
# Simulate multiple monitoring agents for testing

API_URL="${1:-http://localhost:5001/api/monitoring/events}"
API_KEY="${2:-default-monitoring-key-change-me}"
NUM_AGENTS="${3:-3}"

echo "🧪 Simulating $NUM_AGENTS monitoring agents..."
echo "API URL: $API_URL"
echo ""

for i in $(seq 1 $NUM_AGENTS); do
    AGENT_ID="sim-agent-$i-$(date +%s)"
    HOSTNAME="test-host-$i"
    
    echo "Sending telemetry from $HOSTNAME (Agent ID: $AGENT_ID)..."
    
    # Generate random metrics
    CPU_USAGE=$((RANDOM % 100))
    MEM_USAGE=$((RANDOM % 100))
    DISK_USAGE=$((RANDOM % 100))
    BYTES_OUT=$((RANDOM % 10000000 + 1000000)) # 1-10 MB
    
    # Create telemetry payload
    PAYLOAD=$(cat <<EOF
{
  "agent_id": "$AGENT_ID",
  "hostname": "$HOSTNAME",
  "host_ip": "192.168.1.$((100 + i))",
  "public_ip": "203.0.113.$i",
  "vpn": $([[ $((RANDOM % 2)) -eq 0 ]] && echo "true" || echo "false"),
  "ssid": "TestNetwork",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "metrics": {
    "os": "linux",
    "osVersion": "Ubuntu 22.04",
    "agentVersion": "1.0.0",
    "cpu": {
      "model": "Intel Core i7",
      "cores": 8,
      "usage": $CPU_USAGE
    },
    "ram": {
      "total": 16384,
      "used": $((16384 * MEM_USAGE / 100)),
      "usage": $MEM_USAGE
    },
    "disk": {
      "total": 500,
      "used": $((500 * DISK_USAGE / 100)),
      "usage": $DISK_USAGE
    },
    "uptime_s": $((RANDOM % 1000000))
  },
  "processes": [
    {
      "pid": $((RANDOM % 10000)),
      "name": "chrome",
      "user": "testuser",
      "cpu_percent": $((RANDOM % 50)),
      "memory_mb": $((RANDOM % 1000 + 100))
    },
    {
      "pid": $((RANDOM % 10000)),
      "name": "firefox",
      "user": "testuser",
      "cpu_percent": $((RANDOM % 30)),
      "memory_mb": $((RANDOM % 800 + 100))
    }
  ],
  "network": [
    {
      "pid": $((RANDOM % 10000)),
      "process": "chrome",
      "protocol": "tcp",
      "remote_address": "142.250.185.78",
      "remote_port": 443,
      "bytes_sent": $BYTES_OUT,
      "bytes_recv": $((BYTES_OUT * 5))
    }
  ],
  "domains": [
    {
      "domain": "google.com",
      "source": "agent",
      "frequency": $((RANDOM % 10 + 1)),
      "bytes": $((RANDOM % 1000000))
    },
    {
      "domain": "github.com",
      "source": "agent",
      "frequency": $((RANDOM % 5 + 1)),
      "bytes": $((RANDOM % 500000))
    }
  ],
  "file_events": [
    {
      "path": "/home/testuser/Documents/test$i.txt",
      "operation": "create",
      "size": $((RANDOM % 10000)),
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
    }
  ]
}
EOF
)
    
    # Send request
    RESPONSE=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY" \
        -d "$PAYLOAD")
    
    echo "Response: $RESPONSE"
    echo ""
    
    # Random delay between agents
    sleep $((RANDOM % 3 + 1))
done

echo "✅ Simulation complete! Check your monitoring dashboard."


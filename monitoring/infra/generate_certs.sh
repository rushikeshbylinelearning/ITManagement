#!/bin/bash
# Generate mTLS certificates for monitoring agent authentication

set -e

CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

echo "🔐 Generating mTLS certificates for monitoring agents..."

# Generate CA (Certificate Authority)
echo "Generating CA certificate..."
openssl genrsa -out "$CERT_DIR/ca-key.pem" 4096

openssl req -new -x509 -days 3650 -key "$CERT_DIR/ca-key.pem" \
    -out "$CERT_DIR/ca-cert.pem" \
    -subj "/C=US/ST=State/L=City/O=IT Management/OU=Monitoring/CN=Monitoring-CA"

# Generate Server Certificate
echo "Generating server certificate..."
openssl genrsa -out "$CERT_DIR/server-key.pem" 4096

openssl req -new -key "$CERT_DIR/server-key.pem" \
    -out "$CERT_DIR/server-req.pem" \
    -subj "/C=US/ST=State/L=City/O=IT Management/OU=Monitoring/CN=monitoring-server"

openssl x509 -req -days 3650 -in "$CERT_DIR/server-req.pem" \
    -CA "$CERT_DIR/ca-cert.pem" \
    -CAkey "$CERT_DIR/ca-key.pem" \
    -CAcreateserial \
    -out "$CERT_DIR/server-cert.pem"

# Generate Client Certificate (for agents)
echo "Generating client certificate..."
openssl genrsa -out "$CERT_DIR/client-key.pem" 4096

openssl req -new -key "$CERT_DIR/client-key.pem" \
    -out "$CERT_DIR/client-req.pem" \
    -subj "/C=US/ST=State/L=City/O=IT Management/OU=Monitoring/CN=monitoring-agent"

openssl x509 -req -days 3650 -in "$CERT_DIR/client-req.pem" \
    -CA "$CERT_DIR/ca-cert.pem" \
    -CAkey "$CERT_DIR/ca-key.pem" \
    -CAcreateserial \
    -out "$CERT_DIR/client-cert.pem"

# Set appropriate permissions
chmod 600 "$CERT_DIR"/*.pem

echo "✅ Certificates generated successfully in $CERT_DIR/"
echo ""
echo "📝 Next steps:"
echo "1. Copy ca-cert.pem, server-cert.pem, server-key.pem to backend server"
echo "2. Copy ca-cert.pem, client-cert.pem, client-key.pem to agent installations"
echo "3. Update backend server.js to use mTLS for /api/monitoring/telemetry endpoint"
echo "4. Update agent config to use client certificates"


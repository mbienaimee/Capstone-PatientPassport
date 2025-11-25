#!/bin/bash

# Bash script to start ngrok for Africa's Talking Web Simulator
# Usage: ./start-ngrok.sh

echo ""
echo "========================================"
echo "  Starting ngrok for USSD Testing"
echo "========================================"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed!"
    echo ""
    echo "📥 Install ngrok:"
    echo "   1. Download from: https://ngrok.com/download"
    echo "   2. Or use: npm install -g ngrok"
    echo ""
    echo "After installing, run this script again."
    echo ""
    exit 1
fi

echo "✅ ngrok found"
echo ""
echo "⚠️  Make sure your backend is running on port 5000!"
echo "   If not, start it with: npm run dev"
echo ""

read -p "Press Enter to start ngrok (or Ctrl+C to cancel)"

echo ""
echo "🚀 Starting ngrok..."
echo ""
echo "📋 Your callback URL will be: https://[ngrok-url]/api/ussd/callback"
echo ""
echo "💡 Copy the HTTPS URL from ngrok and use it in Africa's Talking dashboard"
echo ""

# Start ngrok
ngrok http 5000


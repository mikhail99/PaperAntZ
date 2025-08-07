#!/bin/bash

# Startup script for AI Research Assistant Backend

echo "🚀 Starting AI Research Assistant Backend..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p logs

# Start the server
echo "🌐 Starting server..."
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🔗 Frontend should connect to: http://localhost:8000/api/v1"
echo "⚡ Press Ctrl+C to stop the server"

python main.py
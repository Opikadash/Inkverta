#!/bin/bash
# setup.sh - Script to set up the Comic Translator project environment

set -e

echo "🚀 Setting up Comic Translator..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your API keys"
fi

# Create uploads and logs directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads
mkdir -p backend/temp
mkdir -p backend/logs
mkdir -p monitoring/grafana/data
mkdir -p monitoring/prometheus/data

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 backend/uploads
chmod 755 backend/temp
chmod 755 backend/logs

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Build Chrome extension
echo "🔧 Building Chrome extension..."
cd chrome-extension
# No build step needed for basic extension
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your API keys"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Or run 'docker-compose up' for production deployment"
echo "4. Load chrome-extension folder in Chrome Developer mode"

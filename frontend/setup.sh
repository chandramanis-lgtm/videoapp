#!/bin/bash

# VideoApp Frontend - Setup Script

echo "🚀 Setting up VideoApp LMS Frontend..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Available commands:"
echo "  npm start    - Start development server"
echo "  npm build    - Build for production"
echo "  npm test     - Run tests"
echo ""
echo "⚙️  Configuration:"
echo "  Edit .env file to change REACT_APP_API_URL"
echo ""
echo "🌐 After starting, visit: http://localhost:3000"
echo ""

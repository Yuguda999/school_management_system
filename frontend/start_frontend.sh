#!/bin/bash

# Frontend Development Server Startup Script
# School Management System

echo "🚀 Starting School Management System Frontend..."
echo "=================================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
fi

# Check if Vite is properly installed
if [ ! -f "node_modules/vite/dist/node/cli.js" ]; then
    echo "⚠️  Vite installation appears corrupted. Reinstalling..."
    rm -rf node_modules package-lock.json
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to reinstall dependencies"
        exit 1
    fi
    echo "✅ Dependencies reinstalled successfully"
fi

echo "🌐 Starting development server..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API should be running at: http://localhost:8000"
echo ""
echo "💡 If you encounter JSON parsing errors:"
echo "   Open: http://localhost:3000/../clear_browser_data.html"
echo "   Click 'Clear localStorage' and refresh the main app"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="

# Start the development server
npm run dev

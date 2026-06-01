#!/bin/bash

# Centrika Employee Portal - Quick Start Script
# This script starts both the backend and frontend servers independently

echo "🚀 Starting Centrika Employee Portal..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js."
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}Working directory: ${SCRIPT_DIR}${NC}"
echo ""

# Install backend dependencies if needed
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    (cd "$SCRIPT_DIR/backend" && npm install)
    echo ""
fi

# Install frontend dependencies if needed
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    (cd "$SCRIPT_DIR/frontend" && npm install)
    echo ""
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Starting servers...${NC}"
echo ""

# Start backend in the background
echo -e "${YELLOW}Starting Backend (port 3001)...${NC}"
(cd "$SCRIPT_DIR/backend" && npm run dev) &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in the background
echo -e "${YELLOW}Starting Frontend (port 5173)...${NC}"
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

echo ""
echo -e "${GREEN}✅ All servers running!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Centrika Employee Portal is Ready!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo "📱 Frontend:"
echo -e "   ${GREEN}http://localhost:5173${NC}"
echo ""
echo "🔙 Backend API:"
echo -e "   ${GREEN}http://localhost:3001/api/trpc${NC}"
echo ""
echo "💡 Each app can also be started independently:"
echo "   cd backend  && npm run dev"
echo "   cd frontend && npm run dev"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for background processes
wait

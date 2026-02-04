#!/bin/bash
# =============================================================================
# GrowthDeck Development Server Startup Script
# =============================================================================
# This script ensures a clean, reliable dev server startup every time.
# Usage: npm run dev:clean  OR  ./scripts/dev.sh
# =============================================================================

set -e  # Exit on any error

PORT=${PORT:-3000}
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"

echo ""
echo "🚀 GrowthDeck Dev Server Startup"
echo "================================="
echo ""

# -----------------------------------------------------------------------------
# Step 1: Kill any existing processes on our port
# -----------------------------------------------------------------------------
echo "📡 Step 1: Checking for processes on port $PORT..."

if command -v lsof &> /dev/null; then
  # Unix/Mac
  PID=$(lsof -ti:$PORT 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "   Killing existing process on port $PORT (PID: $PID)..."
    kill -9 $PID 2>/dev/null || true
    sleep 1
  fi
elif command -v netstat &> /dev/null; then
  # Windows (Git Bash)
  PID=$(netstat -ano 2>/dev/null | grep ":$PORT " | grep "LISTENING" | awk '{print $5}' | head -1)
  if [ -n "$PID" ] && [ "$PID" != "0" ]; then
    echo "   Killing existing process on port $PORT (PID: $PID)..."
    taskkill //F //PID $PID 2>/dev/null || true
    sleep 1
  fi
fi

echo "   ✓ Port $PORT is clear"
echo ""

# -----------------------------------------------------------------------------
# Step 2: Clean stale caches and lock files
# -----------------------------------------------------------------------------
echo "🧹 Step 2: Cleaning stale caches..."

# Remove Next.js dev lock file
if [ -f ".next/dev/lock" ]; then
  echo "   Removing stale lock file..."
  rm -f .next/dev/lock
fi

# Check if .next cache might be corrupted (over 500MB or has errors)
if [ -d ".next" ]; then
  CACHE_SIZE=$(du -sm .next 2>/dev/null | cut -f1 || echo "0")
  if [ "$CACHE_SIZE" -gt 500 ]; then
    echo "   Cache is large (${CACHE_SIZE}MB), cleaning..."
    rm -rf .next
  fi
fi

echo "   ✓ Caches cleaned"
echo ""

# -----------------------------------------------------------------------------
# Step 3: Verify Prisma client is up to date
# -----------------------------------------------------------------------------
echo "🔄 Step 3: Verifying Prisma client..."

# Check if Prisma client exists and has the expected models
PRISMA_CLIENT="node_modules/.prisma/client/index.js"
SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$PRISMA_CLIENT" ]; then
  echo "   Prisma client not found, generating..."
  npx prisma generate
elif [ "$SCHEMA_FILE" -nt "$PRISMA_CLIENT" ]; then
  echo "   Schema is newer than client, regenerating..."
  rm -rf node_modules/.prisma
  npx prisma generate
else
  echo "   ✓ Prisma client is up to date"
fi

echo ""

# -----------------------------------------------------------------------------
# Step 4: Verify database connection
# -----------------------------------------------------------------------------
echo "🗄️  Step 4: Verifying database connection..."

# Quick database connection check
if npx prisma db execute --stdin <<< "SELECT 1" &>/dev/null; then
  echo "   ✓ Database connection successful"
else
  echo "   ⚠️  Database connection failed - check your .env file"
  echo "   Continuing anyway (app will show connection errors)..."
fi

echo ""

# -----------------------------------------------------------------------------
# Step 5: Start the dev server
# -----------------------------------------------------------------------------
echo "🎯 Step 5: Starting development server on port $PORT..."
echo ""
echo "==========================================="
echo "  Server starting at http://localhost:$PORT"
echo "  Press Ctrl+C to stop"
echo "==========================================="
echo ""

# Start Next.js dev server
exec npx next dev -p $PORT

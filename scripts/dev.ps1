# =============================================================================
# GrowthDeck Development Server Startup Script (PowerShell)
# =============================================================================
# Usage: npm run dev:clean  OR  powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$Port = if ($env:PORT) { $env:PORT } else { 3000 }
$ProjectDir = Split-Path -Parent $PSScriptRoot

Set-Location $ProjectDir

Write-Host ""
Write-Host "🚀 GrowthDeck Dev Server Startup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# Step 1: Kill any existing processes on our port
# -----------------------------------------------------------------------------
Write-Host "📡 Step 1: Checking for processes on port $Port..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        if ($pid -and $pid -ne 0) {
            Write-Host "   Killing existing process on port $Port (PID: $pid)..."
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
    }
}

Write-Host "   ✓ Port $Port is clear" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# Step 2: Clean stale caches and lock files
# -----------------------------------------------------------------------------
Write-Host "🧹 Step 2: Cleaning stale caches..." -ForegroundColor Yellow

# Remove Next.js dev lock file
if (Test-Path ".next/dev/lock") {
    Write-Host "   Removing stale lock file..."
    Remove-Item ".next/dev/lock" -Force
}

# Check if .next cache might be corrupted
if (Test-Path ".next") {
    $cacheSize = (Get-ChildItem ".next" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    if ($cacheSize -gt 500) {
        Write-Host "   Cache is large ($([math]::Round($cacheSize))MB), cleaning..."
        Remove-Item ".next" -Recurse -Force
    }
}

Write-Host "   ✓ Caches cleaned" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# Step 3: Verify Prisma client is up to date
# -----------------------------------------------------------------------------
Write-Host "🔄 Step 3: Verifying Prisma client..." -ForegroundColor Yellow

$prismaClient = "node_modules/.prisma/client/index.js"
$schemaFile = "prisma/schema.prisma"

if (-not (Test-Path $prismaClient)) {
    Write-Host "   Prisma client not found, generating..."
    npx prisma generate
} elseif ((Get-Item $schemaFile).LastWriteTime -gt (Get-Item $prismaClient).LastWriteTime) {
    Write-Host "   Schema is newer than client, regenerating..."
    Remove-Item "node_modules/.prisma" -Recurse -Force -ErrorAction SilentlyContinue
    npx prisma generate
} else {
    Write-Host "   ✓ Prisma client is up to date" -ForegroundColor Green
}

Write-Host ""

# -----------------------------------------------------------------------------
# Step 4: Verify database connection
# -----------------------------------------------------------------------------
Write-Host "🗄️  Step 4: Verifying database connection..." -ForegroundColor Yellow

try {
    $result = echo "SELECT 1" | npx prisma db execute --stdin 2>&1
    Write-Host "   ✓ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Database connection failed - check your .env file" -ForegroundColor Red
    Write-Host "   Continuing anyway (app will show connection errors)..."
}

Write-Host ""

# -----------------------------------------------------------------------------
# Step 5: Start the dev server
# -----------------------------------------------------------------------------
Write-Host "🎯 Step 5: Starting development server on port $Port..." -ForegroundColor Yellow
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Server starting at http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Start Next.js dev server
npx next dev -p $Port

#!/usr/bin/env node
/**
 * =============================================================================
 * GrowthDeck Development Server Startup Script
 * =============================================================================
 * This script ensures a clean, reliable dev server startup every time.
 * Usage: npm run dev:clean
 * =============================================================================
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PROJECT_DIR = path.resolve(__dirname, '..');
const isWindows = os.platform() === 'win32';

process.chdir(PROJECT_DIR);

console.log('');
console.log('🚀 GrowthDeck Dev Server Startup');
console.log('=================================');
console.log('');

// -----------------------------------------------------------------------------
// Step 1: Kill any existing processes on our port
// -----------------------------------------------------------------------------
console.log(`📡 Step 1: Checking for processes on port ${PORT}...`);

try {
  if (isWindows) {
    // Windows: use netstat and taskkill
    const result = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    const lines = result.split('\n').filter(Boolean);
    const pids = new Set();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }

    for (const pid of pids) {
      console.log(`   Killing existing process on port ${PORT} (PID: ${pid})...`);
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } catch (e) {
        // Process may have already exited
      }
    }
  } else {
    // Unix/Mac: use lsof
    const result = execSync(`lsof -ti:${PORT}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (result) {
      const pids = result.split('\n').filter(Boolean);
      for (const pid of pids) {
        console.log(`   Killing existing process on port ${PORT} (PID: ${pid})...`);
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        } catch (e) {
          // Process may have already exited
        }
      }
    }
  }
} catch (e) {
  // No processes found on port - this is fine
}

// Small delay to ensure port is released
execSync(isWindows ? 'ping -n 2 127.0.0.1 >nul' : 'sleep 1', { stdio: 'ignore' });

console.log(`   ✓ Port ${PORT} is clear`);
console.log('');

// -----------------------------------------------------------------------------
// Step 2: Clean stale caches and lock files
// -----------------------------------------------------------------------------
console.log('🧹 Step 2: Cleaning stale caches...');

const lockFile = path.join(PROJECT_DIR, '.next', 'dev', 'lock');
if (fs.existsSync(lockFile)) {
  console.log('   Removing stale lock file...');
  fs.unlinkSync(lockFile);
}

const nextDir = path.join(PROJECT_DIR, '.next');
if (fs.existsSync(nextDir)) {
  // Check cache size
  let cacheSize = 0;
  try {
    const getSize = (dir) => {
      let size = 0;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          size += getSize(fullPath);
        } else {
          size += stat.size;
        }
      }
      return size;
    };
    cacheSize = getSize(nextDir) / (1024 * 1024); // MB
  } catch (e) {
    // Ignore errors
  }

  if (cacheSize > 500) {
    console.log(`   Cache is large (${Math.round(cacheSize)}MB), cleaning...`);
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
}

console.log('   ✓ Caches cleaned');
console.log('');

// -----------------------------------------------------------------------------
// Step 3: Verify Prisma client is up to date
// -----------------------------------------------------------------------------
console.log('🔄 Step 3: Verifying Prisma client...');

const prismaClient = path.join(PROJECT_DIR, 'node_modules', '.prisma', 'client', 'index.js');
const schemaFile = path.join(PROJECT_DIR, 'prisma', 'schema.prisma');

let needsGenerate = false;

if (!fs.existsSync(prismaClient)) {
  console.log('   Prisma client not found, generating...');
  needsGenerate = true;
} else if (fs.existsSync(schemaFile)) {
  const clientMtime = fs.statSync(prismaClient).mtimeMs;
  const schemaMtime = fs.statSync(schemaFile).mtimeMs;

  if (schemaMtime > clientMtime) {
    console.log('   Schema is newer than client, regenerating...');
    // Remove old client to avoid file lock issues
    const prismaDir = path.join(PROJECT_DIR, 'node_modules', '.prisma');
    if (fs.existsSync(prismaDir)) {
      fs.rmSync(prismaDir, { recursive: true, force: true });
    }
    needsGenerate = true;
  }
}

if (needsGenerate) {
  try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: PROJECT_DIR });
  } catch (e) {
    console.error('   ⚠️  Prisma generate failed, but continuing...');
  }
} else {
  console.log('   ✓ Prisma client is up to date');
}

console.log('');

// -----------------------------------------------------------------------------
// Step 4: Verify database connection
// -----------------------------------------------------------------------------
console.log('🗄️  Step 4: Verifying database connection...');

try {
  execSync('npx prisma db execute --stdin', {
    input: 'SELECT 1',
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: PROJECT_DIR,
    timeout: 10000
  });
  console.log('   ✓ Database connection successful');
} catch (e) {
  console.log('   ⚠️  Database connection failed - check your .env file');
  console.log('   Continuing anyway (app will show connection errors)...');
}

console.log('');

// -----------------------------------------------------------------------------
// Step 5: Start the dev server
// -----------------------------------------------------------------------------
console.log(`🎯 Step 5: Starting development server on port ${PORT}...`);
console.log('');
console.log('===========================================');
console.log(`  Server starting at http://localhost:${PORT}`);
console.log('  Press Ctrl+C to stop');
console.log('===========================================');
console.log('');

// Start Next.js dev server
const child = spawn('npx', ['next', 'dev', '-p', PORT.toString()], {
  cwd: PROJECT_DIR,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

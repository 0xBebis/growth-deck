#!/usr/bin/env node
/**
 * =============================================================================
 * GrowthDeck Clean Script
 * =============================================================================
 * Cleans all caches and generated files for a fresh start.
 * Usage: npm run clean
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const PROJECT_DIR = path.resolve(__dirname, '..');
const isWindows = os.platform() === 'win32';

process.chdir(PROJECT_DIR);

console.log('');
console.log('🧹 GrowthDeck Clean');
console.log('==================');
console.log('');

// Kill any running dev servers first
console.log('📡 Killing any running dev servers...');

const ports = [3000, 3001, 3002];
for (const port of ports) {
  try {
    if (isWindows) {
      const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      const lines = result.split('\n').filter(Boolean);

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`   Killed process on port ${port} (PID: ${pid})`);
          } catch (e) {
            // Ignore
          }
        }
      }
    } else {
      const result = execSync(`lsof -ti:${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      if (result) {
        const pids = result.split('\n').filter(Boolean);
        for (const pid of pids) {
          try {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            console.log(`   Killed process on port ${port} (PID: ${pid})`);
          } catch (e) {
            // Ignore
          }
        }
      }
    }
  } catch (e) {
    // No process on this port
  }
}

console.log('   ✓ Done');
console.log('');

// Clean directories
const dirsToClean = [
  '.next',
  'node_modules/.cache',
  'node_modules/.prisma'
];

console.log('🗑️  Removing caches...');

for (const dir of dirsToClean) {
  const fullPath = path.join(PROJECT_DIR, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`   Removing ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

console.log('   ✓ Done');
console.log('');

// Regenerate Prisma client
console.log('🔄 Regenerating Prisma client...');

try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: PROJECT_DIR });
  console.log('   ✓ Done');
} catch (e) {
  console.error('   ⚠️  Prisma generate failed');
}

console.log('');
console.log('✅ Clean complete! Run `npm run dev` to start fresh.');
console.log('');

#!/usr/bin/env node

/**
 * Direct silent mode script for The Collab Room
 * 
 * This script forcibly sets the LOG_LEVEL to 0 (ERROR only)
 * before starting the server, bypassing any issues with .env loading
 */

// Configure environment variables first - before any other code executes
process.env.LOG_LEVEL = '0';

// Check if it was set
if (process.env.LOG_LEVEL !== '0') {
  console.error('Failed to set LOG_LEVEL environment variable');
  process.exit(1);
}

// Print confirmation
console.log('=== SILENT MODE ACTIVATED ===');
console.log('LOG_LEVEL environment variable set to 0 (ERROR only)');
console.log('Starting server...');

// Execute server startup with the environment variable set
const { spawn } = require('child_process');
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, LOG_LEVEL: '0' }
});

// Handle server exit
server.on('exit', (code) => {
  process.exit(code);
});

// Handle signals
process.on('SIGINT', () => {
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});
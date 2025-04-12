/**
 * Toggle logging script for The Collab Room
 * 
 * This script allows quickly toggling between different logging levels
 * without having to manually edit the .env file.
 * 
 * To use:
 * node toggle-logging.js [level]
 * 
 * Where [level] is:
 * 0 - ERROR only: minimal/silent mode (only critical errors)
 * 1 - WARN: production default (warnings and errors)
 * 2 - INFO: general information (startup, major events)
 * 3 - HTTP: all HTTP requests (great for API debugging)
 * 4 - DEBUG: verbose logging (full development mode)
 * 
 * Examples:
 * node toggle-logging.js 0  # Set to silent mode
 * node toggle-logging.js 4  # Set to verbose debug mode
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to .env file
const ENV_FILE = path.join(__dirname, '.env');

// Validate arguments
const args = process.argv.slice(2);
const level = parseInt(args[0]);

// Validate level input
if (isNaN(level) || level < 0 || level > 4) {
  console.error('Invalid log level. Please specify a number from 0-4:');
  console.error('  0 - ERROR only (silent mode)');
  console.error('  1 - WARN (production default)');
  console.error('  2 - INFO (general information)');
  console.error('  3 - HTTP (all requests)');
  console.error('  4 - DEBUG (verbose)');
  process.exit(1);
}

// Read current .env file
let envContent;
try {
  envContent = fs.readFileSync(ENV_FILE, 'utf8');
} catch (error) {
  console.error(`Could not read .env file: ${error.message}`);
  process.exit(1);
}

// Update LOG_LEVEL in .env file
if (envContent.includes('LOG_LEVEL=')) {
  // Replace existing LOG_LEVEL
  envContent = envContent.replace(/LOG_LEVEL=\d/, `LOG_LEVEL=${level}`);
} else {
  // Add LOG_LEVEL if not present
  envContent += `\nLOG_LEVEL=${level}\n`;
}

// Write updated .env file
try {
  fs.writeFileSync(ENV_FILE, envContent);
  console.log(`Successfully set LOG_LEVEL to ${level}`);
  
  // Provide level description
  const descriptions = [
    'ERROR only (silent mode)',
    'WARN (warnings and errors)',
    'INFO (general information)',
    'HTTP (all requests)',
    'DEBUG (verbose logging)'
  ];
  console.log(`Logging mode: ${descriptions[level]}`);
  
  // Note about restart
  console.log('\nIMPORTANT: You must restart the server for changes to take effect.');
  console.log('Run: npm run dev');
  
} catch (error) {
  console.error(`Failed to update .env file: ${error.message}`);
  process.exit(1);
}
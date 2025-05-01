/**
 * Direct Silent Mode Script
 * 
 * This script directly sets the logging level to 0 (ERROR only) by editing the config
 * file. It bypasses the normal .env loading mechanism which seems to be unreliable
 * in the current environment.
 */

const fs = require('fs');
const path = require('path');

// Path to logger.js file
const loggerPath = path.join(__dirname, 'server', 'utils', 'logger.js');

console.log(`Reading logger file at: ${loggerPath}`);

// Read current content
let content;
try {
  content = fs.readFileSync(loggerPath, 'utf8');
  console.log('Successfully read logger file');
} catch (error) {
  console.error(`Failed to read logger file: ${error.message}`);
  process.exit(1);
}

// Modified version with forced LOG_LEVEL=0
const modifiedContent = content.replace(
  /const LOG_LEVEL = parseInt\(process\.env\.LOG_LEVEL.*/,
  'const LOG_LEVEL = 0; // FORCED TO SILENT MODE by direct-silent-mode.cjs'
);

if (modifiedContent === content) {
  console.error('Failed to find the LOG_LEVEL declaration in the logger file');
  console.log('Current content:');
  console.log(content);
  process.exit(1);
}

// Write modified content back
try {
  fs.writeFileSync(loggerPath, modifiedContent);
  console.log('Successfully modified logger file - LOG_LEVEL is now forced to 0 (ERROR only)');
  console.log('Restart the server to apply changes');
} catch (error) {
  console.error(`Failed to write logger file: ${error.message}`);
  process.exit(1);
}

console.log('Done.');
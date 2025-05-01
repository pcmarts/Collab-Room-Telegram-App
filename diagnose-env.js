/**
 * Diagnostic tool to analyze environment variable loading
 * 
 * This script helps identify if environment variables are being loaded 
 * correctly from .env files or directly from the environment
 */

import { promises as fs, existsSync, readFileSync } from 'fs';
const dotenvPath = '.env';

console.log('=== Environment Variable Diagnostic Tool ===');

// Check if .env file exists
console.log('\nChecking .env file:');
if (existsSync(dotenvPath)) {
  try {
    const envContent = readFileSync(dotenvPath, 'utf8');
    console.log('- .env file exists');
    
    // Check for LOG_LEVEL in the file
    const logLevelMatch = envContent.match(/LOG_LEVEL=(\d)/);
    if (logLevelMatch) {
      console.log(`- LOG_LEVEL=${logLevelMatch[1]} found in .env file`);
    } else {
      console.log('- LOG_LEVEL not found in .env file');
      console.log('- .env file content:');
      console.log(envContent);
    }
  } catch (err) {
    console.error(`- Error reading .env file: ${err.message}`);
  }
} else {
  console.log('- .env file does not exist');
}

// Check direct environment variables
console.log('\nChecking process.env:');
console.log(`- LOG_LEVEL direct value: '${process.env.LOG_LEVEL}'`);
console.log(`- LOG_LEVEL type: ${typeof process.env.LOG_LEVEL}`);

// Try to use direct environment variable (using bash directly)
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

try {
  console.log('\nTesting direct environment variable access:');
  const { stdout, stderr } = await execAsync('bash -c "echo LOG_LEVEL=\\$LOG_LEVEL"');
  console.log(`- Bash output: ${stdout.trim()}`);
  if (stderr) console.error(`- Bash stderr: ${stderr}`);
} catch (error) {
  console.error(`- Bash execution error: ${error.message}`);
}

// Print all environment variables for debugging
console.log('\nEnvironment variables related to logging:');
const envVars = Object.keys(process.env).sort();
for (const key of envVars) {
  if (key.toLowerCase().includes('level') || key.toLowerCase().includes('log')) {
    console.log(`${key} = '${process.env[key]}'`);
  }
}

console.log('\n=== Diagnostic Complete ===');
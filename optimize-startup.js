/**
 * Script to optimize application startup time for deployment
 * 
 * This script helps identify and mitigate potential causes of deployment timeouts
 * by setting appropriate environment variables and configuration options.
 * 
 * Run with:
 * node optimize-startup.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

// Load environment variables
dotenv.config();

console.log('Starting deployment optimization checks...');

// Check for potential timeout causes
const checkTimeoutCauses = () => {
  console.log('\n--- Checking for potential timeout causes ---');
  
  // Check for long database migrations
  console.log('Checking for database migration scripts...');
  const migrationFiles = fs.readdirSync('.').filter(file => 
    file.startsWith('db-migrate') && file.endsWith('.js')
  );
  
  if (migrationFiles.length > 0) {
    console.log(`⚠️ Found ${migrationFiles.length} migration scripts. These might be running during startup.`);
    console.log('Consider manually running these migrations before deployment:');
    migrationFiles.forEach(file => console.log(`  - ${file}`));
  } else {
    console.log('✅ No outstanding migration scripts found.');
  }
  
  // Check for lengthy data processing scripts
  console.log('\nChecking for data processing scripts...');
  const dataProcessingFiles = fs.readdirSync('.').filter(file => 
    (file.includes('enrich') || file.includes('download') || file.includes('process')) && 
    (file.endsWith('.js') || file.endsWith('.ts'))
  );
  
  if (dataProcessingFiles.length > 0) {
    console.log(`⚠️ Found ${dataProcessingFiles.length} data processing scripts. These might be running during startup.`);
    console.log('Consider disabling automatic execution of these scripts during deployment:');
    dataProcessingFiles.forEach(file => console.log(`  - ${file}`));
  } else {
    console.log('✅ No data processing scripts found that might run at startup.');
  }
  
  // Check environment variables
  console.log('\nChecking environment variables...');
  
  // Check logging level
  const logLevel = process.env.LOG_LEVEL || 'unknown';
  console.log(`Current LOG_LEVEL: ${logLevel}`);
  if (logLevel === 'DEBUG' || logLevel === '4') {
    console.log('⚠️ Debug logging is enabled, which can slow down deployment.');
    console.log('Consider setting LOG_LEVEL=1 (WARN) for deployment.');
  } else if (logLevel === 'HTTP' || logLevel === '3') {
    console.log('⚠️ HTTP logging is enabled, which generates high log volume.');
    console.log('Consider setting LOG_LEVEL=1 (WARN) for deployment.');
  } else if (logLevel === 'INFO' || logLevel === '2') {
    console.log('⚠️ INFO logging may generate excess logs during deployment.');
    console.log('Consider setting LOG_LEVEL=1 (WARN) for deployment.');
  } else if (logLevel === 'WARN' || logLevel === '1' || logLevel === 'ERROR' || logLevel === '0') {
    console.log('✅ Logging level is appropriate for deployment.');
  } else {
    console.log('⚠️ Unknown logging level. Consider setting LOG_LEVEL=1 (WARN) for deployment.');
  }
  
  // Check for long-running initialization
  try {
    console.log('\nChecking server initialization code...');
    const serverIndexPath = path.join('server', 'index.ts');
    
    if (fs.existsSync(serverIndexPath)) {
      const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
      
      // Check for synchronous operations during startup
      if (serverCode.includes('Sync(') || serverCode.includes('Sync (')) {
        console.log('⚠️ Server initialization contains synchronous operations that could block startup.');
      } else {
        console.log('✅ No obvious synchronous operations found in server initialization.');
      }
      
      // Check for telegram bot initialization
      if (serverCode.includes('new TelegramBot') || serverCode.includes('new Telegraf')) {
        console.log('⚠️ Telegram bot initialization found, which might cause delays if API is slow to respond.');
        console.log('Consider implementing lazy initialization for the Telegram bot.');
      }
    } else {
      console.log('⚠️ Could not find server/index.ts to check initialization code.');
    }
  } catch (error) {
    console.error('Error checking server initialization:', error.message);
  }
};

// Suggest optimizations
const suggestOptimizations = () => {
  console.log('\n--- Suggested Optimizations ---');
  
  console.log('1. Update .env to optimize deployment:');
  console.log('   LOG_LEVEL=1           # Set to WARN level for deployment');
  console.log('   SKIP_MIGRATIONS=true  # Skip automatic migrations during startup');
  console.log('   SKIP_DATA_PROCESSING=true # Skip data enrichment during startup');
  
  console.log('\n2. Create a deploy.env file with these settings for deployment use.');
  
  console.log('\n3. Consider implementing lazy loading for:');
  console.log('   - Telegram bot initialization');
  console.log('   - Third-party API clients');
  console.log('   - Data processing pipelines');
  
  console.log('\n4. Add deployment timeouts to package.json:');
  console.log('   "scripts": {');
  console.log('     "deploy": "NODE_OPTIONS=\'--max-old-space-size=512\' node deploy.js"');
  console.log('   }');
  
  console.log('\n5. Add detailed logging for deployment troubleshooting:');
  console.log('   console.log("Deployment step 1: Starting server");');
  console.log('   // ... initialization code');
  console.log('   console.log("Deployment step 2: Server initialized");');
};

// Generate an optimized .env file for deployment
const generateOptimizedEnv = () => {
  console.log('\n--- Generating optimized .env for deployment ---');
  
  try {
    // Read existing .env file
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    // Parse existing variables
    const envVars = dotenv.parse(envContent);
    
    // Optimize variables for deployment
    envVars.LOG_LEVEL = '1'; // WARN level
    envVars.SKIP_MIGRATIONS = 'true';
    envVars.SKIP_DATA_PROCESSING = 'true';
    envVars.NODE_ENV = 'production';
    
    // Create optimized content
    const optimizedContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Write to deploy.env
    fs.writeFileSync('deploy.env', optimizedContent);
    
    console.log('✅ Created deploy.env with optimized settings for deployment.');
    console.log('To use: cp deploy.env .env before deploying.');
  } catch (error) {
    console.error('Error generating optimized .env:', error.message);
  }
};

// Run all checks and optimizations
const main = () => {
  console.log('==================================');
  console.log('DEPLOYMENT OPTIMIZATION ASSISTANT');
  console.log('==================================');
  
  checkTimeoutCauses();
  suggestOptimizations();
  generateOptimizedEnv();
  
  console.log('\n==================================');
  console.log('Optimization process completed!');
  console.log('Review the suggested changes above to improve deployment success.');
  console.log('==================================');
};

// Run the main function
main();
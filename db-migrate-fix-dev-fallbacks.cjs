/**
 * This script removes development user fallbacks from routes.ts
 * 
 * Run with:
 * node db-migrate-fix-dev-fallbacks.cjs
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Removing development user fallbacks from routes.ts...');
  
  const routesPath = path.join(process.cwd(), 'server/routes.ts');
  let routesContent = fs.readFileSync(routesPath, 'utf8');
  
  // Create a backup
  fs.writeFileSync(`${routesPath}.bak`, routesContent);
  console.log('Created backup at server/routes.ts.bak');
  
  // Replace each occurrence of the pattern with proper auth checking
  let count = 0;
  
  // Fix the pattern where telegramId is assigned with fallback
  routesContent = routesContent.replace(
    /const telegramData = getTelegramUserFromRequest\(req\);(\r?\n\s+)const telegramId = telegramData\?\.id\?\.toString\(\) \|\| process\.env\.DEV_USER_ID \|\| '';/g, 
    function(match) {
      count++;
      return 'const telegramData = getTelegramUserFromRequest(req);\n' +
             '      if (!telegramData) {\n' +
             '        return res.status(401).json({ error: \'Unauthorized\' });\n' +
             '      }\n' +
             '      const telegramId = telegramData.id.toString();';
    }
  );
  
  // Write changes back to the file
  fs.writeFileSync(routesPath, routesContent);
  
  console.log(`Fixed ${count} occurrences of development user fallbacks`);
  console.log('Development user fallbacks removed successfully');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
/**
 * This script removes development fallbacks from routes.ts
 * 
 * Run with:
 * node db-migrate-remove-development-fallbacks.cjs
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Removing development fallbacks from routes.ts...');
  
  const routesPath = path.join(process.cwd(), 'server/routes.ts');
  let routesContent = fs.readFileSync(routesPath, 'utf8');
  
  // Create a backup
  fs.writeFileSync(`${routesPath}.bak2`, routesContent);
  console.log('Created backup at server/routes.ts.bak2');
  
  // Replace each occurrence of the pattern with proper auth checking
  let count = 0;
  
  // Fix the pattern where development fallbacks are used
  routesContent = routesContent.replace(
    /if \(!telegramUser\) \{(\r?\n\s+)console\.error\('No Telegram user ID found'\);(\r?\n\s+)if \(process\.env\.NODE_ENV === 'production'\) \{(\r?\n\s+)res\.status\(400\);(\r?\n\s+)return res\.json\(\{ error: 'Invalid Telegram data' \}\);(\r?\n\s+)\}(\r?\n\s+)\/\/ In development, fallback to test user(\r?\n\s+)console\.log\('Using development fallback for Telegram data'\);(\r?\n\s+)telegramUser = \{(\r?\n\s+)id: '123456789',(\r?\n\s+)first_name: 'Dev',(\r?\n\s+)username: 'dev_user'(\r?\n\s+)\};/g, 
    function(match) {
      count++;
      return "if (!telegramUser) {\n        console.error('No Telegram user ID found');\n        res.status(401);\n        return res.json({ error: 'Unauthorized' });\n      }";
    }
  );
  
  // Find the last instance with "devUser" instead of "telegramUser"
  routesContent = routesContent.replace(
    /if \(!telegramUser\) \{(\r?\n\s+)console\.error\('No Telegram user ID found'\);(\r?\n\s+)if \(process\.env\.NODE_ENV === 'production'\) \{(\r?\n\s+)res\.status\(401\);(\r?\n\s+)return res\.json\(\{ error: 'Unauthorized' \}\);(\r?\n\s+)\}(\r?\n\s+)\/\/ In development, fallback to test user(\r?\n\s+)console\.log\('Using development fallback for Telegram data'\);(\r?\n\s+)const devUser = \{(\r?\n\s+)id: '123456789',(\r?\n\s+)username: 'test_user',(\r?\n\s+)first_name: 'Test',/g, 
    function(match) {
      count++;
      return "if (!telegramUser) {\n        console.error('No Telegram user ID found');\n        res.status(401);\n        return res.json({ error: 'Unauthorized' });\n      }";
    }
  );
  
  // Write changes back to the file
  fs.writeFileSync(routesPath, routesContent);
  
  console.log(`Fixed ${count} occurrences of development fallbacks`);
  console.log('Development fallbacks removed successfully');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
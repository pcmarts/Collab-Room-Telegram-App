const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server/routes.ts');
const fileContents = fs.readFileSync(filePath, 'utf8');

// Replace all instances of the fallback with proper authentication
const newContents = fileContents.replace(
  /const telegramData = getTelegramUserFromRequest\(req\);(\r?\n)(\s+)const telegramId = telegramData\?\.(id)\?\.toString\(\) \|\| process\.env\.DEV_USER_ID \|\| '';/g,
  'const telegramData = getTelegramUserFromRequest(req);\n$2if (!telegramData) {\n$2  return res.status(401).json({ error: \'Unauthorized\' });\n$2}\n$2const telegramId = telegramData.$3.toString();'
);

fs.writeFileSync(filePath, newContents);
console.log('Successfully fixed dev user fallbacks');

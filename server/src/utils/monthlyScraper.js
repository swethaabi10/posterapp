/**
 * Monthly Scraper Bridge
 * Re-routes to the modern Cloud SQL / PostgreSQL implementation in scripts/monthly-scraper.ts
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Routing monthly scraper to Cloud SQL PostgreSQL implementation...');

const scriptPath = path.resolve(__dirname, '../../../scripts/monthly-scraper.ts');
const child = spawn('npx', ['tsx', scriptPath], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

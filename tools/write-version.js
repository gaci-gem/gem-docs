const { writeFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');
const pkg = require('../package.json');

function safeExec(command) {
  try { return execSync(command).toString().trim(); } catch { return 'unknown'; }
}

const data = {
  version: pkg.version,
  branch: safeExec('git rev-parse --abbrev-ref HEAD'),
  commitHash: safeExec('git rev-parse --short HEAD'),
  buildTime: new Date().toISOString(),
};

writeFileSync(join(__dirname, '..', 'src/assets/version.json'), JSON.stringify(data, null, 2));
console.log('version.json updated:', data);

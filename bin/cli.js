#!/usr/bin/env node

const requiredVersion = 18;
const currentVersion = parseInt(process.versions.node.split('.')[0], 10);

if (currentVersion < requiredVersion) {
  console.error(`repogrok requires Node.js >= ${requiredVersion}. Current version: ${process.versions.node}`);
  process.exit(1);
}

import('../src/cli/commands.js').then(({ run }) => run()).catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

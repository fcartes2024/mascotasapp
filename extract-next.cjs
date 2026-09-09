const pacote = require('C:/Program Files/nodejs/node_modules/npm/node_modules/pacote');
const path = require('path');
const fs = require('fs');

const dest = path.resolve(process.cwd(), 'node_modules', 'next');
console.log('Extracting next@16.3.3 to:', dest);

pacote.extract('next@16.3.3', dest, {
  preferOffline: true,
  offline: true,
  resolved: 'https://registry.npmjs.org/next/-/next-16.3.3.tgz',
  integrity: 'sha512-tuRTx1nQ/yVw83cwJBo9F+njGUgMn3UHQycreWHB8XsStvvAh1AthbI8/4IpKnFaF58F+iSiHejYOlMQ/eq83g=='
}).then(() => {
  console.log('EXTRACTION COMPLETE');
  const binPath = path.join(dest, 'dist/bin/next');
  const hookPath = path.join(dest, 'dist/server/require-hook.js');
  console.log('next bin exists:', fs.existsSync(binPath));
  console.log('require-hook exists:', fs.existsSync(hookPath));
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

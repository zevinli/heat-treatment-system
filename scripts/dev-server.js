// Dev server launcher - sets correct tsconfig for tsx/cjs
// This avoids the npx tsx IPC pipe issue in sandboxed environments
const path = require('path');

// Point tsx to the correct tsconfig
process.env.TSX_TSCONFIG_PATH = path.resolve(__dirname, '../tsconfig.node.json');

// Register tsx for CJS TypeScript files
require('tsx/cjs');

// Start the server
require('../server/main');

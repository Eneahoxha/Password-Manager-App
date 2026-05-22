const { createServer } = require('node:http');
const app = require('./src/app');
const { env } = require('./src/config/environment');

const server = createServer(app);

server.listen(env.PORT, () => {
  console.log(`SecureVault backend listening on ${env.PORT}`);
});

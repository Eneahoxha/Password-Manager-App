const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDataFile = path.join(os.tmpdir(), `securevault-auth-${Date.now()}.json`);

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5174';
process.env.JWT_SECRET = 'unit-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';
process.env.SECUREVAULT_DATA_FILE = tempDataFile;

const AuthService = require('../../src/core/auth/AuthService');
const UserRepository = require('../../src/infrastructure/repositories/UserRepository');
const TokenRepository = require('../../src/infrastructure/repositories/TokenRepository');

test('registers, logs in and persists user and refresh token', async () => {
  const authService = new AuthService(new UserRepository(), new TokenRepository());

  const registered = await authService.register('test@example.com', 'StrongPass!123');
  assert.equal(registered.email, 'test@example.com');

  const login = await authService.login('test@example.com', 'StrongPass!123');
  assert.equal(login.user.email, 'test@example.com');
  assert.match(login.accessToken, /^[^.]+\.[^.]+$/);

  const store = JSON.parse(fs.readFileSync(tempDataFile, 'utf8'));
  assert.equal(store.users.length, 1);
  assert.equal(store.refreshTokens.length, 1);
});

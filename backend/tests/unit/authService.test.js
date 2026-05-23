const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5174';
process.env.JWT_SECRET = 'unit-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';

const AuthService = require('../../src/core/auth/AuthService');
const UserRepository = require('../../src/infrastructure/repositories/UserRepository');
const TokenRepository = require('../../src/infrastructure/repositories/TokenRepository');

function createAuthService(testName) {
  const tempDataFile = path.join(os.tmpdir(), `securevault-auth-${testName}-${Date.now()}.json`);
  process.env.SECUREVAULT_DATA_FILE = tempDataFile;
  return { authService: new AuthService(new UserRepository(), new TokenRepository()), tempDataFile };
}

test('registers, verifies email, logs in and completes recovery flow', async () => {
  const { authService, tempDataFile } = createAuthService('primary');

  const registered = await authService.register('test@example.com', 'StrongPass!123', { verificationToken: 'VERIFYTOKEN1234567890' });
  assert.equal(registered.email, 'test@example.com');

  // newly registered emails are not verified; login should be blocked
  await assert.rejects(async () => {
    await authService.login('test@example.com', 'StrongPass!123');
  }, { message: 'Email non verificata.' });

  await assert.rejects(async () => {
    await authService.verifyEmail('test@example.com', 'BADTOKEN');
  }, { message: 'Token di verifica non valido.' });

  await authService.verifyEmail('test@example.com', 'VERIFYTOKEN1234567890');

  // mark email verified via repository update and try login again
  const user = await authService.userRepository.findByEmail('test@example.com');
  assert.equal(user.emailVerified, true);

  const login = await authService.login('test@example.com', 'StrongPass!123');
  assert.equal(login.user.email, 'test@example.com');
  assert.match(login.accessToken, /^[^.]+\.[^.]+$/);

  // test forgot/reset flow using injected OTP and recoveryCode from registration
  const otp = '123456';
  await authService.sendForgotOtp('test@example.com', otp);

  // read fresh user and ensure forgotOtpHash exists
  const updated = await authService.userRepository.findByEmail('test@example.com');
  assert.ok(updated.forgotOtpHash);

  // attempt reset with correct otp and recovery code
  await authService.resetWithRecovery({ email: 'test@example.com', otp, recoveryCode: registered.recoveryCode, newPassword: 'NewStrong!456' });

  // login with new password
  const relogin = await authService.login('test@example.com', 'NewStrong!456');
  assert.equal(relogin.user.email, 'test@example.com');

  const store = JSON.parse(fs.readFileSync(tempDataFile, 'utf8'));
  assert.equal(store.users.length, 1);
  const active = store.refreshTokens.filter((t) => !t.revoked);
  assert.equal(active.length, 1);
  const eventTypes = store.auditEvents.map((event) => event.eventType);
  assert.ok(eventTypes.includes('auth.register'));
  assert.ok(eventTypes.includes('auth.login'));
  assert.ok(eventTypes.includes('auth.verify_email'));
  assert.ok(eventTypes.includes('auth.recovery_otp_requested'));
  assert.ok(eventTypes.includes('auth.recovery_reset'));
});

test('can resend verification token before verification', async () => {
  const { authService } = createAuthService('resend');

  await authService.register('resend@example.com', 'StrongPass!123', { verificationToken: 'INITIALVERIFYTOKEN000' });
  await authService.resendVerificationEmail('resend@example.com', 'RESENDVERIFYTOKEN1111');

  await assert.rejects(async () => {
    await authService.verifyEmail('resend@example.com', 'INITIALVERIFYTOKEN000');
  }, { message: 'Token di verifica non valido.' });

  await authService.verifyEmail('resend@example.com', 'RESENDVERIFYTOKEN1111');
});

test('rejects expired otp during recovery reset', async () => {
  const { authService } = createAuthService('expired');

  const registered = await authService.register('expired@example.com', 'StrongPass!123', { verificationToken: 'VERIFYTOKEN0000000000' });
  await authService.verifyEmail('expired@example.com', 'VERIFYTOKEN0000000000');
  await authService.sendForgotOtp('expired@example.com', '654321');

  const user = await authService.userRepository.findByEmail('expired@example.com');
  await authService.userRepository.update(user.id, {
    forgotOtpCreatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString()
  });

  await assert.rejects(async () => {
    await authService.resetWithRecovery({
      email: 'expired@example.com',
      otp: '654321',
      recoveryCode: registered.recoveryCode,
      newPassword: 'NewStrong!456'
    });
  }, { message: 'OTP scaduto.' });
});

test('rejects expired email verification token', async () => {
  const { authService } = createAuthService('verify-expired');

  await authService.register('verify-expired@example.com', 'StrongPass!123', { verificationToken: 'VERIFYEXPIREDTOKEN00' });

  const user = await authService.userRepository.findByEmail('verify-expired@example.com');
  await authService.userRepository.update(user.id, {
    emailVerificationSentAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  });

  await assert.rejects(async () => {
    await authService.verifyEmail('verify-expired@example.com', 'VERIFYEXPIREDTOKEN00');
  }, { message: 'Token di verifica scaduto.' });
});

const crypto = require('node:crypto');
const { env } = require('../../config/environment');
const UserRepository = require('../../infrastructure/repositories/UserRepository');
const TokenRepository = require('../../infrastructure/repositories/TokenRepository');
const { createAccessToken, createRefreshToken, hashToken, decodeToken } = require('./TokenService');
const { generateCode, hashCode, verifyCode } = require('../../utils/codeUtils');
const emailService = require('../../services/emailService');
const AuditEventRepository = require('../../infrastructure/repositories/AuditEventRepository');

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const FORGOT_OTP_TTL_MS = 5 * 60 * 1000;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha256').toString('hex');
  return `${salt}.${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split('.');
  const derived = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha256').toString('hex');
  if (hash.length !== derived.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(derived));
}

class AuthService {
  constructor(userRepository = new UserRepository(), tokenRepository = new TokenRepository(), auditRepository = new AuditEventRepository()) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.auditRepository = auditRepository;
  }

  async recordAudit(eventType, outcome, details = {}) {
    try {
      await this.auditRepository.createEvent({
        eventType,
        outcome,
        userId: details.userId || null,
        email: details.email || null,
        metadata: details.metadata || {}
      });
    } catch (error) {
      console.error('Failed to write audit event', error);
    }
  }

  async register(email, password, options = {}) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      await this.recordAudit('auth.register', 'failure', { email, metadata: { reason: 'email_already_registered' } });
      const error = new Error('Email già registrata.');
      error.status = 409;
      throw error;
    }

    // generate a recovery code that the user will download and keep safe
    const recoveryCode = generateCode(12);
    const recoveryCodeHash = hashCode(recoveryCode);

    // generate an email verification token
    const verificationToken = options.verificationToken || generateCode(20);
    const verificationTokenHash = hashCode(verificationToken);

    const user = await this.userRepository.create({
      email,
      passwordHash: hashPassword(password),
      recoveryCodeHash,
      recoveryCodeCreatedAt: new Date().toISOString(),
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationSentAt: new Date().toISOString(),
      emailVerified: false
    });

    // send verification email asynchronously
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
    } catch (e) {
      // log but don't fail registration for now
      console.error('Failed to send verification email', e);
    }

    await this.recordAudit('auth.register', 'success', { userId: user.id, email, metadata: { emailVerified: false } });

    return { id: user.id, email: user.email, recoveryCode };
  }

  async resendVerificationEmail(email, providedToken = null) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.recordAudit('auth.resend_verification', 'failure', { email, metadata: { reason: 'user_not_found' } });
      const error = new Error('Utente non trovato.');
      error.status = 404;
      throw error;
    }

    if (user.emailVerified) {
      await this.recordAudit('auth.resend_verification', 'failure', { userId: user.id, email, metadata: { reason: 'already_verified' } });
      const error = new Error('Email già verificata.');
      error.status = 400;
      throw error;
    }

    const verificationToken = providedToken || generateCode(20);
    const verificationTokenHash = hashCode(verificationToken);

    if (this.userRepository.update) {
      await this.userRepository.update(user.id, {
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationSentAt: new Date().toISOString()
      });
    }

    try {
      await emailService.sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.error('Failed to resend verification email', e);
    }

    await this.recordAudit('auth.resend_verification', 'success', { userId: user.id, email });

    return true;
  }

  async verifyEmail(email, token) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.recordAudit('auth.verify_email', 'failure', { email, metadata: { reason: 'user_not_found' } });
      const error = new Error('Utente non trovato.');
      error.status = 404;
      throw error;
    }

    if (!user.emailVerificationSentAt) {
      await this.recordAudit('auth.verify_email', 'failure', { userId: user.id, email, metadata: { reason: 'token_missing' } });
      const error = new Error('Token di verifica non disponibile.');
      error.status = 400;
      throw error;
    }

    const sentAt = new Date(user.emailVerificationSentAt).getTime();
    if (Date.now() - sentAt > EMAIL_VERIFICATION_TTL_MS) {
      await this.recordAudit('auth.verify_email', 'failure', { userId: user.id, email, metadata: { reason: 'token_expired' } });
      const error = new Error('Token di verifica scaduto.');
      error.status = 400;
      throw error;
    }

    if (!verifyCode(token, user.emailVerificationTokenHash)) {
      await this.recordAudit('auth.verify_email', 'failure', { userId: user.id, email, metadata: { reason: 'invalid_token' } });
      const error = new Error('Token di verifica non valido.');
      error.status = 400;
      throw error;
    }

    // mark email verified and clear token
    const updateData = { emailVerified: true, emailVerificationTokenHash: null, emailVerificationSentAt: null };
    if (this.userRepository.update) {
      await this.userRepository.update(user.id, updateData);
    }

    await this.recordAudit('auth.verify_email', 'success', { userId: user.id, email });

    return true;
  }

  async sendForgotOtp(email, providedOtp = null) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.recordAudit('auth.recovery_otp_requested', 'failure', { email, metadata: { reason: 'user_not_found' } });
      const error = new Error('Utente non trovato.');
      error.status = 404;
      throw error;
    }

    const otp = providedOtp || Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashCode(otp);
    const otpCreatedAt = new Date().toISOString();

    if (this.userRepository.update) {
      await this.userRepository.update(user.id, { forgotOtpHash: otpHash, forgotOtpCreatedAt: otpCreatedAt });
    }

    try {
      await emailService.sendOtpEmail(email, otp);
    } catch (e) {
      console.error('Failed to send OTP email', e);
    }

    await this.recordAudit('auth.recovery_otp_requested', 'success', { userId: user.id, email });

    return true;
  }

  async resetWithRecovery({ email, otp, recoveryCode, newPassword }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.recordAudit('auth.recovery_reset', 'failure', { email, metadata: { reason: 'user_not_found' } });
      const error = new Error('Utente non trovato.');
      error.status = 404;
      throw error;
    }

    // verify OTP
    // verify OTP and check expiry (5 minutes)
    const otpValid = verifyCode(otp, user.forgotOtpHash);
    if (!otpValid) {
      await this.recordAudit('auth.recovery_reset', 'failure', { userId: user.id, email, metadata: { reason: 'invalid_otp' } });
      const error = new Error('OTP non valido.');
      error.status = 400;
      throw error;
    }

    if (user.forgotOtpCreatedAt) {
      const created = new Date(user.forgotOtpCreatedAt).getTime();
      const now = Date.now();
      const age = now - created;
      if (age > FORGOT_OTP_TTL_MS) {
        await this.recordAudit('auth.recovery_reset', 'failure', { userId: user.id, email, metadata: { reason: 'otp_expired' } });
        const error = new Error('OTP scaduto.');
        error.status = 400;
        throw error;
      }
    }

    // verify recovery code
    const recoveryValid = verifyCode(recoveryCode, user.recoveryCodeHash);
    if (!recoveryValid) {
      await this.recordAudit('auth.recovery_reset', 'failure', { userId: user.id, email, metadata: { reason: 'invalid_recovery_code' } });
      const error = new Error('Codice di recupero non valido.');
      error.status = 400;
      throw error;
    }

    // set new password
    const newHash = hashPassword(newPassword);
    if (this.userRepository.update) {
      await this.userRepository.update(user.id, { passwordHash: newHash, forgotOtpHash: null, forgotOtpCreatedAt: null });
    }

    await this.recordAudit('auth.recovery_reset', 'success', { userId: user.id, email });

    return true;
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await this.recordAudit('auth.login', 'failure', { email, metadata: { reason: 'invalid_credentials' } });
      const error = new Error('Credenziali non valide.');
      error.status = 401;
      throw error;
    }

    if (!user.emailVerified) {
      await this.recordAudit('auth.login', 'failure', { userId: user.id, email, metadata: { reason: 'email_not_verified' } });
      const error = new Error('Email non verificata.');
      error.status = 403;
      throw error;
    }

    const accessToken = createAccessToken(user.id, env.JWT_SECRET);
    const refreshToken = createRefreshToken(user.id, env.JWT_REFRESH_SECRET);

    await this.tokenRepository.revokeAllUserTokens(user.id);
    await this.tokenRepository.createRefreshToken(user.id, hashToken(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    await this.recordAudit('auth.login', 'success', { userId: user.id, email });

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken
    };
  }

  async refresh(refreshToken) {
    const payload = decodeToken(refreshToken, env.JWT_REFRESH_SECRET);
    const tokenRecord = await this.tokenRepository.findRefreshToken(hashToken(refreshToken));

    if (!tokenRecord || tokenRecord.revoked) {
      await this.recordAudit('auth.refresh', 'failure', { userId: payload?.sub, metadata: { reason: 'invalid_refresh_token' } });
      const error = new Error('Refresh token non valido.');
      error.status = 401;
      throw error;
    }

    const accessToken = createAccessToken(payload.sub, env.JWT_SECRET);
    const rotatedRefreshToken = createRefreshToken(payload.sub, env.JWT_REFRESH_SECRET);
    await this.tokenRepository.revokeRefreshToken(tokenRecord.id);
    await this.tokenRepository.createRefreshToken(payload.sub, hashToken(rotatedRefreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    await this.recordAudit('auth.refresh', 'success', { userId: payload.sub });

    return { accessToken, refreshToken: rotatedRefreshToken, userId: payload.sub };
  }
}

module.exports = AuthService;

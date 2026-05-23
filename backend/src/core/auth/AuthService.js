const crypto = require('node:crypto');
const { env } = require('../../config/environment');
const UserRepository = require('../../infrastructure/repositories/UserRepository');
const TokenRepository = require('../../infrastructure/repositories/TokenRepository');
const { createAccessToken, createRefreshToken, hashToken, decodeToken } = require('./TokenService');

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
  constructor(userRepository = new UserRepository(), tokenRepository = new TokenRepository()) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
  }

  async register(email, password) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email già registrata.');
      error.status = 409;
      throw error;
    }

    const user = await this.userRepository.create({
      email,
      passwordHash: hashPassword(password)
    });

    return { id: user.id, email: user.email };
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      const error = new Error('Credenziali non valide.');
      error.status = 401;
      throw error;
    }

    const accessToken = createAccessToken(user.id, env.JWT_SECRET);
    const refreshToken = createRefreshToken(user.id, env.JWT_REFRESH_SECRET);

    await this.tokenRepository.revokeAllUserTokens(user.id);
    await this.tokenRepository.createRefreshToken(user.id, hashToken(refreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

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
      const error = new Error('Refresh token non valido.');
      error.status = 401;
      throw error;
    }

    const accessToken = createAccessToken(payload.sub, env.JWT_SECRET);
    const rotatedRefreshToken = createRefreshToken(payload.sub, env.JWT_REFRESH_SECRET);
    await this.tokenRepository.revokeRefreshToken(tokenRecord.id);
    await this.tokenRepository.createRefreshToken(payload.sub, hashToken(rotatedRefreshToken), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    return { accessToken, refreshToken: rotatedRefreshToken, userId: payload.sub };
  }
}

module.exports = AuthService;

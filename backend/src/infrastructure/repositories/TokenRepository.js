const { state } = require('../../config/database');

class TokenRepository {
  async createRefreshToken(userId, tokenHash, expiresAt) {
    const token = {
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      revoked: false,
      createdAt: new Date().toISOString()
    };

    state.refreshTokens.push(token);
    return token;
  }

  async findRefreshToken(tokenHash) {
    return state.refreshTokens.find((token) => token.tokenHash === tokenHash) || null;
  }

  async revokeRefreshToken(id) {
    const token = state.refreshTokens.find((item) => item.id === id);
    if (token) {
      token.revoked = true;
    }
    return token;
  }

  async revokeAllUserTokens(userId) {
    for (const token of state.refreshTokens) {
      if (token.userId === userId) {
        token.revoked = true;
      }
    }
  }
}

module.exports = TokenRepository;

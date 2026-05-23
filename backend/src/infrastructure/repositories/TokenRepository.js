const { randomUUID } = require('node:crypto');
const { readStore, writeStore } = require('../../config/fileStore');

class TokenRepository {
  async createRefreshToken(userId, tokenHash, expiresAt) {
    const store = readStore();
    const token = {
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      revoked: false,
      createdAt: new Date().toISOString()
    };

    store.refreshTokens.push(token);
    writeStore(store);
    return token;
  }

  async findRefreshToken(tokenHash) {
    const store = readStore();
    return store.refreshTokens.find((token) => token.tokenHash === tokenHash) || null;
  }

  async revokeRefreshToken(id) {
    const store = readStore();
    const token = store.refreshTokens.find((item) => item.id === id);
    if (token) {
      token.revoked = true;
      writeStore(store);
    }
    return token;
  }

  async revokeAllUserTokens(userId) {
    const store = readStore();
    let changed = false;

    for (const token of store.refreshTokens) {
      if (token.userId === userId) {
        token.revoked = true;
        changed = true;
      }
    }

    if (changed) {
      writeStore(store);
    }
  }
}

module.exports = TokenRepository;

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class PrismaTokenRepository {
  async createRefreshToken(userId, tokenHash, expiresAt) {
    return prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt, revoked: false } });
  }

  async findRefreshToken(tokenHash) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeRefreshToken(id) {
    return prisma.refreshToken.update({ where: { id }, data: { revoked: true } });
  }

  async revokeAllUserTokens(userId) {
    return prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
  }
}

module.exports = PrismaTokenRepository;

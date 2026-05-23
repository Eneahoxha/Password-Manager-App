const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class PrismaVaultRepository {
  async findAllByUserId(userId) {
    return prisma.vaultEntry.findMany({ where: { userId } });
  }

  async findByIdAndUserId(id, userId) {
    return prisma.vaultEntry.findFirst({ where: { id, userId } });
  }

  async create(userId, data) {
    return prisma.vaultEntry.create({
      data: {
        userId,
        siteName: data.siteName,
        logoUrl: data.logoUrl || null,
        encryptedPayload: data.encryptedPayload
      }
    });
  }

  async update(id, userId, data) {
    const existing = await prisma.vaultEntry.findFirst({ where: { id, userId } });
    if (!existing) return null;
    return prisma.vaultEntry.update({
      where: { id },
      data: {
        siteName: data.siteName ?? existing.siteName,
        logoUrl: data.logoUrl ?? existing.logoUrl,
        encryptedPayload: data.encryptedPayload ?? existing.encryptedPayload
      }
    });
  }

  async delete(id, userId) {
    const existing = await prisma.vaultEntry.findFirst({ where: { id, userId } });
    if (!existing) return null;
    return prisma.vaultEntry.delete({ where: { id } });
  }
}

module.exports = PrismaVaultRepository;

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class PrismaAuditEventRepository {
  async createEvent(data) {
    return prisma.auditEvent.create({
      data: {
        userId: data.userId || null,
        email: data.email || null,
        eventType: data.eventType,
        outcome: data.outcome,
        metadata: data.metadata || {}
      }
    });
  }

  async listRecent(limit = 50) {
    return prisma.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  }
}

module.exports = PrismaAuditEventRepository;

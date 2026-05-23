const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class PrismaUserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data) {
    return prisma.user.create({ data });
  }
}

module.exports = PrismaUserRepository;

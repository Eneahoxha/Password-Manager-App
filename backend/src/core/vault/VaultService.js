const VaultRepository = require('../../infrastructure/repositories/VaultRepository');

class VaultService {
  constructor(vaultRepository = new VaultRepository()) {
    this.vaultRepository = vaultRepository;
  }

  async list(userId) {
    return this.vaultRepository.findAllByUserId(userId);
  }

  async findOne(id, userId) {
    const entry = await this.vaultRepository.findByIdAndUserId(id, userId);
    if (!entry) {
      const error = new Error('Voce non trovata.');
      error.status = 404;
      throw error;
    }
    return entry;
  }

  async create(userId, data) {
    return this.vaultRepository.create(userId, data);
  }

  async update(id, userId, data) {
    const entry = await this.vaultRepository.update(id, userId, data);
    if (!entry) {
      const error = new Error('Voce non trovata.');
      error.status = 404;
      throw error;
    }
    return entry;
  }

  async remove(id, userId) {
    const deleted = await this.vaultRepository.delete(id, userId);
    if (!deleted) {
      const error = new Error('Voce non trovata.');
      error.status = 404;
      throw error;
    }
    return deleted;
  }
}

module.exports = VaultService;

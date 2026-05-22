const { state } = require('../../config/database');

class VaultRepository {
  async findAllByUserId(userId) {
    return state.vaultEntries.filter((entry) => entry.userId === userId);
  }

  async findByIdAndUserId(id, userId) {
    return state.vaultEntries.find((entry) => entry.id === id && entry.userId === userId) || null;
  }

  async create(userId, data) {
    const entry = {
      id: crypto.randomUUID(),
      userId,
      siteName: data.siteName,
      encryptedPayload: data.encryptedPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.vaultEntries.push(entry);
    return entry;
  }

  async update(id, userId, data) {
    const entry = await this.findByIdAndUserId(id, userId);
    if (!entry) {
      return null;
    }

    entry.siteName = data.siteName ?? entry.siteName;
    entry.encryptedPayload = data.encryptedPayload ?? entry.encryptedPayload;
    entry.updatedAt = new Date().toISOString();
    return entry;
  }

  async delete(id, userId) {
    const index = state.vaultEntries.findIndex((entry) => entry.id === id && entry.userId === userId);
    if (index === -1) {
      return null;
    }

    const [removed] = state.vaultEntries.splice(index, 1);
    return removed;
  }
}

module.exports = VaultRepository;

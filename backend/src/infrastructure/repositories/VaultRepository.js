const { randomUUID } = require('node:crypto');
const { readStore, writeStore } = require('../../config/fileStore');

class VaultRepository {
  async findAllByUserId(userId) {
    const store = readStore();
    return store.vaultEntries.filter((entry) => entry.userId === userId);
  }

  async findByIdAndUserId(id, userId) {
    const store = readStore();
    return store.vaultEntries.find((entry) => entry.id === id && entry.userId === userId) || null;
  }

  async create(userId, data) {
    const store = readStore();
    const entry = {
      id: randomUUID(),
      userId,
      siteName: data.siteName,
      encryptedPayload: data.encryptedPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.vaultEntries.push(entry);
    writeStore(store);
    return entry;
  }

  async update(id, userId, data) {
    const store = readStore();
    const index = store.vaultEntries.findIndex((existingEntry) => existingEntry.id === id && existingEntry.userId === userId);
    if (index === -1) {
      return null;
    }

    const entry = store.vaultEntries[index];

    const updatedEntry = {
      ...entry,
      siteName: data.siteName ?? entry.siteName,
      encryptedPayload: data.encryptedPayload ?? entry.encryptedPayload,
      updatedAt: new Date().toISOString()
    };

    store.vaultEntries[index] = updatedEntry;
    writeStore(store);
    return updatedEntry;
  }

  async delete(id, userId) {
    const store = readStore();
    const index = store.vaultEntries.findIndex((entry) => entry.id === id && entry.userId === userId);
    if (index === -1) {
      return null;
    }

    const [removed] = store.vaultEntries.splice(index, 1);
    writeStore(store);
    return removed;
  }
}

module.exports = VaultRepository;

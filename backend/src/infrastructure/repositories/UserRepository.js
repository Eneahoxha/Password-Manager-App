const { randomUUID } = require('node:crypto');
const { readStore, writeStore } = require('../../config/fileStore');

class UserRepository {
  async findByEmail(email) {
    const store = readStore();
    return store.users.find((user) => user.email === email) || null;
  }

  async findById(id) {
    const store = readStore();
    return store.users.find((user) => user.id === id) || null;
  }

  async create(data) {
    const store = readStore();
    const user = {
      id: randomUUID(),
      email: data.email,
      passwordHash: data.passwordHash,
      emailVerified: data.emailVerified || false,
      recoveryCodeHash: data.recoveryCodeHash || null,
      recoveryCodeCreatedAt: data.recoveryCodeCreatedAt || null,
      emailVerificationTokenHash: data.emailVerificationTokenHash || null,
      emailVerificationSentAt: data.emailVerificationSentAt || null,
      forgotOtpHash: data.forgotOtpHash || null,
      forgotOtpCreatedAt: data.forgotOtpCreatedAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.users.push(user);
    writeStore(store);
    return user;
  }

  async update(id, changes) {
    const store = readStore();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const user = store.users[idx];
    const updated = { ...user, ...changes, updatedAt: new Date().toISOString() };
    store.users[idx] = updated;
    writeStore(store);
    return updated;
  }
}

module.exports = UserRepository;

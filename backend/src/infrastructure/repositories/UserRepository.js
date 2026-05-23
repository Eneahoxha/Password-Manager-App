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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.users.push(user);
    writeStore(store);
    return user;
  }
}

module.exports = UserRepository;

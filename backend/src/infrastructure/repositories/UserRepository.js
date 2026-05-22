const { state } = require('../../config/database');

class UserRepository {
  async findByEmail(email) {
    return state.users.find((user) => user.email === email) || null;
  }

  async findById(id) {
    return state.users.find((user) => user.id === id) || null;
  }

  async create(data) {
    const user = {
      id: crypto.randomUUID(),
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.users.push(user);
    return user;
  }
}

module.exports = UserRepository;

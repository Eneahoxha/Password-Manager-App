const { randomUUID } = require('node:crypto');
const { readStore, writeStore } = require('../../config/fileStore');

class AuditEventRepository {
  async createEvent(data) {
    const store = readStore();
    const event = {
      id: randomUUID(),
      userId: data.userId || null,
      email: data.email || null,
      eventType: data.eventType,
      outcome: data.outcome,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString()
    };

    store.auditEvents = store.auditEvents || [];
    store.auditEvents.push(event);
    writeStore(store);
    return event;
  }

  async listRecent(limit = 50) {
    const store = readStore();
    return (store.auditEvents || []).slice(-limit).reverse();
  }
}

module.exports = AuditEventRepository;

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDataFile = path.join(os.tmpdir(), `securevault-vault-${Date.now()}.json`);

process.env.SECUREVAULT_DATA_FILE = tempDataFile;

const VaultRepository = require('../../src/infrastructure/repositories/VaultRepository');

test('persists vault entries and isolates users', async () => {
  const repository = new VaultRepository();

  const firstEntry = await repository.create('user-1', {
    siteName: 'GitHub',
    encryptedPayload: 'payload-1'
  });

  await repository.create('user-2', {
    siteName: 'Google',
    encryptedPayload: 'payload-2'
  });

  const userOneEntries = await repository.findAllByUserId('user-1');
  const userTwoEntries = await repository.findAllByUserId('user-2');

  assert.equal(userOneEntries.length, 1);
  assert.equal(userTwoEntries.length, 1);

  const updated = await repository.update(firstEntry.id, 'user-1', {
    siteName: 'GitHub Updated',
    encryptedPayload: 'payload-updated'
  });

  assert.equal(updated.siteName, 'GitHub Updated');

  const deleted = await repository.delete(firstEntry.id, 'user-1');
  assert.equal(deleted.siteName, 'GitHub Updated');

  const store = JSON.parse(fs.readFileSync(tempDataFile, 'utf8'));
  assert.equal(store.vaultEntries.length, 1);
});

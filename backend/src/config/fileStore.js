const fs = require('node:fs');
const path = require('node:path');

function getFilePath() {
  return process.env.SECUREVAULT_DATA_FILE || path.join(__dirname, '..', '..', 'data', 'securevault.json');
}

function ensureStore() {
  const filePath = getFilePath();
  const directoryPath = path.dirname(filePath);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ users: [], vaultEntries: [], refreshTokens: [], auditEvents: [] }, null, 2));
  }

  return filePath;
}

function readStore() {
  const filePath = ensureStore();
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeStore(store) {
  const filePath = ensureStore();
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

module.exports = {
  getFilePath,
  ensureStore,
  readStore,
  writeStore
};

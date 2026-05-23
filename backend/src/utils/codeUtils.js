const crypto = require('node:crypto');

function generateCode(length = 12) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function hashCode(code) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(code, salt, 64);
  return `${salt.toString('hex')}.${derived.toString('hex')}`;
}

function verifyCode(code, stored) {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split('.');
  const salt = Buffer.from(saltHex, 'hex');
  const derived = crypto.scryptSync(code, salt, 64);
  try {
    return crypto.timingSafeEqual(Buffer.from(hashHex, 'hex'), derived);
  } catch (e) {
    return false;
  }
}

module.exports = { generateCode, hashCode, verifyCode };

const crypto = require('node:crypto');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function encodeToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function decodeToken(token, secret) {
  const [body, signature] = token.split('.');
  if (!body || !signature) {
    throw new Error('Token malformato');
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (signature !== expectedSignature) {
    throw new Error('Firma non valida');
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp && Date.now() > payload.exp) {
    throw new Error('Token scaduto');
  }

  return payload;
}

function createAccessToken(userId, secret) {
  return encodeToken({ sub: userId, typ: 'access', exp: Date.now() + 15 * 60 * 1000 }, secret);
}

function createRefreshToken(userId, secret) {
  return encodeToken({ sub: userId, typ: 'refresh', exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }, secret);
}

module.exports = {
  hashToken,
  decodeToken,
  createAccessToken,
  createRefreshToken
};

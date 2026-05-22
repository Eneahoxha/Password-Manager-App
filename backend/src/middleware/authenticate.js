const { env } = require('../config/environment');
const { decodeToken } = require('../core/auth/TokenService');

function authenticate(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Token assente.' });
  }

  try {
    const payload = decodeToken(token, env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token non valido o scaduto.' });
  }
}

module.exports = authenticate;

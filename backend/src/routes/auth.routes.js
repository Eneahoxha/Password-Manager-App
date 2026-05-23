const express = require('express');
const AuthService = require('../core/auth/AuthService');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/auth.schema');
const authenticate = require('../middleware/authenticate');
const { env } = require('../config/environment');
const { hashToken } = require('../core/auth/TokenService');

const router = express.Router();

let authService;
if (process.env.DATABASE_URL) {
  const PrismaUserRepository = require('../infrastructure/repositories/PrismaUserRepository');
  const PrismaTokenRepository = require('../infrastructure/repositories/PrismaTokenRepository');
  authService = new AuthService(new PrismaUserRepository(), new PrismaTokenRepository());
} else {
  authService = new AuthService();
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const user = await authService.register(req.body.email, req.body.password);
    res.status(201).json({ message: 'Account creato con successo.', user });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ user: result.user });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticate, async (req, res) => {
  if (req.cookies.refreshToken) {
    const tokenRecord = await authService.tokenRepository.findRefreshToken(hashToken(req.cookies.refreshToken));
    if (tokenRecord) {
      await authService.tokenRepository.revokeRefreshToken(tokenRecord.id);
    }
  }

  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(200).json({ message: 'Logout effettuato.' });
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token assente.' });
    }

    const result = await authService.refresh(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ message: 'Sessione rinnovata.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.userRepository.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }

    res.status(200).json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

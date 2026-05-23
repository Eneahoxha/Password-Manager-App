const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthService = require('../core/auth/AuthService');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, emailOnlySchema, verifyEmailSchema, resetWithRecoverySchema } = require('../schemas/auth.schema');
const authenticate = require('../middleware/authenticate');
const { env } = require('../config/environment');
const { hashToken } = require('../core/auth/TokenService');

const router = express.Router();

const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const recoveryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

let authService;
if (process.env.DATABASE_URL) {
  const PrismaUserRepository = require('../infrastructure/repositories/PrismaUserRepository');
  const PrismaTokenRepository = require('../infrastructure/repositories/PrismaTokenRepository');
  const PrismaAuditEventRepository = require('../infrastructure/repositories/PrismaAuditEventRepository');
  authService = new AuthService(new PrismaUserRepository(), new PrismaTokenRepository(), new PrismaAuditEventRepository());
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

router.post('/register', registerLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body.email, req.body.password);
    // result contains recoveryCode that should be downloaded by the client as PDF
    res.status(201).json({ message: 'Account creato con successo.', user: { id: result.id, email: result.email }, recoveryCode: result.recoveryCode });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-email', recoveryLimiter, validate(verifyEmailSchema), async (req, res, next) => {
  try {
    const { email, token } = req.body;
    await authService.verifyEmail(email, token);
    res.status(200).json({ message: 'Email verificata.' });
  } catch (error) {
    next(error);
  }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const { email, token } = req.query;
    if (!email || !token) {
      return res.redirect(`${env.FRONTEND_URL.replace(/\/$/, '')}/login?verified=error`);
    }

    await authService.verifyEmail(String(email), String(token));
    return res.redirect(`${env.FRONTEND_URL.replace(/\/$/, '')}/login?verified=1`);
  } catch (error) {
    return res.redirect(`${env.FRONTEND_URL.replace(/\/$/, '')}/login?verified=error`);
  }
});

router.post('/resend-verification', recoveryLimiter, validate(emailOnlySchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.resendVerificationEmail(email);
    res.status(200).json({ message: 'Email di verifica reinviata.' });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot', recoveryLimiter, validate(emailOnlySchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendForgotOtp(email);
    res.status(200).json({ message: 'OTP inviato via email.' });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-with-recovery', recoveryLimiter, validate(resetWithRecoverySchema), async (req, res, next) => {
  try {
    const { email, otp, recoveryCode, newPassword } = req.body;
    await authService.resetWithRecovery({ email, otp, recoveryCode, newPassword });
    res.status(200).json({ message: 'Password aggiornata.' });
  } catch (error) {
    next(error);
  }
});

router.get('/recovery-pdf', async (req, res, next) => {
  try {
    const { email, code } = req.query;
    if (!email || !code) return res.status(400).json({ error: 'Missing parameters.' });
    const { createRecoveryPdfStream } = require('../services/pdfService');
    const stream = createRecoveryPdfStream({ email, recoveryCode: code });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recovery-${email}.pdf"`);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
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

  await authService.recordAudit('auth.logout', 'success', { userId: req.userId });

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

const nodemailer = require('nodemailer');
const { env } = require('../config/environment');

const emailEnabled = env.NODE_ENV !== 'test' && Boolean(env.SMTP_HOST);
const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE === 'true',
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
    })
  : null;

async function sendMail(message) {
  if (!transporter) {
    return { skipped: true };
  }

  return transporter.sendMail(message);
}

async function sendVerificationEmail(to, token) {
  const html = `
    <h2>Verifica email SecureVault</h2>
    <p>Usa questo codice per verificare la tua email:</p>
    <p style="font-size:20px;font-weight:700;letter-spacing:2px;">${token}</p>
    <p>Il codice di verifica scade tra 24 ore.</p>
  `;
  await sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'SecureVault - verifica la tua email',
    text: `Codice verifica: ${token}. Scade tra 24 ore.`,
    html
  });
}

async function sendOtpEmail(to, otp) {
  const html = `
    <h2>Recupero master password SecureVault</h2>
    <p>Usa questo OTP per confermare la richiesta di recupero:</p>
    <p style="font-size:20px;font-weight:700;letter-spacing:2px;">${otp}</p>
    <p>Questo OTP scade tra 5 minuti.</p>
  `;
  await sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'SecureVault - OTP recupero master password',
    text: `OTP recupero master password: ${otp}. Scade tra 5 minuti.`,
    html
  });
}

module.exports = { sendVerificationEmail, sendOtpEmail };

const nodemailer = require('nodemailer');
const { env } = require('../config/environment');

let transporterPromise = null;

async function getTransporter() {
  if (env.NODE_ENV === 'test') {
    return null;
  }

  if (env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE === 'true',
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
    });
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('SMTP non configurato. Imposta SMTP_HOST/SMTP_USER/SMTP_PASS.');
  }

  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then((account) => nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    }));
  }

  return transporterPromise;
}

async function sendMail(message) {
  const transporter = await getTransporter();
  if (!transporter) {
    return { skipped: true };
  }

  const info = await transporter.sendMail(message);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`SMTP preview: ${previewUrl}`);
  }

  return info;
}

async function sendVerificationEmail(to, token) {
  const verificationUrl = `${env.BACKEND_PUBLIC_URL.replace(/\/$/, '')}/api/auth/verify-email?email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;
  const html = `
    <h2>Verifica email SecureVault</h2>
    <p>Clicca il pulsante sotto per verificare immediatamente la tua email:</p>
    <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#2f66ff;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;">Verifica email</a></p>
    <p>Se il pulsante non funziona, copia questo link nel browser:</p>
    <p>${verificationUrl}</p>
    <p>Il link di verifica scade tra 24 ore.</p>
  `;
  await sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'SecureVault - verifica la tua email',
    text: `Verifica la tua email con questo link: ${verificationUrl}. Scade tra 24 ore.`,
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

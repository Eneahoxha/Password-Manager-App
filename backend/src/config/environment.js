require('dotenv').config();

const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL'];

for (const variable of required) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  FRONTEND_URL: process.env.FRONTEND_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS || 12)
};

// optional SMTP/email settings
env.SMTP_HOST = process.env.SMTP_HOST || '';
env.SMTP_PORT = process.env.SMTP_PORT || '';
env.SMTP_USER = process.env.SMTP_USER || '';
env.SMTP_PASS = process.env.SMTP_PASS || '';
env.SMTP_SECURE = process.env.SMTP_SECURE || 'false';
env.EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@securevault.local';
env.BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3002';

module.exports = { env };

const { z } = require('zod');

const passwordSchema = z.string().min(12).regex(/[A-Z]/, 'Serve almeno una maiuscola.').regex(/\d/, 'Serve almeno un numero.').regex(/[^A-Za-z0-9]/, 'Serve almeno un simbolo.');

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const emailOnlySchema = z.object({
  email: z.string().email()
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6)
});

const resetWithRecoverySchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6).max(6),
  recoveryCode: z.string().min(6),
  newPassword: passwordSchema
});

module.exports = { registerSchema, loginSchema, emailOnlySchema, verifyEmailSchema, resetWithRecoverySchema };

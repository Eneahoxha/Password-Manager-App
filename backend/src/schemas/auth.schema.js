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

module.exports = { registerSchema, loginSchema };

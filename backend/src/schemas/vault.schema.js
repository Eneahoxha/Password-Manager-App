const { z } = require('zod');

const vaultSchema = z.object({
  siteName: z.string().min(1).max(100),
  logoUrl: z.string().url().max(2048).optional(),
  encryptedPayload: z.string().min(12)
});

module.exports = { vaultSchema };

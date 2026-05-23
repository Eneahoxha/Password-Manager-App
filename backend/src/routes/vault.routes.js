const express = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { vaultSchema } = require('../schemas/vault.schema');
const VaultService = require('../core/vault/VaultService');

const router = express.Router();

let vaultService;
if (process.env.DATABASE_URL) {
  const PrismaVaultRepository = require('../infrastructure/repositories/PrismaVaultRepository');
  vaultService = new VaultService(new PrismaVaultRepository());
} else {
  vaultService = new VaultService();
}

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const entries = await vaultService.list(req.userId);
    res.json({ entries: entries.map(({ id, siteName, logoUrl, createdAt, updatedAt }) => ({ id, siteName, logoUrl, createdAt, updatedAt })) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const entry = await vaultService.findOne(req.params.id, req.userId);
    res.json({ entry });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(vaultSchema), async (req, res, next) => {
  try {
    const entry = await vaultService.create(req.userId, req.body);
    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validate(vaultSchema), async (req, res, next) => {
  try {
    const entry = await vaultService.update(req.params.id, req.userId, req.body);
    res.json({ entry });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await vaultService.remove(req.params.id, req.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

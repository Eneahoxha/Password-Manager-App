import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePassword } from '../src/utils/passwordGenerator.js';

test('generates password with the requested length and categories', () => {
  const password = generatePassword({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });

  assert.equal(password.length, 20);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /\d/);
  assert.match(password, /[^A-Za-z0-9]/);
});

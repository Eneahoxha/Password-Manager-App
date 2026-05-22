const characterSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?'
};

function pickRandom(characters) {
  const randomValues = crypto.getRandomValues(new Uint32Array(1));
  return characters[randomValues[0] % characters.length];
}

export function generatePassword({
  length = 16,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true
} = {}) {
  const selectedSets = [];

  if (uppercase) selectedSets.push(characterSets.uppercase);
  if (lowercase) selectedSets.push(characterSets.lowercase);
  if (numbers) selectedSets.push(characterSets.numbers);
  if (symbols) selectedSets.push(characterSets.symbols);

  if (selectedSets.length === 0) {
    throw new Error('Seleziona almeno una categoria di caratteri.');
  }

  const allCharacters = selectedSets.join('');
  const output = selectedSets.map((set) => pickRandom(set));

  while (output.length < length) {
    output.push(pickRandom(allCharacters));
  }

  return output
    .sort(() => crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff - 0.5)
    .join('')
    .slice(0, length);
}

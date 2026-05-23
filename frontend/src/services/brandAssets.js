function normalizeHost(input) {
  if (!input) {
    return '';
  }

  try {
    const candidate = input.startsWith('http://') || input.startsWith('https://') ? input : `https://${input}`;
    return new URL(candidate).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./i, '');
  }
}

export function getBrandLogoCandidates({ url, siteName } = {}) {
  const host = normalizeHost(url) || normalizeHost(siteName);
  if (!host) {
    return [];
  }

  return [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
    `https://logo.clearbit.com/${host}`,
    `https://${host}/favicon.ico`
  ];
}

export function getBrandLogoUrl({ url, siteName } = {}) {
  return getBrandLogoCandidates({ url, siteName })[0] || '';
}

export function getBrandInitials({ url, siteName } = {}) {
  const source = (siteName || normalizeHost(url) || '').trim();
  if (!source) {
    return '?';
  }

  const tokens = source
    .replace(/[^a-zA-Z0-9\s.-]/g, ' ')
    .split(/[\s.-]+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return source.slice(0, 2).toUpperCase();
  }

  return tokens.slice(0, 2).map((token) => token[0]).join('').toUpperCase();
}

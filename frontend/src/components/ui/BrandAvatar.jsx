import { useEffect, useState } from 'react';
import { getBrandInitials, getBrandLogoCandidates } from '../../services/brandAssets';

export default function BrandAvatar({ siteName, url, logoUrl, size = 48, className = '' }) {
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [logoUrl, siteName, url]);

  const candidates = logoUrl ? [logoUrl] : getBrandLogoCandidates({ siteName, url });
  const activeLogo = candidates[candidateIndex] || '';
  const showImage = Boolean(activeLogo);
  const initials = getBrandInitials({ siteName, url });

  function handleImageError() {
    setCandidateIndex((current) => {
      const next = current + 1;
      return next < candidates.length ? next : current;
    });
  }

  return (
    <div
      className={`brand-avatar ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {showImage ? (
        <img src={activeLogo} alt="" onError={handleImageError} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

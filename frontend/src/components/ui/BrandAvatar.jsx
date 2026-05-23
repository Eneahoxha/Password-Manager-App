import { useEffect, useState } from 'react';
import { getBrandInitials } from '../../services/brandAssets';

export default function BrandAvatar({ siteName, url, logoUrl, size = 48, className = '' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl, siteName, url]);

  const showImage = Boolean(logoUrl) && !failed;
  const initials = getBrandInitials({ siteName, url });

  return (
    <div
      className={`brand-avatar ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {showImage ? (
        <img src={logoUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

import { useState } from 'react';

export default function Tooltip({ label, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="tooltip-wrap" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible ? <span className="tooltip-bubble">{label}</span> : null}
    </span>
  );
}

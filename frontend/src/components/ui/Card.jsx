export function Card({ children, className = '' }) {
  return <div className={`glass-card ${className}`.trim()}>{children}</div>;
}

export function CardHeader({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={className}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={className}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

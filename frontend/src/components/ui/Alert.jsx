export default function Alert({ children, variant = 'default' }) {
  const typeClass = variant === 'destructive' ? 'error' : 'success';
  return <div className={`alert ${typeClass}`.trim()}>{children}</div>;
}

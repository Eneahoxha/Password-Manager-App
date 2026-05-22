export default function Badge({ children, muted = false }) {
  return <span className={`badge ${muted ? 'muted' : ''}`.trim()}>{children}</span>;
}

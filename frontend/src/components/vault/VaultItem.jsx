import { Copy, Pencil, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function VaultItem({ entry, onView, onEdit, onDelete }) {
  return (
    <div className="vault-item">
      <div className="mock-icon">{entry.siteName.slice(0, 1).toUpperCase()}</div>
      <div className="vault-meta">
        <strong>{entry.siteName}</strong>
        <span>Voce nel vault · {new Date(entry.updatedAt).toLocaleDateString('it-IT')}</span>
      </div>
      <div className="vault-actions">
        <Badge muted>cifrato</Badge>
        <Button variant="ghost" onClick={() => onView(entry)}><Copy size={16} /></Button>
        <Button variant="ghost" onClick={() => onEdit(entry)}><Pencil size={16} /></Button>
        <Button variant="ghost" onClick={() => onDelete(entry)}><Trash2 size={16} /></Button>
      </div>
    </div>
  );
}

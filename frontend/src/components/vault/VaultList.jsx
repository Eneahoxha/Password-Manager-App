import VaultItem from './VaultItem';

export default function VaultList({ entries, onView, onEdit, onDelete }) {
  return (
    <div className="vault-list">
      {entries.map((entry) => (
        <VaultItem key={entry.id} entry={entry} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

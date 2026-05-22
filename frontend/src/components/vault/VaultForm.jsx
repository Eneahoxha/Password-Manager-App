import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import PasswordGenerator from './PasswordGenerator';

export default function VaultForm({ initialValue, onSubmit, onCancel }) {
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setSiteName(initialValue?.siteName || '');
    setUsername(initialValue?.username || '');
    setUrl(initialValue?.url || '');
    setPassword(initialValue?.password || '');
    setNotes(initialValue?.notes || '');
  }, [initialValue]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ siteName, username, url, password, notes });
  }

  return (
    <form className="drawer-form" onSubmit={handleSubmit}>
      <div className="field"><Label>Nome sito</Label><Input value={siteName} onChange={(event) => setSiteName(event.target.value)} required /></div>
      <div className="field"><Label>Username</Label><Input value={username} onChange={(event) => setUsername(event.target.value)} /></div>
      <div className="field"><Label>URL</Label><Input value={url} onChange={(event) => setUrl(event.target.value)} /></div>
      <div className="field"><Label>Password</Label><Input value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
      <div className="field"><Label>Note</Label><Input value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
      <PasswordGenerator onGenerate={setPassword} />
      <div className="dialog-footer">
        <Button variant="secondary" type="button" onClick={onCancel}>Annulla</Button>
        <Button variant="primary" type="submit">Salva voce</Button>
      </div>
    </form>
  );
}

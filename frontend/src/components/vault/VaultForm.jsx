import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import PasswordGenerator from './PasswordGenerator';
import BrandAvatar from '../ui/BrandAvatar';
import { getBrandLogoUrl } from '../../services/brandAssets';

export default function VaultForm({ initialValue, onSubmit, onCancel }) {
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');

  const logoUrl = useMemo(() => getBrandLogoUrl({ url, siteName }), [siteName, url]);

  useEffect(() => {
    setSiteName(initialValue?.siteName || '');
    setUsername(initialValue?.username || '');
    setUrl(initialValue?.url || '');
    setPassword(initialValue?.password || '');
    setNotes(initialValue?.notes || '');
  }, [initialValue]);

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ siteName, username, url, password, notes, logoUrl });
  }

  return (
    <form className="drawer-form" onSubmit={handleSubmit}>
      <div className="field"><Label>Nome sito</Label><Input value={siteName} onChange={(event) => setSiteName(event.target.value)} required /></div>
      <div className="field"><Label>Username</Label><Input value={username} onChange={(event) => setUsername(event.target.value)} /></div>
      <div className="field"><Label>URL</Label><Input value={url} onChange={(event) => setUrl(event.target.value)} /></div>
      <div className="mini-panel logo-preview-panel">
        <div className="status-row" style={{ justifyContent: 'space-between' }}>
          <span className="hint">Logo rilevato</span>
          <span className="hint">Automatico</span>
        </div>
        <div className="logo-preview-row">
          <BrandAvatar siteName={siteName} url={url} logoUrl={logoUrl} size={56} />
          <div>
            <strong>{siteName || 'Anteprima logo'}</strong>
            <p className="mock-subtitle" style={{ margin: '4px 0 0' }}>{url || 'Inserisci un link per rilevare il logo'}</p>
          </div>
        </div>
      </div>
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

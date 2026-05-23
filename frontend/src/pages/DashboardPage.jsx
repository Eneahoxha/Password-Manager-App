import { useEffect, useMemo, useState } from 'react';
import { Copy, Eye, EyeOff, LogOut, Plus, Search, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Dialog from '../components/ui/Dialog';
import Sheet from '../components/ui/Sheet';
import Skeleton from '../components/ui/Skeleton';
import Tooltip from '../components/ui/Tooltip';
import VaultList from '../components/vault/VaultList';
import VaultForm from '../components/vault/VaultForm';
import Alert from '../components/ui/Alert';
import api from '../services/api';
import { decryptPayload, encryptPayload } from '../services/cryptoService';

export default function DashboardPage() {
  const { user, masterPassword, setMasterPassword, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsEntry, setDetailsEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVaultLoading, setIsVaultLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadEntries() {
      setIsVaultLoading(true);
      setLoadError('');

      try {
        const response = await api.get('/vault');
        if (alive) {
          setEntries(response.data.entries || []);
        }
      } catch (error) {
        if (alive) {
          setLoadError(error?.response?.data?.error || 'Impossibile caricare il vault.');
        }
      } finally {
        if (alive) {
          setIsVaultLoading(false);
        }
      }
    }

    loadEntries();

    return () => {
      alive = false;
    };
  }, []);

  const filteredEntries = useMemo(() => entries.filter((entry) => entry.siteName.toLowerCase().includes(query.toLowerCase())), [entries, query]);
  const vaultLocked = !masterPassword;

  function openCreate() {
    setEditingEntry(null);
    setDrawerOpen(true);
  }

  async function handleSave(payload) {
    if (!masterPassword) {
      setUnlockError('Sblocca il vault con la master password prima di salvare una voce.');
      return;
    }

    const encryptedPayload = await encryptPayload(
      {
        username: payload.username,
        url: payload.url,
        password: payload.password,
        notes: payload.notes
      },
      masterPassword
    );

    if (editingEntry) {
      const response = await api.put(`/vault/${editingEntry.id}`, {
        siteName: payload.siteName,
        encryptedPayload
      });
      setEntries((currentEntries) => currentEntries.map((entry) => entry.id === editingEntry.id ? response.data.entry : entry));
    } else {
      const response = await api.post('/vault', {
        siteName: payload.siteName,
        encryptedPayload
      });
      setEntries((currentEntries) => [response.data.entry, ...currentEntries]);
    }
    setDrawerOpen(false);
    setEditingEntry(null);
  }

  async function handleDelete() {
    await api.delete(`/vault/${deleteEntry.id}`);
    setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== deleteEntry.id));
    setDeleteEntry(null);
  }

  async function copyPassword() {
    if (!detailsEntry) return;
    await navigator.clipboard.writeText(detailsEntry.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleView(entry) {
    if (!masterPassword) {
      setUnlockError('Inserisci prima la master password per visualizzare i dettagli cifrati.');
      return;
    }

    const response = await api.get(`/vault/${entry.id}`);
    const decrypted = await decryptPayload(response.data.entry.encryptedPayload, masterPassword);
    setDetailsEntry({ ...response.data.entry, ...decrypted });
  }

  function handleUnlock(event) {
    event.preventDefault();

    if (!unlockPassword) {
      setUnlockError('Inserisci la master password.');
      return;
    }

    setMasterPassword(unlockPassword);
    setUnlockPassword('');
    setUnlockError('');
  }

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <div className="status-row">
              <Badge><Settings size={14} /> SecureVault</Badge>
              <Badge muted>{user?.email || 'utente'}</Badge>
            </div>
            <h2>Your Password Vault</h2>
            <p>Gestione credenziali con ricerca veloce, dettagli protetti e generatori integrati.</p>
            <div className="status-row">
              <Badge>Persistenza attiva</Badge>
              <Badge muted>{vaultLocked ? 'Vault bloccato' : 'Vault sbloccato'}</Badge>
            </div>
          </div>
          <div className="status-row">
            <Button variant="secondary" onClick={logout}><LogOut size={16} /> Logout</Button>
          </div>
        </div>

        {vaultLocked ? (
          <div className="mini-panel" style={{ marginBottom: 18 }}>
            <div className="status-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>Sblocca vault</strong>
              <Badge muted>sessione attiva</Badge>
            </div>
            <p className="hint" style={{ marginBottom: 14 }}>
              La sessione è ancora valida, ma per decifrare, creare o modificare voci serve la master password locale.
            </p>
            <form className="password-row" onSubmit={handleUnlock}>
              <Input
                type="password"
                value={unlockPassword}
                onChange={(event) => setUnlockPassword(event.target.value)}
                placeholder="Inserisci master password"
                style={{ flex: 1, minWidth: 220 }}
              />
              <Button type="submit" variant="primary">Sblocca</Button>
            </form>
            {unlockError ? <div style={{ marginTop: 12 }}><Alert variant="destructive">{unlockError}</Alert></div> : null}
          </div>
        ) : null}

        <div className="toolbar">
          <div className="field">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca un sito, un account o una nota" />
          </div>
          <Button variant="primary" onClick={openCreate} disabled={vaultLocked}><Plus size={16} /> Aggiungi</Button>
        </div>

        <div className="content-grid">
          <div className="panel">
            {isVaultLoading ? (
              <>
                <Skeleton className="card" />
                <Skeleton className="card" />
                <Skeleton className="card" />
              </>
            ) : loadError ? (
              <div className="mini-panel">
                <Alert variant="destructive">{loadError}</Alert>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="mini-panel">
                <div className="status-row"><Search size={16} /> Nessun risultato per la ricerca corrente.</div>
              </div>
            ) : (
              <VaultList
                entries={filteredEntries}
                onView={handleView}
                onEdit={(entry) => {
                  if (vaultLocked) {
                    setUnlockError('Sblocca il vault prima di modificare una voce.');
                    return;
                  }
                  setEditingEntry(entry);
                  setDrawerOpen(true);
                }}
                onDelete={(entry) => {
                  if (vaultLocked) {
                    setUnlockError('Sblocca il vault prima di eliminare una voce.');
                    return;
                  }
                  setDeleteEntry(entry);
                }}
              />
            )}
          </div>

          <div className="panel">
            <div className="mini-panel">
              <div className="status-row" style={{ justifyContent: 'space-between' }}>
                <strong>Vault summary</strong>
                <Badge muted>live</Badge>
              </div>
              <div style={{ height: 12 }} />
              <div className="stat-grid">
                <div className="stat"><strong>{entries.length}</strong><span className="mock-subtitle">Totale</span></div>
                <div className="stat"><strong>{entries.filter((entry) => entry.notes).length}</strong><span className="mock-subtitle">Con note</span></div>
                <div className="stat"><strong>{entries.length > 0 ? Math.ceil(entries.length / 2) : 0}</strong><span className="mock-subtitle">Forti</span></div>
              </div>
            </div>
            <div className="mini-panel">
              <strong>Stato sessione</strong>
              <div style={{ height: 12 }} />
              <Skeleton className="line" />
              <div style={{ height: 10 }} />
              <Skeleton className="line" style={{ width: '82%' }} />
              <div style={{ height: 10 }} />
              <Skeleton className="line" style={{ width: '66%' }} />
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={drawerOpen}
        title={editingEntry ? 'Modifica voce' : 'Nuova voce'}
        description="Inserisci i dati della credenziale e genera una password sicura se necessario."
        onClose={() => setDrawerOpen(false)}
      >
        <VaultForm
          initialValue={editingEntry}
          onSubmit={handleSave}
          onCancel={() => setDrawerOpen(false)}
        />
      </Sheet>

      <Dialog
        open={Boolean(detailsEntry)}
        title={detailsEntry?.siteName || ''}
        description="Dettagli della voce selezionata. La password resta mascherata di default."
        onClose={() => {
          setDetailsEntry(null);
          setDetailVisible(false);
        }}
        footer={<Button variant="secondary" onClick={() => setDetailsEntry(null)}>Chiudi</Button>}
      >
        {detailsEntry ? (
          <div className="detail-grid">
            <div className="detail-field"><span className="mock-subtitle">Username</span><strong>{detailsEntry.username || 'Nessuno'}</strong></div>
            <div className="detail-field"><span className="mock-subtitle">URL</span><strong>{detailsEntry.url || 'Non specificato'}</strong></div>
            <div className="detail-field"><span className="mock-subtitle">Password</span><div className="password-display">{detailVisible ? detailsEntry.password : '••••••••••••••••'}</div></div>
            <div className="status-row">
              <Button variant="secondary" onClick={() => setDetailVisible((current) => !current)}>{detailVisible ? <EyeOff size={16} /> : <Eye size={16} />} {detailVisible ? 'Nascondi' : 'Mostra'}</Button>
              <Tooltip label={copied ? 'Copiato!' : 'Copia password'}>
                <Button variant="secondary" onClick={copyPassword}><Copy size={16} /> Copia</Button>
              </Tooltip>
            </div>
            <div className="detail-field"><span className="mock-subtitle">Note</span><strong>{detailsEntry.notes || 'Nessuna nota'}</strong></div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(deleteEntry)}
        title="Eliminare la voce?"
        description="L'eliminazione è permanente in questa versione iniziale del progetto."
        onClose={() => setDeleteEntry(null)}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDeleteEntry(null)}>Annulla</Button>
            <Button variant="danger" onClick={handleDelete}><Trash2 size={16} /> Elimina</Button>
          </>
        )}
      >
        <p className="hint">Stai per rimuovere {deleteEntry?.siteName}. Conferma solo se non ti serve più.</p>
      </Dialog>
    </div>
  );
}

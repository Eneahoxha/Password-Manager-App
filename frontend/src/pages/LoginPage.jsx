import { useState } from 'react';
import { LockKeyhole, LogIn, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, notice, setNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vaultPassword, setVaultPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password, vaultPassword || password);
      setNotice('Benvenuto nel tuo vault.');
      navigate('/dashboard');
    } catch (loginError) {
      setError(loginError?.response?.data?.error || 'Impossibile accedere. Verifica le credenziali.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="auth-frame">
        <div className="hero-card">
          <div className="hero-copy">
            <div className="status-row"><span className="badge"><Sparkles size={14} /> SecureVault</span><span className="badge muted">Password manager</span></div>
            <h1>Un vault sicuro, chiaro e veloce da usare.</h1>
            <p>Architettura pronta per cifratura lato client, cookie HttpOnly e una UI costruita per gestire credenziali, note e generatori con un flusso semplice e leggibile.</p>
          </div>
          <div className="mockup-stage">
            <div className="mock-phone tilt-left">
              <div className="mock-topline"><span>Profile</span><span>22</span></div>
              <div className="mock-grid" style={{ marginTop: 18 }}>
                <div className="mock-chip-row">
                  <div className="mock-chip"><strong>22</strong><span className="mock-subtitle">Compromised</span></div>
                  <div className="mock-chip"><strong>34</strong><span className="mock-subtitle">Weak</span></div>
                  <div className="mock-chip"><strong>60</strong><span className="mock-subtitle">Safe</span></div>
                </div>
                <div className="mock-list-item"><div className="mock-icon">V</div><div><strong>Audit</strong><div className="mock-subtitle">Report immediato</div></div><span>01</span></div>
              </div>
            </div>
            <div className="mock-phone dark center">
              <div className="mock-topline"><span className="mock-title">Scan</span><span>⚡</span></div>
              <div style={{ display: 'grid', placeItems: 'center', minHeight: '62%' }}>
                <div style={{ width: 160, height: 160, border: '10px solid rgba(255,255,255,0.1)', borderRadius: 22, display: 'grid', placeItems: 'center' }}>
                  <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: '-0.08em' }}>QR</div>
                </div>
              </div>
            </div>
            <div className="mock-phone tilt-right">
              <div className="mock-topline"><span>Vault</span><span>Manage</span></div>
              <div className="mock-grid">
                <div className="mock-chip-row">
                  <div className="mock-chip"><strong>Browser</strong><span className="mock-subtitle">34 password</span></div>
                  <div className="mock-chip"><strong>App</strong><span className="mock-subtitle">10 password</span></div>
                  <div className="mock-chip"><strong>Payment</strong><span className="mock-subtitle">23 password</span></div>
                </div>
                <div className="mock-list-item"><div className="mock-icon">G</div><div><strong>Google</strong><div className="mock-subtitle">andy@gmail.com</div></div><span>recent</span></div>
                <div className="mock-list-item"><div className="mock-icon">B</div><div><strong>Behance</strong><div className="mock-subtitle">andy@gmail.com</div></div><span>copy</span></div>
              </div>
            </div>
          </div>
        </div>

        <Card className="auth-card auth-card--login">
          <CardHeader>
            <div className="status-row"><span className="badge"><LockKeyhole size={14} /> Accesso</span></div>
            <h2>Accedi al tuo vault</h2>
            <p>Usa email, master password e un eventuale vault password memorizzata solo in memoria di sessione.</p>
          </CardHeader>
          <CardContent>
            <form className="drawer-form" onSubmit={handleSubmit}>
              <div className="field"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@dominio.it" required /></div>
              <div className="field"><Label htmlFor="password">Master password</Label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" required /></div>
              <div className="field"><Label htmlFor="vaultPassword">Vault password</Label><Input id="vaultPassword" type="password" value={vaultPassword} onChange={(event) => setVaultPassword(event.target.value)} placeholder="Se diversa dalla master password" /></div>
              {error ? <Alert variant="destructive">{error}</Alert> : null}
              {notice ? <Alert>{notice}</Alert> : null}
              <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Accesso...' : <><LogIn size={16} /> Entra</>}</Button>
            </form>
          </CardContent>
          <div className="auth-links">
            <span className="hint">Nessun account ancora registrato?</span>
            <Link className="button link" to="/register">Crea account</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

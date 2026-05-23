import { useMemo, useState } from 'react';
import { CheckCircle2, LockKeyhole, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';

function checkPasswordRequirement(password, pattern) {
  return pattern.test(password);
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const requirements = useMemo(() => ([
    { label: 'Minimo 12 caratteri', ok: password.length >= 12 },
    { label: 'Una maiuscola', ok: checkPasswordRequirement(password, /[A-Z]/) },
    { label: 'Un numero', ok: checkPasswordRequirement(password, /\d/) },
    { label: 'Un simbolo', ok: checkPasswordRequirement(password, /[^A-Za-z0-9]/) }
  ]), [password]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await register(email, password);
      const recoveryCode = resp.recoveryCode;
      setMessage('Account creato con successo. Scarica il codice di recupero e conservalo in sicurezza.');

      // trigger recovery PDF download from server
      try {
        const url = `/api/auth/recovery-pdf?email=${encodeURIComponent(email)}&code=${encodeURIComponent(recoveryCode)}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `recovery-${email}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (e) {
        console.error('Failed to download recovery PDF', e);
      }

      setTimeout(() => navigate('/login'), 1200);
    } catch (registerError) {
      setError(registerError?.response?.data?.error || 'Registrazione non riuscita.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <Card className="auth-card auth-card--register" style={{ width: 'min(760px, 100%)' }}>
        <CardHeader>
          <div className="status-row"><span className="badge"><LockKeyhole size={14} /> Registrazione</span></div>
          <h2>Crea il tuo vault personale</h2>
          <p>La master password deve rispettare requisiti forti e resterà solo sotto il tuo controllo nel browser.</p>
        </CardHeader>
        <CardContent>
          <form className="drawer-form" onSubmit={handleSubmit}>
            <div className="field"><Label htmlFor="register-email">Email</Label><Input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="field"><Label htmlFor="register-password">Master password</Label><Input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="field"><Label htmlFor="confirm-password">Conferma password</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
            <div className="mini-panel register-requirements">
              <div className="hint register-requirements__title">Requisiti password</div>
              <div className="register-requirements__list">
                {requirements.map((requirement) => (
                  <div key={requirement.label} className="register-requirements__item">
                    <span>{requirement.label}</span>
                    {requirement.ok ? <CheckCircle2 size={18} color="var(--success)" /> : <XCircle size={18} color="var(--danger)" />}
                  </div>
                ))}
              </div>
            </div>
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            {message ? <Alert>{message}</Alert> : null}
            <Button type="submit" variant="primary" className="full-width" disabled={isSubmitting}>{isSubmitting ? 'Creazione...' : 'Crea account'}</Button>
          </form>
        </CardContent>
        <div className="auth-links">
          <span className="hint">Hai già un account?</span>
          <Link className="button link" to="/login">Accedi</Link>
        </div>
      </Card>
    </div>
  );
}

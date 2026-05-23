import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import api from '../services/api';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      await api.post('/auth/verify-email', { email, token });
      setMessage('Email verificata con successo. Ora puoi accedere.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.response?.data?.error || 'Verifica non riuscita.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError('');
    setMessage('');
    setIsResending(true);

    try {
      await api.post('/auth/resend-verification', { email });
      setMessage('Nuovo token di verifica inviato via email.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Invio non riuscito.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="page-shell">
      <Card style={{ width: 'min(640px, 100%)' }}>
        <CardHeader>
          <h2>Verifica email</h2>
          <p>Inserisci email e token ricevuto via mail. Se non hai ricevuto nulla, puoi reinviare il token.</p>
        </CardHeader>
        <CardContent>
          <form className="drawer-form" onSubmit={handleVerify}>
            <div className="field"><Label htmlFor="verify-email">Email</Label><Input id="verify-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="field"><Label htmlFor="verify-token">Token verifica</Label><Input id="verify-token" value={token} onChange={(event) => setToken(event.target.value)} required /></div>
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            {message ? <Alert>{message}</Alert> : null}
            <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Verifica...' : 'Verifica email'}</Button>
            <Button type="button" variant="secondary" onClick={handleResend} disabled={isResending || !email}>{isResending ? 'Invio...' : 'Reinvia token'}</Button>
          </form>
        </CardContent>
        <div className="auth-links">
          <span className="hint">Torna al login</span>
          <Link className="button link" to="/login">Login</Link>
        </div>
      </Card>
    </div>
  );
}

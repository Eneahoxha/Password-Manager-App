import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSending(true);
    try {
      await api.post('/auth/forgot', { email });
      setMessage('OTP inviato alla tua email. Controlla la posta e inserisci il codice insieme al codice di recupero per resettare la master password.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Errore nell\'invio OTP.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="page-shell">
      <Card style={{ width: 'min(640px, 100%)' }}>
        <CardHeader>
          <h2>Recupero master password</h2>
          <p>Ti invieremo un codice via email (MFA). Avrai bisogno anche del codice di recupero generato alla registrazione.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendOtp} className="drawer-form">
            <div className="field"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            {message ? <Alert>{message}</Alert> : null}
            <Button type="submit" variant="primary" disabled={isSending}>{isSending ? 'Invio...' : 'Invia codice OTP'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

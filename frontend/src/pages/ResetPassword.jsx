import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-with-recovery', { email, otp, recoveryCode, newPassword });
      setMessage('Password aggiornata. Effettua il login con la nuova master password.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err?.response?.data?.error || 'Reset fallito.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <Card style={{ width: 'min(640px, 100%)' }}>
        <CardHeader>
          <h2>Reset Master Password</h2>
          <p>Inserisci email, il codice OTP ricevuto via email e il codice di recupero generato in fase di registrazione.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="drawer-form">
            <div className="field"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="field"><Label>Codice OTP</Label><Input value={otp} onChange={(e) => setOtp(e.target.value)} required /></div>
            <div className="field"><Label>Codice di recupero</Label><Input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} required /></div>
            <div className="field"><Label>Nuova master password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            {message ? <Alert>{message}</Alert> : null}
            <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? 'Invio...' : 'Resetta password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

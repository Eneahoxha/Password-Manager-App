import { useEffect, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Slider from '../ui/Slider';
import Switch from '../ui/Switch';
import { generatePassword } from '../../utils/passwordGenerator';

export default function PasswordGenerator({ onGenerate }) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setPassword(generatePassword({ length, uppercase, lowercase, numbers, symbols }));
  }, []);

  function handleGenerate() {
    const nextPassword = generatePassword({ length, uppercase, lowercase, numbers, symbols });
    setPassword(nextPassword);
    onGenerate?.(nextPassword);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(password);
  }

  return (
    <div className="drawer-form">
      <div className="field">
        <Label>Password generata: {length} caratteri</Label>
        <Slider value={length} onValueChange={setLength} min={8} max={128} />
      </div>
      <div className="toggle-row"><span className="hint">Maiuscole</span><Switch checked={uppercase} onCheckedChange={setUppercase} /></div>
      <div className="toggle-row"><span className="hint">Minuscole</span><Switch checked={lowercase} onCheckedChange={setLowercase} /></div>
      <div className="toggle-row"><span className="hint">Numeri</span><Switch checked={numbers} onCheckedChange={setNumbers} /></div>
      <div className="toggle-row"><span className="hint">Simboli</span><Switch checked={symbols} onCheckedChange={setSymbols} /></div>
      <Input value={password} readOnly />
      <div className="password-row">
        <Button variant="primary" onClick={handleGenerate}><RefreshCw size={16} /> Genera</Button>
        <Button variant="secondary" onClick={handleCopy}><Copy size={16} /> Copia</Button>
      </div>
    </div>
  );
}

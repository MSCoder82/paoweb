'use client';
import { useState } from 'react';

export default function AdminPage() {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  const createUnit = async () => {
    setMsg('working…');
    const res = await fetch('/api/admin/units', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const j = await res.json();
    setMsg(res.ok ? 'Created!' : `Error: ${j.error}`);
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Admin: Create Unit</h1>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Unit name" />
      <button onClick={createUnit} disabled={!name}>Create</button>
      <div>{msg}</div>
      <p style={{marginTop:12, opacity:.7}}>You must be logged in and have admin role.</p>
    </div>
  );
}

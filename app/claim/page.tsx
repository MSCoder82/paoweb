'use client';
import { useState } from 'react';

export default function ClaimPage() {
  const [unitId, setUnitId] = useState('');
  const [role, setRole] = useState<'staff'|'chief'>('staff');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  const claim = async () => {
    setMsg('working…');
    const res = await fetch('/api/invites/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ unitId, role, code }),
    });
    const j = await res.json();
    setMsg(res.ok ? 'Joined!' : `Error: ${j.error}`);
  };

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Join a Unit</h1>
      <input value={unitId} onChange={e=>setUnitId(e.target.value)} placeholder="Unit ID" />
      <select value={role} onChange={e=>setRole(e.target.value as any)}>
        <option value="staff">staff</option>
        <option value="chief">chief</option>
      </select>
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Invite code" />
      <button onClick={claim} disabled={!unitId || !code}>Claim Invite</button>
      <div>{msg}</div>
    </div>
  );
}

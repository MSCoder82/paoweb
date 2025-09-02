import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'edge';

export async function POST(req: Request, { params }: { params: { unitId: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { role, expiresAt, maxUses } = await req.json() as { role: 'chief'|'staff', expiresAt?: string, maxUses?: number };

  // ensure caller is chief of the unit
  const { data: chiefRow, error: chiefErr } = await supabase
    .from('user_unit_roles').select('role').eq('user_id', user.id).eq('unit_id', params.unitId).eq('role', 'chief').maybeSingle();
  if (chiefErr) return NextResponse.json({ error: chiefErr.message }, { status: 400 });
  if (!chiefRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // simple plaintext code for sharing
  const code = Math.random().toString(36).slice(2, 10);

  // hash via DB helper
  const { data: hash, error: hashErr } = await supabase.rpc('hash_bcrypt', { p_code: code });
  if (hashErr || !hash) return NextResponse.json({ error: hashErr?.message ?? 'hash error' }, { status: 400 });

  const { error: insErr } = await supabase.from('unit_invite_codes').insert({
    unit_id: params.unitId,
    role,
    code_hash: hash as unknown as string,
    expires_at: expiresAt ?? null,
    max_uses: maxUses ?? null,
    created_by: user.id,
    active: true
  } as any);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

  return NextResponse.json({ code });
}

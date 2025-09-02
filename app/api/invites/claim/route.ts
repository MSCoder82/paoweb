import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
export const runtime = 'edge';

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { unitId, role, code } = await req.json();
  const { error } = await supabase.rpc('claim_invite', { p_code: code, p_unit: unitId, p_role: role });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

    // verify user is logged in
    const userCtx = supabaseServer();
    const { data: { user } } = await userCtx.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // check admin
    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: roles, error: roleErr } = await svc
      .from('user_system_roles').select('role').eq('user_id', user.id).eq('role', 'admin').limit(1);
    if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 400 });
    if (!roles?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await svc.from('units').insert({ name, created_by: user.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}

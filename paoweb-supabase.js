/* ===== paoweb-supabase.js =====
   - Uses sessionStorage for auth persistence
   - Admin, Chief, and Staff: signInWithPassword
   - Role gating + basic data load hooks
*/

const SUPABASE_URL = "https://sgccupkrrnnzorwonnhi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnY2N1cGtycm5uem9yd29ubmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDM1MTMsImV4cCI6MjA3MTc3OTUxM30.mqPpl24-gMomKA47VE_AiKTvN2t7FWW_7hXoEmiwFnM";

// Reuse an existing Supabase client if one was already created elsewhere on the
// page.  The index.html file bootstraps a client for legacy flows, so this file
// should gracefully adopt that instance instead of trying to create a new one.
// If no client exists yet, fall back to creating our own.
const sb = window.supabase?.from
  ? window.supabase
  : supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: window.sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

// Expose the client globally so other scripts (like index.html) can use it and
// so they don't attempt to spin up duplicate clients.
window.supabase = sb;

let CURRENT = {
  session: null,
  profile: null,
  role: "viewer",
  unit_id: null,
  unitChannel: null,
  metaChannel: null
};

// ---------- Helpers ----------
const $ = (s) => document.querySelector(s);
const toInt = (v, d=0) => { const n = parseInt(v,10); return Number.isFinite(n)?n:d; };

const HOME_SELECT_ID = "#unitSelectHome";

async function reloadUnits(){
  const homeSel = $(HOME_SELECT_ID);
  if(!homeSel) return;
  try {
    const { data, error } = await sb.from('units').select('id, name, code').order('name', { ascending: true });
    if (error) { console.warn("units load error:", error.message); return; }
    const optionsHtml = [
      '<option value="">Select a unit…</option>',
      ...(data || []).map(u => `<option value="${u.id ?? u.code}" data-id="${u.id}">${u.name}</option>`)
    ].join('');
    homeSel.innerHTML = optionsHtml;
  }catch(err){
    console.error("load units failed", err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    reloadUnits();
  });
} else {
  reloadUnits();
}

async function refreshRole(){
  try{
    const { data, error } = await sb.rpc("my_role");
    if(error) throw error;
    const role = data?.role ?? data ?? "viewer";
    CURRENT.role = role;
    gateMenus(role);
  }catch(err){
    console.error("my_role failed", err);
  }
}

async function switchUnit(unitId) {
  if (!unitId) return;
  try {
    await sb.rpc("set_active_unit", { in_unit: unitId });
    CURRENT.unit_id = unitId;
    tearDownRealtime?.();
    await refreshRoleForUnit(unitId);
    await loadUnitData();
    if (typeof loadCampaigns === 'function') await loadCampaigns();
    if (typeof refreshCampaignProgress === 'function') await refreshCampaignProgress();
    subscribeRealtime?.();
  } catch (e) {
    console.error("switchUnit failed", e);
    alert(e.message || "Could not switch unit");
  }
}

async function refreshRoleForUnit(unitId) {
  try {
    const { data, error } = await sb.rpc("my_role", { in_unit: unitId });
    if (error) throw error;
    const role = data ?? "viewer";
    CURRENT.role = role;
    gateMenus(role);
  } catch (e) {
    console.error("my_role(unit) failed", e);
  }
}

// ---------- Admin sign-in (email/password) ----------
async function adminSignIn() {
  const email = $("#admin-email")?.value?.trim();
  const password = $("#admin-password")?.value;
  if (!email || !password) { alert("Enter admin email and password."); return; }
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { alert("Admin sign-in failed: " + error.message); return; }
  await boot(); // loads role and unit; admin menu should appear if role='admin'
}

// ---------- Auth state changes ----------
sb.auth.onAuthStateChange(async (_evt, session) => {
  CURRENT.session = session;
  if (session?.user) {
    await boot();
  } else {
    tearDownRealtime();
    CURRENT = { session: null, profile: null, role: "viewer", unit_id: null, unitChannel: null, metaChannel: null };
    gateMenus("viewer");
  }
});

// ---------- Load profile/role, gate menus, subscribe ----------
async function boot() {
  const { data: u } = await sb.auth.getUser();
  if (!u) return;

  const { data: profile } = await sb
    .from("profiles")
    .select("user_id, unit_id, display_name")
    .eq("user_id", u.user.id)
    .single();

  CURRENT.profile = profile || null;
  CURRENT.unit_id = profile?.unit_id || null;

  await refreshRole();
  await loadUnitData();
  if (typeof loadCampaigns === 'function') await loadCampaigns();
  if (typeof refreshCampaignProgress === 'function') await refreshCampaignProgress();
  subscribeRealtime();
}

function gateMenus(role) {
  const allow = {
    viewer: new Set(["#menu-viewer"]),
    staff:  new Set(["#menu-viewer","#menu-staff"]),
    chief:  new Set(["#menu-viewer","#menu-staff","#menu-chief"]),
    admin:  new Set(["#menu-viewer","#menu-staff","#menu-chief","#menu-admin"])
  }[role] || new Set(["#menu-viewer"]);

  ["#menu-viewer","#menu-staff","#menu-chief","#menu-admin"].forEach(sel=>{
    const el=$(sel); if (!el) return;
    el.style.display = allow.has(sel) ? "" : "none";
  });
  const badge=$("#role-badge"); if (badge) badge.textContent = role.toUpperCase();
}

// ---------- Data fetch (plug into your renderers) ----------
async function loadUnitData() {
  if (!CURRENT.unit_id) return;

  const [{ data: outputs }, { data: outtakes }, { data: outcomes }, { data: goals }, { data: templates }] = await Promise.all([
    sb.from("outputs").select("*").eq("unit_id", CURRENT.unit_id).order("created_at", { ascending: false }),
    sb.from("outtakes").select("*").eq("unit_id", CURRENT.unit_id).order("created_at", { ascending: false }),
    sb.from("outcomes").select("*").eq("unit_id", CURRENT.unit_id).order("created_at", { ascending: false }),
    sb.from("goals").select("*").eq("unit_id", CURRENT.unit_id).order("position", { ascending: true }),
    sb.from("templates").select("*").eq("unit_id", CURRENT.unit_id).order("position", { ascending: true })
  ]);

  // TODO: replace with your UI render functions
  console.debug({ outputs, outtakes, outcomes, goals, templates });
}

// ---------- Realtime ----------
function subscribeRealtime() {
  tearDownRealtime();

  const meta = sb.channel("meta_stream");
  meta.on("postgres_changes", { event: "*", schema: "public", table: "unit" }, () => reloadUnits());
  const uid = CURRENT.session?.user?.id || CURRENT.profile?.user_id;
  if(uid){
    meta.on("postgres_changes", { event: "*", schema: "public", table: "roles", filter:`user_id=eq.${uid}` }, () => refreshRole());
  }
  meta.subscribe();
  CURRENT.metaChannel = meta;

  if (!CURRENT.unit_id) return;

  const ch = sb.channel("unit_stream_" + CURRENT.unit_id);
  ["outputs","outtakes","outcomes","templates"].forEach(tbl=>{
    ch.on("postgres_changes",
      { event:"*", schema:"public", table: tbl, filter:`unit_id=eq.${CURRENT.unit_id}` },
      () => loadUnitData()
    );
  });
  ch.on("postgres_changes",
    { event:"*", schema:"public", table:"goals", filter:`unit_id=eq.${CURRENT.unit_id}` },
    () => {
      loadUnitData();
      if (typeof refreshCampaignProgress === 'function') refreshCampaignProgress();
    }
  );
  ch.on("postgres_changes",
    { event:"*", schema:"public", table:"campaigns", filter:`unit_id=eq.${CURRENT.unit_id}` },
    () => {
      if (typeof loadCampaigns === 'function') loadCampaigns();
      if (typeof refreshCampaignProgress === 'function') refreshCampaignProgress();
    }
  );
  ch.subscribe();
  CURRENT.unitChannel = ch;
}
function tearDownRealtime(){
  if (CURRENT.unitChannel){ sb.removeChannel(CURRENT.unitChannel); CURRENT.unitChannel=null; }
  if (CURRENT.metaChannel){ sb.removeChannel(CURRENT.metaChannel); CURRENT.metaChannel=null; }
}

// ---------- Inserts (staff) ----------
async function addOutput(form){
  const product_type = form.querySelector("[name=product_type]").value;
  const other_label  = form.querySelector("[name=other_label]").value || null;
  const quantity     = toInt(form.querySelector("[name=quantity]").value, 1);
  const timeframe    = form.querySelector("[name=timeframe]").value;
  const linksRaw     = form.querySelector("[name=links]").value.trim();
  const links        = linksRaw ? linksRaw.split(/\s+/) : [];
  const campaign_id  = form.querySelector("[name=campaign_id]")?.value || null;
  await sb.from("outputs").insert({
    unit_id: CURRENT.unit_id,
    user_id: CURRENT.profile.user_id,
    product_type, other_label, quantity, links, timeframe, campaign_id
  });
}

async function addOuttake(form){
  const outtake_type = form.querySelector("[name=outtake_type]").value;
  const other_label  = form.querySelector("[name=other_label]").value || null;
  const quantity     = toInt(form.querySelector("[name=quantity]").value, 1);
  const timeframe    = form.querySelector("[name=timeframe]").value;
  const notes        = form.querySelector("[name=notes]").value || null;
  const campaign_id  = form.querySelector("[name=campaign_id]")?.value || null;
  await sb.from("outtakes").insert({
    unit_id: CURRENT.unit_id,
    user_id: CURRENT.profile.user_id,
    outtake_type, other_label, quantity, timeframe, notes, campaign_id
  });
}

async function addOutcome(form){
  const outcome_label = form.querySelector("[name=outcome_label]").value;
  const other_label   = form.querySelector("[name=other_label]").value || null;
  const percent       = Number(form.querySelector("[name=percent]").value);
  const timeframe     = form.querySelector("[name=timeframe]").value;
  const campaign_id   = form.querySelector("[name=campaign_id]")?.value || null;
  await sb.from("outcomes").insert({
    unit_id: CURRENT.unit_id,
    user_id: CURRENT.profile.user_id,
    outcome_label, other_label, percent, timeframe, campaign_id
  });
}

// ---------- Chiefs ----------
async function setGoal(form){
  const kind   = form.querySelector("[name=kind]").value;
  const label  = form.querySelector("[name=label]").value;
  const target = Number(form.querySelector("[name=target]").value);
  await sb.from("goals").insert({
    unit_id: CURRENT.unit_id, kind, label, target, created_by: CURRENT.profile.user_id
  });
}

async function addTemplate(form){
  const template_kind = form.querySelector("[name=template_kind]").value;
  const value         = form.querySelector("[name=value]").value;
  await sb.from("templates").insert({ unit_id: CURRENT.unit_id, template_kind, value });
}

// ---------- AI Keys ----------
async function saveAiKey({ unit_id, provider, api_key, model, enabled }) {
  const token = (await sb.auth.getSession()).data.session?.access_token;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/set-ai-key`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ unit_id, provider, api_key, model, enabled })
  });
  if (!res.ok) throw new Error(await res.text());
}

async function askAi({ provider, prompt, model }) {
  const token = (await sb.auth.getSession()).data.session?.access_token;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ask-ai`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ unit_id: CURRENT.unit_id, provider, prompt, model })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------- Admin: Manage User Roles ----------
async function setUserRole(user_id, role) {
  const { error } = await sb.from('roles').upsert({ user_id, role }, { onConflict: 'user_id' });
  if (error) throw error;
}

async function loadAllUsers() {
  try {
    const { data: profiles, error: pErr } = await sb.from('profiles').select('user_id, display_name');
    if (pErr) throw pErr;
    const { data: roles, error: rErr } = await sb.from('roles').select('user_id, role');
    if (rErr) throw rErr;
    const roleMap = {};
    (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });
    const users = (profiles || []).map(p => ({
      id: p.user_id,
      name: p.display_name || p.user_id,
      role: roleMap[p.user_id] || 'viewer'
    }));
    const tbl = document.querySelector('#userRolesTable');
    if (!tbl) return;
    const rowsHtml = users.map(u => `
      <tr><td>${u.name}</td><td><select data-uid="${u.id}">
        <option value="viewer"${u.role==='viewer'? ' selected': ''}>Viewer</option>
        <option value="staff"${u.role==='staff'? ' selected': ''}>Staff</option>
        <option value="chief"${u.role==='chief'? ' selected': ''}>PAO Chief</option>
        <option value="admin"${u.role==='admin'? ' selected': ''}>Admin</option>
      </select></td></tr>`).join('');
    tbl.innerHTML = `<thead><tr><th>User</th><th>Role</th></tr></thead><tbody>${rowsHtml}</tbody>`;
    tbl.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', async e => {
        const uid = e.target.getAttribute('data-uid');
        const newRole = e.target.value;
        try {
          await setUserRole(uid, newRole);
        } catch (err) {
          console.error('setUserRole failed', err);
          alert('Failed to update role');
        }
      });
    });
  } catch (err) {
    console.error('loadAllUsers failed', err);
  }
}

// ---------- Bind UI ----------
function bindUI(){
  // Populate unit selectors from Supabase when the page loads
  if (typeof window.buildUnitPicker === 'function') {
    window.buildUnitPicker();
  } else {
    reloadUnits();
  }

  // Admin sign-in
  $("#admin-signin")?.addEventListener("click", adminSignIn);

  // Example form hooks (adjust IDs to your page)
  $("#form-output")?.addEventListener("submit", async e=>{ e.preventDefault(); await addOutput(e.currentTarget); e.currentTarget.reset(); });
  $("#form-outtake")?.addEventListener("submit", async e=>{ e.preventDefault(); await addOuttake(e.currentTarget); e.currentTarget.reset(); });
  $("#form-outcome")?.addEventListener("submit", async e=>{ e.preventDefault(); await addOutcome(e.currentTarget); e.currentTarget.reset(); });
  $("#form-goal")?.addEventListener("submit", async e=>{ e.preventDefault(); await setGoal(e.currentTarget); e.currentTarget.reset(); });
  $("#form-template")?.addEventListener("submit", async e=>{ e.preventDefault(); await addTemplate(e.currentTarget); e.currentTarget.reset(); });
}

window.PAOWeb = { adminSignIn, loadUnitData, addOutput, addOuttake, addOutcome, setGoal, addTemplate, reloadUnits, saveAiKey, askAi, switchUnit, loadAllUsers, setUserRole };
document.addEventListener("DOMContentLoaded", bindUI);

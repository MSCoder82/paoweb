const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let CURRENT = { session: null, profile: null, role: "viewer", unit_id: null, channel: null };

function $(s){ return document.querySelector(s); }
function toInt(v,d=0){ const n=parseInt(v,10); return Number.isFinite(n)?n:d; }

async function startSignIn(email, displayName, unitCode, unitPin, chiefPin) {
  sessionStorage.setItem("paoweb_pending_join", JSON.stringify({ unitCode, unitPin, chiefPin, displayName }));
  await sb.auth.signInWithOtp({ email, options: { data: { display_name: displayName } } });
  alert("Check your email for the sign-in link.");
}

sb.auth.onAuthStateChange(async (_evt, session) => {
  CURRENT.session = session;
  if (session?.user) {
    const pending = sessionStorage.getItem("paoweb_pending_join");
    if (pending) {
      const { unitCode, unitPin, chiefPin, displayName } = JSON.parse(pending);
      sessionStorage.removeItem("paoweb_pending_join");
      if (displayName) await sb.from("profiles").update({ display_name: displayName }).eq("user_id", session.user.id);
      const { error } = await sb.rpc("join_unit_rpc", { unit_code: unitCode, unit_pin: unitPin, chief_pin: chiefPin || null });
      if (error) alert("Join failed: " + error.message);
    }
    await boot();
  } else {
    tearDownRealtime();
    CURRENT = { session: null, profile: null, role: "viewer", unit_id: null, channel: null };
    gateMenus("viewer");
  }
});

async function boot() {
  const { data: u } = await sb.auth.getUser();
  if (!u) return;

  const { data: profile } = await sb.from("profiles").select("user_id, unit_id, display_name").eq("user_id", u.user.id).single();
  const { data: roleRow } = await sb.from("roles").select("role").eq("user_id", u.user.id).single();

  CURRENT.profile = profile || null;
  CURRENT.role = roleRow?.role || "viewer";
  CURRENT.unit_id = profile?.unit_id || null;

  gateMenus(CURRENT.role);
  await loadUnitData();
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
    const el=$(sel); if (!el) return; el.style.display = allow.has(sel) ? "" : "none";
  });
  const badge=$("#role-badge"); if (badge) badge.textContent = role.toUpperCase();
}

async function loadUnitData() {
  if (!CURRENT.unit_id) return;
  const [{ data: outputs }, { data: outtakes }, { data: outcomes }, { data: goals }, { data: templates }] = await Promise.all([
    sb.from("outputs").select("*").eq("unit_id", CURRENT.unit_id).order("created_at", { ascending: false }),
    sb.from("outtakes").select("*").eq("unit_id", CURRENT.unit_id).order("created_at", { ascending: false }),
    sb.from("outcomes").select("*").eq("unit_id", CURRENT.unit_id).order("created_at", { ascending: false }),
    sb.from("goals").select("*").eq("unit_id", CURRENT.unit_id).order("position", { ascending: true }),
    sb.from("templates").select("*").eq("unit_id", CURRENT.unit_id).order("position", { ascending: true })
  ]);

  // Plug into your renderers or keep as placeholders:
  const oEl = document.querySelector("#outputs-list");   if (oEl) oEl.textContent   = JSON.stringify(outputs||[], null, 2);
  const otEl= document.querySelector("#outtakes-list");  if (otEl) otEl.textContent = JSON.stringify(outtakes||[], null, 2);
  const ocEl= document.querySelector("#outcomes-list");  if (ocEl) ocEl.textContent = JSON.stringify(outcomes||[], null, 2);
  const gEl = document.querySelector("#goals-list");     if (gEl) gEl.textContent   = JSON.stringify(goals||[], null, 2);
  const tEl = document.querySelector("#templates-list"); if (tEl) tEl.textContent   = JSON.stringify(templates||[], null, 2);
}

function subscribeRealtime() {
  tearDownRealtime();
  if (!CURRENT.unit_id) return;
  const ch = sb.channel("unit_stream_" + CURRENT.unit_id);
  ["outputs","outtakes","outcomes","goals","templates"].forEach(tbl=>{
    ch.on("postgres_changes", { event:"*", schema:"public", table: tbl, filter:`unit_id=eq.${CURRENT.unit_id}` }, () => loadUnitData());
  });
  ch.subscribe();
  CURRENT.channel = ch;
}

function tearDownRealtime(){ if (CURRENT.channel){ sb.removeChannel(CURRENT.channel); CURRENT.channel=null; } }

// ---- Inserts (staff) ----
async function addOutput(form){
  const product_type = form.querySelector("[name=product_type]").value;
  const other_label  = form.querySelector("[name=other_label]").value || null;
  const quantity     = toInt(form.querySelector("[name=quantity]").value, 1);
  const timeframe    = form.querySelector("[name=timeframe]").value;
  const linksRaw     = form.querySelector("[name=links]").value.trim();
  const links        = linksRaw ? linksRaw.split(/\s+/) : [];
  await sb.from("outputs").insert({ unit_id: CURRENT.unit_id, user_id: CURRENT.profile.user_id, product_type, other_label, quantity, links, timeframe });
}
async function addOuttake(form){
  const outtake_type = form.querySelector("[name=outtake_type]").value;
  const other_label  = form.querySelector("[name=other_label]").value || null;
  const quantity     = toInt(form.querySelector("[name=quantity]").value, 1);
  const timeframe    = form.querySelector("[name=timeframe]").value;
  const notes        = form.querySelector("[name=notes]").value || null;
  await sb.from("outtakes").insert({ unit_id: CURRENT.unit_id, user_id: CURRENT.profile.user_id, outtake_type, other_label, quantity, timeframe, notes });
}
async function addOutcome(form){
  const outcome_label = form.querySelector("[name=outcome_label]").value;
  const other_label   = form.querySelector("[name=other_label]").value || null;
  const percent       = Number(form.querySelector("[name=percent]").value);
  const timeframe     = form.querySelector("[name=timeframe]").value;
  await sb.from("outcomes").insert({ unit_id: CURRENT.unit_id, user_id: CURRENT.profile.user_id, outcome_label, other_label, percent, timeframe });
}

// ---- Chiefs ----
async function setGoal(form){
  const kind   = form.querySelector("[name=kind]").value;
  const label  = form.querySelector("[name=label]").value;
  const target = Number(form.querySelector("[name=target]").value);
  await sb.from("goals").insert({ unit_id: CURRENT.unit_id, kind, label, target, created_by: CURRENT.profile.user_id });
}
async function addTemplate(form){
  const template_kind = form.querySelector("[name=template_kind]").value;
  const value         = form.querySelector("[name=value]").value;
  await sb.from("templates").insert({ unit_id: CURRENT.unit_id, template_kind, value });
}

// ---- Bind UI IDs (adjust to your page) ----
function bindUI(){
  const signInBtn = document.querySelector("#signin-btn");
  if (signInBtn){
    signInBtn.addEventListener("click", async ()=>{
      const email       = document.querySelector("#email")?.value?.trim();
      const displayName = document.querySelector("#displayName")?.value?.trim() || "User";
      const unitCode    = document.querySelector("#unitCode")?.value?.trim();
      const unitPin     = document.querySelector("#unitPin")?.value?.trim();
      const chiefPin    = document.querySelector("#chiefPin")?.value?.trim() || null;
      if (!email || !unitCode || !unitPin) { alert("Email, unit code, and unit PIN are required."); return; }
      await startSignIn(email, displayName, unitCode, unitPin, chiefPin);
    });
  }

  const fOut = document.querySelector("#form-output");
  if (fOut) fOut.addEventListener("submit", async e=>{ e.preventDefault(); await addOutput(fOut); fOut.reset(); });

  const fOt = document.querySelector("#form-outtake");
  if (fOt) fOt.addEventListener("submit", async e=>{ e.preventDefault(); await addOuttake(fOt); fOt.reset(); });

  const fOc = document.querySelector("#form-outcome");
  if (fOc) fOc.addEventListener("submit", async e=>{ e.preventDefault(); await addOutcome(fOc); fOc.reset(); });

  const fGoal = document.querySelector("#form-goal");
  if (fGoal) fGoal.addEventListener("submit", async e=>{ e.preventDefault(); await setGoal(fGoal); fGoal.reset(); });

  const fTpl = document.querySelector("#form-template");
  if (fTpl) fTpl.addEventListener("submit", async e=>{ e.preventDefault(); await addTemplate(fTpl); fTpl.reset(); });
}

window.PAOWeb = { startSignIn, loadUnitData, addOutput, addOuttake, addOutcome, setGoal, addTemplate };
document.addEventListener("DOMContentLoaded", bindUI);

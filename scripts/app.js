/* ================= DATA ================= */
const STORAGE_KEY='nww_pao_metrics_onepage_v1';
const ONBOARD_KEY='nww_onboard_done';
const defaultOutcomes=[
  {name:'Awareness lift', desc:''},
  {name:'Understanding of issue/process', desc:''},
  {name:'Trust/credibility indicators', desc:''},
  {name:'Intent to participate/comply', desc:''},
  {name:'Permit/application completeness', desc:''},
  {name:'Public meeting civility/productivity', desc:''},
  {name:'Rumor reduction/Misinfo countered', desc:''},
  {name:'Safety behavior adoption (e.g., life jacket use)', desc:''},
  {name:'Preparedness actions taken', desc:''},
  {name:'Support for decisions/policies', desc:''},
  {name:'Stakeholder collaboration actions', desc:''}
];
const def={
  adminPIN:'0000',
  staff:[], // {id,name,pin}
  templates:{
    outputs:[
      {name:'News release', qty:1, links:[]},
      {name:'Media advisory', qty:1, links:[]},
      {name:'Media engagement (interviews/briefs)', qty:1, links:[]},
      {name:'Web article/Feature', qty:1, links:[]},
      {name:'DVIDS upload (photo/video)', qty:1, links:[]},
      {name:'Social posts (FB/X/IG/LI)', qty:1, links:[]},
      {name:'Infographic', qty:1, links:[]},
      {name:'Factsheet/One-pager', qty:1, links:[]},
      {name:'FAQ/Q&A', qty:1, links:[]},
      {name:'Video package/Reel/Short', qty:1, links:[]},
      {name:'Photo set', qty:1, links:[]},
      {name:'Public meeting/Open house', qty:1, links:[]},
      {name:'Stakeholder briefing deck', qty:1, links:[]},
      {name:'Talking points/Speech', qty:1, links:[]},
      {name:'Newsletter (internal/external)', qty:1, links:[]},
      {name:'Public notice', qty:1, links:[]},
      {name:'Blog post', qty:1, links:[]},
      {name:'Radio PSA/Podcast guest', qty:1, links:[]},
      {name:'Op-ed/LTE', qty:1, links:[]},
      {name:'Email to distro/Workforce note', qty:1, links:[]},
      {name:'Congressional update', qty:1, links:[]}
    ],
    outtakes:[
      {name:'Reach/Impressions', qty:1, notes:''},
      {name:'Engagement rate', qty:1, notes:''},
      {name:'Reactions/Comments/Shares', qty:1, notes:''},
      {name:'Click-through rate', qty:1, notes:''},
      {name:'Video views', qty:1, notes:''},
      {name:'Average watch time', qty:1, notes:''},
      {name:'Web sessions', qty:1, notes:''},
      {name:'Time on page', qty:1, notes:''},
      {name:'Bounce rate', qty:1, notes:''},
      {name:'Media pickups', qty:1, notes:''},
      {name:'Share of voice', qty:1, notes:''},
      {name:'Earned sentiment', qty:1, notes:''},
      {name:'Event attendance', qty:1, notes:''},
      {name:'Questions received', qty:1, notes:''},
      {name:'Call/email volume', qty:1, notes:''},
      {name:'Newsletter opens', qty:1, notes:''},
      {name:'Newsletter CTR', qty:1, notes:''}
    ]
  },
  goals:{
    M:{outputs:{},outtakes:{},outcomes:defaultOutcomes.slice()},
    Q:{outputs:{},outtakes:{},outcomes:defaultOutcomes.slice()},
    Y:{outputs:{},outtakes:{},outcomes:defaultOutcomes.slice()}
  },
  entries:[], // metrics: {id,userId,type:'output'|'outtake'|'outcome', tf, tfKey, ts, data:{...}}
  kle:[],    // KLE
  media:[],  // media queries
  social:[], // social posts
  brand:{ policy:{brandGuideUrl:'', milHost:'', approvalsRequired:['PAO Release','OPSEC II','Caption/VI','Accessibility','Records Tag']}, inventory:[] },
  checklists:[], // pre-release
  apiKeys:{ facebook:'', instagram:'', x:'', linkedin:'', openai:'', gemini:'', camogpt:'', asksage:'' }
};
let db = load(); function load(){ try{const raw=localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): (localStorage.setItem(STORAGE_KEY, JSON.stringify(def)), structuredClone(def)); }catch(e){ return structuredClone(def);} }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }

/* ================= HELPERS ================= */
const $=s=>document.querySelector(s); const $$=s=>Array.from(document.querySelectorAll(s));
function uid(){return Math.random().toString(36).slice(2,9)}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function toPct(v){return `${Math.round((v||0)*100)}%`}
function sum(o){return Object.values(o).reduce((a,b)=>a+(b||0),0)}
function todayISO(){return new Date().toISOString().slice(0,10)}
function parseLinks(txt){return (txt||'').split(/[\n,]/).map(s=>s.trim()).filter(Boolean)}
function year(d){return d.getFullYear()}
function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function quarter(d){return Math.floor(d.getMonth()/3)+1}
function quarterKey(d){return `${d.getFullYear()}-Q${quarter(d)}`}
function tfKeyOf(tf, dLike){const d = dLike? new Date(dLike): new Date(); if(tf==='M') return monthKey(d); if(tf==='Q') return quarterKey(d); return String(year(d))}

/* ================= STATE ================= */
let role=null, user=null, cur={tf:'M',key:tfKeyOf('M')};
const whoPill=$('#whoPill'); const homeBtn=$('#homeBtn'); const scrollTopBtn=$('#scrollTop');
const btnHamburger=$('#btnHamburger'); const drawer=$('#drawer'); const menuItems=$('#menuItems');
const btnSaveProgress=$('#btnSaveProgress'); const lblLoadProgress=$('#lblLoadProgress'); const inputLoadProgress=$('#inputLoadProgress');
const onboardOverlay=$('#onboardOverlay'), onboardSpotlight=$('#onboardSpotlight'), onboardText=$('#onboardText');
const onboardPrev=$('#onboardPrev'), onboardNext=$('#onboardNext'), onboardSkip=$('#onboardSkip');
const steps=[
  {id:'btnHamburger', text:'Open the main menu'},
  {id:'btnStaffLogin', text:'Sign in as staff'},
  {id:'btnAddOutput', text:'Record an output'},
  {id:'btnAddOuttake', text:'Track outtakes'},
  {id:'btnSaveGoals', text:'Save your goals'}
];
let curStep=0;

/* ================= NAV ================= */
homeBtn.addEventListener('click', ()=> show('role'));
scrollTopBtn.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));
btnSaveProgress.addEventListener('click', ()=>{
  const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pao_metrics_progress.json'; a.click();
});
inputLoadProgress.addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return; const fr=new FileReader();
  fr.onload=()=>{ try{ db=JSON.parse(fr.result); save(); alert('Progress loaded'); location.reload(); }catch(err){ alert('Invalid JSON'); } };
  fr.readAsText(f); inputLoadProgress.value='';
});
function show(which){
  ['screenRole','screenStaffAuth','screenAdminAuth','screenViewer','screenStaff','screenAdmin','modKLE','modMedia','modSocial','modBrand','modChecklist','modRpie'].forEach(id=> $('#'+id).classList.add('hide'));
  $('#askAIModule')?.classList.add('hide');
  if(which==='role'){role=null;user=null;whoPill.textContent='Not signed in'; btnHamburger.style.display='none'; btnSaveProgress.style.display='none'; lblLoadProgress.style.display='none'; $('#screenRole').classList.remove('hide'); return;}
  if(which==='viewer') $('#screenViewer').classList.remove('hide');
  if(which==='staffAuth') $('#screenStaffAuth').classList.remove('hide');
  if(which==='adminAuth') $('#screenAdminAuth').classList.remove('hide');
  if(which==='staff'){ $('#screenStaff').classList.remove('hide'); $('#askAIModule')?.classList.remove('hide'); }
  if(which==='admin'){ $('#screenAdmin').classList.remove('hide'); $('#askAIModule')?.classList.remove('hide'); }
  if(which.startsWith('mod')) $('#'+which).classList.remove('hide');
}
$('#screenRole').addEventListener('click', e=>{
  const card=e.target.closest('[data-role]'); if(!card) return;
  const r=card.dataset.role;
  if(r==='viewer'){ role='viewer'; whoPill.textContent='Viewer'; buildViewer(); show('viewer'); }
  if(r==='staff'){ role='staff'; whoPill.textContent='Staff — sign in'; populateStaffList(); show('staffAuth'); }
  if(r==='admin'){ role='admin'; whoPill.textContent='Admin — sign in'; show('adminAuth'); }
});

/* ================= AUTH ================= */
const staffUserSel=$('#staffUser');
function populateStaffList(){ staffUserSel.innerHTML=''; db.staff.forEach(s=>{const o=document.createElement('option'); o.value=s.id; o.textContent=s.name; staffUserSel.appendChild(o);}); }
$('#btnStaffLogin').addEventListener('click', ()=>{
  const id=staffUserSel.value; const pin=$('#staffPIN').value.trim(); const rec=db.staff.find(s=>s.id===id);
  if(!rec) return alert('Select your name'); if(rec.pin!==pin) return alert('Incorrect PIN');
  user={id:rec.id, name:rec.name}; whoPill.textContent=`Staff: ${rec.name}`; btnHamburger.style.display='inline-flex';
  btnSaveProgress.style.display='inline-flex'; lblLoadProgress.style.display='inline-flex';
  $('#staffPIN').value='';
  buildStaff(); show('staff');
});
$('#btnAdminLogin').addEventListener('click', ()=>{
  const pin=$('#adminPIN').value.trim(); if(pin!==db.adminPIN) return alert('Incorrect Admin PIN');
  user={id:'admin', name:'Admin'}; whoPill.textContent='Admin'; btnHamburger.style.display='inline-flex';
  btnSaveProgress.style.display='inline-flex'; lblLoadProgress.style.display='inline-flex';
  $('#adminPIN').value='';
  buildAdmin(); show('admin');
});

/* ================= HAMBURGER ================= */
function buildMenu(){
  menuItems.innerHTML='';
  const items=[
    {id:'staff', label:'My Inputs (core metrics)', dot:'grad4', group:'Staff'},
    {id:'kle', label:'Community Engagement / KLE', dot:'grad1', group:'Staff'},
    {id:'media', label:'Media Log & Queries', dot:'grad2', group:'Staff'},
    {id:'social', label:'Social Media', dot:'grad3', group:'Staff'},
    {id:'brand', label:'Branding Governance', dot:'grad4', group:'Staff'},
    {id:'check', label:'Pre‑Release Checklist', dot:'grad5', group:'Staff'},
    {id:'rpie', label:'R-PIE Planner', dot:'grad1', group:'Staff'},
    ...(role==='admin' ? [{id:'admin', label:'Admin (Goals, Staff, Templates)', dot:'grad2', group:'Admin'}] : [])
  ];
  const groups={}; const ungrouped=[];
  items.forEach(it=>{ if(it.group) (groups[it.group] ||= []).push(it); else ungrouped.push(it); });
  const createItem=it=>{
    const el=document.createElement('div');
    el.className='menuItem';
    el.innerHTML=`<div class="dot ${it.dot}"></div><div>${it.label}</div>`;
    el.addEventListener('click', ()=>{
      drawer.classList.remove('open');
      if(it.id==='staff') { buildStaff(); show('staff'); }
      if(it.id==='kle') { buildKLE(); show('modKLE'); }
      if(it.id==='media'){ buildMedia(); show('modMedia'); }
      if(it.id==='social'){ buildSocial(); show('modSocial'); }
      if(it.id==='brand'){ buildBrand(); show('modBrand'); }
      if(it.id==='check'){ buildChecklist(); show('modChecklist'); }
      if(it.id==='rpie'){ show('modRpie'); }
      if(it.id==='admin'){ buildAdmin(); show('admin'); }
    });
    return el;
  };
  Object.entries(groups).forEach(([g, list])=>{
    const wrap=document.createElement('div');
    const hdr=document.createElement('div'); hdr.className='menuGroupHeader'; hdr.textContent=g;
    const cont=document.createElement('div'); cont.className='menuGroupItems';
    list.forEach(it=> cont.appendChild(createItem(it)));
    hdr.addEventListener('click', ()=> cont.classList.toggle('hide'));
    wrap.appendChild(hdr); wrap.appendChild(cont); menuItems.appendChild(wrap);
  });
  ungrouped.forEach(it=> menuItems.appendChild(createItem(it)));
}
$('#btnHamburger').addEventListener('click', ()=>{ buildMenu(); drawer.classList.add('open'); });
$('#drawerClose, #drawerCloseBtn').addEventListener('click', ()=> drawer.classList.remove('open'));

/* ================= METRICS CORE LOGIC ================= */
function tbl(container, rows, cols){
  const t=['<table class="table"><thead><tr>']; cols.forEach(c=> t.push(`<th>${c.label}</th>`)); t.push('</tr></thead><tbody>');
  rows.forEach(r=>{ t.push('<tr>'); cols.forEach(c=> t.push(`<td>${c.render(r)}</td>`)); t.push('</tr>'); });
  t.push('</tbody></table>'); container.innerHTML=t.join('');
}
function calcProgress(tf, tfKey){
  const g=db.goals[tf];
  const entries=db.entries.filter(e=> e.tf===tf && e.tfKey===tfKey);
  const outSum=entries.filter(e=>e.type==='output').reduce((m,e)=> (m[e.data.product]=(m[e.data.product]||0)+e.data.qty, m),{});
  const otkSum=entries.filter(e=>e.type==='outtake').reduce((m,e)=> (m[e.data.kind]=(m[e.data.kind]||0)+e.data.qty, m),{});
  const outGoal=g.outputs||{}, otkGoal=g.outtakes||{};
  const outTotGoal=sum(outGoal), otkTotGoal=sum(otkGoal);
  const outTotDone=Object.entries(outGoal).reduce((S,[k,v])=> S + Math.min(outSum[k]||0, v||0), 0);
  const otkTotDone=Object.entries(otkGoal).reduce((S,[k,v])=> S + Math.min(otkSum[k]||0, v||0), 0);
  const outPct = outTotGoal? outTotDone/outTotGoal : 0;
  const otkPct = otkTotGoal? otkTotDone/otkTotGoal : 0;
  const metrics=(g.outcomes||[]).map(o=>o.name);
  const latestByMetric={};
  entries.filter(e=>e.type==='outcome').forEach(e=> latestByMetric[e.data.metric]=Math.max(latestByMetric[e.data.metric]||0, e.data.pct||0));
  const ocmPct = metrics.length? metrics.reduce((a,m)=> a + (latestByMetric[m]||0), 0)/(metrics.length*100) : 0;
  return { outPct, otkPct, ocmPct, outTotals:{done:outTotDone, goal:outTotGoal}, otkTotals:{done:otkTotDone, goal:otkTotGoal}, outBreak:{sum:outSum, goal:outGoal}, otkBreak:{sum:otkSum, goal:otkGoal}, metrics };
}

/* ===== Viewer ===== */
const tfViewerSel=$('#tfViewer'), tfViewerPick=$('#tfViewerPick');
tfViewerSel?.addEventListener('change', ()=> buildTfPicker(tfViewerPick, tfViewerSel.value, key=>{ cur.tf=tfViewerSel.value; cur.key=key; refreshViewer(); }));
function buildTfPicker(spanEl, tf, onChange){
  spanEl.innerHTML=''; const today=new Date();
  if(tf==='M'){ const i=document.createElement('input'); i.type='month'; i.className='input'; i.style.width='auto'; i.value=monthKey(today); i.addEventListener('change', ()=>onChange(i.value)); spanEl.appendChild(i); onChange(i.value); }
  if(tf==='Q'){ const y=document.createElement('input'); y.type='number'; y.className='input'; y.style.width='100px'; y.value=year(today);
    const q=document.createElement('select'); q.className='input'; q.style.width='auto'; ['Q1','Q2','Q3','Q4'].forEach((qq,i)=>{const o=document.createElement('option'); o.value=`Q${i+1}`; o.textContent=qq; q.appendChild(o);}); q.value=`Q${quarter(today)}`;
    const wrap=document.createElement('span'); wrap.appendChild(y); wrap.appendChild(q); spanEl.appendChild(wrap);
    const fire=()=>onChange(`${y.value}-${q.value}`); y.addEventListener('input',fire); q.addEventListener('change',fire); fire(); }
  if(tf==='Y'){ const y=document.createElement('input'); y.type='number'; y.className='input'; y.style.width='100px'; y.value=year(today); y.addEventListener('input', ()=>onChange(String(y.value))); spanEl.appendChild(y); onChange(String(y.value)); }
}
function buildViewer(){
  buildTfPicker(tfViewerPick, tfViewerSel.value, key=>{cur.key=key; refreshViewer();});
}
function refreshViewer(){
  const p=calcProgress(cur.tf, cur.key);
  $('#sumOutPct').textContent=toPct(p.outPct); $('#sumOutCounts').textContent=`${p.outTotals.done} / ${p.outTotals.goal}`;
  $('#sumOtkPct').textContent=toPct(p.otkPct); $('#sumOtkCounts').textContent=`${p.otkTotals.done} / ${p.otkTotals.goal}`;
  $('#sumOcmPct').textContent=toPct(p.ocmPct); $('#sumOcmCounts').textContent=p.metrics.length? `${p.metrics.length} metrics` : '—';
  const outRows=Object.keys(p.outBreak.goal).map(k=>({product:k, goal:p.outBreak.goal[k]||0, done:p.outBreak.sum[k]||0}));
  const otkRows=Object.keys(p.otkBreak.goal).map(k=>({kind:k, goal:p.otkBreak.goal[k]||0, done:p.otkBreak.sum[k]||0}));
  tbl($('#tblOutputs'), outRows, [
    {label:'Product', render:r=>r.product},{label:'Goal', render:r=>r.goal},{label:'Done', render:r=>r.done},{label:'% Complete', render:r=> toPct(r.goal? r.done/r.goal : 0)}
  ]);
  tbl($('#tblOuttakes'), otkRows, [
    {label:'Type', render:r=>r.kind},{label:'Goal', render:r=>r.goal},{label:'Done', render:r=>r.done},{label:'% Complete', render:r=> toPct(r.goal? r.done/r.goal : 0)}
  ]);
  const links=db.entries.filter(e=> e.tf===cur.tf && e.tfKey===cur.key && e.type==='output').flatMap(e=> (e.data.links||[]).map(u=>({u,who:db.staff.find(s=>s.id===e.userId)?.name||'Unknown', prod:e.data.product})));
  $('#allLinks').innerHTML = links.length? links.map(l=> `<div class="card" style="background:#0e1124;border-color:#2f355e"><a target="_blank" rel="noopener" href="${l.u}">${l.u}</a><div class="mini">by ${l.who} • ${l.prod}</div></div>`).join('') : '<div class="mini">No links submitted yet.</div>';
  function leaders(type, field){
    const arr=db.entries.filter(e=> e.tf===cur.tf && e.tfKey===cur.key && e.type===type);
    const map={}; arr.forEach(e=> map[e.userId]=(map[e.userId]||0)+(e.data[field]||0));
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id,v])=> `${db.staff.find(s=>s.id===id)?.name||'—'} (${v})`).join(', ') || '—';
  }
  $('#leadersOut').textContent=leaders('output','qty');
  $('#leadersOtk').textContent=leaders('outtake','qty');
  const metrics=(db.goals[cur.tf].outcomes||[]).map(o=>o.name); const byUser={};
  db.entries.filter(e=> e.tf===cur.tf && e.tfKey===cur.key && e.type==='outcome').forEach(e=>{ byUser[e.userId]=byUser[e.userId]||{}; byUser[e.userId][e.data.metric]=Math.max(byUser[e.userId][e.data.metric]||0, e.data.pct||0); });
  const lead=Object.entries(byUser).map(([id,obj])=>{ const avg = metrics.length? metrics.reduce((a,m)=> a+(obj[m]||0),0)/metrics.length : 0; return {name:db.staff.find(s=>s.id===id)?.name||'—', avg}; }).sort((a,b)=>b.avg-a.avg).slice(0,3).map(x=> `${x.name} (${Math.round(x.avg)}%)`).join(', ') || '—';
  $('#leadersOcm').textContent=lead;
}

/* ===== Staff ===== */
const tfStaffSel=$('#tfStaff'), tfStaffPick=$('#tfStaffPick');
tfStaffSel?.addEventListener('change', ()=> buildTfPicker(tfStaffPick, tfStaffSel.value, key=>{cur.tf=tfStaffSel.value; cur.key=key; refreshStaff();}));
function buildStaff(){
  // populate pickers
  $('#outTemplate').innerHTML = `<option value="">Select template</option>` + db.templates.outputs.map(t=>`<option>${t.name}</option>`).join('');
  $('#outProdType').innerHTML = [...db.templates.outputs.map(t=>t.name), 'Other (specify)'].map(t=>`<option>${t}</option>`).join('');
  $('#otkTemplate').innerHTML = `<option value="">Select template</option>` + db.templates.outtakes.map(t=>`<option>${t.name}</option>`).join('');
  $('#otkType').innerHTML    = [...db.templates.outtakes.map(t=>t.name), 'Other (specify)'].map(t=>`<option>${t}</option>`).join('');
  const sel=$('#ocmKey');
  sel.innerHTML = [...(db.goals[cur.tf].outcomes||[]).map(o=>o.name), 'Other (specify)'].map(o=>`<option>${o}</option>`).join('');
  buildTfPicker(tfStaffPick, tfStaffSel.value, key=>{cur.key=key; refreshStaff();});
}
$('#outProdType').addEventListener('change', ()=> $('#otherProdWrap').classList.toggle('hide', $('#outProdType').value!=='Other (specify)'));
$('#otkType').addEventListener('change', ()=> $('#otkOtherWrap').classList.toggle('hide', $('#otkType').value!=='Other (specify)'));
$('#ocmKey').addEventListener('change', ()=> $('#ocmOtherWrap').classList.toggle('hide', $('#ocmKey').value!=='Other (specify)'));
$('#ocmKey').dispatchEvent(new Event('change'));
$('#outTemplate').addEventListener('change', ()=>{
  const t=db.templates.outputs.find(o=>o.name===$('#outTemplate').value);
  if(t){
    $('#outProdType').value=t.name;
    $('#outQty').value=t.qty||1;
    $('#outLinks').value=(t.links||[]).join('\n');
    $('#outProdType').dispatchEvent(new Event('change'));
  }
});
$('#otkTemplate').addEventListener('change', ()=>{
  const t=db.templates.outtakes.find(o=>o.name===$('#otkTemplate').value);
  if(t){
    $('#otkType').value=t.name;
    $('#otkQty').value=t.qty||1;
    $('#otkNotes').value=t.notes||'';
    $('#otkType').dispatchEvent(new Event('change'));
  }
});
$('#ocmPct').addEventListener('input', e=> $('#ocmVal').textContent = e.target.value+'%');
$('#btnAddOutput').addEventListener('click', ()=>{
  if(!user) return; const type=$('#outProdType').value==='Other (specify)' ? ($('#otherProd').value.trim()||'Other') : $('#outProdType').value;
  const qty=parseInt($('#outQty').value||'0',10); if(qty<=0) return alert('Quantity must be > 0');
  const links=parseLinks($('#outLinks').value);
  db.entries.push({id:uid(), userId:user.id, type:'output', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{product:type, qty, links}});
  save(); $('#outQty').value=1; $('#outLinks').value=''; $('#otherProd').value=''; refreshStaff(); refreshViewerIf();
});
$('#btnClearOutput').addEventListener('click', ()=>{ $('#outQty').value=1; $('#outLinks').value=''; $('#otherProd').value=''; });
$('#btnAddOuttake').addEventListener('click', ()=>{
  if(!user) return; const type=$('#otkType').value==='Other (specify)' ? ($('#otkOther').value.trim()||'Other') : $('#otkType').value;
  const qty=parseInt($('#otkQty').value||'0',10); if(qty<=0) return alert('Quantity must be > 0');
  const notes=$('#otkNotes').value.trim();
  db.entries.push({id:uid(), userId:user.id, type:'outtake', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{kind:type, qty, notes}});
  save(); $('#otkQty').value=1; $('#otkNotes').value=''; $('#otkOther').value=''; refreshStaff(); refreshViewerIf();
});
$('#btnClearOuttake').addEventListener('click', ()=>{ $('#otkQty').value=1; $('#otkNotes').value=''; $('#otkOther').value=''; });
$('#btnSaveOutcome').addEventListener('click', ()=>{
  if(!user) return;
  const key=$('#ocmKey').value==='Other (specify)' ? ($('#ocmOther').value.trim()||'Other') : $('#ocmKey').value;
  if(!key) return alert('No outcome metric defined.');
  const pct=parseInt($('#ocmPct').value,10);
  db.entries.push({id:uid(), userId:user.id, type:'outcome', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{metric:key, pct}});
  save(); $('#ocmOther').value=''; refreshStaff(); refreshViewerIf();
});
function refreshStaff(){
  const mine=db.entries.filter(e=> e.userId===user?.id && e.tf===cur.tf && e.tfKey===cur.key);
  const outs=mine.filter(e=>e.type==='output').sort((a,b)=>b.ts-a.ts), otks=mine.filter(e=>e.type==='outtake').sort((a,b)=>b.ts-a.ts), ocms=mine.filter(e=>e.type==='outcome').sort((a,b)=>b.ts-a.ts);
  $('#outList').innerHTML = outs.length? outs.map(e=> {
    const links=(e.data.links||[]).map(u=> `<a href="${u}" target="_blank" rel="noopener">${u}</a>`).join('<br>');
    return `<div class="card" style="background:#0e1124;border-color:#2f355e"><div class="chip mono">${e.data.qty}×</div> <span class="chip">${e.data.product}</span>${links?'<div class="divider"></div><div class="links">'+links+'</div>':''}<div class="mini">${new Date(e.ts).toLocaleString()}</div></div>`;
  }).join('') : '<div class="mini">No outputs yet.</div>';
  $('#otkList').innerHTML = otks.length? otks.map(e=> `<div class="card" style="background:#0e1124;border-color:#2f355e"><div class="chip mono">${e.data.qty}×</div> <span class="chip">${e.data.kind}</span>${e.data.notes?'<div class="divider"></div><div class="mini">'+e.data.notes+'</div>':''}<div class="mini">${new Date(e.ts).toLocaleString()}</div></div>`).join('') : '<div class="mini">No outtakes yet.</div>';
  $('#ocmList').innerHTML = ocms.length? ocms.map(e=> `<div class="card" style="background:#0e1124;border-color:#2f355e"><span class="chip">${e.data.metric}</span><div class="divider"></div><div class="mini">${clamp(e.data.pct,0,100)}% • ${new Date(e.ts).toLocaleString()}</div></div>`).join('') : '<div class="mini">No outcomes yet.</div>';
  const p=calcProgress(cur.tf, cur.key); $('#kpiOutPct').textContent=toPct(p.outPct); $('#kpiOtkPct').textContent=toPct(p.otkPct); $('#kpiOcmPct').textContent=toPct(p.ocmPct);
}
function refreshViewerIf(){ if(!$('#screenViewer').classList.contains('hide')) refreshViewer(); }

/* ===== Admin ===== */
const tfAdminSel=$('#tfAdmin'), tfAdminPick=$('#tfAdminPick');
tfAdminSel?.addEventListener('change', ()=> buildTfPicker(tfAdminPick, tfAdminSel.value, key=>{cur.tf=tfAdminSel.value; cur.key=key; buildGoalsEditors(); refreshAdminDash();}));
function buildAdmin(){
  $('#tplOutputs').value=db.templates.outputs.map(t=>t.name).join('\n'); $('#tplOuttakes').value=db.templates.outtakes.map(t=>t.name).join('\n');
  buildTfPicker(tfAdminPick, tfAdminSel.value, key=>{cur.key=key; buildGoalsEditors(); refreshAdminDash();});
  renderStaffList();
  if(db.apiKeys){
    $('#apiKeyFacebook').value = db.apiKeys.facebook || '';
    $('#apiKeyInstagram').value = db.apiKeys.instagram || '';
    $('#apiKeyX').value = db.apiKeys.x || '';
    $('#apiKeyLinkedin').value = db.apiKeys.linkedin || '';
    $('#apiKeyOpenAI').value = db.apiKeys.openai || '';
    $('#apiKeyGemini').value = db.apiKeys.gemini || '';
    $('#apiKeyCamogpt').value = db.apiKeys.camogpt || '';
    $('#apiKeyAsksage').value = db.apiKeys.asksage || '';
  }
  $('#btnSaveApiKeys').onclick=()=>{
    if(!db.apiKeys) db.apiKeys = {};
    db.apiKeys.facebook = $('#apiKeyFacebook').value.trim();
    db.apiKeys.instagram = $('#apiKeyInstagram').value.trim();
    db.apiKeys.x = $('#apiKeyX').value.trim();
    db.apiKeys.linkedin = $('#apiKeyLinkedin').value.trim();
    save();
    alert('API Keys saved');
  };
  $('#btnSaveAiKeys').onclick=()=>{
    if(!db.apiKeys) db.apiKeys = {};
    db.apiKeys.openai = $('#apiKeyOpenAI').value.trim();
    db.apiKeys.gemini = $('#apiKeyGemini').value.trim();
    db.apiKeys.camogpt = $('#apiKeyCamogpt').value.trim();
    db.apiKeys.asksage = $('#apiKeyAsksage').value.trim();
    save();
    alert('AI API Keys saved');
  };
  $('#btnSaveAdminPIN').onclick=()=>{ const p=$('#setAdminPIN').value.trim(); if(!p) return alert('Enter a PIN'); db.adminPIN=p; save(); $('#setAdminPIN').value=''; alert('Admin PIN updated'); };
}
  $('#btnAddStaff').onclick=()=>{ const name=$('#staffName').value.trim(), pin=$('#staffNewPIN').value.trim(); if(!name||!pin) return alert('Name & PIN required'); let rec=db.staff.find(s=>s.name.toLowerCase()===name.toLowerCase()); if(rec) rec.pin=pin; else db.staff.push({id:uid(),name,pin}); save(); $('#staffName').value=''; $('#staffNewPIN').value=''; renderStaffList(); };
  $('#btnSaveTemplates').onclick=()=>{
    db.templates.outputs=$('#tplOutputs').value.split('\n').map(s=>s.trim()).filter(Boolean).map(name=>({name, qty:1, links:[]}));
    db.templates.outtakes=$('#tplOuttakes').value.split('\n').map(s=>s.trim()).filter(Boolean).map(name=>({name, qty:1, notes:''}));
    save(); alert('Templates saved');
  };
  $('#btnExport').onclick=()=>{ const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='nww_pao_metrics_export.json'; a.click(); };
  $('#importFile').onchange=(e)=>{ const f=e.target.files[0]; if(!f) return; const fr=new FileReader(); fr.onload=()=>{ try{ db=JSON.parse(fr.result); save(); alert('Imported. Reloading…'); location.reload(); }catch(err){ alert('Invalid JSON'); } }; fr.readAsText(f); };
  $('#btnReset').onclick=()=>{ if(!confirm('Wipe all local data?'))return; localStorage.removeItem(STORAGE_KEY); location.reload(); };
function renderStaffList(){
  const box=$('#staffList'); box.innerHTML=''; if(!db.staff.length){ box.innerHTML='<div class="mini">No staff yet.</div>'; return; }
  db.staff.forEach(s=>{
    const row=document.createElement('div'); row.className='card'; row.style.cssText='background:#0e1124;border-color:#2f355e;display:flex;justify-content:space-between;align-items:center;gap:8px;';
    row.innerHTML=`<div><strong>${s.name}</strong><div class="mini">id: ${s.id}</div></div><div><button class="ghost small" data-reset="${s.id}">Reset PIN</button> <button class="danger small" data-del="${s.id}">Remove</button></div>`;
    box.appendChild(row);
  });
  box.querySelectorAll('[data-reset]').forEach(b=> b.addEventListener('click', e=>{ const s=db.staff.find(x=>x.id===e.target.dataset.reset); const np=prompt('New PIN for '+s.name); if(np){ s.pin=np; save(); alert('PIN updated'); }}));
  box.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', e=>{ const id=e.target.dataset.del; if(!confirm('Remove staff?'))return; db.staff=db.staff.filter(x=>x.id!==id); save(); renderStaffList(); }));
}
function buildGoalsEditors(){
  const g=db.goals[cur.tf];
  const go=$('#goalsOutputs'); go.innerHTML=''; db.templates.outputs.forEach(t=>{
    const name=t.name;
    const val=g.outputs[name]||0; const r=document.createElement('div'); r.className='card'; r.style.cssText='background:#0e1124;border-color:#2f355e';
    r.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><div><span class="chip">${name}</span></div><div style="min-width:180px"><input type="range" min="0" max="50" value="${val}" data-name="${name}" class="goalOutRange"><div class="mini"><span class="val">${val}</span> products</div></div></div>`;
    go.appendChild(r);
  });
  const gt=$('#goalsOuttakes'); gt.innerHTML=''; db.templates.outtakes.forEach(t=>{
    const name=t.name;
    const val=g.outtakes[name]||0; const r=document.createElement('div'); r.className='card'; r.style.cssText='background:#0e1124;border-color:#2f355e';
    r.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><div><span class="chip">${name}</span></div><div style="min-width:180px"><input type="range" min="0" max="50" value="${val}" data-name="${name}" class="goalOtkRange"><div class="mini"><span class="val">${val}</span> events/qty</div></div></div>`;
    gt.appendChild(r);
  });
  renderAdminOutcomes();
  go.querySelectorAll('.goalOutRange').forEach(r=> r.addEventListener('input', e=> e.target.parentElement.querySelector('.val').textContent=e.target.value));
  gt.querySelectorAll('.goalOtkRange').forEach(r=> r.addEventListener('input', e=> e.target.parentElement.querySelector('.val').textContent=e.target.value));
}
function renderAdminOutcomes(){
  const box=$('#ocmAdminList'); const arr=db.goals[cur.tf].outcomes||[]; box.innerHTML= arr.length? '' : '<div class="mini">No outcome metrics yet.</div>';
  arr.forEach((o,idx)=>{
    const row=document.createElement('div'); row.className='card'; row.style.cssText='background:#0e1124;border-color:#2f355e;display:flex;justify-content:space-between;align-items:center;gap:8px;';
    row.innerHTML=`<div><strong>${o.name}</strong><div class="mini">${o.desc||''}</div></div><div><button class="danger small" data-del="${idx}">Remove</button></div>`;
    box.appendChild(row);
  });
  box.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', e=>{ const i=+e.target.dataset.del; db.goals[cur.tf].outcomes.splice(i,1); save(); renderAdminOutcomes(); refreshAdminDash(); }));
}
$('#btnAddOcm')?.addEventListener('click', ()=>{ const name=$('#ocmName').value.trim(); if(!name) return alert('Metric name required.'); const desc=$('#ocmDesc').value.trim(); const arr=db.goals[cur.tf].outcomes||(db.goals[cur.tf].outcomes=[]); if(arr.find(o=>o.name.toLowerCase()===name.toLowerCase())) return alert('Metric exists.'); arr.push({name,desc}); save(); $('#ocmName').value=''; $('#ocmDesc').value=''; renderAdminOutcomes(); });
$('#btnSaveGoals')?.addEventListener('click', ()=>{ const g=db.goals[cur.tf]; const outs={}; $$('.goalOutRange').forEach(r=> outs[r.dataset.name]=parseInt(r.value,10)||0 ); const otks={}; $$('.goalOtkRange').forEach(r=> otks[r.dataset.name]=parseInt(r.value,10)||0 ); g.outputs=outs; g.outtakes=otks; save(); alert('Goals saved'); refreshAdminDash(); });
function refreshAdminDash(){
  const p=calcProgress(cur.tf, cur.key);
  $('#adminOutPct').textContent=toPct(p.outPct); $('#adminOutCounts').textContent=`${p.outTotals.done} / ${p.outTotals.goal}`;
  $('#adminOtkPct').textContent=toPct(p.otkPct); $('#adminOtkCounts').textContent=`${p.otkTotals.done} / ${p.otkTotals.goal}`;
  $('#adminOcmPct').textContent=toPct(p.ocmPct); $('#adminOcmCounts').textContent=(db.goals[cur.tf].outcomes||[]).length? `${(db.goals[cur.tf].outcomes||[]).length} metrics`:'—';
  const outRows=Object.keys(p.outBreak.goal).map(k=>({product:k, goal:p.outBreak.goal[k]||0, done:p.outBreak.sum[k]||0}));
  const otkRows=Object.keys(p.otkBreak.goal).map(k=>({kind:k, goal:p.otkBreak.goal[k]||0, done:p.otkBreak.sum[k]||0}));
  tbl($('#adminTblOutputs'), outRows, [{label:'Product',render:r=>r.product},{label:'Goal',render:r=>r.goal},{label:'Done',render:r=>r.done},{label:'% Complete',render:r=> toPct(r.goal? r.done/r.goal : 0)}]);
  tbl($('#adminTblOuttakes'), otkRows, [{label:'Type',render:r=>r.kind},{label:'Goal',render:r=>r.goal},{label:'Done',render:r=>r.done},{label:'% Complete',render:r=> toPct(r.goal? r.done/r.goal : 0)}]);
}

/* ================= MODULES (Hamburger) ================= */
function buildKLE(){
  const c=$('#modKLE');
  c.innerHTML=`
    <div class="card" style="margin-top:18px;background:var(--accent4);color:#041d13">
      <h3>Community Engagement / KLE</h3>
      <div class="grid grid-3">
        <div><label>Date</label><input id="kleDate" class="input" type="date" value="${todayISO()}"></div>
        <div><label>Audience / Partner</label><input id="kleAudience" class="input" placeholder="e.g., County EM, Tribe, City Council"></div>
        <div><label>Purpose</label><input id="klePurpose" class="input" placeholder="e.g., Dam safety update"></div>
        <div><label># Attendees</label><input id="kleAtt" class="input" type="number" min="0" value="0"></div>
        <div><label>Talking Points (bullets)</label><textarea id="kleTP" rows="3" class="input" placeholder="- Point 1&#10;- Point 2"></textarea></div>
        <div><label>Commitments / Follow‑ups</label><textarea id="kleCom" rows="3" class="input" placeholder="- Action / POC / due"></textarea></div>
        <div><label>Links (comma or new line)</label><textarea id="kleLinks" rows="2" class="input" placeholder="Agenda, deck, photos…"></textarea></div>
      </div>
      <div style="display:flex; gap:10px; margin-top:10px"><button class="cta" id="btnKLEAdd">Save KLE</button></div>
    </div>
    <div class="card" style="margin-top:12px"><h3>KLE Log</h3><div id="kleList" class="scroll"></div></div>`;
  $('#btnKLEAdd').onclick=()=>{
    if(!user) return alert('Sign in');
    const rec={id:uid(), by:user.name, date:$('#kleDate').value, audience:$('#kleAudience').value.trim(), purpose:$('#klePurpose').value.trim(), attendees:parseInt($('#kleAtt').value||'0',10), talkingPoints:$('#kleTP').value, commitments:$('#kleCom').value, links:parseLinks($('#kleLinks').value), ts:Date.now()};
    db.kle.push(rec);
    db.entries.push({id:uid(), userId:user.id, type:'outtake', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{kind:'Stakeholder briefings', qty:1, notes:rec.audience}});
    if(rec.attendees>0){ db.entries.push({id:uid(), userId:user.id, type:'outtake', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{kind:'Event attendees', qty:rec.attendees, notes:rec.audience}}); }
    save();
    renderKLE();
    refreshStaff();
    refreshViewerIf();
  };
  renderKLE();
}
function renderKLE(){
  const wrap=$('#kleList'); const rows=[...db.kle].sort((a,b)=>b.ts-a.ts);
  wrap.innerHTML = rows.length? rows.map(r=>`<div class="card" style="background:#0e1124;border-color:#2f355e">
    <div class="chip">${r.date}</div> <span class="chip">${r.audience}</span> <span class="chip">${r.attendees} attendees</span>
    <div class="divider"></div><div class="mini">Purpose: ${r.purpose||'—'}</div>
    ${r.talkingPoints? `<div class="divider"></div><pre class="mini" style="white-space:pre-wrap">${r.talkingPoints}</pre>`:''}
    ${r.commitments? `<div class="divider"></div><pre class="mini" style="white-space:pre-wrap">${r.commitments}</pre>`:''}
    ${r.links?.length? `<div class="divider"></div><div class="links">${r.links.map(u=>`<a href="${u}" target="_blank">${u}</a>`).join('<br>')}</div>`:''}
    <div class="mini">Logged by ${r.by} • ${new Date(r.ts).toLocaleString()}</div></div>`).join('') : '<div class="mini">No KLE entries yet.</div>';
}

function buildMedia(){
  const c=$('#modMedia');
  c.innerHTML=`
    <div class="card" style="margin-top:18px;background:var(--accent2);color:#1d0c16">
      <h3>Media Log & Query Tracker</h3>
      <div class="grid grid-3">
        <div><label>Date</label><input id="medDate" class="input" type="date" value="${todayISO()}"></div>
        <div><label>Outlet</label><input id="medOutlet" class="input" placeholder="e.g., KXLY, Spokesman-Review"></div>
        <div><label>Reporter</label><input id="medReporter" class="input" placeholder="Name"></div>
        <div><label>Topic / Query</label><input id="medTopic" class="input" placeholder="Subject"></div>
        <div><label>Deadline</label><input id="medDeadline" class="input" type="datetime-local"></div>
        <div><label>Status</label><select id="medStatus" class="input"><option>Open</option><option>In Progress</option><option>Responded</option><option>Closed</option></select></div>
        <div><label>Spokesperson</label><input id="medSpox" class="input" placeholder="Name/Title"></div>
        <div><label>Disposition</label><input id="medDisp" class="input" placeholder="Key outcome"></div>
        <div><label>Link to Response / Story</label><input id="medLink" class="input" placeholder="https://…"></div>
        <div class="grid" style="grid-template-columns:1fr auto; align-items:end; gap:10px">
          <div><label>Notes</label><textarea id="medNotes" class="input" rows="3"></textarea></div>
          <button class="cta" id="btnMedSave">Save</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:12px"><h3>Media Queries</h3><div id="mediaList" class="scroll"></div></div>`;
  $('#btnMedSave').onclick=()=>{
    if(!user) return alert('Sign in');
    const rec={id:uid(), by:user.name, date:$('#medDate').value, outlet:$('#medOutlet').value.trim(), reporter:$('#medReporter').value.trim(), topic:$('#medTopic').value.trim(), deadline:$('#medDeadline').value, status:$('#medStatus').value, spokesperson:$('#medSpox').value.trim(), disposition:$('#medDisp').value.trim(), link:$('#medLink').value.trim(), notes:$('#medNotes').value.trim(), ts:Date.now()};
    db.media.push(rec);
    db.entries.push({id:uid(), userId:user.id, type:'outtake', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{kind:'Media engagements', qty:1, notes:rec.outlet}});
    save();
    renderMedia();
    refreshStaff();
    refreshViewerIf();
  };
  renderMedia();
}
function renderMedia(){
  const wrap=$('#mediaList'); const rows=[...db.media].sort((a,b)=>b.ts-a.ts);
  wrap.innerHTML = rows.length? rows.map(r=>`<div class="card" style="background:#0e1124;border-color:#2f355e">
    <div class="chip">${r.date}</div> <span class="chip">${r.outlet}</span> <span class="chip">${r.reporter}</span> <span class="chip">${r.status}</span>
    <div class="divider"></div><div class="mini"><strong>Topic:</strong> ${r.topic||'—'}</div>
    <div class="mini"><strong>Deadline:</strong> ${r.deadline? new Date(r.deadline).toLocaleString():'—'}</div>
    <div class="mini"><strong>Spokesperson:</strong> ${r.spokesperson||'—'}</div>
    <div class="mini"><strong>Disposition:</strong> ${r.disposition||'—'}</div>
    ${r.link? `<div class="links"><a href="${r.link}" target="_blank">Open link</a></div>`:''}
    ${r.notes? `<div class="mini">${r.notes}</div>`:''}
    <div class="mini">Logged by ${r.by} • ${new Date(r.ts).toLocaleString()}</div></div>`).join('') : '<div class="mini">No media queries yet.</div>';
}

function buildSocial(){
  const c=$('#modSocial');
  c.innerHTML=`
    <div class="card" style="margin-top:18px;background:var(--accent3);color:#281a07">
      <h3>Social Media Tracker</h3>
      <div class="grid grid-3">
        <div><label>Platform</label><select id="socPlatform" class="input"><option>Facebook</option><option>Instagram</option><option>X</option><option>LinkedIn</option><option>YouTube</option><option>Other</option></select></div>
        <div><label>Handle</label><input id="socHandle" class="input" placeholder="@USACEWallaWalla"></div>
        <div><label>Date/Time (posted)</label><input id="socDT" class="input" type="datetime-local"></div>
        <div><label>Post Type</label><select id="socType" class="input"><option>News link</option><option>Photo</option><option>Video</option><option>Thread</option><option>Story/Reel/Short</option><option>Other</option></select></div>
        <div><label>Public Link</label><input id="socLink" class="input" placeholder="https://…"></div>
        <div><label>Campaign/Focus</label><input id="socCampaign" class="input" placeholder="Deliver the Mission / EWeek"></div>
        <div><label>Reach (optional)</label><input id="socReach" class="input" type="number" min="0" value="0"></div>
        <div><label>Engagements (optional)</label><input id="socEng" class="input" type="number" min="0" value="0"></div>
        <div><label>Notes</label><input id="socNotes" class="input" placeholder="Alt text, captions, tagging…"></div>
      </div>
      <div style="display:flex; gap:10px; margin-top:10px"><button class="cta" id="btnSocSave">Save Post</button><button class="cta" id="btnSocPostApi" style="display:none; background: var(--accent2);">Post via API</button></div>
    </div>
    <div class="card" style="margin-top:12px"><h3>Social Posts</h3><div id="socList" class="scroll"></div></div>`;
  $('#btnSocSave').onclick=()=>{
    if(!user) return alert('Sign in');
    const rec={id:uid(), by:user.name, datetime:$('#socDT').value, platform:$('#socPlatform').value, handle:$('#socHandle').value.trim(), postType:$('#socType').value, link:$('#socLink').value.trim(), campaign:$('#socCampaign').value.trim(), reach:parseInt($('#socReach').value||'0',10), engagements:parseInt($('#socEng').value||'0',10), notes:$('#socNotes').value.trim(), ts:Date.now()};
    db.social.push(rec);
    const links = rec.link? [rec.link] : [];
    db.entries.push({id:uid(), userId:user.id, type:'output', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{product:'Social media posts', qty:1, links}});
    save();
    renderSocial();
    refreshStaff();
    refreshViewerIf();
  };
  const btnApi = $('#btnSocPostApi');
  if(role === 'admin' && db.apiKeys && Object.values(db.apiKeys).some(k => k)){
      btnApi.style.display = 'inline-block';
  }
  btnApi.onclick = () => {
      const platform = $('#socPlatform').value.toLowerCase();
      if(db.apiKeys && db.apiKeys[platform] && db.apiKeys[platform].length > 0){
          alert('"Posting" to '+$('#socPlatform').value+' via API... (This is a demo)');
          $('#btnSocSave').click();
      } else {
          alert('API key for '+$('#socPlatform').value+' is not configured in Admin settings, or the platform is not supported for API posting.');
      }
  };
  renderSocial();
}
function renderSocial(){
  const wrap=$('#socList'); const rows=[...db.social].sort((a,b)=>b.ts-a.ts);
  wrap.innerHTML = rows.length? rows.map(r=>`<div class="card" style="background:#0e1124;border-color:#2f355e">
    <div class="chip">${r.platform}</div> <span class="chip">${r.handle||''}</span> <span class="chip">${r.postType}</span>
    <div class="divider"></div>
    <div class="mini"><strong>When:</strong> ${r.datetime? new Date(r.datetime).toLocaleString():'—'}</div>
    <div class="mini"><strong>Campaign:</strong> ${r.campaign||'—'}</div>
    <div class="mini"><strong>Reach:</strong> ${r.reach||0} • <strong>Engagements:</strong> ${r.engagements||0}</div>
    ${r.link? `<div class="links"><a href="${r.link}" target="_blank">Open post</a></div>`:''}
    ${r.notes? `<div class="mini">${r.notes}</div>`:''}
    <div class="mini">Logged by ${r.by} • ${new Date(r.ts).toLocaleString()}</div></div>`).join('') : '<div class="mini">No posts logged yet.</div>';
}

function buildBrand(){
  const c=$('#modBrand');
  c.innerHTML=`
    <div class="card" style="margin-top:18px;background:var(--accent4);color:#041d13">
      <h3>Branding Governance</h3>
      <div class="grid grid-3">
        <div><label>USACE Brand Guide URL</label><input id="brandGuide" class="input" placeholder="https://…"></div>
        <div><label>.mil Host / Site</label><input id="brandMil" class="input" placeholder="https://www.nww.usace.army.mil/…"></div>
        <div><label>Approvals Required (comma‑sep)</label><input id="brandApprovals" class="input" placeholder="PAO Release, OPSEC II, VI Caption, Accessibility, Records"></div>
      </div>
      <div style="display:flex; gap:10px; margin-top:10px"><button class="cta" id="btnBrandSave">Save Policy</button></div>
    </div>
    <div class="card" style="margin-top:12px;background:var(--accent1);color:#06131a">
      <h3>Channel Inventory</h3>
      <div class="grid grid-3">
        <div><label>Site / Channel</label><input id="invName" class="input" placeholder="Facebook Page / Website section / DVIDS hub"></div>
        <div><label>URL</label><input id="invUrl" class="input" placeholder="https://…"></div>
        <div><label>Owner</label><input id="invOwner" class="input" placeholder="PAO / Section / POC"></div>
        <div><label>Authorized?</label><select id="invAuth" class="input"><option>Yes</option><option>No</option><option>Unknown</option></select></div>
        <div class="grid" style="grid-template-columns:1fr auto; align-items:end; gap:10px">
          <div><label>Notes</label><input id="invNotes" class="input" placeholder="Branding issues, migration, redirects…"></div>
          <button class="cta" id="btnInvAdd">Add</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:12px"><h3>Inventory</h3><div id="brandInvList" class="scroll"></div></div>`;
  $('#brandGuide').value=db.brand.policy.brandGuideUrl||''; $('#brandMil').value=db.brand.policy.milHost||''; $('#brandApprovals').value=(db.brand.policy.approvalsRequired||[]).join(', ');
  $('#btnBrandSave').onclick=()=>{ db.brand.policy.brandGuideUrl=$('#brandGuide').value.trim(); db.brand.policy.milHost=$('#brandMil').value.trim(); db.brand.policy.approvalsRequired=$('#brandApprovals').value.split(',').map(s=>s.trim()).filter(Boolean); save(); alert('Brand policy saved'); };
  $('#btnInvAdd').onclick=()=>{ const rec={id:uid(), siteOrChannel:$('#invName').value.trim(), url:$('#invUrl').value.trim(), owner:$('#invOwner').value.trim(), authorized:$('#invAuth').value, notes:$('#invNotes').value.trim(), ts:Date.now()}; if(!rec.siteOrChannel) return alert('Enter a site/channel'); db.brand.inventory.push(rec); save(); renderBrandInv(); $('#invName').value=''; $('#invUrl').value=''; $('#invOwner').value=''; $('#invNotes').value=''; };
  renderBrandInv();
}
function renderBrandInv(){
  const wrap=$('#brandInvList'); const rows=[...db.brand.inventory].sort((a,b)=>b.ts-a.ts);
  wrap.innerHTML = rows.length? rows.map(r=>`<div class="card" style="background:#0e1124;border-color:#2f355e"><div class="chip">${r.siteOrChannel}</div> <span class="chip">${r.authorized}</span>${r.url? `<div class="links"><a href="${r.url}" target="_blank">${r.url}</a></div>`:''}<div class="mini">Owner: ${r.owner||'—'}</div>${r.notes? `<div class="mini">${r.notes}</div>`:''}<div class="mini">${new Date(r.ts).toLocaleString()}</div></div>`).join('') : '<div class="mini">No inventory yet.</div>';
}

function buildChecklist(){
  const c=$('#modChecklist'); const approvals=db.brand.policy.approvalsRequired?.length? db.brand.policy.approvalsRequired.join(', ') : 'PAO Release, OPSEC II, VI Caption, Accessibility, Records';
  c.innerHTML=`
    <div class="card" style="margin-top:18px;background:var(--accent2);color:#1d0c16">
      <h3>Pre‑Release Checklist (OPSEC • VI • Release)</h3>
      <div class="mini">Required approvals: ${approvals}</div>
      <div class="grid grid-3" style="margin-top:8px">
        <div><label>Product Title</label><input id="chkTitle" class="input" placeholder="e.g., Water Safety News Release"></div>
          <div><label>Product Type</label><select id="chkType" class="input">${db.templates.outputs.map(t=>`<option>${t.name}</option>`).join('')}<option>Other</option></select></div>
        <div><label>Links (comma or new line)</label><input id="chkLinks" class="input" placeholder="Drafts, assets, DVIDS, etc."></div>
      </div>
      <div class="grid grid-2" style="margin-top:12px">
        <div class="card" style="background:#0e1124;border-color:#2f355e"><h3>OPSEC / PII</h3>
          <div><label><input type="checkbox" id="opsecOk"> OPSEC reviewed (Level II)</label></div>
          <div class="grid grid-3"><div><label>Reviewer</label><input id="opsecRev" class="input" placeholder="Name"></div><div><label>Date</label><input id="opsecDate" class="input" type="date" value="${todayISO()}"></div><div><label>PII scrubbed?</label><select id="piiOk" class="input"><option>Yes</option><option>No</option></select></div></div>
        </div>
        <div class="card" style="background:#0e1124;border-color:#2f355e"><h3>VI Standards</h3>
          <div class="grid grid-3"><div><label>Captions complete?</label><select id="viCap" class="input"><option>Yes</option><option>No</option></select></div><div><label>Metadata embedded?</label><select id="viMeta" class="input"><option>Yes</option><option>No</option></select></div><div><label>Archived to DVIDS/CORE?</label><select id="viArch" class="input"><option>Yes</option><option>No</option></select></div></div>
        </div>
        <div class="card" style="background:#0e1124;border-color:#2f355e"><h3>Accessibility</h3>
          <div class="grid grid-3"><div><label>ALT text present?</label><select id="accAlt" class="input"><option>Yes</option><option>No</option></select></div><div><label>Captions / transcripts?</label><select id="accCap" class="input"><option>Yes</option><option>No</option></select></div><div><label>Readable (contrast/size)?</label><select id="accRead" class="input"><option>Yes</option><option>No</option></select></div></div>
        </div>
        <div class="card" style="background:#0e1124;border-color:#2f355e"><h3>Release & Records</h3>
          <div class="grid grid-3"><div><label>Release authority</label><input id="relAuth" class="input" placeholder="PAO / Commander"></div><div><label>Release date</label><input id="relDate" class="input" type="date" value="${todayISO()}"></div><div><label>Records tagged?</label><select id="recTag" class="input"><option>Yes</option><option>No</option></select></div></div>
        </div>
      </div>
      <div style="display:flex; gap:10px; margin-top:12px"><button class="cta" id="btnChkSave">Save Checklist</button><button class="ghost btn" id="btnChkReady">Mark Ready for Release</button></div>
    </div>
    <div class="card" style="margin-top:12px"><h3>Checklists</h3><div id="chkList" class="scroll"></div></div>`;
  $('#btnChkSave').onclick=()=> saveChecklist('Needs Fix'); $('#btnChkReady').onclick=()=> saveChecklist('Ready'); renderChecklist();
}
function saveChecklist(status){
  if(!user) return alert('Sign in');
  const rec={ id:uid(), by:user.name, title:$('#chkTitle').value.trim(), productType:$('#chkType').value, links:parseLinks($('#chkLinks').value),
    opsec:{checked:$('#opsecOk').checked, reviewer:$('#opsecRev').value.trim(), date:$('#opsecDate').value},
    pii:{checked:($('#piiOk').value==='Yes')}, vi:{caption:($('#viCap').value==='Yes'), metadata:($('#viMeta').value==='Yes'), archived:($('#viArch').value==='Yes')},
    accessibility:{alt:($('#accAlt').value==='Yes'), captions:($('#accCap').value==='Yes'), readable:($('#accRead').value==='Yes')},
    release:{authority:$('#relAuth').value.trim(), date:$('#relDate').value}, records:{tagged:($('#recTag').value==='Yes')},
    status, ts:Date.now() };
  if(status==='Ready'){ const ok=rec.opsec.checked && rec.pii.checked && rec.vi.caption && rec.vi.metadata && rec.accessibility.alt && rec.release.authority && rec.records.tagged; if(!ok) return alert('To mark Ready: OPSEC, PII, VI caption+metadata, ALT text, Release authority, and Records tag must be set.'); }
  db.checklists.push(rec); save(); renderChecklist(); alert('Checklist saved');
}
function renderChecklist(){
  const wrap=$('#chkList'); const rows=[...db.checklists].sort((a,b)=>b.ts-a.ts);
  wrap.innerHTML = rows.length? rows.map(r=>{ const flags=[ r.opsec.checked?'OPSEC✓':'OPSEC✗', r.pii.checked?'PII✓':'PII✗', r.vi.caption?'CAP✓':'CAP✗', r.vi.metadata?'META✓':'META✗', r.accessibility.alt?'ALT✓':'ALT✗', r.records.tagged?'REC✓':'REC✗' ].join(' • ');
    return `<div class="card" style="background:#0e1124;border-color:#2f355e"><div class="chip">${r.status}</div> <span class="chip">${r.productType}</span> <span class="chip">${r.title||'Untitled'}</span><div class="divider"></div><div class="mini">${flags}</div>${r.links?.length? `<div class="links" style="margin-top:6px">${r.links.map(u=>`<a href="${u}" target="_blank">${u}</a>`).join('<br>')}</div>`:''}<div class="mini">By ${r.by} • ${new Date(r.ts).toLocaleString()}</div></div>`; }).join('') : '<div class="mini">No checklists yet.</div>';
}

function addRpieEntries(data){
  if(!user) return;
  (data.step9?.outputs || []).forEach(o=> db.entries.push({id:uid(), userId:user.id, type:'output', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{product:o, qty:1, links:[]}}));
  (data.step9?.outtakes || []).forEach(o=> db.entries.push({id:uid(), userId:user.id, type:'outtake', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{kind:o, qty:1, notes:''}}));
  (data.step9?.outcomes || []).forEach(o=> db.entries.push({id:uid(), userId:user.id, type:'outcome', tf:cur.tf, tfKey:cur.key, ts:Date.now(), data:{metric:o, pct:0}}));
  save();
}

/* ================= ONBOARDING ================= */
function startOnboard(){
  if(localStorage.getItem(ONBOARD_KEY)) return;
  onboardOverlay.classList.remove('hidden');
  document.body.classList.add('noscroll');
  curStep=0;
  showStep(curStep);
}
function showStep(i){
  const step=steps[i];
  if(!step){ closeOnboard(true); return; }
  const el=document.getElementById(step.id);
  if(!el) return;
  const r=el.getBoundingClientRect();
  onboardSpotlight.style.top=r.top+'px';
  onboardSpotlight.style.left=r.left+'px';
  onboardSpotlight.style.width=r.width+'px';
  onboardSpotlight.style.height=r.height+'px';
  onboardText.textContent=step.text;
  onboardPrev.style.display=i===0?'none':'';
  onboardNext.textContent=i===steps.length-1?'Done':'Next';
}
function closeOnboard(fin){
  onboardOverlay.classList.add('hidden');
  document.body.classList.remove('noscroll');
  if(fin || onboardSkip.checked) localStorage.setItem(ONBOARD_KEY,'1');
}
onboardNext.addEventListener('click',()=>{
  curStep++;
  if(curStep>=steps.length) closeOnboard(true); else showStep(curStep);
});
onboardPrev.addEventListener('click',()=>{ if(curStep>0){ curStep--; showStep(curStep); } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeOnboard(); });
window.addEventListener('resize',()=>{ if(!onboardOverlay.classList.contains('hidden')) showStep(curStep); });
window.addEventListener('scroll',()=>{ if(!onboardOverlay.classList.contains('hidden')) showStep(curStep); });

/* ================= INIT ================= */
(function init(){
  show('role');
  // Viewer picker default
  if(tfViewerSel){ buildTfPicker(tfViewerPick, tfViewerSel.value, key=>{cur.key=key; refreshViewer();}); }
  startOnboard();
})();

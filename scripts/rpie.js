    // ======= Curated menus =======
    const OPTIONS = {
      businessLines: [
        'Flood Risk Management','Hydropower','Navigation','Regulatory',
        'Recreation','Environmental Stewardship','Water Supply',
        'Emergency Management','Real Estate','Planning, Engineering & Construction',
        'Fish Passage/Ecosystem Restoration','Operations'
      ],
      loe: [
        'Today — Deliver the Mission',
        'Tomorrow — Innovate',
        'Always — People',
        'Safety','Readiness','Stewardship','Collaboration',
        'Transparency','Digital Modernization'
      ],
      audiences: [
        'Internal workforce','Union leadership','USACE HQ/Division',
        'Congressional delegations/staff','State elected officials',
        'County/City officials','Emergency managers','Tribal governments',
        'Irrigators/Agricultural community','Hydropower customers/Utilities (e.g., BPA)',
        'Recreation users','Commercial navigation/Ports','Environmental NGOs',
        'Media (regional)','K-12/Education','General public','Contractors/Vendors',
        'Federal partners (NOAA, USFWS, BOR, BLM, USFS, EPA)',
        'State agencies (WDFW, IDFG, ODOE, ODOE, Ecology, DEQ)'
      ],
      stakeholders: [
        'Project managers','Operations project staff','Regulatory applicants',
        'Resource agencies','Tribal fisheries','Port authorities',
        'County levee districts','Emergency operations centers',
        'Tourism bureaus','Business chambers','Academic/research partners',
        'Nonprofits/advocacy groups','Homeowners associations','Recreation concessionaires'
      ],
      outputs: [
        'News release','Media advisory','Media engagement (interviews/briefs)',
        'Web article/Feature','DVIDS upload (photo/video)','Social posts (FB/X/IG/LI)',
        'Infographic','Factsheet/One-pager','FAQ/Q&A',
        'Video package/Reel/Short','Photo set','Public meeting/Open house',
        'Stakeholder briefing deck','Talking points/Speech','Newsletter (internal/external)',
        'Public notice','Blog post','Radio PSA/Podcast guest','Op-ed/LTE',
        'Email to distro/Workforce note','Congressional update'
      ],
      outtakes: [
        'Reach/Impressions','Engagement rate','Reactions/Comments/Shares',
        'Click-through rate','Video views','Average watch time',
        'Web sessions','Time on page','Bounce rate',
        'Media pickups','Share of voice','Earned sentiment',
        'Event attendance','Questions received','Call/email volume',
        'Newsletter opens','Newsletter CTR'
      ],
      outcomes: [
        'Awareness lift','Understanding of issue/process','Trust/credibility indicators',
        'Intent to participate/comply','Permit/application completeness',
        'Public meeting civility/productivity','Rumor reduction/Misinfo countered',
        'Safety behavior adoption (e.g., life jacket use)','Preparedness actions taken',
        'Support for decisions/policies','Stakeholder collaboration actions'
      ]
    };

    // ======= Helpers: render checklist chips =======
    function renderChecklist(containerId, values){
      const box = document.getElementById(containerId);
      box.innerHTML = '';
      values.forEach(v=>{
        const id = containerId + '_' + slug(v);
        const label = document.createElement('label');
        const cb = document.createElement('input');
        const text = document.createElement('span');
        cb.type = 'checkbox'; cb.id = id; cb.value = v;
        cb.addEventListener('change', saveShadow);
        text.textContent = v;
        label.appendChild(cb); label.appendChild(text);
        box.appendChild(label);
      });
    }
    function ensureOptions(containerId, baseList, selected){
      const combined = [...baseList];
      (selected||[]).forEach(v=>{ if(!combined.includes(v)) combined.push(v); });
      renderChecklist(containerId, combined);
      (selected||[]).forEach(v=>{
        const cb = document.querySelector(`#${containerId} input[value="${cssEscape(v)}"]`);
        if(cb) cb.checked = true;
      });
    }
    function getChecklistValues(containerId){
      return [...document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)].map(i=>i.value);
    }
    function addCustom(listKey){
      const input = document.getElementById(listKey+'Add');
      const val = (input.value||'').trim();
      if(!val) return;
      const containerId = listKey+'List';
      const box = document.getElementById(containerId);
      const id = containerId + '_' + slug(val);
      if(document.getElementById(id)){ input.value=''; return; }
      const label = document.createElement('label');
      const cb = document.createElement('input'); cb.type='checkbox'; cb.id=id; cb.value=val; cb.checked=true;
      cb.addEventListener('change', saveShadow);
      const text = document.createElement('span'); text.textContent = val;
      label.appendChild(cb); label.appendChild(text);
      box.appendChild(label);
      input.value='';
      saveShadow();
    }
    function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
    function cssEscape(s){ return s.replace(/["\\]/g, '\\$&'); }

    // ======= Grab elements =======
    const els = {
      apiKey: document.getElementById('apiKey'),
      model: document.getElementById('model'),
      temperature: document.getElementById('temperature'),
      policy: document.getElementById('policy'),

      issue: document.getElementById('issue'),
      requirements: document.getElementById('requirements'),
      situation: document.getElementById('situation'),
      swotS: document.getElementById('swotS'),
      swotW: document.getElementById('swotW'),
      swotO: document.getElementById('swotO'),
      swotT: document.getElementById('swotT'),

      businessLinesList: document.getElementById('businessLinesList'),
      loeList: document.getElementById('loeList'),
      audiencesList: document.getElementById('audiencesList'),
      stakeholdersList: document.getElementById('stakeholdersList'),
      businessLinesAdd: document.getElementById('businessLinesAdd'),
      loeAdd: document.getElementById('loeAdd'),
      audiencesAdd: document.getElementById('audiencesAdd'),
      stakeholdersAdd: document.getElementById('stakeholdersAdd'),
      audienceNotes: document.getElementById('audienceNotes'),

      goals: document.getElementById('goals'),
      objectives: document.getElementById('objectives'),
      strategies: document.getElementById('strategies'),
      tactics: document.getElementById('tactics'),
      messages: document.getElementById('messages'),
      talking: document.getElementById('talking'),

      labor: document.getElementById('labor'),
      materials: document.getElementById('materials'),
      postage: document.getElementById('postage'),
      contract: document.getElementById('contract'),
      av: document.getElementById('av'),

      amTable: document.getElementById('am-table').querySelector('tbody'),
      amAdd: document.getElementById('am-add'),
      amClear: document.getElementById('am-clear'),

      tracking: document.getElementById('tracking'),

      outputsList: document.getElementById('outputsList'),
      outtakesList: document.getElementById('outtakesList'),
      outcomesList: document.getElementById('outcomesList'),
      outputsAdd: document.getElementById('outputsAdd'),
      outtakesAdd: document.getElementById('outtakesAdd'),
      outcomesAdd: document.getElementById('outcomesAdd'),
      measurementNotes: document.getElementById('measurementNotes'),

      evaluation: document.getElementById('evaluation'),

      stepper: document.getElementById('stepper'),
      progress: document.getElementById('progress'),

      generate: document.getElementById('generate'),
      save: document.getElementById('save'),
      load: document.getElementById('load'),
      exportMd: document.getElementById('exportMd'),
      exportJson: document.getElementById('exportJson'),
      clear: document.getElementById('clear'),

      status: document.getElementById('status'),
      output: document.getElementById('output'),

      tabStaff: document.getElementById('tab-staff'),
      tabAdmin: document.getElementById('tab-admin'),
      adminGate: document.getElementById('adminGate'),
      adminPanel: document.getElementById('adminPanel'),
      pin: document.getElementById('pin'),
      pinEnter: document.getElementById('pinEnter'),
      newPin: document.getElementById('newPin'),
      setPin: document.getElementById('setPin'),
      sysPrompt: document.getElementById('sysPrompt'),
      saveTemplate: document.getElementById('saveTemplate'),
      loadTemplate: document.getElementById('loadTemplate'),
      resetTemplate: document.getElementById('resetTemplate'),
      exportAll: document.getElementById('exportAll'),
      wipeAll: document.getElementById('wipeAll'),
      adminMsg: document.getElementById('adminMsg'),
    };

    // Prefill API key from parent if available
    if(window.parent && window.parent.db && window.parent.db.apiKeys?.openai){
      els.apiKey.value = window.parent.db.apiKeys.openai;
    }

    // Render curated lists on load
    ensureOptions('businessLinesList', OPTIONS.businessLines, []);
    ensureOptions('loeList', OPTIONS.loe, []);
    ensureOptions('audiencesList', OPTIONS.audiences, []);
    ensureOptions('stakeholdersList', OPTIONS.stakeholders, []);
    ensureOptions('outputsList', OPTIONS.outputs, []);
    ensureOptions('outtakesList', OPTIONS.outtakes, []);
    ensureOptions('outcomesList', OPTIONS.outcomes, []);

    document.querySelectorAll('button[data-add]').forEach(btn=>{
      btn.addEventListener('click', ()=> addCustom(btn.getAttribute('data-add')));
    });

    const stepButtons = Array.from(els.stepper.querySelectorAll('button'));
    const stepPanes = Array.from(document.querySelectorAll('.step-pane'));
    let currentStep = 1;

    function showStep(n){
      currentStep = n;
      stepPanes.forEach((pane, idx)=>{
        const active = idx === n - 1;
        if(active){
          pane.hidden = false;
          pane.removeAttribute('aria-hidden');
        } else {
          pane.hidden = true;
          pane.setAttribute('aria-hidden','true');
        }
      });
      stepButtons.forEach((btn, idx)=>{
        const selected = idx === n - 1;
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
        btn.tabIndex = selected ? 0 : -1;
      });
      els.progress.textContent = `Step ${currentStep} of 10 — ${Math.round((currentStep/10)*100)} percent complete`;
    }

    stepButtons.forEach((btn, idx)=>{
      btn.addEventListener('click', ()=> showStep(idx + 1));
      btn.addEventListener('keydown', e=>{
        if(e.key === 'ArrowRight'){
          const next = (idx + 1) % stepButtons.length;
          stepButtons[next].focus();
          showStep(next + 1);
        } else if(e.key === 'ArrowLeft'){
          const prev = (idx + stepButtons.length - 1) % stepButtons.length;
          stepButtons[prev].focus();
          showStep(prev + 1);
        }
      });
    });
    showStep(1);

    const activateTab = (which) => {
      const staff = document.getElementById('panel-inputs');
      const out = document.getElementById('panel-output');
      if(which === 'admin'){
        els.tabAdmin.classList.add('active'); els.tabAdmin.setAttribute('aria-selected', 'true');
        els.tabStaff.classList.remove('active'); els.tabStaff.setAttribute('aria-selected', 'false');
        window.scrollTo({top: out.offsetTop - 10, behavior:'smooth'});
      } else {
        els.tabStaff.classList.add('active'); els.tabStaff.setAttribute('aria-selected', 'true');
        els.tabAdmin.classList.remove('active'); els.tabAdmin.setAttribute('aria-selected', 'false');
        window.scrollTo({top: staff.offsetTop - 10, behavior:'smooth'});
      }
    };
    els.tabStaff.addEventListener('click', () => activateTab('staff'));
    els.tabAdmin.addEventListener('click', () => activateTab('admin'));

    const PIN_KEY = 'nww_rpie_admin_pin';
    const defaultPin = localStorage.getItem(PIN_KEY) || '1234';
    let adminOK = false;
    els.pinEnter.addEventListener('click', () => {
      if(els.pin.value === (localStorage.getItem(PIN_KEY) || defaultPin)){
        adminOK = true;
        els.adminPanel.style.display = 'block';
        els.adminGate.style.display = 'none';
        status('Admin unlocked', 'ok');
      } else {
        status('Invalid PIN', 'err');
      }
    });
    els.setPin.addEventListener('click', () => {
      if(!adminOK) return status('Unlock admin first', 'warn');
      if(!els.newPin.value) return status('Enter a new PIN', 'warn');
      localStorage.setItem(PIN_KEY, els.newPin.value.trim());
      status('PIN updated', 'ok');
      els.newPin.value = '';
    });

    const TPL_KEY = 'nww_rpie_template';
    const defaultTemplate = `You are a senior Public Affairs planner for USACE Walla Walla District.
Produce a clean, operational communication plan using the R-PIE 10-step model.
Align with AR 360-1/DoD PA guidance.
Include:
- Executive Summary
- Risk and Sensitivity Notes
- Goals and SMART Objectives
- Strategies and Tactics
- Key Messages (use 27-9-3)
- Audiences/Stakeholders (from curated menus)
- Lines of Effort alignments
- Action Matrix (tabular)
- Budget Summary
- Measurement Framework (Outputs, Outtakes, Outcomes)
- Evaluation and Update loop
Style: concise headings, bullet lists, table for action matrix, professional tone.
Only include facts provided in inputs.`;
    els.sysPrompt.value = localStorage.getItem(TPL_KEY) || defaultTemplate;
    els.saveTemplate.addEventListener('click', () => {
      if(!adminOK) return status('Unlock admin first', 'warn');
      localStorage.setItem(TPL_KEY, els.sysPrompt.value);
      status('Template saved', 'ok');
    });
    els.loadTemplate.addEventListener('click', () => {
      els.sysPrompt.value = localStorage.getItem(TPL_KEY) || defaultTemplate;
      status('Template loaded', 'ok');
    });
    els.resetTemplate.addEventListener('click', () => {
      if(!adminOK) return status('Unlock admin first', 'warn');
      els.sysPrompt.value = defaultTemplate;
      localStorage.setItem(TPL_KEY, defaultTemplate);
      status('Template reset', 'ok');
    });

    const addAMRow = (row={date:'',action:'',resp:'',when:'',method:''})=>{
      const tr = document.createElement('tr');
      ['date','action','resp','when','method'].forEach((key, idx)=>{
        const td = document.createElement('td');
        const inp = document.createElement('input');
        inp.value = row[['date','action','resp','when','method'][idx]] || '';
        inp.addEventListener('input', saveShadow);
        td.appendChild(inp); tr.appendChild(td);
      });
      els.amTable.appendChild(tr);
    };
    document.getElementById('am-add').addEventListener('click', ()=> addAMRow());
    document.getElementById('am-clear').addEventListener('click', ()=>{
      els.amTable.innerHTML=''; saveShadow();
    });
    addAMRow();

    function collect(){
      const am = [...els.amTable.querySelectorAll('tr')].map(tr=>{
        const tds = tr.querySelectorAll('input');
        return {date:tds[0].value, action:tds[1].value, responsibility:tds[2].value, when:tds[3].value, method:tds[4].value};
      }).filter(r => Object.values(r).some(v=>v));
      return {
        connection:{ model: els.model.value.trim(), temperature: Number(els.temperature.value||0), policy: els.policy.value.trim() },
        step1:{ issue: els.issue.value.trim(), requirements: els.requirements.value.trim() },
        step2:{ situation: els.situation.value.trim(), swot:{S:els.swotS.value.trim(),W:els.swotW.value.trim(),O:els.swotO.value.trim(),T:els.swotT.value.trim()} },
        step3:{
          businessLines: getChecklistValues('businessLinesList'),
          linesOfEffort: getChecklistValues('loeList'),
          audiences: getChecklistValues('audiencesList'),
          stakeholders: getChecklistValues('stakeholdersList'),
          audienceNotes: els.audienceNotes.value.trim()
        },
        step4:{ goals: els.goals.value.trim(), objectives: els.objectives.value.trim() },
        step5:{ strategies: els.strategies.value.trim(), tactics: els.tactics.value.trim(), messages: els.messages.value.trim(), talking: els.talking.value.trim() },
        step6:{ budget:{ labor:els.labor.value.trim(), materials:els.materials.value.trim(), postage:els.postage.value.trim(), contract:els.contract.value.trim(), av:els.av.value.trim() } },
        step7:{ actionMatrix: am },
        step8:{ tracking: els.tracking.value.trim() },
        step9:{
          outputs: getChecklistValues('outputsList'),
          outtakes: getChecklistValues('outtakesList'),
          outcomes: getChecklistValues('outcomesList'),
          notes: els.measurementNotes.value.trim()
        },
        step10:{ evaluation: els.evaluation.value.trim() },
        meta:{ savedAt: new Date().toISOString() }
      };
    }

    function toPrompt(data){
      const tpl = (localStorage.getItem('nww_rpie_template') || els.sysPrompt.value);
      const guard = data.connection.policy ? `\nAdmin guidance:\n${data.connection.policy}\n` : '';
      const amTable = data.step7.actionMatrix.map(r=>`| ${r.date||''} | ${r.action||''} | ${r.responsibility||''} | ${r.when||''} | ${r.method||''} |`).join('\n') || '';
      const budgetLines = Object.entries(data.step6.budget).filter(([k,v])=>v).map(([k,v])=>`- ${k}: ${v}`).join('\n');
      const list = (arr)=> (arr && arr.length) ? arr.map(a=>`- ${a}`).join('\n') : 'n/a';

      return `${tpl}
${guard}
Inputs:

Step 1 — Issue and Requirements
${data.step1.issue}

Requirements
${data.step1.requirements}

Step 2 — Situation and SWOT
${data.step2.situation}
SWOT
- S: ${data.step2.swot.S}
- W: ${data.step2.swot.W}
- O: ${data.step2.swot.O}
- T: ${data.step2.swot.T}

Step 3 — Stakeholders and Audiences
Business Lines
${list(data.step3.businessLines)}
Lines of Effort
${list(data.step3.linesOfEffort)}
Target Audiences
${list(data.step3.audiences)}
Stakeholders
${list(data.step3.stakeholders)}
Notes
${data.step3.audienceNotes || 'n/a'}

Step 4 — Goals and SMART Objectives
Goals
${data.step4.goals}
Objectives
${data.step4.objectives}

Step 5 — Strategies, Tactics, Key Messages, Talking Points
Strategies
${data.step5.strategies}
Tactics
${data.step5.tactics}
Key Messages
${data.step5.messages}
Talking Points
${data.step5.talking}

Step 6 — Budget
${budgetLines || 'n/a'}

Step 7 — Action Matrix
| Date | Action | Responsibility | When | Method |
|---|---|---|---|---|
${amTable || ''}

Step 8 — Implementation Tracking
${data.step8.tracking}

Step 9 — Measurement
Outputs
${list(data.step9.outputs)}
Outtakes
${list(data.step9.outtakes)}
Outcomes
${list(data.step9.outcomes)}
Notes
${data.step9.notes || 'n/a'}

Step 10 — Evaluation
${data.step10.evaluation}

Produce a complete, structured plan with clear headings and a table for the Action Matrix.`;
    }

    async function callOpenAI(prompt, model, temperature){
      const key = els.apiKey.value.trim() || (window.parent?.db?.apiKeys?.openai || '');
      if(!key){ throw new Error('API key required'); }
      const res = await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{ 'Content-Type':'application/json','Authorization':'Bearer ' + key },
        body: JSON.stringify({
          model, temperature,
          messages:[
            {role:'system', content:'You are a disciplined USACE public affairs planner who writes professional, concise, actionable plans aligned with Army policy.'},
            {role:'user', content: prompt}
          ]
        })
      });
      if(!res.ok){ throw new Error('API error: ' + (await res.text())); }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    function status(msg, kind){ els.status.textContent = msg; els.status.className = 'help ' + (kind || ''); }

    const DRAFT_KEY = 'nww_rpie_draft';
    function saveDraft(){
      localStorage.setItem(DRAFT_KEY, JSON.stringify(collect()));
      status('Draft saved locally', 'ok');
    }
    function loadDraft(){
      const raw = localStorage.getItem(DRAFT_KEY);
      if(!raw) return status('No saved draft found', 'warn');
      const d = JSON.parse(raw);
      els.model.value = d.connection?.model || 'gpt-4.1-mini';
      els.temperature.value = d.connection?.temperature ?? 0.2;
      els.policy.value = d.connection?.policy || '';
      els.issue.value = d.step1?.issue || '';
      els.requirements.value = d.step1?.requirements || '';
      els.situation.value = d.step2?.situation || '';
      els.swotS.value = d.step2?.swot?.S || '';
      els.swotW.value = d.step2?.swot?.W || '';
      els.swotO.value = d.step2?.swot?.O || '';
      els.swotT.value = d.step2?.swot?.T || '';
      ensureOptions('businessLinesList', OPTIONS.businessLines, d.step3?.businessLines || []);
      ensureOptions('loeList', OPTIONS.loe, d.step3?.linesOfEffort || []);
      ensureOptions('audiencesList', OPTIONS.audiences, d.step3?.audiences || []);
      ensureOptions('stakeholdersList', OPTIONS.stakeholders, d.step3?.stakeholders || []);
      els.audienceNotes.value = d.step3?.audienceNotes || '';
      els.goals.value = d.step4?.goals || '';
      els.objectives.value = d.step4?.objectives || '';
      els.strategies.value = d.step5?.strategies || '';
      els.tactics.value = d.step5?.tactics || '';
      els.messages.value = d.step5?.messages || '';
      els.talking.value = d.step5?.talking || '';
      els.labor.value = d.step6?.budget?.labor || '';
      els.materials.value = d.step6?.budget?.materials || '';
      els.postage.value = d.step6?.budget?.postage || '';
      els.contract.value = d.step6?.budget?.contract || '';
      els.av.value = d.step6?.budget?.av || '';
      els.amTable.innerHTML = '';
      (d.step7?.actionMatrix || []).forEach(r=>addAMRow({date:r.date,action:r.action,resp:r.responsibility,when:r.when,method:r.method}));
      if((d.step7?.actionMatrix || []).length===0) addAMRow();
      els.tracking.value = d.step8?.tracking || '';
      ensureOptions('outputsList', OPTIONS.outputs, d.step9?.outputs || []);
      ensureOptions('outtakesList', OPTIONS.outtakes, d.step9?.outtakes || []);
      ensureOptions('outcomesList', OPTIONS.outcomes, d.step9?.outcomes || []);
      els.measurementNotes.value = d.step9?.notes || '';
      els.evaluation.value = d.step10?.evaluation || '';
      status('Draft loaded', 'ok');
    }
    function clearForm(){
      localStorage.removeItem(DRAFT_KEY);
      document.querySelectorAll('input, textarea').forEach(el=>{
        if(['apiKey','model','temperature','pin','newPin','businessLinesAdd','loeAdd','audiencesAdd','stakeholdersAdd','outputsAdd','outtakesAdd','outcomesAdd'].includes(el.id)) return;
        if(el.type==='number') el.value = el.defaultValue || 0;
        else el.value = '';
      });
      document.querySelectorAll('.taglist input[type="checkbox"]').forEach(cb=> cb.checked = false);
      els.amTable.innerHTML = ''; addAMRow();
      status('Form cleared', 'ok');
    }
    function saveShadow(){ localStorage.setItem(DRAFT_KEY, JSON.stringify(collect())); }

    function exportJSON(){
      const blob = new Blob([JSON.stringify(collect(), null, 2)], {type:'application/json'});
      download(blob, 'rpie_draft.json');
    }
    function exportMarkdown(){
      const d = collect();
      const am = d.step7.actionMatrix.map(r=>`| ${r.date} | ${r.action} | ${r.responsibility} | ${r.when} | ${r.method} |`).join('\n');
      const list = (arr)=> (arr && arr.length) ? arr.map(a=>`- ${a}`).join('\n') : '- n/a';
      const md = `# Communication Plan — Draft

## Executive Summary
_TBD after generation_

## Step 1 — Issue and Requirements
${d.step1.issue || 'n/a'}

**Requirements**
${d.step1.requirements || 'n/a'}

## Step 2 — Situation and SWOT
${d.step2.situation || 'n/a'}

**SWOT**
- **S** ${d.step2.swot.S || 'n/a'}
- **W** ${d.step2.swot.W || 'n/a'}
- **O** ${d.step2.swot.O || 'n/a'}
- **T** ${d.step2.swot.T || 'n/a'}

## Step 3 — Stakeholders and Audiences
**Business Lines**
${list(d.step3.businessLines)}

**Lines of Effort**
${list(d.step3.linesOfEffort)}

**Target Audiences**
${list(d.step3.audiences)}

**Stakeholders**
${list(d.step3.stakeholders)}

**Notes**
${d.step3.audienceNotes || 'n/a'}

## Step 4 — Goals and SMART Objectives
**Goals**
${d.step4.goals || 'n/a'}

**Objectives**
${d.step4.objectives || 'n/a'}

## Step 5 — Strategies, Tactics, Messages, Talking Points
**Strategies**
${d.step5.strategies || 'n/a'}

**Tactics**
${d.step5.tactics || 'n/a'}

**Key Messages**
${d.step5.messages || 'n/a'}

**Talking Points**
${d.step5.talking || 'n/a'}

## Step 6 — Budget
- Labor: ${d.step6.budget.labor || 'n/a'}
- Materials: ${d.step6.budget.materials || 'n/a'}
- Postage: ${d.step6.budget.postage || 'n/a'}
- Contractor: ${d.step6.budget.contract || 'n/a'}
- AV/Other: ${d.step6.budget.av || 'n/a'}

## Step 7 — Action Matrix
| Date | Action | Responsibility | When | Method |
|---|---|---|---|---|
${am || '|  |  |  |  |  |'}

## Step 8 — Implementation Tracking
${d.step8.tracking || 'n/a'}

## Step 9 — Measurement
**Outputs**
${list(d.step9.outputs)}

**Outtakes**
${list(d.step9.outtakes)}

**Outcomes**
${list(d.step9.outcomes)}

**Notes**
${d.step9.notes || 'n/a'}

## Step 10 — Evaluation
${d.step10.evaluation || 'n/a'}
`;
      const blob = new Blob([md], {type:'text/markdown'});
      download(blob, 'rpie_draft.md');
    }
    function download(blob, filename){
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }

    els.exportAll.addEventListener('click', ()=>{
      if(!adminOK) return status('Unlock admin first', 'warn');
      const all = {};
      ['nww_rpie_admin_pin','nww_rpie_template','nww_rpie_draft'].forEach(k=> all[k] = localStorage.getItem(k));
      const blob = new Blob([JSON.stringify(all, null, 2)], {type:'application/json'});
      download(blob, 'nww_rpie_all.json');
    });
    els.wipeAll.addEventListener('click', ()=>{
      if(!adminOK) return status('Unlock admin first', 'warn');
      localStorage.removeItem('nww_rpie_draft');
      localStorage.removeItem('nww_rpie_template');
      status('Draft and template cleared', 'ok');
      els.adminMsg.textContent = 'Draft and template cleared. PIN retained.';
    });

    els.generate.addEventListener('click', async ()=>{
      try{
        status('Generating...', '');
        const data = collect();
        const prompt = toPrompt(data);
        const text = await callOpenAI(prompt, data.connection.model || 'gpt-4.1-mini', data.connection.temperature ?? 0.2);
        els.output.textContent = text || '(no content)';
        status('Draft ready', 'ok');
        const saved = JSON.parse(localStorage.getItem('nww_rpie_draft') || '{}');
        saved.generated = { at:new Date().toISOString(), model:data.connection.model, text };
        localStorage.setItem('nww_rpie_draft', JSON.stringify(saved));
        // Push metrics to parent app
        window.parent?.addRpieEntries?.(data);
      } catch(err){
        status(String(err.message || err), 'err');
      }
    });
    els.save.addEventListener('click', saveDraft);
    els.load.addEventListener('click', loadDraft);
    els.exportJson.addEventListener('click', exportJSON);
    els.exportMd.addEventListener('click', exportMarkdown);
    els.clear.addEventListener('click', clearForm);

    document.querySelectorAll('input, textarea').forEach(el=>{
      el.addEventListener('change', saveShadow);
    });


async function callAI(){
  const prompt=document.getElementById('aiPrompt').value.trim();
  const provider=document.getElementById('aiProvider').value;
  const providerNames={openai:'OpenAI',gemini:'Gemini',camogpt:'CamoGPT',asksage:'AskSage'};
  const key=db.apiKeys?.[provider]?.trim();
  if(!key) return alert(providerNames[provider]+" API key not set by Admin.");
  if(!prompt) return alert('Enter a prompt first.');
  try{
    let res,data;
    if(provider==='openai'){
      res=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4',messages:[{role:'user',content:prompt}]})});
      data=await res.json();
      document.getElementById('aiOutput').textContent=data.choices?.[0]?.message?.content||'No response';
    }else if(provider==='gemini'){
      res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
      data=await res.json();
      document.getElementById('aiOutput').textContent=data.candidates?.[0]?.content?.parts?.[0]?.text||'No response';
    }else if(provider==='camogpt'){
      res=await fetch('https://api.camogpt.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'camo-gpt',messages:[{role:'user',content:prompt}]})});
      data=await res.json();
      document.getElementById('aiOutput').textContent=data.choices?.[0]?.message?.content||'No response';
    }else if(provider==='asksage'){
      res=await fetch('https://api.asksage.ai/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'sage',messages:[{role:'user',content:prompt}]})});
      data=await res.json();
      document.getElementById('aiOutput').textContent=data.choices?.[0]?.message?.content||'No response';
    }
  }catch(err){
    document.getElementById('aiOutput').textContent='Error: '+err.message;
  }
}


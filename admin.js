let state = {employees:[], matches:[], predictions:[], results:[]};
let dirty = false; // pronos saisis mais pas encore sauvegardés
let currentEmployeeId = null; // salarié affiché dans le formulaire
function adminPassword(){return document.getElementById("adminPassword").value.trim();}
function authHeaders(){return {"x-admin-password":adminPassword()};}
function showMessage(text, isError){
  const ok=document.getElementById("message"); const err=document.getElementById("error");
  if(isError){err.textContent=text;err.style.display="block";ok.style.display="none";}
  else{ok.textContent=text;ok.style.display="block";err.style.display="none";}
}
async function loadData(){
  if(!adminPassword()){document.getElementById("error").textContent="Entre le mot de passe admin puis clique « Recharger les données ».";document.getElementById("error").style.display="block";return;}
  try{state=await api("get-data",{headers:authHeaders()}); renderAll(); document.getElementById("error").style.display="none";}
  catch(e){document.getElementById("error").textContent=e.message; document.getElementById("error").style.display="block";}
}
function resultByMatch(id){return state.results.find(r=>r.match_id===id);}
function predictionFor(employeeId, matchId){return state.predictions.find(p=>p.employee_id===employeeId && p.match_id===matchId);}
function renderAll(){renderResultsForm();renderPredictionForm();renderRankingPreview();}
function renderResultsForm(){document.getElementById("matchSelect").innerHTML=state.matches.map(m=>{const r=resultByMatch(m.id);return `<option value="${m.id}">${escapeHtml(`${m.id} - ${m.team_a} / ${m.team_b}${r?" ✅":""}`)}</option>`}).join("");}
function renderPredictionForm(){const s=document.getElementById("employeeSelect");s.innerHTML=state.employees.map(e=>`<option value="${e.id}">${escapeHtml(e.name)}</option>`).join("");renderEmployeePredictions();}
function onEmployeeChange(){
  if(dirty && currentEmployeeId!==null && Number(document.getElementById("employeeSelect").value)!==currentEmployeeId
     && !confirm("Tu as saisi des pronos non sauvegardés pour ce salarié. Changer de salarié va les perdre. Continuer ?")){
    // l'utilisateur annule : on revient sur le salarié courant
    document.getElementById("employeeSelect").value=String(currentEmployeeId);
    return;
  }
  renderEmployeePredictions();
}
function renderEmployeePredictions(){
  const employeeId=Number(document.getElementById("employeeSelect").value);
  const employee=state.employees.find(e=>e.id===employeeId); if(!employee)return;
  currentEmployeeId=employeeId;
  document.getElementById("predictionTitle").textContent="Pronostics de "+employee.name;
  document.getElementById("predictionRows").innerHTML=state.matches.map(m=>{const p=predictionFor(employeeId,m.id)||{};return `<tr><td>${escapeHtml(m.group_name)}</td><td>${escapeHtml(m.team_a)} - ${escapeHtml(m.team_b)}</td><td><input type="number" min="0" id="pred_${m.id}_a" value="${p.score_a ?? ""}" oninput="dirty=true"></td><td><input type="number" min="0" id="pred_${m.id}_b" value="${p.score_b ?? ""}" oninput="dirty=true"></td><td><button class="btn" onclick="savePrediction('${m.id}')">OK</button></td></tr>`}).join("");
  dirty=false;
}
async function saveResult(){
  try{await api("save-result",{method:"POST",headers:authHeaders(),body:JSON.stringify({match_id:document.getElementById("matchSelect").value,score_a:Number(document.getElementById("scoreA").value),score_b:Number(document.getElementById("scoreB").value)})});showMessage("✅ Résultat enregistré.",false);await loadData();}
  catch(e){showMessage("Erreur : "+e.message,true);}
}
async function savePrediction(matchId){
  try{
    const employeeId=Number(document.getElementById("employeeSelect").value);
    const a=document.getElementById(`pred_${matchId}_a`).value;
    const b=document.getElementById(`pred_${matchId}_b`).value;
    await api("save-predictions",{method:"POST",headers:authHeaders(),body:JSON.stringify({employee_id:employeeId,predictions:[{match_id:matchId,score_a:a===""?null:Number(a),score_b:b===""?null:Number(b)}]})});
    dirty=false;
    showMessage("✅ Prono enregistré.",false);
    await loadData();
  }catch(e){showMessage("Erreur : "+e.message,true);}
}
async function saveAllPredictionsAndNext(){
  const select=document.getElementById("employeeSelect");
  const employeeId=Number(select.value);
  const employee=state.employees.find(e=>e.id===employeeId);
  if(!employee)return showMessage("Sélectionne un salarié.",true);
  // On rassemble TOUS les pronos saisis en une seule fois (envoi atomique).
  const predictions=[];
  for(const m of state.matches){
    const a=document.getElementById(`pred_${m.id}_a`).value;
    const b=document.getElementById(`pred_${m.id}_b`).value;
    if(a===""&&b==="")continue;
    predictions.push({match_id:m.id,score_a:a===""?null:Number(a),score_b:b===""?null:Number(b)});
  }
  try{
    const res=await api("save-predictions",{method:"POST",headers:authHeaders(),body:JSON.stringify({employee_id:employeeId,predictions})});
    dirty=false;
    showMessage(`✅ ${res.saved} prono(s) enregistré(s) pour ${employee.name}.`,false);
    await loadData();
    const idx=state.employees.findIndex(e=>e.id===employeeId);
    if(idx>=0&&idx<state.employees.length-1){select.value=String(state.employees[idx+1].id);renderEmployeePredictions();}
    else{select.value=String(employeeId);renderEmployeePredictions();}
  }catch(e){showMessage("❌ Échec de l'enregistrement pour "+employee.name+" : "+e.message+" (rien n'a été sauvegardé, réessaie).",true);}
}
async function importV3Json(){
  const file=document.getElementById("importFile").files[0]; if(!file)return alert("Sélectionne ton fichier JSON."); if(!adminPassword())return alert("Entre le mot de passe admin.");
  let data; try{data=JSON.parse(await file.text());}catch(e){return showMessage("Fichier JSON illisible : "+e.message,true);}

  // Résultats : format V3 = objet {matchId:[a,b]} ; format export appli = tableau [{match_id,score_a,score_b}].
  let results=[];
  if(data.results && !Array.isArray(data.results)){
    results=Object.entries(data.results).map(([match_id,score])=>({match_id,score_a:score[0],score_b:score[1]}));
  } else if(Array.isArray(data.results)){
    results=data.results;
  }

  // Pronos : format V3 = data.pronostics ; format export appli = data.predictions (tableau plat avec employee_id).
  let pronostics=[];
  if(Array.isArray(data.pronostics)){
    pronostics=data.pronostics;
  } else if(Array.isArray(data.predictions)){
    const nameById=new Map((data.employees||[]).map(e=>[e.id,e.name]));
    const byName=new Map();
    for(const p of data.predictions){
      const name=nameById.get(p.employee_id);
      if(!name)continue; // salarié inconnu dans la sauvegarde, on saute
      if(!byName.has(name))byName.set(name,{employee:name,predictions:{}});
      byName.get(name).predictions[p.match_id]=[p.score_a,p.score_b];
    }
    pronostics=[...byName.values()];
  }

  try{
    await api("bulk-import",{method:"POST",headers:authHeaders(),body:JSON.stringify({pronostics,results})});
    await loadData();
    showMessage(`✅ Import terminé : ${pronostics.length} salarié(s) et ${results.length} résultat(s) importés.`,false);
  }catch(e){showMessage("❌ Échec de l'import : "+e.message,true);}
}
async function exportData(){try{const data=await api("export-data",{headers:authHeaders()});const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="export-prono-wc2026.json";a.click();}catch(e){alert(e.message);}}
async function renderRankingPreview(){try{const data=await api("get-ranking");document.getElementById("rankingPreview").innerHTML=data.ranking.map(r=>`<tr><td>${r.rank}</td><td>${escapeHtml(r.employee)}</td><td>${r.total}</td><td>${r.exact}</td><td>${r.good}</td></tr>`).join("");}catch(e){}}
async function syncResults(){
  if(!adminPassword())return alert("Entre le mot de passe admin.");
  const msg=document.getElementById("message");
  try{
    msg.textContent="Synchronisation en cours...";msg.style.display="block";
    const res=await api("sync-results",{method:"POST",headers:authHeaders()});
    let txt=`Synchronisation terminée : ${res.saved} résultat(s) enregistré(s) sur ${res.fetched} match(s) terminé(s) côté API.`;
    if(res.unmatched&&res.unmatched.length)txt+=`\n\nNon associés (${res.unmatched.length}) :\n- `+res.unmatched.join("\n- ");
    msg.textContent="Synchronisation terminée. Voir le détail.";
    await loadData();
    alert(txt);
  }catch(e){msg.style.display="none";alert("Erreur synchro : "+e.message);}
}
// Au chargement : pas d'appel get-data (protégé). On affiche juste l'aperçu public.
renderRankingPreview();

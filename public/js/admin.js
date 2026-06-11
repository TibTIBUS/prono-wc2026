let state = {employees:[], matches:[], predictions:[], results:[]};
function adminPassword(){return document.getElementById("adminPassword").value.trim();}
function authHeaders(){return {"x-admin-password":adminPassword()};}
async function loadData(){
  try{state=await api("get-data"); renderAll(); document.getElementById("error").style.display="none";}
  catch(e){document.getElementById("error").textContent=e.message; document.getElementById("error").style.display="block";}
}
function resultByMatch(id){return state.results.find(r=>r.match_id===id);}
function predictionFor(employeeId, matchId){return state.predictions.find(p=>p.employee_id===employeeId && p.match_id===matchId);}
function renderAll(){renderResultsForm();renderPredictionForm();renderRankingPreview();}
function renderResultsForm(){document.getElementById("matchSelect").innerHTML=state.matches.map(m=>{const r=resultByMatch(m.id);return `<option value="${m.id}">${escapeHtml(`${m.id} - ${m.team_a} / ${m.team_b}${r?" ✅":""}`)}</option>`}).join("");}
function renderPredictionForm(){const s=document.getElementById("employeeSelect");s.innerHTML=state.employees.map(e=>`<option value="${e.id}">${escapeHtml(e.name)}</option>`).join("");renderEmployeePredictions();}
function renderEmployeePredictions(){
  const employeeId=Number(document.getElementById("employeeSelect").value);
  const employee=state.employees.find(e=>e.id===employeeId); if(!employee)return;
  document.getElementById("predictionTitle").textContent="Pronostics de "+employee.name;
  document.getElementById("predictionRows").innerHTML=state.matches.map(m=>{const p=predictionFor(employeeId,m.id)||{};return `<tr><td>${escapeHtml(m.group_name)}</td><td>${escapeHtml(m.team_a)} - ${escapeHtml(m.team_b)}</td><td><input type="number" min="0" id="pred_${m.id}_a" value="${p.score_a ?? ""}"></td><td><input type="number" min="0" id="pred_${m.id}_b" value="${p.score_b ?? ""}"></td><td><button class="btn" onclick="savePrediction('${m.id}')">OK</button></td></tr>`}).join("");
}
async function saveResult(){
  try{await api("save-result",{method:"POST",headers:authHeaders(),body:JSON.stringify({match_id:document.getElementById("matchSelect").value,score_a:Number(document.getElementById("scoreA").value),score_b:Number(document.getElementById("scoreB").value)})});await loadData();}
  catch(e){alert(e.message);}
}
async function savePrediction(matchId){
  try{const employeeId=Number(document.getElementById("employeeSelect").value);const a=document.getElementById(`pred_${matchId}_a`).value;const b=document.getElementById(`pred_${matchId}_b`).value;await api("save-prediction",{method:"POST",headers:authHeaders(),body:JSON.stringify({employee_id:employeeId,match_id:matchId,score_a:a===""?null:Number(a),score_b:b===""?null:Number(b)})});await loadData();}
  catch(e){alert(e.message);}
}
async function saveAllPredictionsAndNext(){
  const select=document.getElementById("employeeSelect"); const employeeId=Number(select.value);
  try{
    for(const m of state.matches){const a=document.getElementById(`pred_${m.id}_a`).value;const b=document.getElementById(`pred_${m.id}_b`).value;if(a===""&&b==="")continue;await api("save-prediction",{method:"POST",headers:authHeaders(),body:JSON.stringify({employee_id:employeeId,match_id:m.id,score_a:a===""?null:Number(a),score_b:b===""?null:Number(b)})});}
    await loadData();
    const idx=state.employees.findIndex(e=>e.id===employeeId); if(idx>=0&&idx<state.employees.length-1){select.value=state.employees[idx+1].id;renderEmployeePredictions();}
  }catch(e){alert(e.message);}
}
async function importV3Json(){
  const file=document.getElementById("importFile").files[0]; if(!file)return alert("Sélectionne ton JSON V3."); if(!adminPassword())return alert("Entre le mot de passe admin.");
  const data=JSON.parse(await file.text());
  let results=[]; if(data.results && !Array.isArray(data.results)){results=Object.entries(data.results).map(([match_id,score])=>({match_id,score_a:score[0],score_b:score[1]}));} else if(Array.isArray(data.results)){results=data.results;}
  await api("bulk-import",{method:"POST",headers:authHeaders(),body:JSON.stringify({pronostics:data.pronostics||[],results})});
  await loadData(); alert("Import terminé.");
}
async function exportData(){try{const data=await api("export-data",{headers:authHeaders()});const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="export-prono-wc2026.json";a.click();}catch(e){alert(e.message);}}
async function renderRankingPreview(){try{const data=await api("get-ranking");document.getElementById("rankingPreview").innerHTML=data.ranking.map(r=>`<tr><td>${r.rank}</td><td>${escapeHtml(r.employee)}</td><td>${r.total}</td><td>${r.exact}</td><td>${r.good}</td></tr>`).join("");}catch(e){}}
loadData();
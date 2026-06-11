let PLAYERS = [];

async function loadRanking() {
  const error = document.getElementById("error");
  const body = document.getElementById("rankingBody");
  try {
    // get-details = classement + détail par joueur (uniquement matchs terminés).
    const data = await api("get-details");
    PLAYERS = data.players || [];
    const meta = data.meta || {};
    document.getElementById("statPlayers").textContent = meta.employees ?? PLAYERS.length;
    document.getElementById("statMatches").textContent = meta.matches ?? "-";
    document.getElementById("statResults").textContent = meta.results ?? "-";
    document.getElementById("statLeader").textContent = PLAYERS[0] ? PLAYERS[0].employee : "-";
    document.getElementById("lastUpdate").textContent = "Mise à jour : " + new Date(meta.updated_at || Date.now()).toLocaleString("fr-FR");

    renderPodium(PLAYERS);
    body.innerHTML = PLAYERS.map(row => `<tr class="clickable" onclick="openPlayer(${row.employee_id})"><td>${medal(row.rank)}</td><td><div class="name-cell"><span class="avatar">${initials(row.employee)}</span><span>${escapeHtml(row.employee)}</span></div></td><td><span class="points">${row.total}</span></td><td>${row.exact}</td><td>${row.good}</td></tr>`).join("");
    error.style.display = "none";
  } catch (e) {
    error.textContent = e.message;
    error.style.display = "block";
  }
}

function renderPodium(players) {
  const el = document.getElementById("podium");
  if (!el) return;
  const top = players.slice(0, 3);
  // On masque le podium tant qu'aucun point n'a été marqué (sinon classement par ordre alpha).
  if (top.length < 3 || top.every(p => p.total === 0)) { el.style.display = "none"; return; }
  el.style.display = "grid";
  const visualOrder = [1, 0, 2]; // 2e à gauche, 1er au centre, 3e à droite
  el.innerHTML = visualOrder.map(i => {
    const p = top[i]; if (!p) return "";
    const cls = i === 0 ? "p-gold" : i === 1 ? "p-silver" : "p-bronze";
    return `<div class="podium-spot ${cls}" onclick="openPlayer(${p.employee_id})"><div class="podium-rank">${i + 1}</div><div class="podium-avatar">${initials(p.employee)}</div><div class="podium-name">${escapeHtml(p.employee)}</div><div class="podium-points">${p.total} pts</div></div>`;
  }).join("");
}

function openPlayer(id) {
  const p = PLAYERS.find(x => x.employee_id === id); if (!p) return;
  document.getElementById("modalName").textContent = p.employee;
  document.getElementById("modalSub").textContent = `${p.total} pts · ${p.exact} score(s) exact(s) · ${p.good} bon(s) résultat(s)`;
  const rows = p.matches || [];
  document.getElementById("modalBody").innerHTML = rows.length ? rows.map(m => {
    const predTxt = (m.pred_a === null || m.pred_b === null) ? "—" : `${m.pred_a}-${m.pred_b}`;
    const ptcls = m.points === 5 ? "pt-exact" : m.points === 2 ? "pt-good" : "pt-zero";
    return `<tr><td>${escapeHtml(m.group_name)}</td><td>${escapeHtml(m.team_a)} - ${escapeHtml(m.team_b)}</td><td><strong>${m.real_a}-${m.real_b}</strong></td><td>${predTxt}</td><td><span class="ptbadge ${ptcls}">+${m.points}</span></td></tr>`;
  }).join("") : `<tr><td colspan="5" style="text-align:center">Aucun match terminé pour l'instant.</td></tr>`;
  document.getElementById("playerModal").classList.add("open");
}
function closePlayer() { document.getElementById("playerModal").classList.remove("open"); }

loadRanking();
setInterval(loadRanking, 60000);

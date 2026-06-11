async function loadRanking() {
  const error = document.getElementById("error");
  const body = document.getElementById("rankingBody");
  try {
    const data = await api("get-ranking");
    const ranking = data.ranking || [];
    document.getElementById("statPlayers").textContent = data.meta.employees;
    document.getElementById("statMatches").textContent = data.meta.matches;
    document.getElementById("statResults").textContent = data.meta.results;
    document.getElementById("statLeader").textContent = ranking[0] ? ranking[0].employee : "-";
    document.getElementById("lastUpdate").textContent = "Mise à jour : " + new Date(data.meta.updated_at).toLocaleString("fr-FR");
    body.innerHTML = ranking.map(row => `<tr><td>${medal(row.rank)}</td><td><div class="name-cell"><span class="avatar">${initials(row.employee)}</span><span>${escapeHtml(row.employee)}</span></div></td><td><span class="points">${row.total}</span></td><td>${row.exact}</td><td>${row.good}</td></tr>`).join("");
    error.style.display = "none";
  } catch (e) {
    error.textContent = e.message;
    error.style.display = "block";
  }
}
loadRanking();
setInterval(loadRanking, 60000);
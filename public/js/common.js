async function api(path, options = {}) {
  const res = await fetch("/.netlify/functions/" + path, {...options, headers:{"Content-Type":"application/json", ...(options.headers || {})}});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erreur serveur");
  return data;
}
function initials(name){return name.split(/\s+/).map(p=>p[0]).join("").slice(0,2).toUpperCase();}
function medal(rank){if(rank===1)return `<span class="medal gold-medal">1</span>`; if(rank===2)return `<span class="medal silver-medal">2</span>`; if(rank===3)return `<span class="medal bronze-medal">3</span>`; return `<span class="rank">${rank}</span>`;}
function escapeHtml(value){return String(value ?? "").replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[s]));}
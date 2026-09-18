const STORAGE_KEY = "as2_disaster_alerts_v1";

const starterAlerts = [
  {id: crypto.randomUUID(), type:"Flood", severity:"High", location:"Riverfront Zone", zone:"North Zone", message:"Heavy rainfall may cause rapid water-level rise. Avoid low-lying roads and move toward designated safe areas.", time:new Date(Date.now()-18*60000).toISOString()},
  {id: crypto.randomUUID(), type:"Heatwave", severity:"Medium", location:"Central District", zone:"Central Zone", message:"High temperatures are expected. Stay hydrated, avoid prolonged midday exposure and check on vulnerable people.", time:new Date(Date.now()-52*60000).toISOString()},
  {id: crypto.randomUUID(), type:"Cyclone", severity:"Low", location:"Coastal Sector", zone:"West Zone", message:"Monitor official updates and secure loose outdoor objects. This demonstration alert is informational.", time:new Date(Date.now()-95*60000).toISOString()}
];

let alerts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || starterAlerts;
save();

const $ = id => document.getElementById(id);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtTime = iso => new Date(iso).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
const fmtDate = iso => new Date(iso).toLocaleString([], {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"});
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); }
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2600); }

function icon(type){
  return ({Flood:"🌊",Cyclone:"🌀",Earthquake:"🌍",Heatwave:"🌡️",Wildfire:"🔥"})[type] || "🚨";
}

function render(){
  const filter=$("publicFilter").value;
  const filtered=alerts.filter(a=>filter==="all"||a.type===filter).sort((a,b)=>new Date(b.time)-new Date(a.time));
  $("activeCount").textContent=alerts.length;
  $("highCount").textContent=alerts.filter(a=>a.severity==="High").length;
  $("zoneCount").textContent=new Set(alerts.map(a=>a.zone)).size;
  $("lastUpdate").textContent=alerts.length?fmtTime(filtered[0]?.time || alerts[0].time):"—";
  $("syncTime").textContent=new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});

  $("publicAlerts").innerHTML=filtered.length ? filtered.map(a=>`
    <article class="alert-card ${a.severity.toLowerCase()}">
      <div class="alert-top">
        <div class="alert-title">${icon(a.type)} ${escapeHTML(a.type)} Warning</div>
        <span class="severity ${a.severity.toLowerCase()}">${escapeHTML(a.severity)} PRIORITY</span>
      </div>
      <div class="alert-meta">📍 ${escapeHTML(a.location)} • ${escapeHTML(a.zone)} • ${fmtDate(a.time)}</div>
      <p class="alert-message">${escapeHTML(a.message)}</p>
    </article>`).join("") : `<div class="empty">No alerts match this filter.</div>`;

  $("authorityAlerts").innerHTML=alerts.length ? alerts.sort((a,b)=>new Date(b.time)-new Date(a.time)).map(a=>`
    <div class="management-item">
      <div>
        <div class="alert-title">${icon(a.type)} ${escapeHTML(a.type)} • ${escapeHTML(a.severity)}</div>
        <div class="alert-meta">${escapeHTML(a.location)} • ${escapeHTML(a.zone)} • ${fmtDate(a.time)}</div>
        <div>${escapeHTML(a.message)}</div>
      </div>
      <div class="management-actions"><button class="danger-btn" data-delete="${a.id}">Delete</button></div>
    </div>`).join("") : `<div class="empty">No published alerts.</div>`;

  const zones=["North Zone","East Zone","South Zone","West Zone","Central Zone"];
  $("zoneStatus").innerHTML=zones.map(z=>{
    const zs=alerts.filter(a=>a.zone===z);
    const high=zs.some(a=>a.severity==="High"), med=zs.some(a=>a.severity==="Medium");
    const risk=high?"HIGH":med?"MEDIUM":"LOW";
    return `<div class="zone-row"><div><b>${z}</b><b class="risk-${risk.toLowerCase()}">${risk}</b></div><small>${zs.length} active alert${zs.length===1?"":"s"}</small></div>`;
  }).join("");

  const high=alerts.find(a=>a.severity==="High");
  const banner=$("publicAlertBanner");
  if(high){
    banner.classList.remove("hidden");
    banner.innerHTML=`<strong>🚨 ${escapeHTML(high.type)} HIGH PRIORITY:</strong> ${escapeHTML(high.location)} — ${escapeHTML(high.message)}`;
  } else banner.classList.add("hidden");

  document.querySelectorAll(".zone").forEach(el=>{
    const z=el.dataset.zone;
    el.classList.toggle("pulse", alerts.some(a=>a.zone===z && a.severity==="High"));
  });
}

function switchView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  $(view+"View").classList.add("active");
  document.querySelector(`[data-view="${view}"]`).classList.add("active");
  $("modeBtn").textContent=view==="authority"?"Public Mode":"Authority Mode";
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));
$("modeBtn").addEventListener("click",()=>switchView($("authorityView").classList.contains("active")?"public":"authority"));
$("publicFilter").addEventListener("change",render);

$("alertForm").addEventListener("submit",e=>{
  e.preventDefault();
  const a={
    id:crypto.randomUUID(),
    type:$("type").value,
    severity:$("severity").value,
    location:$("location").value.trim(),
    zone:$("zone").value,
    message:$("message").value.trim(),
    time:new Date().toISOString()
  };
  alerts.unshift(a); save(); render();
  e.target.reset();
  toast("Alert published to the public demo feed.");
  switchView("public");
});

$("demoAlertBtn").addEventListener("click",()=>{
  const demo={
    id:crypto.randomUUID(), type:"Earthquake", severity:"High",
    location:"Central District", zone:"Central Zone",
    message:"Demonstration alert: move away from damaged structures and follow official emergency instructions.",
    time:new Date().toISOString()
  };
  alerts.unshift(demo); save(); render(); toast("Demo high-priority alert published.");
});

$("clearAlerts").addEventListener("click",()=>{
  if(confirm("Clear all alerts from this browser's demo data?")){
    alerts=[]; save(); render(); toast("All demo alerts cleared.");
  }
});

document.addEventListener("click",e=>{
  const del=e.target.closest("[data-delete]");
  if(del){
    alerts=alerts.filter(a=>a.id!==del.dataset.delete); save(); render(); toast("Alert removed.");
  }
  const resource=e.target.closest("[data-resource]");
  if(resource){
    const type=resource.dataset.resource;
    if(type==="shelter") switchView("map");
    else if(type==="instructions") toast("Safety: stay informed, avoid danger zones, follow official instructions.");
    else toast(`Demo emergency resource: ${type}`);
  }
});

render();

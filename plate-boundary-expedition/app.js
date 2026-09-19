(() => {
  const { MISSIONS, gradeReport } = window.PlateModel;
  const canvas = document.querySelector('#globe');
  const ctx = canvas.getContext('2d');
  const state = { missionIndex: 0, score: 0, rotation: 0, tilt: -.14, dragging: false, lastX: 0, collected: new Set(), cutaway: false };
  const colors = { quakes: '#ffd166', volcanoes: '#ef476f', age: '#8ecae6', motion: '#b7e4c7' };

  function mission() { return MISSIONS[state.missionIndex]; }
  function project(lon, lat, radius) {
    const lambda = (lon + state.rotation) * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    let x = Math.cos(phi) * Math.sin(lambda);
    let y = -Math.sin(phi);
    let z = Math.cos(phi) * Math.cos(lambda);
    const y2 = y * Math.cos(state.tilt) - z * Math.sin(state.tilt);
    const z2 = y * Math.sin(state.tilt) + z * Math.cos(state.tilt);
    const scale = 1 + z2 * .13;
    return { x: canvas.width / 2 + x * radius * scale, y: canvas.height / 2 + y2 * radius * scale, z: z2 };
  }

  function drawGlobe() {
    const w = canvas.width, h = canvas.height, r = Math.min(w, h) * .37;
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w*.43,h*.36,r*.12,w/2,h/2,r*1.12);
    glow.addColorStop(0,'#4ca3c7'); glow.addColorStop(.65,'#0d5d75'); glow.addColorStop(1,'#032b39');
    ctx.beginPath(); ctx.arc(w/2,h/2,r,0,Math.PI*2); ctx.fillStyle=glow; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(w/2,h/2,r,0,Math.PI*2); ctx.clip();
    for (let lat=-60; lat<=60; lat+=30) drawCurve(Array.from({length:73},(_,i)=>project(i*5-180,lat,r)),'rgba(255,255,255,.13)',1);
    for (let lon=-150; lon<=180; lon+=30) drawCurve(Array.from({length:49},(_,i)=>project(lon,i*2.5-60,r)),'rgba(255,255,255,.1)',1);
    const tilt = mission().boundaryTilt;
    const boundary = Array.from({length:75},(_,i)=>project(tilt + Math.sin(i*.25)*4, i*2.2-80,r));
    drawCurve(boundary.filter(p=>p.z>-.08),'#ffd166',5);
    ctx.globalAlpha=.28;
    ctx.fillStyle=mission().colors[0]; ctx.fillRect(w/2-r,h/2-r,r,h);
    ctx.fillStyle=mission().colors[1]; ctx.fillRect(w/2,h/2-r,r,h);
    ctx.globalAlpha=1;
    if (state.cutaway) drawCutaway(w,h,r);
    const stations = mission().stations.map(s=>({s,p:project(s.lon,s.lat,r)})).sort((a,b)=>a.p.z-b.p.z);
    for (const {s,p} of stations) if (p.z>-.12) {
      const enabled = document.querySelector(`input[value="${s.layer}"]`).checked;
      ctx.beginPath(); ctx.arc(p.x,p.y,enabled?10:6,0,Math.PI*2);
      ctx.fillStyle=enabled?colors[s.layer]:'#78909c'; ctx.fill();
      ctx.lineWidth=3; ctx.strokeStyle=state.collected.has(s.id)?'#fff':'rgba(0,0,0,.35)'; ctx.stroke();
      if (enabled) { ctx.fillStyle='#fff'; ctx.font='700 14px system-ui'; ctx.fillText(s.title,p.x+14,p.y+5); }
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(w/2,h/2,r,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,.38)'; ctx.lineWidth=3; ctx.stroke();
    document.querySelector('#coordinate-readout').textContent=`Rotation ${Math.round(state.rotation)}°`;
  }
  function drawCurve(points,color,width){ ctx.beginPath(); let started=false; for(const p of points){ if(p.z<-.15){started=false;continue;} if(!started){ctx.moveTo(p.x,p.y);started=true;}else ctx.lineTo(p.x,p.y);} ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(); }
  function drawCutaway(w,h,r){
    ctx.fillStyle='rgba(4,18,25,.78)'; ctx.fillRect(w/2,h/2,w/2,r);
    ctx.beginPath(); ctx.moveTo(w/2,h/2); ctx.lineTo(w/2+r,h/2+r*.6); ctx.lineTo(w/2,h/2+r*.75); ctx.closePath(); ctx.fillStyle='#d67b45'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(w/2,h/2); ctx.lineTo(w/2-r*.65,h/2+r*.2); ctx.lineTo(w/2,h/2+r*.45); ctx.closePath(); ctx.fillStyle='#754d3b'; ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='700 16px system-ui'; ctx.fillText(mission().type==='convergent'?'Subducting slab':mission().type==='divergent'?'Rising mantle and new crust':'Crust sliding past crust',w/2+12,h/2+r*.68);
  }

  function renderMission() {
    const m=mission(); state.collected.clear(); state.cutaway=false;
    document.querySelector('#mission-heading').textContent=`Mission ${state.missionIndex+1}: ${m.name}`;
    document.querySelector('#mission-brief').textContent=m.brief;
    document.querySelector('#mission-count').textContent=`Mission ${state.missionIndex+1} of ${MISSIONS.length}`;
    document.querySelector('#score').textContent=`Score: ${state.score}`;
    document.querySelector('#progress-bar').style.width=`${state.missionIndex/MISSIONS.length*100}%`;
    document.querySelector('#claim').value='';
    document.querySelectorAll('input[type="radio"]').forEach(i=>i.checked=false);
    document.querySelector('#toggle-cutaway').setAttribute('aria-pressed','false');
    document.querySelector('#feedback').className='feedback';
    document.querySelector('#feedback').textContent='Collect evidence from at least three stations before submitting your report.';
    document.querySelector('#evidence-list').innerHTML=m.stations.map(s=>`<button class="station-button" data-station="${s.id}" data-collected="false"><strong>${s.title}</strong><span>Requires ${layerName(s.layer)} layer</span></button>`).join('');
    document.querySelector('#action-choices').innerHTML=m.actions.map(([v,t])=>`<label><input type="radio" name="action" value="${v}"> ${t}</label>`).join('');
    drawGlobe();
  }
  function layerName(k){ return ({quakes:'Earthquake depth',volcanoes:'Volcanoes',age:'Crust age',motion:'Plate motion'})[k]; }
  document.querySelector('#evidence-list').addEventListener('click',e=>{
    const button=e.target.closest('[data-station]'); if(!button)return;
    const s=mission().stations.find(x=>x.id===button.dataset.station);
    if(!document.querySelector(`input[value="${s.layer}"]`).checked){ document.querySelector('#feedback').textContent=`Turn on the ${layerName(s.layer)} layer first.`; return; }
    state.collected.add(s.id); button.dataset.collected='true'; button.querySelector('span').textContent=s.observation;
    document.querySelector('#feedback').textContent=`Evidence collected: ${state.collected.size} of ${mission().stations.length}.`;
    drawGlobe();
  });
  document.querySelectorAll('input[type="checkbox"]').forEach(i=>i.addEventListener('change',drawGlobe));
  document.querySelectorAll('[data-rotate]').forEach(b=>b.addEventListener('click',()=>{state.rotation+=Number(b.dataset.rotate);drawGlobe();}));
  document.querySelector('#toggle-cutaway').addEventListener('click',e=>{state.cutaway=!state.cutaway;e.currentTarget.setAttribute('aria-pressed',String(state.cutaway));drawGlobe();});
  canvas.addEventListener('pointerdown',e=>{state.dragging=true;state.lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!state.dragging)return;state.rotation+=(e.clientX-state.lastX)*.4;state.lastX=e.clientX;drawGlobe();});
  canvas.addEventListener('pointerup',()=>state.dragging=false);
  canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){state.rotation+=e.key==='ArrowLeft'?-8:8;drawGlobe();e.preventDefault();}});
  document.querySelector('#submit-report').addEventListener('click',()=>{
    const b=document.querySelector('input[name="boundary"]:checked')?.value;
    const a=document.querySelector('input[name="action"]:checked')?.value;
    const result=gradeReport(mission(),[...state.collected],b,a,document.querySelector('#claim').value);
    const feedback=document.querySelector('#feedback');
    if(result.passed){ state.score+=result.points; feedback.className='feedback success';
      if(state.missionIndex<MISSIONS.length-1){ feedback.textContent=`Mission complete — ${result.points} points. Loading the next region…`; setTimeout(()=>{state.missionIndex++;renderMission();},900); }
      else { document.querySelector('#progress-bar').style.width='100%'; feedback.textContent=`Expedition complete! Final score: ${state.score}. You used multiple evidence types to explain all three boundary settings.`; document.querySelector('#submit-report').disabled=true; }
    } else { feedback.className='feedback error'; const needs=[]; if(!result.enoughEvidence)needs.push('collect at least three evidence cards'); if(!result.classificationCorrect)needs.push('reconsider the boundary type'); if(!result.actionCorrect)needs.push('match the action to the hazards'); if(!result.claimReady)needs.push('write an explanation of at least eight words'); feedback.textContent=`Revise your report: ${needs.join('; ')}.`; }
  });
  document.querySelector('#reset-mission').addEventListener('click',renderMission);
  function resize(){const dpr=Math.min(window.devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();canvas.width=Math.max(520,Math.round(rect.width*dpr));canvas.height=Math.round(Math.max(380,rect.width*.66)*dpr);drawGlobe();}
  new ResizeObserver(resize).observe(canvas); renderMission();
})();

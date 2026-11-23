/** Element City v5.1 — app shell: HUD, saving, input wiring and the six-investigation campaign. */
import {attachTabletControls,InputMixer} from './controls.js?v=5.1.0';
import {POWER_POINTS,POWER_TESTS,SAMPLE_IDS,powerReady,powerStage,measureSample,connectTerminal,benchDone} from './power-scene.js?v=5.1.0';
import {PRACTICE,checkPractice} from './practice.js?v=5.1.0';
import {CityWorld as FlatWorld,stations,buildings} from './world.js?v=5.1.0';
import {CityWorld,toKmh,DROP_ZONES} from './world3d.js?v=5.1.0';
import {ELEMENTS,CATEGORIES,TABLE_NOTE,REFERENCE_CONDITIONS} from './elements.js?v=5.1.0';
import {Radio,STATIONS} from './radio.js?v=5.1.0';
import {SAVE_KEY,freshState,readSave,writeSave,MISSIONS} from './core.js?v=5.1.0';
import {COURIER,validateDelivery,describe,GATES,GATE_SLOTS,gateCrossing,validateGate,MATERIALS,validateClass,validatePower,
  BEHAVIOR,SHOW_ROUNDS,WHY_OPTIONS,validateShow,validateWhy,UI_SCALE,READINGS,uiOf,validateSort,SURVEY_QUESTIONS,validateSurvey,
  RELAYS,ionCharge,validateCharge,validateRatio,formulaFor,ANALOGY,COMPOUND,pretty,repFor,el} from './campaign.js?v=5.1.0';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const DEBUG=new URLSearchParams(location.search).has('debug');
let storage;try{storage=window.localStorage}catch{}
let state=readSave(storage),modal=null,returnTo=null,worldInfo={},lastSave=0,toastTimer,audioCtx,selectedElement=29,tabletControls=null,allInputs=null,streetPoint=null,streetMessage='',streetStamp='',practiceId=null,nearPoint=null,lastPos=null,engineSound=null,bannerTimer,popTimer;
const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const colors={alkali:'#694f37',alkaline:'#655b34',transition:'#285264','post-transition':'#3d5162',metalloid:'#4b5269',nonmetal:'#2e6359',halogen:'#5f4663',noble:'#5a506d',lanthanide:'#4e5157',actinide:'#615150',unknown:'#38484f'};
const current=()=>MISSIONS.find(m=>m.id===state.active);
const next=()=>MISSIONS.find(m=>!state.completed.includes(m.id));
const missionNo=m=>String(MISSIONS.indexOf(m)+1).padStart(2,'0');
const W=()=>state.work;
function touchUI(){const t=state.settings.touch;if(t===true||t===false)return t;return matchMedia('(pointer:coarse)').matches||(navigator.maxTouchPoints||0)>0}

// ------------------------------------------------------------------ world
const callbacks={
  onQuality:q=>toast(`Graphics set to ${q==='low'?'Battery saver':'Balanced'} for smoother play. You can change this in Pause.`),
  onContextLost:()=>openModal('recovery','<h2>Graphics paused</h2><p>Your device paused the 3D view. Reload to restore your saved investigation.</p><button class="primary" data-act="reload">Reload game</button>'),
  onWorldAction:id=>pointAction(id),
  onInteract:id=>interactStation(id),
  onChange:info=>{try{if(info.district&&worldInfo.district&&info.district!==worldInfo.district&&state.started&&!modal)districtPop(info.district);worldInfo=info;
    state.walked=Math.max(state.walked,info.walked||0);state.driven=Math.max(state.driven,info.driven||0);
    if(state.started&&!modal){checkTutorial();checkRaceGate();checkSurveyPickup();nearPoint=findNearPoint()}lastPos={x:info.x,y:info.y};
    updateHUD();renderStreet();updateEngineSound();updateRadio();if(Date.now()-lastSave>7000&&state.started){save();lastSave=Date.now()}}catch(err){console.error(err)}},
  onDiscover:id=>{if(!state.discoveries.includes(id)){state.discoveries.push(id);record('Element coin found',`You found the ${id} coin. Exploration is separate from the investigations.`);toast('Element coin found: +10 REP');save()}}
};
let world;
try{if(new URLSearchParams(location.search).has('2d'))throw new Error('2D view requested');world=new CityWorld($('#world'),$('#minimap'),callbacks)}
catch(error){console.warn('3D unavailable; using overhead view.',error);const old=$('#world'),replacement=old.cloneNode();old.replaceWith(replacement);world=new FlatWorld(replacement,$('#minimap'),callbacks)}
world.onQuality=callbacks.onQuality;
window.addEventListener('error',e=>{console.error(e.error);$('#boot-error').textContent='Something interrupted the game. Reload to return to your last saved progress.'});
if(state.position)world.loadPosition(state.position);

function save(){state.position=world.getState();const ok=writeSave(storage,state);return ok}
function scene(){const m=current();if(!m||state.step<1)return null;const w=W();
  if(m.id==='courier')return {kind:'courier'};
  if(m.id==='race'){const g=GATES[w.gate||0];return g?{kind:'race',slot:(w.slot||0)%GATE_SLOTS.length,a:g.a,b:g.b}:null}
  if(m.id==='survey'&&!surveyCollected())return {kind:'survey',collected:{...(w.collected||{})}};
  if(m.id==='ions')return {kind:'relay',solved:{...(w.solved||{})}};
  return null}
function trackedTarget(){const m=current();if(m&&state.step>0){if(m.id==='survey'&&surveyCollected())return 'survey';if(m.id==='show'||m.id==='power')return m.station}return state.active||next()?.id||'hq'}
const radio=new Radio();radio.volume=state.settings.musicVolume??.6;
function radioWanted(){return state.started&&modal!=='title'&&(state.settings.station??-1)>=0&&(!!worldInfo.inVehicle||!!state.settings.radioOnFoot)&&!document.hidden}
function updateRadio(){const st=state.settings.station??-1;radio.station=st;radio.setDuck(modal?.3:1);if(radioWanted()){if(!radio.playing&&radio.ctx)radio.start()}else if(radio.playing)radio.stop();
  const chip=$('#radio');chip.classList.toggle('hidden',!state.started||modal==='title'||!(worldInfo.inVehicle||state.settings.radioOnFoot));chip.classList.toggle('on',st>=0);chip.style.setProperty('--station',STATIONS[st]?.color||'#ffffff55');$('#radio-label').textContent=st>=0?STATIONS[st].name:'RADIO OFF'}
function cycleRadio(){const s=state.settings;s.station=((s.station??-1)+2)%(STATIONS.length+1)-1;radio.volume=s.musicVolume??.6;radio.tune(s.station);if(!radioWanted())radio.stop();const st=STATIONS[s.station];toast(st?`📻 ${st.name} · ${st.tag}`:'📻 Radio off',2600);updateRadio();save()}
function sync(){world.updateConfig({powerState:{...W(),enabled:state.active==='power'&&state.step>0},scene:scene(),cameraSensitivity:state.settings.cameraSensitivity||1,autoCamera:state.settings.autoCamera!==false,
  paused:!!modal||!state.started,reducedMotion:state.settings.reducedMotion,completed:state.completed,activeMission:trackedTarget(),touchMode:touchUI(),skin:state.completed.length>=3?'amber':'teal',
  quality:state.settings.quality||'auto',guideLine:state.settings.guideLine!==false,titleCam:modal==='title'});
  document.body.classList.toggle('playing',state.started&&!modal);updateHUD();renderStreet();updateEngineSound();updateRadio()}

// ------------------------------------------------------------------ feedback helpers
function beep(kind='tap'){if(!state.settings.volume)return;try{audioCtx||=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';
  o.frequency.value=kind==='success'?660:kind==='wrong'?180:420;g.gain.setValueAtTime(state.settings.volume*.12,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.2);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.21)}catch{}}
function toast(s,ms=4500){$('#toast').textContent=s;$('#toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.add('hidden'),ms)}
function banner(kicker,title,sub='',cls=''){const b=$('#banner');$('#banner-kicker').textContent=kicker;$('#banner-title').textContent=title;$('#banner-sub').textContent=sub;b.className='banner '+cls;void b.offsetWidth;clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>b.classList.add('hidden'),3300)}
function districtPop(name){const d=$('#district-pop');d.textContent=name;d.classList.remove('hidden');d.style.animation='none';void d.offsetWidth;d.style.animation='';clearTimeout(popTimer);popTimer=setTimeout(()=>d.classList.add('hidden'),3100)}
function record(title,text){state.journal.push({title,text});if(state.journal.length>80)state.journal.shift()}
/** Track first-try accuracy per question. Wrong attempts never add points. */
function attempt(key,ok){const w=W();w.tries||={};const first=!(key in w.tries);w.tries[key]=(w.tries[key]||0)+1;if(ok&&first)state.firstTry=(state.firstTry||0)+1;if(!ok)state.revisions++;beep(ok?'success':'wrong');return first}
function hintText(key,list){state.hints[key]=Math.min((state.hints[key]||0)+1,list.length);const n=state.hints[key];save();return `Hint ${n}/${list.length}: ${list[n-1]}`}
function setFeedback(text,wrong=false){const el=$('#feedback');if(el){el.textContent=text;el.className='feedback'+(wrong?' wrong':'')}}

// ------------------------------------------------------------------ modal shell
function openModal(type,html,cls=''){modal=type;clearInputs();$('#modal-root').innerHTML=`<div class="scrim ${type==='title'?'title-screen':''}"><section role="dialog" aria-modal="true" aria-label="${esc(type)}" class="dialog ${cls}" tabindex="-1">${html}</section></div>`;sync();requestAnimationFrame(()=>$('.dialog')?.focus({preventScroll:true}))}
function closeModal(){modal=null;$('#modal-root').innerHTML='';sync();save()}
const closeButton=()=>'<button class="close" data-act="close" aria-label="Close panel">×</button>';
const tools=(hintAct)=>`<div class="tool-row"><button data-act="table-here">Periodic table</button>${hintAct?`<button data-act="${hintAct}">Hint</button>`:''}<button data-act="close">Back to city</button></div><div id="hint" class="hint" aria-live="polite"></div>`;

function title(){openModal('title',`<span class="title-chip">A CITY BUILT ON DISCOVERY</span><h1>ELEMENT<span>CITY.</span></h1><div class="subtitle">Periodic Pursuit</div><p class="lead">The city’s systems are failing. The evidence is elemental. Borrow a ride, follow the clues, and bring the lights back.</p><div class="actions"><button class="primary" data-act="start">${state.started?'Continue investigation':'Join the response team'}</button><button data-act="guide">How to play</button></div><p class="byline">AN ORIGINAL CHEMISTRY ADVENTURE · NO ACCOUNT NEEDED<br>Keyboard + touch · Progress stays in this browser</p>`,'title-card')}
function start(){const first=!state.started;state.started=true;closeModal();if(state.active==='power'&&state.step>0)world.focusWorkshop?.();
  if(first){state.tutorial=0;record('Welcome to Element City','You joined the student science response team. Use the periodic table as a tool; revision is part of investigation.');tutorialIntro()}
  else if(state.upgradedCampaign){delete state.upgradedCampaign;openModal('upgrade',`${closeButton()}<div class="eyebrow">CITY UPDATE</div><h2>New investigations are live.</h2><p>Element City now has six investigations that follow your chemistry unit. Your settings, coins and practice are saved; the investigations start fresh.</p><div class="actions"><button class="primary" data-act="close">Let’s go</button></div>`,'narrow')}
  sync();save()}
function tutorialIntro(){const t=touchUI();openModal('tutorial',`${closeButton()}<div class="eyebrow">WELCOME / RESPONSE TEAM HQ</div><h2>Let’s get you moving.</h2><div class="portrait">IP</div><div class="speaker">Dr. Imani Park · Team lead</div><p class="quote">“Welcome, investigator. Someone scrambled the city’s systems. Every fix needs the periodic table, so keep it close.”</p><div class="help-grid"><div><b>1 · Walk</b><p>${t?'Put your left thumb anywhere in the lower-left of the screen and slide.':'WASD or arrow keys. Shift jogs.'}</p></div><div><b>2 · Look around</b><p>${t?'Drag the city with your right thumb.':'Drag the city with the mouse. R recenters.'}</p></div><div><b>3 · Borrow the fleet car</b><p>${t?'Tap Enter fleet car. Hold GAS and steer with your left thumb. BRAKE stops, then reverses.':'Press E by the white car. W drives, A/D steer, Space brakes.'}</p></div><div><b>4 · Follow the gold</b><p>The gold route on the street and radar leads to your next contact. Light beams mark contacts.</p></div></div><p class="small-note">Fleet cars are authorized city vehicles. Traffic and pedestrians always yield. Nothing is timed. All chemistry tests are virtual.</p><div class="actions"><button class="primary" data-act="close">Step into the city</button><button data-act="skip-tutorial">Skip the driving lesson</button></div>`)}
function checkTutorial(){if(state.tutorial>=3)return;const t=touchUI();
  if(state.tutorial===0&&state.walked>70){state.tutorial=1;toast(t?'Nice. Walk to the white fleet car and tap Enter fleet car.':'Nice. Walk to the white fleet car and press E.');save()}
  if(state.tutorial===1&&worldInfo.inVehicle){state.tutorial=2;toast('Fleet car authorized. GAS / W accelerates; steer left and right.');save()}
  if(state.tutorial===2&&state.driven>180){state.tutorial=3;toast('Nice driving. Follow the gold route to Noor.');banner('INVESTIGATION 01','Who Am I?','Follow the gold route');save()}}

// ------------------------------------------------------------------ HUD
const repScore=()=>repFor(state);
function updateHUD(){const visible=state.started&&modal!=='title',touch=touchUI();
  document.body.classList.toggle('touch-mode',touch);document.body.classList.toggle('driving',!!worldInfo.inVehicle&&visible);document.body.classList.toggle('button-controls',state.settings.controlStyle==='buttons');document.body.style.setProperty('--control-scale',state.settings.controlSize||1);
  ['hud','objective','tools','context'].forEach(id=>$('#'+id).classList.toggle('hidden',!visible));$('#touch').classList.toggle('hidden',!visible||!touch);
  $('#speedo').classList.toggle('hidden',!visible||!worldInfo.inVehicle);
  if(worldInfo.inVehicle){$('#speed-value').textContent=String(toKmh(worldInfo.speed||0));$('#gear').textContent=(worldInfo.speed||0)<-1?'R':Math.abs(worldInfo.speed||0)<1?'N':'D'}
  $('#district').textContent=(worldInfo.district||'Research quarter').toUpperCase();$('#rep').textContent=`${repScore()} REP`;$('#ride').textContent=worldInfo.inVehicle?'CITY FLEET':'ON FOOT';
  $('#vehicle').textContent=worldInfo.inVehicle?'E · Exit car':'E · Borrow car';$('#vehicle').disabled=!worldInfo.inVehicle&&!worldInfo.vehicleNearby;
  const np=nearPoint,label={drop:'Deliver here',sample:'Use bench',socket:'Use terminal',reading:'Read monitor',relay:'Open relay'};
  $('#interact').disabled=!(np||worldInfo.nearby);$('#interact').textContent=np?`F · ${label[np.kind]||'Interact'}`:worldInfo.nearby?'F · Talk':'F · Interact';
  $('#nearby').textContent=np?(np.kind==='drop'?`${np.symbol} · ${np.name}`:np.name):worldInfo.nearby?worldInfo.nearby.name:worldInfo.inVehicle?(touch?'':'Space brakes · S reverses'):worldInfo.vehicleNearby?'City Share car · free for the response team':'';
  const left=MISSIONS.length-state.completed.length;$('#systems').textContent=`${left} system${left===1?'':'s'} down`;$('#incident-fill').style.width=(left/MISSIONS.length*100)+'%';
  const o=objective();$('#objective-eyebrow').textContent=o[0];$('#objective-title').textContent=o[1];$('#objective-text').textContent=o[2]}
function objective(){const m=current(),n=next(),t=touchUI();
  if(state.tutorial<3)return ['GETTING STARTED','First, find your feet.',[t?'Touch the lower-left area and slide to walk. Drag elsewhere to look around.':'Walk with WASD or the arrow keys. Drag the city to look around.',t?'Walk to the white fleet car and tap Enter fleet car.':'Walk to the white fleet car and press E.',t?'Hold GAS and steer with your left thumb.':'Drive a short way: W accelerates, A/D steer, Space brakes.'][state.tutorial]];
  if(!m&&!n)return ['FREE ROAM','The city is back online.','All six investigations complete. Explore, hunt for the gold element coins, or try Research Practice.'];
  if(!m||state.step<1){const x=m||n;return [`INVESTIGATION ${missionNo(x)}`,x.title,`${x.objective} Follow the gold route.`]}
  const w=W(),eb=`INVESTIGATION ${missionNo(m)}`;
  if(m.id==='courier'){const c=COURIER[w.clue||0];if(!c)return [eb,m.title,'All packages delivered!'];return [`${eb} · DELIVERY ${(w.clue||0)+1}/${COURIER.length}`,`Who am I? ${c.clue}`,'Find the matching rooftop tile (map: M) and drop the package at its gold doorstep ring.']}
  if(m.id==='race'){const g=GATES[w.gate||0];if(!g)return [eb,m.title,'Race complete!'];return [`${eb} · CHECKPOINT ${(w.gate||0)+1}/${GATES.length}`,`${g.q}  ${g.a} or ${g.b}?`,'Drive (or walk) through the arch with your answer. Follow the gold route to the checkpoint.']}
  if(m.id==='power')return [`${eb} · ON SCENE`,m.title,powerStage(w)];
  if(m.id==='show'){const r=SHOW_ROUNDS[w.round||0];return [`${eb} · ${r?r.title.toUpperCase():'FINALE'}`,m.title,'Talk to Theo at the harbor console to program the next act.']}
  if(m.id==='survey'){const n2=READINGS.filter(r=>w.collected?.[r.sym]).length;return surveyCollected()?[`${eb} · ANALYZE`,m.title,'All readings collected. Return to Ari and put the evidence on the board.']:[`${eb} · ${n2}/${READINGS.length} READINGS`,'Collect the indicator readings','Drive through each blue monitor ring. The gold route leads to the nearest one.']}
  if(m.id==='ions'){const n3=RELAYS.filter(t=>w.solved?.[t.id]).length;return [`${eb} · ${n3}/${RELAYS.length} TOWERS`,'Light the relay towers','Drive to the next relay tower and balance its ionic code.']}
  return [eb,m.title,m.objective]}

// ------------------------------------------------------------------ points in the city (works in 3D and the 2D fallback)
function pointLists(){const m=current(),w=W(),out=[];if(!m||state.step<1||worldInfo.inVehicle)return out;
  if(m.id==='courier')out.push(...DROP_ZONES.map(d=>({...d,r:70})));
  if(m.id==='power')out.push(...POWER_POINTS.map(p=>({...p,r:105})));
  if(m.id==='survey')out.push(...READINGS.filter(r=>!w.collected?.[r.sym]).map(r=>({id:'reading-'+r.sym,kind:'reading',sym:r.sym,name:r.where,x:r.x,y:r.y,r:95})));
  if(m.id==='ions')out.push(...RELAYS.filter(t=>!w.solved?.[t.id]).map(t=>({id:'relay-'+t.id,kind:'relay',relay:t.id,name:t.name,x:t.x,y:t.y,r:95})));return out}
function findNearPoint(){let best=null,bd=Infinity;for(const p of pointLists()){const d=Math.hypot(p.x-worldInfo.x,p.y-worldInfo.y);if(d<p.r&&d<bd){best=p;bd=d}}return best}
function interactNow(){if(modal||!state.started)return;nearPoint=findNearPoint();if(nearPoint){pointAction(nearPoint.id);return}world.interact()}
function pointAction(id){id=String(id);const m=current();if(!m||state.step<1)return;
  if(id.startsWith('drop-'))return deliver(id.slice(5));
  if(id.startsWith('reading-'))return collectReading(id.slice(8));
  if(id.startsWith('relay-'))return relayUI(id.slice(6));
  const p=POWER_POINTS.find(x=>x.id===id);if(p)return enterStreetPoint(p)}

// ------------------------------------------------------------------ stations & mission flow
function interactStation(id){if(id==='hq')return hq();const m=MISSIONS.find(x=>x.station===id);if(!m)return;
  if(state.completed.includes(m.id)){openModal('debrief',`${closeButton()}<div class="eyebrow">CASE CLOSED / ${esc(m.person)}</div><h2>${m.title}</h2><p>${m.debrief}</p><p class="pill teal">${m.reward}</p><div class="actions"><button data-act="close" class="primary">Back to the city</button></div>`);return}
  if(m.id!==(current()||next())?.id){toast(`${m.person}: “Come back after your current investigation.” The gold marker shows where to go.`);return}
  if(!state.active){state.active=m.id;state.step=0;state.work={};save()}showMission()}
function showMission(){const m=current();if(!m)return;if(state.step===0)return intro(m);
  ({courier:courierCard,race:raceCard,power:()=>{world.focusWorkshop?.();closeModal()},show:showConsole,survey:()=>surveyCollected()?surveyBoard():toast('Collect every reading first. Follow the gold route to the blue monitors.'),ions:()=>toast('Drive to a relay tower and interact with it.')})[m.id]?.()}
function intro(m){openModal('mission',`${closeButton()}<div class="eyebrow">INVESTIGATION ${missionNo(m)} / ${esc(m.role)}</div><h2>${m.title}</h2><div class="portrait">${m.initials}</div><div class="speaker">${m.person}</div><p class="quote">“${m.intro}”</p><div class="panel"><div class="eyebrow">YOU WILL</div><p>${m.concept}</p><span class="pill">${m.reward}</span></div><div class="actions"><button class="primary" data-act="accept">Accept investigation</button><button data-act="close">Explore first</button></div>`)}
function accept(){const m=current();if(!m)return;state.step=1;state.work={};save();setTimeout(()=>banner(`INVESTIGATION ${missionNo(m)}`,m.title,m.concept),60);
  if(m.id==='courier')return courierCard();
  if(m.id==='race'){state.work={gate:0,slot:0};closeModal();toast('Checkpoint 1 is marked on your radar. Drive through the arch with your answer.',5500);return}
  if(m.id==='power'){closeModal();streetMessage='Maya: test every bench, then classify it. Everything here is virtual.';world.focusWorkshop?.();return}
  if(m.id==='show'){state.work={round:0};return showConsole()}
  if(m.id==='survey'){state.work={collected:{}};closeModal();toast('Drive through each blue monitor ring to log its reading.',5500);return}
  if(m.id==='ions'){state.work={solved:{}};closeModal();toast('Three relay towers are on your radar (⚡). Drive to the nearest one.',5500)}}
function complete(){const m=current();if(!m)return;if(m.id==='power')world.setCamera?.('chase');streetPoint=null;streetMessage='';
  state.completed.push(m.id);state.active=null;state.step=0;state.work={};record(m.title,m.debrief);save();beep('success');
  banner(next()?'INVESTIGATION PASSED':'ALL SYSTEMS ONLINE',m.title,'+100 REP','passed');modal='celebrate';clearInputs();sync();
  setTimeout(()=>{if(modal!=='celebrate')return;openModal('complete',`<div class="complete"><div class="badge">${String(state.completed.length).padStart(2,'0')}</div><div class="eyebrow">INVESTIGATION COMPLETE</div><h2>${m.title}</h2><p class="lead">${m.reward}</p><div class="panel"><p>${m.debrief}</p></div><div class="mission-meta" style="justify-content:center"><span class="pill teal">+100 REP</span><span class="pill">${state.firstTry||0} first-try answers so far (+10 each)</span></div><div class="actions" style="justify-content:center"><button class="primary" data-act="close">${next()?'Next investigation':'Explore your restored city'}</button><button data-act="summary">View progress</button></div></div>`,'narrow')},state.settings.reducedMotion?200:1800)}

// ------------------------------------------------------------------ 01 · courier
function courierCard(msg=''){const w=W(),c=COURIER[w.clue||0];if(!c)return;openModal('courier',`${closeButton()}<div class="eyebrow">DISPATCH PHONE · DELIVERY ${(w.clue||0)+1} OF ${COURIER.length}</div><h2>Who am I?</h2><p class="quote">“${esc(c.clue)}”</p><p>Work out the element with the periodic table, find its rooftop tile (the map shows every building’s symbol), then drop the package at that building’s <b>gold doorstep ring</b>.</p>${msg?`<div class="feedback wrong">${esc(msg)}</div>`:''}<div class="actions"><button class="primary" data-act="close">Start driving</button><button data-act="map">City map</button></div>${tools('courier-hint')}`)}
function deliver(symbol){const w=W(),c=COURIER[w.clue||0];if(!c)return;const r=validateDelivery(c.id,symbol);attempt(c.id,r.ok);
  if(!r.ok){record('Delivery check',r.text);toast(r.text,8000);save();return}
  record(`Delivery ${(w.clue||0)+1}: ${c.clue}`,r.text);w.clue=(w.clue||0)+1;save();
  if(w.clue>=COURIER.length){toast(r.text);return setTimeout(complete,600)}
  banner(`DELIVERED ${w.clue}/${COURIER.length}`,el(symbol).name,r.text.replace(/^Delivered! /,''));sync();setTimeout(()=>{if(!modal)courierCard()},1600)}

// ------------------------------------------------------------------ 02 · race
function raceCard(){const w=W(),g=GATES[w.gate||0];if(!g)return;openModal('race',`${closeButton()}<div class="eyebrow">STREET FAIR GRAND PRIX · CHECKPOINT ${(w.gate||0)+1} OF ${GATES.length}</div><h2>${esc(g.q)}</h2><div class="cards" style="grid-template-columns:1fr 1fr"><div class="card"><span class="symbol">${esc(g.a)}</span><small>One arch</small></div><div class="card"><span class="symbol">${esc(g.b)}</span><small>The other arch</small></div></div><p>Each answer is painted on one of the two arches at the checkpoint. Drive through yours.</p><div class="actions"><button class="primary" data-act="close">Back to the race</button></div>${tools('race-hint')}`)}
function checkRaceGate(){const m=current();if(!m||m.id!=='race'||state.step<1||!lastPos)return;if(Math.hypot(worldInfo.x-lastPos.x,worldInfo.y-lastPos.y)>150)return;// a teleport, not a drive-through
  const w=W(),slot=(w.slot||0)%GATE_SLOTS.length,choice=gateCrossing(lastPos,{x:worldInfo.x,y:worldInfo.y},GATE_SLOTS[slot]);if(!choice)return;
  const g=GATES[w.gate||0],r=validateGate(g.id,choice);attempt(g.id,r.ok);record(`Checkpoint · ${g.q}`,r.text);w.slot=slot+1;
  if(r.ok){w.gate=(w.gate||0)+1;if(w.gate>=GATES.length){toast(r.text,6000);save();return setTimeout(complete,900)}banner(`CHECKPOINT ${w.gate}/${GATES.length}`,'✓ '+(choice==='a'?g.a:g.b),'Next checkpoint on your radar')}
  else banner('WRONG ARCH','✗ '+(choice==='a'?g.a:g.b),'Same question at the next checkpoint','');
  toast(r.text,7500);save();sync()}

// ------------------------------------------------------------------ 03 · street workshop (compact, no scrolling)
function enterStreetPoint(point){if(state.active!=='power'||state.step<1)return;if(world.player.inVehicle){toast('Park and step out to use the workshop.');return}
  if(Math.hypot(world.player.x-point.x,world.player.y-point.y)>160){toast('Walk closer to that station.');return}streetPoint=point;streetMessage='';streetStamp='';renderStreet()}
function renderStreet(){const el2=$('#field-workshop');if(!el2)return;const enabled=state.started&&!modal&&state.active==='power'&&state.step>0;el2.classList.toggle('hidden',!enabled);document.body.classList.toggle('street-investigation',enabled);if(!enabled)return;
  if(streetPoint&&Math.hypot(world.player.x-streetPoint.x,world.player.y-streetPoint.y)>170){streetPoint=null;streetMessage=''}
  const w=W(),stamp=JSON.stringify([streetPoint?.id,w,streetMessage]);if(stamp===streetStamp)return;streetStamp=stamp;const p=streetPoint;let body;
  if(p?.kind==='sample'){const m=MATERIALS.find(x=>x.id===p.material),done=w.measurements?.[m.id]||[],cls=w.classes?.[m.id];
    body=`<h3>${m.name} bench <small>${done.length}/3 tests</small></h3><div class="street-actions">${POWER_TESTS.map(t=>`<button data-street-test="${t}" class="${done.includes(t)?'selected':''}">${{look:'Look',bend:'Bend',conduct:'Conduct'}[t]}</button>`).join('')}</div>
    ${done.length?`<ul class="bench-results">${POWER_TESTS.filter(t=>done.includes(t)).map(t=>`<li><b>${{look:'Look',bend:'Bend',conduct:'Conduct'}[t]}:</b> ${m[t]}</li>`).join('')}</ul>`:'<p class="small-note">Run all three virtual tests.</p>'}
    ${done.length===3?(cls?`<p class="ok-line">✓ Classified: ${cls}</p>`:`<div class="street-actions"><span class="mini-label">Classify:</span>${['metal','metalloid','nonmetal'].map(c=>`<button data-street-class="${c}">${c}</button>`).join('')}</div>`):''}
    ${powerReady(w)?`<button class="primary" data-street="carry">${w.material===m.id?'✓ Carrying':'Pick up this sample'}</button>`:''}`}
  else if(p?.kind==='socket'){const end=p.id.at(-1),con=w.connections?.includes(end),mat=MATERIALS.find(x=>x.id===w.material);
    body=`<h3>${p.name}</h3><p>Carrying: <b>${mat?mat.name:'nothing yet'}</b></p><button data-street="connect" class="${con?'selected':''}">${con?'✓ Connected':'Connect terminal '+end.toUpperCase()}</button>
    ${end==='b'&&w.connections?.includes('b')?`<p class="mini-label">The cable needs a material that…</p><div class="street-actions">${[['conducts','carries current'],['bends','bends without breaking'],['shiny','looks shiny']].map(([k,n])=>`<button data-street-evidence="${k}" class="${w.support?.includes(k)?'selected':''}" aria-pressed="${!!w.support?.includes(k)}">${n}</button>`).join('')}</div>${w.success?'<button class="primary" data-street="finish">Return signals to service</button>':'<button class="primary" data-street="run">Run flex cycle</button>'}`:''}`}
  else body=`<h3>Restore the signals</h3><p>${powerStage(w)}</p><p class="small-note">Walk up to a bench or terminal and tap it (or press F).</p><div class="bench-grid">${SAMPLE_IDS.map(id=>`<span class="${benchDone(w,id)?'done':''}">${benchDone(w,id)?'✓':'○'} ${MATERIALS.find(x=>x.id===id).symbol}</span>`).join('')}</div>`;
  el2.innerHTML=`<div class="eyebrow">MAYA’S STREET WORKSHOP · VIRTUAL TESTS</div>${body}<p class="street-feedback" role="status">${esc(streetMessage)}</p><div class="street-tools"><button data-street="hint">Hint</button><button data-street="table">Table</button><button data-street="overview">Overview</button><button data-street="roam">Follow cam</button></div>`}
const POWER_HINTS=['Run Look, Bend and Conduct at every bench. Then classify each one by where its element sits compared with the staircase.','A cable must carry current AND bend without breaking. Which bench passed both tests?','Worked example: a material that conducts but snaps when flexed (like a pencil lead) would break inside a flexible cable.'];

// ------------------------------------------------------------------ 04 · fountain show
function showConsole(result=''){const w=W(),r=SHOW_ROUNDS[w.round||0];if(!r)return;const order=w.order||[],ran=w.ran,ok=w.orderOk;
  const chips=r.metals.map(s=>`<button data-show-pick="${s}" ${order.includes(s)||ok?'disabled':''}>${s}<small>${el(s).name}</small></button>`).join('');
  const slots=r.metals.map((_,i)=>`<div><small>${i===0?'LEAST':i===r.metals.length-1?'MOST':'·'}</small><strong>${order[i]||'?'}</strong></div>`).join('');
  const evidence=ran?`<div class="panel"><h3>What the fountains showed</h3>${r.order.map(s=>`<div class="virtual-readout"><b>${s}</b><span>${BEHAVIOR[s].seen}</span><div class="motion-line"><span style="width:${Math.round(BEHAVIOR[s].h*100)}%;background:${BEHAVIOR[s].color}"></span></div></div>`).join('')}<p class="small-note">Virtual model. Fountain height is a qualitative picture of reaction rate, not a measurement.</p></div>`:'';
  const why=ok?`<h3>Why does the show run in this order?</h3><div class="choice-list">${WHY_OPTIONS.map(([k,t])=>`<button data-show-why="${k}" class="${w.why===k?'selected':''}">${t}</button>`).join('')}</div>`:'';
  openModal('show',`${closeButton()}<div class="eyebrow">HARBOR CONSOLE · ${esc(r.title.toUpperCase())}</div><h2>Program the act: least → most reactive with water</h2>
   ${ok?'':`<p>Tap the metals in order, from <b>least</b> to <b>most</b> reactive. ${ran?'Revise using the evidence below.':'Lock in your prediction before the show runs.'}</p><div class="sample-tray">${chips}</div>`}<div class="ranking">${slots}</div>
   ${ok?'':`<div class="actions"><button data-act="show-clear">Clear</button><button class="primary" data-act="show-run" ${order.length<r.metals.length?'disabled':''}>Lock in & run the show</button></div>`}
   <div id="feedback" class="feedback ${result&&!ok?'wrong':''}">${esc(result)}</div>${evidence}${why}${tools('show-hint')}`)}
function runShow(){const w=W(),r=SHOW_ROUNDS[w.round||0];if((w.order||[]).length<r.metals.length)return;const res=validateShow(r.id,w.order);attempt(r.id+'-order',res.ok);w.ran=true;w.orderOk=res.ok;w.lastResult=res.text;record(`${r.title}: predicted ${w.order.join(' < ')}`,res.text);save();
  const entries=w.order.map(s=>({sym:s,h:BEHAVIOR[s].h,color:BEHAVIOR[s].color}));closeModal();
  if(world.playShow){world.playShow(entries,()=>{showConsole(w.lastResult);if(res.ok)banner('SHOW PERFECT',r.title,'Now explain it')})}else showConsole(res.text)}

// ------------------------------------------------------------------ 05 · indicator survey
const surveyCollected=()=>READINGS.every(r=>W().collected?.[r.sym]);
function checkSurveyPickup(){const m=current();if(!m||m.id!=='survey'||state.step<1)return;for(const r of READINGS){if(W().collected?.[r.sym])continue;if(Math.hypot(r.x-worldInfo.x,r.y-worldInfo.y)<48)collectReading(r.sym)}}
function collectReading(sym){const w=W(),r=READINGS.find(x=>x.sym===sym);if(!r||w.collected?.[sym])return;w.collected||={};w.collected[sym]=true;const u=uiOf(r.ui);
  record(`Indicator reading · ${pretty(r.formula)}`,`${u.label}: ${u.meaning}${r.note?` (${r.note})`:''}.`);const n=READINGS.filter(x=>w.collected[x.sym]).length;
  banner(`READING ${n}/${READINGS.length}`,`${pretty(r.formula)} · ${u.label}`,u.meaning);beep('tap');save();sync();if(surveyCollected())toast('All nine readings logged. Return to Ari to analyze them.',6000)}
function boardHTML(){const cells={Li:[1,1],C:[1,4],Na:[2,1],Mg:[2,2],Al:[2,3],P:[2,5],S:[2,6],K:[3,1],Ca:[3,2]};
  return `<div class="mini-board">${[['2','Period 2'],['3','Period 3'],['4','Period 4']].map(([p,l],i)=>`<span class="mb-row" style="grid-row:${i+2}">${l}</span>`).join('')}${['1','2','13','14','15','16'].map((g,i)=>`<span class="mb-col" style="grid-column:${i+2}">G${g}</span>`).join('')}
   ${READINGS.map(r=>{const [row,col]=cells[r.sym];const u=uiOf(r.ui);return `<div class="mb-cell" style="grid-row:${row+1};grid-column:${col+1};--ui:${u.color}"><b>${r.sym}</b><small>${pretty(r.formula)}</small></div>`}).join('')}<i class="mb-stair" aria-hidden="true"></i></div>
   <div class="ui-key">${UI_SCALE.map(u=>`<span style="--ui:${u.color}">${u.label}: ${u.meaning}</span>`).join('')}</div>`}
function surveyBoard(){const w=W();w.sorted||={};const unsorted=READINGS.filter(r=>!w.sorted[r.sym]);
  if(unsorted.length){const sel=w.pick;openModal('survey',`${closeButton()}<div class="eyebrow">ARI’S EVIDENCE BOARD · STEP 1 OF 2</div><h2>Sort the OH compounds by their indicator color</h2>${boardHTML()}
    <p>${sel?`Selected <b>${pretty(READINGS.find(r=>r.sym===sel).formula)}</b>. Choose a bin.`:'Tap a compound, then tap its bin.'}</p><div class="sample-tray">${unsorted.map(r=>`<button data-sort-pick="${r.sym}" class="sample-tile ${sel===r.sym?'selected':''}" style="border-left:8px solid ${uiOf(r.ui).color}"><b>${pretty(r.formula)}</b><span>${uiOf(r.ui).label}</span></button>`).join('')}</div>
    <div class="family-shelves" style="grid-template-columns:repeat(3,1fr)">${[['basic','Basic OH compounds'],['acidic','Acidic OH compounds'],['unsure','Not sure']].map(([k,n])=>`<button class="shelf" data-sort-bin="${k}"><b>${n}</b><span>${READINGS.filter(r=>w.sorted[r.sym]===k).map(r=>pretty(r.formula)).join(' · ')||'—'}</span></button>`).join('')}</div><div id="feedback" class="feedback"></div>${tools('survey-hint')}`,'wide');return}
  const q=SURVEY_QUESTIONS[w.q||0];if(!q)return;openModal('survey',`${closeButton()}<div class="eyebrow">ARI’S EVIDENCE BOARD · STEP 2 · QUESTION ${(w.q||0)+1} OF ${SURVEY_QUESTIONS.length}</div>${boardHTML()}<h3>${esc(q.prompt)}</h3><div class="choice-list">${q.options.map(([k,t])=>`<button data-survey-answer="${k}">${t}</button>`).join('')}</div><div id="feedback" class="feedback"></div>${tools('survey-hint')}`,'wide')}
const SURVEY_HINTS=['Use the color key: red and orange mean acidic; blue and purple mean basic; green means neutral.','Look at the board. Which columns are purple and blue, and which are red and orange?','Worked example: if a new metal in Group 1 formed an OH compound, it would sit with LiOH, NaOH and KOH: basic.'];

// ------------------------------------------------------------------ 06 · relay towers
function relayUI(id){const w=W(),t=RELAYS.find(x=>x.id===id);if(!t)return;w.currentRelay=id;w.relay||={};const st=w.relay[id]||={cc:0,ac:0,c:0,a:0,phase:'charge'};if(w.solved?.[id])return toast(`${t.name} is already online.`);
  const cE=el(t.cation),aE=el(t.anion),sign=v=>v>0?`+${v}`:v<0?`−${-v}`:'0';
  let body;
  if(st.phase==='charge')body=`<h3>Step 1 · Predict each ion’s charge from the table</h3><div class="cols"><div class="panel"><b>${cE.name} (${t.cation}) · Group ${cE.group}</b><div class="ion-control"><button data-relay="cc" data-d="-1" aria-label="Lower charge">−</button><strong>${sign(st.cc)}</strong><button data-relay="cc" data-d="1" aria-label="Raise charge">+</button></div></div><div class="panel"><b>${aE.name} (${t.anion}) · Group ${aE.group}</b><div class="ion-control"><button data-relay="ac" data-d="-1" aria-label="Lower charge">−</button><strong>${sign(st.ac)}</strong><button data-relay="ac" data-d="1" aria-label="Raise charge">+</button></div></div></div><div class="actions"><button class="primary" data-act="relay-charges">Check charges</button></div>`;
  else if(st.phase==='ratio'){const pc=ionCharge(t.cation),nc=ionCharge(t.anion),net=pc*st.c+nc*st.a;body=`<h3>Step 2 · Build the smallest neutral ratio</h3><div class="cols"><div class="panel"><b>${t.cation}${sign(pc).replace('+1','+').replace('−1','−')} ions</b><div class="ion-control"><button data-relay="c" data-d="-1">−</button><strong>${st.c}</strong><button data-relay="c" data-d="1">+</button></div><div class="ion-particles">${Array.from({length:st.c},()=>`<span class="ion-dot">${t.cation}<sup>${sign(pc)}</sup></span>`).join('')}</div></div><div class="panel"><b>${t.anion}${sign(nc)} ions</b><div class="ion-control"><button data-relay="a" data-d="-1">−</button><strong>${st.a}</strong><button data-relay="a" data-d="1">+</button></div><div class="ion-particles">${Array.from({length:st.a},()=>`<span class="ion-dot negative">${t.anion}<sup>${sign(nc)}</sup></span>`).join('')}</div></div></div><div class="charge">${st.c}(${sign(pc)}) + ${st.a}(${sign(nc)}) = <b>${sign(net)}</b></div><div class="actions"><button class="primary" data-act="relay-ratio">Send code</button></div>`}
  else if(st.phase==='analogy')body=`<h3>Bonus code · Formulas follow the family</h3><p>${esc(ANALOGY.prompt)}</p><div class="choice-list">${ANALOGY.options.map(([k,v])=>`<button data-relay-mc="analogy" data-v="${k}">${v}</button>`).join('')}</div>`;
  else body=`<h3>Final check · Is a compound just its elements mixed?</h3><p>${esc(COMPOUND.prompt)}</p><div class="choice-list">${COMPOUND.options.map(([k,v])=>`<button data-relay-mc="compound" data-v="${k}">${v}</button>`).join('')}</div>`;
  openModal('relay',`${closeButton()}<div class="eyebrow">ION RELAY · ${esc(t.name.toUpperCase())}</div><h2>${t.cation} + ${t.anion}</h2>${body}<div id="feedback" class="feedback"></div>${tools('relay-hint')}`)}
function relaySolved(id){const w=W(),t=RELAYS.find(x=>x.id===id);w.solved||={};w.solved[id]=true;save();closeModal();const n=RELAYS.filter(x=>w.solved[x.id]).length;
  if(n>=RELAYS.length)return setTimeout(complete,500);banner(`TOWER ${n}/${RELAYS.length} ONLINE`,t.name,'Next tower on your radar')}

// ------------------------------------------------------------------ HQ, dispatch, map, notebook, table, practice
function hq(){openModal('hq',`${closeButton()}<div class="eyebrow">PERIODIC RESEARCH CENTER</div><h2>Welcome back, investigator.</h2><p>“The equipment is fictional. The reasoning is yours.” Dr. Imani Park</p><div class="actions"><button class="primary" data-act="dispatch">Current dispatch</button><button data-act="notebook">Field notebook</button><button data-act="practice">Research practice</button><button data-act="summary">Progress</button><button data-act="close">Explore</button></div>`)}
function dispatch(){const m=current()||next();if(m&&state.active===m.id&&state.step>0){if(m.id==='courier')return courierCard();if(m.id==='race')return raceCard()}
  openModal('dispatch',`${closeButton()}<div class="eyebrow">MISSION PHONE / DISPATCH</div><h2>${m?m.title:'All systems online'}</h2>${m?`<div class="speaker">${m.person} · ${m.role}</div><p>“${m.intro}”</p><div class="panel"><b>Next step</b><p>${esc(objective()[2])}</p><b>Skills</b><p>${m.concept}</p></div>`:'<p>Six investigations closed. Explore, collect the element coins, and export your progress from the notebook.</p>'}<div class="actions"><button class="primary" data-act="close">Return to city</button><button data-act="map">City map</button><button data-act="shuttle">Take city shuttle</button></div>`)}
function cityMap(){openModal('map',`${closeButton()}<div class="eyebrow">ELEMENT CITY / MAP</div><h2>Know your neighborhood.</h2><canvas class="map-large" id="large-map" width="1200" height="900"></canvas><div class="map-legend">${MISSIONS.map(m=>`<div>${state.completed.includes(m.id)?'✓':'◆'} ${missionNo(m)} · ${m.title}${m.id===(state.active||next()?.id)?' · <b style="color:var(--gold)">current</b>':''}</div>`).join('')}</div><p class="small-note">Gold squares show each building’s element tile. Gold line = suggested route. White arrow = you.</p>`,'wide');
  const cv=$('#large-map'),c=cv.getContext('2d');if(world.drawFullMap)world.drawFullMap(c,cv.width,cv.height);else{c.imageSmoothingEnabled=false;c.drawImage($('#minimap'),0,0,cv.width,cv.height)}}
function table(from=null){returnTo=from;const relevant={courier:[1,2,17,18],race:[1,2],power:[],show:[1,2],survey:[1,2,14,15,16],ions:[1,2,13,15,16,17]}[state.active]||[];
  let cells=Array.from({length:18},(_,i)=>`<span class="element group-label" style="grid-column:${i+1};grid-row:1">${i+1}</span>`).join('');
  for(const e of ELEMENTS){let col=e.group,row=e.period+1;if(e.number>=58&&e.number<=71){col=e.number-54;row=10}if(e.number>=90&&e.number<=103){col=e.number-86;row=11}
    cells+=`<button class="element ${relevant.includes(e.group)?'pattern':''}" data-element="${e.number}" style="grid-column:${col};grid-row:${row};--ec:${colors[e.category]}" aria-label="${e.number}, ${e.name}, ${e.symbol}, ${CATEGORIES[e.category]}"><small>${e.number}</small><strong>${e.symbol}</strong></button>`}
  openModal('table',`${closeButton()}<div class="eyebrow">FIELD REFERENCE / ALL 118 ELEMENTS</div><h2>The periodic table</h2><div class="tool-row"><input id="element-search" type="search" placeholder="Search name, symbol, or atomic number" aria-label="Search periodic table"><button data-act="table-back">${returnTo?'Back to the task':'Back to city'}</button></div><p class="small-note">Groups run across the top; periods run down. ${relevant.length?'Gold outlines mark the families this investigation uses.':''}</p><div class="table-scroll"><div class="periodic-grid">${cells}</div></div><div class="legend">${Object.entries(CATEGORIES).map(([k,v])=>`<span style="--ec:${colors[k]}">${v}</span>`).join('')}</div><div class="element-details" id="element-details" aria-live="polite"></div><p class="small-note">${TABLE_NOTE} ${REFERENCE_CONDITIONS}</p>`,'wide');elementDetails(selectedElement)}
function elementDetails(n){selectedElement=n;const e=ELEMENTS.find(x=>x.number===n);$('#element-details').innerHTML=`<div class="big-symbol">${e.symbol}</div><b>${e.name} · atomic number ${e.number}</b><p>${e.number} protons per atom · ${e.group?'Group '+e.group:'Detached series'} · Period ${e.period} (${e.period} occupied energy levels) · ${CATEGORIES[e.category]}</p><p>Elemental substance: ${esc(e.state)} at reference conditions. ${esc(e.notes||'')}</p>${e.properties?`<p>${Object.entries(e.properties).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join(' · ')}</p>`:''}`}
function backToTask(){const r=returnTo;returnTo=null;if(!r)return closeModal();if(r==='practice')return practiceUI(practiceId);if(r.startsWith('relay:'))return relayUI(r.slice(6));({courier:courierCard,race:raceCard,show:()=>showConsole(),survey:surveyBoard,power:closeModal})[r]?.()||closeModal()}
function notebook(){openModal('notebook',`${closeButton()}<div class="eyebrow">FIELD NOTEBOOK / EVIDENCE & EXPLANATIONS</div><h2>Good science leaves a trail.</h2><div class="tool-row"><button data-act="summary">Progress summary</button><button data-act="practice">Research practice</button><button data-act="table">Periodic table</button></div><div class="cols"><div><h3>Investigation record</h3>${state.journal.length?state.journal.slice().reverse().map(j=>`<div class="panel"><b>${esc(j.title)}</b><p>${esc(j.text)}</p></div>`).join(''):'<p>Your evidence and explanations will appear here.</p>'}</div><div><h3>The pocket guide</h3><div class="panel">
 <b>Reading a position</b><p>Groups are columns and periods are rows. For main-group elements, the group gives the valence electrons (Groups 13–18: subtract 10), and the period gives the occupied energy levels. The atomic number counts protons.</p>
 <b>What holds an electron</b><p>More protons → stronger pull. More distance (and more shielding inner electrons) → weaker pull. Down a family, distance wins: radius grows and first ionization energy falls. Across a period, protons win: radius shrinks and first ionization energy rises. These are general patterns with small exceptions.</p>
 <b>Metals, nonmetals, metalloids</b><p>Metals: shiny, malleable, conductive; they lose valence electrons easily. Nonmetals: dull, brittle, poor conductors. Metalloids on the staircase mix both. Graphite (carbon) conducts but carbon is a nonmetal, so use several properties.</p>
 <b>Reactivity with water</b><p>A metal reacts by losing valence electrons. Lower ionization energy → more reactive: Li &lt; Na &lt; K down Group 1; Na &gt; Mg &gt; Al across Period 3.</p>
 <b>OH compounds and indicator</b><p>Metals form basic OH compounds (purple/blue). Compounds that nonmetals form, such as SO₂(OH)₂, are acidic (red/orange) and are usually written H first: H₂SO₄. Across a period, OH compounds become more acidic. Formulas follow the family.</p>
 <b>Ions and formulas</b><p>Group 1 → +1, Group 2 → +2, Group 13 → +3, Group 15 → −3, Group 16 → −2, Group 17 → −1 (main groups; transition metals vary). Neutral formulas use the smallest whole-number ratio, and a compound has its own properties.</p>
 <div class="shells"><div class="shell-model"><b>+</b></div><span class="mini-label">Simplified shell model<br>Not electron paths or to scale</span></div><a href="teacher.html" target="_blank" rel="noopener">Teacher guide & scientific sources</a></div></div></div>`,'wide')}
function summary(){openModal('summary',`${closeButton()}<div class="eyebrow">YOUR PROGRESS / LOCAL TO THIS BROWSER</div><h2>${state.completed.length}/${MISSIONS.length} investigations closed</h2><div class="cols"><div class="panel"><h3>Chemistry</h3>${MISSIONS.map(m=>`<div class="progress-row"><span>${state.completed.includes(m.id)?'✓':'○'} ${m.title}<br><small>${m.concept}</small></span></div>`).join('')}<p>${state.firstTry||0} questions answered right on the first try · ${state.revisions} revisions. Hints are always free.</p></div><div class="panel"><h3>Exploration</h3><p>${state.practice?.length||0}/3 research practice activities<br>${state.discoveries.length} element coins<br>${Math.round(state.walked/15)} m walked · ${Math.round(state.driven/15)} m driven</p><p class="small-note">No names, accounts, or public leaderboards.</p><button data-act="download">Download progress summary</button></div></div><div class="actions"><button class="primary" data-act="close">Back to city</button></div>`)}
function download(){const text=`ELEMENT CITY: PERIODIC PURSUIT\nStudent progress (no identifying information)\n\n${MISSIONS.map(m=>`${state.completed.includes(m.id)?'[Complete]':'[Not complete]'} ${m.title}\n${m.concept}`).join('\n\n')}\n\nFirst-try answers: ${state.firstTry||0}\nRevisions: ${state.revisions}\nResearch practice: ${state.practice?.length||0}/3\nElement coins: ${state.discoveries.length}\n\nCompletion records participation and in-game decisions, not an independent assessment of mastery.`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.download='element-city-progress.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function guide(){openModal('guide',`${closeButton()}<div class="eyebrow">HOW TO PLAY</div><h2>Explore. Predict. Test. Revise.</h2><div class="help-grid"><div><b>iPad · Move & steer</b><p>Touch anywhere in the lower-left area and slide. In the car it steers.</p></div><div><b>iPad · Drive</b><p>Hold GAS (right). BRAKE stops the car; keep holding to reverse. Steer and press GAS together.</p></div><div><b>iPad · Look</b><p>Drag the city with your other thumb: sideways turns, up/down tilts.</p></div><div><b>Keyboard</b><p>WASD / arrows move or drive · Shift jogs · Space brakes · E enter/exit car · F interact · Q radio · T table · N notebook · M map · C camera · R recenter · Esc pause.</p></div><div><b>Follow the gold</b><p>The gold route and radar lead to your next stop. Light beams mark contacts.</p></div><div><b>Take your time</b><p>Panels pause the world. Nothing is timed. Hints are free and end with a worked example.</p></div></div><p class="small-note">A fictional teaching city. Tests are virtual and are not instructions for real experiments. Fleet cars are authorized; nobody gets hurt.</p><div class="actions"><button class="primary" data-act="close-guide">${state.started?'Back to city':'Back to title'}</button><a href="teacher.html" target="_blank" rel="noopener">Teacher overview & sources</a></div>`)}
function pause(){const q=state.settings.quality||'auto';openModal('pause',`${closeButton()}<div class="eyebrow">PAUSED</div><h2>The city can wait.</h2><div class="options"><label>Graphics quality <select id="quality"><option value="auto" ${q==='auto'?'selected':''}>Automatic (recommended)</option><option value="high" ${q==='high'?'selected':''}>High</option><option value="balanced" ${q==='balanced'?'selected':''}>Balanced</option><option value="low" ${q==='low'?'selected':''}>Battery saver</option></select></label><label><input id="guide-line" type="checkbox" ${state.settings.guideLine!==false?'checked':''}>Show the gold route on the street</label><label>Radio <select id="station"><option value="-1">Off</option>${STATIONS.map((s,i)=>`<option value="${i}" ${state.settings.station===i?'selected':''}>${s.name} · ${s.tag.split(' · ')[0]}</option>`).join('')}</select></label><label>Music volume <input id="music-volume" type="range" min="0" max="1" step=".1" value="${state.settings.musicVolume??.6}"></label><label><input id="radio-foot" type="checkbox" ${state.settings.radioOnFoot?'checked':''}>Keep the radio playing on foot</label><label>Sound effects <input id="volume" type="range" min="0" max="1" step=".1" value="${state.settings.volume}"><span id="vol-label">${Math.round(state.settings.volume*100)}%</span></label><label><input id="reduced" type="checkbox" ${state.settings.reducedMotion?'checked':''}>Reduce camera motion and effects</label><label><input id="show-touch" type="checkbox" ${touchUI()?'checked':''}>Show on-screen touch controls</label><label>Touch movement <select id="control-style"><option value="stick" ${state.settings.controlStyle!=='buttons'?'selected':''}>Floating thumbstick</option><option value="buttons" ${state.settings.controlStyle==='buttons'?'selected':''}>Arrow buttons</option></select></label><label>Control size <input id="control-size" type="range" min="0.8" max="1.3" step=".1" value="${state.settings.controlSize||1}"></label><label>Camera sensitivity <input id="camera-sensitivity" type="range" min="0.5" max="1.5" step=".25" value="${state.settings.cameraSensitivity||1}"></label><label><input id="auto-camera" type="checkbox" ${state.settings.autoCamera!==false?'checked':''}>Ease the camera back behind me</label></div><p class="small-note">Investigations are untimed.${world.canvas?.dataset?.renderFps?` Graphics: ${world.canvas.dataset.quality||''} · ~${world.canvas.dataset.renderFps} fps.`:''}</p><div class="actions"><button class="primary" data-act="close">Resume</button><button data-act="recenter">Recenter camera</button><button data-act="recover">Return to HQ</button><button data-act="restart">Restart investigation</button><button data-act="guide">Controls guide</button><button data-act="summary">Progress</button><button class="danger" data-act="reset-confirm">Reset all progress</button></div><p class="small-note">${save()?'Progress saved in this browser.':'Browser storage is unavailable. You can play, but progress will not survive reloading.'}</p>`,'narrow')}
function practiceMenu(){openModal('practice',`${closeButton()}<div class="eyebrow">RESEARCH PRACTICE / OPTIONAL</div><h2>Calibrate your reasoning</h2><p>New situations for applying periodic patterns, separate from the six investigations.</p><div class="choice-list">${PRACTICE.map(p=>`<button data-practice-open="${p.id}">${state.practice?.includes(p.id)?'✓ ':''}${p.title}<br><small>${p.concept}</small></button>`).join('')}</div>`)}
function practiceUI(id){practiceId=id;const task=PRACTICE.find(x=>x.id===id);let controls='';
  if(id==='radius')controls=`<div class="options"><label>Atomic radius<select id="practice-radius"><option value="">Predict a change</option><option value="increase">Increases</option><option value="decrease">Decreases</option></select></label><label>First ionization energy<select id="practice-energy"><option value="">Predict a change</option><option value="increase">Increases</option><option value="decrease">Decreases</option></select></label><label>Explain<select id="practice-reason"><option value="">Choose a cause</option><option value="protons">Added protons alone explain the outer electron’s behavior.</option><option value="levels">Added occupied energy levels and shielding affect outer-electron attraction.</option></select></label></div>`;
  if(id==='indicator')controls=`<div class="options"><label>Aqueous record<select id="practice-type"><option value="">Classify the pH</option><option value="basic">Basic</option><option value="neutral">Neutral</option><option value="acidic">Acidic</option></select></label><label>Source identity<select id="practice-identity"><option value="">Assess the evidence</option><option value="metal">The pH alone proves the source is a metal.</option><option value="nonmetal">The pH alone proves the source is a nonmetal.</option><option value="insufficient">More evidence is needed to identify the source.</option></select></label></div>`;
  if(id==='ratio')controls=`<div class="options"><label>Li⁺ count<select id="practice-positive">${[0,1,2,3,4].map(n=>`<option>${n}</option>`).join('')}</select></label><label>S²⁻ count<select id="practice-negative">${[0,1,2,3,4].map(n=>`<option>${n}</option>`).join('')}</select></label></div>`;
  openModal('practice-task',`${closeButton()}<div class="eyebrow">OPTIONAL VIRTUAL RESEARCH</div><h2>${task.title}</h2><p>${task.prompt}</p>${controls}<div class="actions"><button class="primary" data-practice-check="${id}">Test prediction</button><button data-practice-hint="${id}">Hint</button><button data-practice-table="${id}">Periodic table</button><button data-act="practice">Other practice</button></div><div id="feedback" class="feedback" role="status"></div><div id="hint" class="hint" role="status"></div>`);
  for(const [key,value] of Object.entries(state.practiceDrafts?.[id]||{})){const input=$('#practice-'+key);if(input)input.value=value}}

// ------------------------------------------------------------------ actions
const actions={start,close:closeModal,guide,pause,table:()=>table(),notebook,summary,map:cityMap,download,dispatch,practice:practiceMenu,accept,reload:()=>location.reload(),
  'close-guide':()=>state.started?closeModal():title(),'table-here':()=>table(state.active==='ions'&&modal==='relay'?`relay:${W().currentRelay}`:state.active),'table-back':backToTask,
  'skip-tutorial':()=>{state.tutorial=3;closeModal();toast('Follow the gold route to Noor.');save()},
  recover:()=>{world.recover();closeModal();toast('Returned safely to HQ.');save()},
  restart:()=>{const m=current();if(!m)return toast('No active investigation to restart.');state.work={};state.step=0;world.resetShow?.();world.setCamera?.('chase');streetPoint=null;save();closeModal();toast(`${m.title} restarted. Talk to ${m.person} to begin again.`)},
  'reset-confirm':()=>openModal('reset',`${closeButton()}<h2>Start over?</h2><p>This clears investigations, evidence, coins and settings on this browser.</p><div class="actions"><button class="danger" data-act="reset">Reset all progress</button><button data-act="pause">Keep my progress</button></div>`,'narrow'),
  reset:()=>{state=freshState();world.resetCars?.();radio.tune(-1);world.loadPosition({x:520,y:1050,walked:0,driven:0,discovered:[]});world.recover();world.resetShow?.();writeSave(storage,state);title()},
  recenter:()=>{world.recenterCamera?.();toast('Camera centered behind you.');if(modal==='pause')closeModal()},
  camera:()=>{const mode=world.setCamera?.(world.viewMode==='overhead'?'chase':'overhead');toast(mode==='overhead'?'Overhead camera':'Follow camera')},
  shuttle:()=>{if(state.active==='race'&&state.step>0)return toast('The shuttle can’t enter the race course. Follow the gold route to the checkpoint.');const t=world.activeTarget?.()||stations.find(s=>s.id===trackedTarget());if(!t)return toast('No destination to shuttle to right now.');world.loadPosition({...world.getState(),x:t.x,y:t.y+75,inVehicle:false,speed:0});world.notify();closeModal()},
  'courier-hint':()=>{const c=COURIER[W().clue||0];$('#hint').textContent=hintText(c.id,c.hints)},
  'race-hint':()=>{const g=GATES[W().gate||0];$('#hint').textContent=hintText(g.id,g.hints)},
  'show-hint':()=>{const r=SHOW_ROUNDS[W().round||0];$('#hint').textContent=hintText(r.id,r.hints)},
  'show-clear':()=>{W().order=[];showConsole(W().ran?W().lastResult:'')},'show-run':runShow,
  'survey-hint':()=>{$('#hint').textContent=hintText('survey',SURVEY_HINTS)},
  'relay-hint':()=>{const t=RELAYS.find(x=>x.id===W().currentRelay)||RELAYS[0];$('#hint').textContent=hintText(t.id,t.hints)},
  'relay-charges':()=>{const id=activeRelay(),t=RELAYS.find(x=>x.id===id),st=W().relay[id];const a=validateCharge(t.cation,st.cc),b=validateCharge(t.anion,st.ac);const ok=a.ok&&b.ok;attempt(id+'-charge',ok);
    if(!ok){setFeedback(!a.ok?a.text:b.text,true);save();return}st.phase='ratio';record(`${t.name}: charges`,`${a.text} ${b.text}`);save();relayUI(id);setFeedback(`${a.text} · ${b.text}`)},
  'relay-ratio':()=>{const id=activeRelay(),t=RELAYS.find(x=>x.id===id),st=W().relay[id];const r=validateRatio(id,st.c,st.a);attempt(id+'-ratio',r.ok);if(!r.ok){setFeedback(r.text,true);save();return}
    record(`${t.name}: ${pretty(formulaFor(t.cation,t.anion,st.c,st.a))}`,r.text);if(t.analogy){st.phase='analogy';save();relayUI(id);setFeedback(r.text);return}save();setFeedback(r.text);setTimeout(()=>relaySolved(id),900)}
};
const activeRelay=()=>W().currentRelay;

document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset,w=W();
  if(d.act){actions[d.act]?.();return}if(d.tool){({table:()=>table(),notebook,map:cityMap,guide})[d.tool]?.();return}
  if(d.element)return elementDetails(Number(d.element));
  // street workshop
  if(d.street||d.streetTest||d.streetClass||d.streetEvidence){const p=streetPoint;
    if(d.street==='overview'){world.focusWorkshop?.();return}if(d.street==='roam'){world.setCamera?.('chase');return}if(d.street==='table'){table('power');return}
    if(d.street==='hint'){streetMessage=hintText('power',POWER_HINTS);streetStamp='';renderStreet();return}
    if(!p||world.player.inVehicle){toast('Walk up to a bench or terminal first.');return}
    if(d.streetTest&&p.kind==='sample'){const m=MATERIALS.find(x=>x.id===p.material);measureSample(w,m.id,d.streetTest);w.lastTest={material:m.id,test:d.streetTest};streetMessage='';record(`Bench · ${m.name} · ${d.streetTest}`,m[d.streetTest]);beep()}
    if(d.streetClass&&p.kind==='sample'){const r=validateClass(p.material,d.streetClass);attempt('class-'+p.material,r.ok);streetMessage=r.text;if(r.ok){w.classes||={};w.classes[p.material]=d.streetClass;record(`Classified ${p.material}`,r.text)}}
    if(d.street==='carry'&&p.kind==='sample'&&powerReady(w)){Object.assign(w,{material:p.material,connections:[],success:false,failed:false});streetMessage=`Picked up ${MATERIALS.find(x=>x.id===p.material).name}. Carry it to cabinet terminal A.`}
    if(d.street==='connect'&&p.kind==='socket'){const r=connectTerminal(w,p.id.at(-1));streetMessage=r.text;beep(r.ok?'tap':'wrong')}
    if(d.streetEvidence){w.support||=[];w.support=w.support.includes(d.streetEvidence)?w.support.filter(x=>x!==d.streetEvidence):[...w.support,d.streetEvidence];w.success=false}
    if(d.street==='run'&&w.connections?.includes('b')){const s=w.support||[],reason=s.length===2&&s.includes('conducts')&&s.includes('bends')?'both':'other';const r=validatePower(w.material,reason);attempt('power-run',r.ok);w.success=r.ok;w.failed=!r.ok;streetMessage=r.text;record('Flex cycle',r.text);if(!r.ok&&w.material!=='copper')w.connections=[]}
    if(d.street==='finish'&&w.success)return complete();
    streetStamp='';sync();save();return}
  // fountain show
  if(d.showPick){w.order||=[];if(!w.order.includes(d.showPick))w.order.push(d.showPick);showConsole(w.ran?w.lastResult:'');return}
  if(d.showWhy){const r=SHOW_ROUNDS[w.round||0],res=validateWhy(r.id,d.showWhy);attempt(r.id+'-why',res.ok);w.why=d.showWhy;
    if(!res.ok){showConsole(w.lastResult);setFeedback(res.text,true);save();return}record(`${r.title}: explanation`,res.text);w.round=(w.round||0)+1;Object.assign(w,{order:[],ran:false,orderOk:false,why:null,lastResult:''});world.resetShow?.();save();
    if(w.round>=SHOW_ROUNDS.length){closeModal();return setTimeout(complete,300)}banner('ACT COMPLETE',r.title,'Next act loaded');showConsole();setFeedback(res.text);return}
  // survey board
  if(d.sortPick){w.pick=d.sortPick;surveyBoard();return}
  if(d.sortBin){if(!w.pick){setFeedback('Tap a compound first.',true);return}const r=validateSort(w.pick,d.sortBin);attempt('sort-'+w.pick,r.ok);
    if(!r.ok){const pk=w.pick;surveyBoard();setFeedback(r.text,true);void pk;save();return}w.sorted[w.pick]=d.sortBin;w.pick=null;save();surveyBoard();if(!READINGS.some(x=>!w.sorted[x.sym]))banner('BOARD SORTED','Evidence placed','Now read the pattern');return}
  if(d.surveyAnswer){const q=SURVEY_QUESTIONS[w.q||0],r=validateSurvey(q.id,d.surveyAnswer);attempt(q.id,r.ok);if(!r.ok){setFeedback(r.text,true);save();return}
    record(q.prompt,q.options.find(o=>o[0]===q.answer)[1]);w.q=(w.q||0)+1;save();if(w.q>=SURVEY_QUESTIONS.length){closeModal();return setTimeout(complete,300)}surveyBoard();setFeedback('✓ Correct. Next question.');return}
  // relay towers
  if(d.relay){const id=activeRelay();if(!id)return;const st=W().relay[id],k=d.relay,lim={cc:[-4,4],ac:[-4,4],c:[0,6],a:[0,6]}[k];st[k]=Math.max(lim[0],Math.min(lim[1],st[k]+Number(d.d)));relayUI(id);return}
  if(d.relayMc){const id=activeRelay(),st=W().relay[id],src=d.relayMc==='analogy'?ANALOGY:COMPOUND,ok=d.v===src.answer;attempt(id+'-'+d.relayMc,ok);if(!ok){setFeedback(src.wrong,true);save();return}
    record(src.prompt,src.options.find(o=>o[0]===src.answer)[1]);if(d.relayMc==='analogy'){st.phase='compound';save();relayUI(id);setFeedback('✓ Same family, same pattern: SrBr₂.');return}save();setFeedback('✓ A compound is a new substance.');setTimeout(()=>relaySolved(id),700);return}
  // practice
  if(d.practiceTable){table('practice');return}if(d.practiceOpen)return practiceUI(d.practiceOpen);
  if(d.practiceHint){const task=PRACTICE.find(t=>t.id===d.practiceHint),n=Number(b.dataset.hintLevel||0);$('#hint').textContent=task.hints[Math.min(n,1)];b.dataset.hintLevel=String(n+1);return}
  if(d.practiceCheck){const id=d.practiceCheck,answer={};for(const key of ['radius','energy','reason','type','identity','positive','negative']){const x=$('#practice-'+key);if(x)answer[key]=['positive','negative'].includes(key)?Number(x.value):x.value}
    const ok=checkPractice(id,answer),task=PRACTICE.find(t=>t.id===id);setFeedback(ok?task.explanation:'The model needs revision. Compare your prediction with the evidence and use a hint if needed.',!ok);beep(ok?'success':'wrong');if(ok){state.practice||=[];if(!state.practice.includes(id))state.practice.push(id);record(task.title,task.explanation)}save()}
});
document.addEventListener('input',e=>{if(e.target.id==='element-search'){const q=e.target.value.trim().toLowerCase();$$('[data-element]').forEach(b=>{const x=ELEMENTS[Number(b.dataset.element)-1];b.classList.toggle('dim',!!q&&!(x.name.toLowerCase().includes(q)||x.symbol.toLowerCase()===q||String(x.number)===q))})}
  if(e.target.id==='volume'){state.settings.volume=Number(e.target.value);$('#vol-label').textContent=Math.round(state.settings.volume*100)+'%';beep();save()}});
document.addEventListener('change',e=>{const id=e.target.id;if(id?.startsWith('practice-')){state.practiceDrafts||={};state.practiceDrafts[practiceId]||={};state.practiceDrafts[practiceId][id.slice(9)]=e.target.value;save();return}
  const s=state.settings;if(id==='reduced')s.reducedMotion=e.target.checked;if(id==='show-touch')s.touch=e.target.checked;if(id==='control-style'){s.controlStyle=e.target.value;clearInputs()}if(id==='control-size')s.controlSize=Number(e.target.value);
  if(id==='camera-sensitivity')s.cameraSensitivity=Number(e.target.value);if(id==='auto-camera')s.autoCamera=e.target.checked;if(id==='quality'){s.quality=e.target.value;if(e.target.value!=='auto')world.applyQuality?.(e.target.value)}if(id==='guide-line')s.guideLine=e.target.checked;if(id==='station'){s.station=Number(e.target.value);radio.tune(s.station);radio.stop()}if(id==='music-volume'){s.musicVolume=Number(e.target.value);radio.setVolume(s.musicVolume)}if(id==='radio-foot')s.radioOnFoot=e.target.checked;sync();save()});

// ------------------------------------------------------------------ keyboard, sound, lifecycle
const motionKeys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift',' '];
document.addEventListener('keydown',e=>{if(e.key==='Tab'&&modal){const items=$$('.dialog button:not(:disabled),.dialog input,.dialog select,.dialog a');if(items.length){const f=items[0],l=items.at(-1);if(e.shiftKey&&(document.activeElement===f||document.activeElement===$('.dialog'))){e.preventDefault();l.focus()}else if(!e.shiftKey&&document.activeElement===l){e.preventDefault();f.focus()}}return}
  if(e.key==='Escape'){e.preventDefault();if(modal==='title')return;if(modal){if(modal==='table'&&returnTo)backToTask();else state.started?closeModal():title()}else pause();return}
  if(modal||!state.started)return;const key=e.key.toLowerCase();if(e.metaKey||e.ctrlKey||e.altKey){clearInputs();return}
  if(motionKeys.includes(key)){e.preventDefault();allInputs.set('keyboard-'+key,e.key,true)}if(e.repeat)return;
  if(key==='q')cycleRadio();if(key==='e'){if((state.settings.station??-1)>=0)radio.ensure();world.toggleVehicle()}if(key==='f')interactNow();if(key==='t')table();if(key==='n')notebook();if(key==='m')cityMap();if(key==='p')pause();if(key==='c')actions.camera();if(key==='r')actions.recenter()});
document.addEventListener('keyup',e=>allInputs?.set('keyboard-'+e.key.toLowerCase(),e.key,false));
function updateEngineSound(){const live=state.started&&!modal&&worldInfo.inVehicle&&state.settings.volume>0;if(!live){if(engineSound&&audioCtx)engineSound.gain.gain.setTargetAtTime(0,audioCtx.currentTime,.12);return}
  try{audioCtx||=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();if(!engineSound){const o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();o.type='triangle';f.type='lowpass';f.frequency.value=240;g.gain.value=0;o.connect(f);f.connect(g);g.connect(audioCtx.destination);o.start();engineSound={oscillator:o,gain:g}}
    engineSound.oscillator.frequency.setTargetAtTime(42+Math.abs(worldInfo.speed||0)*.3,audioCtx.currentTime,.14);engineSound.gain.gain.setTargetAtTime(state.settings.volume*.045,audioCtx.currentTime,.1)}catch{}}
function clearInputs(){tabletControls?.clear();allInputs?.clear();world?.setStick?.(0,0);for(const k of [...motionKeys,'up','down','left','right','space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'])world.setInput(k,false);$$('[data-key]').forEach(b=>b.classList.remove('held'))}
window.addEventListener('blur',()=>{clearInputs();if(state.started&&!modal&&!DEBUG)pause()});
document.addEventListener('visibilitychange',()=>{clearInputs();if(document.hidden)radio.suspend();else updateRadio();if(document.hidden&&state.started){save();if(!modal&&!DEBUG)pause()}});
window.addEventListener('pagehide',()=>{clearInputs();save()});
window.addEventListener('pageshow',e=>{clearInputs();if(e.persisted&&state.started&&!modal)pause()});
for(const t of ['gesturestart','gesturechange','gestureend'])document.addEventListener(t,e=>e.preventDefault(),{passive:false});
document.addEventListener('contextmenu',e=>{if(e.target.closest('#world,#touch'))e.preventDefault()});
document.addEventListener('dblclick',e=>{if(e.target.closest('#world,#touch'))e.preventDefault()},{passive:false});
allInputs=new InputMixer((key,held)=>world.setInput(key,held));
tabletControls=attachTabletControls($('#touch'),()=>world,()=>state.started&&!modal,allInputs);
$('#vehicle').onclick=()=>{if((state.settings.station??-1)>=0)radio.ensure();world.toggleVehicle()};$('#radio').onclick=cycleRadio;$('#interact').onclick=interactNow;$('#pause').onclick=pause;$('#dispatch-btn').onclick=dispatch;
if(DEBUG)window.__ec={radio,get world(){return world},get state(){return state},actions,sync,save,clearInputs,get modal(){return modal},deliver,pointAction,collectReading,relayUI,showConsole,surveyBoard,complete,interactStation};
title();sync();

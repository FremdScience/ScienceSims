/** Pointer-safe tablet controls. Each finger (pointerId) owns its own input source;
 * nothing is shared between fingers, so releasing one never cancels another. */

// Canonical actions. Every key alias maps to one action BEFORE mixing, so releasing
// "ArrowUp" no longer cancels a held "w" or a held touch accelerator (v4 bug).
const CANON = {arrowup:'up',w:'up',up:'up',arrowdown:'down',s:'down',down:'down',arrowleft:'left',a:'left',left:'left',
  arrowright:'right',d:'right',right:'right',shift:'shift',' ':'space',space:'space',spacebar:'space'};
export const canonicalKey = key => CANON[String(key).toLowerCase()] || String(key).toLowerCase();

export function normalizeStick(dx,dy,radius=64,deadZone=.12){
  const length=Math.hypot(dx,dy)/Math.max(1,radius);
  if(length<=deadZone)return {x:0,y:0};
  const magnitude=Math.min(1,(length-deadZone)/(1-deadZone)),angle=Math.atan2(dy,dx);
  return {x:Math.cos(angle)*magnitude,y:Math.sin(angle)*magnitude};
}

export class InputMixer{
  constructor(write){this.write=write;this.sources=new Map();this.keys=new Set()}
  set(source,key,held){if(held)this.sources.set(source,canonicalKey(key));else this.sources.delete(source);this.flush()}
  flush(){const next=new Set(this.sources.values());for(const key of new Set([...this.keys,...next])){const was=this.keys.has(key),now=next.has(key);if(was!==now||now)this.write(key,now)}this.keys=next}
  clear(){this.sources.clear();this.flush()}
  held(key){return this.keys.has(canonicalKey(key))}
}

/** Where the stick's base sits for a new touch. A touch inside the visible ring keeps the
 * ring where it is; a touch elsewhere in the zone moves ("floats") the ring to the thumb,
 * clamped so the whole ring stays inside the zone. Pure so it can be regression-tested. */
export function stickOrigin(zone,base,touch,ringRadius){
  if(Math.hypot(touch.x-base.x,touch.y-base.y)<=ringRadius*1.05)return {x:base.x,y:base.y,floated:false};
  const pad=Math.min(ringRadius,zone.width/2,zone.height/2);
  return {x:Math.min(zone.left+zone.width-pad,Math.max(zone.left+pad,touch.x)),y:Math.min(zone.top+zone.height-pad,Math.max(zone.top+pad,touch.y)),floated:true};
}

export function attachTabletControls(root,world,isActive=()=>true,sharedMixer=null){
  const zone=root.querySelector('#joystick'),knob=root.querySelector('.stick-knob'),ring=root.querySelector('.stick-ring');
  const mixer=sharedMixer||new InputMixer((k,v)=>world().setInput(k,v));
  let owner=null,origin=null;
  const ringRadius=()=>{const r=(ring||zone).getBoundingClientRect?.();return Math.max(30,(r?.width||160)*.36)};
  const homeCenter=()=>{const r=(ring||zone).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}};
  const place=o=>{if(!ring||!ring.style)return;if(!o){ring.style.left='';ring.style.top='';return}const z=zone.getBoundingClientRect();ring.style.left=(o.x-z.left)+'px';ring.style.top=(o.y-z.top)+'px'};
  const apply=v=>{const w=world();if(w.setStick)w.setStick(v.x,v.y);else{mixer.set('stick-left','left',v.x<-.2);mixer.set('stick-right','right',v.x>.2);mixer.set('stick-up','up',v.y<-.2);mixer.set('stick-down','down',v.y>.2)}};
  const move=e=>{if(e.pointerId!==owner||!origin)return;const radius=ringRadius(),dx=e.clientX-origin.x,dy=e.clientY-origin.y,v=normalizeStick(dx,dy,radius);apply(v);if(knob){const k=Math.min(1,Math.hypot(dx,dy)/radius),a=Math.atan2(dy,dx);knob.style.transform=`translate(${Math.cos(a)*k*radius}px,${Math.sin(a)*k*radius}px)`}};
  const release=e=>{if(e.pointerId!==owner)return;owner=null;origin=null;apply({x:0,y:0});if(knob)knob.style.transform='';place(null);zone.classList?.remove('active')};
  zone.addEventListener('pointerdown',e=>{if(!isActive()||owner!==null)return;e.preventDefault();owner=e.pointerId;try{zone.setPointerCapture(e.pointerId)}catch{}
    const z=zone.getBoundingClientRect(),home=homeCenter();origin=stickOrigin(z,home,{x:e.clientX,y:e.clientY},ringRadius());if(origin.floated)place(origin);zone.classList?.add('active');move(e)});
  zone.addEventListener('pointermove',move);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(type,release);
  root.querySelectorAll('[data-key]').forEach(button=>{const sources=new Set();
    button.addEventListener('pointerdown',e=>{if(!isActive())return;e.preventDefault();try{button.setPointerCapture(e.pointerId)}catch{}sources.add(e.pointerId);mixer.set('touch-'+e.pointerId,button.dataset.key,true);button.classList.add('held')});
    const up=e=>{if(!sources.has(e.pointerId))return;sources.delete(e.pointerId);mixer.set('touch-'+e.pointerId,button.dataset.key,false);button.classList.toggle('held',sources.size>0)};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,up);
    button.addEventListener('contextmenu',e=>e.preventDefault())});
  return {clear(){owner=null;origin=null;world().setStick?.(0,0);mixer.clear();if(knob)knob.style.transform='';place(null);zone.classList?.remove('active');root.querySelectorAll('.held').forEach(b=>b.classList.remove('held'))},
    get active(){return owner!==null}};
}

/** Element City time of day: keyframed sun, sky, haze and exposure. Pure data + interpolation
 * (no DOM, no renderer) so it can be tested on its own. Hours are 0..24 on a 24-hour clock.
 * Night is tuned to stay readable (moonlight plus street lighting), never black. */
import * as THREE from './vendor/three.module.js';

const C=c=>new THREE.Color(c),V=(x,y,z)=>new THREE.Vector3(x,y,z).normalize();
/** Clock hour used by each fixed mode; 'auto' starts at golden hour and runs a full day in about 20 real minutes. */
export const TIME_MODES={day:12,golden:17.5,night:23};
export const DAY_START=17.5;
export const HOURS_PER_SECOND=24/1200;

function key(h,o){return {h,sunDir:o.sunDir,sunColor:C(o.sun),sunI:o.sunI,hemiSky:C(o.hemiSky),hemiGround:C(o.hemiGround),hemiI:o.hemiI,envI:o.envI,
  skyTop:C(o.top),skyMid:C(o.mid),skyHorizon:C(o.horizon),fog:C(o.fog),cloud:C(o.cloud),waterDeep:C(o.deep),exposure:o.exposure,night:o.night}}
const NIGHT={sunDir:V(-.3,.78,-.45),sun:'#a9bfff',sunI:.8,hemiSky:'#7088bd',hemiGround:'#3b3846',hemiI:.62,envI:.32,top:'#081230',mid:'#14234a',horizon:'#3a3c5c',fog:'#283048',cloud:'#3d4763',deep:'#03111c',exposure:1.08,night:1};
/** Keyframes in clock order. Night is held from 22:00 to 05:00 so the city is mostly in daylight or twilight. */
export const DAY_KEYS=[
  key(5,NIGHT),
  key(6.5,{sunDir:V(-.82,.2,.3),sun:'#ffc49a',sunI:2.2,hemiSky:'#b5c6e0',hemiGround:'#5e5548',hemiI:.42,envI:.55,top:'#4a76b6',mid:'#bcc6dc',horizon:'#f2c6a6',fog:'#d3c6bc',cloud:'#ffe0d2',deep:'#0a3048',exposure:1,night:.1}),
  key(12,{sunDir:V(.55,.72,.42),sun:'#fff0da',sunI:3.7,hemiSky:'#bcd6f0',hemiGround:'#6b5f4c',hemiI:.38,envI:.7,top:'#3f7fc4',mid:'#9cc5e6',horizon:'#e9e2d0',fog:'#d6d6cc',cloud:'#ffffff',deep:'#0a3550',exposure:1,night:0}),
  key(17.5,{sunDir:V(.8,.3,.42),sun:'#ffd6a0',sunI:4.2,hemiSky:'#bcd6f0',hemiGround:'#6b5f4c',hemiI:.35,envI:.7,top:'#3d72b8',mid:'#a7c2dc',horizon:'#f1d2a8',fog:'#d8d2c2',cloud:'#ffe6c4',deep:'#0a3550',exposure:1,night:0}),
  key(19.6,{sunDir:V(.9,.05,.42),sun:'#ff9a66',sunI:1.1,hemiSky:'#8f93c4',hemiGround:'#4a4250',hemiI:.5,envI:.45,top:'#25366a',mid:'#7d77a6',horizon:'#f0976a',fog:'#7d7088',cloud:'#d99a94',deep:'#082236',exposure:1.05,night:.6}),
  key(22,NIGHT)
];
const lerpKey=(a,b,t)=>({sunDir:a.sunDir.clone().lerp(b.sunDir,t).normalize(),sunColor:a.sunColor.clone().lerp(b.sunColor,t),sunI:a.sunI+(b.sunI-a.sunI)*t,
  hemiSky:a.hemiSky.clone().lerp(b.hemiSky,t),hemiGround:a.hemiGround.clone().lerp(b.hemiGround,t),hemiI:a.hemiI+(b.hemiI-a.hemiI)*t,envI:a.envI+(b.envI-a.envI)*t,
  skyTop:a.skyTop.clone().lerp(b.skyTop,t),skyMid:a.skyMid.clone().lerp(b.skyMid,t),skyHorizon:a.skyHorizon.clone().lerp(b.skyHorizon,t),fog:a.fog.clone().lerp(b.fog,t),
  cloud:a.cloud.clone().lerp(b.cloud,t),waterDeep:a.waterDeep.clone().lerp(b.waterDeep,t),exposure:a.exposure+(b.exposure-a.exposure)*t,night:a.night+(b.night-a.night)*t});
/** Lighting for a clock hour (wraps around midnight). */
export function sampleDay(hour){let h=((Number(hour)||0)%24+24)%24;const first=DAY_KEYS[0].h;if(h<first)h+=24;
  const keys=DAY_KEYS.concat([{...DAY_KEYS[0],h:first+24}]);
  for(let i=0;i<keys.length-1;i++){const a=keys[i],b=keys[i+1];if(h>=a.h&&h<=b.h){const t=(h-a.h)/((b.h-a.h)||1);return lerpKey(a,b,t*t*(3-2*t))}}
  return lerpKey(keys[0],keys[0],0)}
/** Share of windows and street lamps lit at night after n of 6 investigations ("bring the lights back"). */
export const litFraction=n=>.35+.65*Math.max(0,Math.min(6,Number(n)||0))/6;

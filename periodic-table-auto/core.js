/** Progress, saving and shared helpers. Campaign content lives in campaign.js. */
import {MISSIONS,MISSION_IDS,MATERIALS,validatePower} from './campaign.js?v=5.3.5';
export {MISSIONS,MATERIALS,validatePower};
export const SAVE_KEY='element-city-v1';
/** campaign 2 = the six-investigation storyline introduced in 5.1. */
export const CAMPAIGN=2;
export const freshState=()=>({version:1,campaign:CAMPAIGN,started:false,tutorial:0,completed:[],active:null,step:0,journal:[],revisions:0,firstTry:0,hints:{},discoveries:[],walked:0,driven:0,challenge:false,position:null,
 settings:{volume:.6,sfxChosen:false,engineSound:true,reducedMotion:false,touch:"auto",timer:false,controlStyle:"stick",controlSize:1,cameraSensitivity:1,autoCamera:true,quality:"auto",guideLine:true,station:-1,musicVolume:.6,radioOnFoot:false,timeOfDay:"auto",units:"mph"},work:{},practice:[],practiceDrafts:{},stats:{},express:null,sideRep:0,sideJobs:0,waypoint:null,rankSeen:null});
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
export function readSave(storage){try{const s=JSON.parse(storage.getItem(SAVE_KEY));if(!s||s.version!==1)return freshState();const b=freshState();
 const out={...b,...s,settings:{...b.settings,...obj(s.settings)},journal:Array.isArray(s.journal)?s.journal:[],discoveries:Array.isArray(s.discoveries)?s.discoveries:[],hints:obj(s.hints),work:obj(s.work),stats:obj(s.stats),
  practice:Array.isArray(s.practice)?s.practice:[],practiceDrafts:obj(s.practiceDrafts),firstTry:Number.isFinite(s.firstTry)?s.firstTry:0,
  completed:Array.isArray(s.completed)?s.completed.filter(x=>MISSION_IDS.includes(x)):[],
  express:s.express&&typeof s.express==='object'&&s.express.job&&typeof s.express.job==='object'?s.express:null,sideRep:Number.isFinite(s.sideRep)?s.sideRep:0,sideJobs:Number.isFinite(s.sideJobs)?s.sideJobs:0,
  waypoint:s.waypoint&&Number.isFinite(s.waypoint.x)&&Number.isFinite(s.waypoint.y)?{x:s.waypoint.x,y:s.waypoint.y}:null};
 // Saves from the older five-investigation campaign keep settings, exploration and practice, but restart the new investigations.
 if(s.campaign!==CAMPAIGN)Object.assign(out,{campaign:CAMPAIGN,completed:[],active:null,step:0,work:{},hints:{},stats:{},firstTry:0,revisions:0,upgradedCampaign:!!s.started});
 if(!out.settings.sfxChosen&&!(Number(out.settings.volume)>0))out.settings.volume=.6;delete out.water;delete out.trackWater;return out}catch{return freshState()}}
export function writeSave(storage,state){try{storage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch{return false}}
export function neutralFormula(cation,anion,c,a){const gcd=(x,y)=>y?gcd(y,x%y):x;const net=cation.charge*c+anion.charge*a;return {net,neutral:c>0&&a>0&&net===0,simplest:c>0&&a>0&&gcd(c,a)===1,formula:cation.symbol+(c>1?c:'')+anion.symbol+(a>1?a:'')}}
/** Touch layout: an explicit setting wins; otherwise follow the input the student used last ('touch' or 'keys'). */
export function pickTouch(setting,lastInput){return setting===true||setting===false?setting:lastInput==='touch'}
/** Toasts stay up long enough to read: at least 3 s plus about 55 ms per character. */
export function toastMs(text,ms=4500){return Math.max(ms,3000+String(text||'').length*55)}
/** Keep the newest `cap` messages for the Recent messages log (skips an exact repeat of the newest one). */
export function pushBrief(list,item,cap=12){if(!item?.text)return list;if(list[0]?.text!==item.text)list.unshift(item);if(list.length>cap)list.length=cap;return list}

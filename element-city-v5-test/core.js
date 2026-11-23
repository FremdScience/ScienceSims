/** Progress, saving and shared helpers. Campaign content lives in campaign.js. */
import {MISSIONS,MISSION_IDS,MATERIALS,validatePower} from './campaign.js?v=5.1.0';
export {MISSIONS,MATERIALS,validatePower};
export const SAVE_KEY='element-city-v1';
/** campaign 2 = the six-investigation storyline introduced in 5.1. */
export const CAMPAIGN=2;
export const freshState=()=>({version:1,campaign:CAMPAIGN,started:false,tutorial:0,completed:[],active:null,step:0,journal:[],revisions:0,firstTry:0,hints:{},discoveries:[],walked:0,driven:0,challenge:false,position:null,
 settings:{volume:0,reducedMotion:false,touch:"auto",timer:false,controlStyle:"stick",controlSize:1,cameraSensitivity:1,autoCamera:true,quality:"auto",guideLine:true,station:-1,musicVolume:.6,radioOnFoot:false},work:{},practice:[],practiceDrafts:{}});
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
export function readSave(storage){try{const s=JSON.parse(storage.getItem(SAVE_KEY));if(!s||s.version!==1)return freshState();const b=freshState();
 const out={...b,...s,settings:{...b.settings,...obj(s.settings)},journal:Array.isArray(s.journal)?s.journal:[],discoveries:Array.isArray(s.discoveries)?s.discoveries:[],hints:obj(s.hints),work:obj(s.work),
  practice:Array.isArray(s.practice)?s.practice:[],practiceDrafts:obj(s.practiceDrafts),firstTry:Number.isFinite(s.firstTry)?s.firstTry:0,
  completed:Array.isArray(s.completed)?s.completed.filter(x=>MISSION_IDS.includes(x)):[]};
 // Saves from the older five-investigation campaign keep settings, exploration and practice, but restart the new investigations.
 if(s.campaign!==CAMPAIGN)Object.assign(out,{campaign:CAMPAIGN,completed:[],active:null,step:0,work:{},hints:{},firstTry:0,revisions:0,upgradedCampaign:!!s.started});
 delete out.water;delete out.trackWater;return out}catch{return freshState()}}
export function writeSave(storage,state){try{storage.setItem(SAVE_KEY,JSON.stringify(state));return true}catch{return false}}
export function neutralFormula(cation,anion,c,a){const gcd=(x,y)=>y?gcd(y,x%y):x;const net=cation.charge*c+anion.charge*a;return {net,neutral:c>0&&a>0&&net===0,simplest:c>0&&a>0&&gcd(c,a)===1,formula:cation.symbol+(c>1?c:'')+anion.symbol+(a>1?a:'')}}

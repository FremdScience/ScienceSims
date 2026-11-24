/** PTA I title theme: an original instrumental hip-hop beat (no vocals), composed live with Web Audio.
 * No recordings or samples are used. It borrows the car radio's drum, bass and keyboard voices and
 * routes them to its own output, so it never interferes with the radio. */
import {Radio} from './radio.js?v=5.3.10';

export const THEME_BPM=92;
export const THEME_TITLE='PTA I theme';
export const THEME_BARS=28;          // intro 2 · groove 8 · hook 4 · groove 8 · hook 4 · outro 2, then it loops
const PROG=[[45,'m7'],[41,'maj7'],[50,'m7'],[40,'dom7']];   // Am7 · Fmaj7 · Dm7 · E7 in A minor
export const isHookBar=bar=>(bar>=10&&bar<14)||(bar>=22&&bar<26);

export class ThemeSong{
 constructor(radio){this.radio=radio;this.playing=false;this.timer=null;this.volume=.6;this.onStop=null}
 /** Must be called from a tap or key press (browsers only allow sound after one). */
 start(){const r=this.radio;if(this.playing||!r.ensure())return false;try{r.unlock();r.keepAlive?.play()?.catch?.(()=>{})}catch{}
  const c=r.ctx;if(!this.out){this.out=c.createGain();const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;this.out.connect(comp);comp.connect(c.destination);
   const verb=c.createConvolver();verb.buffer=r.verb.buffer;const vg=c.createGain();vg.gain.value=.2;verb.connect(vg);vg.connect(this.out);
   this.v=Object.assign(Object.create(Radio.prototype),{ctx:c,master:this.out,verb,noise:r.noise})}
  this.out.gain.cancelScheduledValues(c.currentTime);this.out.gain.setValueAtTime(0,c.currentTime);this.out.gain.linearRampToValueAtTime(this.volume*.9,c.currentTime+.4);
  this.playing=true;this.step=0;this.next=c.currentTime+.12;
  this.timer=setInterval(()=>this.schedule(),25);this.schedule();return true}
 stop(fade=1.2){if(!this.playing)return;this.playing=false;clearInterval(this.timer);this.timer=null;
  const c=this.radio.ctx;if(c&&this.out){this.out.gain.cancelScheduledValues(c.currentTime);this.out.gain.setTargetAtTime(0,c.currentTime,Math.max(.05,fade/3))}this.onStop?.()}
 setVolume(v){this.volume=v;const c=this.radio.ctx;if(this.playing&&c&&this.out)this.out.gain.setTargetAtTime(v*.9,c.currentTime,.2)}
 schedule(){const c=this.radio.ctx;if(!c||!this.playing)return;const s=60/THEME_BPM/4;
  while(this.next<c.currentTime+.18){const bar=Math.floor(this.step/16)%THEME_BARS,pos=this.step%16,swing=(pos%2)?.16*s:0;
   this.play(bar,pos,this.next+swing,s);this.next+=s;this.step++}}
 scratch(t,d,up){const v=this.v,c=v.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=v.env(t,.004,d,.07);o.type='sawtooth';
  o.frequency.setValueAtTime(up?260:820,t);o.frequency.exponentialRampToValueAtTime(up?820:240,t+d);f.type='bandpass';f.frequency.value=1400;f.Q.value=1.4;o.connect(f);f.connect(g);v.out(g);o.start(t);o.stop(t+d+.05);
  v.noiseHit(t,'bandpass',up?2600:1800,d,.08)}
 play(bar,pos,t,s){const v=this.v,[root,kind]=PROG[bar%4],intro=bar<2,outro=bar>=26,hook=isHookBar(bar),beat=s*4;
  // dusty keys: a held chord on the one, a short stab on the "and" of three
  if(pos===0)v.chord(t,root,kind,beat*3.4,{type:'sine',v:intro?.035:.05,cut:intro?900:1700,a:.02,wet:.35,detune:4});
  if(pos===10&&!intro)v.chord(t,root,kind,beat*.45,{type:'triangle',v:.035,cut:2000,wet:.25});
  if(intro&&Math.random()<.35)v.noiseHit(t+Math.random()*s,'highpass',3500,.01,.05);      // vinyl crackle
  if(bar===1&&(pos===8||pos===10||pos===12||pos===14))this.scratch(t,s*1.6,pos%4===0);   // DJ scratch into the beat
  if(intro)return;
  // drums: boom-bap with swung hats
  if(pos===0||pos===7||pos===10||(hook&&pos===15))v.kick(t,pos===0?1:.8);
  if(pos===4||pos===12){v.snare(t,1,.28);if(hook)v.noiseHit(t+.012,'bandpass',1200,.12,.3,.2)}
  if(pos%2===0)v.hat(t,pos%4===2?1:.6,pos===14&&bar%4===3);
  if(pos===3&&bar%2===1)v.hat(t,.35);
  // bass follows the chord root
  if(pos===0)v.tone(t,root,beat*1.6,{type:'triangle',v:.2,cut:600});
  if(pos===10)v.tone(t,root,beat*.45,{type:'triangle',v:.16,cut:600});
  if(pos===14)v.tone(t,root+7,beat*.3,{type:'triangle',v:.13,cut:600});
  // a light keyboard riff every other phrase of the groove keeps it moving
  if(!hook&&!outro&&bar%8>=4&&[2,5,8,11].includes(pos))v.tone(t,[81,79,76,74][[2,5,8,11].indexOf(pos)]-(bar%2?2:0),beat*.3,{type:'triangle',v:.035,cut:3000,wet:.3});
  // hook: three "P-T-A" horn stabs, then a rising riff
  if(hook&&bar%2===0&&(pos===0||pos===4||pos===8))v.tone(t,76,beat*.35,{type:'sawtooth',v:.05,cut:2600,wet:.2});
  if(hook&&bar%2===1&&[0,3,6,8].includes(pos))v.tone(t,[69,72,74,76][[0,3,6,8].indexOf(pos)],beat*.4,{type:'sawtooth',v:.045,cut:2400,wet:.2});
  if(outro&&bar===27&&pos===8)this.scratch(t,s*3,false)}
}

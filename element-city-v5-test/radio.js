/** Element City car radio: three original stations composed live with Web Audio.
 * No recordings or samples are used; every note is generated here. Patterns are seeded so
 * each phrase varies but the station keeps its own style. */
export const STATIONS=[
 {id:'noble',freq:'88.8',name:'NOBLE 88.8',tag:'Chill Gas · lo-fi beats to study by',bpm:80,swing:.58,color:'#bcacf4'},
 {id:'valence',freq:'101.1',name:'VALENCE 101.1',tag:'Synthwave Drive · neon after dark',bpm:104,swing:.5,color:'#ff7ac8'},
 {id:'catalyst',freq:'94.5',name:'CATALYST 94.5',tag:'Street Beats · instrumental funk & boom-bap',bpm:90,swing:.6,color:'#ffcc33'}
];
const mtof=m=>440*Math.pow(2,(m-69)/12);
function rng(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
const CH={maj7:[0,4,7,11],m7:[0,3,7,10],m9:[0,3,7,10,14],dom13:[0,4,10,14,21],maj:[0,4,7],min:[0,3,7],dom7:[0,4,7,10]};
// progressions: [root midi, chord type] per bar
const PROG={noble:[[53,'maj7'],[52,'m7'],[50,'m7'],[48,'maj7']],valence:[[45,'min'],[41,'maj'],[48,'maj'],[43,'maj']],catalyst:[[50,'m9'],[50,'m9'],[43,'dom13'],[43,'dom13']]};
const SCALE={noble:[57,60,62,64,67,69,72,74,76],valence:[69,71,72,74,76,79,81,84],catalyst:[62,65,67,68,69,72,74,77]};

export class Radio{
 constructor(){this.ctx=null;this.station=-1;this.volume=.6;this.duck=1;this.timer=null;this.step=0;this.next=0;this.onFoot=false}
 get playing(){return this.station>=0&&!!this.timer}
 ensure(){if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;const c=this.ctx=new AC();
   this.master=c.createGain();this.master.gain.value=0;const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;this.master.connect(comp);comp.connect(c.destination);
   this.verb=c.createConvolver();const len=c.sampleRate*2.2,ir=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}this.verb.buffer=ir;
   this.verbGain=c.createGain();this.verbGain.gain.value=.22;this.verb.connect(this.verbGain);this.verbGain.connect(this.master);
   const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;this.noise=nb}
  if(this.ctx.state==='suspended')this.ctx.resume();return true}
 level(){if(!this.ctx)return;this.master.gain.setTargetAtTime(this.station>=0&&this.timer?this.volume*this.duck*.55:0,this.ctx.currentTime,.25)}
 setVolume(v){this.volume=v;this.level()}
 setDuck(d){this.duck=d;this.level()}
 /** Tune to station i (-1 = off). Must be called from a tap or key press the first time (iOS audio rule). */
 tune(i){this.station=i;if(i<0){this.stop();return}if(!this.ensure())return;this.start()}
 start(){if(this.station<0||!this.ensure())return;if(!this.timer){this.step=0;this.next=this.ctx.currentTime+.08;this.timer=setInterval(()=>this.schedule(),25)}this.sting();this.level()}
 stop(){if(this.timer){clearInterval(this.timer);this.timer=null}this.level()}
 suspend(){this.stop();try{this.ctx?.suspend()}catch{}}
 schedule(){const st=STATIONS[this.station];if(!st)return;const sixteenth=60/st.bpm/4;
  while(this.next<this.ctx.currentTime+.16){const swing=(this.step%2)?(st.swing-.5)*2*sixteenth:0;this.play(st.id,this.step,this.next+swing,sixteenth);this.next+=sixteenth;this.step++}}
 // ---- instruments
 out(g,wet=0){g.connect(this.master);if(wet){const s=this.ctx.createGain();s.gain.value=wet;g.connect(s);s.connect(this.verb)}}
 env(t,a,d,peak){const g=this.ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);return g}
 kick(t,v=1){const c=this.ctx,o=c.createOscillator(),g=this.env(t,.002,.32,.9*v);o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);o.connect(g);this.out(g);o.start(t);o.stop(t+.4)}
 noiseHit(t,type,freq,d,v,wet=0){const c=this.ctx,s=c.createBufferSource();s.buffer=this.noise;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;const g=this.env(t,.001,d,v);s.connect(f);f.connect(g);this.out(g,wet);s.start(t,Math.random()*.5);s.stop(t+d+.05)}
 snare(t,v=1,wet=.3){this.noiseHit(t,'bandpass',1800,.18,.55*v,wet);const c=this.ctx,o=c.createOscillator(),g=this.env(t,.001,.09,.25*v);o.type='triangle';o.frequency.value=185;o.connect(g);this.out(g);o.start(t);o.stop(t+.15)}
 hat(t,v=1,open=false){this.noiseHit(t,'highpass',7500,open?.22:.035,.22*v)}
 tone(t,midi,d,{type='sine',v=.2,cut=2200,a=.005,wet=0,detune=0}={}){const c=this.ctx,o=c.createOscillator(),f=c.createBiquadFilter(),g=this.env(t,a,d,v);o.type=type;o.frequency.value=mtof(midi);o.detune.value=detune;f.type='lowpass';f.frequency.value=cut;o.connect(f);f.connect(g);this.out(g,wet);o.start(t);o.stop(t+a+d+.05)}
 chord(t,root,kind,d,opts){for(const iv of CH[kind])this.tone(t,root+12+iv,d,opts)}
 sting(){if(!this.ctx)return;const t=this.ctx.currentTime+.02,st=STATIONS[this.station];if(!st)return;[0,4,7,12].forEach((iv,i)=>this.tone(t+i*.06,72+iv+(this.station*2),.25,{type:'triangle',v:.12,wet:.4}))}
 // ---- the three stations
 play(id,step,t,s){const bar=Math.floor(step/16),pos=step%16,prog=PROG[id],[root,kind]=prog[bar%prog.length],phrase=Math.floor(bar/4),r=rng(phrase*7919+(id.length*131)+pos*17),section=Math.floor(bar/8)%4,breakdown=bar%16===15;
  if(id==='noble'){
   if(!breakdown){if(pos===0||pos===10)this.kick(t,.8);if(pos===4||pos===12)this.snare(t,.55,.15);if(pos%2===0)this.hat(t,pos%4?.35:.5)}
   if(pos===0)this.chord(t,root,kind,s*14,{type:'triangle',v:.06,cut:1400,a:.04,wet:.35});
   if(pos===6&&r()<.6)this.chord(t,root,kind,s*4,{type:'sine',v:.05,cut:1600,wet:.3});
   if(pos%2===0&&r()<.32){const sc=SCALE.noble;this.tone(t,sc[Math.floor(r()*sc.length)],s*3,{type:'sine',v:.09,cut:3000,wet:.45})}
   if(pos===0||pos===8)this.tone(t,root-12,s*6,{type:'sine',v:.22,cut:400});
   if(pos===0&&bar%2===0)this.noiseHit(t,'lowpass',900,.6,.025)}
  if(id==='valence'){
   if(pos%4===0)this.kick(t,breakdown?0:1);if((pos===4||pos===12)&&!breakdown)this.snare(t,.9,.55);if(pos%2===0&&!breakdown)this.hat(t,.3,pos%4===2);
   if(pos%2===0)this.tone(t,root-12+(pos%4?12:0),s*1.6,{type:'sawtooth',v:.12,cut:700});
   if(pos===0)this.chord(t,root,kind,s*15,{type:'sawtooth',v:.035,cut:1800,a:.25,wet:.5,detune:7});
   if(section%2===1){const tones=CH[kind].map(x=>root+24+x),n=tones[(pos+Math.floor(pos/4))%tones.length];this.tone(t,n,s*.9,{type:'square',v:.045,cut:2600,wet:.35})}
   else if(pos%4===2&&r()<.5){const sc=SCALE.valence;this.tone(t,sc[Math.floor(r()*sc.length)],s*3,{type:'triangle',v:.08,wet:.45})}}
  if(id==='catalyst'){
   const kicks=[0,7,10],snares=[4,12];if(!breakdown){if(kicks.includes(pos))this.kick(t,.95);if(snares.includes(pos))this.snare(t,.8,.2);this.hat(t,pos%2?.18:.32)}
   const bassSteps={0:0,3:0,6:7,8:12,11:10,14:7};if(bassSteps[pos]!==undefined)this.tone(t,root-12+bassSteps[pos],s*1.4,{type:'triangle',v:.26,cut:900});
   if(pos===6||pos===14)this.chord(t,root,kind,s*1.2,{type:'square',v:.03,cut:1500,wet:.2});
   if(section!==0&&pos%2===1&&r()<.3){const sc=SCALE.catalyst;this.tone(t,sc[Math.floor(r()*sc.length)],s*1.5,{type:'sawtooth',v:.05,cut:1800,wet:.3})}}}
}

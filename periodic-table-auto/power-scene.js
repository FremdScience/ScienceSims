/** Maya's street workshop (Investigation 03). Shared by the 3D scene, UI and tests. */
export const POWER_POINTS=[
 {id:'sample-copper',kind:'sample',material:'copper',name:'Copper bench',x:790,y:855},
 {id:'sample-silicon',kind:'sample',material:'silicon',name:'Silicon bench',x:890,y:855},
 {id:'sample-sulfur',kind:'sample',material:'sulfur',name:'Sulfur bench',x:990,y:855},
 {id:'sample-graphite',kind:'sample',material:'graphite',name:'Graphite bench',x:1090,y:855},
 {id:'socket-a',kind:'socket',name:'Cabinet terminal A',x:830,y:1020},
 {id:'socket-b',kind:'socket',name:'Signal terminal B',x:925,y:1020}
];
export const SAMPLE_IDS=['copper','silicon','sulfur','graphite'];
export const POWER_TESTS=['look','bend','conduct'];
export const benchDone=(work,id)=>POWER_TESTS.every(t=>work.measurements?.[id]?.includes(t))&&!!work.classes?.[id];
export function powerReady(work={}){return SAMPLE_IDS.every(id=>benchDone(work,id))}
export function powerStage(work={}){
 if(work.failed)return 'The flex cycle failed. Pick a different sample or different evidence, then try again.';
 const left=SAMPLE_IDS.filter(id=>!benchDone(work,id)).length;
 if(left)return `Test and classify every bench: ${4-left} of 4 done.`;
 if(!work.material)return 'Pick up the sample that would make a flexible cable that carries current.';
 if(!work.connections?.includes('a'))return 'Carry your sample to cabinet terminal A.';
 if(!work.connections?.includes('b'))return 'Now connect the other end at signal terminal B.';
 return 'Choose your evidence and run the flex cycle.';
}
/** The one place that says where the student is in the workshop. Drives the panel's step strip, the glowing
 * rings and the bouncing arrow in 3D, so the three always agree.
 * n = step 1..5; highlight = point ids to glow; arrow = point id for the arrow (never reveals the right sample). */
export const POWER_STEP_TITLES=['Test and classify every bench','Pick up a cable sample','Connect it at terminal A','Run the cable to terminal B','Explain it, then run the flex cycle'];
export function powerStep(work={},near=null){
 const con=work.connections||[],left=SAMPLE_IDS.filter(id=>!benchDone(work,id)),out=(n,text,highlight,arrow=null)=>({n,of:5,title:POWER_STEP_TITLES[n-1],text,highlight,arrow});
 if(left.length){const nearest=left.map(id=>POWER_POINTS.find(p=>p.material===id)).sort((a,b)=>near?Math.hypot(a.x-near.x,a.y-near.y)-Math.hypot(b.x-near.x,b.y-near.y):0)[0];
  return out(1,`${4-left.length} of 4 benches done. At each bench run Look, Bend and Conduct, then classify the sample.`,left.map(id=>'sample-'+id),nearest.id)}
 const benches=SAMPLE_IDS.map(id=>'sample-'+id);
 if(!work.material||(work.failed&&!con.length))return out(2,work.failed?'That sample failed. Pick up a different one at its bench.':'Which sample would make a cable that carries current and bends without breaking? Pick it up at its bench.',benches);
 if(!con.includes('a'))return out(3,'Carry the sample to cabinet terminal A and connect it.',['socket-a'],'socket-a');
 if(!con.includes('b'))return out(4,'Terminal A is connected. Walk the cable over to signal terminal B and connect it.',['socket-b'],'socket-b');
 if(work.success)return {...out(5,'Circuit stable! At signal terminal B, tap “Return signals to service”.',['socket-b'],'socket-b'),title:'Return the signals to service'};
 return out(5,work.failed?'The cable works, but your explanation did not. At terminal B, change what you selected and run the flex cycle again.':'At terminal B, select what a cable needs, then run the flex cycle.',['socket-b'],'socket-b')}
/** What the 3D cable shows: nothing, a cable trailing from terminal A to the student, or the full span A→B. */
export function cableState(work={},done=false){const con=work.connections||[];return done||work.success||con.includes('b')?'full':con.includes('a')?'trailing':'hidden'}
export function measureSample(work,material,test){work.measurements||={};work.measurements[material]||=[];if(!work.measurements[material].includes(test))work.measurements[material].push(test);return work}
export function connectTerminal(work,terminal){
 if(!powerReady(work))return {ok:false,text:'Test and classify all four benches first.'};
 if(!work.material)return {ok:false,text:'Pick up a sample at a bench before connecting.'};
 if(terminal==='b'&&!work.connections?.includes('a'))return {ok:false,text:'Start at cabinet terminal A, then connect B.'};
 work.connections||=[];if(!work.connections.includes(terminal))work.connections.push(terminal);
 return {ok:true,text:`Terminal ${terminal.toUpperCase()} connected. ${terminal==='a'?'Walk the cable to terminal B.':'Ready for the flex cycle.'}`}}

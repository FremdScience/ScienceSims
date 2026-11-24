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
export function measureSample(work,material,test){work.measurements||={};work.measurements[material]||=[];if(!work.measurements[material].includes(test))work.measurements[material].push(test);return work}
export function connectTerminal(work,terminal){
 if(!powerReady(work))return {ok:false,text:'Test and classify all four benches first.'};
 if(!work.material)return {ok:false,text:'Pick up a sample at a bench before connecting.'};
 if(terminal==='b'&&!work.connections?.includes('a'))return {ok:false,text:'Start at cabinet terminal A, then connect B.'};
 work.connections||=[];if(!work.connections.includes(terminal))work.connections.push(terminal);
 return {ok:true,text:`Terminal ${terminal.toUpperCase()} connected. ${terminal==='a'?'Walk the cable to terminal B.':'Ready for the flex cycle.'}`}}

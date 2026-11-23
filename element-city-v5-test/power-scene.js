/** Fictional outdoor test stations. Shared by 3D scene, UI and regression tests. */
export const POWER_POINTS=[
 {id:'sample-copper',kind:'sample',material:'copper',name:'Copper sample station',x:805,y:855},
 {id:'sample-graphite',kind:'sample',material:'graphite',name:'Graphite sample station',x:915,y:855},
 {id:'sample-sulfur',kind:'sample',material:'sulfur',name:'Sulfur sample station',x:1025,y:855},
 {id:'socket-a',kind:'socket',name:'Cabinet terminal A',x:830,y:1020},
 {id:'socket-b',kind:'socket',name:'Signal terminal B',x:925,y:1020}
];
export const POWER_TESTS=['conductivity','bend','malleability'];
export function powerReady(work={}){return ['copper','graphite','sulfur'].every(id=>POWER_TESTS.every(t=>work.measurements?.[id]?.includes(t)))}
export function powerStage(work={}){if(work.failed)return 'Flex cycle failed. Return to the sample benches and revise your material or evidence.';if(!powerReady(work))return 'Inspect the three sample stations. Test conductivity, bending, and malleability.';if(!work.material)return 'Choose a sample to carry. Use evidence to select a flexible conductor.';if(!work.connections?.includes('a'))return 'Carry your sample to cabinet terminal A and connect it.';if(!work.connections?.includes('b'))return 'Walk to signal terminal B and connect the other end.';return 'Run the virtual flex cycle and check your prediction.'}
export function measureSample(work,material,test){work.measurements||={};work.measurements[material]||=[];if(!work.measurements[material].includes(test))work.measurements[material].push(test);return work}
export function connectTerminal(work,terminal){if(!powerReady(work))return {ok:false,text:'Inspect every sample first. Your scanner records conductivity, bending, and malleability.'};if(!work.material)return {ok:false,text:'Choose a sample at a sample station before connecting the cabinet.'};if(terminal==='b'&&!work.connections?.includes('a'))return {ok:false,text:'Start at cabinet terminal A, then connect terminal B.'};work.connections||=[];if(!work.connections.includes(terminal))work.connections.push(terminal);return {ok:true,text:`Terminal ${terminal.toUpperCase()} connected. ${terminal==='a'?'Take the other end to terminal B.':'Ready for the virtual flex cycle.'}`}}

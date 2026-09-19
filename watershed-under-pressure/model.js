(function(root){
  const SOIL={sand:{infiltration:72,erosion:.65},loam:{infiltration:50,erosion:.85},clay:{infiltration:28,erosion:1.05}};
  const PROJECTS={
    rainGardens:{name:'Rain gardens',cost:25,runoff:.84,sediment:.92,infiltration:9},
    trees:{name:'Streamside trees',cost:20,runoff:.93,sediment:.65,infiltration:5},
    pavement:{name:'Permeable pavement',cost:40,runoff:.76,sediment:.9,infiltration:12},
    wetland:{name:'Restore wetland',cost:50,runoff:.7,sediment:.72,infiltration:15}
  };
  function simulate(input){
    const soil=SOIL[input.soil]||SOIL.loam, projects=input.projects||[];
    let infiltration=soil.infiltration*(1-input.impervious/130);
    let modifier=1,sedimentModifier=1;
    for(const key of projects){const p=PROJECTS[key];if(p){modifier*=p.runoff;sedimentModifier*=p.sediment;infiltration+=p.infiltration;}}
    infiltration=Math.min(92,Math.max(5,infiltration));
    const rainFactor=input.rainfall/70, coverFactor=.38+input.impervious/100;
    const runoff=Math.max(2,rainFactor*coverFactor*(110-infiltration)*modifier);
    const peak=runoff*(.72+input.slope/32);
    const sediment=runoff*(.35+input.slope/18)*soil.erosion*sedimentModifier;
    const hydrograph=Array.from({length:21},(_,i)=>{const t=i/20,shape=Math.exp(-Math.pow((t-.42)/.21,2));return +(peak*shape).toFixed(1);});
    return {runoff:+runoff.toFixed(1),peak:+peak.toFixed(1),sediment:+sediment.toFixed(1),infiltration:+infiltration.toFixed(0),hydrograph,success:peak<58&&sediment<35};
  }
  function projectCost(projects){return (projects||[]).reduce((n,k)=>n+(PROJECTS[k]?.cost||0),0);}
  const api={SOIL,PROJECTS,simulate,projectCost};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.WatershedModel=api;
})(typeof window!=='undefined'?window:globalThis);

(function(root){
  const SUBSTANCES={
    water:{name:'Water',melt:0,boil:100,color:'#2b9ed1'},
    ethanol:{name:'Ethanol',melt:-114,boil:78,color:'#d98f39'},
    oxygen:{name:'Oxygen',melt:-219,boil:-183,color:'#7895d1'}
  };
  function boilingPoint(key,pressure){const s=SUBSTANCES[key];return s.boil+32*Math.log(Math.max(.2,pressure));}
  function meltingPoint(key,pressure){const s=SUBSTANCES[key];return s.melt+(key==='water'?-1.4:.7)*(pressure-1);}
  function phaseAt(key,temp,pressure){const melt=meltingPoint(key,pressure),boil=boilingPoint(key,pressure);return temp<melt?'solid':temp>=boil?'gas':'liquid';}
  function readings(key,temp,pressure){const phase=phaseAt(key,temp,pressure),kelvin=Math.max(1,temp+273.15);return{phase,kinetic:+(kelvin/298).toFixed(2),spacing:phase==='solid'?'close, ordered':phase==='liquid'?'close, mobile':'far apart',boiling:+boilingPoint(key,pressure).toFixed(1),melting:+meltingPoint(key,pressure).toFixed(1)};}
  const api={SUBSTANCES,boilingPoint,meltingPoint,phaseAt,readings};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.MatterModel=api;
})(typeof window!=='undefined'?window:globalThis);

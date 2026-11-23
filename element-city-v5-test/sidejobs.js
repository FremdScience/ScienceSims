/** Optional side job: Harbor Water Watch. Fictional, sealed monitoring records only.
 * Teaches a GENERAL pattern with an exception: oxides of nonmetals commonly give acidic
 * solutions; soluble metal oxides commonly give basic solutions; some oxides (e.g. Al2O3)
 * are insoluble and leave water near neutral. No procedure is described or implied.
 * Sources: OpenStax Chemistry 2e §14.2 (pH) and §18.9 (oxygen compounds; notes the very insoluble Al₂O₃). */
export const INDICATOR_SCALE=[
  {color:'#d7263d',label:'Red',range:'about pH 1–3',type:'acidic'},
  {color:'#f28c28',label:'Orange',range:'about pH 4–5',type:'acidic'},
  {color:'#f2d43a',label:'Yellow',range:'about pH 6',type:'acidic'},
  {color:'#3fae49',label:'Green',range:'about pH 7',type:'neutral'},
  {color:'#2f7fd1',label:'Blue',range:'about pH 8–10',type:'basic'},
  {color:'#6a3bb5',label:'Violet',range:'about pH 11–14',type:'basic'}
];
export const MONITORS=[
  {id:'co2',name:'North seawall monitor',x:2205,y:474,oxide:'Carbon dioxide',formula:'CO₂',element:'C',elementName:'carbon',
   color:'#f28c28',colorName:'Orange',answer:{ph:'acidic',element:'nonmetal',fits:'yes'},
   record:'Sealed record: carbon dioxide dissolved in a water sample. Universal indicator: orange.',
   explain:'Carbon is a nonmetal. Dissolved CO₂ makes water mildly acidic, which fits the general pattern for many nonmetal oxides.'},
  {id:'cao',name:'Central seawall monitor',x:2205,y:1024,oxide:'Calcium oxide',formula:'CaO',element:'Ca',elementName:'calcium',
   color:'#6a3bb5',colorName:'Violet',answer:{ph:'basic',element:'metal',fits:'yes'},
   record:'Sealed record: calcium oxide added to a water sample. Universal indicator: violet.',
   explain:'Calcium is a Group 2 metal. Calcium oxide reacts with water to form a strongly basic solution, which fits the general pattern for soluble metal oxides.'},
  {id:'al2o3',name:'South seawall monitor',x:2205,y:1574,oxide:'Aluminum oxide',formula:'Al₂O₃',element:'Al',elementName:'aluminum',
   color:'#3fae49',colorName:'Green',answer:{ph:'neutral',element:'metal',fits:'exception'},
   record:'Sealed record: aluminum oxide powder in a water sample. Universal indicator: green.',
   explain:'Aluminum is a metal, but aluminum oxide is essentially insoluble in water, so the water stays near neutral. Patterns are useful, but evidence can reveal exceptions.'}
];
export const WATER_DEBRIEF='Many nonmetal oxides form acidic solutions and many soluble metal oxides form basic ones. That is a general pattern, not a rule: insoluble oxides such as Al₂O₃ leave water near neutral, and a pH reading alone never identifies an element.';
export function validateMonitor(id,answer={}){
  const m=MONITORS.find(x=>x.id===id);
  if(!m)return {ok:false,text:'Unknown monitor.'};
  if(!answer.ph||!answer.element||!answer.fits)return {ok:false,text:'Answer all three parts: the solution type, the element category, and whether the record fits the general pattern.'};
  if(answer.ph!==m.answer.ph)return {ok:false,text:`Compare ${m.colorName.toLowerCase()} with the indicator scale. Below about pH 7 is acidic, about 7 is neutral, above 7 is basic.`};
  if(answer.element!==m.answer.element)return {ok:false,text:`Find ${m.elementName} (${m.element}) on the periodic table. Which side of the metal/nonmetal boundary is it on?`};
  if(answer.fits!==m.answer.fits)return {ok:false,text:m.answer.fits==='yes'
    ?`A ${m.answer.element} oxide giving a${m.answer.ph==='acidic'?'n acidic':' basic'} solution is what the general pattern predicts.`
    :'The pattern predicts a basic solution for a metal oxide, but this record is neutral. When evidence disagrees with a pattern, that is an exception worth noting.'};
  return {ok:true,text:m.explain};
}
export const waterComplete=(done={})=>MONITORS.every(m=>done[m.id]);

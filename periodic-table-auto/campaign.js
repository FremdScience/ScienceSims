/** Element City campaign (version 5.1). Six investigations that follow a typical
 * periodic-table unit: table structure → nuclear attraction and trends → metals/nonmetals →
 * reactivity → acid/base OH compounds (hydroxides and oxyacids) → ions and formulas. Pure data and validators (no DOM).
 * All observations are virtual. No procedures are described. Hints never state an answer:
 * the last hint is always a worked example that uses different elements. */
import {ELEMENTS,EN_ALL} from './elements.js?v=5.3.4';
/** Pauling electronegativity (RSC values; see elements.js and SOURCES.md). */
export const EN=EN_ALL;

export const el=s=>ELEMENTS.find(e=>e.symbol===s);
/** Main-group valence electrons (He has 2). Null for transition metals. */
export function valence(s){const e=el(s);if(!e||!e.group)return null;if(s==='He')return 2;if(e.group<=2)return e.group;if(e.group>=13)return e.group-10;return null}
export const FAMILY={1:'alkali metal',2:'alkaline earth metal',17:'halogen',18:'noble gas'};
/** Common simple-ion charge from group position (main groups only). */
export function ionCharge(s){const e=el(s);if(!e)return null;return {1:1,2:2,13:3,15:-3,16:-2,17:-1}[e.group]??null}
const sub=s=>String(s).replace(/(\d+)/g,m=>[...m].map(d=>'₀₁₂₃₄₅₆₇₈₉'[d]).join(''));
export const pretty=sub;

export const MISSIONS=[
 {id:'courier',title:'Who Am I?',person:'Noor Quill',role:'Fleet courier dispatcher',initials:'NQ',station:'courier',standards:'HS-PS1-1',
  concept:'Use groups, periods, families, valence electrons and energy levels to locate elements.',
  intro:'Somebody scrambled every delivery label in the city. All I have left are clues about where each element lives on the periodic table. Every rooftop downtown wears its element tile, so read the clue, find the element, and drop the package at the right door.',
  objective:'Meet Noor at the courier stand on Meitner St, near HQ.',reward:'Deliveries restored · Street race unlocked',
  debrief:'A position on the table carries information. The group (column) gives main-group elements their number of valence electrons, the period (row) gives the number of occupied energy levels, and the atomic number counts protons.'},
 {id:'race',title:'The Pull',person:'Rae Okafor',role:'Street-fair race marshal',initials:'RO',station:'race',standards:'HS-PS1-1',
  concept:'Explain atomic radius, first ionization energy and electronegativity with protons, distance and shielding.',
  intro:'The city closed the loop road for the Street Fair Grand Prix, and every checkpoint asks a question about atoms. Drive through the arch with the right answer. Wrong arch? You get the same question at the next checkpoint.',
  objective:'Meet Rae at the start line on Alkali Ave by Curie Ave.',reward:'Race complete · Maya’s workshop unlocked',
  debrief:'Down a family, each element adds an occupied energy level. Distance and shielding win, so radius grows and the valence electron is easier to remove. Across a period, electrons stay in the same energy level while protons are added. Protons win, so radius shrinks and ionization energy rises. Electronegativity, the pull on shared electrons in a bond, follows the same logic: it rises across a period and falls down a family. Because nonmetals react by gaining electrons, halogens get less reactive down the family, the opposite of the alkali metals. These are general patterns with small exceptions.'},
 {id:'power',title:'Power to the Block',person:'Maya Volt',role:'Transit engineer',initials:'MV',station:'power',standards:'HS-PS1-1',
  concept:'Classify elements as metals, nonmetals or metalloids and choose a material using several properties.',
  intro:'The signals are blinking the city’s least helpful message: nothing. I have four sample benches and one broken cable. Test each sample, classify it, and find a material we can bend into a cable that carries current.',
  objective:'Meet Maya at the broken signals on Transition Blvd.',reward:'Signals restored · Harbor fountain show unlocked',
  debrief:'Metals tend to be shiny, malleable and conductive, because their loosely held valence electrons can move through the solid. Nonmetals tend to be dull, brittle and poor conductors. Metalloids such as silicon sit on the staircase and mix the two. Graphite, a form of carbon, is a famous exception: it conducts, yet carbon is a nonmetal. Use several properties, never just one.'},
 {id:'show',title:'Fountain Show',person:'Theo Finch',role:'Harbor show engineer',initials:'TF',station:'show',standards:'HS-PS1-1, HS-PS1-2',
  concept:'Predict and explain how fast metals react with water, down a family and across a period.',
  intro:'Tonight’s harbor fountain show runs on virtual element models. Each fountain sprays as hard as its metal reacts with water. Program each act from least to most reactive. You lock in your order before the show runs, so trust your table.',
  objective:'Meet Theo at the harbor end of Transition Blvd.',reward:'Fountain show restored · Indicator survey unlocked',
  debrief:'A metal reacts by losing its valence electrons. Down a family, a larger atom holds them more loosely (lower ionization energy), so reactivity increases. Across a period from Na to Mg to Al, more protons pull harder and more electrons must be lost, so reactivity drops. Aluminum also wears a thin protective oxide coating, which is part of why it shows no visible change in water.'},
 {id:'survey',title:'OH So Acidic?',person:'Ari Vega',role:'City water-monitor lead',initials:'AV',station:'survey',standards:'HS-PS1-1',
  concept:'Use indicator evidence to find where basic and acidic OH compounds come from on the table, then predict new formulas.',
  intro:'Our monitors logged the indicator color of nine OH compounds. Some came from metals, some from compounds that nonmetals form. Collect every reading around the city, put the evidence on the board, and tell me what the table predicts.',
  objective:'Meet Ari at the Alkali Ave water monitor, west of Meitner St.',reward:'Monitor network restored · Ion relay unlocked',
  debrief:'Metals on the left form hydroxides such as NaOH and Ca(OH)₂. In water they release hydroxide ions (OH⁻), so they are basic and turn universal indicator blue or purple. Nonmetals on the right form OH compounds such as SO₂(OH)₂ and PO(OH)₃. These are oxyacids: in water they release hydrogen ions (H⁺), so they are acidic and are usually written with H first (H₂SO₄, H₃PO₄). Aluminum, near the staircase, forms Al(OH)₃, which is amphoteric. Oxides follow the same pattern: metal oxides make basic solutions and nonmetal oxides make acidic ones. Across a period, OH compounds become more acidic, and formulas follow the family.'},
 {id:'ions',title:'City of Ions',person:'Dr. Imani Park',role:'Response team lead',initials:'IP',station:'ions',standards:'HS-PS1-1, HS-PS1-2',
  concept:'Predict ion charges from group position and build neutral formulas, including by analogy within a family.',
  intro:'Last job, investigator. Three relay towers route the whole city, and each one needs a balanced ionic code. Work out each ion’s charge from the table, balance the charges, and light the towers.',
  objective:'Meet Dr. Park at the Ion Grid on Harbor Dr.',reward:'All six city systems online',
  debrief:'Metals lose valence electrons to form positive ions and nonmetals gain electrons to form negative ions. The group predicts the charge for main-group elements. A neutral formula uses the smallest whole-number ratio with zero total charge. Elements in the same family form formulas with the same pattern, and a compound has its own properties, not those of its elements. Transition metals such as iron can form more than one ion (Fe²⁺ and Fe³⁺), so their charge is not read from the group.'}
];
export const MISSION_IDS=MISSIONS.map(m=>m.id);

// ------------------------------------------------------------------ 1 · courier
export const COURIER=[
 {id:'c1',clue:'Group 2, Period 4.',want:{group:2,period:4},answer:'Ca',
  hints:['Groups are the numbered columns across the top. Periods are the rows down the side.','Put a finger on column 2 and slide down to row 4. Then find that symbol on a rooftop tile or the map (M).','Worked example: Group 1, Period 3 → down column 1 to row 3 → Na. Now do the same for your clue.']},
 {id:'c2',clue:'The halogen in Period 3.',want:{family:17,period:3},answer:'Cl',
  hints:['Halogens are one of the named families. Which group number are they?','Halogens are Group 17. Now find row 3 in that column.','Worked example: the noble gas in Period 2 → Group 18, row 2 → Ne.']},
 {id:'c3',clue:'My atoms have 6 valence electrons and 2 occupied energy levels.',want:{valence:6,period:2},answer:'O',
  hints:['For main-group elements, the group tells you the valence electrons: Groups 1–2 have 1–2; Groups 13–18 have 3–8. On tables labeled 1A–8A, the A number is the count.','The number of occupied energy levels (electron shells) equals the period (row).','Worked example: 3 valence electrons and 3 energy levels → Group 13, Period 3 → Al.']},
 {id:'c4',clue:'Each of my atoms contains 26 protons.',want:{number:26},answer:'Fe',
  hints:['Which number in each box of the table counts protons?','The atomic number is the proton count. Look for the box numbered 26.','Worked example: 11 protons → atomic number 11 → Na.']},
 {id:'c5',clue:'The noble gas with 3 occupied energy levels.',want:{family:18,period:3},answer:'Ar',
  hints:['Noble gases are Group 18.','The number of occupied energy levels is the period number.','Worked example: the alkali metal with 4 energy levels → Group 1, Period 4 → K.']},
 {id:'c6',clue:'Same family as chlorine, one row below bromine.',want:{group:17,period:5},answer:'I',
  hints:['A family is a column. Which column holds chlorine and bromine?','Find bromine, then move straight down one row.','Worked example: same family as sodium, one row below potassium → Rb.']}
];
const facts=s=>{const e=el(s);return {symbol:s,name:e.name,number:e.number,group:e.group,period:e.period,valence:valence(s),family:FAMILY[e.group]||null}};
export function describe(s){const f=facts(s);return `${f.name} (${s}): Group ${f.group}, Period ${f.period}${f.valence?`, ${f.valence} valence electron${f.valence>1?'s':''}`:''}, ${f.period} occupied energy level${f.period>1?'s':''}, atomic number ${f.number}${f.family?` · ${f.family}`:''}`}
/** Does an element satisfy every fact in a clue's want ({group, family, period, valence, number})? */
export function wantMatches(want,symbol){const e=el(symbol);if(!e)return false;const w=want||{};
 return (w.group===undefined||e.group===w.group)&&(w.family===undefined||e.group===w.family)&&(w.period===undefined||e.period===w.period)&&(w.number===undefined||e.number===w.number)&&(w.valence===undefined||valence(symbol)===w.valence)}
/** Compare a delivered element with a clue's want. Wrong answers get the delivered element’s facts plus the first mismatch, never the answer. */
export function checkWant(want,answer,symbol){
 if(!el(symbol))return {ok:false,text:'That door has no element tile.'};
 if(symbol===answer)return {ok:true,text:`Delivered! ${describe(symbol)}.`};
 const f=facts(symbol),w=want||{};let tip='Compare each fact with the clue.';
 if(w.number!==undefined)tip=f.number<w.number?'Your clue needs a higher atomic number.':'Your clue needs a lower atomic number.';
 else if(w.family!==undefined&&f.group!==w.family)tip=`Your clue names a different family. ${f.name} is ${f.family?'a'+(/^[aeiou]/.test(f.family)?'n ':' ')+f.family:el(symbol).category==='transition'?'a transition metal':'in Group '+(f.group??'(detached row)')}, not the family your clue names.`;
 else if(w.group!==undefined&&f.group!==w.group)tip=`Wrong column: your clue’s column is to the ${f.group<w.group?'right':'left'}.`;
 else if(w.valence!==undefined&&f.valence!==w.valence)tip=`Wrong number of valence electrons: your clue needs ${f.valence===null?'a main-group element (transition metals do not follow the simple group rule)':f.valence<w.valence?'more':'fewer'}.`;
 else if(w.period!==undefined&&f.period!==w.period)tip=`Right ${w.valence!==undefined?'valence electrons':'column'}, wrong row: your clue is ${f.period<w.period?'farther down':'farther up'} the table.`;
 return {ok:false,text:`Not this door. This building is ${describe(symbol)}. ${tip}`};
}
/** Check a courier delivery (Investigation 1). */
export function validateDelivery(clueId,symbol){const c=COURIER.find(x=>x.id===clueId);if(!c)return {ok:false,text:'No active delivery.'};return checkWant(c.want,c.answer,symbol)}

// ------------------------------------------------------------------ 2 · race (checkpoint arches)
export const IE={H:1312,He:2372,Li:520,Be:900,B:801,C:1086,N:1402,O:1314,F:1681,Ne:2081,Na:496,Mg:738,Al:578,Si:787,P:1012,S:1000,Cl:1251,Ar:1521,K:419,Ca:590,Rb:403,Sr:549,Cs:376,Ba:503};
export const GATES=[
 {id:'g1',q:'Larger atom?',a:'Li',b:'K',answer:'b',right:'K has two more occupied energy levels than Li, so its valence electron sits farther from the nucleus.',wrong:'Li is higher in the same column: fewer energy levels, so a smaller atom.',
  hints:['Are Li and K in the same column or the same row?','Going down a column adds an occupied energy level.','Worked example: Be vs Mg → Mg is one row lower, so its atom is larger.']},
 {id:'g2',q:'Valence electron easier to remove?',a:'Na',b:'K',answer:'b',data:'First ionization energy: Na ≈ 496, K ≈ 419 kJ/mol',right:'K’s valence electron is farther out and more shielded, so the pull on it is weaker.',wrong:'Na’s valence electron is one energy level closer, so the pull is stronger and removal takes more energy.',
  hints:['Easier to remove means a weaker pull on the electron.','Which has more inner electrons shielding the valence electron?','Worked example: Li vs Na → Na is lower, so its electron is easier to remove.']},
 {id:'g3',q:'Smaller atom?',a:'Na',b:'S',answer:'b',right:'Same energy level, but S has 16 protons to Na’s 11. The stronger pull draws the electrons in.',wrong:'More protons do not make a bigger atom here. In the same row, extra protons pull the same energy level closer.',
  hints:['Na and S are in the same row. Is the distance factor changing much?','Count protons with the atomic numbers.','Worked example: Li vs F → same row, F has more protons, so F is smaller.']},
 {id:'g4',q:'Higher first ionization energy?',a:'Al',b:'Cl',answer:'b',data:'Al ≈ 578, Cl ≈ 1251 kJ/mol',right:'Across Period 3, Cl’s 17 protons hold electrons in the same energy level more tightly than Al’s 13.',wrong:'Al holds its valence electrons more loosely: fewer protons pull on the same energy level.',
  hints:['Ionization energy measures how tightly the valence electron is held.','In a row, which atom has more protons pulling?','Worked example: Li vs O → O has more protons in the same row → higher ionization energy.']},
 {id:'g5',q:'Down a family, which factor wins?',a:'More protons',b:'Distance + shielding',answer:'b',right:'Added energy levels and shielding by inner electrons outweigh the extra protons.',wrong:'Protons are added, but so are whole energy levels and inner electrons. The radius and ionization-energy data show distance wins.',
  hints:['Down Group 1, does the radius grow or shrink?','If protons won, the valence electron would be held more tightly. Is K’s held more tightly than Na’s?','Worked example: Mg → Ca: Ca is larger with a lower ionization energy, so the distance effect dominates.']},
 {id:'g6',q:'Across a period, which factor wins?',a:'More protons',b:'Distance + shielding',answer:'a',right:'The electrons stay in the same energy level while protons are added, so the pull gets stronger.',wrong:'Across a row no new energy level is added, so distance barely changes. Something else must explain the shrinking radius.',
  hints:['Across Period 2, does a new energy level appear?','If distance stays about the same, what is still increasing?','Worked example: Na → Cl: the radius shrinks while the proton count climbs from 11 to 17.']},
 {id:'g7',q:'Stronger pull on its valence electrons?',a:'Be',b:'Ca',answer:'a',data:'Be ≈ 900, Ca ≈ 590 kJ/mol',right:'Be’s valence electrons are two energy levels closer to the nucleus.',wrong:'Ca has more protons, but its valence electrons are much farther out and more shielded.',
  hints:['Same column or same row?','In a column, which factor wins?','Worked example: Li vs K → Li’s electron is closer, so Li’s pull is stronger.']},
 {id:'g8',q:'Cs sits below Rb. Its first ionization energy is…',a:'Lower than Rb',b:'Higher than Rb',answer:'a',data:'Rb ≈ 403, Cs ≈ 376 kJ/mol',right:'One more energy level puts Cs’s electron farther out, so it takes less energy to remove.',wrong:'Follow the Group 1 trend: each step down lowers the first ionization energy.',
  hints:['What happened from Na to K to Rb?','Moving down one more row adds another energy level.','Worked example: Ca is below Mg, and Ca’s ionization energy is lower.']},
 {id:'g9',q:'Pulls harder on shared electrons (higher electronegativity)?',a:'F',b:'I',answer:'a',data:`Electronegativity (Pauling): F ${EN_ALL.F}, I ${EN_ALL.I}`,right:'F is the smallest halogen: bonding electrons sit closer to its nucleus with less shielding.',wrong:'I is lower in the family. Its outer level is farther out and more shielded, so its pull on shared electrons is weaker.',
  hints:['Electronegativity is how strongly an atom pulls on electrons it shares in a bond.','Same column or same row? Which factor wins in a column?','Worked example: O vs S → O is higher in Group 16, so O pulls shared electrons harder.']},
 {id:'g10',q:'More reactive nonmetal?',a:'Cl',b:'Br',answer:'a',data:'Evidence: chlorine takes electrons from bromide ions; bromine cannot take them from chloride ions',right:'Nonmetals react by GAINING electrons. Cl is smaller, so its nucleus attracts an incoming electron more strongly.',wrong:'Careful: metals get more reactive down a family because they LOSE electrons. Halogens gain electrons, so the smaller atom higher in the family reacts more readily.',
  hints:['Do nonmetals react by losing or gaining electrons?','A smaller atom holds an incoming electron closer to its nucleus.','Worked example: O vs S → O is higher in Group 16, so O gains electrons more readily.']}
];
export function validateGate(gateId,choice){const g=GATES.find(x=>x.id===gateId);if(!g)return {ok:false,text:''};
 const label=choice==='a'?g.a:g.b;if(choice===g.answer)return {ok:true,text:`✓ ${label}. ${g.right}${g.data?` (${g.data})`:''}`};return {ok:false,text:`✗ Not ${label}. ${g.wrong} Same question at the next checkpoint.`}}
/** Did a move from p to q cross this arch line? Returns 'a' (west/north arch), 'b' (east/south arch) or null. */
export function gateCrossing(p,q,slot){
 if(slot.axis==='x'){// road runs east–west at y=slot.y; arch line is vertical at x=slot.x spanning the road
  if((p.x-slot.x)*(q.x-slot.x)>0||p.x===q.x)return null;const t=(slot.x-p.x)/(q.x-p.x),y=p.y+(q.y-p.y)*t;if(Math.abs(y-slot.y)>62)return null;return y<slot.y?'a':'b'}
 if((p.y-slot.y)*(q.y-slot.y)>0||p.y===q.y)return null;const t=(slot.y-p.y)/(q.y-p.y),x=p.x+(q.x-p.x)*t;if(Math.abs(x-slot.x)>62)return null;return x<slot.x?'a':'b'}
/** Checkpoint slots around the loop road, in clockwise driving order. axis = direction the road runs. */
export const GATE_SLOTS=[{x:1420,y:400,axis:'x'},{x:1720,y:400,axis:'x'},{x:1950,y:650,axis:'y'},{x:1950,y:800,axis:'y'},{x:1950,y:1340,axis:'y'},{x:1720,y:1500,axis:'x'},{x:1000,y:1500,axis:'x'},{x:700,y:1500,axis:'x'},{x:450,y:1340,axis:'y'},{x:450,y:720,axis:'y'},{x:780,y:400,axis:'x'},{x:1000,y:400,axis:'x'}];

// ------------------------------------------------------------------ 3 · street workshop
export const MATERIALS=[
 {id:'copper',name:'Copper',symbol:'Cu',category:'metal',look:'Shiny, reddish metallic luster',bend:'Bends without breaking (malleable)',conduct:'Bulb lights brightly',
  why:'Copper is left of the staircase: a metal. Its loosely held valence electrons can move, so it conducts.'},
 {id:'silicon',name:'Silicon',symbol:'Si',category:'metalloid',look:'Shiny, gray metallic luster',bend:'Snaps (brittle)',conduct:'Bulb glows dimly: conducts a little',
  why:'Silicon is on the staircase: a metalloid and a semiconductor. It looks metallic and conducts a little, but is brittle.'},
 {id:'sulfur',name:'Sulfur',symbol:'S',category:'nonmetal',look:'Dull yellow, no luster',bend:'Crumbles (brittle)',conduct:'No light',
  why:'Sulfur is right of the staircase: a nonmetal. It is dull, brittle and does not conduct.'},
 {id:'graphite',name:'Graphite (carbon)',symbol:'C',category:'nonmetal',look:'Dark gray with a slight sheen',bend:'Flakes and snaps (brittle)',conduct:'Bulb lights',
  why:'Carbon is right of the staircase, so it is a nonmetal. Graphite is the famous exception: it conducts. This is why one property is never enough.'}
];
export const BENCH_TESTS=['look','bend','conduct'];
export function validateClass(material,choice){const m=MATERIALS.find(x=>x.id===material);if(!m)return {ok:false,text:''};
 if(choice===m.category)return {ok:true,text:`✓ ${m.why}`};
 if(material==='graphite'&&choice==='metalloid')return {ok:false,text:'Its properties do look in-between, which is a good observation. But classify by position: find carbon (C) on the table. Which side of the staircase is it on?'};
 if(material==='silicon'&&choice==='metal')return {ok:false,text:'It is shiny, but did it bend? Find silicon (Si) on the table. Where is it compared with the staircase?'};
 return {ok:false,text:`Recheck your bench evidence and find ${m.symbol} on the table. Which side of the staircase is it on?`}}
/** reason: the evidence the student selected (array of 'conducts' | 'bends' | 'shiny'); 'both' is accepted as shorthand for conducts + bends. */
export function validatePower(material,reason){
 if(material!=='copper'){const t={graphite:'Graphite conducts, but it snapped in the flex cycle. The cable must bend without breaking.',silicon:'Silicon only conducts a little, and it is brittle, so it snapped in the flex cycle.',sulfur:'Sulfur does not conduct and it crumbles. The circuit never closed.'};return {ok:false,text:t[material]||'Choose a sample first.'}}
 const s=Array.isArray(reason)?reason:reason==='both'?['conducts','bends']:[],c=s.includes('conducts'),b=s.includes('bends'),shiny=s.includes('shiny');
 if(c&&b&&!shiny)return {ok:true,text:'Circuit stable. Copper conducts and bends without breaking, so it makes a flexible cable.'};
 if(!s.length)return {ok:false,text:'Copper works! Now back it up: select what a cable needs, then run the flex cycle again.'};
 const missing=[!c&&'carry current',!b&&'bend without breaking'].filter(Boolean);
 return {ok:false,text:'Copper works! '+(missing.length?`But a cable also has to ${missing.join(' and ')}. `:'')+(shiny?'Shine doesn’t help a cable work, so unselect “looks shiny”. ':'')+'Then run the flex cycle again.'}}

// ------------------------------------------------------------------ 4 · fountain show
export const BEHAVIOR={Li:{h:.34,color:'#7d3cc8',seen:'steady fizzing; indicator turns purple'},Na:{h:.6,color:'#7d3cc8',seen:'fast fizzing, skates across the surface; purple'},K:{h:.95,color:'#8f4fe0',seen:'vigorous, with a violet flash; purple'},
 Mg:{h:.1,color:'#3a7fd1',seen:'barely changes in cold water; more bubbles when heated; blue'},Al:{h:.02,color:'#3fae49',seen:'no visible change, even when heated (a thin oxide coating protects the surface); stays green'},Ca:{h:.42,color:'#7d3cc8',seen:'steady bubbling; purple'},Sr:{h:.58,color:'#7d3cc8',seen:'faster bubbling; purple'},Ba:{h:.78,color:'#8f4fe0',seen:'vigorous bubbling; purple'}};
export const SHOW_ROUNDS=[
 {id:'r1',title:'Act 1 · The alkali opener',metals:['K','Li','Na'],order:['Li','Na','K'],why:'distance',
  hints:['Find all three on the table. Same column or same row?','Metals react by losing valence electrons. Which one holds its electron most loosely?','Worked example: Be, Mg, Ca run least → most reactive, because each step down adds an energy level.']},
 {id:'r2',title:'Act 2 · Across Period 3',metals:['Mg','Al','Na'],order:['Al','Mg','Na'],why:'protons',
  hints:['These are in the same row. Which factor wins across a row?','Na loses 1 electron, Mg loses 2 and Al loses 3. More protons hold them tighter.','Worked example: in Period 4, K reacts faster than Ca for the same reason.']},
 {id:'r3',title:'Act 3 · The finale (no rehearsal)',metals:['Sr','Mg','Ba','Ca'],order:['Mg','Ca','Sr','Ba'],why:'distance',
  hints:['All four are in one column. Which family?','Down a column the valence electrons get farther away and more shielded.','Worked example: Li, Na, K, Rb run least → most reactive.']}
];
export const WHY_OPTIONS=[['distance','Farther, more shielded valence electrons are held more loosely, so they are lost more easily.'],['protons','More protons in the same energy level pull harder, so electrons are harder to lose.'],['mass','Heavier atoms always react faster.'],['electrons','Atoms with more valence electrons always react faster.']];
export function validateShow(roundId,order){const r=SHOW_ROUNDS.find(x=>x.id===roundId);if(!r)return {ok:false,text:''};
 if(!Array.isArray(order)||order.length!==r.metals.length||new Set(order).size!==r.metals.length||!order.every(s=>r.metals.includes(s)))return {ok:false,text:'Place every metal exactly once, from least to most reactive.'};
 if(order.join()===r.order.join())return {ok:true,text:'Show programmed perfectly: each fountain sprays higher than the one before.'};
 const firstBad=order.findIndex((s,i)=>s!==r.order[i]);return {ok:false,text:`The fountains went out of order at position ${firstBad+1}: ${order[firstBad]} did not spray as expected for that slot. Use the evidence from the show to revise.`}}
export function validateWhy(roundId,choice){const r=SHOW_ROUNDS.find(x=>x.id===roundId);if(!r)return {ok:false,text:''};
 if(choice===r.why)return {ok:true,text:r.why==='distance'?'✓ Down the family, added energy levels and shielding loosen the valence electrons (lower ionization energy).':'✓ Across the row, more protons pull the same energy level harder, and more electrons must be lost.'};
 const t={mass:'Mass is not what holds an electron. Think about the pull between the nucleus and the valence electrons.',electrons:'Mg and Al have more valence electrons than Na, yet react more slowly. Count is not the reason.',distance:'Across a row, no new energy level is added. What changes instead?',protons:'Down a column the proton count rises, yet reactivity goes up. Something outweighs the protons.'};
 return {ok:false,text:t[choice]||'Choose an explanation.'}}

// ------------------------------------------------------------------ 5 · indicator survey (this game’s indicator chart: one common universal-indicator chart)
/** short = color name on board cells; ph = the pH band shown with the color; ink = readable text color on that background (WCAG AA). */
export const UI_SCALE=[{key:'red',short:'Red',color:'#d7263d',ink:'#ffffff',label:'Red',ph:'0–3',meaning:'very acidic (pH 0–3)',type:'acidic'},{key:'orange',short:'Orange',color:'#f2a33a',ink:'#10161a',label:'Orange–yellow',ph:'4–6',meaning:'slightly acidic (pH 4–6)',type:'acidic'},
  {key:'green',short:'Green',color:'#3fae49',ink:'#10161a',label:'Green',ph:'7',meaning:'neutral (about pH 7)',type:'neutral'},{key:'blue',short:'Blue',color:'#4aa3ea',ink:'#10161a',label:'Blue-green to blue',ph:'8–9',meaning:'slightly basic (pH 8–9)',type:'basic'},{key:'purple',short:'Purple',color:'#5a2d9c',ink:'#ffffff',label:'Purple',ph:'10–14',meaning:'very basic (pH 10–14)',type:'basic'}];
export const READINGS=[
 {sym:'Li',formula:'LiOH',ui:'purple',sort:'basic',x:300,y:472,where:'Alkali Ave fountain'},
 {sym:'Na',formula:'NaOH',ui:'purple',sort:'basic',x:700,y:328,where:'Reactivity Lab kiosk'},
 {sym:'K',formula:'KOH',ui:'purple',sort:'basic',x:1500,y:472,where:'Transition Tower kiosk'},
 {sym:'Ca',formula:'Ca(OH)2',ui:'purple',sort:'basic',x:522,y:700,where:'Meitner St kiosk'},
 {sym:'Mg',formula:'Mg(OH)2',ui:'blue',sort:'basic',x:1272,y:700,where:'Curie Ave kiosk',note:'heated; Mg(OH)₂ dissolves only slightly, so the color is weaker'},
 {sym:'Al',formula:'Al(OH)3',ui:'green',sort:'unsure',x:1878,y:1250,where:'Harbor Dr kiosk',note:'no visible change'},
 {sym:'S',formula:'SO2(OH)2',ui:'red',sort:'acidic',x:900,y:1572,where:'Research Loop kiosk'},
 {sym:'P',formula:'PO(OH)3',ui:'red',sort:'acidic',x:1600,y:1428,where:'Signal House kiosk'},
 {sym:'C',formula:'CO(OH)2',ui:'orange',sort:'acidic',x:2205,y:474,where:'North seawall kiosk',note:'from exhaled CO₂'}
];
export const uiOf=key=>UI_SCALE.find(u=>u.key===key);
export function validateSort(sym,choice){const r=READINGS.find(x=>x.sym===sym);if(!r)return {ok:false,text:''};
 if(choice===r.sort||(r.sort==='unsure'&&choice!=='acidic'&&choice!=='basic'))return {ok:true,text:sym==='Al'?'Good call. Al(OH)₃ barely dissolves, so the indicator stays green. Chemists call it amphoteric: it can react with acids and with bases. Metals near the staircase often form amphoteric compounds.':''};
 if(r.sort==='unsure')return {ok:false,text:`${pretty(r.formula)} stayed green (no visible change). Evidence that is not clearly acidic or basic belongs in “not sure.”`};
 return {ok:false,text:`Check the color: ${uiOf(r.ui).label.toLowerCase()} means ${uiOf(r.ui).meaning}.`}}
export const SURVEY_QUESTIONS=[
 {id:'q1',prompt:'Where do the elements that form basic OH compounds sit?',options:[['left','Left side: metals'],['right','Right side: nonmetals'],['staircase','On the staircase: metalloids']],answer:'left',
  wrong:'Look at the board: which side lit up purple and blue?'},
 {id:'q2',prompt:'Moving left → right across Period 3 (Na, Mg, Al … P, S), the OH compounds become…',options:[['basic','more basic'],['acidic','more acidic'],['same','about the same']],answer:'acidic',
  wrong:'Follow Period 3 on the board from Na to S. How do the colors change?'},
 {id:'q3',prompt:'A student claims: “All nonmetals react with water to make acids.” Does this survey show that?',options:[['yes','Yes: every nonmetal record was acidic.'],['no','No: we tested compounds that three nonmetals form, not the nonmetal elements themselves, and only three of them.']],answer:'no',
  wrong:'What was actually in the S, P and C records: the element itself, or a compound it forms? And how many nonmetals did we test?',right:'Right. A claim about all nonmetals needs far more evidence than three compounds.'},
 {id:'q4',prompt:'Barium (Ba) forms an OH compound in water. Predict the indicator result.',options:[['acidic','Acidic (red/orange)'],['basic','Basic (purple)'],['neutral','Neutral (green)']],answer:'basic',
  wrong:'Find Ba on the table. Which side is it on, and which family?'},
 {id:'q5',prompt:'Formulas follow the family. Mg(OH)₂ and Ca(OH)₂ are known. Strontium’s OH compound is…',options:[['SrOH','SrOH'],['Sr(OH)2','Sr(OH)₂'],['Sr(OH)3','Sr(OH)₃']],answer:'Sr(OH)2',
  wrong:'Sr is in the same family as Mg and Ca. Copy their pattern.'},
 {id:'q6',prompt:'Acids are usually written with H first. Rewrite SO₂(OH)₂ with every H in front.',options:[['HSO4','HSO₄'],['H2SO4','H₂SO₄'],['H2SO2','H₂SO₂']],answer:'H2SO4',
  wrong:'Count every atom in SO₂(OH)₂: H ×2, S ×1, O ×(2 + 2). Keep the same counts.'},
 {id:'q7',prompt:'Arsenic (As) is in phosphorus’s family. PO(OH)₃ is H₃PO₄. Arsenic’s acidic compound is…',options:[['H3AsO4','H₃AsO₄'],['H2AsO4','H₂AsO₄'],['As(OH)2','As(OH)₂']],answer:'H3AsO4',
  wrong:'Same family, same pattern: swap P for As and keep every count.',right:'Arsenic is a metalloid, yet its OH compound is acidic like phosphorus’s. Family patterns can carry across the staircase.'}
];
export function validateSurvey(qid,choice){const q=SURVEY_QUESTIONS.find(x=>x.id===qid);if(!q)return {ok:false,text:''};return choice===q.answer?{ok:true,text:'✓'+(q.right?' '+q.right:'')}:{ok:false,text:q.wrong}}

// ------------------------------------------------------------------ 6 · ion relay towers
export const RELAYS=[
 {id:'t1',name:'Library relay',x:1272,y:1250,cation:'Mg',anion:'F',hints:['Find each element’s group. Metals lose valence electrons; nonmetals gain enough to fill the outer level.','Losing 2 negative electrons leaves +2. Gaining 1 electron gives −1.','Worked example: Na and Cl → Na⁺ and Cl⁻ → one of each → NaCl.']},
 {id:'t2',name:'Garden relay',x:628,y:1572,cation:'Al',anion:'O',hints:['Al is in Group 13; O is in Group 16.','Find the smallest numbers that make the total charge zero. Try listing multiples of each charge.','Worked example: Ca²⁺ and N³⁻ → 3 × (+2) = +6 and 2 × (−3) = −6 → Ca₃N₂.']},
 {id:'t3',name:'Harbor relay',x:1878,y:700,cation:'K',anion:'S',analogy:true,hints:['K is in Group 1; S is in Group 16.','How many +1 ions cancel one −2 ion?','Worked example: Li⁺ and O²⁻ → two Li⁺ per O²⁻ → Li₂O.']}
];
export function validateCharge(sym,value){const want=ionCharge(sym),e=el(sym);if(want===null)return {ok:false,text:'No simple main-group charge.'};
 if(Number(value)===want)return {ok:true,text:`✓ ${sym} ${want>0?`loses ${want}`:`gains ${-want}`} electron${Math.abs(want)>1?'s':''} → ${want>0?'+':'−'}${Math.abs(want)}`};
 const v=valence(sym);return {ok:false,text:want>0?`${e.name} is a metal with ${v} valence electron${v>1?'s':''}. Metals lose their valence electrons, and each lost electron leaves one extra + charge.`:`${e.name} is a nonmetal with ${v} valence electrons. It gains electrons until it has 8, and each gained electron adds one − charge.`}}
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function formulaFor(cat,an,c,a){return cat+(c>1?c:'')+an+(a>1?a:'')}
export function validateRatio(relayId,c,a){const r=RELAYS.find(x=>x.id===relayId);const pc=ionCharge(r.cation),nc=ionCharge(r.anion);
 if(!(c>0&&a>0))return {ok:false,text:'Both ion types must be present.'};const net=pc*c+nc*a;
 if(net!==0)return {ok:false,text:`Total charge is ${net>0?'+':''}${net}. Add ions until the positives and negatives cancel.`};
 if(gcd(c,a)!==1)return {ok:false,text:'Balanced, but not the smallest whole-number ratio. Divide both counts by the same number.'};
 return {ok:true,text:`✓ ${pretty(formulaFor(r.cation,r.anion,c,a))}: ${c}(${pc>0?'+':''}${pc}) + ${a}(${nc}) = 0`.replace(/\(-/g,'(−')}}
export const ANALOGY={prompt:'CaCl₂ is a known compound. Strontium and bromine form…',options:[['SrBr','SrBr'],['SrBr2','SrBr₂'],['Sr2Br','Sr₂Br']],answer:'SrBr2',wrong:'Sr is in calcium’s family and Br is in chlorine’s family. Families form the same pattern.'};
export const COMPOUND={prompt:'Potassium is a soft, reactive metal and sulfur is a yellow, brittle solid. What about K₂S?',options:[['mix','It has the properties of both elements mixed together.'],['own','It is a new substance with its own properties.'],['metal','It behaves like potassium metal, because K is listed first.']],answer:'own',
 wrong:'When potassium and sulfur react, their atoms become K⁺ and S²⁻ ions packed in a new arrangement. K₂S is a new substance with its own properties; it is not potassium and sulfur mixed together.'};

// ------------------------------------------------------------------ scoring
/** REP: 100 per investigation + 10 for each question answered right on the first try. Wrong attempts never earn points. */
/** REP: investigations dominate (100 each + 10 per first-try answer). Element coins add 5 each (+50 for all 18); Element Express side jobs are capped at SIDE_REP_CAP. */
export const SIDE_REP_CAP=300;
export const coinRep=n=>Math.max(0,n|0)*5+(n>=18?50:0);
export function repFor(state){const done=(state.completed||[]).filter(id=>MISSION_IDS.includes(id)).length;return done*100+(state.firstTry||0)*10+coinRep(state.discoveries?.length||0)+Math.min(SIDE_REP_CAP,Math.max(0,Number(state.sideRep)||0))}
/** REP rank titles (display only; nothing is locked). */
export const RANKS=[[0,'Rookie Responder'],[150,'Field Tech'],[300,'Lab Lead'],[500,'Senior Investigator'],[700,'City Chemist']];
export function rankFor(rep){let i=0;RANKS.forEach((r,k)=>{if(rep>=r[0])i=k});return {index:i,title:RANKS[i][1],min:RANKS[i][0],next:RANKS[i+1]||null}}
/** Element Express reward: 15 per delivery; a first-try delivery adds 5, plus 5 for each earlier first-try delivery in the current streak (streak bonus capped at +20). */
export function expressReward(firstTry,streak){return 15+(firstTry?5+Math.min(20,5*Math.max(0,(streak|0)-1)):0)}

// ------------------------------------------------------------------ Element Express side jobs (logic only; UI lives in app.js)
/** The 22 rooftop tiles in world.js buildings (tests/chemistry.test.mjs keeps them in sync). */
export const EXPRESS_MARKS=['Li','Na','K','F','Ne','O','Mg','Cu','Fe','Zn','S','Cl','P','C','Si','N','Ar','Br','Ca','I','Al','He'];
const EXPRESS_HINTS={
 position:['Groups are the numbered columns across the top. Periods are the rows down the side.','Put a finger on the column, slide down to the row, then find that rooftop tile on the map (M).',[['Group 1, Period 3 → Na','Na'],['Group 2, Period 3 → Mg','Mg']]],
 family:['Named families are columns: alkali metals (Group 1), alkaline earth metals (Group 2), halogens (Group 17), noble gases (Group 18).','The period is the row number.',[['the halogen in Period 2 → Group 17, row 2 → F','F'],['the alkali metal in Period 4 → Group 1, row 4 → K','K']]],
 valence:['For main-group elements, the group gives the valence electrons: Groups 1–2 have 1–2; Groups 13–18 have 3–8 (on 1A–8A tables, the A number).','The number of occupied energy levels (electron shells) equals the period (row).',[['3 valence electrons and 3 energy levels → Group 13, Period 3 → Al','Al'],['1 valence electron and 2 energy levels → Group 1, Period 2 → Li','Li']]],
 protons:['Which number in each box of the table counts protons?','The atomic number is the proton count. Find the box with that number.',[['11 protons → atomic number 11 → Na','Na'],['12 protons → atomic number 12 → Mg','Mg']]]};
/** Every clue the side jobs can make for one rooftop element, built from element data only.
 * Transition metals (Cu, Fe, Zn) get only position and proton clues; He gets no valence clue. */
export function expressJobsFor(sym){const e=el(sym);if(!e||!e.group)return [];const g=e.group,p=e.period,v=valence(sym),n=e.number,out=[];
 out.push({kind:'position',want:{group:g,period:p},clue:`Group ${g}, Period ${p}.`});
 if(FAMILY[g])out.push({kind:'family',want:{family:g,period:p},clue:`The ${FAMILY[g]} in Period ${p}.`});
 if(v!==null&&sym!=='He')out.push({kind:'valence',want:{valence:v,period:p},clue:`My atoms have ${v} valence electron${v>1?'s':''} and ${p} occupied energy level${p>1?'s':''}.`});
 out.push({kind:'protons',want:{number:n},clue:`Each of my atoms contains ${n} protons.`});
 return out.map(t=>{const h=EXPRESS_HINTS[t.kind];return {id:'x'+n,...t,answer:sym,hints:[h[0],h[1],`Worked example: ${h[2].find(([,s])=>s!==sym)[0]}. Now do the same for your clue.`]}})}
const pickFrom=(rng,list)=>list[Math.min(list.length-1,Math.max(0,Math.floor((Number(rng())||0)*list.length)))];
/** A random side job {id, kind, clue, want, answer, hints}. rng() returns [0,1); lastSymbol is never repeated.
 * Check deliveries with checkWant(job.want, job.answer, symbol). */
export function makeExpressJob(rng=Math.random,lastSymbol=null){const answer=pickFrom(rng,EXPRESS_MARKS.filter(s=>s!==lastSymbol));return pickFrom(rng,expressJobsFor(answer))}
const COIN_FACTS={1:'alkali metals (hydrogen sits on top but is a nonmetal) · 1 valence electron · common ion +1 (Na⁺)',
 2:'alkaline earth metals · 2 valence electrons · common ion +2 (Mg²⁺)',13:'boron family · 3 valence electrons · aluminum forms Al³⁺',
 14:'carbon family · 4 valence electrons · usually shares electrons instead of forming simple ions',15:'nitrogen family · 5 valence electrons · common ion −3 (N³⁻) with active metals',
 16:'oxygen family (chalcogens) · 6 valence electrons · common ion −2 (O²⁻, S²⁻)',17:'halogens · 7 valence electrons · common ion −1 (Cl⁻)',
 18:'noble gases · 8 valence electrons (helium has 2) · very unreactive; rarely form compounds',
 12:'transition metals (d block; some tables list Zn, Cd and Hg as other metals) · zinc forms Zn²⁺'};
/** One-line fact card for an element-coin group (1–18), e.g. coinCard(17) → 'Group 17 (7A) · halogens · 7 valence electrons · common ion −1 (Cl⁻)'. */
export function coinCard(group){const g=Number(group);if(!Number.isInteger(g)||g<1||g>18)return '';const A={1:'1A',2:'2A',13:'3A',14:'4A',15:'5A',16:'6A',17:'7A',18:'8A'}[g];
 return `Group ${g}${A?` (${A})`:''} · ${COIN_FACTS[g]||'transition metals (d block) · charges vary; many form more than one ion'}`}

// ------------------------------------------------------------------ teacher evidence
/** Hint-ladder keys used by each investigation (app.js hintText keys). */
export const HINT_KEYS={courier:COURIER.map(c=>c.id),race:GATES.map(g=>g.id),power:['power'],show:SHOW_ROUNDS.map(r=>r.id),survey:['survey'],ions:RELAYS.map(t=>t.id)};
/** Per-investigation evidence for the progress download: questions asked, right on first try, revisions, hint steps opened. No personal data. */
export function missionStats(missionId,work,hints){const w=work||{},h=hints||{};
 return {asked:Object.keys(w.tries||{}).length,firstRight:w.firstRight||0,revisions:w.wrong||0,hints:(HINT_KEYS[missionId]||[]).reduce((a,k)=>a+(Number(h[k])||0),0)}}

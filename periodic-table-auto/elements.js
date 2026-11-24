/** Element City reference data. Sources and conventions: ../SOURCES.md and teacher.html.
 * state describes elemental substances at approximately 20–25 °C and 1 atm;
 * "unknown" means bulk state is not established here, not that the element is unknown.
 * This display uses La/Ac in group 3; Ce–Lu and Th–Lr are detached continuations.
 */
export const REFERENCE_CONDITIONS = 'Approximately 20–25 °C and 1 atmosphere';
export const TABLE_NOTE = 'Groups are columns; periods are rows. Atomic number counts protons. La and Ac occupy Group 3 in this layout; alternative Group 3 layouts exist. Detached rows continue periods 6 and 7. Categories summarize patterns, with boundary conventions and exceptions. Many US tables also label main groups 1A–8A; the A number equals the valence electrons (helium has 2). Electron configurations are written in filling order (4s before 3d); some references write 3d before 4s.';
export const CATEGORIES = {
  alkali: 'Alkali metal', alkaline: 'Alkaline earth metal', transition: 'Transition metal',
  'post-transition': 'Other metal', metalloid: 'Metalloid', nonmetal: 'Other nonmetal',
  halogen: 'Halogen', noble: 'Noble gas family', lanthanide: 'Lanthanide',
  actinide: 'Actinide', unknown: 'Properties uncertain'
};
const names = `H Hydrogen
He Helium
Li Lithium
Be Beryllium
B Boron
C Carbon
N Nitrogen
O Oxygen
F Fluorine
Ne Neon
Na Sodium
Mg Magnesium
Al Aluminum
Si Silicon
P Phosphorus
S Sulfur
Cl Chlorine
Ar Argon
K Potassium
Ca Calcium
Sc Scandium
Ti Titanium
V Vanadium
Cr Chromium
Mn Manganese
Fe Iron
Co Cobalt
Ni Nickel
Cu Copper
Zn Zinc
Ga Gallium
Ge Germanium
As Arsenic
Se Selenium
Br Bromine
Kr Krypton
Rb Rubidium
Sr Strontium
Y Yttrium
Zr Zirconium
Nb Niobium
Mo Molybdenum
Tc Technetium
Ru Ruthenium
Rh Rhodium
Pd Palladium
Ag Silver
Cd Cadmium
In Indium
Sn Tin
Sb Antimony
Te Tellurium
I Iodine
Xe Xenon
Cs Cesium
Ba Barium
La Lanthanum
Ce Cerium
Pr Praseodymium
Nd Neodymium
Pm Promethium
Sm Samarium
Eu Europium
Gd Gadolinium
Tb Terbium
Dy Dysprosium
Ho Holmium
Er Erbium
Tm Thulium
Yb Ytterbium
Lu Lutetium
Hf Hafnium
Ta Tantalum
W Tungsten
Re Rhenium
Os Osmium
Ir Iridium
Pt Platinum
Au Gold
Hg Mercury
Tl Thallium
Pb Lead
Bi Bismuth
Po Polonium
At Astatine
Rn Radon
Fr Francium
Ra Radium
Ac Actinium
Th Thorium
Pa Protactinium
U Uranium
Np Neptunium
Pu Plutonium
Am Americium
Cm Curium
Bk Berkelium
Cf Californium
Es Einsteinium
Fm Fermium
Md Mendelevium
No Nobelium
Lr Lawrencium
Rf Rutherfordium
Db Dubnium
Sg Seaborgium
Bh Bohrium
Hs Hassium
Mt Meitnerium
Ds Darmstadtium
Rg Roentgenium
Cn Copernicium
Nh Nihonium
Fl Flerovium
Mc Moscovium
Lv Livermorium
Ts Tennessine
Og Oganesson`.split('\n').map(line => line.split(' '));
const rows = [
 [1,2], [3,4,5,6,7,8,9,10], [11,12,13,14,15,16,17,18],
 Array.from({length:18},(_,i)=>19+i), Array.from({length:18},(_,i)=>37+i),
 [55,56,57,...Array.from({length:15},(_,i)=>72+i)],
 [87,88,89,...Array.from({length:15},(_,i)=>104+i)]
];
const location = {};
rows.forEach((row,p)=>row.forEach((n,i)=>{
 const g = p===0 ? (i===0 ? 1 : 18) : (p<3 && i>1 ? i+11 : i+1);
 location[n]={group:g,period:p+1};
}));
for(let n=58;n<=71;n++)location[n]={group:null,period:6};
for(let n=90;n<=103;n++)location[n]={group:null,period:7};
const gases = new Set([1,2,7,8,9,10,17,18,36,54,86]);
const liquids = new Set([35,80]);
const metalloid = new Set([5,14,32,33,51,52]);
const nonmetal = new Set([1,6,7,8,15,16,34]);
const otherMetal = new Set([13,30,31,48,49,50,80,81,82,83,84]);
const detail = {
 1:{notes:'Hydrogen is a nonmetal placed above Group 1; it is not an alkali metal. Ordinary elemental hydrogen is H₂ gas.', properties:{appearance:'Colorless gas',reactivity:'Its chemistry differs from the alkali metals.'}},
 2:{notes:'Helium has a full first shell containing two electrons. Noble gases have low reactivity under ordinary conditions.',properties:{appearance:'Colorless gas'}},
 3:{notes:'Common simple ion: Li⁺. In the virtual comparison, lithium is less reactive than sodium and potassium.',properties:{conductivity:'Conducts electricity',appearance:'Silvery metal; surface changes in air',malleability:'Soft metal'}},
 4:{notes:'Group 2 element. The simple +2 pattern is useful, but not every compound of this element is best described as ionic.',properties:{appearance:'Gray metal',conductivity:'Conducts electricity'}},
 5:{notes:'A metalloid: category names summarize patterns rather than making every property identical.',properties:{appearance:'Dark solid',malleability:'Brittle rather than easily shaped'}},
 6:{notes:'Carbon has different elemental forms (allotropes). Graphite conducts electricity; diamond does not conduct appreciably under ordinary conditions.',properties:{appearance:'Graphite: dark solid; diamond: transparent crystal',conductivity:'Depends on allotrope',malleability:'Graphite is not a ductile wire material'}},
 7:{notes:'Ordinary elemental nitrogen is N₂ gas.',properties:{appearance:'Colorless gas'}},
 8:{notes:'Ordinary elemental oxygen is O₂ gas. Oxide ions in simple ionic compounds are O²⁻.',properties:{appearance:'Colorless gas'}},
 9:{notes:'A Group 17 halogen. Ordinary elemental fluorine is F₂. Fluoride ions are F⁻; elemental fluorine and its compounds have different properties.',properties:{appearance:'Pale yellow gas'}},
 10:{notes:'A Group 18 noble gas with low ordinary reactivity.',properties:{appearance:'Colorless gas; emits light in an electrical discharge'}},
 11:{notes:'Common simple ion: Na⁺. Sodium metal is a different substance from sodium chloride.',properties:{conductivity:'Conducts electricity',appearance:'Silvery when freshly exposed',malleability:'Soft metal',reactivity:'Highly reactive; virtual observations only'}},
 12:{notes:'Common simple ion: Mg²⁺. Magnesium chloride has formula MgCl₂.',properties:{conductivity:'Conducts electricity',appearance:'Silvery metal'}},
 13:{notes:'Aluminum is also spelled aluminium. Its metal conducts electricity and can be formed into useful shapes.',properties:{conductivity:'Good electrical conductor',appearance:'Silvery metal',malleability:'Malleable and ductile'}},
 14:{notes:'Silicon is a metalloid used in semiconductor devices; its electrical behavior depends strongly on conditions and added dopants. Silicon is not silicone.',properties:{conductivity:'Semiconductor',appearance:'Gray with metallic luster',malleability:'Brittle'}},
 15:{notes:'Phosphorus has several elemental forms; properties vary between them.',properties:{appearance:'Depends on allotrope'}},
 16:{notes:'Sulfur is a nonmetal. Sulfide ions in simple ionic compounds are S²⁻.',properties:{conductivity:'Poor electrical conductor under ordinary conditions',appearance:'Common form: yellow solid',malleability:'Brittle'}},
 17:{notes:'Ordinary elemental chlorine is Cl₂ gas. Chloride ions are Cl⁻. Sodium chloride does not inherit the properties of chlorine gas.',properties:{appearance:'Yellow-green gas',reactivity:'Reactive halogen; no real experiment in this game'}},
 18:{notes:'A Group 18 noble gas with low ordinary reactivity; useful where a less reactive atmosphere is needed.',properties:{appearance:'Colorless gas'}},
 19:{notes:'Common simple ion: K⁺. In the virtual comparison, potassium reacts more vigorously than lithium or sodium.',properties:{conductivity:'Conducts electricity',appearance:'Silvery metal',malleability:'Soft metal',reactivity:'Highly reactive; virtual observations only'}},
 20:{notes:'Common simple ion: Ca²⁺. Group 2 family members share patterns but do not behave identically.',properties:{appearance:'Silvery-gray metal',conductivity:'Conducts electricity'}},
 26:{notes:'Iron is a transition metal; common ions include Fe²⁺ and Fe³⁺. Simple main-group charge shortcuts do not apply universally.',properties:{conductivity:'Conducts electricity',appearance:'Gray metal',magnetism:'Ferromagnetic; most metals are not ferromagnetic'}},
 29:{notes:'Copper combines good conductivity with ductility, making it useful for electrical wiring.',properties:{conductivity:'Very good electrical conductor',appearance:'Reddish metallic luster',malleability:'Can bend and be drawn into wires'}},
 30:{notes:'Zinc is a Group 12 d-block metal. It is classified here as “other metal”; transition-metal boundary conventions vary.',properties:{conductivity:'Conducts electricity',appearance:'Silvery metal'}},
 35:{notes:'A Group 17 halogen. Elemental bromine is Br₂, liquid at the stated room conditions. Bromide ions are Br⁻.',properties:{appearance:'Red-brown liquid'}},
 36:{notes:'A Group 18 noble gas with low ordinary reactivity. “Noble” does not mean chemically impossible to react.',properties:{appearance:'Colorless gas'}},
 53:{notes:'A Group 17 halogen. Elemental iodine is I₂, a solid at the stated room conditions. Iodide ions are I⁻.',properties:{appearance:'Dark lustrous solid'}},
 54:{notes:'A Group 18 noble gas with low ordinary reactivity. Xenon can form compounds under suitable conditions.',properties:{appearance:'Colorless gas'}},
 57:{notes:'Shown in Group 3 in this teaching layout. Other tables place Lu instead; lanthanide classification includes La–Lu.'},
 71:{notes:'Detached continuation of period 6 in this layout. Alternative periodic-table layouts place Lu in Group 3.'},
 80:{notes:'Mercury is a liquid metal at the stated room conditions. Group 12 is grouped here as other metals; category conventions vary.'},
 84:{notes:'Polonium is classified here as an other metal; metalloid boundaries vary among references.'},
 85:{notes:'Group 17 position is established; bulk properties are difficult to establish for this short-lived radioactive element. Family membership does not guarantee identical properties.'},
 87:{notes:'Room-temperature physical properties are inferred for this extremely scarce radioactive element.'},
 89:{notes:'Shown in Group 3 in this teaching layout. Alternative tables place Lr instead; actinide classification includes Ac–Lr.'},
 103:{notes:'Detached continuation of period 7 here. Alternative periodic-table layouts place Lr in Group 3. Bulk state is not established in this reference.'}
};
function category(n,g){
 if(n>=57&&n<=71)return 'lanthanide';
 if(n>=89&&n<=103)return 'actinide';
 if(n>=104)return 'unknown';
 if(n===1)return 'nonmetal';
 if(g===1)return 'alkali';
 if(g===2)return 'alkaline';
 if(g===17)return 'halogen';
 if(g===18)return 'noble';
 if(metalloid.has(n))return 'metalloid';
 if(nonmetal.has(n))return 'nonmetal';
 if(otherMetal.has(n))return 'post-transition';
 return 'transition';
}
export const ELEMENTS = names.map(([symbol,name],i)=>{
 const number=i+1, loc=location[number];
 const state=number>=100||number===85 ? 'unknown' : gases.has(number)?'gas':liquids.has(number)?'liquid':'solid';
 const e={number,symbol,name,...loc,category:category(number,loc.group),state,conditions:REFERENCE_CONDITIONS,...(detail[number]||{})};
 if(number>=104)e.notes='Position and atomic identity are established. Bulk properties are uncertain; no measured room-temperature state or ordinary family behavior is assumed here.';
 if(number===117)e.notes+=' Group 17 placement suggests a relationship to the halogens, but measured bulk halogen behavior is not established.';
 if(number===118)e.notes+=' Group 18 placement does not establish that oganesson is a gas or has ordinary noble-gas behavior.';
 return Object.freeze(e);
});
export const elementBySymbol = symbol => ELEMENTS.find(e=>e.symbol.toLowerCase()===String(symbol).toLowerCase());

/** Average atomic masses (amu): IUPAC/CIAAW standard atomic weights, abridged to at most five
 * significant figures; conventional values for elements with an interval (H 1.008, Cl 35.45).
 * '—' = no standard atomic weight (no stable isotopes and no characteristic terrestrial composition). */
export const MASS=`1.008 4.0026 6.94 9.0122 10.81 12.011 14.007 15.999 18.998 20.180 22.990 24.305 26.982 28.085 30.974 32.06 35.45 39.95 39.098 40.078
 44.956 47.867 50.942 51.996 54.938 55.845 58.933 58.693 63.546 65.38 69.723 72.630 74.922 78.971 79.904 83.798 85.468 87.62 88.906 91.222
 92.906 95.95 — 101.07 102.91 106.42 107.87 112.41 114.82 118.71 121.76 127.60 126.90 131.29 132.91 137.33 138.91 140.12 140.91 144.24
 — 150.36 151.96 157.25 158.93 162.50 164.93 167.26 168.93 173.05 174.97 178.49 180.95 183.84 186.21 190.23 192.22 195.08 196.97 200.59
 204.38 207.2 208.98 — — — — — — 232.04 231.04 238.03`.split(/\s+/).concat(Array(26).fill('—'));
/** Pauling electronegativity (RSC periodic table values) for elements 1–56. Noble gases are omitted:
 * He, Ne and Ar have no Pauling value, and this game does not list Kr or Xe. */
export const EN_ALL=Object.freeze({H:2.20,Li:0.98,Be:1.57,B:2.04,C:2.55,N:3.04,O:3.44,F:3.98,Na:0.93,Mg:1.31,Al:1.61,Si:1.90,P:2.19,S:2.58,Cl:3.16,
 K:0.82,Ca:1.00,Sc:1.36,Ti:1.54,V:1.63,Cr:1.66,Mn:1.55,Fe:1.83,Co:1.88,Ni:1.91,Cu:1.90,Zn:1.65,Ga:1.81,Ge:2.01,As:2.18,Se:2.55,Br:2.96,
 Rb:0.82,Sr:0.95,Y:1.22,Zr:1.33,Nb:1.6,Mo:2.16,Tc:1.9,Ru:2.2,Rh:2.28,Pd:2.20,Ag:1.93,Cd:1.69,In:1.78,Sn:1.96,Sb:2.05,Te:2.1,I:2.66,Cs:0.79,Ba:0.89});
/** Ground-state electron configurations, written in filling (Aufbau/Madelung) order as most US high-school
 * texts do (4s before 3d). EXC lists the known exceptions to simple filling; 104+ are predicted. */
const ORBITALS=['1s','2s','2p','3s','3p','4s','3d','4p','5s','4d','5p','6s','4f','5d','6p','7s','5f','6d','7p'];
const CAPACITY={s:2,p:6,d:10,f:14};
const CORES=[[86,'Rn'],[54,'Xe'],[36,'Kr'],[18,'Ar'],[10,'Ne'],[2,'He']];
const EXC={24:'4s1 3d5',29:'4s1 3d10',41:'5s1 4d4',42:'5s1 4d5',44:'5s1 4d7',45:'5s1 4d8',46:'4d10',47:'5s1 4d10',
 57:'6s2 5d1',58:'6s2 4f1 5d1',64:'6s2 4f7 5d1',78:'6s1 4f14 5d9',79:'6s1 4f14 5d10',
 89:'7s2 6d1',90:'7s2 6d2',91:'7s2 5f2 6d1',92:'7s2 5f3 6d1',93:'7s2 5f4 6d1',96:'7s2 5f7 6d1',103:'7s2 5f14 7p1'};
const coreOf=n=>CORES.find(([z])=>z<n)||null;
const sup=k=>String(k).replace(/\d/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[c]);
const fmt=list=>list.map(([o,k])=>o+sup(k)).join(' ');
/** [[orbital, electrons], …] for element n, exceptions included. */
export function orbitalsOf(n){
 if(EXC[n]){const [z]=coreOf(n);return [...orbitalsOf(z),...EXC[n].split(' ').map(t=>[t.slice(0,2),Number(t.slice(2))])]}
 const out=[];let left=n;for(const o of ORBITALS){if(left<=0)break;const k=Math.min(CAPACITY[o[1]],left);out.push([o,k]);left-=k}return out}
/** Noble-gas shorthand, e.g. configOf(8) → '[He] 2s² 2p⁴'. */
export function configOf(n){const all=orbitalsOf(n),core=coreOf(n);const tail=core?all.slice(orbitalsOf(core[0]).length):all;
 return (core?`[${core[1]}] `:'')+fmt(tail)+(n>=104?' (predicted)':'')}
/** Full configuration, e.g. fullConfigOf(11) → '1s² 2s² 2p⁶ 3s¹'. */
export const fullConfigOf=n=>fmt(orbitalsOf(n))+(n>=104?' (predicted)':'');
/** Electrons per occupied energy level (shell), e.g. shellsOf(11) → [2, 8, 1]. */
export function shellsOf(n){const s=[];for(const [o,k] of orbitalsOf(n)){const level=Number(o[0]);s[level-1]=(s[level-1]||0)+k}return Array.from(s,v=>v||0)}

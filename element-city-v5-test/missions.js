/** Mission content and pure chemistry checks. See SOURCES.md for factual sources.
 * Observations are simulated, qualitative evidence at approximately 20–25 °C, 1 atm.
 * These scenes do not describe real laboratory procedures.
 */
export const EXTRA_MISSIONS = [
 {
  id:'identity', title:'The Missing Identity', person:'Noor Quill', role:'Harbor logistics coordinator', initials:'NQ', station:'identity',
  concept:'Combine periodic-table location and observed properties to identify elements.',
  intro:'Our cargo labels went through the harbor’s “helpful” sorting system. Now everything says miscellaneous. The sealed sample records survived. Use their locations and observations to restore three identities—and get our deliveries moving.',
  objective:'Meet Noor at the cargo station in Halogen Harbor.',
  reward:'Harbor deliveries restored · Family archive unlocked',
  debrief:'A period and group identify one table location. The independent observations support that identification: magnesium is a solid metal, argon is a low-reactivity gas, and elemental bromine is a liquid at the stated room conditions. Atomic number then tells you the number of protons. Evidence supports an identity; one appearance alone rarely proves it.',
  hints:[
   'Start with each recorded period and group. Then compare the observed state and properties.',
   'Periods are horizontal rows; groups are numbered columns. All three clues refer to elemental substances near 20–25 °C and 1 atmosphere.',
   'Period 3 / Group 2 is Mg; Period 3 / Group 18 is Ar; Period 4 / Group 17 is Br. Check that the solid metal, low-reactivity gas, and red-brown liquid observations agree.'
  ]
 },
 {
  id:'family', title:'Family Business', person:'Dr. Sora Lin', role:'Periodic archive curator', initials:'SL', station:'family',
  concept:'Recognize important families and distinguish hydrogen from the alkali metals.',
  intro:'The archive’s sorter is grouping everything by first impression. “Shiny things” is not a useful shipping address. Rebuild the family shelves from the table—and give hydrogen the special treatment it deserves.',
  objective:'Meet Dr. Lin at the Periodic Family Archive.',
  reward:'Family archive restored · Virtual reaction lab unlocked · Amber fleet appearance',
  debrief:'Li and Na are Group 1 alkali metals; Mg and Ca are Group 2 alkaline earth metals; Cl and Br are Group 17 halogens; Ne and Ar belong to Group 18. Hydrogen is placed above Group 1 but is a nonmetal, not an alkali metal. A family suggests patterns, not identical properties or universal behavior.',
  hints:[
   'Use the group columns to sort the samples. You can open the periodic table at any time.',
   'The family columns are 1, 2, 17, and 18. Hydrogen needs its own special-case shelf.',
   'Alkali: Li, Na. Alkaline earth: Mg, Ca. Halogen: Cl, Br. Noble gas: Ne, Ar. Hydrogen: separate nonmetal.'
  ]
 },
 {
  id:'reaction', title:'Reaction Dispatch', person:'Theo Finch', role:'Virtual laboratory engineer', initials:'TF', station:'reaction',
  concept:'Predict a Group 1 pattern and explain it using energy levels, shielding, and attraction.',
  intro:'Our virtual lab’s response model has its settings backward. The city dispatches the wrong simulated response every time. Predict the order for lithium, sodium, and potassium, compare the virtual observations, and repair the model’s explanation.',
  objective:'Meet Theo at the virtual research station on Alkali Avenue.',
  reward:'Virtual response model repaired · Ion relay unlocked',
  debrief:'For comparable conditions, the Li → Na → K sequence generally shows increasing alkali-metal reactivity. Down the group, more occupied energy levels place the outer electron farther from the nucleus and inner electrons provide more shielding. These effects make that electron easier to remove even though the nucleus contains more protons. The response display is a qualitative model, not a measured reaction rate.',
  hints:[
   'Find Li, Na, and K in Group 1. Compare their periods and think about the outer electron.',
   'Down this group there are more occupied energy levels and more shielding. The increased proton count alone does not tell you the attraction experienced by the outer electron.',
   'Order the virtual reactivity from lower to higher as Li, Na, K. Choose the explanation involving greater distance and shielding, weaker outer-electron attraction, and easier removal.'
  ]
 },
 {
  id:'ions', title:'City of Ions', person:'Ari Vega', role:'City systems designer', initials:'AV', station:'ions',
  concept:'Build neutral formula-unit ratios and distinguish compound properties from elemental properties.',
  intro:'Our fictional Ion Relay uses balanced charge models to route the city’s signals. The new settings leave a charge mismatch. Build each simplest neutral ratio, then check the material records before we reconnect the city.',
  objective:'Meet Ari at the Ion Relay in the research district.',
  reward:'Ion relay restored · All five city systems online',
  debrief:'NaCl balances one +1 and one −1 ion. MgCl₂ needs one Mg²⁺ for two Cl⁻ ions. MgO balances Mg²⁺ and O²⁻ in a 1:1 ratio. These formulas describe the simplest whole-number ratios in ionic lattices, not isolated molecules. Sodium chloride has its own properties; it does not inherit those of sodium metal and chlorine gas. The Ion Relay is fictional.',
  hints:[
   'Add the positive and negative charges. A neutral formula unit has total charge zero, with both ion types present.',
   'Use the smallest whole-number ratio. One Mg²⁺ needs two Cl⁻ ions, but only one O²⁻ ion.',
   'Use Na:Cl = 1:1, Mg:Cl = 1:2, and Mg:O = 1:1. Compounds have properties different from their constituent elements.'
  ]
 }
];

export const SAMPLES = [
 {id:'A',name:'Crate A',answer:'Mg',clues:['Period 3','Group 2'],observations:['Solid at 20–25 °C and 1 atm','Silvery metallic appearance','Conducts electricity in the virtual test'],inference:'The Group 2 location in Period 3 identifies magnesium; its metallic observations support the record.'},
 {id:'B',name:'Crate B',answer:'Ar',clues:['Period 3','Group 18'],observations:['Gas at 20–25 °C and 1 atm','Colorless in the sealed virtual sample','Little chemical change in this ordinary-condition simulation'],inference:'The Group 18 location in Period 3 identifies argon. Low ordinary reactivity does not mean no noble gas can ever react.'},
 {id:'C',name:'Crate C',answer:'Br',clues:['Period 4','Group 17'],observations:['Liquid at 20–25 °C and 1 atm','Red-brown in the sealed virtual sample'],inference:'The Group 17 location in Period 4 identifies bromine. Halogens do not all have the same state of matter.'}
];
const cleanSymbol = value => String(value??'').trim().toLowerCase();
export function validateIdentities(answers={}){
 const missing=SAMPLES.filter(s=>!String(answers[s.id]??'').trim());
 if(missing.length)return {ok:false,text:`Choose an identity for ${missing.map(s=>s.name).join(' and ')} before testing the shipment labels. Use the periodic table; there is no need to guess from memory.`};
 const wrong=SAMPLES.filter(s=>cleanSymbol(answers[s.id])!==cleanSymbol(s.answer));
 if(wrong.length){
  const s=wrong[0];
  return {ok:false,text:`${s.name} does not match that identification. Locate ${s.clues[0].toLowerCase()} and ${s.clues[1].toLowerCase()} together, then check the recorded state and appearance. Keep any labels that already match and revise this one.`};
 }
 return {ok:true,text:'Shipment identities confirmed: A = Mg (12 protons), B = Ar (18 protons), C = Br (35 protons). Each table location and its observations agree. The harbor can route the labeled records correctly.'};
}
export const FAMILY_SAMPLES = [
 {symbol:'Li',answer:'alkali'},{symbol:'Na',answer:'alkali'},
 {symbol:'Mg',answer:'alkaline'},{symbol:'Ca',answer:'alkaline'},
 {symbol:'Cl',answer:'halogen'},{symbol:'Br',answer:'halogen'},
 {symbol:'Ne',answer:'noble'},{symbol:'Ar',answer:'noble'},
 {symbol:'H',answer:'separate'}
];
const FAMILY_NAMES={alkali:'alkali metals (Group 1, excluding H)',alkaline:'alkaline earth metals (Group 2)',halogen:'halogens (Group 17)',noble:'noble gases (Group 18)',separate:'hydrogen: separate nonmetal'};
export function validateFamilies(answers={}){
 const missing=FAMILY_SAMPLES.find(s=>!answers[s.symbol]);
 if(missing)return {ok:false,text:`Assign ${missing.symbol} to a shelf before checking the archive. Each sample needs one family label or the hydrogen special case.`};
 const wrong=FAMILY_SAMPLES.find(s=>answers[s.symbol]!==s.answer);
 if(wrong){
  if(wrong.symbol==='H')return {ok:false,text:'Hydrogen is the outlier. Its Group 1 placement does not make it an alkali metal: it is a nonmetal with distinct chemistry. Use the separate hydrogen shelf.'};
  return {ok:false,text:`Recheck ${wrong.symbol} in the periodic table. It belongs with the ${FAMILY_NAMES[wrong.answer]}. Shared family patterns do not mean every property is identical.`};
 }
 return {ok:true,text:'Archive restored. Four family patterns are in place, and hydrogen has its own nonmetal shelf. Group membership is useful evidence, not a promise of identical behavior.'};
}
export function validateReaction(order=[],explanation=''){
 if(!Array.isArray(order)||order.length!==3||new Set(order.map(cleanSymbol)).size!==3)return {ok:false,text:'Place each of Li, Na, and K exactly once in the prediction, from lower to higher virtual reactivity.'};
 if(order.map(cleanSymbol).join(',')!=='li,na,k')return {ok:false,text:'The virtual records show the lower-to-higher sequence Li, Na, K under comparable conditions. Compare their periods: down Group 1, the outer electron is farther from the nucleus and more shielded. Revise the prediction using that evidence.'};
 if(explanation!=='shielding'){
  const feedback={protons:'There are more protons down Group 1, but that alone predicts the wrong outer-electron behavior. Added occupied energy levels and shielding are essential.',electrons:'All three neutral atoms have one outer-shell electron in this simplified main-group model. The important changes are distance from the nucleus and shielding.',nucleus:'The nuclear charge increases down this group; the nucleus does not become less positive. More occupied energy levels and shielding reduce the attraction experienced by the outer electron.',mass:'Atomic mass alone does not explain easier electron removal. Use the outer electron’s distance, shielding, and attraction.'};
  return {ok:false,text:`The order matches the virtual observations. ${feedback[explanation]||'Now explain it using more occupied energy levels, increased shielding, weaker attraction to the outer electron, and easier removal.'}`};
 }
 return {ok:true,text:'Model repaired: Li < Na < K in this comparable virtual reactivity investigation. Additional occupied energy levels and shielding make the outer electron easier to remove, despite greater nuclear charge. This is a general pattern, not a universal rule for every reaction.'};
}
export const ION_TASKS = [
 {id:'nacl',name:'Sodium chloride',formula:'NaCl',cation:{symbol:'Na',charge:1},anion:{symbol:'Cl',charge:-1},properties:'An ionic solid at ordinary room conditions. It has properties different from sodium metal and chlorine gas; chloride ions are not chlorine molecules.'},
 {id:'mgcl2',name:'Magnesium chloride',formula:'MgCl₂',cation:{symbol:'Mg',charge:2},anion:{symbol:'Cl',charge:-1},properties:'The simplest neutral ratio is one Mg²⁺ ion for two Cl⁻ ions: (+2) + 2(−1) = 0. These are ion ratios in an extended solid.'},
 {id:'mgo',name:'Magnesium oxide',formula:'MgO',cation:{symbol:'Mg',charge:2},anion:{symbol:'O',charge:-2},properties:'One Mg²⁺ and one O²⁻ balance: (+2) + (−2) = 0. Mg₂O₂ has the same ratio but is not the simplest formula unit.'}
];
export function validateCompound(value){
 if(value==='different')return {ok:true,text:'Correct. The identities and arrangement of particles change when a compound forms. Sodium chloride is an ionic solid with its own properties—not a mixture of sodium metal and chlorine gas. The fictional relay can reconnect.'};
 return {ok:false,text:value==='mixture'?'Sodium chloride is a compound, not a physical mixture of sodium metal and chlorine gas. Its structure contains Na⁺ and Cl⁻ ions, with different properties. Revise the material record.':'A compound does not automatically inherit the properties of its constituent elemental substances. NaCl contains Na⁺ and Cl⁻ ions in a lattice; it is not sodium metal or Cl₂ gas. Choose the explanation that recognizes the difference.'};
}

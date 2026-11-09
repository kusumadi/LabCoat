export const actions = {
  prepare: 'Condition the burette with NaOH, fill it, and clear the tip into waste.',
  transfer: 'Condition the volumetric pipette with HCl and use a filler to transfer the configured aliquot to a clean conical flask.',
  indicator: 'Add two drops of phenolphthalein and place the flask on the white tile.',
  initial: 'Read the bottom of the meniscus at eye level and record the initial reading to 0.01 mL.',
  titrate: 'Add NaOH while swirling. Near the endpoint use single drops and look for a faint pink that persists for about 30 seconds.',
  final: 'Record the final meniscus reading and calculate final minus initial. Repeat with fresh aliquots and use concordant titres.'
};
export const catalogue = {
  prepare: ['burette', 'stand and clamp', 'NaOH', 'waste'],
  transfer: ['pipette and filler', 'HCl', 'conical flask'],
  indicator: ['phenolphthalein', 'white tile', 'conical flask'],
  initial: ['burette'], titrate: ['burette', 'stopcock', 'conical flask', 'white tile'], final: ['burette', 'notebook']
};
export const sequence = Object.keys(actions);
export const handout = Object.values(actions).join('\n');
export const sample = { volume:25, base:0.1, low:0.099, high:0.101, tolerance:0.10, hints:'both' };
export const equivalence = (acid, volume, base) => acid * volume / base;
export function validate(c) {
  const ranges = {volume:[5,25],base:[0.025,0.5],low:[0.005,0.5],high:[0.005,0.5],tolerance:[0.01,1]};
  for (const [key,[min,max]] of Object.entries(ranges)) {
    if (!Number.isFinite(c[key]) || c[key] < min || c[key] > max) throw Error(key + ' must be between ' + min + ' and ' + max);
  }
  if (c.low > c.high || equivalence(c.high,c.volume,c.base) > 45 || equivalence(c.low,c.volume,c.base) < 1)
    throw Error('Configure a concentration or range giving titres between 1 and 45 mL.');
  if (![5,10,20,25].includes(c.volume)) throw Error('Choose a supported volumetric pipette.');
  if (!['both','practice','off'].includes(c.hints)) throw Error('Choose a hint policy.');
  if (!Array.isArray(c.steps) || c.steps.some(s => !s.source?.trim() || s.warning || !sequence.includes(s.action)) ||
      [...new Set(c.steps.map(s=>s.action))].join() !== sequence.join())
    throw Error('Resolve every step and include all six required actions in bench order.');
  return c;
}
export function trial(index) {
  return { start:[0.73,1.34,0.46,1.81][index%4], delivered:0, unmixed:0, stage:'prepare', initial:null, final:null, held:false };
}
export function chemistry(c, acid, t, mixed = true) {
  const acidMoles = acid * c.volume / 1000;
  const baseMoles = c.base * (t.delivered - (mixed ? 0 : t.unmixed)) / 1000;
  const excess = (acidMoles - baseMoles) / ((c.volume + t.delivered) / 1000);
  const root = Math.hypot(excess, 2e-7);
  const hydrogen = excess >= 0 ? (excess + root)/2 : 2e-14/(root-excess);
  const pH = -Math.log10(hydrogen);
  const pink = pH < 8.3 ? 0 : 1/(1+10**(9.3-pH));
  return { acidMoles, baseMoles, pH, pink, color:pink===0?'clear':pink<0.7?'faint pink':'deep pink' };
}
const dosePrecision = n => Math.round(n*1000)/1000;
export const round = n => Math.round(n*100)/100;
export const titre = t => round(t.final-t.initial);
export function concentration(titres,c,unit) {
  return titres.reduce((sum,n)=>sum+n,0)/titres.length*c.base/c.volume*(unit==='mmol/L'?1000:1);
}
export function concordant(trials,tolerance) {
  const sorted = trials.filter((t,i)=>i>0 && t.stage==='done').map(titre).sort((a,b)=>a-b);
  let best=[];
  for (let i=0;i<sorted.length;i++) {
    const window=sorted.slice(i).filter(n=>round(n-sorted[i])<=tolerance);
    if (window.length>best.length) best=window;
  }
  return best;
}
export function advance(t, action, value) {
  if (action==='add' && t.stage==='titrate') {
    const amount = {stream:1,drop:0.03,partial:0.001}[value];
    if (!amount || dosePrecision(t.start+t.delivered+amount)>50) throw Error('The burette cannot deliver that volume.');
    t.delivered=dosePrecision(t.delivered+amount);
    t.unmixed=dosePrecision(t.unmixed+amount);
    t.held=false;
    return;
  }
  if (action==='swirl' && t.stage==='titrate') {t.unmixed=0;t.held=false;return;}
  if (action==='observe' && t.stage==='titrate' && t.delivered>0 && !t.unmixed) {t.held=true;return;}
  if (action==='finish' && t.stage==='titrate' && t.held) {t.stage='final';return;}
  if (action!==t.stage || action==='titrate' || action==='done') throw Error('Complete the current procedure step first.');
  if (action==='initial' || action==='final') {
    if (typeof value!=='string' || !/^\d{1,2}\.\d{2}$/.test(value) || +value>50 || (action==='final' && +value<=t.initial))
      throw Error('Enter a reading to 0.01 mL within the scale. The final reading must exceed the initial reading.');
    t[action]=+value;
  }
  t.stage=sequence[sequence.indexOf(action)+1] ?? 'done';
}



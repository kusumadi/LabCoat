export const equipment = {
  table: 'Teaching table',
  burette: 'Burette, stand and clamp',
  flask: 'Conical flask',
  tile: 'White tile',
  pipette: 'Pipette and filler',
  base: 'NaOH bottle',
  acid: 'HCl bottle',
  indicator: 'Indicator bottle'
};
export const defaultEnvironment = {
  lighting: 1, surface: 'sage', height: 0, layout: {}, movable: true, experiments: true
};
export function moveEquipment(layout, item, x, z) {
  const limitX = item === 'table' ? 2 : 2.5;
  const limitZ = item === 'table' ? 1.5 : 1.6;
  return {...layout, [item]: {
    x: Math.max(-limitX, Math.min(limitX, x)),
    z: Math.max(-limitZ, Math.min(limitZ, z))
  }};
}
export function aligned(layout) {
  const {x:fx=0,z:fz=0}=layout.flask ?? {};
  const {x:bx=0,z:bz=0}=layout.burette ?? {};
  return Math.hypot(fx-bx,fz-bz) <= .15;
}
export function validateEnvironment(input = defaultEnvironment) {
  if (!input || !Number.isFinite(input.lighting) || input.lighting<.45 || input.lighting>1.35 ||
      !Number.isFinite(input.height) || Math.abs(input.height)>.8 ||
      !['sage','slate','birch'].includes(input.surface) ||
      typeof input.movable!=='boolean' || typeof input.experiments!=='boolean' ||
      !input.layout || typeof input.layout!=='object' || Array.isArray(input.layout)) throw Error('Review the lab environment settings.');
  for (const [item,p] of Object.entries(input.layout)) {
    if (!Object.hasOwn(equipment,item) || !p || !Number.isFinite(p.x) || !Number.isFinite(p.z))
      throw Error('Unknown equipment or invalid starting position.');
    const bounded=moveEquipment({},item,p.x,p.z)[item];
    if (bounded.x!==p.x || bounded.z!==p.z) throw Error('Keep the equipment within the bench area.');
  }
  return input;
}

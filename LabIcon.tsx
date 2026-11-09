const paths:Record<string,string>={
  flask:'M9 3h6M10 3v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8',
  beaker:'M5 3h15l-2 3v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6L5 3m2 11c3-2 7 2 10 0M14 8h4m-4 3h4',
  cylinder:'M10 3h5v16h-5zM7 21h11m-6-14h3m-3 4h3m-3 4h3',
  dish:'M3 13h18c0 4-4 7-9 7s-9-3-9-7Zm4-3h.01m5-3h.01m5 3h.01',
  balance:'M4 8h16m-8-4v16m-5 0h10M6 8l-3 6h6L6 8Zm12 0-3 6h6l-3-6Z',
  timer:'M9 3h6m-3 0v3m7 0-2 2m3 6a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-4v4l2 2',
  notebook:'M6 3h13v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 0v18m3-13h6m-6 4h6',
  lens:'M20 20l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  filter:'M3 4h18l-7 9v6l-4 2v-8L3 4Z',
  blot:'M4 5h11l5 5v9H4zM15 5v5h5M7 14h9m-9 3h6',
  drop:'M12 3c3 4 6 8 6 12a6 6 0 0 1-12 0c0-4 3-8 6-12Zm-3 12c0 2 1 3 3 3',
  mix:'M4 9a8 8 0 0 1 13-4l3 3m0-4v4h-4m4 7a8 8 0 0 1-13 4l-3-3m0 4v-4h4',
  heat:'M9 21c-4-2-5-6-2-9l2 2c0-4 3-5 3-10 3 3 5 5 5 9l2-2c3 5 0 9-4 10m-4 0c-2-2 0-4 1-5 2 2 2 4 0 5',
  cool:'M12 3v18M4 7l16 10M4 17 20 7M9 5l3 3 3-3m-6 14 3-3 3 3',
  tag:'M3 4h8l9 9-7 7-9-9L3 4Zm5 4h.01',
  tools:'M4 7h16m-12-3v6M4 17h16m-5-3v6',
  play:'m8 4 12 8-12 8V4Z',
  check:'m5 12 4 4L19 6',
  eye:'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  bench:'M3 10h18v3H3zm3 3v7m12-7v7M8 10V5h8v5',
  sparkle:'M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z'
};
export const operationIcons:Record<string,string>={
  Measure:'balance',Transfer:'drop',Mix:'mix',Wait:'timer',Blot:'blot',Inspect:'lens',Record:'notebook',
  Filter:'filter',Heat:'heat',Cool:'cool',Label:'tag',Assemble:'tools',Adjust:'tools',Compare:'balance'
};
export function apparatusIcon(tool:string){
  const kinds:[RegExp,string][]=[
    [/cylinder|burette|pipette/,'cylinder'],[/balance|scale/,'balance'],[/timer|clock/,'timer'],[/dish|tray/,'dish'],
    [/lens|microscope/,'lens'],[/notebook|worksheet/,'notebook'],[/funnel|filter/,'filter'],[/towel|cloth/,'blot'],
    [/flask/,'flask'],[/hot plate|heater/,'heat'],[/beaker|cup|jar/,'beaker']
  ];
  return kinds.find(([pattern])=>pattern.test(tool.toLowerCase()))?.[1]??'tools';
}
export function LabIcon({name,size=22}:{name:string;size?:number}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]??paths.tools}/></svg>;
}

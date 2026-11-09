export const equipment: Record<Item,string>;
export type Item = 'table'|'burette'|'flask'|'tile'|'pipette'|'base'|'acid'|'indicator';
export type Point = {x:number;z:number};
export type Layout = Partial<Record<Item,Point>>;
export type Environment = {lighting:number;surface:'sage'|'slate'|'birch';height:number;layout:Layout;movable:boolean;experiments:boolean};
export const defaultEnvironment: Environment;
export function moveEquipment(layout:Layout,item:Item,x:number,z:number):Layout;
export function aligned(layout:Layout):boolean;
export function validateEnvironment(environment?:Environment):Environment;

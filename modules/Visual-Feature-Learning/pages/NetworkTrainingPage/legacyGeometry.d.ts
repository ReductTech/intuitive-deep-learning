import type {Group,Mesh} from 'three';
import type {Layer,Shape} from '../../services/digitNetworkTraining';
export function createConv3d(layer:Layer,index:number,entry:{input:Shape;shape:Shape}):Group;
export function createPool3d(layer:Layer,index:number,entry:{input:Shape;shape:Shape}):Group;
export function addEdges(mesh:Mesh,color:number,opacity:number):unknown;

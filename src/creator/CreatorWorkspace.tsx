import {activeModules} from '../app/modules';
import {CourseWorkspace} from './CourseWorkspace';
import type {CreatorProject} from './model';
import type {ReactNode} from 'react';
const courses=activeModules.filter(module=>module.pptDeck);
export function CreatorWorkspace(props:{initialProject?:CreatorProject;managed?:{status:string;actions:ReactNode;onChange:(project:CreatorProject)=>void}}={}){
 return <CourseWorkspace courses={courses} {...props}/>;
}

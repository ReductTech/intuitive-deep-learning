import {activeModules} from '../app/modules';
import {playbackModule} from '../shuku/playbackModule';
import {CourseWorkspace} from './CourseWorkspace';
import type {CreatorProject} from './model';
import type {ReactNode} from 'react';
const courses=activeModules.filter(module=>module.pptDeck);
export function CreatorWorkspace(props:{initialProject?:CreatorProject;renderPage?:(page:CreatorProject['pages'][number])=>ReactNode;renderThumbnail?:(page:CreatorProject['pages'][number])=>ReactNode;managed?:{status:string;actions:ReactNode;onChange:(project:CreatorProject)=>void}}={}){
 return <CourseWorkspace courses={props.initialProject&&!courses.some(c=>c.id===props.initialProject!.courseId)?[playbackModule(props.initialProject),...courses]:courses} {...props}/>;
}

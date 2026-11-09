import {emitCourseEvent} from '@shuku/course-runtime/react/courseRequests';
import {readCourseState,writeCourseState} from '@shuku/course-runtime/react/courseState';
export interface TelemetryStateEntry<T=unknown>{event_name:string;state:T;updated_at:number}
export function currentModuleId():string{return Reflect.get(globalThis,'__SHUKU_COURSE_ID__')||'';}
export function emitTelemetry(eventName:string,_element:Element|null,properties:Record<string,unknown>){
 if(typeof properties.state_key==='string'&&Object.hasOwn(properties,'state'))writeCourseState(properties.state_key,{event_name:eventName,state:properties.state,updated_at:Date.now()});
 emitCourseEvent(eventName,properties);
}
export async function getTelemetryState<T>(stateKey:string,moduleId=currentModuleId()):Promise<TelemetryStateEntry<T>|null>{
 return moduleId===currentModuleId()?readCourseState<TelemetryStateEntry<T>>(stateKey):null;
}

import {QuestionModeProvider} from '../../modules/shared/react/learning/QuestionMode';
import type {SceneDefinition} from '../../modules/shared/react/presentation';

/** Shared native lesson rendering for local preview and versioned release players. */
export function NativeLesson({scene,mode,completed,onComplete,onReset}:{scene:SceneDefinition;mode:'guide'|'ppt';completed:boolean;onComplete:()=>void;onReset:()=>void}){
 return <QuestionModeProvider mode={mode}>{scene.render({complete:onComplete,reset:onReset,isComplete:completed})}</QuestionModeProvider>;
}

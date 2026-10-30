import type {ActiveModule} from '../app/modules';
import type {CreatorProject} from '../creator/model';
import type {DeckDefinition} from '../../modules/shared/react/presentation';

/** A frozen release is a single catalog entry, never the current local module. */
export function playbackModule(project:CreatorProject,deck?:DeckDefinition,assetId='',notes?:ActiveModule['getPptNotes']):ActiveModule{
 return {id:project.courseId,assetId,title:project.title,description:'',path:'',badge:'',element:null,claimsPptPlayer:false,pages:[],getPptNotes:notes,pptDeck:deck||{id:project.courseId,title:project.title,subtitle:'',scenes:[]}};
}

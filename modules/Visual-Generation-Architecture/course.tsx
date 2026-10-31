import { ArchitectureCover } from './pages/ArchitectureCover';
import { architectureLessonIds } from './lessonIds';
import { PredictionCall, UNetBackbone, UNetTime, ConditionedUNet } from './pages/reference/Basics';
import { TextCrossAttention } from './pages/reference/TextCrossAttention';
import { PixelToLatent, VAEBridge } from './pages/reference/LatentSpace';
import { LatentTraining, LatentSampling } from './pages/reference/TrainingSampling';
import { LatentTokenization } from './pages/reference/Tokenization';
import { DiTBackbone, DiTTime, DiTText } from './pages/reference/DiT';
import { ArchitectureMap } from './pages/reference/ArchitectureMap';
import outline from './outlines.json';

const bodyPages = [PredictionCall, UNetBackbone, UNetTime, TextCrossAttention, ConditionedUNet, PixelToLatent, VAEBridge, LatentTraining, LatentSampling, LatentTokenization, DiTBackbone, DiTTime, DiTText, ArchitectureMap];
const rendererById = new Map<string, typeof PredictionCall>(architectureLessonIds.map((id,index)=>[id,bodyPages[index]]));
rendererById.set('architecture-opening', ArchitectureCover);
export const coursePages = outline.pages.map(page=>{
  const Page=rendererById.get(page.id);
  if (!Page) throw new Error('Missing architecture page: '+page.id);
  return Page;
});
export const courseScenes = outline.pages.map((page, index) => ({ ...page, render: () => { const Page = coursePages[index]; return <Page />; } }));

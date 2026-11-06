import { type LessonFlowStep } from '../shared/react/learning/LessonFlow';
import { MultiHeadCard } from './components/blocks/MultiHeadCard';
import { MultiHeadAnimationCard } from './components/blocks/MultiHeadAnimationCard';
import { MultiHeadOverviewCard } from './components/blocks/MultiHeadOverviewCard';
import { IntegratedMissionCard, IntegratedTokenizerCard } from './components/blocks/NarrativeCards';
import { PositionEncodingCard } from './components/blocks/PositionEncodingCard';
import { PositionRelationCard } from './components/blocks/PositionRelationCard';
import { PositionMultiscaleCard } from './components/blocks/PositionMultiscaleCard';
import { FfnCard, FfnCalculationCard, LayerNormCard } from './components/blocks/PptNarrativeCards';
import { ResidualIntroCard, ResidualMechanismCard } from './components/blocks/ResidualLessonCards';
import { SelfAttentionCard } from './components/blocks/SelfAttentionCard';
import { TransformerBlockCard } from './components/blocks/TransformerBlockCard';
import { DecoderBlockBuilder } from './components/blocks/DecoderBlockBuilder';
import { CrossAttentionMatrixCard } from './components/blocks/CrossAttentionMatrixCard';
import { MaskTrainingBridgeCard } from './components/blocks/MaskTrainingBridgeCard';
import { MaskedTrainingCard } from './components/blocks/MaskedTrainingCard';
import { DecoderGenerationCard } from './components/blocks/DecoderGenerationCard';
import { DecoderVocabularyCard } from './components/blocks/DecoderVocabularyCard';
import { TranslationOpeningPage } from './pages/MissionIntroPage/TranslationOpeningPage';
import { EmbeddingRelationCard } from './components/blocks/EmbeddingRelationCard';
import { ContextAttentionCard } from './components/blocks/ContextAttentionCard';
import { QueryProjectionCard } from './components/blocks/QueryProjectionCard';
import { AttentionScoresCard } from './components/blocks/AttentionScoresCard';
import { ValueAggregationCard } from './components/blocks/ValueAggregationCard';
import { PositionFlowCard } from './components/blocks/PositionFlowCard';
import './transformer.css';
import './transformer-extra.css';
import './transformer-integrated.css';
import './transformer-layout.css';
import './transformer-mobile-fix.css';
import './transformer-mobile-fix-2.css';
import './transformer-encoder-builder.css';
import './components/blocks/DecoderCards.css';
import './transformer-framework-fix.css';
const originalLessonSteps: LessonFlowStep[] = [
    { id: 'transformer-mission-v6', revealMode: 'immediate', render: ({ complete }) => <IntegratedMissionCard onComplete={complete}/> },
    { id: 'transformer-tokenizer-v6', revealMode: 'scroll', render: ({ complete }) => <IntegratedTokenizerCard onComplete={complete}/> },
    { id: 'transformer-position-story-v6', revealMode: 'immediate', render: ({ complete }) => <PositionFlowCard onComplete={complete}/> },
    { id: 'transformer-position-lab-v6', revealMode: 'scroll', render: ({ complete }) => <PositionEncodingCard onComplete={complete}/> },
    { id: 'transformer-position-relation-v6', revealMode: 'scroll', render: ({ complete }) => <PositionRelationCard onComplete={complete}/> },
    { id: 'transformer-position-multiscale-v6', revealMode: 'scroll', render: ({ complete }) => <PositionMultiscaleCard onComplete={complete}/> },
    { id: 'transformer-context-bridge-v6', revealMode: 'immediate', render: ({ complete }) => <AttentionScoresCard onComplete={complete}/> },
    { id: 'transformer-context-v6', revealMode: 'immediate', render: ({ complete }) => <ValueAggregationCard onComplete={complete}/> },
    undefined!, // Not part of the current 34-page course.
    { id: 'transformer-self-attention-v6', revealMode: 'immediate', render: ({ complete }) => <SelfAttentionCard onComplete={complete} summaryOnly/> },
    { id: 'transformer-multi-head-v6', revealMode: 'cue', render: ({ complete }) => <MultiHeadCard onComplete={complete}/> },
    { id: 'transformer-ffn-v6', revealMode: 'cue', render: ({ complete }) => <FfnCard onComplete={complete}/> },
    { id: 'transformer-residual-intro-v1', revealMode: 'cue', render: ({ complete }) => <ResidualIntroCard onComplete={complete}/> },
    { id: 'transformer-layernorm-v6', revealMode: 'cue', render: ({ complete }) => <LayerNormCard onComplete={complete}/> },
    { id: 'transformer-block-v8', revealMode: 'scroll', render: ({ complete }) => <TransformerBlockCard onComplete={complete}/> },
    { id: 'transformer-decoder-transition-v1', revealMode: 'cue', render: ({ complete }) => <DecoderGenerationCard onComplete={complete}/> },
    { id: 'transformer-decoder-cross-v1', revealMode: 'scroll', render: ({ complete }) => <CrossAttentionMatrixCard onComplete={complete}/> },
    { id: 'transformer-decoder-vocabulary-v1', revealMode: 'cue', render: ({ complete }) => <DecoderVocabularyCard onComplete={complete}/> },
    { id: 'transformer-decoder-masked-v1', revealMode: 'scroll', render: ({ complete }) => <MaskedTrainingCard onComplete={complete}/> },
    { id: 'transformer-decoder-builder-v1', revealMode: 'scroll', completesLesson: true, render: ({ complete }) => <DecoderBlockBuilder onComplete={complete}/> },
    undefined!, // Not part of the current 34-page course.
    { id: 'transformer-mh-split-v1', revealMode: 'immediate', render: ({ complete }) => <MultiHeadAnimationCard page={1} onComplete={complete}/> },
    { id: 'transformer-mh-parallel-v1', revealMode: 'immediate', render: ({ complete }) => <MultiHeadAnimationCard page={2} onComplete={complete}/> },
    { id: 'transformer-mh-concat-v1', revealMode: 'immediate', render: ({ complete }) => <MultiHeadAnimationCard page={3} onComplete={complete}/> },
    { id: 'transformer-mh-pipeline-v1', revealMode: 'immediate', render: ({ complete }) => <MultiHeadOverviewCard onComplete={complete}/> },
    { id: 'transformer-ffn-calculation-v1', revealMode: 'immediate', render: ({ complete }) => <FfnCalculationCard onComplete={complete}/> },
    { id: 'transformer-residual-mechanism-v1', revealMode: 'immediate', render: ({ complete }) => <ResidualMechanismCard onComplete={complete}/> },
    { id: 'transformer-position-comparison-v1', revealMode: 'immediate', render: ({ complete }) => <PositionFlowCard page="add" onComplete={complete}/> },
    { id: 'transformer-position-period-v1', revealMode: 'immediate', render: ({ complete }) => <PositionMultiscaleCard page={1} onComplete={complete}/> },
    { id: 'transformer-position-benefit-v1', revealMode: 'immediate', render: ({ complete }) => <PositionMultiscaleCard page={2} onComplete={complete}/> },
    { id: 'transformer-position-relative-experiment-v1', revealMode: 'immediate', render: ({ complete }) => <PositionRelationCard page="experiment" onComplete={complete}/> },
    { id: 'transformer-translation-opening-v1', revealMode: 'immediate', render: ({ complete }) => <TranslationOpeningPage onComplete={complete}/> },
    { id: 'transformer-embedding-relations-v1', revealMode: 'scroll', render: ({ complete }) => <EmbeddingRelationCard onComplete={complete}/> },
    { id: 'transformer-context-attention-v1', revealMode: 'immediate', render: ({ complete }) => <ContextAttentionCard onComplete={complete}/> },
    { id: 'transformer-attention-workbench-v1', revealMode: 'immediate', render: ({ complete }) => <QueryProjectionCard onComplete={complete}/> },
    { id: 'transformer-mask-training-bridge-v1', revealMode: 'immediate', render: ({ complete }) => <MaskTrainingBridgeCard onComplete={complete}/> },
];
const establishedStyleOrder = [1, 2, 7, 8, 9, 21, 10, 11, 12, 13, 14, 3, 4, 5, 6, 15, 16, 17, 18, 19, 20];
export const transformerSlideOrder = [32, 1, 2, 33, 34, 35, 7, 8, 10, 11, 22, 23, 24, 25, 3, 28, 4, 5, 31, 6, 29, 30, 12, 26, 13, 27, 14, 15, 16, 17, 18, 36, 19, 20] as const;
// Preserve the existing per-page layout rules when new teaching pages are inserted.
export const transformerStyleSlides = transformerSlideOrder.map(number => number === 36 ? 19 : number === 32 ? 1 : number === 33 ? 2 : number === 31 ? 14 : number === 28 ? 12 : number === 29 || number === 30 ? 15 : number === 27 ? 10 : number === 26 ? 9 : number > 21 ? 8 : establishedStyleOrder.indexOf(number) + 1);
export const transformerLessonSteps: LessonFlowStep[] = transformerSlideOrder.map(number => originalLessonSteps[number - 1]);

import { type LessonFlowStep } from "@shuku/course-style/react/learning/LessonFlow";
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
export const transformerLessonSteps: LessonFlowStep[] = [
    { id: '285cbb45-7811-4a9d-b7b0-5bb25933e8a6', revealMode: 'immediate', render: ({ complete }) => <TranslationOpeningPage onComplete={complete}/> },
    { id: '0d329cd0-d33c-4795-977c-fce61cdc83fe', revealMode: 'immediate', render: ({ complete }) => <IntegratedMissionCard onComplete={complete}/> },
    { id: '3e732951-fcf1-4595-9165-c15068647c2b', revealMode: 'scroll', render: ({ complete }) => <IntegratedTokenizerCard onComplete={complete}/> },
    { id: '6c2613e9-164c-449b-8e51-f570abce2267', revealMode: 'scroll', render: ({ complete }) => <EmbeddingRelationCard onComplete={complete}/> },
    { id: '18a0184b-46ee-4c9d-b290-55bb85412a98', revealMode: 'immediate', render: ({ complete }) => <ContextAttentionCard onComplete={complete}/> },
    { id: '4342496e-4f50-48b4-b781-1ba10fafc875', revealMode: 'immediate', render: ({ complete }) => <QueryProjectionCard onComplete={complete}/> },
    { id: 'c29e17fb-f126-4e0c-85ae-126372250dfa', revealMode: 'immediate', render: ({ complete }) => <AttentionScoresCard onComplete={complete}/> },
    { id: 'd4804e0a-739d-4e8e-884c-9349834b77dd', revealMode: 'immediate', render: ({ complete }) => <ValueAggregationCard onComplete={complete}/> },
    { id: '22689e51-5d50-48d4-b95b-a97ecb47495a', revealMode: 'immediate', render: ({ complete }) => <SelfAttentionCard onComplete={complete} summaryOnly/> },
    { id: '7d786d09-c9ba-403f-95c2-5a970218a7ac', revealMode: 'cue', render: ({ complete }) => <MultiHeadCard onComplete={complete}/> },
    { id: 'ef0c8fca-9816-49ef-b2be-54b88ad7662c', revealMode: 'immediate', render: ({ complete }) => <MultiHeadAnimationCard page={1} onComplete={complete}/> },
    { id: 'a091acf5-514c-4487-95ce-40c1e2cc5e58', revealMode: 'immediate', render: ({ complete }) => <MultiHeadAnimationCard page={2} onComplete={complete}/> },
    { id: 'b770f455-3678-4d13-acde-cad77b42fa8a', revealMode: 'immediate', render: ({ complete }) => <MultiHeadAnimationCard page={3} onComplete={complete}/> },
    { id: 'bdc1b215-9684-43ff-9f2a-317823ba64ce', revealMode: 'immediate', render: ({ complete }) => <MultiHeadOverviewCard onComplete={complete}/> },
    { id: '675a7a22-5db7-415c-a119-9735fc095d4a', revealMode: 'immediate', render: ({ complete }) => <PositionFlowCard onComplete={complete}/> },
    { id: '29647bfd-a9bc-4108-bd79-c1ef7b4ea25e', revealMode: 'immediate', render: ({ complete }) => <PositionFlowCard page="add" onComplete={complete}/> },
    { id: 'a0b7e3c4-1dc3-409b-a0b8-2b9ef49b5ac7', revealMode: 'scroll', render: ({ complete }) => <PositionEncodingCard onComplete={complete}/> },
    { id: 'c8a26ce5-2a51-40d7-a1e9-8a467cefaef7', revealMode: 'scroll', render: ({ complete }) => <PositionRelationCard onComplete={complete}/> },
    { id: '97bf3da4-8c58-4397-a28c-e47cf1663b67', revealMode: 'immediate', render: ({ complete }) => <PositionRelationCard page="experiment" onComplete={complete}/> },
    { id: '1532d8c9-6c41-4ee0-91b3-96fe3229e4b8', revealMode: 'scroll', render: ({ complete }) => <PositionMultiscaleCard onComplete={complete}/> },
    { id: 'a7ba3a0a-4b52-4a14-a054-66682d8d43ac', revealMode: 'immediate', render: ({ complete }) => <PositionMultiscaleCard page={1} onComplete={complete}/> },
    { id: '971046c9-ade0-4bc7-bea3-da3eae2d3644', revealMode: 'immediate', render: ({ complete }) => <PositionMultiscaleCard page={2} onComplete={complete}/> },
    { id: 'db3b29f8-7253-4543-b530-a387c24ba1dd', revealMode: 'cue', render: ({ complete }) => <FfnCard onComplete={complete}/> },
    { id: 'a4333f92-1e3d-4316-be42-f29789f2e8b7', revealMode: 'immediate', render: ({ complete }) => <FfnCalculationCard onComplete={complete}/> },
    { id: '66fa881d-1879-4109-a086-91cb4c058564', revealMode: 'cue', render: ({ complete }) => <ResidualIntroCard onComplete={complete}/> },
    { id: 'acabdd48-e154-4651-8c50-7c63a6406f8d', revealMode: 'immediate', render: ({ complete }) => <ResidualMechanismCard onComplete={complete}/> },
    { id: '687f00b8-6d2b-4b18-9b7e-5f222f6f97cc', revealMode: 'cue', render: ({ complete }) => <LayerNormCard onComplete={complete}/> },
    { id: '9ba69139-f33e-4376-98db-7b667f356a85', revealMode: 'scroll', render: ({ complete }) => <TransformerBlockCard onComplete={complete}/> },
    { id: 'dba3f01c-67c0-46a6-93d5-46a3a200faaa', revealMode: 'cue', render: ({ complete }) => <DecoderGenerationCard onComplete={complete}/> },
    { id: 'b7d419bb-478d-4a0f-9118-7f2cfa7a5eab', revealMode: 'scroll', render: ({ complete }) => <CrossAttentionMatrixCard onComplete={complete}/> },
    { id: '172cb4e3-c59a-4685-8818-cb44ed94d644', revealMode: 'cue', render: ({ complete }) => <DecoderVocabularyCard onComplete={complete}/> },
    { id: '136d804e-527f-4fb8-9f62-e16a42df7688', revealMode: 'immediate', render: ({ complete }) => <MaskTrainingBridgeCard onComplete={complete}/> },
    { id: '05197a4c-a043-4383-9723-8dffad1c1104', revealMode: 'scroll', render: ({ complete }) => <MaskedTrainingCard onComplete={complete}/> },
    { id: '0af23e20-908f-4ae7-90bc-7453a20941c3', revealMode: 'scroll', completesLesson: true, render: ({ complete }) => <DecoderBlockBuilder onComplete={complete}/> },
];
const establishedStyleOrder = [1, 2, 7, 8, 9, 21, 10, 11, 12, 13, 14, 3, 4, 5, 6, 15, 16, 17, 18, 19, 20];
export const transformerSlideOrder = [32, 1, 2, 33, 34, 35, 7, 8, 10, 11, 22, 23, 24, 25, 3, 28, 4, 5, 31, 6, 29, 30, 12, 26, 13, 27, 14, 15, 16, 17, 18, 36, 19, 20] as const;
// Preserve the existing per-page layout rules when new teaching pages are inserted.
export const transformerStyleSlides = transformerSlideOrder.map(number => number === 36 ? 19 : number === 32 ? 1 : number === 33 ? 2 : number === 31 ? 14 : number === 28 ? 12 : number === 29 || number === 30 ? 15 : number === 27 ? 10 : number === 26 ? 9 : number > 21 ? 8 : establishedStyleOrder.indexOf(number) + 1);


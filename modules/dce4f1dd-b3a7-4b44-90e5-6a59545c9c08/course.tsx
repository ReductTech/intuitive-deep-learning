import type { ComponentType } from 'react';
import outline from './outlines.json';
import { AnnotationOpeningPage } from './pages/AnnotationOpeningPage/AnnotationOpeningPage';
import { TaskLabelsPage } from './pages/TaskLabelsPage/TaskLabelsPage';
import { LabelEncodingPage } from './pages/LabelEncodingPage/LabelEncodingPage';
import { AmbiguousSamplesPage } from './pages/AmbiguousSamplesPage/AmbiguousSamplesPage';
import { AnnotationRulesPage } from './pages/AnnotationRulesPage/AnnotationRulesPage';
import { BoundingBoxPage } from './pages/BoundingBoxPage/BoundingBoxPage';
import { SegmentationPage } from './pages/SegmentationPage/SegmentationPage';
import { GroupedSplitPage } from './pages/GroupedSplitPage/GroupedSplitPage';
import { CoveragePage } from './pages/CoveragePage/CoveragePage';
import { AugmentationMotivationPage } from './pages/AugmentationMotivationPage/AugmentationMotivationPage';
import { AugmentationPurposePage } from './pages/AugmentationPurposePage/AugmentationPurposePage';
import { AugmentationValidityPage } from './pages/AugmentationValidityPage/AugmentationValidityPage';
import { FlipInvariancePage } from './pages/FlipInvariancePage/FlipInvariancePage';
import { FlipBoxesPage } from './pages/FlipBoxesPage/FlipBoxesPage';
import { CropLabelsPage } from './pages/CropLabelsPage/CropLabelsPage';
import { MaskTransformsPage } from './pages/MaskTransformsPage/MaskTransformsPage';
import { AppearanceAugmentationPage } from './pages/AppearanceAugmentationPage/AppearanceAugmentationPage';
import { CutoutPage } from './pages/CutoutPage/CutoutPage';
import { MixupPage } from './pages/MixupPage/MixupPage';
import { CutMixPage } from './pages/CutMixPage/CutMixPage';
import { RandomPolicyPage } from './pages/RandomPolicyPage/RandomPolicyPage';
import { OnlineOfflinePage } from './pages/OnlineOfflinePage/OnlineOfflinePage';
import { AugmentationLimitsPage } from './pages/AugmentationLimitsPage/AugmentationLimitsPage';
import { TransferWorkflowPage } from './pages/TransferWorkflowPage/TransferWorkflowPage';

const components: Record<string, ComponentType> = {
  '00c19198-cc92-4327-b95f-02a6a778fa35': AnnotationOpeningPage,
  '03a61361-b5a3-4d1c-8062-58b671a536bb': TaskLabelsPage,
  '2aca8518-ef4a-45aa-8afc-33785a729049': LabelEncodingPage,
  '58e748ac-e2b6-4a9f-b605-2a209bf84156': AmbiguousSamplesPage,
  '14cd7dcb-20e8-44d1-b988-96e895011e59': AnnotationRulesPage,
  '385a7e62-a647-45e5-8e60-6fd5275d5951': BoundingBoxPage,
  '4e212d7f-60d1-4e02-9abc-c5fa348877fa': SegmentationPage,
  '35fcf1e9-f569-4890-acaa-d88580e7c3e7': AugmentationMotivationPage,
  '6c77032b-0dc6-405e-a1e4-5a34c34e8b5f': AugmentationPurposePage,
  '493e3a2f-3704-4137-ba36-415cdf3da6ff': AugmentationValidityPage,
  '84d0d4d2-c13f-460b-89ca-38732578449a': FlipInvariancePage,
  '104dfa02-e7a1-41ff-8a60-632eb58803d0': FlipBoxesPage,
  '52467f44-e381-4b66-8e4b-85f06774a274': CropLabelsPage,
  'fadc7041-8021-415e-a175-40fe01071f4e': MaskTransformsPage,
  '846bb852-80b1-4e3e-8665-c957294ecf8d': AppearanceAugmentationPage,
  'c69de653-d424-47a5-b76d-8697e9f0b216': CutoutPage,
  '8732c60e-044d-435d-b8a4-13e7b8a03504': MixupPage,
  '98f06226-8d88-47cf-9742-0dbd8e60f0c8': CutMixPage,
  '37813117-9379-4906-9b92-55b985e1a4b3': GroupedSplitPage,
  '57a8218a-b0d6-4b28-818d-c736e5aa548d': CoveragePage,
  '096a0205-0981-433d-917e-c12a28412a4a': RandomPolicyPage,
  '93defe1d-d124-4ab0-80a5-fe6d19c37b74': OnlineOfflinePage,
  '3fdc29d7-6a1b-4b25-99c8-245e114d4466': AugmentationLimitsPage,
  '59c770c4-ad8c-42f1-b573-1b28a38a0afe': TransferWorkflowPage,
};
export const course = outline.pages.map(page => ({ ...page, Component: components[page.id] }));

import { MultiKernelPage } from '../../../Convolution-Kernel-Intro/pages/MultiKernelPage/MultiKernelPage';
import { ShowcaseExampleFrame } from '../../components/ShowcaseExampleFrame';
import './ShowcaseMultiKernelPage.css';

export function ShowcaseMultiKernelPage() {
  return <ShowcaseExampleFrame title="从五子棋，走进卷积">
    <div className="course-shell spp-multi-kernel-page" data-scene-id="showcase-multi-kernel"><MultiKernelPage /></div>
  </ShowcaseExampleFrame>;
}

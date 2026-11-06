import { NetworkTrainingPage } from '../../../Visual-Feature-Learning/pages/NetworkTrainingPage/NetworkTrainingPage';
import { ShowcaseExampleFrame } from '../../components/ShowcaseExampleFrame';
import './ShowcaseDigitNetworkPage.css';

export function ShowcaseDigitNetworkPage() {
  return <ShowcaseExampleFrame title="数字识别网络的前馈过程">
    <div className="course-shell spp-digit-network-page"><NetworkTrainingPage /></div>
  </ShowcaseExampleFrame>;
}

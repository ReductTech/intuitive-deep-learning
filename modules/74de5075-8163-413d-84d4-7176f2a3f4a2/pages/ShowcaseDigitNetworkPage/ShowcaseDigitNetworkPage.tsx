import { NetworkTrainingPage } from '../../../80396753-7fc8-4f55-9188-bddbdb828169/pages/NetworkTrainingPage/NetworkTrainingPage';
import { ShowcaseExampleFrame } from '../../components/ShowcaseExampleFrame';
import './ShowcaseDigitNetworkPage.css';

export function ShowcaseDigitNetworkPage() {
  return <ShowcaseExampleFrame title="数字识别网络的前馈过程">
    <div className="course-shell spp-digit-network-page"><NetworkTrainingPage /></div>
  </ShowcaseExampleFrame>;
}

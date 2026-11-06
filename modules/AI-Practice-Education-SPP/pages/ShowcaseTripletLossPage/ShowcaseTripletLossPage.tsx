import { TripletLossPage } from '../../../Visual-Feature-Learning/pages/TripletLossPage/TripletLossPage';
import { ShowcaseExampleFrame } from '../../components/ShowcaseExampleFrame';
import './ShowcaseTripletLossPage.css';

export function ShowcaseTripletLossPage() {
  return <ShowcaseExampleFrame title="从人脸验证，理解特征距离">
    <div className="course-shell spp-triplet-loss-page"><TripletLossPage /></div>
  </ShowcaseExampleFrame>;
}

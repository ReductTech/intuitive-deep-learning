import { OpenIdentityPage } from '../../../Visual-Feature-Learning/pages/OpenIdentityPage/OpenIdentityPage';
import { ShowcaseExampleFrame } from '../../components/ShowcaseExampleFrame';
import './ShowcaseOpenIdentityPage.css';

export function ShowcaseOpenIdentityPage() {
  return <ShowcaseExampleFrame title="从人脸验证，理解特征距离">
    <div className="course-shell spp-open-identity-page"><OpenIdentityPage /></div>
  </ShowcaseExampleFrame>;
}

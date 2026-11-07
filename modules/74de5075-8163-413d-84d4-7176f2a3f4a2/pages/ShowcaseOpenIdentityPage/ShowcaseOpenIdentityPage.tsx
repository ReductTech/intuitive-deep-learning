import { OpenIdentityPage } from '../../../80396753-7fc8-4f55-9188-bddbdb828169/pages/OpenIdentityPage/OpenIdentityPage';
import { ShowcaseExampleFrame } from '../../components/ShowcaseExampleFrame';
import './ShowcaseOpenIdentityPage.css';

export function ShowcaseOpenIdentityPage() {
  return <ShowcaseExampleFrame title="从人脸验证，理解特征距离">
    <div className="course-shell spp-open-identity-page"><OpenIdentityPage /></div>
  </ShowcaseExampleFrame>;
}

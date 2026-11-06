import {ContentBlock} from '../../../shared/react';
import {NetworkScene} from './NetworkScene';
import './NetworkTrainingPage.css';

export function NetworkTrainingPage(){
 return <ContentBlock className="vfl-train-page" headingLevel={1} title="数字识别网络的前馈过程" subtitle="卷积、ReLU、池化、GAP 与全连接，依次处理输入。">
  <div className="vfl-train-body"><NetworkScene /></div>
 </ContentBlock>;
}

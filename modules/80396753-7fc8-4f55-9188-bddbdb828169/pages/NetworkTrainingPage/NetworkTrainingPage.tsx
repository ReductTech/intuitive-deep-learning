import { ContentBlock } from "@shuku/course-style/react";
import {NetworkScene} from './NetworkScene';
import './NetworkTrainingPage.css';

export function NetworkTrainingPage(){
 return <ContentBlock shuku-edit-id="e-3d3b8e1b-bb84-46b1-b084-5c59dbbeb91a" className="vfl-train-page" headingLevel={1} title="数字识别网络的前馈过程" subtitle="卷积、ReLU、池化、GAP 与全连接，依次处理输入。">
  <div shuku-edit-id="e-bbbc0441-96e6-4109-8a9b-c707cbda7867" className="vfl-train-body"><NetworkScene /></div>
 </ContentBlock>;
}

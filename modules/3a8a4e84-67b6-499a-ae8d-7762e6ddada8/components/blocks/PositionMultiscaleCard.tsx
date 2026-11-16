import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPageFrame } from '../LessonPageFrame';
import './PositionMultiscaleCard.css';
interface PositionMultiscaleCardProps {
    onComplete: () => void;
    page?: 0 | 1 | 2;
}
const groups = [0, 128, 255];
const comparisonGroups = [24, 40, 56, 72, 88];
const comparisonColors = ["#c77a42", "#3295a0", "#596ca6", "#ab6b94", "#7b9050"];
const omega = (i: number) => 1 / 10000 ** ((2 * i) / 512);
const score = (gap: number, i: number) => Math.cos(gap * omega(i));
function curvePath(i: number, width = 720, height = 350) {
    const left = 62, right = 20, top = 30, bottom = 65;
    return Array.from({ length: 701 }, (_, index) => {
        const xValue = 100 * index / 700;
        const value = score(xValue, i);
        const x = left + xValue / 100 * (width - left - right);
        const y = top + (1 - value) / 2 * (height - top - bottom);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}
function MiniPeriodChart({ indices }: {
    indices: number[];
}) {
    const path = (i: number) => Array.from({ length: 301 }, (_, n) => {
        const x = 45 + n;
        const y = 20 + (1 - score(n / 300 * 1000, i)) * 65;
        return `${n ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
    return <svg shuku-edit-id="e-bc5a8393-c5fa-4226-8e34-ca771cca028b" viewBox="0 0 360 205" role="img" aria-label={`维度组${indices.join('、')}的点积曲线，横轴位置差0到1000，纵轴点积负1到1`}>
    {[-1, 0, 1].map(v => <g shuku-edit-id="e-1aa389bb-88ee-4a31-ae58-6a60cae9523b" key={v}><line shuku-edit-id="e-3415b505-55fa-457a-b4b9-2135295c60a7" className="tr-mini-grid" x1="45" x2="345" y1={20 + (1 - v) * 65} y2={20 + (1 - v) * 65}/><text shuku-edit-id="e-441d573f-93a0-40bf-9936-0418c13cea86" className="tr-mini-tick" x="35" y={25 + (1 - v) * 65} textAnchor="end">{v}</text></g>)}
    <path shuku-edit-id="e-75a094d4-5a68-4008-a5df-797199700271" className="tr-mini-axis" d="M45 20V150H345"/>
    {[0, 500, 1000].map(v => <text shuku-edit-id="e-bcafa006-998a-4deb-837b-b3f8d30e689b" className="tr-mini-tick" x={45 + v * .3} y="174" textAnchor="middle" key={v}>{v}</text>)}
    {indices.map((i, n) => <path shuku-edit-id="e-42b9d979-30cb-433a-9534-6e48ec38f2be" key={i} className={indices.length === 1 ? i === 100 ? 'fast' : 'slow' : ['fast', 'middle', 'slow'][n]} d={path(i)}/>)}
    <text shuku-edit-id="e-ee11f490-8aa0-41d2-8962-9c6677b18287" className="tr-mini-axis-label" x="195" y="199" textAnchor="middle">位置差 Δp</text><text shuku-edit-id="e-e56c0c80-279e-4758-8f0f-527e35b6e31d" className="tr-mini-axis-label" transform="translate(14 85) rotate(-90)" textAnchor="middle">点积</text>
  </svg>;
}
export function PositionMultiscaleCard({ onComplete, page = 0 }: PositionMultiscaleCardProps) {
    const act = page;
    const [distance, setDistance] = useState(0);
    const [pairIndex, setPairIndex] = useState(0);
    const [showComparison, setShowComparison] = useState(false);
    useEffect(() => {
        setShowComparison(false);
        if (act !== 1 || pairIndex !== 255)
            return;
        const reveal = window.setTimeout(() => setShowComparison(true), 650);
        return () => window.clearTimeout(reveal);
    }, [act, pairIndex]);
    const distanceFrame = useRef<number | null>(null);
    const pendingDistance = useRef(0);
    const scores = groups.map((item) => score(distance, item));
    const updateDistanceSmoothly = (value: number) => {
        pendingDistance.current = value;
        if (distanceFrame.current !== null)
            return;
        distanceFrame.current = requestAnimationFrame(() => {
            setDistance(pendingDistance.current);
            distanceFrame.current = null;
        });
    };
    useEffect(() => () => {
        if (distanceFrame.current !== null)
            cancelAnimationFrame(distanceFrame.current);
    }, []);
    return (<LessonPageFrame>
      <section shuku-edit-id="e-0e306ab6-f49a-4de4-99d6-e66d2878399e" className="tr-multiscale" aria-labelledby="tr-multiscale-title">
        <header shuku-edit-id="e-951059db-394b-42b1-89a4-a8802f5fc871" className="tr-lesson-header tr-multiscale__header">
          <div shuku-edit-id="e-3fb35fda-846b-45bc-8b64-2e341c402ff5"><Typography shuku-edit-id="e-425933e2-bb9e-4619-b688-56a3918909a5" id="tr-multiscale-title" as="h1" variant="display" tone="accent">{act === 0 ? '不同维度组，点积变化的快慢不同' : act === 1 ? '维度组编号越大，变化周期越长' : '多个周期：共同刻画远近位置'}</Typography></div>
          <Typography shuku-edit-id="e-63abe405-1dd4-4854-9554-f84bce1dcdce" as="p" variant="subtitle" tone="muted">{act === 0 ? '拖动位置差滑块，比较三组点积变化的快慢。' : act === 1 ? '拖动维度组号 i，观察周期变化；拉到最右端，叠加比较五组曲线。' : '对照短周期、长周期与组合曲线，观察重复出现的位置。'}</Typography>
        </header>

        <main shuku-edit-id="e-b940c81a-03b5-42ff-88a9-3713cb611378" className="tr-multiscale__main">
          {act === 0 && <section shuku-edit-id="e-a1b8756f-f678-4272-bb96-693dcfeb76c5" className="tr-multi-act is-observe">
            <div shuku-edit-id="e-3110b867-7935-42a6-8fcb-03fa15d8c11c" className="tr-distance-formula"><div shuku-edit-id="e-0bae516c-70d8-408c-902c-542e70f154a1">r<sub shuku-edit-id="e-dcb3e14e-f447-4321-8081-b344960020a8">i</sub>(p<sub shuku-edit-id="e-b504978b-0bf2-4250-a207-21078ebc6a1d">1</sub>)<sup shuku-edit-id="e-a3859f61-2292-4087-bc1f-0868521c17b9">T</sup>r<sub shuku-edit-id="e-cd3f639a-dbd6-44cd-b20d-1bacd903c7a5">i</sub>(p<sub shuku-edit-id="e-661d49bc-b153-426d-ade4-9ec5803f3cf1">2</sub>) = cos(<mark shuku-edit-id="e-2558b192-4780-41e6-8817-68e5096e11d4">(p<sub shuku-edit-id="e-7abea1bd-ce3f-4dda-8df9-d3863426fd69">1</sub> − p<sub shuku-edit-id="e-f325d975-0f71-4f26-bf8c-b8b65f91e461">2</sub>)</mark>ω<sub shuku-edit-id="e-68991335-a28b-448b-8d6e-55c95a0fa905">i</sub>)</div><span shuku-edit-id="e-e44513cf-9299-426b-8a9c-d26188a400ed">改变<mark shuku-edit-id="e-61aee8b4-002a-4ea6-b049-984fdb9c567a">位置差</mark>，观察不同维度组的点积。</span></div>
            <div shuku-edit-id="e-5c0730a2-3d22-4e8e-8e29-1620ecd97cac" className="tr-distance-control">
              <div shuku-edit-id="e-edfe1fd5-28b9-4c1c-84f2-6a8def546c18"><label shuku-edit-id="e-9f4aeb4b-4d33-486e-84de-dd7c2747f0ac" htmlFor="tr-distance">两个位置的间隔</label><strong shuku-edit-id="e-16c3696a-372a-4d7b-b4aa-99045fa14dba">Δp = {distance}</strong></div>
              <input shuku-edit-id="e-b3bab065-5cfc-4ae7-8fd2-2474257b3a52" id="tr-distance" type="range" min="0" max="10000" step="1" value={distance} onInput={(event) => updateDistanceSmoothly(Number(event.currentTarget.value))}/>
              <div shuku-edit-id="e-9e7a4b0a-9259-4f1a-981f-c6f1426b7ac7"><span shuku-edit-id="e-d14b6c4e-aa5a-42be-aae9-8df1cfc95694">0</span><span shuku-edit-id="e-892dbf8b-3ccb-4855-a95b-a1f91bb66b9e">2500</span><span shuku-edit-id="e-c20fa85d-9362-4d4d-a2e7-a3aa3d247203">5000</span><span shuku-edit-id="e-eb2f6bfb-db16-4e4f-8a7d-f3c0f71a1f3e">7500</span><span shuku-edit-id="e-45ec5db9-5b8e-4195-92b2-444d4ed75629">10000</span></div>
            </div>
            <div shuku-edit-id="e-2d91f529-6560-4b63-a2ff-0e814e40d3dd" className="tr-score-lanes">
              {groups.map((item, index) => <div shuku-edit-id="e-3743b7b8-0b4d-40b5-9fe4-2701e27dfe50" className={`tr-score-lane is-group-${index}`} key={item}>
                <div shuku-edit-id="e-fd16edc8-f1d6-4e37-b961-abb7036a5644"><strong shuku-edit-id="e-cab663d1-ccf6-496d-802f-e93bb7bc2e21">维度组 i = {item}</strong><span shuku-edit-id="e-5f59ed9a-c228-4f14-bacd-34f3e866923e">第 {item * 2}、{item * 2 + 1} 维</span></div>
                <div shuku-edit-id="e-6ec58cef-8c02-49d6-ae55-7de714faa80c" className="tr-score-track"><span shuku-edit-id="e-723fb9a6-5211-4954-9d69-191a66ffc427">−1</span><i shuku-edit-id="e-96e5e4d7-45e5-420a-bcf3-41f338521fda" /><span shuku-edit-id="e-7389f0e4-ab0f-40d6-a499-4527d671cd7b">0</span><i shuku-edit-id="e-d3a298df-e62c-4f78-9a9c-d6775979a03d" /><span shuku-edit-id="e-6011660e-cff1-4f29-ac62-1f929c431909">1</span><b shuku-edit-id="e-446a80d3-2721-49ed-9698-4be6a14d9d38" style={{ left: `${(scores[index] + 1) * 50}%` }}/></div>
                <div shuku-edit-id="e-8fa291e1-6f25-482b-9fa8-7fbfcd6384d4"><small shuku-edit-id="e-c453d40e-365f-4013-ac25-2825139f7bc0">点积</small><output shuku-edit-id="e-9ac0a8bc-cabf-4b55-9a2f-fb6c2eaadb90">{scores[index].toFixed(4)}</output></div>
              </div>)}
            </div>
            <div shuku-edit-id="e-e1672ac6-3fe9-4225-af7b-68afc00e3330" className="tr-multi-observation">同样的位置差，<b shuku-edit-id="e-18b344c9-39bd-4407-8d10-b051f35d4d77">不同维度组的点积变化快慢不同。</b></div>
          </section>}

          {act === 1 && <section shuku-edit-id="e-4b35669b-b9b2-4d70-b9ff-9b740829be8a" className="tr-multi-act is-period">
            <div shuku-edit-id="e-e092553a-ada4-4988-b933-1bca6b0c915a" className="tr-period-body is-explained">
              <div shuku-edit-id="e-02085d6d-a8a7-434d-bb1e-ef9b333ef714" className="tr-period-steps">
                <section shuku-edit-id="e-cea7d9c8-1b01-4c26-af0c-1c5b4d64114b" className="tr-period-step is-source">
                  <div shuku-edit-id="e-8de6a3af-7ad1-42e9-b831-2a41666a4684" className="tr-period-step-heading"><span shuku-edit-id="e-4575519f-b25a-45df-9493-0288e4dbc7fc">01</span><h2 shuku-edit-id="e-d888cfe8-42f9-45b2-98d5-2be1f77f6f26">从一对 sin、cos 开始</h2></div>
                  <div shuku-edit-id="e-30dcfc6e-6867-40cd-8440-bc9756451103" className="tr-period-math">PE(p, 2i) = sin(p / 10000<sup shuku-edit-id="e-e212cfae-a89c-44ae-ad81-a78a238b3ded">2i / 512</sup>)</div>
                  <div shuku-edit-id="e-9f1222fe-7ab9-4ec2-884b-e6cdf9f61fa8" className="tr-period-math">PE(p, 2i+1) = cos(p / 10000<sup shuku-edit-id="e-462cd515-a09f-4860-8eab-8d9ff650985a">2i / 512</sup>)</div>
                  <p shuku-edit-id="e-24b97ba3-32ff-4c29-aff7-64f1dee7f98c">i 是组号，每组对应相邻的两个维度。</p>
                </section>
                <section shuku-edit-id="e-a6c4a2f6-0ea2-4a5c-87aa-1dee0d1bd40c" className="tr-period-step is-dot">
                  <div shuku-edit-id="e-e9c0229d-a778-4508-bf67-bf6114841b2d" className="tr-period-step-heading"><span shuku-edit-id="e-2aee97df-787d-4460-8f8a-b07031d139e3">02</span><h2 shuku-edit-id="e-35808636-935f-406e-b216-1373548e7a18">比较两个位置</h2></div>
                  <div shuku-edit-id="e-957993a9-2a36-44e6-bc06-9d0f87c3745e" className="tr-period-math">S<sub shuku-edit-id="e-f473f4ac-9ab6-4481-8e99-516ac91b368f">i</sub>(Δp) = cos(Δp / <mark shuku-edit-id="e-fefcb03e-7a86-4b79-b358-8f952c9a7287">10000<sup shuku-edit-id="e-47b9a9e3-554e-4bd8-8652-e6fb8c06c222">2i / 512</sup></mark>)</div>
                  <p shuku-edit-id="e-1e479c29-48a7-4e9a-a355-6dc5ec079b66">S<sub shuku-edit-id="e-ee2fd79a-7015-4bec-a35a-29d5b5854eb0">i</sub> 是这一组的点积；Δp 是位置差。</p>
                </section>
                <section shuku-edit-id="e-21eaa1b0-9edd-4b2d-811c-987ca8492ae1" className="tr-period-step is-conclusion">
                  <div shuku-edit-id="e-8f5dc666-92a4-43f8-a5c2-290168f7fc9e" className="tr-period-step-heading"><span shuku-edit-id="e-308a5542-acd5-4cea-a9aa-408f80d9e471">03</span><h2 shuku-edit-id="e-9e67b9a7-f0b4-4525-8e56-1ecd12fde218">分母决定快慢</h2></div>
                  <strong shuku-edit-id="e-e54619e6-ee00-4ba9-8714-873d904f472d" className="tr-period-takeaway">i 越大，变化越慢</strong>
                  <p shuku-edit-id="e-7a795278-dc1c-416f-bde9-4162f751632d">分母越大，同样移动一格，角度改变越小。</p>
                  <div shuku-edit-id="e-92b60d10-a669-4189-a653-8db29fd7d602" className="tr-period-math">周期 T<sub shuku-edit-id="e-c6051763-4ddd-4e0b-91f8-3ad704f8978a">i</sub> = 2π · 10000<sup shuku-edit-id="e-18b99aab-aeea-4e67-ae02-6694b37de036">2i / 512</sup></div>
                </section>
              </div>
              <div shuku-edit-id="e-9341886e-f4d5-4fe6-88d9-ec8cc1f29e1e" className={`tr-period-comparison tr-period-interactive ${showComparison ? 'is-overlay' : ''}`}>
                <div shuku-edit-id="e-6a0aa486-c6bc-40f8-9ee1-815ccf789cbc" className="tr-period-chart-heading"><h2 shuku-edit-id="e-7cd0a26c-814c-4ba8-898f-f09733d37c4a">{showComparison ? '比较五组曲线的周期' : '拖动组号，观察周期变化'}</h2><span shuku-edit-id="e-3fdb1025-35aa-46b4-9cc0-25c16c251d62">{showComparison ? '五组叠加' : `第 ${2 * pairIndex}、${2 * pairIndex + 1} 维`}</span></div>
                <div shuku-edit-id="e-ff655c70-5283-4547-a6c9-f94469a171aa" className="tr-period-slider">
                  <label shuku-edit-id="e-c9cea52f-ce17-4999-9b4a-5f90d31b4d2d" htmlFor="tr-period-group">维度组 <strong shuku-edit-id="e-28354b6c-71fb-43d4-939c-2f8271b86a25">i = {pairIndex}</strong></label>
                  <input shuku-edit-id="e-604b3bed-2210-440c-a627-2eae12739180" id="tr-period-group" aria-label="维度组 i" type="range" min="0" max="255" step="1" value={pairIndex} onChange={event => setPairIndex(Number(event.currentTarget.value))}/>
                  <div shuku-edit-id="e-020746ce-2cea-4a42-be39-8d14dcf8a7cf"><span shuku-edit-id="e-92f62597-3d69-42d0-b23a-9252f3598ff8">0 · 快</span><span shuku-edit-id="e-25c8c85e-1661-42f7-9d46-9a67c5336bd5">255 · 慢</span></div>
                </div>
                <svg shuku-edit-id="e-db8b5957-e642-4bc1-a5f7-0ee3ca772b62" viewBox="0 0 720 350" role="img" aria-label="横轴位置差0到100，纵轴位置编码点积负1到1。拖动维度组滑条观察快慢，拉到最右端自动叠加五组曲线。">
                  {[-1, 0, 1].map(v => <g shuku-edit-id="e-d8dc3b8e-ad2f-483e-a8fe-2771a86b64d8" key={v}><line shuku-edit-id="e-d6ec116a-d0e6-4395-ac20-61ccc2da7cb3" className="tr-period-grid" x1="62" x2="700" y1={30 + (1 - v) * 127.5} y2={30 + (1 - v) * 127.5}/><text shuku-edit-id="e-04343804-82ea-4e7d-aac4-a6e77c8c2711" x="49" y={36 + (1 - v) * 127.5} textAnchor="end">{v}</text></g>)}
                  {[0, 25, 50, 75, 100].map(v => <g shuku-edit-id="e-a8cbd5d3-ba13-4cb8-8fde-8cbea3328a71" key={v}><line shuku-edit-id="e-99164533-43ff-4d89-9d18-3ff5bb88c58f" className="tr-period-grid" x1={62 + v * 6.38} x2={62 + v * 6.38} y1="30" y2="285"/><text shuku-edit-id="e-aa577cdb-333a-45bf-b8d4-f488d5727816" x={62 + v * 6.38} y="309" textAnchor="middle">{v}</text></g>)}
                  <line shuku-edit-id="e-9c843d0b-ae38-45a4-b3b5-ca9cffeb28c8" className="tr-period-axis" x1="62" x2="62" y1="30" y2="285"/><line shuku-edit-id="e-a3533318-5ef0-4950-b06c-dc2d917fe930" className="tr-period-axis" x1="62" x2="700" y1="285" y2="285"/>
                  <path shuku-edit-id="e-a82fd521-29a1-494b-ac96-89f3eeaa8f8f" className="tr-period-single" d={curvePath(pairIndex)} stroke="#318c9e"/>
                  <g shuku-edit-id="e-ab036c73-586c-47f6-9d74-42eb72d0e9e0" className="tr-period-overlays" aria-hidden={!showComparison}>{comparisonGroups.map((i, index) => <path shuku-edit-id="e-b353d70a-ace5-4e8f-933c-d538ee292fd7" key={i} d={curvePath(i)} stroke={comparisonColors[index]} pathLength="1" style={{ animationDelay: `${index * 120}ms` }}/>)}</g>
                  <text shuku-edit-id="e-bb31f691-c46b-42de-b11c-83e1821cffb3" x="381" y="343" textAnchor="middle" className="tr-period-axis-label">位置差 Δp</text><text shuku-edit-id="e-f8a70060-3723-40ba-bab2-374d96edee19" transform="translate(19 157) rotate(-90)" textAnchor="middle" className="tr-period-axis-label">点积 Sᵢ</text>
                </svg>
                <div shuku-edit-id="e-81a992a7-0c34-4a9c-8ee7-a94543b91529" className="tr-period-chart-footer">
                  <div shuku-edit-id="e-07785d4b-f676-48c3-8a49-5745424d7cb0" className="tr-period-current">周期约 <b shuku-edit-id="e-7c900bdc-7090-4376-8dd3-087d1d317339">{(2 * Math.PI / omega(pairIndex)).toLocaleString('en-US', { maximumFractionDigits: 1 })}</b> 格<span shuku-edit-id="e-08e11c56-8b05-4378-8abf-678c084a5453">拉到最右端，自动叠加对比</span></div>
                  <div shuku-edit-id="e-8612c77b-7a96-45f6-8f28-ad8ce10a758d" className="tr-period-overlay-legend">{comparisonGroups.map((i, index) => <div shuku-edit-id="e-1af390ba-0f36-4fbf-8764-a51dd3e882e4" key={i} style={{ color: comparisonColors[index] }}><strong shuku-edit-id="e-ee6c7ec5-a6b1-40a1-b9e3-0fc07b8dce93"><i shuku-edit-id="e-c2c16df8-2cea-4276-ae86-cdabdd606aca" />i = {i}</strong><span shuku-edit-id="e-08385b3a-7e0e-45ce-9e88-2f5e2f0b2548">周期 ≈ {Math.round(2 * Math.PI / omega(i))} 格</span></div>)}</div>
                </div>
              </div>
            </div>

          </section>}

          {act === 2 && <section shuku-edit-id="e-c3926c87-a2e2-47fd-9072-8203be58d864" className="tr-multi-act is-benefit">
            <div shuku-edit-id="e-9e1347f8-6825-47c4-bb28-7caad63b9a74" className="tr-benefit-grid">
              <article shuku-edit-id="e-dfa25ed6-ea09-44c6-b504-bb5a6237aae1"><h3 shuku-edit-id="e-497884b0-7434-46ca-a13a-ac10a99d9cbe">短周期：区分近距离</h3><MiniPeriodChart indices={[100]}/><p shuku-edit-id="e-ceedecd3-ef9c-4bc4-a63b-10c0dba6da01">位置差稍有变化，点积就明显改变，便于区分附近位置。</p></article>
              <article shuku-edit-id="e-5e72b660-c335-4155-809f-2dc4ba7419f4"><h3 shuku-edit-id="e-ac21b3b1-c0ee-4990-8e7d-e7020cb5b987">长周期：覆盖远距离</h3><MiniPeriodChart indices={[164]}/><p shuku-edit-id="e-954c91d9-0154-4dec-872d-15b1b617a045">点积在较大范围内缓慢变化，提供远距离参照。</p></article>
              <article shuku-edit-id="e-d54a1fa8-a11e-48ed-b61f-6e763abcdd94"><h3 shuku-edit-id="e-c87b0d56-833b-48d1-9d74-4adec9ebb192">多个周期：兼顾远近</h3><MiniPeriodChart indices={[100, 128, 164]}/><p shuku-edit-id="e-6e03ed4e-e93c-4576-a17f-b68d86004c15">快慢变化组合，让不同距离呈现更丰富的位置模式。</p></article>
            </div>
          </section>}

        </main>

        <footer shuku-edit-id="e-43833795-cce0-47c0-9bb9-4703ea798ca9" className="tr-multiscale__footer">
          <span shuku-edit-id="e-f95ea1df-0ba4-4838-80a0-46dc43e3dd28" className="tr-period-boundary-note">{act !== 1 && '点积有周期性，并非距离越大就越小。'}</span>
          <Button className="tr-multi-primary" variant="primary" onClick={onComplete}>{act === 0 ? '下一页：为什么快慢不同？' : act === 1 ? '下一页：不同周期的价值' : '继续：注意力之后怎样加工信息？'}</Button>
        </footer>
      </section>
    </LessonPageFrame>);
}

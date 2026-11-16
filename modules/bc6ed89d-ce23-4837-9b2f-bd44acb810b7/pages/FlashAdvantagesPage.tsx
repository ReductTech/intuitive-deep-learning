import { Typography } from "@shuku/course-style/react";
import './FlashAdvantagesPage.css';

function Matrix({ small = false, active = false }: { small?: boolean; active?: boolean }) {
  const size = small ? 3 : 6;
  return <div shuku-edit-id="e-89fd58b5-200e-4fad-b22f-29f3f8094a25" className={`fav-matrix ${small ? 'fav-matrix--small' : ''} ${active ? 'fav-matrix--active' : ''}`} aria-hidden="true">
    {Array.from({ length: size * size }, (_, index) => <span shuku-edit-id="e-cd6e268c-9dd8-4351-a4f7-d22a753ddf51" key={index} />)}
  </div>;
}

export function FlashAdvantagesPage() {
  return <section shuku-edit-id="e-775507b5-57d7-413c-b8a2-c4944fda59c0" className="fav-slide" aria-label="FlashAttention 总结：降低临时显存，减少数据搬运">
    <Typography shuku-edit-id="e-68538bb1-5e05-4954-a712-d5e4391d7f21" as="h1" variant="h1">FlashAttention 的两个优势</Typography>
    <main shuku-edit-id="e-f0f1a555-8ed1-4282-9b10-1cd945218b84" className="fav-columns">
      <section shuku-edit-id="e-fc4c5443-1597-493b-b891-c5bf753a2016" className="fav-advantage">
        <div shuku-edit-id="e-e40eb660-08ea-491c-bc5c-e18a6d15834c" className="fav-heading">
          <Typography shuku-edit-id="e-c73bf32b-f2da-4ff6-a4af-ca8779be6299" as="p" variant="h3" tone="muted">分块计算</Typography>
          <Typography shuku-edit-id="e-af55a6b3-e2f4-4ff2-8195-1f345e148c35" as="h2" variant="h1">降低临时显存</Typography>
        </div>
        <div shuku-edit-id="e-d4a5dfcf-3789-4546-b419-10d3ef1287e2" className="fav-memory-diagram" role="img" aria-label="从暂存完整中间矩阵，到只处理当前小块，不保存完整 S、P">
          <div shuku-edit-id="e-bfdd29e0-07fd-48de-b11d-f20044bda172" className="fav-matrix-stage"><Matrix /><Typography shuku-edit-id="e-80a51e55-c095-4e51-8de6-c90ca74e7f1c" as="span" variant="body" tone="muted">完整中间矩阵</Typography></div>
          <svg shuku-edit-id="e-8807bb8d-8fb0-4545-99cf-7ee6f07b3279" className="fav-forward" viewBox="0 0 90 40" aria-hidden="true"><path shuku-edit-id="e-6f33b61c-2d02-488d-a210-e51c50c845ec" d="M5 20 H78 M64 6 L78 20 L64 34" /></svg>
          <div shuku-edit-id="e-8210edd6-6300-4a4e-be42-8e1812e931f8" className="fav-matrix-stage"><Matrix small active /><Typography shuku-edit-id="e-8d805cdc-f927-41b0-b979-d391892f8804" as="span" variant="body" tone="main">当前小块</Typography></div>
        </div>
        <Typography shuku-edit-id="e-ca0f0b23-d982-4327-b40e-a1eb18803b99" as="p" variant="h3" className="fav-conclusion">不保存完整 S、P</Typography>
      </section>
      <section shuku-edit-id="e-d652b09d-ac16-4d6c-a664-0b27242f5d66" className="fav-advantage">
        <div shuku-edit-id="e-51a1221e-8874-42ac-9d2e-3c39dd32432c" className="fav-heading">
          <Typography shuku-edit-id="e-86a7b994-c73d-4b1e-91f2-0476d2bcc528" as="p" variant="h3" tone="muted">少存中间结果</Typography>
          <Typography shuku-edit-id="e-45c98a6f-ca36-4175-82d3-e52e4638ecba" as="h2" variant="h1">减少数据搬运</Typography>
        </div>
        <div shuku-edit-id="e-2d5a2bcb-4825-456d-b5d2-d36fe26193b2" className="fav-io-diagram" role="img" aria-label="常规实现将中间结果写回 HBM 并读回；FlashAttention 在 SRAM 内连续处理小块">
          <div shuku-edit-id="e-2d143f1e-a4ad-41fc-a60c-5631776333c8" className="fav-hbm"><Typography shuku-edit-id="e-eff08cb5-27ec-4561-a312-d1886d81a2fe" as="strong" variant="h3">HBM</Typography></div>
          <div shuku-edit-id="e-116e23c2-ac39-420e-914a-0b582fa722f2" className="fav-io-lanes">
            <div shuku-edit-id="e-babe83ea-250a-4cb0-b885-108d11b13301" className="fav-transfers">
              <svg shuku-edit-id="e-197a17fa-737c-4b60-b0d4-1a6c5e8aac09" viewBox="0 0 260 155" aria-hidden="true">
                {[40,100,160,220].map((x,index) => <path shuku-edit-id="e-1830b7a9-4124-479e-aebb-670b8d2ad729" key={x} d={index % 2 ? `M${x} 137 V18 M${x-10} 31 L${x} 18 L${x+10} 31` : `M${x} 18 V137 M${x-10} 124 L${x} 137 L${x+10} 124`} />)}
              </svg>
              <Typography shuku-edit-id="e-6bae687a-9343-49d3-b1a3-b45c94fab718" as="span" variant="bodySmall" tone="muted">写回 · 读回</Typography>
            </div>
            <div shuku-edit-id="e-e4fadae8-1d80-45b5-ad93-d46630e30efa" className="fav-fused-transfer">
              <Typography shuku-edit-id="e-e6c61734-b396-435d-a015-34a4463ea77f" as="span" variant="bodySmall" tone="muted">小块在片上接着计算</Typography>
            </div>
          </div>
          <div shuku-edit-id="e-cdf5a0fa-ee97-4f32-b6d3-4950db68618e" className="fav-sram">
            <Typography shuku-edit-id="e-cf3df575-b9d5-417a-beba-d11d13b9137a" as="strong" variant="h3">SRAM</Typography>
            <div shuku-edit-id="e-2a25cac1-1b9b-4caf-af64-1f766e1a16a8" className="fav-workspaces">
              <div shuku-edit-id="e-2b5a040f-9a52-455e-b8f1-d20930a23659" className="fav-ordinary"><Matrix small /><Typography shuku-edit-id="e-efa20fd4-c2e3-4b63-9fa3-a5c97bbbabf8" as="span" variant="bodySmall" tone="muted">常规实现</Typography></div>
              <div shuku-edit-id="e-e06c5742-f690-4cfe-bbec-b5ebc70ec827" className="fav-fused">
                <div shuku-edit-id="e-dd9dc963-6d8b-477f-b805-0a7c34ff77d9" className="fav-local-chain"><Matrix small active /><Typography shuku-edit-id="e-96ae947e-5d0f-496b-bf05-9f1963941c17" as="span" variant="h3">→</Typography><Matrix small active /></div>
                <Typography shuku-edit-id="e-c03377b4-8340-4c46-8afb-40fd1571187c" as="span" variant="bodySmall">分块融合</Typography>
              </div>
            </div>
          </div>
        </div>
        <Typography shuku-edit-id="e-6bab1662-6e76-4b59-a1e8-049a7dbbf9be" as="p" variant="h3" className="fav-conclusion">减少中间结果的写回与读回</Typography>
      </section>
    </main>
  </section>;
}

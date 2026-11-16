import { useState } from 'react';
import { RangeControl, Typography } from "@shuku/course-style/react";
import './AttentionMatrixGrowthPage.css';

const LENGTHS = [4, 8, 16, 32] as const;
const WORDS = ['我', '爱', '学', '习'];

function VectorRows({ kind, count }: { kind: 'q' | 'k'; count: number }) {
  return <div shuku-edit-id="e-3856c084-3e91-4d01-8fe8-9b8c3acd9528" className={`kvg-vector kvg-vector--${kind}`}>
    <Typography shuku-edit-id="e-867e4959-947b-446a-8ed2-7103189e3d5f" as="strong" variant="h2" align="center">{kind.toUpperCase()}</Typography>
    <div shuku-edit-id="e-50f58bb6-166c-406a-b18a-967c05be8c94" className="kvg-vector-rows" aria-label={`${kind.toUpperCase()} 有 ${count} 行`}>
      {Array.from({ length: count }, (_, index) => <span shuku-edit-id="e-601f093f-d8d1-4ccc-910a-a825f6be1c54" key={index} />)}
    </div>
    <Typography shuku-edit-id="e-cbc267df-250a-4604-8239-44222857991f" as="span" variant="h3" align="center">{count} 行</Typography>
  </div>;
}

export function AttentionMatrixGrowthPage() {
  const [lengthIndex, setLengthIndex] = useState(0);
  const length = LENGTHS[lengthIndex];
  const squareStyle = { width: length * 10.5, height: length * 10.5, backgroundSize: `${100 / length}% ${100 / length}%` };

  return <section shuku-edit-id="e-433577d2-9ba6-4a03-974c-1b4951bb59a3" className="kvg-slide" aria-label="注意力中间矩阵随上下文长度增长">
    <header shuku-edit-id="e-930b1a1f-de5f-42a4-bd4c-a8a17c7666e1" className="kvg-header">
      <Typography shuku-edit-id="e-41c9a7ef-9752-431b-899c-93bc84b196a3" as="h1" variant="display">注意力的临时显存来自这些大矩阵</Typography>
    </header>

    <div shuku-edit-id="e-5ace7a13-1b46-4724-a30c-21fb26c30b9e" className="kvg-stage">
      <div shuku-edit-id="e-37cda396-7d7a-45f4-85ae-a73c8e8638a8" className="kvg-tokens" aria-label="示例输入：我爱学习">
        {WORDS.map(word => <div shuku-edit-id="e-1dba87ef-d70c-4465-ac60-3e83706c8bd0" className="kvg-token" key={word}><Typography shuku-edit-id="e-45900b0e-e6d7-464a-9d5b-0c6d78fb3855" as="span" variant="h3">{word}</Typography></div>)}
        {length > 4 && <Typography shuku-edit-id="e-dd545574-aedf-462d-8268-bccd7ef6826c" as="span" variant="h3" tone="muted" align="center">…</Typography>}
      </div>
      <div shuku-edit-id="e-0ecb963a-e001-475a-99ec-d91f7c6b7169" className="kvg-vector-pair">
        <VectorRows kind="q" count={length} />
        <Typography shuku-edit-id="e-400e6a20-5b9f-473f-9428-1451ed31b7e5" as="span" variant="h2" tone="muted">×</Typography>
        <VectorRows kind="k" count={length} />
        <Typography shuku-edit-id="e-31aac2c8-eeb1-4758-8807-2f252ff6bca0" as="span" variant="h2" tone="muted">→</Typography>
      </div>
      <div shuku-edit-id="e-1ade276e-d675-4faf-8fe7-38eadf355571" className="kvg-result">
        <div shuku-edit-id="e-548deb60-f902-4148-a818-887306375861" className="kvg-result-matrix">
          <Typography shuku-edit-id="e-49d24601-621a-4105-b9f4-a3df85f1541b" as="strong" variant="h3">S = QK<sup shuku-edit-id="e-8c5984bc-3f44-4ef6-96df-a9486d07445f">T</sup></Typography>
          <div shuku-edit-id="e-3189dda1-3aed-41bd-b6bd-9f3babb43542" className="kvg-square kvg-square--score" style={squareStyle} role="img" aria-label={`分数矩阵 S，${length} 乘 ${length}，共 ${length * length} 个位置`} />
          <Typography shuku-edit-id="e-949eb671-b0c4-46f0-9f78-a649535c77e9" as="strong" variant="h3" tone="success">{length} × {length}</Typography>
        </div>
        <Typography shuku-edit-id="e-997d196d-ea53-4189-93b0-3dcb29a6693f" as="span" variant="h3" align="center" className="kvg-softmax-arrow">Softmax →</Typography>
        <div shuku-edit-id="e-d411def4-2d29-416d-85fe-af2e0f4e0145" className="kvg-result-matrix">
          <Typography shuku-edit-id="e-f0b3037a-9400-40f3-befd-e5417a3d4531" as="strong" variant="h3">P = Softmax(S)</Typography>
          <div shuku-edit-id="e-95f492b5-15a2-41cc-b7b2-3cecc8255f9e" className="kvg-square kvg-square--probability" style={squareStyle} role="img" aria-label={`权重矩阵 P，${length} 乘 ${length}，共 ${length * length} 个位置`} />
          <Typography shuku-edit-id="e-cd05d8e3-224b-4d75-ab22-6017bad245fd" as="strong" variant="h3" tone="success">{length} × {length}</Typography>
        </div>
      </div>
    </div>

    <footer shuku-edit-id="e-ed8a5654-b003-4c65-8029-e687669d7674" className="kvg-footer">
      <div shuku-edit-id="e-ad0f6193-e6af-4865-a69d-9a1e849df557" className="kvg-slider-heading">
        <Typography shuku-edit-id="e-1d4f51da-5d56-44aa-ad24-5b0bd3e7d061" as="strong" variant="h3">长度 T：{length}</Typography>
        <Typography shuku-edit-id="e-3e54e9b6-c486-4879-a705-2f564ae250e4" as="strong" variant="h3" tone="success">T ×2 → 面积 ×4</Typography>
      </div>
      <RangeControl
        id="kvg-length"
        label=""
        aria-label="上下文 token 数量"
        min={0}
        max={3}
        step={1}
        discrete
        scale={LENGTHS.map(value => String(value))}
        value={lengthIndex}
        formatValue={value => `${LENGTHS[Number(value)]} token`}
        onChange={event => setLengthIndex(Number(event.currentTarget.value))}
      />
    </footer>
  </section>;
}

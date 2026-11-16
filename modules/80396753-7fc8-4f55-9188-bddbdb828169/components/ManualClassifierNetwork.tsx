const inputY = Array.from({ length: 9 }, (_, index) => 36 + index * 43);
const hiddenY = [52, 98, 144, 276, 322, 368];
const outputY = Array.from({ length: 10 }, (_, index) => 27 + index * 39);

export function ManualClassifierNetwork() {
  return <svg shuku-edit-id="e-9d879e0f-7bff-423c-b0d7-9aca77c017a7" viewBox="0 0 400 414" className="vfl-manual-network-svg" role="img" aria-label="九个输入、三十二个隐藏神经元与十个输出组成的全连接网络结构示意">
    <g shuku-edit-id="e-da2db802-212a-4d95-95ca-30b8321ee386" stroke="#a9bfdf" strokeWidth="1" opacity=".72">
      {inputY.flatMap((from, input) => hiddenY.map((to, hidden) => <line shuku-edit-id="e-6965419a-a6ba-402d-b1bb-629b0261e77d" key={`i-${input}-${hidden}`} x1="46" y1={from} x2="200" y2={to} />))}
      {hiddenY.flatMap((from, hidden) => outputY.map((to, output) => <line shuku-edit-id="e-cff740eb-966f-41cb-8b7f-cc4efdf1e744" key={`o-${hidden}-${output}`} x1="200" y1={from} x2="354" y2={to} />))}
    </g>
    {inputY.map((y, index) => <circle shuku-edit-id="e-13bb462b-6853-4de8-b338-8293751499db" key={`input-${index}`} cx="46" cy={y} r="13" fill="#eaf3ff" stroke="#2769c4" strokeWidth="2.4" />)}
    {hiddenY.map((y, index) => <circle shuku-edit-id="e-d3990c01-efdb-4dc1-a600-c1a7767032f4" key={`hidden-${index}`} cx="200" cy={y} r="13" fill="#fff4e6" stroke="#e79026" strokeWidth="2.4" />)}
    {outputY.map((y, index) => <circle shuku-edit-id="e-e4d5570b-56f4-4c85-a258-ecc2ba75d6a3" key={`output-${index}`} cx="354" cy={y} r="12" fill="#fff0f1" stroke="#df5661" strokeWidth="2.4" />)}
    <circle shuku-edit-id="e-906f3320-e64c-4bae-a787-ebdfd1a2a45b" cx="200" cy="185" r="2.3" fill="#173a6a" />
    <circle shuku-edit-id="e-5cb81637-0548-4443-9141-1818d5c5dab5" cx="200" cy="196" r="2.3" fill="#173a6a" />
    <circle shuku-edit-id="e-a5741859-62ff-445d-a1c0-2594814ef7bc" cx="200" cy="207" r="2.3" fill="#173a6a" />
  </svg>;
}


const inputY = Array.from({ length: 9 }, (_, index) => 36 + index * 43);
const hiddenY = [52, 98, 144, 276, 322, 368];
const outputY = Array.from({ length: 10 }, (_, index) => 27 + index * 39);

export function ManualClassifierNetwork() {
  return <svg viewBox="0 0 400 414" className="vfl-manual-network-svg" role="img" aria-label="九个输入、三十二个隐藏神经元与十个输出组成的全连接网络结构示意">
    <g stroke="#a9bfdf" strokeWidth="1" opacity=".72">
      {inputY.flatMap((from, input) => hiddenY.map((to, hidden) => <line key={`i-${input}-${hidden}`} x1="46" y1={from} x2="200" y2={to} />))}
      {hiddenY.flatMap((from, hidden) => outputY.map((to, output) => <line key={`o-${hidden}-${output}`} x1="200" y1={from} x2="354" y2={to} />))}
    </g>
    {inputY.map((y, index) => <circle key={`input-${index}`} cx="46" cy={y} r="13" fill="#eaf3ff" stroke="#2769c4" strokeWidth="2.4" />)}
    {hiddenY.map((y, index) => <circle key={`hidden-${index}`} cx="200" cy={y} r="13" fill="#fff4e6" stroke="#e79026" strokeWidth="2.4" />)}
    {outputY.map((y, index) => <circle key={`output-${index}`} cx="354" cy={y} r="12" fill="#fff0f1" stroke="#df5661" strokeWidth="2.4" />)}
    <circle cx="200" cy="185" r="2.3" fill="#173a6a" />
    <circle cx="200" cy="196" r="2.3" fill="#173a6a" />
    <circle cx="200" cy="207" r="2.3" fill="#173a6a" />
  </svg>;
}


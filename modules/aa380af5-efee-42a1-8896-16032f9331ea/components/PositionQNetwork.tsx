import './PositionQNetwork.css';

/** The drawing omits nodes; inference still uses 49 inputs, 24 ReLU units and 4 outputs. */
export function PositionQNetwork({ hidden, active = false, target = false }: { hidden?: readonly number[]; active?: boolean; target?: boolean }) {
  const inputY = [21,58,95,132,169,227], hiddenY = [14,49,84,119,154,189,230], outputY = [30,98,166,234];
  const hiddenIndices = [0,1,2,3,4,5,23], scale = Math.max(...(hidden ?? [1]), .000001);
  return <svg className={'vbrl-position-network' + (target ? ' is-target' : '') + (active ? ' is-active' : '')}
    viewBox="0 0 320 244" preserveAspectRatio="none" role="img" aria-label="49 个输入、24 个共享 ReLU 单元与 4 个动作输出；省略部分节点">
    <g className="vbrl-position-network__connections">
      {inputY.flatMap((y,i) => hiddenY.map((nextY,j) => <line key={`in-${i}-${j}`} x1="24" y1={y} x2="155" y2={nextY} />))}
      {hiddenY.flatMap((y,i) => outputY.map((nextY,j) => <line key={`out-${i}-${j}`} x1="155" y1={y} x2="300" y2={nextY} />))}
    </g>
    {inputY.map((y,i) => <circle key={'i'+i} cx="24" cy={y} r="8" className="is-input" />)}
    {hiddenY.map((y,i) => <circle key={'h'+i} cx="155" cy={y} r="10" className="is-hidden" style={{fillOpacity:hidden ? .25+hidden[hiddenIndices[i]]/scale*.75 : .5}} />)}
    {outputY.map((y,i) => <circle key={'o'+i} cx="300" cy={y} r="8" className="is-output" />)}
    {[196,204,212].map(y => <circle key={'ei'+y} cx="24" cy={y} r="1.7" className="is-ellipsis" />)}
    {[202,209,216].map(y => <circle key={'eh'+y} cx="155" cy={y} r="1.7" className="is-ellipsis" />)}
  </svg>;
}

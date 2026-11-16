import { useId, type CSSProperties } from 'react';

const delay = (index: number) => ({ '--icon-delay': `${index * .2}s` } as CSSProperties);

export function PlatformCapabilityIcon({ index }: { index: number }) {
  const id = `aip-icon-${useId().replaceAll(':', '')}`;
  return <svg shuku-edit-id="e-17ca6f07-6525-4fa9-9a9c-958277d3947e" className="aipe-platform-icon" viewBox="0 0 180 180" aria-hidden="true">
    <defs shuku-edit-id="e-6391b869-cf3b-4dba-a347-52d7474c8fc0">
      <linearGradient shuku-edit-id="e-37c961cf-ea39-4c56-86d5-3eaa4df185a0" id={`${id}-blue`} x1="0" y1="0" x2=".8" y2="1"><stop shuku-edit-id="e-7f9b0863-3930-49cf-aabb-67f0f8e63b31" stopColor="#6db9ff"/><stop shuku-edit-id="e-5336b536-d03e-4374-a880-ee79da68b94e" offset="1" stopColor="#2373db"/></linearGradient>
      <linearGradient shuku-edit-id="e-bbe9bc60-a36a-4812-91b4-c52b5323e210" id={`${id}-navy`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-86ad73d8-5149-442c-896e-45a0e4acc689" stopColor="#28528c"/><stop shuku-edit-id="e-640f7769-ab69-456b-b3ff-e8f7b11b72d4" offset="1" stopColor="#113361"/></linearGradient>
      <linearGradient shuku-edit-id="e-7fe28cee-9a1a-43c6-8f74-f868a4be1f4b" id={`${id}-pale`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-2b4ba99e-3689-4ec9-8184-8404cdf3a7a7" stopColor="#cce8ff"/><stop shuku-edit-id="e-f88318cf-02f5-4398-a269-1a35c9954cb0" offset="1" stopColor="#80bbf5"/></linearGradient>
      <linearGradient shuku-edit-id="e-445cb532-3ff6-4f55-aa4c-fe039f458e3a" id={`${id}-white`} x1="0" y1="0" x2=".5" y2="1"><stop shuku-edit-id="e-cda54c70-ff33-4223-b8cf-de6af3c659d9" stopColor="#fff"/><stop shuku-edit-id="e-d716b715-b1c0-4b56-a7bc-78c035f64fcf" offset="1" stopColor="#f0f8ff"/></linearGradient>
      <linearGradient shuku-edit-id="e-1e86b4c5-4d2d-4f0a-ae4e-2306379e9e06" id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-1f950387-7f01-4aeb-8354-c334e84c6ff7" stopColor="#ffce60"/><stop shuku-edit-id="e-fb37cbac-4b17-47da-bc59-f451d7195d04" offset="1" stopColor="#fa9829"/></linearGradient>
    </defs>
    {index === 0 ? <>
      <rect shuku-edit-id="e-b3fa430c-9742-4d31-8e4e-1c9021a3b4f0" x="66" y="21" width="74" height="103" rx="10" fill="#c2e1ff" transform="rotate(9 103 72)"/>
      <rect shuku-edit-id="e-a6e77855-e25e-479e-bb11-7c688ed3523b" x="52" y="30" width="77" height="108" rx="10" fill={`url(#${id}-pale)`}/>
      <rect shuku-edit-id="e-42ffb544-6aeb-49d6-ab1a-208bd1a37f58" x="25" y="42" width="83" height="111" rx="9" fill={`url(#${id}-white)`} stroke="#c1dfff" strokeWidth="2"/>
      <path shuku-edit-id="e-71aefa13-65b0-4e94-8579-7fc339cfed58" d="M39 61h27" stroke="#ffb447" strokeWidth="6" strokeLinecap="round"/>
      {[0, 1, 2, 3].map(i => <path shuku-edit-id="e-cd2de40a-b171-4a8f-b646-aafe93ce6450" key={i} d={`M39 ${79 + i * 15}h${i === 3 ? 26 : 51}`} stroke="#b0d6ff" strokeWidth="5" strokeLinecap="round"/>)}
      <g shuku-edit-id="e-7e48c093-eafd-47de-84be-09c2da9f6034" className="aip-icon-lens">
        <path shuku-edit-id="e-92241c22-9395-4668-8be9-5aba14f48b1f" d="m132 136 20 23" stroke={`url(#${id}-navy)`} strokeWidth="14" strokeLinecap="round"/>
        <circle shuku-edit-id="e-0193b33e-9151-4966-b8e6-0d6789a4e597" cx="113" cy="119" r="29" fill={`url(#${id}-blue)`} stroke="#2c76cb" strokeWidth="3"/>
        <circle shuku-edit-id="e-8f2c7f40-d98e-42de-9b0b-32a9c3cd23a8" cx="113" cy="119" r="20" fill="#c4e6ff" stroke="#effaff" strokeWidth="3"/>
        <path shuku-edit-id="e-32a93c7f-93f8-4108-a78c-26c6d79cad9a" d="M101 117q0-10 10-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
      </g>
    </> : index === 1 ? <>
      <rect shuku-edit-id="e-66fbd205-5288-446b-bc2d-407a16ad53df" x="20" y="31" width="141" height="120" rx="10" fill={`url(#${id}-white)`} stroke="#bbdcff" strokeWidth="2"/>
      <path shuku-edit-id="e-809e91a3-27aa-4496-bc5b-f0fab8fa7d12" d="M20 54V41q0-10 10-10h121q10 0 10 10v13Z" fill={`url(#${id}-blue)`}/>
      {['#ffc15d', '#8cddcb', '#c9e9ff'].map((color, i) => <circle shuku-edit-id="e-a851d885-d86f-4763-9104-aa3365676175" key={color} cx={33 + i * 12} cy="42" r="3.5" fill={color}/>)}
      {[0, 1, 2, 3].map(i => <path shuku-edit-id="e-789c46ef-7cf6-4975-b9ed-888335c8e719" key={i} d={`M34 ${72 + i * 15}h${i % 2 ? 26 : 35}`} stroke="#b5d9ff" strokeWidth="5" strokeLinecap="round"/>)}
      <path shuku-edit-id="e-7c4d6cd0-c631-4fd8-88a2-b0439b2b2d77" className="aip-icon-link" d="m95 105 22-30 26 29-22 29-26-28 48-1M117 75l4 58" stroke="#88bdf6" strokeWidth="3" fill="none"/>
      {[[95,105],[117,75],[143,104],[121,133]].map(([cx,cy], i) => <circle shuku-edit-id="e-9d273bf1-807f-4825-be56-0bef49f07807" key={i} className="aip-icon-node" style={delay(i)} cx={cx} cy={cy} r="10" fill={i === 2 ? `url(#${id}-orange)` : `url(#${id}-blue)`}/>)}
      <path shuku-edit-id="e-5d2d70ad-6de5-4a6b-8d69-2a91ae6602bf" d="M38 137q13-6 26 1 13-7 26-1v23q-13-5-26 1-13-6-26-1Z" fill="#fff" stroke="#79b7f5" strokeWidth="2.5" strokeLinejoin="round"/>
      <path shuku-edit-id="e-fe4edb96-1560-43bc-90b0-4f429d69e9cf" d="M64 139v21" stroke="#79b7f5" strokeWidth="2"/>
    </> : index === 2 ? <>
      <rect shuku-edit-id="e-299a533b-c8e2-4cc7-92ba-06c41ec4d579" x="20" y="33" width="141" height="115" rx="10" fill={`url(#${id}-white)`} stroke="#b9dbff" strokeWidth="2"/>
      <path shuku-edit-id="e-2ceb8917-336a-466e-9ac2-f511430cb05f" d="M20 57V43q0-10 10-10h121q10 0 10 10v14Z" fill={`url(#${id}-navy)`}/>
      {['#ffbf62', '#80d3cf', '#9dc9ff'].map((color, i) => <circle shuku-edit-id="e-f73cac14-6161-4765-9956-2b219e34a817" key={color} cx={34+i*12} cy="45" r="3.5" fill={color}/>)}
      <path shuku-edit-id="e-28b30fff-c95e-4208-b1db-f331fc32fe8f" className="aip-icon-code" d="m58 73-12 10 12 10m28-20 12 10-12 10M77 70l-9 27" stroke="#285b99" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {[0, 1, 2].map(i => <rect shuku-edit-id="e-8c9246b1-4199-499d-a120-9c2b8160fe17" key={i} className="aip-icon-bar" style={delay(i)} x={101+i*17} y={128-i*16} width="12" height={21+i*16} rx="4" fill={`url(#${id}-${i===2?'orange':'blue'})`}/>)}
      <path shuku-edit-id="e-9e13b7f5-74b1-4348-8c04-34f3c65208d2" d="M37 110h25m-20 0v19l-13 27q-4 8 5 8h34q9 0 5-8l-15-27v-19" fill="#e8f7ff" stroke="#72b5f3" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      <path shuku-edit-id="e-b0078c69-3b4e-4dd9-ae2d-7f073f573290" d="m37 147-5 11q-1 3 3 3h32q4 0 2-3l-6-11Z" fill={`url(#${id}-blue)`}/>
      <circle shuku-edit-id="e-9e6d03ec-fc1a-46b9-af8b-65f79b55c1f3" className="aip-icon-node" cx="50" cy="140" r="3" fill="#74bcff"/>
    </> : index === 3 ? <>
      <rect shuku-edit-id="e-ff958b5a-60ff-4978-b5f3-a5a1cddc957b" x="20" y="35" width="141" height="119" rx="12" fill={`url(#${id}-white)`} stroke="#c0ddfc" strokeWidth="2"/>
      <circle shuku-edit-id="e-8651f52d-f4f7-47d9-8f59-0fb4206709f8" cx="52" cy="65" r="20" fill={`url(#${id}-navy)`}/>
      <circle shuku-edit-id="e-3d1782e9-f572-45fb-b845-d9b8effba1f5" cx="52" cy="60" r="6" fill="#fff"/>
      <path shuku-edit-id="e-9c82097b-307b-4947-a8d3-6e2e59a6b630" d="M40 77q0-12 12-12t12 12" fill="#fff"/>
      <path shuku-edit-id="e-33802443-7e49-46d0-8c06-ce44dd4b20c2" d="M84 55h54M84 69h39" stroke="#a8d1ff" strokeWidth="5" strokeLinecap="round"/>
      {[0, 1, 2].map(i => <g shuku-edit-id="e-882e9a8d-cf9e-4f09-8802-ec89b2b76721" key={i}>
        <circle shuku-edit-id="e-bff139a3-1356-4b85-877b-9c983ae3f7e1" cx="40" cy={100+i*17} r="6.5" fill={`url(#${id}-blue)`}/>
        <path shuku-edit-id="e-c0eadc3f-8dbf-4f6e-b3d5-5ec23f641306" className="aip-icon-check" style={delay(i)} d={`m37 ${100+i*17} 2 2 4-5`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path shuku-edit-id="e-7de55098-132d-4c54-8c3b-a1989511687b" d={`M55 ${100+i*17}h${i===1?27:37}`} stroke="#b5d9ff" strokeWidth="5" strokeLinecap="round"/>
      </g>)}
      {[0, 1, 2].map(i => <rect shuku-edit-id="e-04b0920b-87ea-4e85-be8d-facd9d1eeae6" key={i} className="aip-icon-bar" style={delay(i)} x={106+i*14} y={126-i*11} width="10" height={15+i*11} rx="3" fill={['#7bc9d1','#67a9f9',`url(#${id}-orange)`][i]}/>)}
    </> : <>
      <path shuku-edit-id="e-aa23b7f1-f71e-4bd5-9ed3-10009cbc3697" d="M16 158q0-46 39-46 37 0 40 46" fill={`url(#${id}-blue)`}/>
      <path shuku-edit-id="e-cfa61b06-d47e-432f-be98-6ddb03dacb44" d="m43 111 12 18 12-18 8 47H35Z" fill="#eef8ff"/>
      <path shuku-edit-id="e-2bd1a47e-d1fb-4435-88d5-e1d6a56f44e4" d="m53 132-4 23 7 6 6-6-6-23" fill="#2d619d"/>
      <rect shuku-edit-id="e-5c111415-e393-4a0f-a6a7-440abb99a215" x="47" y="98" width="17" height="20" rx="6" fill="#f4bf9c"/>
      <ellipse shuku-edit-id="e-9ef96cea-dc4a-4f47-ae1b-7f88817dcade" cx="55" cy="82" rx="23" ry="27" fill="#ffcfad"/>
      <path shuku-edit-id="e-0c640b94-2aa0-4fbe-a84d-26f8548809c8" d="M31 85V69q1-25 24-23 24-2 25 23l-9 11-4-18q-13 11-27 6l-1 18Z" fill={`url(#${id}-navy)`}/>
      <path shuku-edit-id="e-ba30037c-7a2b-4f71-93cc-426bea9b6aa5" d="M36 81h15v10H38Zm20 0h15v10H58Zm-5 3h6" fill="none" stroke="#285587" strokeWidth="2.5" strokeLinejoin="round"/>
      <path shuku-edit-id="e-628e0b2b-1a33-4261-8f09-bf7f60e61858" className="aip-icon-mentor" d="m79 137 19-16 3-19q1-5 5-3l2 15 5-8q3-4 5 0l-6 22-22 23Z" fill="#ffcfad"/>
      <path shuku-edit-id="e-6619e4e2-c331-414d-8df9-8962e2864edf" d="M112 158q-2-36 26-36 28 0 30 36" fill={`url(#${id}-pale)`}/>
      <rect shuku-edit-id="e-a414fa74-2c1c-4ea4-907b-bdfad9515109" x="131" y="112" width="13" height="14" rx="5" fill="#f3bb97"/>
      <ellipse shuku-edit-id="e-68192a68-045e-4cce-b751-f874545cb60b" cx="138" cy="101" rx="19" ry="22" fill="#ffcfad"/>
      <path shuku-edit-id="e-ad8d3b6a-8c27-423a-ad9d-6863de093796" d="M118 102V88q0-16 20-16 23-1 22 19l-9 11-4-15q-9 9-22 5v13Z" fill={`url(#${id}-navy)`}/>
      <path shuku-edit-id="e-488dbd27-8553-4606-9b90-85c6c533c6fd" d="m54 133 54 2 12 33H65Z" fill={`url(#${id}-navy)`} stroke="#4f8acb" strokeWidth="2" strokeLinejoin="round"/>
      <circle shuku-edit-id="e-a2773ae2-d0e4-4708-833c-021b485b6fff" cx="86" cy="151" r="4" fill="#80bdff"/>
      <path shuku-edit-id="e-776a8a78-f602-4072-87a5-8c2872716dbf" d="M63 169h66" stroke="#528cc8" strokeWidth="4" strokeLinecap="round"/>
      <g shuku-edit-id="e-7351dab2-b2b0-4026-aa38-ad8b71cb3f5e" className="aip-icon-bulb">
        <path shuku-edit-id="e-57cf4bc6-bebb-4861-ace3-1313085f46a3" d="M132 30a16 16 0 0 1 32 0c0 8-8 12-9 19h-14c-1-7-9-11-9-19Z" fill={`url(#${id}-orange)`}/>
        <path shuku-edit-id="e-e7e58ba7-d306-46bb-962b-435457b996f1" d="m143 30 5 6 5-6m-5 6v13" fill="none" stroke="#fff5c5" strokeWidth="2" strokeLinecap="round"/>
        <path shuku-edit-id="e-77426825-ff83-4b22-9041-718a5be5bf3b" d="M142 52h12m-10 5h8" stroke="#688db1" strokeWidth="3" strokeLinecap="round"/>
      </g>
      <path shuku-edit-id="e-ae92bd72-ea1d-453e-b6ed-3d152333a5cf" className="aip-icon-rays" d="M148 4v-6m-26 15-5-4m7 24h-7m54-20 5-4m-4 24h7" fill="none" stroke="#f7b74e" strokeWidth="3" strokeLinecap="round"/>
    </>}
  </svg>;
}

export function PlatformLearnerIcon() {
  const id = `aip-learner-${useId().replaceAll(':', '')}`;
  return <svg shuku-edit-id="e-5bc16253-2722-49fa-afc1-82d53d0a6a5a" className="aipe-platform-learner" viewBox="0 0 160 160" aria-hidden="true">
    <defs shuku-edit-id="e-68d7cadb-34f1-4c04-be52-e5a374291517"><linearGradient shuku-edit-id="e-97fc4186-a0bc-4a68-b7c9-b8bc79f2edee" id={id} x1="0" y1="0" x2="0" y2="1"><stop shuku-edit-id="e-269807ac-d442-43f8-8678-abb20da1f536" stopColor="#acd9ff"/><stop shuku-edit-id="e-0b5fdb37-e8a1-48dd-bf2d-174024673bda" offset="1" stopColor="#5fa3eb"/></linearGradient></defs>
    <path shuku-edit-id="e-65d09545-8cd8-4879-b1b9-c8379e70ee61" d="M23 154q0-50 34-59h46q34 9 34 59" fill={`url(#${id})`}/>
    <path shuku-edit-id="e-412fb441-8fb8-49dc-a80b-2fcfb727b1e1" d="M65 79h30v24q-15 17-30 0Z" fill="#f5bf9b"/>
    <path shuku-edit-id="e-f8369d20-d136-4ace-8f0c-9d8621aca9cd" d="M54 49q3-24 31-22 32-1 32 30v15q0 25-23 25-25 0-31-28Z" fill="#ffd0ad"/>
    <path shuku-edit-id="e-2f342741-a181-434d-81ec-61ed866f7393" d="M52 72q-10-13-6-31 1-14 14-18 0-13 17-14 14 1 20-2 19-8 24 5 4 11-10 18 3 14-8 21l-10 6q-14 13-17 32H62Z" fill="#214b82"/>
    <path shuku-edit-id="e-18df382c-0774-4b45-b564-57979fe78846" d="M56 96q21 19 48 1l10 17q-34 24-68 0Z" fill="#c7e5ff" stroke="#8cc4f8" strokeWidth="2"/>
    <path shuku-edit-id="e-684d0134-9be9-4d56-a098-e1d0dbed3d09" d="M43 130v24m75-24v24" stroke="#7cb9f0" strokeWidth="2"/>
    <path shuku-edit-id="e-c30386bb-15d6-4b51-b4ca-30e8ae3008d3" d="m36 24-5-9m48-18v-9m46 28 7-9" fill="none" stroke="#8ac4fb" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
}

import { useId, type CSSProperties } from 'react';

const delay = (index: number) => ({ '--icon-delay': `${index * .2}s` } as CSSProperties);

export function PlatformCapabilityIcon({ index }: { index: number }) {
  const id = `aip-icon-${useId().replaceAll(':', '')}`;
  return <svg shuku-edit-id="e-c447b0d5-8959-41a7-a42e-41efa3df93b5" className="aipe-platform-icon" viewBox="0 0 180 180" aria-hidden="true">
    <defs shuku-edit-id="e-c55e38fe-89fe-4c39-9c1f-83453936d89e">
      <linearGradient shuku-edit-id="e-ee86ddb1-fd70-4a6f-a56b-341e39853c53" id={`${id}-blue`} x1="0" y1="0" x2=".8" y2="1"><stop shuku-edit-id="e-59303879-a696-4894-833a-dd7405c81bc5" stopColor="#6db9ff"/><stop shuku-edit-id="e-3070c7a4-bc04-4b61-91ab-dc6b67a3ab18" offset="1" stopColor="#2373db"/></linearGradient>
      <linearGradient shuku-edit-id="e-7924e1ce-2af2-45b5-9804-87cdab554429" id={`${id}-navy`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-5a216bfb-fbb0-46bd-a6bf-a18d0d2e8994" stopColor="#28528c"/><stop shuku-edit-id="e-fa5275dd-f0fe-408a-8bec-6db3cd4165e9" offset="1" stopColor="#113361"/></linearGradient>
      <linearGradient shuku-edit-id="e-ca89ef44-1251-48db-bdbb-a4af218e4637" id={`${id}-pale`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-ac2194cd-4d25-44cb-8085-5fdb8e32d88c" stopColor="#cce8ff"/><stop shuku-edit-id="e-4930ef50-9803-4de2-8949-4ac86634da8d" offset="1" stopColor="#80bbf5"/></linearGradient>
      <linearGradient shuku-edit-id="e-038761c4-3bfc-4d9d-9fda-3aca92100b2b" id={`${id}-white`} x1="0" y1="0" x2=".5" y2="1"><stop shuku-edit-id="e-b5722870-9e0c-44ca-ad17-d7bfada65dc1" stopColor="#fff"/><stop shuku-edit-id="e-fb805c03-a90a-4aa0-b549-dffeb48361aa" offset="1" stopColor="#f0f8ff"/></linearGradient>
      <linearGradient shuku-edit-id="e-a5206049-993b-4d38-8923-6a5995fc1f73" id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1"><stop shuku-edit-id="e-3c736459-051a-419c-b871-28c0e14c2aca" stopColor="#ffce60"/><stop shuku-edit-id="e-f521e29b-c6a4-4473-a02d-579340715963" offset="1" stopColor="#fa9829"/></linearGradient>
    </defs>
    {index === 0 ? <>
      <rect shuku-edit-id="e-214b7750-c785-40ea-b2bf-c11c5bafc640" x="66" y="21" width="74" height="103" rx="10" fill="#c2e1ff" transform="rotate(9 103 72)"/>
      <rect shuku-edit-id="e-66c9e152-a125-40b7-9cf7-ad469cc0a713" x="52" y="30" width="77" height="108" rx="10" fill={`url(#${id}-pale)`}/>
      <rect shuku-edit-id="e-6a10358f-6753-4afc-9dbd-23f82265bf80" x="25" y="42" width="83" height="111" rx="9" fill={`url(#${id}-white)`} stroke="#c1dfff" strokeWidth="2"/>
      <path shuku-edit-id="e-1324aaf0-c459-4cfe-8f90-ca12c4ed83f9" d="M39 61h27" stroke="#ffb447" strokeWidth="6" strokeLinecap="round"/>
      {[0, 1, 2, 3].map(i => <path shuku-edit-id="e-175928c6-464b-49cd-9027-0d597e4aac94" key={i} d={`M39 ${79 + i * 15}h${i === 3 ? 26 : 51}`} stroke="#b0d6ff" strokeWidth="5" strokeLinecap="round"/>)}
      <g shuku-edit-id="e-85ab6ae7-ced0-4f37-b404-42a27fd2c90d" className="aip-icon-lens">
        <path shuku-edit-id="e-11db949b-7b38-4135-aa0a-ad93b45d963a" d="m132 136 20 23" stroke={`url(#${id}-navy)`} strokeWidth="14" strokeLinecap="round"/>
        <circle shuku-edit-id="e-b984837f-89b1-4ff8-a42a-b43fda66a507" cx="113" cy="119" r="29" fill={`url(#${id}-blue)`} stroke="#2c76cb" strokeWidth="3"/>
        <circle shuku-edit-id="e-b69d9d90-078c-4819-aea7-4c1f78896079" cx="113" cy="119" r="20" fill="#c4e6ff" stroke="#effaff" strokeWidth="3"/>
        <path shuku-edit-id="e-521a2d40-1aa3-45aa-8610-86ce947f826f" d="M101 117q0-10 10-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
      </g>
    </> : index === 1 ? <>
      <rect shuku-edit-id="e-693e9751-2875-4a16-a065-8cc8022c2859" x="20" y="31" width="141" height="120" rx="10" fill={`url(#${id}-white)`} stroke="#bbdcff" strokeWidth="2"/>
      <path shuku-edit-id="e-a21ac444-81f6-476a-9ff1-2eb4f402f81f" d="M20 54V41q0-10 10-10h121q10 0 10 10v13Z" fill={`url(#${id}-blue)`}/>
      {['#ffc15d', '#8cddcb', '#c9e9ff'].map((color, i) => <circle shuku-edit-id="e-20cf4e9a-c0ac-4a06-9392-06d3808e9169" key={color} cx={33 + i * 12} cy="42" r="3.5" fill={color}/>)}
      {[0, 1, 2, 3].map(i => <path shuku-edit-id="e-eb7a1f35-962f-4c81-9381-59dc3ff0d1fb" key={i} d={`M34 ${72 + i * 15}h${i % 2 ? 26 : 35}`} stroke="#b5d9ff" strokeWidth="5" strokeLinecap="round"/>)}
      <path shuku-edit-id="e-fbe0dc93-3557-4fef-9bc0-7154ff6242ea" className="aip-icon-link" d="m95 105 22-30 26 29-22 29-26-28 48-1M117 75l4 58" stroke="#88bdf6" strokeWidth="3" fill="none"/>
      {[[95,105],[117,75],[143,104],[121,133]].map(([cx,cy], i) => <circle shuku-edit-id="e-fc6e1e9b-d713-454a-bc1c-0e7308be5548" key={i} className="aip-icon-node" style={delay(i)} cx={cx} cy={cy} r="10" fill={i === 2 ? `url(#${id}-orange)` : `url(#${id}-blue)`}/>)}
      <path shuku-edit-id="e-46eadaf7-47f6-4dfd-bd69-36eb6148a122" d="M38 137q13-6 26 1 13-7 26-1v23q-13-5-26 1-13-6-26-1Z" fill="#fff" stroke="#79b7f5" strokeWidth="2.5" strokeLinejoin="round"/>
      <path shuku-edit-id="e-47ae1a8b-cb5d-418f-915d-b7b80cdbbeec" d="M64 139v21" stroke="#79b7f5" strokeWidth="2"/>
    </> : index === 2 ? <>
      <rect shuku-edit-id="e-1319449f-de87-4df5-8ac5-c9bffeb887aa" x="20" y="33" width="141" height="115" rx="10" fill={`url(#${id}-white)`} stroke="#b9dbff" strokeWidth="2"/>
      <path shuku-edit-id="e-0cf564c2-bb14-4a12-a92f-14cf1adfeb3a" d="M20 57V43q0-10 10-10h121q10 0 10 10v14Z" fill={`url(#${id}-navy)`}/>
      {['#ffbf62', '#80d3cf', '#9dc9ff'].map((color, i) => <circle shuku-edit-id="e-3c7de0ec-8658-4497-909c-07caea3c1436" key={color} cx={34+i*12} cy="45" r="3.5" fill={color}/>)}
      <path shuku-edit-id="e-f3f6b81e-b5bb-4c77-9dda-cba3e471b745" className="aip-icon-code" d="m58 73-12 10 12 10m28-20 12 10-12 10M77 70l-9 27" stroke="#285b99" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {[0, 1, 2].map(i => <rect shuku-edit-id="e-be40e5bc-9b0d-492f-b283-8d400a65e529" key={i} className="aip-icon-bar" style={delay(i)} x={101+i*17} y={128-i*16} width="12" height={21+i*16} rx="4" fill={`url(#${id}-${i===2?'orange':'blue'})`}/>)}
      <path shuku-edit-id="e-668df0ee-e0da-4e07-9282-69134621988e" d="M37 110h25m-20 0v19l-13 27q-4 8 5 8h34q9 0 5-8l-15-27v-19" fill="#e8f7ff" stroke="#72b5f3" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      <path shuku-edit-id="e-a203a9fe-93de-4ab2-ac39-49a0e15f8c38" d="m37 147-5 11q-1 3 3 3h32q4 0 2-3l-6-11Z" fill={`url(#${id}-blue)`}/>
      <circle shuku-edit-id="e-d950c98e-80fe-4fdb-a9ee-235eb3054735" className="aip-icon-node" cx="50" cy="140" r="3" fill="#74bcff"/>
    </> : index === 3 ? <>
      <rect shuku-edit-id="e-c6a9269b-33b0-43f3-92d6-8c751ba7d7dd" x="20" y="35" width="141" height="119" rx="12" fill={`url(#${id}-white)`} stroke="#c0ddfc" strokeWidth="2"/>
      <circle shuku-edit-id="e-39990c22-ce8b-4af9-80eb-5f03355cc75a" cx="52" cy="65" r="20" fill={`url(#${id}-navy)`}/>
      <circle shuku-edit-id="e-3e3ab19c-6a6b-489a-a384-a496bf67068c" cx="52" cy="60" r="6" fill="#fff"/>
      <path shuku-edit-id="e-13a29a15-8aed-444f-8d51-d6e0e6ea3a5b" d="M40 77q0-12 12-12t12 12" fill="#fff"/>
      <path shuku-edit-id="e-1f00b92b-ae22-4362-943f-39836a3b981c" d="M84 55h54M84 69h39" stroke="#a8d1ff" strokeWidth="5" strokeLinecap="round"/>
      {[0, 1, 2].map(i => <g shuku-edit-id="e-70e42287-b1ea-4e88-aed8-9d26d3d5cb8e" key={i}>
        <circle shuku-edit-id="e-70caddb0-df1d-4070-916c-99f369d34dda" cx="40" cy={100+i*17} r="6.5" fill={`url(#${id}-blue)`}/>
        <path shuku-edit-id="e-039d2dd1-d555-4e8f-8bbe-80a055b52a4f" className="aip-icon-check" style={delay(i)} d={`m37 ${100+i*17} 2 2 4-5`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path shuku-edit-id="e-ba30a280-e8ac-4645-8236-4783e487bdb0" d={`M55 ${100+i*17}h${i===1?27:37}`} stroke="#b5d9ff" strokeWidth="5" strokeLinecap="round"/>
      </g>)}
      {[0, 1, 2].map(i => <rect shuku-edit-id="e-45d248f3-7402-41fa-a232-6b086ec15a2d" key={i} className="aip-icon-bar" style={delay(i)} x={106+i*14} y={126-i*11} width="10" height={15+i*11} rx="3" fill={['#7bc9d1','#67a9f9',`url(#${id}-orange)`][i]}/>)}
    </> : <>
      <path shuku-edit-id="e-b80a1f27-937b-4349-82be-1a4e1676bbd1" d="M16 158q0-46 39-46 37 0 40 46" fill={`url(#${id}-blue)`}/>
      <path shuku-edit-id="e-33da2907-78f7-485e-8a5f-541945d19c4f" d="m43 111 12 18 12-18 8 47H35Z" fill="#eef8ff"/>
      <path shuku-edit-id="e-c43b89c7-e19d-445d-aeb2-810f944e23a6" d="m53 132-4 23 7 6 6-6-6-23" fill="#2d619d"/>
      <rect shuku-edit-id="e-b6803849-61b9-45ca-8295-eb7bd49957a0" x="47" y="98" width="17" height="20" rx="6" fill="#f4bf9c"/>
      <ellipse shuku-edit-id="e-69848ad3-fa11-4603-ba75-2050361c8900" cx="55" cy="82" rx="23" ry="27" fill="#ffcfad"/>
      <path shuku-edit-id="e-1e1859f6-12b9-4f54-a6b7-1046e63df6f6" d="M31 85V69q1-25 24-23 24-2 25 23l-9 11-4-18q-13 11-27 6l-1 18Z" fill={`url(#${id}-navy)`}/>
      <path shuku-edit-id="e-6ba05539-15d0-4868-97e8-ffbb7a096d35" d="M36 81h15v10H38Zm20 0h15v10H58Zm-5 3h6" fill="none" stroke="#285587" strokeWidth="2.5" strokeLinejoin="round"/>
      <path shuku-edit-id="e-504fa877-bc66-4fb2-b648-1213b721850a" className="aip-icon-mentor" d="m79 137 19-16 3-19q1-5 5-3l2 15 5-8q3-4 5 0l-6 22-22 23Z" fill="#ffcfad"/>
      <path shuku-edit-id="e-926f729c-2213-41b2-a89b-fa05ce461205" d="M112 158q-2-36 26-36 28 0 30 36" fill={`url(#${id}-pale)`}/>
      <rect shuku-edit-id="e-f38b5580-cdae-453b-aa35-5abba15d470f" x="131" y="112" width="13" height="14" rx="5" fill="#f3bb97"/>
      <ellipse shuku-edit-id="e-6ec5e4ac-854d-48df-9eb1-7be3b175c092" cx="138" cy="101" rx="19" ry="22" fill="#ffcfad"/>
      <path shuku-edit-id="e-c4e0e0b4-4252-4ef5-8510-ae50be3d7882" d="M118 102V88q0-16 20-16 23-1 22 19l-9 11-4-15q-9 9-22 5v13Z" fill={`url(#${id}-navy)`}/>
      <path shuku-edit-id="e-aea1fe05-40e8-492e-bdc6-c94170f6c963" d="m54 133 54 2 12 33H65Z" fill={`url(#${id}-navy)`} stroke="#4f8acb" strokeWidth="2" strokeLinejoin="round"/>
      <circle shuku-edit-id="e-b8572da8-14a2-481a-a518-651dba8f5dd1" cx="86" cy="151" r="4" fill="#80bdff"/>
      <path shuku-edit-id="e-fbe22f8a-7850-43ee-939e-e0fbb013a5bc" d="M63 169h66" stroke="#528cc8" strokeWidth="4" strokeLinecap="round"/>
      <g shuku-edit-id="e-ab9b1f99-058d-465e-91a3-5f34478ee37b" className="aip-icon-bulb">
        <path shuku-edit-id="e-4364f6a6-0ca9-409d-a121-434e7c008d19" d="M132 30a16 16 0 0 1 32 0c0 8-8 12-9 19h-14c-1-7-9-11-9-19Z" fill={`url(#${id}-orange)`}/>
        <path shuku-edit-id="e-204810a5-dd7a-49d2-bfe9-c6d946a14a02" d="m143 30 5 6 5-6m-5 6v13" fill="none" stroke="#fff5c5" strokeWidth="2" strokeLinecap="round"/>
        <path shuku-edit-id="e-4d2b6e6c-4a74-4590-aaad-0e4f23ee8667" d="M142 52h12m-10 5h8" stroke="#688db1" strokeWidth="3" strokeLinecap="round"/>
      </g>
      <path shuku-edit-id="e-40ca455e-d736-4e85-813b-3ee75fdc7b6d" className="aip-icon-rays" d="M148 4v-6m-26 15-5-4m7 24h-7m54-20 5-4m-4 24h7" fill="none" stroke="#f7b74e" strokeWidth="3" strokeLinecap="round"/>
    </>}
  </svg>;
}

export function PlatformLearnerIcon() {
  const id = `aip-learner-${useId().replaceAll(':', '')}`;
  return <svg shuku-edit-id="e-cdd9acf1-b174-411c-8788-fae2b485112b" className="aipe-platform-learner" viewBox="0 0 160 160" aria-hidden="true">
    <defs shuku-edit-id="e-033a9872-28c9-463d-b95f-252742c7e7e4"><linearGradient shuku-edit-id="e-effc2900-0861-432e-8fee-049ba909bcd4" id={id} x1="0" y1="0" x2="0" y2="1"><stop shuku-edit-id="e-70b74de4-577f-4cb0-a8a7-977e21b41a35" stopColor="#acd9ff"/><stop shuku-edit-id="e-c3c57bc3-d7ab-425d-82f3-6364c83952f1" offset="1" stopColor="#5fa3eb"/></linearGradient></defs>
    <path shuku-edit-id="e-c7094b2d-0fc1-4914-b905-3302f99a96a2" d="M23 154q0-50 34-59h46q34 9 34 59" fill={`url(#${id})`}/>
    <path shuku-edit-id="e-ea13808e-4935-469e-bb6c-571e5121ec72" d="M65 79h30v24q-15 17-30 0Z" fill="#f5bf9b"/>
    <path shuku-edit-id="e-cbe92049-7b0b-402d-9434-f29cf1efa691" d="M54 49q3-24 31-22 32-1 32 30v15q0 25-23 25-25 0-31-28Z" fill="#ffd0ad"/>
    <path shuku-edit-id="e-0db8cc4c-9095-417c-8107-ef2da7cd9d90" d="M52 72q-10-13-6-31 1-14 14-18 0-13 17-14 14 1 20-2 19-8 24 5 4 11-10 18 3 14-8 21l-10 6q-14 13-17 32H62Z" fill="#214b82"/>
    <path shuku-edit-id="e-b69a7fe8-3a4c-4f6c-93b1-25c9e7d4de97" d="M56 96q21 19 48 1l10 17q-34 24-68 0Z" fill="#c7e5ff" stroke="#8cc4f8" strokeWidth="2"/>
    <path shuku-edit-id="e-e1ba21c4-0466-49b2-b609-e8d88f99689f" d="M43 130v24m75-24v24" stroke="#7cb9f0" strokeWidth="2"/>
    <path shuku-edit-id="e-aade95ff-b2c9-4d0c-8bd3-3d6f6f09bc5b" d="m36 24-5-9m48-18v-9m46 28 7-9" fill="none" stroke="#8ac4fb" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
}

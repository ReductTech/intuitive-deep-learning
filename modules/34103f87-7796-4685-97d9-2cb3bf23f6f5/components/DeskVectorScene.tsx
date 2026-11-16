import { useId } from 'react';

/** Two views of the same shop in Xiao Ming's story; only the shelf stock changes. */
export function DeskVectorScene({ roundTwo = false }: { roundTwo?: boolean }) {
  const id = useId();
  const wallId = `attention-shop-wall-${id}`;
  const shadowId = `attention-shop-shadow-${id}`;
  const bottleCount = roundTwo ? 3 : 2;
  return <svg shuku-edit-id="e-deb6fe10-a705-4f06-9c98-26d600bd3f2c" className="attn-desk-vector" viewBox="0 0 820 440" role="img"
    aria-label={`小明走进商店，货架上有 ${bottleCount} 瓶蓝色冰水，旁边还有果汁和水果。`}>
    <defs shuku-edit-id="e-7349fc2d-f03c-4fd8-9051-9987c2ea8fa4">
      <linearGradient shuku-edit-id="e-7465b553-2649-4760-bda4-cc505d92688f" id={wallId} x1="0" y1="0" x2="0" y2="1"><stop shuku-edit-id="e-397f88b3-13a2-4d0a-a5bf-6bcb91b6a133" offset="0" stopColor="#e8f4ff"/><stop shuku-edit-id="e-1db15ae9-804d-4065-8780-da37803275f3" offset="1" stopColor="#f8fbff"/></linearGradient>
      <filter shuku-edit-id="e-ec6056cb-0eb5-4404-91b2-c57f0ecca2c7" id={shadowId}><feDropShadow shuku-edit-id="e-fca2497a-7d05-41b4-911b-a4d0ea0a51ec" dx="0" dy="6" stdDeviation="6" floodColor="#31506f" floodOpacity=".15"/></filter>
    </defs>
    <rect shuku-edit-id="e-a3834849-8f15-4ce4-9321-788405cab3d1" width="820" height="440" rx="24" fill={`url(#${wallId})`}/>
    <rect shuku-edit-id="e-0d68b1e2-e941-4290-9118-46e122b05653" x="0" y="352" width="820" height="88" fill="#e7d6bd"/>
    <path shuku-edit-id="e-1bed75e2-78f1-471d-9f97-82c70eb096f0" d="M0 352H820" stroke="#c5ac89" strokeWidth="6"/>
    <rect shuku-edit-id="e-3c455cc2-6a67-46e8-8677-48ebef973793" x="238" y="112" width="542" height="20" rx="7" fill="#8bafc5"/>
    <rect shuku-edit-id="e-49dcaf02-4f11-412b-8f7c-51fa6b117892" x="238" y="283" width="542" height="20" rx="7" fill="#8bafc5"/>
    <rect shuku-edit-id="e-62b5392b-e2b5-48e1-acb8-f0be62234e75" x="253" y="132" width="511" height="150" fill="#f1f8fc"/>
    <g shuku-edit-id="e-e23a0e10-8519-46b7-8ab0-bef78e36937d" filter={`url(#${shadowId})`}>
      {Array.from({ length: bottleCount }, (_, index) => <g shuku-edit-id="e-c5723122-658e-4a75-8c25-cf2b8b3f7b3d" key={index} transform={`translate(${292 + index * 105} 149)`}>
        <rect shuku-edit-id="e-a60a8da8-9363-4db4-a67d-c860747d097a" x="26" y="0" width="35" height="16" rx="4" fill="#1f6bb5"/>
        <path shuku-edit-id="e-1a126173-093a-4ece-a349-d9bf44526b3f" d="M25 15H62L72 35V119Q72 130 60 130H27Q15 130 15 119V35Z" fill="#69c8ec" stroke="#2078b8" strokeWidth="4"/>
        <path shuku-edit-id="e-ee35e5a9-5091-4735-a927-12ae596a5043" d="M17 65H70V103H17Z" fill="#d8f6ff"/>
        <path shuku-edit-id="e-4ac2b0b1-72cf-4908-83e6-49895344735e" d="M28 75H59M34 86H54" stroke="#74bad6" strokeWidth="5" strokeLinecap="round"/>
      </g>)}
      <g shuku-edit-id="e-dd917239-2fe8-4044-8997-7d4ed14087a8" transform={`translate(${roundTwo ? 645 : 555} 184)`}>
        <rect shuku-edit-id="e-655d2eed-4528-4543-860f-51f03c173f6d" x="0" y="0" width="62" height="95" rx="8" fill="#f6a553" stroke="#cb7840" strokeWidth="4"/>
        <path shuku-edit-id="e-89bad277-a241-4c8d-aa00-9c18561a49c3" d="M12 18H50M13 68H49" stroke="#fff1d7" strokeWidth="6"/>
      </g>
      <g shuku-edit-id="e-7f153f32-e614-488f-b189-806304f9574f" transform="translate(673 319)"><circle shuku-edit-id="e-bfabf31c-6671-4a04-b881-09e949a15390" cx="0" cy="0" r="26" fill="#ed7562"/><circle shuku-edit-id="e-c1abd477-6166-42c8-8beb-09e755060c51" cx="51" cy="2" r="25" fill="#f4ca5c"/><path shuku-edit-id="e-440c396c-36bb-48a7-9619-a9b420f0de1c" d="M-5-26q10-13 20-6" fill="none" stroke="#65a66e" strokeWidth="7"/></g>
    </g>
    <g shuku-edit-id="e-ddb5918d-840f-4a88-88ae-936ae6d9164d" transform="translate(125 155)" filter={`url(#${shadowId})`}>
      <circle shuku-edit-id="e-8cce6e7e-babf-4562-a84e-69fa23b1de7b" cx="0" cy="0" r="37" fill="#f4c49a"/>
      <path shuku-edit-id="e-2e8fa156-1ffa-4270-8fac-14410212711c" d="M-34-8q-4-50 36-48 35 0 37 39-25-14-56-6Z" fill="#273e58"/>
      <path shuku-edit-id="e-a5828cac-236d-4892-94a6-67d2e8bfa715" d="M-39 58Q0 34 39 58L51 160H-51Z" fill="#e7755d"/>
      <path shuku-edit-id="e-1d37a313-0930-4039-98a7-4a82986f1f79" d="M27 80Q87 76 110 119" fill="none" stroke="#f4c49a" strokeWidth="19" strokeLinecap="round"/>
      <path shuku-edit-id="e-62cfbbb5-2bd8-497f-9756-cf6c4e2cbf6c" d="M-20 161L-31 206M23 161L34 206" stroke="#355474" strokeWidth="24" strokeLinecap="round"/>
    </g>
  </svg>;
}

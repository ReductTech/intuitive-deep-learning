import type { ReactNode } from 'react';
import './DishIcon.css';

export type DishId = 'pie' | 'steak' | 'burger';

export interface DishIconProps {
  dish: DishId;
  label?: string;
  className?: string;
}

const realisticShapes: Record<DishId, ReactNode> = {
  pie: (
    <>
      <defs shuku-edit-id="e-3b5fe37a-3ae7-4b20-9395-cbadf79a9bc6">
        {/* 盘底与地面柔和投影 */}
        <radialGradient shuku-edit-id="e-4e15a8df-090e-464f-ba25-7d5049b181a1" id="pieDropShadow" cx="50%" cy="50%" r="50%">
          <stop shuku-edit-id="e-50cd270a-f782-4231-a365-cb14d83f8994" offset="0%" stopColor="#0f172a" stopOpacity="0.28" />
          <stop shuku-edit-id="e-606f2998-18d7-4bf6-83be-ccb8fc1a8bc8" offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        {/* 银亮金属烘焙烤盘 */}
        <linearGradient shuku-edit-id="e-97f788dd-e6fe-4202-a3e2-904dd1eca898" id="piePanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop shuku-edit-id="e-aa6b4c8f-8ae7-4be5-b7f6-45dca816394d" offset="0%" stopColor="#ffffff" />
          <stop shuku-edit-id="e-43a0b0c2-1ca1-42cd-a3e0-5159f2d83532" offset="35%" stopColor="#e2e8f0" />
          <stop shuku-edit-id="e-24cb3e90-7d2f-44e0-a99d-b7838ea36025" offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        {/* 金黄烘烤千层酥皮 */}
        <linearGradient shuku-edit-id="e-f1accae8-316a-420d-997b-f216bde378d5" id="crustGoldenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop shuku-edit-id="e-74a1924c-b084-47fe-8909-91da53b24aff" offset="0%" stopColor="#fef08a" />
          <stop shuku-edit-id="e-05a498e8-b955-4cb8-af03-e8fe830dd6a8" offset="25%" stopColor="#f59e0b" />
          <stop shuku-edit-id="e-c2f49819-5f25-47a8-9a4e-45507af99adb" offset="80%" stopColor="#d97706" />
          <stop shuku-edit-id="e-483b8265-826e-4950-a661-b3e1bcfc8e3a" offset="100%" stopColor="#92400e" />
        </linearGradient>
        {/* 编织起酥皮条立体光影 */}
        <linearGradient shuku-edit-id="e-74e2111b-ee13-46d0-9cf3-661679fc5556" id="pieLatticeStrip" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop shuku-edit-id="e-6f8d2cd1-146d-4523-b66a-661eca95ad64" offset="0%" stopColor="#fef3c7" />
          <stop shuku-edit-id="e-0e03ede8-13cc-4fa4-9f87-57d634cac7d9" offset="40%" stopColor="#f59e0b" />
          <stop shuku-edit-id="e-f1b0c1cb-23e9-433c-a8bf-e9b140fcd4a5" offset="100%" stopColor="#78350f" />
        </linearGradient>
        {/* 苹果肉与肉桂焦糖馅心 */}
        <radialGradient shuku-edit-id="e-1f274a57-026c-434a-ab24-67030c41c8e1" id="appleJamFill" cx="45%" cy="40%" r="60%">
          <stop shuku-edit-id="e-fd04beb1-a739-4d21-a955-28568bab4469" offset="0%" stopColor="#ef4444" />
          <stop shuku-edit-id="e-15609f07-475c-4740-874c-c5e2c1a907ca" offset="55%" stopColor="#991b1b" />
          <stop shuku-edit-id="e-0a81f6d8-4c88-4058-a6bf-04afb53b543f" offset="100%" stopColor="#450a0a" />
        </radialGradient>
        {/* 鲜红小苹果高光渐变 */}
        <radialGradient shuku-edit-id="e-f37ae2af-c3ce-4fff-bdd8-0b75db75bcf6" id="miniAppleGrad" cx="35%" cy="30%" r="65%">
          <stop shuku-edit-id="e-330878e1-4352-491d-9ef6-ac43212fc6f5" offset="0%" stopColor="#fca5a5" />
          <stop shuku-edit-id="e-622f895b-16f8-4dbf-8926-5822eb31a53c" offset="30%" stopColor="#ef4444" />
          <stop shuku-edit-id="e-64d04a9e-1542-421a-9847-695302f9846a" offset="85%" stopColor="#b91c1c" />
          <stop shuku-edit-id="e-febc0f20-1df7-44de-bb5b-8d459734a0a8" offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>

      {/* 底部接触阴影 */}
      <ellipse shuku-edit-id="e-463dcafc-5b35-4a3f-a079-a5984c06e09c" cx="50" cy="88" rx="45" ry="9" fill="url(#pieDropShadow)" />

      {/* 金属烤盘边缘与底托 */}
      <ellipse shuku-edit-id="e-81c7dc43-2100-4f72-b366-cfd9348f74fb" cx="50" cy="74" rx="46" ry="13" fill="url(#piePanGrad)" />
      <ellipse shuku-edit-id="e-a0a2a80a-2c7c-4b7b-8b0f-99b866c507c7" cx="50" cy="72" rx="43" ry="11" fill="#f8fafc" />
      <path shuku-edit-id="e-7b10e6ee-cdc0-4e4c-bc96-cc6bcdf7ff4f" d="M 8 72 C 8 82 24 88 50 88 C 76 88 92 82 92 72 L 89 64 C 89 74 72 80 50 80 C 28 80 11 74 11 64 Z" fill="#94a3b8" />

      {/* 焦糖苹果馅心底盘 */}
      <ellipse shuku-edit-id="e-cef77075-0e04-412e-a49e-8ee42c0758a4" cx="50" cy="55" rx="38" ry="22" fill="url(#appleJamFill)" />

      {/* 经典十字交叉编织酥皮条（粗壮清晰，小尺寸也极显眼） */}
      <g shuku-edit-id="e-9f7432dc-88fc-4cdc-9982-6380d00c4075" stroke="url(#pieLatticeStrip)" strokeWidth="5.5" strokeLinecap="round">
        <path shuku-edit-id="e-7ef644fd-1921-4557-8c9c-701375d41d0a" d="M 22 47 Q 44 34 74 61" />
        <path shuku-edit-id="e-ba1d1afb-93af-4d9a-8abb-28b3eaba6c57" d="M 26 59 Q 52 44 80 54" />
        <path shuku-edit-id="e-97d1fcf0-923d-49c6-a981-bcf1459266ef" d="M 36 68 Q 62 52 78 45" />
        <path shuku-edit-id="e-883caf12-d64b-41a7-a584-e06217d07a1d" d="M 24 57 Q 50 68 76 46" />
        <path shuku-edit-id="e-6992db80-0447-4447-bc58-9123f9786533" d="M 33 44 Q 54 62 72 65" />
        <path shuku-edit-id="e-d1695702-23f3-478d-b5c4-87982cdf2b39" d="M 44 38 Q 66 56 68 71" />
      </g>

      {/* 酥脆起酥波浪花边滚边（烘焙体积感） */}
      <path shuku-edit-id="e-ed14c016-2d54-4107-be46-6f5ecb16ec87"
        d="M 8 57 C 8 36 26 21 50 21 C 74 21 92 36 92 57 C 90 68 74 75 50 75 C 26 75 10 68 8 57 Z"
        fill="none"
        stroke="url(#crustGoldenGrad)"
        strokeWidth="6.5"
      />
      {/* 花边酥皮结节 */}
      <g shuku-edit-id="e-dae86dca-7c8e-4ef6-b5c0-daf33d2aff4d" fill="url(#crustGoldenGrad)">
        <circle shuku-edit-id="e-892617d4-c4ba-4b59-b524-97705eeb464e" cx="12" cy="54" r="4.5" />
        <circle shuku-edit-id="e-55824d77-2548-415d-8066-11069fd8d5cd" cx="21" cy="63" r="4.8" />
        <circle shuku-edit-id="e-ff81994c-eb41-4248-a736-f71c25d3e57f" cx="34" cy="69" r="5" />
        <circle shuku-edit-id="e-5e07f233-91d6-4eda-9e61-f7d8a5b0319b" cx="50" cy="72" r="5.2" />
        <circle shuku-edit-id="e-70cd420b-794a-4539-aa18-1880852d4a67" cx="66" cy="69" r="5" />
        <circle shuku-edit-id="e-5d35377d-f93f-453c-b46f-3ae41e6fb626" cx="79" cy="63" r="4.8" />
        <circle shuku-edit-id="e-3d3ada1b-73ed-4156-8ce0-4aa86343ff31" cx="88" cy="54" r="4.5" />
      </g>

      {/* 核心辨识标志：正上方一颗鲜嫩诱人、带叶子的红苹果徽章！ */}
      <g shuku-edit-id="e-45364fe3-c856-4c81-a9b7-81d50d116f90" transform="translate(42, 34)">
        {/* 绿叶 */}
        <path shuku-edit-id="e-50e09b13-9737-41dc-8177-5a73e486d7b6" d="M 9 3 Q 16 0 17 6 Q 12 9 9 3 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
        {/* 果梗 */}
        <path shuku-edit-id="e-401459c6-48d3-4f28-a799-33baf9eac06c" d="M 8 7 Q 8 2 10 0" fill="none" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
        {/* 红苹果身 */}
        <path shuku-edit-id="e-3eaacc3e-f6bc-477c-b574-dc49b4b7923b"
          d="M 8 6 C 5 3 0 5 0 11 C 0 16 4 19 8 18 C 12 19 16 16 16 11 C 16 5 11 3 8 6 Z"
          fill="url(#miniAppleGrad)"
          stroke="#7f1d1d"
          strokeWidth="0.8"
        />
        {/* 苹果高光 */}
        <ellipse shuku-edit-id="e-78856ea0-baf8-471e-88f7-8332cca95fab" cx="4" cy="9" rx="1.5" ry="3" fill="#ffffff" opacity="0.65" transform="rotate(-25 4 9)" />
      </g>
    </>
  ),

  steak: (
    <>
      <defs shuku-edit-id="e-f169b619-a20f-4337-b180-98541f3529c9">
        {/* 大白瓷盘渐变 */}
        <linearGradient shuku-edit-id="e-e17adb59-93df-4e62-8453-f5f1f0940320" id="steakPlateReflect" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop shuku-edit-id="e-dc26c275-25fb-4082-a638-399cd1bcc20e" offset="0%" stopColor="#ffffff" />
          <stop shuku-edit-id="e-3474e41a-e3f4-4909-9d01-d7680ff559f5" offset="35%" stopColor="#f8fafc" />
          <stop shuku-edit-id="e-da7ad484-db75-4047-b8dc-70584e657ab0" offset="70%" stopColor="#e2e8f0" />
          <stop shuku-edit-id="e-dcdbfeb1-24dc-4334-91eb-0bf5f8f3a4b9" offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        {/* 炭火美拉德深厚熟成肉色 */}
        <radialGradient shuku-edit-id="e-15fbea23-24d3-412d-8e5f-4ecaa42aa3d4" id="steakMeatSurface" cx="45%" cy="38%" r="60%">
          <stop shuku-edit-id="e-6cf2b1f8-c9d6-445e-b411-e1cc28ee2d82" offset="0%" stopColor="#9a3412" />
          <stop shuku-edit-id="e-5bcb1f1f-dab9-4344-bd77-f76f55b73549" offset="35%" stopColor="#7c2d12" />
          <stop shuku-edit-id="e-283a5bdd-0bb9-4181-9815-d7c61a076a05" offset="70%" stopColor="#431407" />
          <stop shuku-edit-id="e-9a608c79-e218-47eb-947d-03f2f35693d8" offset="100%" stopColor="#1a0602" />
        </radialGradient>
        {/* 切面厚度与鲜嫩粉红肉汁（五分熟 Medium Rare） */}
        <linearGradient shuku-edit-id="e-da3876b3-a80e-4ab9-86bc-0fc0034d94f2" id="rareMeatCut" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop shuku-edit-id="e-aab4cf1b-ce82-4b21-9c0f-12bd64d7075a" offset="0%" stopColor="#f43f5e" />
          <stop shuku-edit-id="e-e4e97e13-53e5-49d6-be9c-ebdf1f28a22d" offset="35%" stopColor="#be123c" />
          <stop shuku-edit-id="e-a522a600-f9f0-4862-9595-87fb9b605a81" offset="70%" stopColor="#881337" />
          <stop shuku-edit-id="e-8213af44-3c97-4ab3-b6f7-d0fe63f45233" offset="100%" stopColor="#2b0805" />
        </linearGradient>
        {/* 骨头立体高光 */}
        <linearGradient shuku-edit-id="e-2c759728-274f-4059-8bef-202a64bdc3be" id="boneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop shuku-edit-id="e-02c050e2-affd-42db-957a-9d67d103df7e" offset="0%" stopColor="#ffffff" />
          <stop shuku-edit-id="e-5598eda3-80fe-4d22-8c6d-7a0c48ca45fd" offset="50%" stopColor="#f1f5f9" />
          <stop shuku-edit-id="e-8d100dc1-b570-4017-b8f9-e2196ad31e53" offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        {/* 融化黄油金光 */}
        <linearGradient shuku-edit-id="e-19fc964b-0c91-4329-b1e0-cbc0a6451673" id="meltingButter" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop shuku-edit-id="e-a1f66d56-765a-43e3-bb7d-2bdd01bc69f4" offset="0%" stopColor="#fef08a" />
          <stop shuku-edit-id="e-13314693-ecf1-4c3d-a0c3-8fcada60d770" offset="60%" stopColor="#f59e0b" />
          <stop shuku-edit-id="e-e2a10918-9dba-4f59-9761-56b5941ea889" offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* 底部阴影 */}
      <ellipse shuku-edit-id="e-9db94183-2b38-4ea2-b6f3-226a216cdd91" cx="50" cy="88" rx="46" ry="10" fill="#0f172a" opacity="0.25" />

      {/* 高端椭圆大白西餐盘 */}
      <ellipse shuku-edit-id="e-72502512-e40f-4f57-bd71-6e739db93d1a" cx="50" cy="66" rx="47" ry="24" fill="url(#steakPlateReflect)" />
      <ellipse shuku-edit-id="e-103ada44-a239-4948-a1af-1d244f214dae" cx="50" cy="65" rx="43" ry="21" fill="#f8fafc" />
      <ellipse shuku-edit-id="e-c51fa1d2-3e87-4c5b-9dd1-05c1aca5a8cd" cx="50" cy="64" rx="37" ry="17" fill="#e2e8f0" opacity="0.6" />

      {/* 3D 鲜嫩厚肉侧面（展示出厚切五分熟质感） */}
      <path shuku-edit-id="e-5e500fde-ae13-4780-919f-b495501ec7e8"
        d="M 16 52 C 14 69 28 80 54 81 C 77 82 89 71 87 56 L 86 49 C 86 64 73 73 50 72 C 25 71 16 62 17 48 Z"
        fill="url(#rareMeatCut)"
      />

      {/* 经典带骨战斧/T骨形态牛排肉身 */}
      <path shuku-edit-id="e-fd078c4e-dfb2-42cc-a291-abe61764d420"
        d="M 28 34 C 18 30 14 44 17 56 C 20 68 34 73 53 72 C 72 71 86 63 85 49 C 84 32 66 22 48 24 C 38 25 34 30 28 34 Z"
        fill="url(#steakMeatSurface)"
      />

      {/* 核心辨识标志 1：左上方洁白醒目的圆截面带骨牛排大骨头 (Bone)！ */}
      <g shuku-edit-id="e-adff1b01-d6f3-4b62-a847-030512d693e5">
        {/* 骨头突起阴影与骨体 */}
        <path shuku-edit-id="e-552a49b9-1f61-48bf-86b9-20627ba872c2" d="M 24 30 L 16 23 C 14 21 16 17 19 18 L 29 26 Z" fill="#94a3b8" />
        <path shuku-edit-id="e-1ffe24d6-7f48-465e-9883-c9243dac09ef" d="M 23 29 L 15 22 C 12 19 14 14 18 16 L 28 25 Z" fill="url(#boneGrad)" stroke="#64748b" strokeWidth="1" />
        {/* 骨头圆润截面与骨髓孔 */}
        <ellipse shuku-edit-id="e-692007d0-7645-4c83-a4ff-8300d15d6a48" cx="16" cy="19" rx="4.5" ry="3.5" fill="#f8fafc" stroke="#64748b" strokeWidth="1" transform="rotate(-30 16 19)" />
        <ellipse shuku-edit-id="e-a3f63c03-8e0e-425c-9c97-a4e44f03096d" cx="16" cy="19" rx="1.8" ry="1.2" fill="#cbd5e1" transform="rotate(-30 16 19)" />
      </g>

      {/* 核心辨识标志 2：极粗黑、极其醒目的菱形炭烤十字网纹 (Char Grill Marks) */}
      <g shuku-edit-id="e-36be8719-eacc-4f75-a401-0b8ccc466a40" stroke="#140502" strokeWidth="4.2" strokeLinecap="round" opacity="0.95">
        <path shuku-edit-id="e-8fc0adc1-cb64-4702-b2ea-4163a1c7acf4" d="M 32 38 L 48 64" />
        <path shuku-edit-id="e-7d92d6ff-a32e-4f41-ba8a-ade5bbe5f8ed" d="M 45 32 L 64 58" />
        <path shuku-edit-id="e-8ccacbcb-a36d-4ab4-8877-4c089c16d235" d="M 59 34 L 75 52" />
        <path shuku-edit-id="e-e05e06af-b91e-417d-8780-fbd6a2dfbdea" d="M 33 55 L 56 31" />
        <path shuku-edit-id="e-0bcc0771-47df-46f0-9ee3-81651e788e77" d="M 45 64 L 70 36" />
      </g>

      {/* 油亮饱满的肉汁高光 */}
      <ellipse shuku-edit-id="e-57a3cc79-3ea6-4de7-b8f2-b2d917ba2e4d" cx="43" cy="40" rx="7" ry="2.8" fill="#ffffff" opacity="0.35" transform="rotate(-15 43 40)" />
      <ellipse shuku-edit-id="e-dd1cd89d-cfed-4b1e-9d4d-5a4757eac0d3" cx="64" cy="48" rx="6" ry="2.2" fill="#ffffff" opacity="0.3" transform="rotate(10 64 48)" />

      {/* 顶上一块融化的高级蒜香黄油方块 */}
      <rect shuku-edit-id="e-e3534453-fd8f-437e-b8f9-898be3ace250" x="44" y="38" width="11" height="8" rx="2.5" fill="url(#meltingButter)" transform="rotate(-10 49 42)" stroke="#b45309" strokeWidth="0.8" />
      <path shuku-edit-id="e-594c3bdd-0e9c-4fcc-b361-85897c3b15ee" d="M 40 45 Q 49 48 60 43" stroke="#fef08a" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.85" />

      {/* 新鲜迷迭香香草枝 */}
      <path shuku-edit-id="e-7dc65f29-c0b2-4d3a-a46f-5b613b846473" d="M 56 33 Q 66 31 75 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
      <ellipse shuku-edit-id="e-cfa28373-c872-44d8-af14-78800898ef36" cx="62" cy="30" rx="3" ry="1.4" fill="#22c55e" transform="rotate(25 62 30)" />
      <ellipse shuku-edit-id="e-6f12bba0-c4b4-431f-b11e-d0f3b3b3d903" cx="69" cy="27" rx="3" ry="1.4" fill="#22c55e" transform="rotate(-20 69 27)" />
      <ellipse shuku-edit-id="e-1a18b779-1014-4497-9378-4f996c10aa0b" cx="74" cy="24" rx="2.5" ry="1.2" fill="#4ade80" />
    </>
  ),

  burger: (
    <>
      <defs shuku-edit-id="e-3bf7cb77-b719-414f-8525-957332f59e06">
        {/* 面包胚圆顶金黄烘焙高光渐变 */}
        <radialGradient shuku-edit-id="e-86e98581-b53c-4f95-9094-dcb3310c2c15" id="bunTopRealistic" cx="45%" cy="30%" r="65%">
          <stop shuku-edit-id="e-ce07212e-9352-4202-8230-e716be343581" offset="0%" stopColor="#fef3c7" />
          <stop shuku-edit-id="e-c14ed646-0be8-4a49-99e6-ef5265087ac7" offset="25%" stopColor="#f59e0b" />
          <stop shuku-edit-id="e-c261f605-b2b5-4d1f-8982-9228c77e3b96" offset="85%" stopColor="#b45309" />
          <stop shuku-edit-id="e-3358c55b-7a55-456e-898d-07db1d3fa9f9" offset="100%" stopColor="#78350f" />
        </radialGradient>
        <linearGradient shuku-edit-id="e-f90e9fcf-f30c-4aa2-864c-89c66e2cf56f" id="bunBottomRealistic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop shuku-edit-id="e-1ad7c13e-3362-442a-9748-8c13baeabe12" offset="0%" stopColor="#f59e0b" />
          <stop shuku-edit-id="e-67bae0b0-75cd-4779-bbe5-b20c5e0e013d" offset="60%" stopColor="#d97706" />
          <stop shuku-edit-id="e-811c74d3-a585-4415-971b-129eef77cd47" offset="100%" stopColor="#78350f" />
        </linearGradient>
        {/* 纯牛肉饼美拉德焦香渐变 */}
        <linearGradient shuku-edit-id="e-6f45a7b1-f9c1-4070-8d2c-ddc0daf8ec9e" id="burgerPattyRealistic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop shuku-edit-id="e-e34f8da9-356d-4153-825b-40fe4703028a" offset="0%" stopColor="#451a03" />
          <stop shuku-edit-id="e-3acfa2db-55da-48a1-bcaa-8164d726da00" offset="40%" stopColor="#78350f" />
          <stop shuku-edit-id="e-efd620dd-c272-41d1-a10f-d89e7183e83a" offset="100%" stopColor="#290e03" />
        </linearGradient>
        {/* 切达芝士流心热溶感 */}
        <linearGradient shuku-edit-id="e-0c1e9560-4cbe-4530-ad19-da7a87392f36" id="cheeseMeltRealistic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop shuku-edit-id="e-56f23e04-68b9-4076-98f6-777f386a75c3" offset="0%" stopColor="#fef08a" />
          <stop shuku-edit-id="e-bb4f496d-378a-4265-a9e0-a2e460a205cd" offset="50%" stopColor="#eab308" />
          <stop shuku-edit-id="e-57a74541-4635-4999-bf12-c054232484f9" offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        {/* 新鲜双层番茄切片 */}
        <linearGradient shuku-edit-id="e-86cfe186-0f08-4fa6-bf79-6721a3b60971" id="tomatoSliceRealistic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop shuku-edit-id="e-3d84a81f-8d75-43bd-89bf-3bb095afd3a9" offset="0%" stopColor="#ef4444" />
          <stop shuku-edit-id="e-d6c5b501-2648-4480-bca8-4778b035247a" offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {/* 底部接触阴影 */}
      <ellipse shuku-edit-id="e-05de0e0c-667e-4d6c-bbdc-64c3813ca5e5" cx="50" cy="89" rx="44" ry="8" fill="#0f172a" opacity="0.25" />

      {/* 底层厚面包胚 */}
      <path shuku-edit-id="e-c79aa6ed-0c7d-40ad-9193-e45556aec079"
        d="M 15 76 C 15 73 24 72 50 72 C 76 72 85 73 85 76 C 85 83 73 88 50 88 C 27 88 15 83 15 76 Z"
        fill="url(#bunBottomRealistic)"
      />

      {/* 多汁厚煎纯牛肉饼 */}
      <path shuku-edit-id="e-92af76f8-0b55-42d3-859c-17b65c0ea84a"
        d="M 12 66 C 12 63 23 62 50 62 C 77 62 88 63 88 66 C 89 72 79 77 50 77 C 21 77 11 72 12 66 Z"
        fill="url(#burgerPattyRealistic)"
      />
      <ellipse shuku-edit-id="e-dcbd323f-5290-417d-8181-a9ef1d090112" cx="32" cy="70" rx="2" ry="1" fill="#1c0a02" />
      <ellipse shuku-edit-id="e-32ca8888-6588-4c81-bce2-bc1aad2a8f11" cx="55" cy="72" rx="2" ry="1" fill="#1c0a02" />
      <ellipse shuku-edit-id="e-b05960fc-d623-4b93-8de4-f1fe419c98c0" cx="72" cy="68" rx="2" ry="1" fill="#1c0a02" />

      {/* 熔化切达芝士层（自然垂落滴坠） */}
      <path shuku-edit-id="e-b2b9273e-e9ca-485c-a1d9-20d6317cc751"
        d="M 14 62 L 86 62 L 84 67 L 76 73 L 67 66 L 56 75 L 46 66 L 35 74 L 25 65 L 17 71 Z"
        fill="url(#cheeseMeltRealistic)"
      />

      {/* 双层红亮番茄片 */}
      <path shuku-edit-id="e-9a913701-7573-41ad-81a2-45fd8842b2a2" d="M 15 56 C 15 53 27 52 50 52 C 73 52 85 53 85 56 C 85 59 73 61 50 61 C 27 61 15 59 15 56 Z" fill="url(#tomatoSliceRealistic)" />
      <ellipse shuku-edit-id="e-bc274ab2-c660-40bb-96f2-e89514bab51e" cx="38" cy="55" rx="8" ry="1.6" fill="#fca5a5" opacity="0.6" />

      {/* 褶皱波浪翠绿爽脆生菜 */}
      <path shuku-edit-id="e-3441d317-5e19-4873-9730-674f57778bb2"
        d="M 10 52 Q 18 56 26 51 Q 35 57 45 52 Q 56 58 67 51 Q 78 57 90 51 C 91 54 85 57 76 57 Q 64 59 52 56 Q 41 60 30 56 Q 19 59 10 52 Z"
        fill="#22c55e"
      />
      <path shuku-edit-id="e-f3753dcf-2260-4609-9450-a7bd30c293fa"
        d="M 13 52 Q 22 56 31 52 Q 43 57 55 52 Q 67 57 79 52 Q 85 55 87 52"
        fill="none"
        stroke="#86efac"
        strokeWidth="1.2"
      />

      {/* 饱满金黄圆顶大面包盖 */}
      <path shuku-edit-id="e-eeebae90-99e1-4609-8c81-8093746f89f3"
        d="M 12 46 C 11 20 27 11 50 11 C 73 11 89 20 88 46 C 88 49 75 51 50 51 C 25 51 12 49 12 46 Z"
        fill="url(#bunTopRealistic)"
      />
      {/* 顶层面包高光水润反射 */}
      <ellipse shuku-edit-id="e-d7f6d80f-d84f-43ee-9cec-b2416572d50a" cx="44" cy="19" rx="14" ry="4" fill="#ffffff" opacity="0.32" transform="rotate(-8 44 19)" />

      {/* 饱满白芝麻点缀 */}
      <g shuku-edit-id="e-22f6f6d4-ba8e-42ab-b627-a234b90fecff" fill="#fef3c7" stroke="#b45309" strokeWidth="0.5">
        <ellipse shuku-edit-id="e-76ec847f-d7c8-408f-a583-c7f539ea7d01" cx="34" cy="22" rx="1.8" ry="2.8" transform="rotate(25 34 22)" />
        <ellipse shuku-edit-id="e-13a47c96-20e8-4120-bba3-1884f8ca273c" cx="46" cy="17" rx="1.8" ry="2.8" transform="rotate(-12 46 17)" />
        <ellipse shuku-edit-id="e-f38440a4-020c-4155-957d-63fa60844d0b" cx="60" cy="21" rx="1.8" ry="2.8" transform="rotate(35 60 21)" />
        <ellipse shuku-edit-id="e-bd30a1e5-58fc-430f-ab04-b69d4ea22b0a" cx="30" cy="33" rx="1.8" ry="2.8" transform="rotate(-30 30 33)" />
        <ellipse shuku-edit-id="e-a9880f3e-d4ba-4e61-9bb8-1df0c0df0553" cx="48" cy="28" rx="1.8" ry="2.8" transform="rotate(15 48 28)" />
        <ellipse shuku-edit-id="e-88a8d303-9689-4713-b739-f0f5b94d02c8" cx="66" cy="32" rx="1.8" ry="2.8" transform="rotate(-20 66 32)" />
        <ellipse shuku-edit-id="e-cb73d996-7397-422f-8aed-519935e288de" cx="41" cy="39" rx="1.8" ry="2.8" transform="rotate(40 41 39)" />
        <ellipse shuku-edit-id="e-27cc96db-ec2d-41cc-9b62-004bfc979e23" cx="58" cy="38" rx="1.8" ry="2.8" transform="rotate(-15 58 38)" />
      </g>
    </>
  ),
};

export function DishIcon({ dish, label, className }: DishIconProps) {
  return (
    <svg shuku-edit-id="e-37aa4587-693b-4b51-9d14-4d51927988bb"
      className={className ? `nrnn-dish-icon ${className}` : 'nrnn-dish-icon'}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {realisticShapes[dish]}
    </svg>
  );
}
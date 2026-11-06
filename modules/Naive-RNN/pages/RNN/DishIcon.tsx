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
      <defs>
        {/* 盘底与地面柔和投影 */}
        <radialGradient id="pieDropShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        {/* 银亮金属烘焙烤盘 */}
        <linearGradient id="piePanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        {/* 金黄烘烤千层酥皮 */}
        <linearGradient id="crustGoldenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="80%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        {/* 编织起酥皮条立体光影 */}
        <linearGradient id="pieLatticeStrip" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        {/* 苹果肉与肉桂焦糖馅心 */}
        <radialGradient id="appleJamFill" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="55%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>
        {/* 鲜红小苹果高光渐变 */}
        <radialGradient id="miniAppleGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="30%" stopColor="#ef4444" />
          <stop offset="85%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>

      {/* 底部接触阴影 */}
      <ellipse cx="50" cy="88" rx="45" ry="9" fill="url(#pieDropShadow)" />

      {/* 金属烤盘边缘与底托 */}
      <ellipse cx="50" cy="74" rx="46" ry="13" fill="url(#piePanGrad)" />
      <ellipse cx="50" cy="72" rx="43" ry="11" fill="#f8fafc" />
      <path d="M 8 72 C 8 82 24 88 50 88 C 76 88 92 82 92 72 L 89 64 C 89 74 72 80 50 80 C 28 80 11 74 11 64 Z" fill="#94a3b8" />

      {/* 焦糖苹果馅心底盘 */}
      <ellipse cx="50" cy="55" rx="38" ry="22" fill="url(#appleJamFill)" />

      {/* 经典十字交叉编织酥皮条（粗壮清晰，小尺寸也极显眼） */}
      <g stroke="url(#pieLatticeStrip)" strokeWidth="5.5" strokeLinecap="round">
        <path d="M 22 47 Q 44 34 74 61" />
        <path d="M 26 59 Q 52 44 80 54" />
        <path d="M 36 68 Q 62 52 78 45" />
        <path d="M 24 57 Q 50 68 76 46" />
        <path d="M 33 44 Q 54 62 72 65" />
        <path d="M 44 38 Q 66 56 68 71" />
      </g>

      {/* 酥脆起酥波浪花边滚边（烘焙体积感） */}
      <path
        d="M 8 57 C 8 36 26 21 50 21 C 74 21 92 36 92 57 C 90 68 74 75 50 75 C 26 75 10 68 8 57 Z"
        fill="none"
        stroke="url(#crustGoldenGrad)"
        strokeWidth="6.5"
      />
      {/* 花边酥皮结节 */}
      <g fill="url(#crustGoldenGrad)">
        <circle cx="12" cy="54" r="4.5" />
        <circle cx="21" cy="63" r="4.8" />
        <circle cx="34" cy="69" r="5" />
        <circle cx="50" cy="72" r="5.2" />
        <circle cx="66" cy="69" r="5" />
        <circle cx="79" cy="63" r="4.8" />
        <circle cx="88" cy="54" r="4.5" />
      </g>

      {/* 核心辨识标志：正上方一颗鲜嫩诱人、带叶子的红苹果徽章！ */}
      <g transform="translate(42, 34)">
        {/* 绿叶 */}
        <path d="M 9 3 Q 16 0 17 6 Q 12 9 9 3 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
        {/* 果梗 */}
        <path d="M 8 7 Q 8 2 10 0" fill="none" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
        {/* 红苹果身 */}
        <path
          d="M 8 6 C 5 3 0 5 0 11 C 0 16 4 19 8 18 C 12 19 16 16 16 11 C 16 5 11 3 8 6 Z"
          fill="url(#miniAppleGrad)"
          stroke="#7f1d1d"
          strokeWidth="0.8"
        />
        {/* 苹果高光 */}
        <ellipse cx="4" cy="9" rx="1.5" ry="3" fill="#ffffff" opacity="0.65" transform="rotate(-25 4 9)" />
      </g>
    </>
  ),

  steak: (
    <>
      <defs>
        {/* 大白瓷盘渐变 */}
        <linearGradient id="steakPlateReflect" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#f8fafc" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        {/* 炭火美拉德深厚熟成肉色 */}
        <radialGradient id="steakMeatSurface" cx="45%" cy="38%" r="60%">
          <stop offset="0%" stopColor="#9a3412" />
          <stop offset="35%" stopColor="#7c2d12" />
          <stop offset="70%" stopColor="#431407" />
          <stop offset="100%" stopColor="#1a0602" />
        </radialGradient>
        {/* 切面厚度与鲜嫩粉红肉汁（五分熟 Medium Rare） */}
        <linearGradient id="rareMeatCut" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="35%" stopColor="#be123c" />
          <stop offset="70%" stopColor="#881337" />
          <stop offset="100%" stopColor="#2b0805" />
        </linearGradient>
        {/* 骨头立体高光 */}
        <linearGradient id="boneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        {/* 融化黄油金光 */}
        <linearGradient id="meltingButter" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* 底部阴影 */}
      <ellipse cx="50" cy="88" rx="46" ry="10" fill="#0f172a" opacity="0.25" />

      {/* 高端椭圆大白西餐盘 */}
      <ellipse cx="50" cy="66" rx="47" ry="24" fill="url(#steakPlateReflect)" />
      <ellipse cx="50" cy="65" rx="43" ry="21" fill="#f8fafc" />
      <ellipse cx="50" cy="64" rx="37" ry="17" fill="#e2e8f0" opacity="0.6" />

      {/* 3D 鲜嫩厚肉侧面（展示出厚切五分熟质感） */}
      <path
        d="M 16 52 C 14 69 28 80 54 81 C 77 82 89 71 87 56 L 86 49 C 86 64 73 73 50 72 C 25 71 16 62 17 48 Z"
        fill="url(#rareMeatCut)"
      />

      {/* 经典带骨战斧/T骨形态牛排肉身 */}
      <path
        d="M 28 34 C 18 30 14 44 17 56 C 20 68 34 73 53 72 C 72 71 86 63 85 49 C 84 32 66 22 48 24 C 38 25 34 30 28 34 Z"
        fill="url(#steakMeatSurface)"
      />

      {/* 核心辨识标志 1：左上方洁白醒目的圆截面带骨牛排大骨头 (Bone)！ */}
      <g>
        {/* 骨头突起阴影与骨体 */}
        <path d="M 24 30 L 16 23 C 14 21 16 17 19 18 L 29 26 Z" fill="#94a3b8" />
        <path d="M 23 29 L 15 22 C 12 19 14 14 18 16 L 28 25 Z" fill="url(#boneGrad)" stroke="#64748b" strokeWidth="1" />
        {/* 骨头圆润截面与骨髓孔 */}
        <ellipse cx="16" cy="19" rx="4.5" ry="3.5" fill="#f8fafc" stroke="#64748b" strokeWidth="1" transform="rotate(-30 16 19)" />
        <ellipse cx="16" cy="19" rx="1.8" ry="1.2" fill="#cbd5e1" transform="rotate(-30 16 19)" />
      </g>

      {/* 核心辨识标志 2：极粗黑、极其醒目的菱形炭烤十字网纹 (Char Grill Marks) */}
      <g stroke="#140502" strokeWidth="4.2" strokeLinecap="round" opacity="0.95">
        <path d="M 32 38 L 48 64" />
        <path d="M 45 32 L 64 58" />
        <path d="M 59 34 L 75 52" />
        <path d="M 33 55 L 56 31" />
        <path d="M 45 64 L 70 36" />
      </g>

      {/* 油亮饱满的肉汁高光 */}
      <ellipse cx="43" cy="40" rx="7" ry="2.8" fill="#ffffff" opacity="0.35" transform="rotate(-15 43 40)" />
      <ellipse cx="64" cy="48" rx="6" ry="2.2" fill="#ffffff" opacity="0.3" transform="rotate(10 64 48)" />

      {/* 顶上一块融化的高级蒜香黄油方块 */}
      <rect x="44" y="38" width="11" height="8" rx="2.5" fill="url(#meltingButter)" transform="rotate(-10 49 42)" stroke="#b45309" strokeWidth="0.8" />
      <path d="M 40 45 Q 49 48 60 43" stroke="#fef08a" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.85" />

      {/* 新鲜迷迭香香草枝 */}
      <path d="M 56 33 Q 66 31 75 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="62" cy="30" rx="3" ry="1.4" fill="#22c55e" transform="rotate(25 62 30)" />
      <ellipse cx="69" cy="27" rx="3" ry="1.4" fill="#22c55e" transform="rotate(-20 69 27)" />
      <ellipse cx="74" cy="24" rx="2.5" ry="1.2" fill="#4ade80" />
    </>
  ),

  burger: (
    <>
      <defs>
        {/* 面包胚圆顶金黄烘焙高光渐变 */}
        <radialGradient id="bunTopRealistic" cx="45%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="85%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
        <linearGradient id="bunBottomRealistic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="60%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        {/* 纯牛肉饼美拉德焦香渐变 */}
        <linearGradient id="burgerPattyRealistic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="40%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#290e03" />
        </linearGradient>
        {/* 切达芝士流心热溶感 */}
        <linearGradient id="cheeseMeltRealistic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        {/* 新鲜双层番茄切片 */}
        <linearGradient id="tomatoSliceRealistic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {/* 底部接触阴影 */}
      <ellipse cx="50" cy="89" rx="44" ry="8" fill="#0f172a" opacity="0.25" />

      {/* 底层厚面包胚 */}
      <path
        d="M 15 76 C 15 73 24 72 50 72 C 76 72 85 73 85 76 C 85 83 73 88 50 88 C 27 88 15 83 15 76 Z"
        fill="url(#bunBottomRealistic)"
      />

      {/* 多汁厚煎纯牛肉饼 */}
      <path
        d="M 12 66 C 12 63 23 62 50 62 C 77 62 88 63 88 66 C 89 72 79 77 50 77 C 21 77 11 72 12 66 Z"
        fill="url(#burgerPattyRealistic)"
      />
      <ellipse cx="32" cy="70" rx="2" ry="1" fill="#1c0a02" />
      <ellipse cx="55" cy="72" rx="2" ry="1" fill="#1c0a02" />
      <ellipse cx="72" cy="68" rx="2" ry="1" fill="#1c0a02" />

      {/* 熔化切达芝士层（自然垂落滴坠） */}
      <path
        d="M 14 62 L 86 62 L 84 67 L 76 73 L 67 66 L 56 75 L 46 66 L 35 74 L 25 65 L 17 71 Z"
        fill="url(#cheeseMeltRealistic)"
      />

      {/* 双层红亮番茄片 */}
      <path d="M 15 56 C 15 53 27 52 50 52 C 73 52 85 53 85 56 C 85 59 73 61 50 61 C 27 61 15 59 15 56 Z" fill="url(#tomatoSliceRealistic)" />
      <ellipse cx="38" cy="55" rx="8" ry="1.6" fill="#fca5a5" opacity="0.6" />

      {/* 褶皱波浪翠绿爽脆生菜 */}
      <path
        d="M 10 52 Q 18 56 26 51 Q 35 57 45 52 Q 56 58 67 51 Q 78 57 90 51 C 91 54 85 57 76 57 Q 64 59 52 56 Q 41 60 30 56 Q 19 59 10 52 Z"
        fill="#22c55e"
      />
      <path
        d="M 13 52 Q 22 56 31 52 Q 43 57 55 52 Q 67 57 79 52 Q 85 55 87 52"
        fill="none"
        stroke="#86efac"
        strokeWidth="1.2"
      />

      {/* 饱满金黄圆顶大面包盖 */}
      <path
        d="M 12 46 C 11 20 27 11 50 11 C 73 11 89 20 88 46 C 88 49 75 51 50 51 C 25 51 12 49 12 46 Z"
        fill="url(#bunTopRealistic)"
      />
      {/* 顶层面包高光水润反射 */}
      <ellipse cx="44" cy="19" rx="14" ry="4" fill="#ffffff" opacity="0.32" transform="rotate(-8 44 19)" />

      {/* 饱满白芝麻点缀 */}
      <g fill="#fef3c7" stroke="#b45309" strokeWidth="0.5">
        <ellipse cx="34" cy="22" rx="1.8" ry="2.8" transform="rotate(25 34 22)" />
        <ellipse cx="46" cy="17" rx="1.8" ry="2.8" transform="rotate(-12 46 17)" />
        <ellipse cx="60" cy="21" rx="1.8" ry="2.8" transform="rotate(35 60 21)" />
        <ellipse cx="30" cy="33" rx="1.8" ry="2.8" transform="rotate(-30 30 33)" />
        <ellipse cx="48" cy="28" rx="1.8" ry="2.8" transform="rotate(15 48 28)" />
        <ellipse cx="66" cy="32" rx="1.8" ry="2.8" transform="rotate(-20 66 32)" />
        <ellipse cx="41" cy="39" rx="1.8" ry="2.8" transform="rotate(40 41 39)" />
        <ellipse cx="58" cy="38" rx="1.8" ry="2.8" transform="rotate(-15 58 38)" />
      </g>
    </>
  ),
};

export function DishIcon({ dish, label, className }: DishIconProps) {
  return (
    <svg
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
export interface HeightObservation {
  parent: number;
  child: number;
}

/**
 * 教学示意样本：保留 Galton 身高研究中“父母中位身高与成年子女身高正相关，
 * 但点不会落在同一条直线上”的关系。它不是 1886 年原始表格的逐行转录。
 */
export const heightTeachingSample: HeightObservation[] = [
  { parent: 154, child: 157 },
  { parent: 158, child: 160 },
  { parent: 160, child: 163 },
  { parent: 162, child: 164 },
  { parent: 165, child: 166 },
  { parent: 166, child: 170 },
  { parent: 168, child: 167 },
  { parent: 170, child: 172 },
  { parent: 172, child: 174 },
  { parent: 174, child: 171 },
  { parent: 176, child: 178 },
  { parent: 178, child: 176 },
  { parent: 181, child: 182 },
  { parent: 184, child: 180 },
];

export const historicalNote = {
  year: 1886,
  paper: 'Regression towards Mediocrity in Hereditary Stature',
  question: '父母的身高，与成年子女的身高有什么稳定关系？',
};


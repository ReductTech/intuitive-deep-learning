export class PCA {
  constructor(data: number[][], options?: { center?: boolean; scale?: boolean; method?: 'SVD' });
  predict(data: number[][], options?: { nComponents?: number }): { to2DArray(): number[][] };
}

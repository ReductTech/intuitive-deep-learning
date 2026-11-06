import { moduleJson } from '../../shared/react/moduleJson';
import { moduleIdentity } from '../outlines.json';

export interface RecyclingDataset {
  revision: string;
  classes: string[];
  split_counts: { train: number; validation: number; test: number };
  samples: { id: string; label: number; class_name: string; split: 'train' | 'validation' | 'test'; group: string; file: string }[];
}
export const recyclingDataset = moduleJson<RecyclingDataset>(moduleIdentity.id, 'training-head/dataset.json');

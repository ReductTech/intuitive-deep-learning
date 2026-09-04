import { useMemo } from 'react';
import {
  FunctionPlot,
  PlotlyChart,
  sampleSurface3D,
  type PlotlyLayout,
  type PlotlyTrace,
} from '../../shared/react';
import {
  FUNCTION_2D_DEFINITIONS,
  SURFACE_3D_DEFINITIONS,
  type Function2DId,
  type Surface3DId,
} from '../model/linearMath';

const COLORS = { blue: '#27446e', red: '#c43f52', orange: '#f07e47', green: '#228d5c' } as const;
const FUNCTION_COLORS: Record<Function2DId, string> = {
  line2d: COLORS.green,
  parabola2d: COLORS.orange,
  fold2d: COLORS.red,
};
const SURFACE_COLORS: Record<Surface3DId, Array<[number, string]>> = {
  plane3d: [[0, '#e8f7ef'], [1, COLORS.green]],
  bowl3d: [[0, '#fff4ee'], [1, COLORS.orange]],
  fold3d: [[0, '#fff0f2'], [1, COLORS.red]],
};

export function Function2DChoicePlot({ type }: { type: Function2DId }) {
  const definition = FUNCTION_2D_DEFINITIONS[type];
  return <FunctionPlot className="bm-linear-choice-plot" fn={definition.fn} stroke={FUNCTION_COLORS[type]} initialCenter={{ x: 0, y: 0 }} initialScale={{ x: 2.4 / 760, y: 2.4 / 420 }} minHeight={176} ariaLabel={`${definition.formula} 的二维函数图像`} />;
}

export function Surface3DChoicePlot({ type }: { type: Surface3DId }) {
  const definition = SURFACE_3D_DEFINITIONS[type];
  const data = useMemo<PlotlyTrace[]>(() => {
    const sampled = sampleSurface3D(definition.fn, { min: -1, max: 1, samples: 28, zMin: -1.05, zMax: 1.05 });
    return [{
      type: 'surface', x: sampled.x, y: sampled.y, z: sampled.z, showscale: false, opacity: 0.94,
      colorscale: SURFACE_COLORS[type], hovertemplate: 'x = %{x:.3f}<br>y = %{y:.3f}<br>z = %{z:.3f}<extra></extra>',
    }];
  }, [definition, type]);
  const layout = useMemo<PlotlyLayout>(() => ({
    autosize: true, paper_bgcolor: '#fbfdff', margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false,
    scene: {
      bgcolor: '#fbfdff', dragmode: 'orbit', aspectmode: 'cube', camera: { eye: { x: 1.35, y: 1.35, z: 0.95 } },
      xaxis: { title: 'x', range: [-1.05, 1.05], showgrid: true, gridcolor: '#dfe6f1' },
      yaxis: { title: 'y', range: [-1.05, 1.05], showgrid: true, gridcolor: '#dfe6f1' },
      zaxis: { title: 'z', range: [-1.05, 1.05], showgrid: true, gridcolor: '#dfe6f1' },
    },
  }), []);
  return <PlotlyChart className="bm-linear-choice-plot bm-linear-choice-plot--3d" data={data} layout={layout} minHeight={176} role="img" aria-label={`${definition.formula} 的三维函数曲面，可拖动旋转`} />;
}

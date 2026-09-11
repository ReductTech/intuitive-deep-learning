import type { ComponentType, ReactNode } from 'react';

export interface ModulePageOutline {
  id: string;
  title: string;
  goal?: string;
  summary?: string;
  interaction?: string;
  next?: string;
  snippet?: string;
}

export interface ActiveModule {
  id: string;
  title: string;
  description: string;
  path: string;
  badge: string;
  element: ReactNode;
  /** 模块类型：teaching = 教材型课堂模块，popular-science = 科普互动模块 */
  moduleType?: 'teaching' | 'popular-science';
  /** 难度级别：introductory = 入门（无需微积分），intermediate = 中级（需要高数/线代基础），advanced = 高级（研究导向） */
  difficulty?: 'introductory' | 'intermediate' | 'advanced';
  /** 目标受众：undergraduate = 本科生，general = 普通大众，graduate = 研究生 */
  audience?: 'undergraduate' | 'general' | 'graduate';
  /** outlines.json 中的页面索引，顺序与课程流程和 PPT 一致。 */
  pages: ModulePageOutline[];
  /** 该模块 Web PPT 的独立播放路径。 */
  pptPath?: string;
  pptElement?: ReactNode;
  /** 是否承接 /web_ppt/ 与 /web_ppt/slide.html 这两个通用播放入口。 */
  claimsPptPlayer: boolean;
}

interface ModuleOutlineFile {
  id?: string;
  title?: string;
  description?: string;
  path?: string;
  badge?: string;
  moduleType?: ActiveModule['moduleType'];
  difficulty?: ActiveModule['difficulty'];
  audience?: ActiveModule['audience'];
  /** 课程主入口组件所在的文件名，例如 ExpandedNeuronGuidePage.tsx */
  entry?: string;
  ppt?: { entry?: string; path?: string; player?: boolean };
  pages?: ModulePageOutline[];
}

// 模块在 modules/<目录>/outlines.json 里注册自己：应用路由、首页入口和页面索引都来自这份文件。
// 新增模块只要放好目录和 outlines.json，不需要改动这个文件或 routes.tsx。
const outlineFiles = import.meta.glob('../../modules/*/outlines.json', { eager: true, import: 'default' }) as Record<string, ModuleOutlineFile>;
const pageModules = import.meta.glob('../../modules/*/*.tsx', { eager: true }) as Record<string, Record<string, unknown>>;

function moduleDir(file: string) {
  return file.split('/').at(-2) ?? '';
}

/** entry 写成模块目录下的文件名，组件以同名命名导出。 */
function entryElement(dir: string, entry?: string): ReactNode {
  if (!entry) return null;
  const Component = pageModules[`../../modules/${dir}/${entry}`]?.[entry.replace(/\.tsx$/, '')] as ComponentType | undefined;
  return Component ? <Component /> : null;
}

export const activeModules: ActiveModule[] = Object.entries(outlineFiles)
  .map(([file, outline]) => {
    const dir = moduleDir(file);
    const element = entryElement(dir, outline.entry);
    if (!element) console.warn(`[modules] ${dir}/outlines.json 的 entry 未指向可用的入口组件，已跳过注册。`);
    return {
      id: outline.id ?? dir,
      title: outline.title ?? dir,
      description: outline.description ?? '',
      path: outline.path ?? `/modules/${dir.toLowerCase()}`,
      badge: outline.badge ?? '互动课程',
      element,
      moduleType: outline.moduleType,
      difficulty: outline.difficulty,
      audience: outline.audience,
      pages: outline.pages ?? [],
      pptPath: outline.ppt?.path,
      pptElement: entryElement(dir, outline.ppt?.entry),
      claimsPptPlayer: Boolean(outline.ppt?.player),
    };
  })
  .filter((module) => Boolean(module.element))
  .sort((a, b) => a.id.localeCompare(b.id));

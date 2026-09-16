export interface SharedThemePalette {
  id: string;
  name: string;
  description: string;
  colors: Array<{ token: string; label: string; value: string; usage: string }>;
}

/** 所有课程模块共用的 Shared UI 默认配色。模块可以覆写 token，但不应复制这组基础语义。 */
export const defaultTheme: SharedThemePalette = {
  id: 'shared-default',
  name: 'Shared UI · 学术蓝橙',
  description: '可信的深蓝负责结构与解释，暖橙负责动作、注意和关键反馈；绿色只表示成功状态。',
  colors: [
    { token: '--ui-bg-page', label: '页面背景', value: '#EEF2F7', usage: '课程页面底色' },
    { token: '--ui-bg-card', label: '卡片表面', value: '#FFFFFF', usage: '内容块、面板和输入控件' },
    { token: '--ui-bg-soft', label: '柔和底色', value: '#EEF3FB', usage: '蓝色提示和次级区域' },
    { token: '--ui-text-main', label: '主要文字', value: '#21324A', usage: '正文与核心说明' },
    { token: '--ui-text-muted', label: '弱化文字', value: '#68778F', usage: '副标题与辅助说明' },
    { token: '--ui-accent', label: '学术深蓝', value: '#27446E', usage: '标题、公式、主按钮、结构线' },
    { token: '--ui-accent-alt', label: '暖橙强调', value: '#F07E47', usage: '操作提示、重点、引导' },
    { token: '--ui-success', label: '成功绿', value: '#228D5C', usage: '正确、完成、通过' },
    { token: '--ui-warning', label: '警告金', value: '#C07100', usage: '需要注意的状态' },
    { token: '--ui-danger', label: '错误红', value: '#C43F52', usage: '错误、风险、删除' },
    { token: '--ui-border', label: '边框', value: '#D7DEEA', usage: '面板、分隔线、输入框' },
    { token: '--ui-grid', label: '网格线', value: '#DFE6F1', usage: '坐标图和可视化网格' },
  ],
};

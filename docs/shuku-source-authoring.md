# React／TSX 源码课程

入口：课程共创 → 我要创建课程 → 起始内容选择 **React／TSX 源码课程**。

文件列表中编辑、添加或删除源码，给每个页面选择组件入口，再保存修订。构建完成后查看真实互动预览；提交审核、正式发布和历史版本沿用现有流程。Web Agent 暂未接入，本次不包含 AI 自动生成。

## 源码契约

保存接口仍为 `POST /api/shuku/courses/{id}/revisions`，携带可信会话和预期修订。新增项目字段示例：

```json
{
  "source": {"files": {
    "Lesson.tsx": "import {useState} from 'react'; export default function Lesson(){const [n,setN]=useState(0);return <button onClick={()=>setN(n+1)}>{n}</button>}",
    "lesson.css": ".lesson { padding: 80px; }"
  }},
  "pages": [{"id":"lesson-1","format":"react","sourceEntry":"Lesson.tsx","title":"第一课","goal":"","summary":"","note":"","ready":true,"designed":true,"revisions":[],"messages":[]}]
}
```

以上仅展示新增字段；完整项目仍包含 version、courseId、title、duration、style、outlineConfirmed 等现有字段。组件默认导出；支持相对路径多文件导入和 JSX 自动转换。

- 支持 TSX、TS、JSX、JS、CSS、JSON、文本 SVG。200 个文件以内，单文件 1 MiB，总源码 4 MiB；使用 ASCII 相对路径。
- 可导入 React、React DOM、lucide-react。其他依赖需要由工程师审查后加入 `scripts/shuku-source-plugin.mjs` 的允许列表并安装到构建环境。
- 不执行课程的 npm 安装脚本，不加载用户构建配置、Node 内置模块或宿主文件。这是托管课程源码契约，不是任意 npm 工程零改动部署。
- 源码课程采用浏览器沙箱；本次按自包含前端交互运行，不开放源码课程直接请求账号 API、外部网络或原计算服务。既有原生课程继续使用原接口。素材建议通过源码导入 SVG 或内嵌数据；其他素材与计算接入需另设受控接口。

## 保存与发布

源码文本保存在不可变 project.json，同时按 `sources/<path>` 纳入文件桶哈希清单；课程、修订、任务和正式版本引用继续保存在 MySQL，无新数据库表。所有读取继续校验课程权限。

Worker 使用虚拟文件解析器与固定前端依赖构建，不在服务器执行用户代码。产物包含播放器与实际 React 组件，源课程使用带沙箱策略的内嵌脚本和样式；源码 JSON、设计图和创作对话不作为公开资源提供。编译错误在作者编辑器显示，不能提交审核或改变旧正式版本。

审核绑定修订与产物摘要。共创复制源码，审核页列出新增／修改／删除的源文件；合并复用已经审核的产物。GitHub 导出携带 `courses/sources/`；外部 PR 可修改该目录及课程项目数据，但不能直接替换 bundle.js 等运行产物。导入后重新构建并审核发布。

## 验证

- `backend/tests/shuku_backend/test_source.py`：安全路径、源码保存构建、历史版本、错误构建、共创及外部 PR 源码校验。
- `scripts/check-shuku-source.mjs`：针对隔离环境实际点击创建、文件编辑、React 互动、沙箱、审核发布、跨页账号学习记录和失败后旧版可用。
- 浏览器脚本需要 Playwright 模块绝对路径参数及 `SHUKU_SOURCE_TEST_PASSWORD`，地址通过 `SHUKU_SOURCE_URL` 配置，仅接受本机测试入口。

运行环境继续使用原有 Node/esbuild、MySQL 和文件桶。本次未改动 idl_backend，未切换 Demo／产品站部署。

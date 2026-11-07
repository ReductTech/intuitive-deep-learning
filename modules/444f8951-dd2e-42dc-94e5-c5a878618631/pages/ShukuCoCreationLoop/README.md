# 术库共创循环交互页

独立入口：`import {ShukuCoCreationLoop} from './pages/ShukuCoCreationLoop'`，在 1600×900 课件画布中渲染 `<ShukuCoCreationLoop/>`。复制整个目录即可复用，不依赖后台或其他课程。

## 文字与视觉素材

`LoopArtwork.tsx` 和 `LoopArtwork.css` 重建参考图的四角流程、中央课程、箭头和配色。标题、说明、标签、问题、课程目录、学习率、公式、分数、版本与底部结语全部为可选中的 HTML 文字；图表和箭头为 SVG，放大不会像截图文字一样模糊。放大视图也复用这些文字组件，不裁切带字卡片。

`assets/` 仅有从用户提供的 `05shukupptLoop.png` 提取的三张无文字插图：梯度曲面、噪声与猫。运行时不加载整张参考图。课程导航缩略图仍为正常的截图，不作为课程正文使用。

## 交互

点击卡片的放大按钮或非文字选择区域；课堂使用可调学习率、记录反馈；学生提交两个案例；教师分别采纳或退回；两项审核均完成且至少采纳一项才能发布 v1.1。仅采纳项进入新版，重置可重新演示。评分和操作均为本地教学示例。支持 Escape 关闭、焦点恢复与 Tab 焦点循环。

Creator-Guide 第 22 页，场景 ID 与自学锚点均为 `shuku-cocreation-loop`。

测试：`node --experimental-strip-types --test modules/Creator-Guide/pages/ShukuCoCreationLoop/model.test.mjs`。

浏览器：提供本地独立组件预览后，运行 `python modules/Creator-Guide/pages/ShukuCoCreationLoop/verify_browser.py --url http://127.0.0.1:18736 --artifacts /tmp/shuku-loop-check`。需要 Playwright Chromium，可通过 `--chromium` 指定浏览器。验证可选择的真实文字、无整页截图、交互与键盘操作，并输出截图和结果。

# 术库共创循环交互页

独立入口：`import {ShukuCoCreationLoop} from './pages/ShukuCoCreationLoop'`，在 1600×900 课件画布中渲染 `<ShukuCoCreationLoop/>`。组件、样式、原图素材和演示状态均在本目录，不依赖课程后台或其他课程。复用时复制整个目录即可。

概览直接使用用户提供的 `05shukupptLoop.png` 原图（本目录 `assets/loop-reference.png` 为逐字节副本），保持文字、配色、曲面、猫和案例等素材及布局一致。各卡片和中央课程是可点击、可键盘聚焦的热区；放大后用 CSS 裁切同一张图展示原素材，并提供真正可操作的演示。

交互：点击课堂使用或中央课程调学习率；记录反馈；学生共创提交两个案例；教师分别采纳或退回；两项审核均完成且至少采纳一项时才能发布 v1.1；仅采纳项进入新版，重置可重新演示。评分为固定示例，所有操作只在内存中演示，不请求真实接口。支持 Escape 关闭、焦点恢复和对话框 Tab 焦点循环。

测试：`node --experimental-strip-types --test modules/Creator-Guide/pages/ShukuCoCreationLoop/model.test.mjs`。页面追加为 Creator-Guide 第 22 页，场景 ID `shuku-cocreation-loop`，自学锚点同名。

浏览器验收：在本机提供独立组件预览后，执行 `python modules/Creator-Guide/pages/ShukuCoCreationLoop/verify_browser.py --url http://127.0.0.1:18736 --artifacts /tmp/shuku-loop-check`，需要 Playwright Chromium，可通过 `--chromium` 指定可执行文件。输出概览、发布后截图及验证结果。

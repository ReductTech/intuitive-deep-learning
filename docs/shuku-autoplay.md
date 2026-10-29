# 自动播放与朗读

课件预览右上角提供「智能讲稿」主按钮，旁边的下拉按钮打开设置：朗读方式、音色、0.8–1.2 倍语速和「读完自动翻页」开关。全屏演示也提供相同控制。从当前页开始，按页面顺序读取 outlines.json 的 snippet；空讲稿页跳过，最后一段结束后停止。暂停保留当前音频位置，继续接着读；手动换页会从新页重新开始。进入编辑、切换课程或退出播放器会停止并清理音频。不会将朗读自动记为习题完成。

默认使用与 Creator-Showcase 相同的 MiniMax 国际站 `/v1/t2a_v2`，模型 `speech-2.8-hd`、普通话知性女声、MP3 32 kHz / 128 kbps。服务端按讲稿、模型、音色和音频参数缓存，重复播放复用音频。接口为同源 `POST /api/shuku/narration/segment`，请求 `{ "text": "讲稿", "rate": 1, "voiceId": "音色 ID（可选）" }`，返回 `audio/mpeg`。最多同时合成两段。

在仓库根目录 `settings.json` 的 `env` 对象中配置 `MINIMAX_API_KEY`，并可设置 `MINIMAX_API_BASE`、`MINIMAX_MODEL`、`MINIMAX_VOICE_ID`、`MINIMAX_VOICE_LABEL`，然后重启术库后端。与已有 `ANTHROPIC_*` 配置并列保存。非空的同名环境变量优先；不会自动读取 Creator-Showcase 的 `.env.local`。密钥只留在后端，不写入前端或课件。Vite 本地预览直接调用同一套 Python 配音实现，无需启动 8010 业务后端；使用系统 Python，也可通过 `IDL_PYTHON` 指定解释器。缓存保存在 `.private/narration-cache`。正式部署继续由术库后端提供接口。没有配置 MiniMax 时会显示错误，可选择「浏览器朗读」使用系统中文语音，无需服务端密钥。

首次播放需要点击按钮，以满足浏览器音频播放策略。不会使用页面摘要替代缺失的 snippet。版本课件的前端改动需要重新构建播放器后生效。

沙箱课件通过学习页的来源、窗口、revision 和会话 channel 校验后转发配音请求，不放宽课件沙箱权限。发布构建仅从大纲携带 snippet，不包含创作记录等信息。

验证命令：`npm run typecheck`；`python -m pytest backend/tests/shuku_backend/test_narration.py -q`；在 Vite preview 模式下运行 `node scripts/check-shuku-autoplay.mjs <playwright/index.mjs 路径>`。

MiniMax 朗读采用当前页加下一页的预载窗口：当前页开始播放时，后台生成下一段非空讲稿并下载、解码为可播放音频。翻页复用已完成或进行中的预载请求，不重复合成。手动跳页释放窗口外缓存，停止或修改音色、语速会清理音频及请求；下一页预载失败不打断当前页，到下一页时重试。

已发布课程使用独立播放器缓存。播放器版本更新为 `shuku-managed-slide-v6-narration` 后，旧 v5 缓存不会继续命中；访问课程时按需生成新版播放器，保留原课程文件、发布版本及 artifact hash。仅清理浏览器缓存无法升级旧播放器。独立 HTML 快照维持原页面，不自动注入平台控件。

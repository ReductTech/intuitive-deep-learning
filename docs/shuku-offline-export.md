# 浏览器本地生成离线 ZIP

点击「下载离线课件 ZIP」后，浏览器直接从 OSS/CDN 读取当前模块的编译代码和资源清单，下载对应素材、校验 SHA-256、等比例缩放 JPG/PNG 到 1600×900，然后在本机组装并压缩 ZIP。没有业务后端导出请求、没有共享排队，也不预先生成每门课程的 ZIP。

ZIP 使用 UTF-8 文件名、Deflate 和 CRC32。解压后双击「打开课件.html」，保留 files 文件夹；Chrome/Edge 不需要本地服务器即可运行。播放器复用在线版的顶部栏、主画布、讲稿区和缩略图导航。有缩略图的页面显示缩略图，缺图或加载失败时使用紧凑的单层页码＋标题，不使用多级目录或空白图片框。前端交互和内嵌示例保留。图片脚本传输用于保持 file:// 下的画布读像素能力，视频保持独立文件。在线计算、AI 和配音不属于离线内容。

## 发布契约

正常 Vite 构建通过 browser-offline-vite.ts 自动生成每个模块的编译入口和依赖图，复用同一次 Rollup 编译与共享代码，不另行逐课构建 ZIP。输出 offline-runtime/catalog.json 与编译器 WASM。课程资源清单按命名空间发布，只包含可公开素材，不包含训练数据和权重。

Cloud 的 cloud-publish.sh 从前端镜像提取静态编译结果，sync-course-assets.py 按内容增量同步运行文件与素材清单到 OSS 的 cloud-IDL/assets/_offline/。后端镜像仅作为已有 OSS SDK 的发布工具运行，不参与用户下载。运行文件有内容哈希名称，素材有 SHA-256 清单。

OSS/CDN 必须允许浏览器跨域 GET 读取这些公共文件，并为 .wasm 返回 application/wasm。用户客户端不持有 OSS 上传密钥。新代码和清单发布前，旧 OSS 上没有这些文件，按钮会报告资源尚未就绪；不回退到业务后端。

每次下载只读取当前课件的依赖和相应资源；相同内容素材去重，小图不放大，透明 PNG 保留 alpha。可随时取消。ZIP 生成后在浏览器脚本沙箱校验所有成员 CRC，并逐页检查目录和可见图片；此检查不等同于穷举每个交互分支。

## 本地验证

    npm run typecheck
    node scripts/check-browser-zip.mjs <Playwright 的 index.mjs 绝对路径>

check-shuku-offline.mjs 保留旧构建器的 HTML/ZIP 兼容性测试，不是当前下载按钮的后端路径。

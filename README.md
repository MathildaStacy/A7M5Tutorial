# 快门学院

一个面向摄影新手的 Android App，适配 Sony α7 V 和 FE 24–70mm F2.8 GM II。可以在 3D 机身上认键，从开箱学到曝光与对焦，再用自己的照片做复盘。

## 当前开发版

<img src="docs/reviews/app-icon.png" alt="快门学院光圈图标" width="80">

**Android 9 及以上 · ARM64**　[下载 v0.2.2 预览安装包](https://github.com/MathildaStacy/A7M5Tutorial/releases/download/v0.2.2-preview.1/ShutterAcademy-0.2.2-preview.1-arm64-v8a.apk) · [发布说明](https://github.com/MathildaStacy/A7M5Tutorial/releases/tag/v0.2.2-preview.1)

- **教练对话**　回复支持中文 Markdown 加粗、标题、嵌套列表、表格和代码。断网或手动停止后，点原问题下的「重新发送」即可用当前模型再问一次，输入框中的草稿会保留。点教练页顶部的模型名称可选择或手动填写模型 ID。「对话记录」可打开本机保存的旧对话，重启后也能继续提问或重发。
- **课程**　L0–L5 包含 44 步 3D 演示和 54 道练习。可点选机身部件、操作拨盘、回答选择题和调整曝光。演示、讲义、练习和任务的进度保存在本机，完成四段即可解锁下一课。
- **照片复盘**　在「AI 教练」选择 1–4 张 JPEG 或 HEIF，或从课程提交指定数量的照片。App 在本机缩图、计算直方图、读取标准拍摄参数，只在点击发送后向所配置的服务提交。复盘中的部件可打开 3D 近景。L1 通过十题找键满分完成任务，其余五课按实拍标准验收。
- **3D 相机**　离线模型有 36 个可点选部件。v3 增加可开合的存储卡仓、上下插槽和导轨，仓盖外侧按实拍补上皮纹、拨片和 OPEN 方向标记。可在开箱演示或相机页近看。握柄纹理、镜片镀膜与机械行程仍待实机核对。[v3 卡仓评审](docs/reviews/model-v3/README.md) · [五视角材质对照（下载源码后打开）](docs/reviews/model-v2/index.html)

## 运行 Android

使用 Node 24.22、JDK 17、Android SDK Platform 37、Build Tools 37.0.0 和 NDK 27.1.12297006。请让 `JAVA_HOME` 与 `ANDROID_HOME` 指向本机的 JDK 和 SDK。

```sh
nvm use
npm ci
npm run typecheck
npm test -- --runInBand
node scripts/check-manual-kb.cjs
npm run camera:check
cd android
./gradlew :app:assemblePreview -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/preview/app-preview.apk
```

Preview 使用开发签名，并内置 JS、字体、模型和环境光，可直接在 Android 9 及以上的 ARM64 设备上启动。日常开发可在两个终端分别运行 `npm start` 和 `npm run android`。修改模型源文件后先运行 `node scripts/export-model.mjs`。Gradle 会在构建时重新打包 3D 页面及资源。

在电脑执行 `npm run mock:ai`，然后在模拟器的「我的」中填写 `http://10.0.2.2:8787`，模型名称填写 `shutter-mock`，即可分别测试 Messages 和 Responses。连接测试使用内置色块。选图提交后，本地模拟服务会返回标明「本地模拟」的复盘。在任务的拍摄意图里填写「演示未通过」可检查重拍流程。

## 文档

| 文件 | 内容 |
|---|---|
| [docs/DEV-HANDOFF.md](docs/DEV-HANDOFF.md) | **开发从这里开始**：范围、工程结构、移植清单、任务和完成标准 |
| [docs/PRD.md](docs/PRD.md) | 产品需求文档 |
| [docs/spec/camera-tools.json](docs/spec/camera-tools.json) | AI 教练的 13 个工具定义（唯一来源） |
| [docs/spec/controls.json](docs/spec/controls.json) | 36 个部件的字典（id 同时是 3D 节点名） |
| [docs/spec/camera-model.md](docs/spec/camera-model.md) | 3D 模型规范：必须和真机一模一样；参考照片清单、绑定格式、验收标准 |
| [docs/prompts/manual-kb.md](docs/prompts/manual-kb.md) | 知识库编写任务（交给 Astra） |
| [content/lessons/](content/lessons/) | 课程 L0–L5（JSON）；改内容请改 `build.cjs` 后运行 `node content/lessons/build.cjs` |
| [prototype/index.html](prototype/index.html) | 可交互的 HTML 原型，用浏览器打开 |

## 原型

```sh
cd prototype && ./build.sh && open index.html
```

源码在 `prototype/src/`：`1-shell.html` 是界面和样式，`2-camera.js` 是 3D 相机和曝光模拟，`3-app.js` 是课程、实验室和 AI 教练的演示。

## 技术栈

React Native 0.87 + TypeScript，和 QuantWise 一致；AI 协议层移植自 QuantWise 的 `src/ai/`，所以本工程使用 GPL-3.0 许可证。

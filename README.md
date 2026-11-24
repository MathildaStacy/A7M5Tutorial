# 快门学院

一个 Android App，帮零基础用户学会 Sony α7 V + FE 24-70mm F2.8 GM II。核心功能有三个：可以点每个按键的 3D 相机、从开箱到 A 档的课程、会在 3D 相机上指出该按哪个键的 AI 照片复盘教练。

## 当前开发版

Android 预览版可离线旋转、点选并操作 α7 V 和 GM II 的 36 个部件。后拨盘联动曝光读数，触摸屏支持四种 DISP 显示。已接入找键练习、L0–L5 课程预览、四场景曝光实验室、按键答疑和自填模型服务。完整课程进度与照片复盘属于后续里程碑。

模型 v2 按索尼官方实拍重建了胶皮、砂纹漆、滚花、刻字和前镜组。可放大查看六处材质细节，将五个整机及镜头视角与实拍叠加。外观和活动部件仍待实机终验。[装机模型渲染](docs/reviews/model-v2/overview.webp) · [交互对照页（下载源码后打开）](docs/reviews/model-v2/index.html) · [测量与验收记录](docs/reviews/model-v2/README.md) · [建模源文件](assets/camera/source/photo-study.mjs)

**Android 9 及以上 · ARM64**　[下载安装包](https://github.com/MathildaStacy/A7M5Tutorial/releases/download/v0.1.0-preview.1/ShutterAcademy-0.1.0-preview.1-arm64-v8a.apk) · [预览版说明](https://github.com/MathildaStacy/A7M5Tutorial/releases/tag/v0.1.0-preview.1)

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

在电脑执行 `npm run mock:ai`，然后在模拟器的「我的」中填写 `http://10.0.2.2:8787`，模型名称填写 `shutter-mock`，即可分别测试 Messages 和 Responses。测试图是内置色块。

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

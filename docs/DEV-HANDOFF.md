# 快门学院 · 开发交接

| 项 | 内容 |
|---|---|
| 交给 | Astra（开发） |
| 日期 | 2026-11-24 |
| 状态 | 可以开工，从 M1 开始 |
| 范围 | MVP，即 M1–M4，共 13 周（第 2–14 周） |

---

## 0. 先读什么

1. **本文**：怎么做、先做什么、做到什么程度算完成。
2. **原型**：用浏览器打开 `prototype/index.html`，5 个 Tab 都点一遍，AI 教练里 3 张示例照片各跑一次。原型源码在 `prototype/src/`，其中 3D 相机的交互代码（拾取、高亮、动画、虚拟屏幕）要迁入 App。原型里的程序化模型不迁，App 用和真机一致的 GLB（§5.4）。
3. **PRD**：`docs/PRD.md`，重点读 §4 版本范围、§6 功能需求、§7 AI 方案。
4. **数据和接口定义**：
   - `docs/spec/camera-tools.json`：AI 教练的 13 个工具，是工具定义的唯一来源。
   - `docs/spec/controls.json`：36 个部件的字典，id 同时是 3D 节点名和工具参数取值。
   - `docs/spec/camera-model.md`：3D 相机模型规范和验收标准。**模型必须和真机一模一样**，原型里的程序化模型不进 App。

**有冲突时以谁为准**：本文和 `docs/spec/*.json` 优先，其次 PRD，最后原型。原型只用来看界面和交互，数据和接口以 spec 为准。拿不准的地方先问 PM，不要自己猜。

---

## 1. 本次范围

做 PRD §4 表中 **MVP 列**的内容：

- 3D 相机：部件点选、详情、可操作、虚拟屏幕联动、标签、搜索、找键练习。模型和真机一模一样（见 `docs/spec/camera-model.md`）
- 屏幕详解和 DISP 切换
- 课程 L0–L5，加今日任务
- 曝光实验室：4 个场景
- AI 教练：照片复盘、3D 联动、追问
- 设置：Messages API / Responses API，用户自填 Key
- 照片来源：只做手机相册

**不做，但要留好扩展口：**

| 以后要做 | 现在要留的口 |
|---|---|
| V1 相机直连导入（USB-C / Wi-Fi） | 照片来源抽象成 `PhotoSource` 接口，MVP 只实现 `AlbumSource` |
| V1 成长报告 | `submit_review` 的 `tags` 字段现在就存进库 |
| V1 我的 C 键映射页 | `get_camera_config` 先返回出厂默认配置，数据结构按 F-SET-07 定 |
| V1 菜单模拟器 | 不做 |
| V2 视频课 L12–L14 | 学习路径里显示为锁定状态，标「视频 · V2」，和原型一致 |

---

## 2. 工程初始化

- 新建 React Native 0.87.1 + TypeScript 工程。
  - 工程名 `ShutterAcademy`，applicationId `com.shutteracademy`。
  - `minSdkVersion 28`，即 Android 9。
- 依赖版本和 `QuantWise/package.json` 对齐：react 19.2.3、@react-navigation/native ^7.5.1、zustand ^5、@op-engineering/op-sqlite ^18、react-native-keychain ^10、react-native-svg ^15、lucide-react-native、react-native-webview 14.0.1、jest 29、typescript ^6。
- tsconfig、babel、metro、jest 的配置从 QuantWise 拷过来改。
- 新增依赖：

| 包 | 用途 |
|---|---|
| `@react-native-documents/picker` | 从相册或文件选照片 |
| `exifreader` | 解析 EXIF，纯 JS |
| `ajv` | 按 `camera-tools.json` 校验模型传来的工具参数 |
| `three@0.170.0`（开发依赖） | 3D 场景。正式模型是 GLB，原型的程序化建模代码不迁移，所以直接用新版本，需要用到 GLTFLoader、KTX2Loader、MeshoptDecoder 和较新的 PBR 渲染。原型的交互代码（拾取、高亮、动画）迁移时按新 API 调整 |
| `@gltf-transform/core`、`@gltf-transform/extensions`（开发依赖） | 模型检查脚本 `scripts/check-model.mjs` |
| `esbuild`（开发依赖） | 把 3D 页面打包成单个离线 HTML |

- **许可证**：要移植 QuantWise 的 GPL-3.0 代码，本工程同样用 GPL-3.0。
- **目录结构：**

```
src/
  ai/              从 QuantWise 移植的协议层（见 §3）
    agent.ts       工具循环，参照 QuantWise chat.ts 重写
    coach/         提示词、工具执行器、复盘卡
  camera/          纯 TS 逻辑，不依赖 UI，全部有单测
    controls.ts    加载 docs/spec/controls.json
    exposure.ts    曝光求解（从原型 solve() 迁移）
    state.ts       虚拟相机状态和 act()（从原型 act() 迁移）
  camera3d/        three.js 场景，运行在 WebView 里：加载 GLB，按节点 extras 播放动画（交互参照原型 2-camera.js）
  bridge/          RN ↔ WebView 消息桥（参照 QuantWise src/ui/math/bridge.ts）
  photo/           选图、EXIF、预处理
  lessons/         课程引擎
  lab/             曝光实验室
  data/            op-sqlite 表和仓库
  ui/              主题、组件、5 个 Tab 的页面
scripts/
  build-camera3d.mjs   打包 src/camera3d → android/app/src/main/assets/camera3d/index.html
  mock-ai.cjs          本地假模型服务（见 §9）
  check-model.mjs      3D 模型检查（见 camera-model.md §9）
assets/camera/         3D 模型、LOD1、环境光贴图（见 camera-model.md §3）
content/lessons/       课程数据（PM 提供，见 §11）
docs/spec/             工具和部件定义
```

---

## 3. 从 QuantWise 移植 AI 层

QuantWise 的 `src/ai/` 已经实现了 Messages、Responses、Chat Completions 三种协议的请求构建、SSE 流式解析、工具循环和 Key 存储。但 `chat.ts` 有 1508 行，和行情、账户、MCP 模块耦合很深，**不能整个拷过来**。下表根据 import 关系整理，实际拆分以 `tsc` 通过为准。

| 文件 | 处理 | 说明 |
|---|---|---|
| `types.ts` | 拷贝后修改 | 删掉 `import ChartData` 和 `charts?: ChartData[]`；`Part` 新增图片类型（见 §3.1） |
| `protocol.ts` | 拷贝后修改 | 加图片映射、Messages 协议的新参数（见 §3.1） |
| `stream.ts` | 拷贝后修改 | 支持 thinking 进度块（见 §3.1） |
| `http.ts` | 拷贝后修改 | `compatOf()` 扩展兼容降级（见 §3.1） |
| `messageText.ts`、`models.ts`、`evidence.ts`、`catalog.ts`、`markdown.ts` | 直接拷贝 | `protocol.ts` 和 `stream.ts` 依赖前三个；`catalog.ts` 给设置页拉模型列表；`markdown.ts` 用来渲染聊天内容 |
| `services.ts` | 拷贝后修改 | 依赖 `../data/db` 和 `../data/repos`，换成本工程的数据层；默认模型改为 `claude-opus-5-5` |
| `chat.ts` | **参照重写**为 `agent.ts` | 保留：流式输出、工具循环、停止时补齐工具结果、断线处理、usage 统计、`testConnection()`。删掉：AppCore、行情时钟、MCP、搜索、记忆、压缩、flows、preview、runCard |
| `mcp.ts`、`search.ts`、`external.ts`、`flows.ts`、`quick.ts`、`context.ts`、`provenance.ts`、`compact.ts`、`tools/*` | 不移植 | 理财业务专用，或 MVP 用不到 |
| `prompt.ts` | 不移植 | 提示词按 PRD §7.5 重写，放在 `src/ai/coach/prompt.ts` |
| `__tests__/ai/protocol.test.ts`、`stream.test.ts`、`fixtures/` | 移植 | 删掉和理财相关的用例；`chat.test.ts` 里和循环有关的用例改写成 `agent.test.ts` |

### 3.1 协议层要新增或修改的地方

**① 图片 Part**

```ts
type Part =
  | { t: 'text'; text: string }
  | { t: 'image'; mediaType: 'image/jpeg'; ref: string }   // ref = 预处理后照片的本地 id
  | { t: 'call'; id: string; name: string; args: string }
  | { t: 'result'; id: string; name: string; output: string };
```

- 库里只存 `ref`，构建请求时再读出预处理好的 JPEG 文件，转成 base64（不能有换行）。
- **同一张照片每次读出的字节必须完全相同**：预处理只做一次，结果存成文件，之后不再重新编码。否则提示词缓存会失效。
- 同一条用户消息里，图片放在文字前面。

| 协议 | 映射 |
|---|---|
| Messages | `{"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":"…"}}` |
| Responses | `{"type":"input_image","image_url":"data:image/jpeg;base64,…"}` |
| Chat Completions（可选） | `{"type":"image_url","image_url":{"url":"data:image/jpeg;base64,…"}}` |

**② Messages 协议的请求参数（默认模型 `claude-opus-5-5`）**

| 参数 | 值 | 原因 |
|---|---|---|
| `thinking` | `{ "type": "adaptive", "display": "updates" }`，同时带 beta 头 `thinking-display-updates-2026-08-18` | Opus 5.5 在两次工具调用之间写的进度说明，会以 thinking 块返回。不设 `updates` 时内容为空，界面会长时间没有动静 |
| `output_config.effort` | 复盘用 `medium`，追问用 `low`，设置页可改 | Opus 5.5 的默认值是 `medium`，这里显式传 |
| `fallbacks` | `"default"`，同时带 beta 头 `server-side-fallback-2026-07-01` | 被安全分类器误拒时，由服务端自动换模型重试 |
| 不要发 | `temperature` / `top_p` / `top_k`；`tool_choice` 设为 `any` 或 `tool`；assistant 预填 | Opus 5.5 收到这些会返回 400。`tool_choice` 统一用 `auto` |

- 多个 beta 值放在同一个 `anthropic-beta` 头里，用逗号分隔。
- **thinking 块的显示**：文字不为空的 thinking 块显示成灰色状态行，空块不显示。所有 thinking 块都要**原样保存、下一轮原样回传**。
- **历史只能追加，不能修改**，这一点包括 thinking 块。改动历史会让缓存失效，thinking 块也会校验失败。
- **兼容降级**：用户填的自定义 Base URL（代理或兼容服务）可能不认识上面的 beta 头、`strict` 或 `display` 字段。沿用 `http.ts` 里 `compatOf()` 的做法：
  1. 收到 400，并且错误信息指向这些字段时，去掉对应字段重试一次。
  2. 把「这个服务不支持该字段」记到该服务的配置里，下次不再发送。
- **停止原因的处理：**
  - `stop_reason: "refusal"`：显示友好提示，可以带上 `stop_details.category`；这条响应里的工具调用不执行。
  - `max_tokens`：显示「回答被截断」。
  - Responses 协议下，`status: "incomplete"` 按同样方式处理。

**③ Responses 协议**

- 思考强度用 `reasoning: { effort }`。
- 工具转换成 `{ type: "function", name, description, parameters, strict: true }`。
- 模型发起的调用是 `function_call`，`arguments` 是 JSON 字符串。结果用 `function_call_output` 回传。

### 3.2 为什么新增 `say_to_user` 和 `submit_review`

PRD §7.3 原来列了 10 个工具，这次加了 3 个，`camera-tools.json` 里已经写好。除了下面两个，还有 `grade_task`，用于课程实拍任务的验收（见 §11.4）：

- **`say_to_user`**：原型里教练的节奏是「讲一句、指一个键、再讲一句」。在 Opus 5.5 上，两次工具调用之间超过一两句的讲解会进入 thinking 块，即使开了 `display: "updates"`，拿到的也只是摘要。讲解内容要原样到达用户，所以通过工具参数传递，因为工具参数不会被摘要。界面上把它渲染成普通的教练消息，看起来和原型完全一样。
- **`submit_review`**：复盘卡原来要求模型在最后输出一段 JSON 文本。改成 strict 工具之后，结构由 schema 保证，不用再从文本里解析 JSON，存库和渲染都更稳定。

两种协议用同一套工具，行为一致。

---

## 4. AI 教练

### 4.1 工具执行器

13 个工具的完整参数见 `docs/spec/camera-tools.json`。工具列表固定不变，课程验收时也不增减，这样提示词缓存才能命中。原型 `prototype/src/3-app.js` 里的 `execTool()` 就是执行器的参考实现。

| 工具 | 执行器做什么 | 返回给模型 |
|---|---|---|
| `say_to_user` | 渲染一条教练消息 | `{ok:true}` |
| `highlight_control` | 3D 高亮，同时把其他部件调暗 | `{ok:true, highlighted:[…]}` |
| `demonstrate_control` | 用 `src/camera/state.ts` 的 `act()` 改变状态，再把动画加入播放队列 | `{ok:true, changed:{iso:"100 → 6400", …}}` |
| `set_camera_view` | 切换 3D 视角，比原型多一个 `bottom`（看底部的电池仓） | `{ok:true, view}` |
| `set_virtual_settings` | 改虚拟相机状态；`scene_ev` 用来设定场景亮度 | `{ok:true, screen:{mode, aperture, shutter, iso, ev, bias, …}}` |
| `annotate_photo` | 在照片卡上画框和编号 | `{ok:true}` |
| `compare_exposure` | 显示调整前后的对比卡 | `{ok:true}` |
| `lookup_manual` | 在 `docs/spec/manual-kb.json` 里检索。算法原样移植`scripts/check-manual-kb.cjs` 里的 `search()`，放在 `src/ai/coach/kb.ts`，用 `docs/spec/manual-kb.tests.json` 做单测 | `{hits:[{title, where, text}]}`，最多 3 条，查不到返回 `{hits:[]}` |
| `get_camera_config` | 读取我的相机配置，MVP 阶段返回出厂默认值 | `{C1:"白平衡模式", C4:"触摸操作选择", playback:{C4:"删除", …}, …}` |
| `open_lesson` | 显示课时卡，带「去看看」按钮 | `{ok:true}` |
| `add_practice_task` | 写入今日任务，显示任务卡 | `{ok:true, task_id}` |
| `submit_review` | 写入 `reviews` 表，显示复盘卡（「要改」在前，「做得好」在后） | `{ok:true, review_id}` |
| `grade_task` | 课程实拍任务验收：写入 `lesson_progress`，显示通过或不通过；不通过时列出没达到的标准 | `{ok:true}` |

**执行规则：**

1. **参数校验**：参数一律先 `JSON.parse`，再用 ajv 按 schema 校验。失败时回传错误结果（Messages 协议设 `is_error: true`），把错误原因写清楚，让模型重新调用。不要直接丢掉。
2. **并行执行**：同一轮里的多个工具调用并行执行，所有结果放在**同一条**消息里回传。
3. **动画不阻塞**：动画类工具算完状态就立即返回结果，不等动画播完。动画进入当前 3D 视图的播放队列，按顺序播放。`demonstrate_control` 的 `changed` 由 TS 状态机同步算出来，所以不用等动画。
4. **轮数上限**：一次复盘大约有 10–20 次工具调用，设 `MAX_TOOL_ROUNDS = 20`。超过时停止并提示用户。
5. **数值范围**：数值范围写在各字段的 description 里，strict 模式不支持 `minimum` 这类约束，所以执行器要自己再检查一遍。例如光圈只能是 2.8–22，超出范围就回传错误。

### 4.2 提示词

按 PRD §7.5 的结构写在 `src/ai/coach/prompt.ts`。

- **固定部分放前面**：角色、讲解原则（语气略严格）、工具使用规则、部件字典（由 `controls.json` 生成）、镜头参数。缓存断点打在工具定义和系统提示词之后。
- **动态部分放在用户消息里**：EXIF JSON、`ev100`、直方图分位数、拍摄意图、照片。
- **工具使用规则**要写明：
  - 两次工具调用之间的讲解用 `say_to_user`。
  - 讲到具体操作必须先 `highlight_control`。
  - 参数有变化时用 `set_virtual_settings`。
  - 菜单路径只能来自 `lookup_manual`。
  - 复盘结束前调用一次 `submit_review`。
  - 用户消息标明「实拍任务验收」时，`submit_review` 之后再调用一次 `grade_task`，只按给出的 `ai_rubric` 判定。
- 不要加「每调用 N 次工具就总结一次」这类强制指令。

### 4.3 对话界面

和原型 AI 教练页（`#scr-ai`）一致：

- 流式文字、thinking 状态行。
- 工具卡片：默认折叠，显示「执行中 / 已完成」；展开后能看到参数。
- 内嵌 3D 卡片、照片标注卡、对比卡、任务卡、课时卡、复盘卡、usage 行。
- **同一时间只有一个实时 3D 视图**：对话里出现新的 3D 卡片时，上一张冻结成截图。原型里的 `freezeActive()` 和 `Cam.snapshot()` 就是这么做的。

---

## 5. 3D 相机

### 5.1 代码拆分

原型的 `prototype/src/2-camera.js` 拆成两部分：

| 去向 | 内容 | 运行在 |
|---|---|---|
| `src/camera/` | `CONTROLS`（改为读 `controls.json`）、档位表（`TV3L` / `APS` / `ISO3` / `AP_RING` / `FOCALS`…）、`solve()`、状态 `st`、`act()` | RN，纯 TS，有单测 |
| `src/camera3d/` | three.js 场景、GLB 加载（LOD0 / LOD1）、环境光、标签、拾取、轨道视角、高亮、按节点 `extras` 播放动画、`drawScreen()` 虚拟屏幕（贴到 `lcd_screen` 节点） | WebView |

- **状态归属**：虚拟相机状态只存在 RN 的 zustand store 里，WebView 只负责画。
- **用户操作的流程：**
  1. 用户在 3D 上转拨盘或按键。
  2. WebView 发 `input` 事件给 RN。
  3. RN 调 `act()` 算出新状态。
  4. RN 发 `sync` 给 WebView，WebView 重绘。
- 曝光实验室也调用同一个 `exposure.ts`，全工程只有一份曝光公式。
- **打包**：`scripts/build-camera3d.mjs` 用 esbuild 把 `src/camera3d/` 和 three.js 打成**一个**内联的 HTML，输出到 `android/app/src/main/assets/camera3d/index.html`。运行时不访问任何网络，字体也打包进去。GLB 和贴图体积大，不内联进 HTML：它们和 `index.html` 放在同一目录下，用相对路径加载。

### 5.2 消息桥协议

写法参照 QuantWise 的 `src/ui/math/bridge.ts`：`attach` / `receive` / `fail`、按请求 id 挂起、超时、WebView 崩溃时拒绝所有挂起的请求。

| 方向 | 消息 | 说明 |
|---|---|---|
| RN → Web | `{id, cmd:"sync", state}` | 整份状态，WebView 据此重绘屏幕、转盘和环的位置 |
| RN → Web | `{id, cmd:"highlight", ids, note, style}` | |
| RN → Web | `{id, cmd:"animate", control, kind, dir, steps}` | 播放转动或按压动画 |
| RN → Web | `{id, cmd:"view", view}` | |
| RN → Web | `{id, cmd:"labels", on}` / `{id, cmd:"dim", on}` | 标签模式；调暗其他部件 |
| RN → Web | `{id, cmd:"snapshot"}` | 返回 `data:image/jpeg` |
| RN → Web | `{id, cmd:"pause"}` / `{id, cmd:"resume"}` | 页面失去焦点时停止渲染循环 |
| Web → RN | `{ev:"ready"}` | RN 收到后立即发一次 `sync` |
| Web → RN | `{ev:"pick", control}` | 点中部件，打开详情抽屉 |
| Web → RN | `{ev:"input", control, op}` | 用户在 3D 上操作，`op` 的取值和原型 `act()` 一致 |
| Web → RN | `{id, ok, result \| error}` | 对某条 RN 请求的回应 |

- 请求超时 3 秒。
- WebView 进程退出（`onRenderProcessGone`）时，所有挂起请求失败，然后重新加载 WebView，收到 `ready` 后重新 `sync`。

### 5.3 WebView 实例

- 相机 Tab 一个实例；AI 对话一个实例，只给最新的那张 3D 卡片用。
- 页面失去焦点时发 `pause`。
- 实例数量和内存要在 M1 的性能验证（T1.7）里实测。如果中端机吃不消，再改成全局只用一个实例。

### 5.4 模型

- **模型必须和真机一模一样。** 规范、进度和验收标准都在 `docs/spec/camera-model.md`。原型里的程序化模型只用来说明交互，**不进 App**。
- **开发不等模型：**
  1. 第 2 周，先从原型导出一个占位 GLB。节点名和 `extras` 都按规范的格式来，App 从第一天起就走 GLB 加载这条路。
  2. 之后建模师交来的白模和终模，直接替换文件，App 不改代码。
- **动画数据只从 GLB 读。** 转轴、每格的角度、各档位的角度都写在节点的 `extras` 里，代码里不写死任何角度。
- **每一轮模型交付都先跑 `scripts/check-model.mjs`**，通过了再接入 App。
- **发布条件：** M4 结束前必须换成用户签字通过的模型，否则不发布。

---

## 6. 照片预处理

1. **选图**：用 `@react-native-documents/picker`。MVP 必须支持 JPEG；HEIF 和 ARW（取内嵌预览图）如果原生解码不顺，先降级为提示「请导出 JPEG」。
2. **原生模块 `PhotoPrep`（Kotlin）**：写法参照 QuantWise 的 `android/app/src/main/java/com/quantwise/files/DocumentStoreModule.kt`。
   - 调用：`prepare(uri, { maxEdge: 1568, quality: 85, crop: { cx, cy, size: 512 } | null })`
   - 返回：
     - `full: { path, w, h }`：缩放后的 JPEG 文件。重新编码后 EXIF 自然就去掉了，GPS 和序列号都不会上传。
     - `crop: { path } | null`：从原图裁出的 512×512 区域，100% 像素。
     - `histogram: { p5, p50, p95, clipLow, clipHigh }`：亮度分位数和溢出比例。
     - `head: base64`：原文件前 256KB，交给 exifreader 解析 EXIF。
3. **EXIF**：用 exifreader 解析，结构化成 PRD §7.6 的 JSON，并加一个字段 `ev100 = log2(N² / t) − log2(ISO / 100)`。
4. **对焦点**：能否从 Sony MakerNote 读出对焦点坐标还不确定。M3 第一天用真实的 α7 V JPEG 验证。读不到时不发裁切图，并在 EXIF JSON 里写 `af_point: null`。

---

## 7. 本地存储（op-sqlite）

| 表 | 主要字段 |
|---|---|
| `settings` | `k`、`v` |
| `services` | 沿用 QuantWise `services.ts` 的结构；Key 存 Keychain，不进库 |
| `threads` | `id`、`kind`（review / chat）、`title`、`created_at` |
| `messages` | `id`、`thread_id`、`role`、`raw_json`（模型原始内容，原样回传）、`created_at` |
| `photos` | `id`、`thread_id`、`src_uri`、`full_path`、`crop_path`、`exif_json`、`histogram_json` |
| `reviews` | `id`、`thread_id`、`photo_id`、`review_json`（`submit_review` 的参数）、`tags`、`created_at` |
| `lesson_progress` | `lesson_id`、`section`、`status`、`score`、`updated_at` |
| `tasks` | `id`、`title`、`steps_json`、`success_criteria`、`source`（lesson / ai）、`done_at` |
| `camera_config` | `json`（C 键分配等，MVP 写入出厂默认值） |

隐私要求：「我的」页面提供「清除全部复盘历史」，一键删除 `threads`、`messages`、`photos`、`reviews` 里的数据和照片文件。

---

## 8. 界面：和原型的对应关系

| App 页面 | 原型位置 | 备注 |
|---|---|---|
| 学习 Tab | `#scr-home` | 学习路径 L0–L14，其中 L12–L14 锁定；今日任务 |
| 相机 Tab | `#scr-cam` | 3D、视角按钮、标签、详情抽屉（`#sheet`）、参数读数、练习条 |
| 屏幕详解 | `#lcdView` | 点触摸屏进入；DISP 4 种显示 |
| 实验室 Tab | `#scr-lab` | 改用 RN + react-native-svg 实现，曝光公式用 `exposure.ts` |
| AI 教练 Tab | `#scr-ai` | 见 §4.3；选图面板只做「手机相册」，USB-C / Wi-Fi 入口 MVP 不显示 |
| 我的 Tab | `#scr-me` | 模型与 API、思考强度、连接测试、清除历史 |

- **视觉**：App 内用原型 `prototype/src/1-shell.html` 里的深色 `--app-*` 色值，搬到 `src/ui/theme.ts`。
- **字体**：Saira Semi Condensed（数字和参数）、Noto Sans SC、IBM Plex Mono，都打包进 App。

---

## 9. 本地假模型服务

把 QuantWise 的 `scripts/mock-ai.cjs` 拷过来改，原则是不花钱也能把 AI 教练全流程跑通：

1. 现有的 `/v1/messages` 保留，新增 `/v1/responses`，按 Responses 协议输出 SSE。
2. 把原型 `3-app.js` 里的 `SCRIPTS`（p1 逆光人像、p2 夜景糊片、p3 风景前景虚，以及各自的追问）改写成两种协议的 SSE 序列。序列里要包含 thinking 进度块、`say_to_user`、并行工具调用和 `submit_review`。
3. 再加三个异常场景：`refusal`、`max_tokens` 截断、工具参数不合法（用来测 ajv 回传错误后模型重新调用）。
4. 加一个课程验收场景：`submit_review` 之后调用 `grade_task`，通过和不通过各一条。
5. 在模拟器里，Base URL 填 `http://10.0.2.2:8787`。

---

## 10. 任务拆分和完成标准

### M1 工程与 3D 相机（第 2–5 周）

| 编号 | 任务 | 完成标准 |
|---|---|---|
| T1.1 | 工程骨架：5 个 Tab、主题、字体 | 真机启动，5 个 Tab 能切换，配色和原型一致 |
| T1.2 | 移植 AI 协议层（§3），设置页 | protocol / stream 单测全部通过；设置页能对 Messages 和 Responses 各发一条测试请求并显示延迟 |
| T1.3 | `src/camera/`：部件字典、曝光求解、`act()` | 单测覆盖 §12 的全部曝光用例，以及模式转盘、ISO AUTO、拨轮四向 |
| T1.4 | 3D 打包脚本、消息桥、相机 Tab | 加载占位 GLB；F-3D-01 至 F-3D-05、F-3D-07、F-3D-08 全部可用；断网可用；动画数据全部来自 GLB 的 `extras` |
| T1.5 | 虚拟屏幕联动、屏幕详解 | F-3D-06、F-SCR-01、F-SCR-02：转拨盘时读数实时变化，DISP 4 种都能切换 |
| T1.6 | 找键练习 | F-3D-09：10 题，计时计分，8 分及以上完成任务 |
| T1.7 | 性能验证 | 在骁龙 7 系手机上，交出相机 Tab 的帧率、首次加载时间，以及开两个 WebView 时的内存数字，结论写进 `docs/spike-perf.md`。用白模 v1，或者面数达到 camera-model.md §7 预算上限的模型来测 |
| T1.8 | Wi-Fi 直连导入技术验证（2 天） | 只出结论，不写正式代码：PTP/IP 能不能在 Android 上列出并下载 α7 V 里的照片，结论写进 `docs/spike-wifi.md` |
| T1.9 | 占位 GLB 和模型检查脚本 | 从原型导出占位 GLB，`scripts/check-model.mjs` 对它跑通（尺寸检查先跳过）；白模 v1 到了以后替换，App 不改代码 |

### M2 课程与实验室（第 6–9 周）

| 编号 | 任务 | 完成标准 |
|---|---|---|
| T2.1 | 课程引擎（四段式，数据格式见 §11） | 能加载 `content/lessons/*.json`，四段都能走完，进度写入库 |
| T2.2 | 课程里的按键名可以点 | 点 `[[btn_fn]]` 这类链接会跳到相机 Tab 并高亮对应部件 |
| T2.3 | 今日任务 | 来自课程和 AI 的任务都能显示、打勾 |
| T2.4 | 曝光实验室 | F-LAB-01 至 F-LAB-05；4 个场景的读数和 §12 的用例一致 |
| T2.5 | 上线 L0–L5 | `content/lessons/L0.json` 至 `L5.json` 都能完整学完，实拍任务能走通 AI 验收 |
| T2.6 | 接入正式模型 | 第 9 周用户签字后替换占位模型；按 camera-model.md §7 第 5 条，在 App 里逐个核对活动部件，转动方向、格数、档位都和实物视频一致 |

### M3 AI 教练（第 10–11 周）

| 编号 | 任务 | 完成标准 |
|---|---|---|
| T3.1 | 图片 Part 和三种协议的映射 | 单测：同一份历史分别构建 Messages / Responses 请求，图片字段和 §3.1 完全一致 |
| T3.2 | `PhotoPrep` 原生模块、EXIF、直方图 | 用 10 张真实 α7 V JPEG 测试：EXIF 字段齐全，上传的图里没有 GPS，同一张图两次预处理的字节相同 |
| T3.3 | 13 个工具的执行器和 ajv 校验 | 单测：每个工具至少一个正常用例、一个非法参数用例 |
| T3.4 | 对话界面（§4.3） | 用 mock 服务把 3 个示例在两种协议下各跑一遍，效果和原型一致 |
| T3.5 | 提示词，真实模型评审 | 用真实模型复盘 10 张真实照片，PM 按 §12 的 AI 检查项人工打分，通过率 ≥ 8/10 |

### M4 打磨（第 12–14 周）

| 编号 | 任务 | 完成标准 |
|---|---|---|
| T4.1 | 性能优化 | 达到 PRD §8：中端机 60fps，3D 页首次加载 ≤ 2 秒 |
| T4.2 | 无障碍 | 3D 部件可切换成按区域分组的列表，TalkBack 能逐个读出 |
| T4.3 | 隐私 | 「清除全部复盘历史」可用；日志里不出现 Key 和照片内容 |
| T4.4 | 真机测试，修 Bug | 2 台不同品牌的 Android 手机走完全部主流程，没有 P0 / P1 级问题 |
| T4.5 | 模型终验 | 发布版用的是签字通过的模型；`check-model.mjs` 通过；LOD0 在中端机上达到 60fps |

菜单模拟器和成长报告属于 V1，M4 不做。PRD §11 已经同步修改。

---

## 11. 课程数据格式

L0–L5 已经写好：`content/lessons/L0.json` 至 `L5.json`。

- 源文件是 `content/lessons/build.cjs`，由 PM 维护。运行 `node content/lessons/build.cjs` 生成 JSON，同时做以下校验：
  - 工具参数符合 schema。
  - 部件 id、档位和 `[[链接]]` 都存在。
  - 正文里的曝光和景深数字逐条验算。
  - 练习题有解。
- App 只读 JSON，不依赖 `build.cjs`。

### 11.1 每课的字段

| 字段 | 说明 |
|---|---|
| `id`、`title`、`minutes`、`goals[]` | 课时编号、标题、预计分钟数、学习目标 |
| `sections` | 固定四段，顺序是 `demo` → `read` → `practice` → `task` |
| `needs_verification[]` | 本课里待 PM 对照帮助指南核对的事实。App 不显示；核对完后会清空 |

### 11.2 四段内容

| kind | 字段 | App 怎么做 |
|---|---|---|
| `demo` | `steps[]`，每步是 `{tool, args}` | 依次交给 AI 教练的工具执行器（§4.1）。`args` 已按 `camera-tools.json` 补齐 null，能直接通过 ajv 校验。`say_to_user` 渲染成讲解气泡；用户点「下一步」推进 |
| `read` | `markdown` | 渲染 Markdown，要支持表格。`[[部件 id]]` 渲染成可以点的部件名，点了跳到相机 Tab 并高亮 |
| `practice` | `items[]` | 题型见 11.3。不设及格线：答错显示解析，可以重做，全部答完这一段就算完成 |
| `task` | `title`、`steps[]`、`success_criteria`、`photos`、`complete_by`、`ai_rubric[]` | 见 11.4 |

### 11.3 练习题型

| type | 字段 | 怎么判对 |
|---|---|---|
| `find_control` | `target` | 用户在 3D 上点中 `target` |
| `choice` | `q`、`options[]`、`answer`（下标）、`explain` | 选中 `answer`；选完立即显示 `explain` |
| `operate` | `prompt`、`control`、`start{}`、`expect{}`、`hint` | 先把虚拟相机设成 `start`；用户操作 `control` 之后，状态满足 `expect`。字段名和 `set_virtual_settings` 一样 |
| `set_exposure` | `prompt`、`scene_ev`、`mode`、`start{aperture, shutter, iso, ev}`、`lock[]`、`goal{}`、`explain`、`_example_solution` | 用户调整没有锁定的参数，用 `exposure.ts` 求解，结果满足 `goal` |

`goal` 里各字段的含义，出现几个就要同时满足几个：

| 字段 | 含义 |
|---|---|
| `bias: [最小, 最大]` | 曝光偏差的范围，正数表示过曝 |
| `shutter_max_time` | 快门时间不能比它长，比如 `'1/1000'` |
| `shutter_min_time` | 快门时间不能比它短 |
| `aperture_min` / `aperture_max` | F 数的下限 / 上限 |
| `iso_max` | ISO 上限 |

- 求解结果带警告（相机已经到极限）时，一律判错。
- `_example_solution` 是 `build.cjs` 穷举找到的一组解，可以直接当单测数据。

### 11.4 实拍任务和课时完成

| `complete_by` | 怎么算完成 |
|---|---|
| `ai` | 用户上传 `photos` 张照片（最多 4 张），走 AI 复盘流程。用户消息里附上「实拍任务验收」、`success_criteria` 和 `ai_rubric`。AI 先调用 `submit_review`，再调用 `grade_task`；`passed: true` 才算完成。不通过时显示 `unmet` 列表，可以重新上传 |
| `practice_mode` | 相机 Tab 的找键练习拿到 10/10（L1） |
| `self` | 用户自己点「我完成了」。L0–L5 暂时没用到 |

**课时完成**：四段都完成，就算这一课完成，然后解锁下一课。

## 12. 测试

### 12.1 单元测试（jest）

- **协议层**：图片映射；工具格式转换（strict、`additionalProperties`）；thinking 进度块的解析和原样回传；`function_call` 参数的增量拼接；refusal 和 `max_tokens` 的处理。
- **工具循环**：同一轮的工具结果合并成一条消息；`is_error` 回传；refusal 时不执行工具；达到轮数上限时停止。
- **工具定义**：
  - `camera-tools.json` 里 `control_ids` 的枚举必须等于 `controls.json` 的 id 列表。
  - 每个对象都满足 `additionalProperties: false`，且所有属性都在 `required` 里。
  - 不出现 `minimum`、`maxLength` 等 strict 模式不支持的约束。
- **课程数据**：所有 `demo` 步骤的参数都能通过 ajv 校验；`set_exposure` 题用 `_example_solution` 代入 `exposure.ts`，结果满足 `goal`。
- **曝光求解**：以下用例来自原型。快门取最接近的 1/3 档，ISO AUTO 时最慢快门 1/60，ISO 上限 12800。

| 场景 EV | 模式 | 设定 | 期望结果 |
|---|---|---|---|
| 14 | A | F2.8，ISO 100，补偿 0 | 1/2000 |
| 14 | A | F2.8，ISO 100，补偿 +1.3 | 1/800 |
| 3 | P | ISO 800 | F2.8，1/8 |
| 3 | S | 1/60，ISO AUTO | ISO 6400 |
| 3 | A | F2.8，ISO 100 | 1" |
| 15 | A | F2.8，ISO 100 | 1/4000 |
| 15 | A | F8，ISO 100 | 1/500 |

### 12.2 AI 检查项（T3.5 人工评审用）

1. 第一段先讲最影响成片的问题；问题严重时直说「这张不能用」。
2. 每个问题都落实到部件、方向和档位，并且有对应的 `highlight_control`。
3. 菜单路径都来自 `lookup_manual` 的结果，没有编造的路径。
4. 引用的 EXIF 数值和照片实际数据一致。
5. 调用了一次 `submit_review`，「需改进」排在前面，打分没有虚高。

---

## 13. 约束

- **相机事实不写死在代码里**：按键功能、位置、档位都放在 `controls.json` 和知识库里。`verified: false` 的条目可以先用，上线前由 PM 逐项核对。
- **运行时只访问一个网络地址**：用户配置的模型服务。3D、字体、课程全部离线。
- **API Key**：只存 Keychain，界面只显示后 4 位，日志里用 `http.ts` 的 `redact()` 脱敏。
- **对话历史**：只追加，不修改；thinking 块原样回传；图片字节每次都要一致。
- **商标**：模型上的品牌标识放在 `decal_brand` 节点里。个人使用的构建显示，公开上架必须隐藏（PRD §12）。界面里不用 Sony 标志。

---

## 14. 已知的不确定点

需要 Astra 在对应阶段给出结论：

| 问题 | 什么时候验证 | 走不通怎么办 |
|---|---|---|
| WebView 3D 在中端机上的帧率和内存 | M1，T1.7 | 改成单实例；面数再降；最后才考虑换 react-native-filament |
| Wi-Fi 直连导入 | M1，T1.8 | V1 只做 USB-C，加 Creators' App 中转 |
| 精模的建模人选和进度 | 第 2 周定人，第 9 周签字 | 开发继续用占位模型；M4 结束前没有签字通过的模型就不发布 |
| Sony MakerNote 能不能读出对焦点 | M3 第一天 | 不发裁切图，`af_point: null` |
| 代理或兼容服务是否支持 beta 头和 `strict` | M1，T1.2 | 用 `compatOf` 降级；ajv 校验始终保留 |

---

## 15. PM 后续要交付的内容

| 内容 | 交付时间 | 文件 |
|---|---|---|
| ~~L0–L5 课程正文、练习题、实拍任务~~ | **已交付（2026-11-24）** | `content/lessons/L0.json` 至 `L5.json`；原稿 29 项已逐条处理，出处与修订结果见 [知识库核对报告](kb-verify-report.md) |
| ~~`lookup_manual` 知识库~~ | **已交付（2026-11-24）** | `docs/spec/manual-kb.json`，86 个条目、372 条菜单索引。验收命令为 `node scripts/check-manual-kb.cjs` |
| `controls.json` 逐项核对（对照官方帮助指南和实机） | M4 结束前 | `docs/spec/controls.json`，核对完把 `verified` 改为 `true`。位置用参考照片包核对 |
| 参考照片包（用户拍） | 第 2 周 | `docs/reviews/assets/model-ref/`，清单见 camera-model.md §2 |
| 建模人选和预算（用户决定） | 第 2 周 | 见 camera-model.md §1 |
| Fn 菜单出厂排列（用户在实机上拍照） | M2 开始前 | 补进 `manual-kb.json` 的 `fn_menu` 条目和原型 |

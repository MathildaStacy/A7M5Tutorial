# 快门学院 · 产品需求文档（PRD）

| 项目 | 内容 |
|---|---|
| 产品 | 快门学院，Android App |
| 版本 | v0.4（v0.2 确认了名称、视频课程、相机直连导入、AI 语气；v0.3 补开发交接：工具定义、M4 范围；v0.4 要求 3D 模型和真机一模一样，见 §10） |
| 开发交接 | `docs/DEV-HANDOFF.md`；工具定义 `docs/spec/camera-tools.json`；部件字典 `docs/spec/controls.json`；课程 L0–L5 `content/lessons/` |
| 日期 | 2026-11-24 |
| 适配器材 | Sony α7 V（ILCE-7M5）+ FE 24-70mm F2.8 GM II（SEL2470GM2） |
| 配套原型 | `prototype/index.html`（可交互 HTML 原型） |

---

## 1. 背景与问题

用户刚买了 α7 V 和 24-70 GM II，此前没有用过相机。面临的问题：

1. **按键太多，不知道每个是干嘛的。** 机身上有 3 个拨盘、1 个控制拨轮、1 个模式转盘、1 个摇杆，还有十几个按键，其中大部分可以自定义。说明书是按菜单项组织的，没法回答"我手指底下这个键是什么"。
2. **曝光参数听不懂。** 光圈、快门、ISO 是三个互相牵制的抽象概念，光看文字很难建立直觉。
3. **拍完不知道好坏。** 没人点评，不知道哪里做对了、哪里做错了，更不知道"错了以后应该按哪个键去改"。
4. **网上教程不针对这台机器。** 菜单路径、按键位置、默认功能每代机型都不一样，照着别的机型的教程操作经常对不上。
5. **菜单层级深。** 新版 Sony 菜单有 7 个大类、上百个设置项，小白不知道哪些该改、哪些别碰。

**产品定位：一台装在手机里、可以随便按的 α7 V，加一位看得懂你照片、会指着按键教你的私人教练。**

---

## 2. 目标用户

**主要用户：需求方本人。**

- 相机零基础，有手机拍照经验，对构图有一点直觉
- 愿意花 3–6 个月系统学习
- 目标：能熟练用 M 档 / A 档独立拍人像、风景、街拍、夜景，知道每种场景该怎么设置，拍完能自己判断问题

**典型场景：**

| 场景 | 用户在想什么 | 产品怎么帮 |
|---|---|---|
| 刚开箱 | "这么多键，先从哪开始？" | 开箱引导课，3D 模型逐个点亮按键 |
| 出门前 | "今天拍街景，该怎么设？" | 场景预设卡片，告诉你转哪个拨盘到哪一格 |
| 拍完一张 | "这张为什么糊了？" | 上传给 AI 教练，AI 分析 EXIF 和画面，在 3D 相机上指出该调的键 |
| 睡前 | "光圈到底是怎么回事？" | 曝光实验室里拖动滑块，实时看虚化、拖影、噪点变化 |
| 碰到问题 | "屏幕右下角那个图标是什么？" | 点 3D 模型上的屏幕，进入图标详解 |

---

## 3. 产品目标与成功指标

**北极星指标：用户独立完成的"场景实拍任务"数量**（用真机拍摄、上传，AI 验收通过）。

| 指标 | 定义 | MVP 目标 |
|---|---|---|
| 课程完成率 | 已完成课时 / 已开始课时 | ≥ 70% |
| 3D 互动深度 | 每次会话中点选的不同部件数 | ≥ 5 |
| AI 复盘使用 | 每周上传照片复盘次数 | ≥ 3 |
| 问题复现率下降 | 某类问题（如欠曝、手抖糊片）在后续照片中的出现比例 | 4 周内下降 50% |
| 手动档占比 | 上传照片 EXIF 中 M/A/S 档的占比 | 从 0% 增长到 ≥ 60% |

---

## 4. 版本范围

| 模块 | MVP（M1–M4） | V1 | V2 |
|---|---|---|---|
| 3D 相机 | 机身 + 镜头模型，全部部件可点选和说明，拨盘和开关可操作，虚拟屏幕联动 | 拆装镜头动画、电池和存储卡仓 | 多机型（α7C II、α7R V 等） |
| 屏幕与菜单 | 拍摄界面图标详解、DISP 切换 | 完整菜单模拟器、Fn 菜单编辑 | 菜单搜索（"我想关掉提示音"→ 路径） |
| 课程 | L0–L5（开箱 → 曝光 → 对焦） | L6–L11（测光、色彩、场景实战、自定义键） | L12–L14 视频拍摄；RAW 后期入门 |
| 曝光实验室 | 光圈 / 快门 / ISO 模拟，4 个场景 | 景深计算器、安全快门计算 | 闪光灯、ND 滤镜 |
| AI 教练 | 照片复盘 + 3D 联动 + 追问 | 成长报告、问题标签统计 | 连拍组片对比、拍摄前实时建议、短视频抽帧复盘 |
| 照片导入 | 从手机相册选图 | USB-C 线直连导入；Wi-Fi 直连导入（先做技术验证） | 拍完自动导入、按拍摄时间分组 |
| 设置 | Messages API / Responses API，自填 Key | 我的 C 键映射，AI 按用户的实际配置给建议 | 多模型切换、本地缓存 |

---

## 5. 信息架构

底部导航 5 个 Tab：

```
学习        相机         实验室       AI 教练       我的
 ├ 学习路径   ├ 3D 探索     ├ 曝光三角    ├ 对话列表     ├ 模型与 API
 ├ 今日任务   ├ 部件字典    ├ 景深计算    ├ 新复盘       ├ 我的相机配置
 ├ 课程详情   ├ 屏幕详解    └ 安全快门    ├ 复盘详情     ├ 学习偏好
 └ 实拍任务   └ 菜单模拟                  └ 成长报告     └ 关于
```

**跨模块跳转：**

- 课程里出现的任何按键名称都可以点，点了跳到 3D 相机并高亮那个部件
- 3D 部件详情底部有"问 AI"，把部件作为上下文带进 AI 教练
- AI 教练的工具调用直接驱动嵌在对话里的 3D 相机卡片
- AI 复盘里的"下次练习"一键加入今日任务

---

## 6. 功能需求

### 6.1 3D 相机（F-3D）

#### 6.1.1 基础交互

| 编号 | 需求 | 说明 |
|---|---|---|
| F-3D-01 | 模型展示 | 机身 + 镜头组合模型，PBR 材质，接近实物的质感 |
| F-3D-02 | 视角控制 | 单指拖动旋转、双指缩放、双击复位；快捷视角：正面 / 顶部 / 背面 / 左侧 / 右侧 / 镜头侧 |
| F-3D-03 | 部件点选 | 点任意部件：部件高亮（描边 + 呼吸光），其他部件变暗，弹出底部详情抽屉 |
| F-3D-04 | 详情抽屉 | 名称、所在位置、出厂默认功能、新手建议设置、常见误操作、关联课程、"问 AI"按钮 |
| F-3D-05 | 可操作部件 | 拨盘可拖动旋转（带档位感和震动反馈），按键可按下，开关可拨动，变焦环可转动 |
| F-3D-06 | 虚拟屏幕联动 | 操作部件后，虚拟屏幕上的参数实时变化（转前拨盘 → 光圈值变，转变焦环 → 焦距变） |
| F-3D-07 | 标签模式 | 一键显示所有部件的名称标签，适合"认键"阶段 |
| F-3D-08 | 搜索 | 输入"曝光补偿"、"白平衡"，定位到对应部件 |
| F-3D-09 | 练习模式 | 出题："请找到 AF-ON 按钮"，用户在 3D 模型上点选，计时计分 |
| F-3D-10 | 和真机一模一样 | 外形、尺寸、按键位置、刻字、材质、每个活动部件的转动方式都和实物一致；用户拿真机对照签字才算通过（`docs/spec/camera-model.md`） |

#### 6.1.2 部件清单（α7 V 机身）

> 出厂默认功能为初始数据，**开发时需逐项对照 Sony 官方《帮助指南》和实机核对**。不同固件版本可能不同，所有默认值都存在可热更新的配置文件里。

| 部件 ID | 名称 | 位置 | 默认功能 | 新手建议 |
|---|---|---|---|---|
| `power` | 电源开关 | 顶部，快门按钮外圈 | 开 / 关 | — |
| `shutter` | 快门按钮 | 顶部握把 | 半按：对焦 + 测光；全按：拍摄 | 先半按，看左下对焦指示，确认合焦后按到底 |
| `dial_front` | 前拨盘 | 握把前方，快门按钮下 | A / M 档调光圈 | 保持默认 |
| `dial_rear_l` | 后拨盘 L | 顶部右后，拇指位 | S / M 档调快门速度 | 保持默认 |
| `dial_rear_r` | 后拨盘 R（可锁定） | 顶部最右侧 | 曝光补偿 | 锁住，避免误转 |
| `mode_dial` | 模式转盘 | 顶部，取景器右侧 | 智能自动 / P / A / S / M / 1 / 2 / 3 | 从 A 档开始学 |
| `mode_switch` | 静态 / 动态 / S&Q 切换 | 模式转盘下方的旋钮 | 按住前方解锁钮再旋转，选拍照、录像或 S&Q（慢快动作或缩时） | 先固定在拍照 |
| `btn_c2` | C2 自定义键 | 顶部 | 对焦区域 | — |
| `btn_movie` | MOVIE 录像键 | 顶部 | 开始 / 停止录像 | — |
| `btn_menu` | MENU | 背面左上 | 打开菜单 | — |
| `btn_c1` | C1 自定义键 | 背面右上 | 白平衡模式 | — |
| `btn_c3` | C3 自定义键 | 背面左上，MENU 旁 | 拍照选对焦模式，回放保护照片 | — |
| `btn_ael` | AEL | 背面右上 | AE锁定保持 | 按住锁定曝光 |
| `btn_afon` | AF-ON | 背面右上 | 启动自动对焦 | 进阶课程介绍"后键对焦" |
| `joystick` | 多功能选择器（摇杆） | 背面右侧 | 移动支持的对焦区域，按下执行「对焦标准」 | — |
| `btn_fn` | Fn | 背面 | 快捷功能菜单 | 新手最常用，第一课就学 |
| `wheel` | 控制拨轮 | 背面右下 | 拍照时上键 DISP、左键拍摄模式、右键 ISO，下键和转动未设定 | 菜单中可调值，录像左键为自拍定时 |
| `btn_center` | 中央按钮 | 控制拨轮中间 | 拍照时未设定 | 菜单中按它确认 |
| `btn_play` | 回放 | 背面 | 回看照片 | — |
| `btn_c4` | C4 / 删除 | 背面右下 | 拍照为「触摸操作选择」，回放为「删除」 | — |
| `lcd` | 触摸屏 | 背面，4 轴多角度翻转 | 显示与触控 | 进入"屏幕详解" |
| `evf` | 电子取景器 | 背面顶部 | 取景，含眼部传感器自动切换 | 第一课教调屈光度 |
| `diopter` | 屈光度调节 | 取景器侧面 | 让取景器画面清晰 | — |
| `hotshoe` | 多接口热靴 | 顶部中央 | 闪光灯、麦克风 | — |
| `lens_release` | 镜头释放按钮 | 正面卡口旁 | 按住旋转卸下镜头 | — |
| `card_door` | 存储卡仓 | 右侧 | 卡槽 1：CFexpress A / SD；卡槽 2：SD | — |
| `ports` | 接口仓 | 左侧 | HDMI type A、耳机、麦克风、USB PORT 1（10 Gbps）、USB PORT 2（480 Mbps） | 两个 USB-C 口均可关机充电 |
| `battery_door` | 电池仓 | 底部 | NP-FZ100 电池 | — |

#### 6.1.3 部件清单（24-70 GM II 镜头）

镜筒从前往后依次是对焦环、变焦环、光圈环。从机身后方看，AF/MF 和 IRIS LOCK 在左侧，CLICK 和 SMOOTH/TIGHT 在右侧。[索尼说明书图 A](https://www.sony.com/electronics/support/res/manuals/5032/9ace66bf3f931b8ffbae5367023ab348/50328823M.pdf#page=1)

| 部件 ID | 名称 | 默认功能 | 新手建议 |
|---|---|---|---|
| `ring_zoom` | 变焦环 | 24 / 35 / 50 / 70mm | 学习课"不同焦段的视角差异" |
| `ring_focus` | 对焦环 | MF 时手动对焦；AF 时可设置为直接手动对焦（DMF） | — |
| `ring_aperture` | 光圈环 | A（由机身控制）或 F2.8–F22 | 新手放在 A，用机身前拨盘调光圈 |
| `sw_iris_lock` | 光圈锁 | 锁定在 A 位置，或禁止拨到 A | 锁在 A，避免误碰 |
| `sw_click` | 光圈环段落感开关 | ON 有档位感，OFF 可平滑调节 | 保持 ON |
| `sw_focus_mode` | AF / MF 切换 | 自动 / 手动对焦 | 保持 AF |
| `btn_focus_hold` | 对焦保持按钮（2 个） | 按住锁定当前对焦距离，可自定义 | 进阶可设为"眼部对焦" |
| `sw_zoom_smooth` | 变焦手感开关 | SMOOTH / TIGHT | 按个人手感 |
| `hood` | 遮光罩 | 挡杂光、保护镜片 | 户外始终装上 |

### 6.2 屏幕与菜单（F-SCR）

| 编号 | 需求 | 说明 |
|---|---|---|
| F-SCR-01 | 拍摄界面详解 | 渲染与实机一致的拍摄信息界面，点每个图标弹出解释（拍摄模式、快门、光圈、曝光补偿、ISO、电池、剩余张数、对焦模式、对焦区域、白平衡、测光模式、防抖、文件格式……） |
| F-SCR-02 | DISP 切换 | 模拟按 DISP（控制拨轮上方）在"全部信息 / 无信息 / 直方图 / 水平仪"之间切换 |
| F-SCR-03 | 菜单模拟器 | 复刻 7 个主分类：拍摄、曝光 / 颜色、对焦、回放、网络、设置、我的菜单；可以逐级点进去，每项带说明和新手建议值 |
| F-SCR-04 | Fn 菜单 | 模拟 Fn 菜单的 12 个格子，可编辑排列，和"我的相机配置"同步 |
| F-SCR-05 | 开箱必改清单 | "开箱建议修改的 15 项设置"，每项给出菜单路径，在模拟器里一步步带用户走 |
| F-SCR-06 | 菜单搜索（V2） | 用自然语言搜设置项："关掉对焦提示音" → MENU › 设置 › 声音选项 › 音频信号(拍摄) |

### 6.3 课程体系（F-LRN）

每个课时由四部分组成：**3D 演示 → 图文讲解 → 互动练习 → 实拍任务**。实拍任务需要用户用真机拍摄并上传，由 AI 验收。

| 等级 | 主题 | 主要内容 | 实拍任务示例 |
|---|---|---|---|
| L0 | 开箱 | 充电、装电池和存储卡、装镜头、开机、语言和日期、格式化存储卡、调屈光度 | 拍一张桌面上的杯子 |
| L1 | 认识机身 | 每个按键和拨盘，3D 找键练习 | 3D 练习满分 |
| L2 | 第一张照片 | 智能自动 → P 档，半按对焦，看回放 | 拍 10 张不同物体，全部对焦清晰 |
| L3 | 曝光三要素 | 光圈、快门、ISO 的含义和相互关系 | 同一场景用 F2.8 和 F11 各拍一张 |
| L4 | A 档与 S 档 | 光圈优先、快门优先、何时用哪个 | A 档拍虚化背景人像；S 档拍流水 |
| L5 | 对焦系统 | AF-S、AF-A、AF-C、DMF、MF，对焦区域及被摄体识别 | 用 AF-C + 眼部识别拍走动的人 |
| L6 | 测光与曝光补偿 | 测光模式、直方图、斑马纹、曝光补偿 | 逆光人像，用曝光补偿救回脸部 |
| L7 | 色彩 | 白平衡、创意外观 | 同一场景分别用自动白平衡和日光白平衡拍 |
| L8 | 用好 24-70 | 焦段视角与透视、光圈环、对焦保持、最近对焦距离 | 同一主体用 24 / 35 / 50 / 70 各拍一张 |
| L9 | M 档 | 全手动曝光、Auto ISO + M 档 | 夜景用 M 档拍 |
| L10 | 场景实战 | 人像、风景、街拍、夜景、运动、美食 | 每个场景一组作品 |
| L11 | 自定义 | C 键、我的菜单、MR 记忆模式（转盘 1 / 2 / 3） | 配置一套自己的按键方案 |

**视频课程（V2，已确认要做）**：同样按四段式上课，实拍任务改为上传 10–30 秒的短视频，由 AI 抽帧复盘。具体档位和菜单名按 α7 V 帮助指南核对。

| 等级 | 主题 | 主要内容 | 实拍任务示例 |
|---|---|---|---|
| L12 | 视频入门 | 静态 / 动态 / S&Q 拨杆、MOVIE 键、分辨率和帧率；快门设为帧率 2 倍的倒数（25p 用 1/50，即 180° 快门） | 用 25p、1/50 拍一段 10 秒街景 |
| L13 | 视频对焦与防抖 | AF 过渡速度、主体切换灵敏度、主体识别；机身防抖的增强档；手持运镜 | 跟拍一个走路的人，脸全程清晰 |
| L14 | 画面风格与收音 | 镜头光圈段落感开关拨到 OFF 做无级调光圈；ND 滤镜；S-Cinetone 和 Log 的区别；热靴麦克风 | 同一场景用标准风格和 S-Cinetone 各拍一段 |

### 6.4 曝光实验室（F-LAB）

| 编号 | 需求 | 说明 |
|---|---|---|
| F-LAB-01 | 场景选择 | 晴天户外（EV 15）、阴天（EV 12）、室内（EV 7）、夜景街头（EV 4） |
| F-LAB-02 | 参数调节 | 光圈 F2.8–F22、快门 30s–1/8000s、ISO 100–51200，用拨盘样式控件，和真机手感一致 |
| F-LAB-03 | 实时效果 | 画面亮度随曝光变化；背景虚化随光圈变化；运动主体拖影随快门变化；噪点随 ISO 变化 |
| F-LAB-04 | 测光表 | 显示曝光偏差 −3 到 +3 EV，和相机屏幕上的 M.M. 指示一致 |
| F-LAB-05 | 解释文案 | 每次调参后用一句话说明发生了什么："光圈从 F2.8 收到 F8，进光少了 3 档，所以背景变清晰、画面变暗" |
| F-LAB-06 | 景深计算（V1） | 输入焦距（24–70）、光圈、对焦距离，计算前后景深（全画幅弥散圆 0.03mm） |
| F-LAB-07 | 安全快门（V1） | 按焦距和防抖档位估算手持安全快门 |

**曝光计算：**

```
设置 EV = log2(N² / t) − log2(ISO / 100)
曝光偏差 = 场景 EV − 设置 EV          # > 0 过曝，< 0 欠曝
```

### 6.5 AI 拍摄教练（F-AI）

这是产品的核心差异化功能。交互形式参考 Agent 对话框：用户上传照片，AI 一边分析一边调用工具，在嵌在对话里的 3D 相机上指出要调的键、在照片上画框标注问题，把"该怎么改"落实到"按哪个键、转到哪一格"。

#### 6.5.1 用户流程

```
选择照片（手机相册；V1 加 USB-C 直连和 Wi-Fi 直连）
  → 本地解析 EXIF（快门、光圈、ISO、焦距、拍摄模式、对焦模式、对焦点位置、测光、白平衡……）
  → 可选：填写拍摄意图（"想拍背景虚化的人像"）
  → 照片缩放 + 对焦点 100% 裁切 + EXIF JSON 一起发给模型
  → AI 流式输出点评，过程中调用工具：
        在照片上画框（做得好 / 需改进）
        在 3D 相机上高亮按键、演示转动方向
        在虚拟屏幕上显示建议参数
  → 生成结构化复盘卡：先列需改进的地方 + 原因 + 怎么改 + 对应按键，再列做得好的地方 + 怎么保持
  → 用户可以继续追问（"那如果不想提高 ISO 呢？"）
  → "下次练习"加入今日任务
```

#### 6.5.2 复盘内容结构

| 维度 | 看什么 | 典型问题 |
|---|---|---|
| 曝光 | 直方图、高光溢出、暗部死黑 | 逆光脸黑、天空过曝 |
| 对焦 | 对焦点位置 vs 主体位置，对焦点裁切的锐度 | 对焦在背景上、景深太浅导致只有鼻子清楚 |
| 清晰度 | 快门速度 vs 焦距，运动拖影 | 手抖糊片、运动主体糊 |
| 构图 | 主体位置、地平线、边缘干扰 | 地平线歪、头顶被切 |
| 光线 | 光的方向、质感 | 正午顶光、脸上阴影重 |
| 色彩 | 白平衡、色偏 | 室内偏黄 |
| 参数合理性 | 当前场景下的参数组合 | 白天用了 ISO 6400、F2.8 拍风景导致前景虚 |

每条反馈统一格式，**需改进排在前面**（AI 语气为略严格，见 §7.5）：

- **需改进**：现象 → 原因（用 EXIF 佐证） → 怎么改（具体参数） → 在相机上怎么操作（部件 + 方向 + 档位，同时在 3D 模型上演示）
- **做得好**：现象 → 为什么好 → 怎么保持（"下次继续用 AF-C + 眼部识别，C3 键可以快速切换"）

#### 6.5.3 需求清单

| 编号 | 需求 | 说明 |
|---|---|---|
| F-AI-01 | 照片输入 | 支持 JPEG / HEIF；ARW 提取内嵌预览图；单次最多 4 张（对比分析） |
| F-AI-02 | EXIF 解析 | 本地解析标准 EXIF 和 Sony MakerNote（对焦点位置、对焦模式、主体识别、防抖、创意外观） |
| F-AI-03 | 隐私 | 默认在上传前移除 GPS 和设备序列号；照片只发送给用户自己配置的模型服务 |
| F-AI-04 | 流式输出 | 文字逐字显示；工具调用以卡片形式插在文字之间，卡片显示正在执行和已完成两种状态 |
| F-AI-05 | 3D 联动 | 对话内嵌 3D 相机卡片，响应 AI 的工具调用（高亮、旋转视角、演示拨动、修改虚拟屏幕参数） |
| F-AI-06 | 照片标注 | AI 返回的区域以框和编号叠加在照片上，绿色表示做得好，橙色表示需改进 |
| F-AI-07 | 结构化复盘卡 | 对话结束生成复盘卡，存入历史 |
| F-AI-08 | 追问 | 多轮对话，保留照片和工具调用上下文 |
| F-AI-09 | 成长报告（V1） | 按问题标签统计（欠曝、手抖、对焦失误……）并画趋势 |
| F-AI-10 | 个性化 | AI 读取"我的相机配置"，按用户实际的 C 键分配给建议 |
| F-AI-11 | 失败处理 | 网络失败可重试；模型拒答（refusal）时给出友好提示；Key 无效时引导到设置页 |
| F-AI-12 | 相机直连导入（V1） | **USB-C**：用 Android USB Host 和 `android.mtp` 接口读取相机里的照片列表和缩略图，勾选后导入（相机的 USB 连接模式需设为 MTP / PTP，菜单名按帮助指南核对）。**Wi-Fi**：先做技术验证。据目前了解，Sony Camera Remote SDK 官方只支持 Windows / macOS / Linux，需评估 PTP/IP 方案；验证不通过时，引导用户用 Sony Creators' App 传到手机相册再选图 |

### 6.6 设置（F-SET）

| 编号 | 需求 | 说明 |
|---|---|---|
| F-SET-01 | 协议选择 | Anthropic Messages API / OpenAI Responses API |
| F-SET-02 | 服务地址 | 默认官方地址，可填自定义 Base URL（代理或兼容服务） |
| F-SET-03 | API Key | 用户自填，Android Keystore 加密存储，界面只显示后 4 位 |
| F-SET-04 | 模型 | 下拉选择 + 手动输入；默认 `claude-opus-5-5` |
| F-SET-05 | 思考强度 | 低 / 中 / 高（对应 `output_config.effort` 或 `reasoning.effort`） |
| F-SET-06 | 连接测试 | 发一条测试请求，展示延迟和是否支持图片、工具调用 |
| F-SET-07 | 我的相机配置 | 固件版本、C1–C4 / AEL / AF-ON / 镜头对焦保持键的自定义分配、Fn 菜单排列 |

---

## 7. AI Agent 技术方案

### 7.1 总体架构

Agent 循环跑在手机端（类似 agent harness），工具全部是客户端工具，执行结果直接作用在本地 UI 上。没有自建后端，用户自带 Key 直连模型服务。

```
┌──────────────────────── Android App ────────────────────────┐
│                                                             │
│  ChatScreen ──► AgentLoop ──► ProviderAdapter ──HTTPS/SSE──►│──► 模型服务
│      ▲             │            ├ MessagesAdapter           │   (Messages / Responses)
│      │             │            └ ResponsesAdapter          │
│      │             ▼                                        │
│      │        ToolRegistry ──► ToolExecutor                 │
│      │                          ├ SceneController (3D)      │
│      │                          ├ PhotoAnnotator            │
│      │                          ├ ScreenSimulator           │
│      │                          ├ LessonRouter              │
│      │                          └ KnowledgeBase (本地手册)   │
│      └──────── StreamRenderer ◄─┘                           │
│                                                             │
│  对话存储 (op-sqlite) · Key 存储 (react-native-keychain)    │
└─────────────────────────────────────────────────────────────┘
```

AgentLoop、ProviderAdapter、StreamRenderer 移植自 QuantWise `src/ai/`；ToolExecutor 里的 3D 部分通过 WebView 消息桥调用 three.js 场景。

### 7.2 Agent 循环

QuantWise 的 `chat.ts` 已经实现了这个循环，这里只列出主干：

```ts
async function runTurn(thread: Thread) {
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const req = buildRequest({ service, system, context, tools: CAMERA_TOOLS, history: thread.messages, effort, cache: true, stream: true });
    const res = await streamModel(req, renderer);   // 逐字显示文本，工具卡片显示"执行中"
    thread.append(res.message);                      // 原始内容（含思考块）原样存，下次原样发

    switch (res.stop) {
      case 'tool_use': {
        const results = await Promise.all(res.calls.map(call => executeTool(call)));  // 驱动 3D / 标注照片 / 查手册
        thread.append({ role: 'tool', parts: results });   // 同一轮的结果放进同一条消息
        continue;
      }
      case 'max_tokens': renderer.showTruncated(); return;
      case 'refusal':    renderer.showRefusal();   return;
      default: return;                               // end_turn
    }
  }
}
```

要点：

- 同一轮里的多个工具调用并行执行，全部结果在**同一条**消息里回传
- 工具失败时回传错误结果（Messages API 用 `is_error: true`），不要丢弃
- 单轮工具调用设置上限（如 12 次），防止死循环
- 动画类工具（高亮、旋转）立即返回成功，动画在 UI 层异步播放，不阻塞循环

### 7.3 工具定义

所有工具用 JSON Schema 定义一份，两个适配器各自转换成对应协议的格式。

| 工具 | 作用 | 主要参数 |
|---|---|---|
| `highlight_control` | 在 3D 相机上高亮一个或多个部件，可附带一句说明 | `control_ids[]`、`note`、`style`（pulse / arrow） |
| `demonstrate_control` | 演示操作：拨盘转几格、按键按下、开关拨到哪 | `control_id`、`action`（rotate / press / slide）、`direction`、`steps` |
| `set_camera_view` | 切换 3D 视角 | `view`（front / top / back / left / right / lens） |
| `set_virtual_settings` | 修改虚拟屏幕上的参数，展示"改完之后的样子" | `mode`、`aperture`、`shutter`、`iso`、`ev`、`focus_mode`、`wb` |
| `annotate_photo` | 在照片上画框标注 | `regions[]`：`bbox`（归一化 0–1）、`label`、`kind`（good / fix） |
| `compare_exposure` | 展示调整前后的参数对比和模拟效果 | `before{}`、`after{}`、`explanation` |
| `lookup_manual` | 查本地知识库（帮助指南摘要、部件字典） | `query` |
| `get_camera_config` | 读取用户的按键自定义配置 | 无 |
| `open_lesson` | 推荐并跳转到相关课时 | `lesson_id`、`reason` |
| `add_practice_task` | 把练习加入今日任务 | `title`、`steps[]`、`success_criteria` |
| `say_to_user` | 两次工具调用之间，把讲解原样显示给用户 | `text` |
| `submit_review` | 提交结构化复盘卡，存入历史 | `title`、`scores[]`、`fixes[]`、`goods[]`、`tags[]` |
| `grade_task` | 课程实拍任务验收：判定通过与否 | `passed`、`unmet[]`、`summary` |

**完整定义以 `docs/spec/camera-tools.json` 为准**（共 13 个工具，strict 模式，可选参数用 `null`）。新增 `say_to_user` 的原因：Opus 5.5 在工具调用之间较长的讲解会以 thinking 块返回，只能拿到摘要；讲解要原样给用户看，所以走工具参数。新增 `submit_review` 的原因：复盘卡由 strict schema 保证结构，不再从文本里解析 JSON。

**示例：`highlight_control`**

```json
{
  "name": "highlight_control",
  "description": "在用户的 3D 相机模型上高亮部件，用来指出用户应该操作哪个按键、拨盘或开关。在讲到具体操作时调用，每次调用只指一个步骤。",
  "input_schema": {
    "type": "object",
    "properties": {
      "control_ids": {
        "type": "array",
        "items": { "type": "string", "enum": ["shutter", "dial_front", "dial_rear_l", "dial_rear_r", "mode_dial", "btn_c1", "btn_c2", "btn_c3", "btn_c4", "btn_afon", "btn_ael", "btn_fn", "btn_menu", "wheel", "joystick", "ring_zoom", "ring_focus", "ring_aperture", "sw_focus_mode", "btn_focus_hold", "..."] }
      },
      "note": { "type": "string", "description": "显示在部件旁的一句话，不超过 20 个字" },
      "style": { "type": "string", "enum": ["pulse", "arrow"] }
    },
    "required": ["control_ids", "note", "style"],
    "additionalProperties": false
  },
  "strict": true
}
```

### 7.4 双协议适配

内部统一使用一套中立的数据结构（`Message`、`ContentPart`、`ToolCall`、`ToolResult`、`StreamEvent`），由适配器负责和具体协议互相转换。

| 能力 | Anthropic Messages API | OpenAI Responses API |
|---|---|---|
| 端点 | `POST /v1/messages` | `POST /v1/responses` |
| 鉴权 | `x-api-key` + `anthropic-version: 2023-06-01` | `Authorization: Bearer` |
| 系统提示 | 顶层 `system` | `instructions` |
| 图片输入 | `{"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":"…"}}` | `{"type":"input_image","image_url":"data:image/jpeg;base64,…"}` |
| 工具定义 | `{name, description, input_schema, strict}` | `{type:"function", name, description, parameters, strict}` |
| 模型发起调用 | 内容块 `{"type":"tool_use","id","name","input"}` | 输出项 `{"type":"function_call","call_id","name","arguments"}`（arguments 是 JSON 字符串） |
| 回传结果 | user 消息里放 `{"type":"tool_result","tool_use_id","content","is_error"}` | 输入项 `{"type":"function_call_output","call_id","output"}` |
| 结束判断 | `stop_reason`：`tool_use` / `end_turn` / `max_tokens` / `refusal` | 输出里有 `function_call` 就继续；`status`：`completed` / `incomplete` |
| 流式文本 | `content_block_delta` → `text_delta` | `response.output_text.delta` |
| 流式工具参数 | `content_block_delta` → `input_json_delta` | `response.function_call_arguments.delta` |
| 思考强度 | `thinking: {type: "adaptive"}` + `output_config: {effort}` | `reasoning: {effort}` |
| 多轮状态 | 每轮回传完整历史（含 thinking 块，原样回传） | 回传完整输入，或用 `previous_response_id` |

**实现约束：**

- 工具参数一律用 JSON 解析器解析，不做字符串匹配
- 流式工具参数拼接完成后，先按 Schema 校验，校验失败回传错误结果让模型重试
- Messages API 的历史只追加、不修改（包括 thinking 块），否则会破坏缓存和思考块校验
- 默认模型 `claude-opus-5-5` 不支持强制工具调用（`tool_choice: any / tool`），统一用 `auto`，靠提示词引导
- Opus 5.5 默认思考强度是 `medium`，复盘场景显式设为 `medium`，追问场景可设为 `low` 以加快响应
- Messages API 请求带 `thinking: {type: "adaptive", display: "updates"}`（beta `thinking-display-updates-2026-08-18`），把非空的 thinking 块显示成状态行；带 `fallbacks: "default"`（beta `server-side-fallback-2026-07-01`），被安全分类器误拒时由服务端换模型重试
- 自定义 Base URL 不认识这些字段时，去掉后重试并记住，详见 `docs/DEV-HANDOFF.md` §3.1

### 7.5 提示词与上下文

**系统提示词结构**（固定不变的部分放前面，便于缓存）：

1. 角色：一位耐心的摄影教练，对象是零基础用户，只讲这台 α7 V + 24-70 GM II
2. 讲解原则（语气：略严格）：
   - 先指出最影响成片的问题，再讲做对的地方；问题严重时直说"这张不能用"
   - 不说空泛的夸奖，每条肯定都要说清楚好在哪里、下次怎么保持
   - 打分从严，5 分只给挑不出问题的维度
   - 每个问题都落实到"哪个键、往哪转、转到多少"；用 EXIF 佐证，不臆测；不确定时调用 `lookup_manual`
3. 工具使用规则：工具调用之间的讲解用 `say_to_user`；讲到操作必须调用 `highlight_control`；涉及参数变化时调用 `set_virtual_settings`；照片问题用 `annotate_photo` 画出位置
4. 部件字典：全部部件 ID、名称、位置、默认功能（约 3k token）
5. 镜头参数：24-70mm、F2.8 恒定、最近对焦距离、防抖由机身提供
6. 输出格式：复盘结束前调用一次 `submit_review` 提交复盘卡

**动态部分**（放在消息里，不放系统提示词）：用户的 C 键配置、拍摄意图、EXIF、照片。

**提示词缓存**：工具定义 + 系统提示词约 6k token，命中缓存后每次复盘只需付费照片和对话部分。

### 7.6 照片预处理

| 步骤 | 说明 |
|---|---|
| 全图缩放 | 长边缩放到约 1568px，JPEG 质量 85，约 1.6k–2.2k token |
| 对焦点裁切 | 根据 MakerNote 里的对焦点坐标，从原图裁一块 512×512 的 100% 区域，单独作为第二张图，用于判断对焦是否准确、是否手抖 |
| EXIF 结构化 | 转为 JSON：`{mode, shutter, aperture, iso, focal_length, ev_comp, metering, wb, focus_mode, focus_area, af_point, subject_detect, steady_shot, drive, lens}` |
| 直方图 | 本地计算亮度直方图的分位数（暗部 / 中间调 / 高光 / 溢出比例），作为文本附上 |
| 隐私 | 移除 GPS、序列号、作者信息 |

### 7.7 成本估算（默认模型 Opus 5.5，$4 / $20 每百万 token）

| 项 | token | 费用 |
|---|---|---|
| 系统提示词 + 工具（缓存命中） | 6,000 | ≈ $0.001 |
| 两张图 + EXIF + 直方图 | 3,000 | ≈ $0.012 |
| 输出（含思考与工具调用） | 2,500 | ≈ $0.050 |
| **单次复盘** | | **≈ $0.06** |

---

## 8. 非功能需求

| 类别 | 要求 |
|---|---|
| 性能 | 中端机（骁龙 7 系）3D 场景稳定 60fps；GLB 模型 ≤ 20MB（LOD0）；3D 页首次加载 ≤ 2s |
| 离线 | 课程、3D 相机、实验室全部离线可用；AI 教练需联网 |
| 安全 | API Key 用 Android Keystore 加密；日志不打印 Key 和照片内容 |
| 隐私 | 照片只发往用户配置的服务；默认移除 GPS；可一键清除全部复盘历史 |
| 无障碍 | 3D 部件支持 TalkBack 列表模式（按区域列出部件）；字号跟随系统 |
| 兼容 | Android 9（API 28）及以上 |

---

## 9. 技术选型

**结论：沿用 QuantWise 的技术栈（React Native + TypeScript），并移植它的 AI 模块 `src/ai/`。**

| 层 | 选型 | 和 QuantWise 的关系 |
|---|---|---|
| 框架 | React Native 0.87 + TypeScript | 相同 |
| 导航 | react-navigation 7（底部 5 个 Tab + 页面栈） | 相同 |
| 状态 | zustand | 相同 |
| 本地存储 | op-sqlite（对话、复盘、课程进度、我的相机配置） | 相同 |
| 安全 | react-native-keychain（API Key 存 Android Keystore） | 相同 |
| 图标 / 图形 | lucide-react-native；react-native-svg（测光表、直方图、照片标注框） | 相同 |
| AI | 移植 `src/ai/`：`protocol.ts`（Messages / Responses / Chat Completions）、`stream.ts`（SSE）、`http.ts`、`chat.ts`（流式工具循环、停止与断线处理）、`services.ts`（供应商与模型）、`scripts/mock-ai.cjs` 和对应单测 | 复用，新增图片输入 |
| 3D 相机 | react-native-webview + three.js，GLB 和脚本离线打包进 assets；RN 与 WebView 之间用消息桥通信（参考 `src/ui/math/bridge.ts` 的模式） | 复用桥接模式；交互代码参照本原型，模型用和真机一致的 GLB（`docs/spec/camera-model.md`） |
| 照片 | @react-native-documents/picker 选图；exifreader（纯 JS，读标准 EXIF 和部分 Sony MakerNote）；缩放与裁切用原生图片模块 | 新增 |
| 测试 | jest：协议层、工具执行器、EXIF 解析单测 | 相同 |

**为什么不用 Kotlin + Compose + SceneView：**

1. QuantWise 的 `src/ai/` 已经实现了两种协议的请求构建、SSE 流式解析、工具调用循环、停止和断线时补齐工具结果、Key 安全存储、供应商和模型管理、缓存断点，还有本地 mock 服务和单测。AI 教练的底层大部分可以直接用，重写一套 Kotlin 版至少多花 4 周。
2. three.js 跑在 WebView 里，原型中的 3D 交互代码可以直接搬进 App。原型和 App 共用一套 3D 代码，改一处两边一致。
3. 开发环境、模拟器、签名和发版流程都是已经跑通的。

**需要新增或改动的部分：**

1. `Part` 类型新增 `{ t: 'image'; mediaType: string; data: string }`，`protocol.ts` 里三种协议各加一段图片映射（见 §7.4）
2. 新工具集 `tools/camera.ts`（`highlight_control` 等，见 §7.3），执行器通过 WebView 桥驱动 3D
3. 照片预处理模块（EXIF、缩放、对焦点裁切、直方图，见 §7.6）
4. 删掉行情、交易、因子相关的工具、页面上下文和提示词
5. 相机直连导入（V1）：USB-C 部分写一个 Kotlin 原生模块，封装 Android 的 `android.mtp`；Wi-Fi 部分按技术验证结果决定

**代价与对策：** WebView 里的 3D 性能比原生 Filament 低一些。模型预算见 `docs/spec/camera-model.md` §7（LOD0 ≤ 20 万三角面），WebView 常驻、不反复创建；如果中端机达不到 60fps，再换成 react-native-filament（同样加载 GLB，部件 ID 和 `controls.json` 不变）。

**许可证：** QuantWise 是 GPL-3.0。个人自用没有影响；将来如果公开发布，移植过来的代码同样要按 GPL-3.0 开源。

---

## 10. 3D 资产制作规范

**要求：模型和真机一模一样。** 完整规范在 `docs/spec/camera-model.md`，要点如下：

1. **来源**：市面上没有 α7 V 的现成模型（2026-11-24 查过 CGTrader、TurboSquid、Sketchfab），由专业建模师对照用户的实机建模。参考资料是用户拍的照片包，加上帮助指南里的尺寸。镜头可以买 CGTrader 上的现成模型改。不用 Sony 的 CAD 数据，也不用官网图片做贴图。
2. **拆分与绑定**：`controls.json` 里的每个部件都是独立节点，节点名等于 id。转轴、每格角度、档位角度写在 glTF 的 `extras` 里，App 只从这里读。
3. **验收**：
   - 外形尺寸误差 ≤ 0.5 mm，部件位置误差 ≤ 1 mm。
   - 刻字逐个核对，活动部件和实物视频逐个比对。
   - 最后由用户拿着真机签字。
4. **预算**：LOD0 ≤ 20 万三角面、≤ 20 MB；LOD1 ≤ 6 万三角面，给对话卡片用。
5. **进度**：和开发并行。第 2 周定人并拍参考照片，第 3 周交白模，第 9 周签字。在那之前开发用占位 GLB，节点格式相同，换文件不改代码。
6. **原型的程序化模型不进 App。**

---

## 11. 里程碑

| 阶段 | 周期 | 交付 |
|---|---|---|
| M0 原型 | 第 1 周 | 本文档 + 可交互 HTML 原型（已完成） |
| M1 工程与 3D 相机 | 第 2–5 周 | 从 QuantWise 拆出工程骨架和 `src/ai/`；WebView 3D 相机（交互代码迁入，先用占位模型）、部件字典、虚拟屏幕联动、屏幕图标详解；Wi-Fi 直连导入技术验证（2 天） |
| M2 课程与实验室 | 第 6–9 周 | L0–L5 课程、曝光实验室；接入和真机一致的正式 3D 模型（第 9 周用户签字） |
| M3 AI 教练 | 第 10–11 周 | 图片输入、相机工具集、照片预处理、3D 联动（协议层已复用，周期缩短 2 周） |
| M4 打磨 | 第 12–14 周 | 性能优化、无障碍列表模式、隐私清除、真机测试（菜单模拟器和成长报告属于 V1，见 §4） |

M4 之后进入 V1：相机直连导入、L6–L11 课程补齐、菜单模拟器、成长报告；再到 V2：视频课程 L12–L14。

---

## 12. 风险与待确认

| 风险 | 影响 | 应对 |
|---|---|---|
| 按键默认功能和位置有误 | 教错用户 | 所有数据放 `controls.json`，开发前对照官方帮助指南和实机逐项核对 |
| 和真机一致的 3D 模型 | 市面上没有现成模型，要外包建模；延期会卡住发布 | 第 2 周定人，开发用占位 GLB 并行推进；按 `camera-model.md` 分轮验收；M4 结束前没有签字通过的模型就不发布 |
| WebView 3D 在中端机上卡顿 | 体验差 | 控制面数、常驻 WebView；不达标时换 react-native-filament，部件 ID 不变 |
| AI 点评不准、编造菜单路径 | 误导用户 | 菜单路径只能来自 `lookup_manual` 返回的内容；EXIF 作为硬依据；结构化输出 |
| 商标与版权 | 无法上架 | 个人使用无碍；如上架需更名、去掉品牌标识，模型上的品牌标识放在可隐藏的 `decal_brand` 节点里，上架时隐藏 |
| API 费用 | 用户顾虑 | 用户自带 Key；显示每次复盘的 token 用量；追问用低思考强度 |
| Wi-Fi 直连导入走不通 | V1 少一个功能 | M1 期间做 2 天技术验证；走不通就用 USB-C 直连，加 Creators' App 中转 |

**已确认（2026-11-24）：**

| 问题 | 结论 |
|---|---|
| App 名称 | 快门学院 |
| 视频拍摄课程 | 要做，排在 V2：L12–L14（见 §6.3） |
| 相机直连导入照片 | 要做，排在 V1：USB-C 直连 + Wi-Fi 直连，Wi-Fi 先做技术验证（见 F-AI-12） |
| AI 教练语气 | 略严格：先讲问题再讲优点，不说空泛的夸奖，打分从严（见 §7.5） |
| 3D 模型 | 必须和真机一模一样；原型的程序化模型不进 App（见 §10） |

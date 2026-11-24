# 任务：编写 α7 V 知识库 `docs/spec/manual-kb.json`

> 给 Astra。写完交回 PM 审查。

## 1. 背景

快门学院的 AI 教练讲到菜单路径、功能位置、出厂设置时，**只能**用 `lookup_manual` 工具查本地知识库得到的内容，不能凭记忆说（PRD §7.3、DEV-HANDOFF §4.2）。这个知识库就是本任务要写的 `docs/spec/manual-kb.json`。

- `lookup_manual` 的参数只有一个 `query`（字符串），例如 `"DRO 动态范围优化"`。
- 返回最多 3 条：`{hits:[{title, where, text}]}`。
- 知识库写错了，AI 就会把错的路径教给初学者。所以**准确比全面重要**：查不到的宁可不写。

相机是 Sony α7 V（型号 ILCE-7M5），镜头是 FE 24-70mm F2.8 GM II（型号 SEL2470GM2）。

## 2. 资料来源（硬性要求）

1. **只用 Sony 官方资料**：
   - 相机：α7 V 的官方「帮助指南」（helpguide.sony.net），**优先用简体中文版**。
   - 镜头：SEL2470GM2 的官方帮助指南或使用说明书（Sony 官网支持页的 PDF）。
   - 先在帮助指南的封面或首页确认型号是 ILCE-7M5。
2. **每条内容都要能追溯**：`source.url` 写到具体页面；PDF 写链接加页码。
3. **打不开官方页面时，停下来告诉 PM**。不要凭记忆、论坛、评测网站或别的机型（α7 IV、α1 II 等）的资料来写。别的机型的菜单很像，但不完全一样，这是最容易出错的地方。
4. **版权**：用自己的话概括，不整段复制原文，不复制图片。菜单名、选项名照抄原文（这是事实，必须一字不差）。
5. **菜单名以简体中文版帮助指南的写法为准**，包括空格、斜杠和全角/半角，都和原文一致。同时记录英文版对应的路径（`menu_path_en`），供 PM 对照审查，也用于英文检索。

## 3. 要交付的文件

| 文件 | 内容 |
|---|---|
| `docs/spec/manual-kb.json` | 知识库本体（格式见 §4） |
| `scripts/check-manual-kb.cjs` | 检查脚本（规则见 §6），运行 `node scripts/check-manual-kb.cjs` |
| `docs/kb-verify-report.md` | 核对报告（见 §7） |

**不要改动的文件**：
- `docs/spec/manual-kb.tests.json`：只能在末尾追加用例。
- `content/lessons/*`、`docs/spec/controls.json`：发现问题写进报告，由 PM 修改。

## 4. 格式

```jsonc
{
  "version": 1,
  "camera": {
    "model": "ILCE-7M5",
    "guide_url": "<帮助指南首页 URL>",
    "guide_lang": "zh-cn",
    "guide_version": "<页面上的版本号或更新日期，没有就写 null>"
  },
  "lens": {
    "model": "SEL2470GM2",
    "guide_url": "<镜头帮助指南或说明书 URL>"
  },
  "retrieved_at": "YYYY-MM-DD",

  "entries": [
    {
      "id": "iso_auto_min_ss",             // 用 §5 清单里的 id；清单外新增的用小写 snake_case
      "title": "<功能名，≤ 20 字，用帮助指南里的叫法>",
      "category": "exposure",              // 取值见下方 category 表
      "priority": "P0",                    // 按 §5 清单填；清单外新增的填 P1
      "menu_path": "MENU › <标签页> › <分组> › <项目>",   // 没有菜单项时为 null
      "menu_path_en": "MENU › <Tab> › <Group> › <Item>",   // 对应的英文路径；menu_path 为 null 时也为 null
      "other_access": ["<出厂状态下的其他进入方式，如「控制拨轮 右」「Fn 菜单」>"],
      "controls": ["wheel"],               // 出厂状态下直接操作此功能的部件，取 controls.json 的 id；没有就写 []
      "options": ["<选项 1>", "<选项 2>"],  // 可选值，照抄原文；不是选项类功能就写 []
      "default": "<出厂默认值>",            // 只有帮助指南明确写出时才填，否则填 null，不要推测
      "conditions": ["<使用限制，如「仅在 AF-C 下可用」>"],
      "keywords": ["<检索词>"],             // 3–12 个，见下方说明
      "text": "<20–150 字的概括>",          // 见下方说明
      "source": { "url": "<具体页面 URL>", "title": "<该页标题>" },
      "related": ["iso", "image_stabilization"]   // 相关条目的 id
    }
  ],

  "menu_index": [
    { "path": "MENU › … › …", "path_en": "MENU › … › …", "summary": "<≤ 30 字>", "source_url": "<URL>" }
  ],

  "missing": [
    { "id": "<§5 清单里的 id>", "reason": "<为什么没写，如「帮助指南中没有此功能」>" }
  ]
}
```

上面 `<…>` 里的都是占位符，不是事实，**不要照抄**。

**category 取值**

| 值 | 范围 |
|---|---|
| `basic` | 语言、日期、提示音、触摸、复位、节电等基础设置 |
| `body` | 机身硬件：电池、屈光度、接口、卡槽、热靴、USB、手机传输 |
| `media` | 存储卡、文件格式、画质、记录设置 |
| `exposure` | 拍摄模式、ISO、曝光补偿、测光、DRO、降噪、直方图等 |
| `focus` | 对焦模式、区域、识别、放大、峰值等 |
| `drive` | 驱动模式、自拍、包围、快门类型、防抖 |
| `color` | 白平衡、创意外观、色彩空间 |
| `display` | DISP、网格线、水平仪、实时取景显示 |
| `playback` | 回放、放大、删除、保护、分级 |
| `custom` | 自定义键、Fn 菜单、我的菜单、拨盘设置、设定记忆 |
| `lens` | 镜头上的环、开关、按钮和规格 |

**`text` 怎么写**

- 面向完全不懂相机的人。写清楚四件事：这个功能做什么、什么时候用、怎么设（选哪个）、有什么限制。
- 用自己的话，不要用「本功能可以…」这种说明书腔，也不要写营销词。
- 不要重复 `menu_path` 和 `options` 里已经有的内容。

**`keywords` 怎么写**

- 包括这几类词：
  - 帮助指南里的正式名称和英文名、缩写（如 `DRO`、`AWB`）。
  - 初学者会怎么说，包括看到的现象（如「照片发黄」「手抖糊了」「背景虚化」）。
  - 常见的别称。
- 不要堆和功能无关的词来凑检索命中。

**`menu_index`**

把帮助指南「菜单列表」页里的**全部**菜单项都记下来：路径加一句话说明。`entries` 只覆盖重点功能；有了 `menu_index`，AI 遇到清单外的菜单问题也能查到准确路径。

**`where` 的拼法**

App 返回给模型的 `where`，由 `menu_path` 和 `other_access` 用「；」连起来，不用另存一个字段。

## 5. 必须覆盖的条目

- **P0**：课程 L0–L5 和 AI 复盘最常用到的，**必须**写进 `entries`。
- **P1**：要么写进 `entries`，要么写进 `missing` 并说明原因。
- 帮助指南里确实没有的功能（α7 V 可能没有），P0 也可以放进 `missing`，但要在报告里单独列出来。

**basic**
- P0：`language` 语言，`date_time` 日期时间和地区，`beep` 提示音，`touch_ops` 触摸操作（含回放时的触摸）
- P1：`initialize` 设置复位或恢复出厂，`power_save` 节电和自动关机，`monitor_brightness` 显示屏亮度，`finder_monitor_switch` 取景器和显示屏切换，`firmware_version` 查看固件版本

**body**
- P0：`battery` 电池型号、充电和 USB 供电，`diopter` 屈光度调节，`ports` 接口，`card_slots` 卡槽和支持的卡
- P1：`hot_shoe` 热靴，`usb_connection` USB 连接电脑或手机，`smartphone_transfer` 传输到手机

**media**
- P0：`format` 格式化，`file_format` 文件格式（RAW/JPEG/HEIF），`release_wo_card` 无存储卡时释放快门，`rec_media` 记录媒体设置（卡槽选择、同时记录等）
- P1：`jpeg_quality_size` JPEG 画质和尺寸，`raw_type` RAW 文件类型

**exposure**
- P0：
  - 模式类：`shooting_mode` 拍摄模式（模式转盘各档），`intelligent_auto` 智能自动及其可改项目
  - 参数类：`iso` ISO 设置，`iso_auto_min_ss` ISO AUTO 最低快门速度，`exposure_comp` 曝光补偿（含可用档位和后拨盘锁定），`exposure_warning` 超出曝光范围时的闪烁提示
  - 测光类：`metering_mode` 测光模式，`face_priority_metering` 测光时面部优先
  - 其他：`dro_hdr` DRO / 自动 HDR，`histogram` 直方图，`long_exposure_nr` 长时曝光降噪，`high_iso_nr` 高 ISO 降噪
- P1：`program_shift` P 档程序偏移，`ae_lock` AE 锁定，`zebra` 斑马线，`anti_flicker` 防闪烁拍摄，`exposure_step` 曝光步级，`bulb` B 门

**focus**
- P0：`focus_mode` 对焦模式，`focus_area` 对焦区域（含跟踪），`subject_recognition` 主体识别（识别对象和菜单路径），`recognition_part` 识别部位（眼部），`af_confirm` 对焦成功时的显示和提示音，`focus_frame_move` 移动对焦框（摇杆；按下是否回到中央），`af_on` AF-ON 按钮，`focus_magnifier` 对焦放大
- P1：`mf_assist` MF 辅助，`peaking` 峰值显示，`touch_focus` 触摸对焦和触摸跟踪，`af_priority` AF-S/AF-C 优先设置，`af_tracking_sens` AF 跟踪灵敏度，`af_illuminator` AF 辅助照明

**drive**
- P0：`drive_mode` 驱动模式（单张、连拍各档），`shutter_type` 快门类型和静音拍摄，`image_stabilization` 防抖
- P1：`self_timer` 自拍定时，`bracket` 包围曝光

**color**
- P0：`white_balance` 白平衡
- P1：`creative_look` 创意外观，`color_space` 色彩空间，`awb_priority` AWB 优先级

**display**
- P0：`disp` DISP 显示切换
- P1：`grid_line` 网格线，`level` 水平仪，`live_view_display` 实时取景显示

**playback**
- P0：`playback_basic` 回放和切换照片，`playback_zoom` 放大回放，`delete` 删除
- P1：`protect` 保护，`rating` 分级

**custom**
- P0：`custom_keys` 自定义键（**写明出厂分配**，C1–C4、AEL、AF-ON、控制拨轮各方向、中央键等），`fn_menu` Fn 菜单（出厂的 12 格内容）
- P1：`my_menu` 我的菜单，`dial_setup` 拨盘设置，`shoot_setting_memory` 拍摄设定记忆（MR 1/2/3）

**lens**
- P0：
  - `lens_mount` 安装和拆卸镜头
  - `lens_aperture_ring` 光圈环、段落感开关、光圈锁
  - `lens_focus_mode_switch` 镜头 AF/MF 开关
  - `lens_focus_hold` 对焦保持按钮（数量和出厂功能）
  - `lens_zoom_smooth_tight` SMOOTH/TIGHT 开关
  - `lens_min_focus` 最近对焦距离和最大放大倍率
- P1：`lens_filter_hood` 滤镜口径和遮光罩

## 6. 检查脚本 `scripts/check-manual-kb.cjs`

不用装依赖，只用 Node 自带的模块。有错误时打印出来，并以退出码 1 结束；全部通过时打印统计信息。

**结构检查**
1. 顶层字段齐全；`entries` 里的 `id` 不重复，并且是小写 snake_case。
2. §5 的 P0 id 全部出现在 `entries` 里；P0 出现在 `missing` 里时，算警告不算错误。§5 的 P1 id 都出现在 `entries` 或 `missing` 里。
3. `category`、`priority` 在规定取值内。
4. 每条的 `menu_path`、`other_access`、`controls` 三者至少有一个不为空。
5. `menu_path` 不为 null 时：以 `MENU › ` 开头，层级之间用「 › 」分隔（前后各一个空格），并且**必须出现在 `menu_index` 的 `path` 里**。`menu_path_en` 同理，对应 `menu_index` 的 `path_en`。
6. `controls` 里的每个 id 都在 `docs/spec/controls.json` 里存在；`related` 里的每个 id 都在 `entries` 里存在。
7. 长度：`title` ≤ 20 字；`text` 20–150 字；`keywords` 3–12 个；`menu_index.summary` ≤ 30 字。
8. `source.url`、`menu_index[].source_url` 都匹配 `^https://([a-z0-9-]+\.)*sony\.(net|com|com\.cn|jp)/`。

**检索检查**
9. 用下面的参考检索函数，逐条跑 `docs/spec/manual-kb.tests.json` 里的用例：`expect` 里任意一个 id 出现在前 3 条结果中就算通过，有一条不通过就算错误。
10. App 里的 `lookup_manual`（`src/ai/coach/kb.ts`）会直接移植这个函数，所以**请原样实现，不要改算法**。为了让用例通过，应该补充恰当的 `keywords`，而不是改算法。

```js
const norm = s => (s || '').normalize('NFKC').toLowerCase()
  .replace(/[\s·・\-_/()（）「」"'.,，。、:：;；!?！？›>]+/g, '');
const grams = s => { const g = new Set(); if (s.length === 1) g.add(s);
  for (let i = 0; i + 2 <= s.length; i++) g.add(s.slice(i, i + 2)); return g; };
const overlap = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };

function search(kb, query, k = 3) {
  const q = norm(query); if (!q) return [];
  const qg = grams(q);
  const docs = [
    ...kb.entries.map(e => ({ id: e.id, title: e.title, keywords: e.keywords,
      head: [e.title, ...e.keywords, e.menu_path, e.menu_path_en].join('|'), body: e.text,
      where: [e.menu_path, ...e.other_access].filter(Boolean).join('；'), text: e.text })),
    ...kb.menu_index.map((m, i) => ({ id: 'menu#' + i, title: m.path.split(' › ').pop(), keywords: [],
      head: [m.path, m.path_en].join('|'), body: m.summary, where: m.path, text: m.summary })),
  ];
  return docs.map(d => {
    const t = norm(d.title); let s = 0;
    if (t === q) s += 20; else if (t && (t.includes(q) || q.includes(t))) s += 10;
    for (const kw of d.keywords.map(norm)) if (kw && (q.includes(kw) || kw.includes(q))) s += 6;
    s += 2 * overlap(qg, grams(norm(d.head))) + 0.5 * overlap(qg, grams(norm(d.body)));
    return { d, s };
  }).filter(x => x.s >= 4).sort((a, b) => b.s - a.s).slice(0, k)
    .map(({ d }) => ({ id: d.id, title: d.title, where: d.where, text: d.text }));
}
```

**最后打印**：条目数（P0 / P1）、`menu_index` 条数、`missing` 条数、`default` 为 null 的条数、检索用例通过数。

## 7. 核对报告 `docs/kb-verify-report.md`

读帮助指南时顺带核对三类内容，都写进这份报告。PM 会据此修改课程和部件字典。

**第 1 节：课程里待核对的事实**

运行下面的命令，列出 L0–L5 里所有待核对的条目：

```bash
node -e 'for(const i of [0,1,2,3,4,5]){const l=require("./content/lessons/L"+i+".json");l.needs_verification.forEach(v=>console.log("L"+i+"\t"+v))}'
```

每一条都要给出结论，格式如下：

| 课 | 待核对内容 | 结论 | 帮助指南怎么说（概括） | 来源 URL | 建议改法 |
|---|---|---|---|---|---|

- 「结论」取 `正确`、`需修改`、`查不到` 三者之一。
- 一条里有多个事实时（比如列了 4 个菜单路径），逐个写结论。

**第 2 节：`controls.json` 不一致的地方**

不用逐项核对 `controls.json`。只记录写知识库时顺便发现的、和帮助指南对不上的 `where` / `default_function` / `positions`。

**第 3 节：P0 放进 `missing` 的条目，以及你拿不准的条目**

拿不准的情况包括：中文版和英文版说法不一致，帮助指南前后矛盾，等等。

## 8. 完成标准

1. `node scripts/check-manual-kb.cjs` 没有错误，检索用例全部通过。
2. 核对报告三节都写完。
3. 交付时附一段简短说明：
   - 用的帮助指南 URL 和版本。
   - 各项统计数字。
   - `missing` 列表。
   - 报告里「需修改」的条数。

## 9. PM 怎么审查

提前告诉你，方便自查：

- **P0 条目逐条打开 `source.url` 对照**：路径和选项是否一字不差；`default` 有没有推测出来的值。
- **P1 条目和 `menu_index` 各抽查 15 条。**
- **重点看各机型差异大的地方**：
  - 自定义键出厂分配、Fn 菜单出厂内容
  - 主体识别的对象列表
  - 对焦区域选项
  - 卡槽规格
  - 镜头按钮数量
- **`text` 有没有大段照抄原文，有没有说明书腔。**
- **核对报告的结论有没有给出来源。**

发现一处编造（来源页面里查不到的内容），这一类条目全部返工。

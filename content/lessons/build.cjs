#!/usr/bin/env node
/* 快门学院 · 课程内容源文件（PM 维护）
 * 运行：node content/lessons/build.cjs
 * 作用：生成 content/lessons/L*.json，并做以下校验，任何一项不通过都会报错退出：
 *   - 3D 演示步骤的工具参数符合 docs/spec/camera-tools.json（自动补齐 null）
 *   - 部件 id、开关档位、正文里的 [[部件 id]] 链接都存在于 docs/spec/controls.json
 *   - 正文里写到的曝光数字，用原型的曝光求解器逐条验算
 *   - 练习题可解：set_exposure 题在允许调整的参数范围内至少有一组解，且初始状态不满足目标
 * 课程数据格式见 docs/DEV-HANDOFF.md §11。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const TOOLS = JSON.parse(fs.readFileSync(ROOT + '/docs/spec/camera-tools.json', 'utf8')).tools;
const CONTROLS = JSON.parse(fs.readFileSync(ROOT + '/docs/spec/controls.json', 'utf8')).controls;
const CTRL = Object.fromEntries(CONTROLS.map(c => [c.id, c]));

/* ---------- 曝光求解器：取自原型 prototype/src/2-camera.js，App 的 src/camera/exposure.ts 必须给出相同结果 ---------- */
const camSrc = fs.readFileSync(ROOT + '/prototype/src/2-camera.js', 'utf8');
const a = camSrc.indexOf('const lg=Math.log2');
const b = camSrc.indexOf('\n}\n', camSrc.indexOf('function solve(')) + 3;
const EXPO = new Function(camSrc.slice(a, b) + ';return {solve,fmtT,fmtN,TV3L,TVV,APS,ISO3};')();
const tOf = s => { const i = EXPO.TV3L.indexOf(s); if (i < 0) throw new Error('未知快门档位 ' + s); return EXPO.TVV[i]; };
/** 按相机逻辑求解。p: {aperture, shutter, iso, ev}，shutter 用 '1/250' 这样的档位字符串。 */
function solve(mode, sceneEv, p) {
  const r = EXPO.solve(mode, sceneEv, { N: p.aperture ?? 2.8, t: p.shutter ? tOf(p.shutter) : 1 / 125, iso: p.iso ?? 100, ev: p.ev ?? 0 });
  return { aperture: r.N, shutter: EXPO.fmtT(r.t), t: r.t, iso: r.iso, bias: Math.round(r.bias * 10) / 10, warn: r.warn };
}

/* ---------- 3D 演示步骤的写法 ---------- */
function step(name, args) {
  const t = TOOLS.find(x => x.name === name);
  if (!t) throw new Error('没有这个工具：' + name);
  const out = {};
  for (const k of Object.keys(t.input_schema.properties)) out[k] = k in args ? args[k] : null;
  for (const k of Object.keys(args)) if (!(k in out)) throw new Error(name + ' 没有参数 ' + k);
  return { tool: name, args: out };
}
const view = v => step('set_camera_view', { view: v });
const hl = (ids, note, style = 'pulse') => step('highlight_control', { control_ids: [].concat(ids), note, style });
const say = text => step('say_to_user', { text });
const press = (id, dir = 'none', times = 1) => step('demonstrate_control', { control_id: id, action: 'press', direction: dir, steps: times, target: null });
const slide = (id, target) => step('demonstrate_control', { control_id: id, action: 'slide', direction: 'none', steps: null, target });
const turnTo = (id, target) => step('demonstrate_control', { control_id: id, action: 'rotate', direction: 'none', steps: null, target });
const settings = o => step('set_virtual_settings', o);

/* ---------- 曝光数字验算：正文里每个具体数字都在这里登记 ---------- */
const CHECKS = [];
/** 登记一条验算：mode / sceneEv / 输入参数 / 期望结果（只比较给出的字段） */
const expo = (lesson, desc, mode, sceneEv, p, expect) => CHECKS.push({ lesson, desc, mode, sceneEv, p, expect });
/** 登记一条景深验算：焦距 mm、光圈、对焦距离 m，期望前后清楚的总范围在 [最小, 最大] 厘米之间（全画幅弥散圆 0.03mm） */
const DOF_CHECKS = [];
const dof = (lesson, desc, f, N, sM, rangeCm) => DOF_CHECKS.push({ lesson, desc, f, N, sM, rangeCm });
function dofCm(f, N, sM) {
  const s = sM * 1000, H = (f * f) / (N * 0.03) + f;
  const near = (s * (H - f)) / (H + s - 2 * f), far = (s * (H - f)) / (H - s);
  return (far - near) / 10;
}

const LESSONS = [];

/* ======================================================================
 * L0 开箱
 * ====================================================================== */
LESSONS.push({
  id: 'L0',
  title: '开箱',
  minutes: 20,
  goals: ['装好电池、存储卡和镜头', '完成第一次开机设置，格式化存储卡', '调好取景器，确认 JPEG 格式并禁止无卡拍摄'],
  sections: [
    { kind: 'demo', steps: [
      view('bottom'),
      hl('battery_door', '电池仓'),
      say('先把 **NP-FZ100** 装进握把底部的电池仓。关机，把 USB-C 线接到机身左侧任一 USB-C 口和充电电源。橙灯常亮表示正在充电，熄灭表示充电结束。'),
      view('right'),
      hl('card_door', '存储卡仓'),
      say('存储卡仓在右侧（握把侧）。卡槽 1 支持 CFexpress A 型卡和 SD 卡，卡槽 2 只支持 SD 卡。**只有一张卡就插卡槽 1。**'),
      view('front'),
      hl('lens_release', '镜头释放按钮'),
      say('装镜头：镜头上的白点对准卡口上的白点，插进去，**顺时针**转到听见"咔哒"。卸镜头时按住这个按钮，逆时针转下来。'),
      view('top'),
      hl('power', '电源开关'),
      slide('power', 'ON'),
      say("快门外圈是电源开关。首次拨到 ON，按屏幕提示选语言。可以与 Creators' App 配对并用手机设时钟，也可以跳过配对，在相机上设区域、日期和时间。"),
      view('back'),
      hl('diopter', '屈光度调节'),
      say('眼睛贴近取景器，看着里面的文字转动屈光度调节，转到文字**最清楚**为止。'),
      hl('btn_menu', '菜单键'),
      say('格式化存储卡、修改文件格式都在菜单里，具体步骤看下面的图文讲解。'),
    ]},
    { kind: 'read', markdown: `## 开箱后按这个顺序做

### 1. 装电池
[[battery_door]] 在机身底部、握把下方。打开仓门，按仓门里的箭头方向插入 NP-FZ100 电池，推到底，直到锁扣扣住电池。

### 2. 充电
装好电池，把 [[power]] 拨到 OFF。准备 USB-C 线和兼容电源，接到 [[ports]] 里的任一 USB-C 口即可充电。索尼建议用支持 18 W 或以上 USB PD 的电源和线。充电灯橙色常亮表示正在充电，随后熄灭表示充电结束。随附配件以当地装箱清单为准。

### 3. 装存储卡
[[card_door]] 在右侧（握把侧）。卡槽 1 支持 CFexpress A 型卡和 SD 卡，卡槽 2 只支持 SD 卡。只有一张卡时插卡槽 1，相机默认把照片存在卡槽 1。卡的朝向按卡槽旁边的图示，插到听见"咔哒"。

### 4. 装镜头
1. 确认 [[power]] 在 OFF。帮助指南要求换镜头前关机。
2. 取下机身盖和镜头后盖。卡口朝下，动作要快，减少灰尘进入。
3. 镜头上的白点对准机身卡口上的白点，插进去，从正面看**顺时针**转动，直到"咔哒"一声锁住。
4. 卸镜头：按住 [[lens_release]]，逆时针转下来。

不要用手指碰卡口里面的传感器。

### 5. 开机和首次设置
把 [[power]] 拨到 ON，按提示选语言。与 Creators' App 配对时可用手机设置时钟。选择跳过手机连接时，在机身上用 [[wheel]] 选择区域、日期和时间，按 [[btn_center]] 确认。照片会记录这个拍摄时间。

以后改语言，按 [[btn_menu]]，路径是 MENU › 设置 › 区域/日期 › 语言。

### 6. 格式化存储卡
**格式化会清空所选卡槽的整张卡。** 先备份需要的文件，再按 [[btn_menu]]，进入 MENU › 拍摄 › 媒体 › 格式化。核对要格式化的卡槽，确认后等待完成。

### 7. 调屈光度
眼睛贴近 [[evf]]，看着里面的文字转动 [[diopter]]，转到文字最清楚为止。戴不戴眼镜，清楚的位置不一样，按你平时拍照的习惯来调。

### 8. 确认照片格式，防止忘插卡

| 设置 | 建议值 | 为什么 |
|---|---|---|
| 文件格式 | JPEG（出厂即为 JPEG） | 快门学院的 AI 复盘目前只读 JPEG。以后想同时保留原始文件，可选 RAW&JPEG |
| 无存储卡时释放快门 | 禁止 | 默认是允许，不插卡也能按快门，拍完才发现一张都没存下来 |

照片格式在 MENU › 拍摄 › 影像质量/记录 › 影像质量设置 › 文件格式。若屏幕显示 HEIF，先在 MENU › 拍摄 › 影像质量/记录 › JPEG/HEIF切换 选 JPEG。防止无卡拍摄，进入 MENU › 拍摄 › 快门/静音 › 无存储卡时释放快门，选「禁止」。

## 常见错误
- **开着机换镜头**：先关机再换。
- **镜头没转到位**：屏幕提示没有安装镜头，或者镜头一晃就动。卸下来重新装，转到听见"咔哒"。
- **用电脑格式化存储卡**：可能让相机读写出错。只在相机里格式化。` },
    { kind: 'practice', items: [
      { type: 'find_control', target: 'battery_door' },
      { type: 'find_control', target: 'card_door' },
      { type: 'find_control', target: 'lens_release' },
      { type: 'find_control', target: 'diopter' },
      { type: 'choice', q: '换镜头之前，第一步做什么？', options: ['关机', '打开菜单', '取下镜头后盖'], answer: 0, explain: '帮助指南要求换镜头前关机。关机后再取下机身盖和镜头后盖。' },
      { type: 'choice', q: '你只有一张 SD 卡，插哪个卡槽？', options: ['卡槽 1', '卡槽 2', '哪个都行，没有区别'], answer: 0, explain: '相机默认把照片存到卡槽 1。插在卡槽 2 需要改设置，新手直接插卡槽 1。' },
      { type: 'choice', q: '新买的存储卡第一次用，应该怎么做？', options: ['在相机里格式化', '在电脑上格式化', '直接用，不用处理'], answer: 0, explain: '在相机里格式化，卡的文件结构才和这台相机匹配。格式化会清空卡里的内容。' },
      { type: 'choice', q: '为什么要把"无存储卡时释放快门"改成禁止？', options: ['避免没插卡还以为拍上了', '可以省电', '照片画质会更好'], answer: 0, explain: '默认允许时，没插卡也能按快门，照片不会保存。改成禁止后，没插卡就按不下快门，你会马上发现。' },
    ]},
    { kind: 'task', title: '拍一张桌上的杯子', photos: 1, complete_by: 'ai',
      steps: ['模式转盘转到 AUTO（智能自动）', '对着杯子半按快门，看屏幕左下的对焦指示，确认合焦', '把快门按到底，拍一张', "用 Sony Creators' App 把照片传到手机相册，回到这一课点「上传照片」"],
      success_criteria: '照片是 JPEG，杯子在画面里，并且对得清楚',
      ai_rubric: ['EXIF 里的机型是 ILCE-7M5，文件是 JPEG', '画面主体是杯子', '杯子对焦清晰，没有明显的糊'] },
  ],
  needs_verification: [],
});

/* ======================================================================
 * L1 认识机身
 * ====================================================================== */
LESSONS.push({
  id: 'L1',
  title: '认识机身',
  minutes: 20,
  goals: ['知道每个按键、拨盘在哪，出厂时是干什么的', '分清前拨盘、后拨盘 L、后拨盘 R', '知道镜头上的环和开关该放在哪个位置'],
  sections: [
    { kind: 'demo', steps: [
      view('top'),
      hl('shutter', '快门：半按对焦'),
      say('**快门按钮**分两段：半按是对焦和测光，按到底才是拍摄。'),
      hl('mode_dial', '模式转盘'),
      turnTo('mode_dial', 'A'),
      say('**模式转盘**决定由谁来控制曝光。AUTO 全交给相机；A、S、M 由你控制一部分或全部，后面几课逐个学。'),
      hl('mode_switch', '拍照 / 录像切换'),
      say('按住下层旋钮前方的解锁钮再转动，可选拍照、录像或 S&Q。S&Q 可拍慢快动作或缩时。现在选**拍照**。'),
      view('front'),
      hl('dial_front', '前拨盘'),
      say('食指位置是**前拨盘**，A 档和 M 档用它调光圈。'),
      view('top'),
      hl(['dial_rear_l', 'dial_rear_r'], '后拨盘 L 和 R'),
      say('拇指位置有两个拨盘：**后拨盘 L** 在 S 档和 M 档调快门；最右边的**后拨盘 R** 调曝光补偿，中间有锁定钮。'),
      hl(['btn_c2', 'btn_movie'], 'C2 和录像键'),
      say('顶部还有 **C2 自定义键**（出厂是对焦区域）和红圈的**录像键**。拍照时别误按录像键。'),
      view('back'),
      hl(['btn_menu', 'btn_fn'], '菜单键和 Fn 键'),
      say('**MENU** 打开完整菜单，**Fn** 打开 12 格快捷菜单。拍照、录像和回放的格子可以分别配置。'),
      hl(['btn_c1', 'btn_c3'], 'C1 和 C3'),
      say('拍照时，**C1** 出厂是白平衡模式。**C3** 在背面左上、MENU 旁边，出厂是对焦模式。'),
      hl(['btn_afon', 'btn_ael'], 'AF-ON 和 AEL'),
      say('**AF-ON** 启动对焦，**AEL** 锁定曝光。这两个键在对焦课和测光课里用。'),
      hl('joystick', '摇杆'),
      say('选「区」或「点: M」时，可以用**摇杆**移动对焦框。按下摇杆执行「对焦标准」，效果随区域而变。'),
      hl('wheel', '控制拨轮'),
      press('wheel', 'up'),
      say('拍照时，拨轮上键是 DISP，左键是「拍摄模式」（单张、连拍等），右键是 ISO。下键、中央键和直接转动出厂未设定拍摄功能。'),
      hl(['btn_play', 'btn_c4'], '回放键和删除键'),
      say('**C4** 有两种出厂用法。拍照时是「触摸操作选择」。按回放键看照片后，C4 才是「删除」，确认后删除当前照片。'),
      view('lens'),
      hl(['ring_focus', 'ring_zoom', 'ring_aperture'], '对焦环、变焦环、光圈环'),
      say('镜头上的三个环，从前往后依次是：**对焦环**、**变焦环**（24–70mm）、**光圈环**。光圈环放在 A，把光圈交给机身控制。'),
      view('left'),
      hl(['sw_focus_mode', 'sw_iris_lock', 'btn_focus_hold'], '镜头左侧'),
      say('从机身后面向前看，镜头左侧有 **AF/MF** 和 **IRIS LOCK**。选 AF，把光圈环放在 A 后锁住。两个对焦保持按钮分别在左侧和上方，自动对焦时按住可保持当前焦点。'),
      view('right'),
      hl(['sw_click', 'sw_zoom_smooth'], '镜头右侧'),
      say('右侧靠卡口的是 **CLICK**。ON 让光圈环转动时有档位感，OFF 可平滑调整。同侧的 **SMOOTH/TIGHT** 管变焦阻尼，TIGHT 能减少携带时镜筒意外伸出。'),
      view('left'),
      hl('ports', 'USB PORT 1 和 PORT 2'),
      say('机身左侧有两个 USB-C 口，关机时都能给电池充电。拷照片优先用 **PORT 1**，最高 10 Gbps；**PORT 2** 最高 480 Mbps。'),
    ]},
    { kind: 'read', markdown: `## 按区域认键

### 顶部
| 部件 | 出厂功能 | 新手怎么用 |
|---|---|---|
| [[power]] | 开 / 关 | 换镜头、换卡之前先关机 |
| [[shutter]] | 半按对焦和测光，按到底拍摄 | 看左下对焦指示，确认合焦再按到底 |
| [[mode_dial]] | AUTO / P / A / S / M / 1 / 2 / 3 | 前几课用 AUTO 和 P，L4 开始用 A |
| [[mode_switch]] | 拍照 / 录像 / S&Q（慢快动作或缩时） | 按住前方解锁钮，把下层旋钮转到拍照 |
| [[dial_rear_l]] | S 档、M 档调快门 | L4 学 |
| [[dial_rear_r]] | 曝光补偿，每格 1/3 档 | 不用时按下中间的锁定钮锁住 |
| [[btn_c2]] | 对焦区域 | L5 学 |
| [[btn_movie]] | 开始 / 停止录像 | 拍照时别误按 |
| [[hotshoe]] | 装闪光灯、麦克风 | 暂时用不到 |

### 正面
| 部件 | 出厂功能 | 新手怎么用 |
|---|---|---|
| [[dial_front]] | A 档、M 档调光圈 | L3、L4 学 |
| [[lens_release]] | 按住后转动，卸下镜头 | 先关机再按 |

### 背面
| 部件 | 出厂功能 | 新手怎么用 |
|---|---|---|
| [[btn_menu]] | 打开菜单 | L0 已经用过 |
| [[btn_fn]] | 12 格快捷菜单 | 拍照、录像、回放各有自己的排列。按 Fn 查看当前一套 |
| [[btn_c1]] | 白平衡模式 | 室内照片偏黄时用 |
| [[btn_c3]] | 拍照时选对焦模式 | 在背面左上，靠近 MENU |
| [[btn_afon]] | 启动自动对焦 | 进阶时学「后键对焦」 |
| [[btn_ael]] | 锁定曝光 | 测光课学 |
| [[joystick]] | 移动支持的对焦区域，按下执行「对焦标准」 | 选「区」或「点: M」后拨动摇杆试试 |
| [[wheel]] | 拍照时上键 DISP、左键「拍摄模式」、右键 ISO。下键和转动出厂未设定 | 录像时左键是自拍定时。回放时转动或按左右键换照片 |
| [[btn_center]] | 拍照时出厂未设定 | 菜单中按它确认选择 |
| [[btn_play]] | 回放照片 | 拍完放大检查 |
| [[btn_c4]] | 拍照时「触摸操作选择」，回放时「删除」 | 回放先放大查看，再决定是否删除 |
| [[lcd]] | 显示拍摄信息，可以触摸对焦，可以翻转 | 低角度、高角度拍摄时翻出来 |
| [[evf]] | 眼睛贴近时自动切换到取景器 | 强光下比看屏幕清楚 |
| [[diopter]] | 调取景器清晰度 | L0 已经调好 |

### 侧面和底部
| 部件 | 位置 | 内容 |
|---|---|---|
| [[card_door]] | 右侧 | 两个存储卡槽 |
| [[ports]] | 左侧 | 全尺寸 HDMI type A、耳机、麦克风。USB PORT 1 最高 10 Gbps，USB PORT 2 最高 480 Mbps。两个 USB-C 口均可充电 |
| [[battery_door]] | 底部 | NP-FZ100 电池 |

## 三个拨盘别搞混

| 拨盘 | 位置 | M 档出厂分工 |
|---|---|---|
| [[dial_front]] | 握把前面，食指 | 光圈 |
| [[dial_rear_l]] | 顶部右后，拇指 | 快门 |
| [[dial_rear_r]] | 顶部最右边，有锁定钮 | ISO AUTO 时调曝光补偿 |

M 档把光圈和快门分给两个拨盘。A 档时，前拨盘和后拨盘 L 都可以调光圈。S 档时，这两个拨盘都可以调快门。

## 镜头上的环和开关

| 部件 | 放在哪 | 为什么 |
|---|---|---|
| [[ring_focus]] | 不用碰 | 自动对焦时用不到，DMF / MF 时才转 |
| [[ring_zoom]] | 随意 | 24mm 视角最广，70mm 最窄，L8 专门讲 |
| [[ring_aperture]] | A | 光圈交给机身的 [[dial_front]] 控制 |
| [[sw_iris_lock]] | 左侧，光圈环在 A 时锁定 | 锁在 A 由机身调光圈。在数值档锁定则只能在 F2.8–F22 间转动 |
| [[sw_click]] | 右侧，ON | 转光圈环时有档位感。要平滑调光圈可拨到 OFF |
| [[sw_focus_mode]] | 左侧，AF | 自动对焦 |
| [[btn_focus_hold]] | 不用管 | 按住时对焦距离不变，以后可以改成别的功能 |
| [[sw_zoom_smooth]] | 右侧，按手感选 SMOOTH 或 TIGHT | TIGHT 增加变焦阻尼，减少镜筒意外伸出 |

## 新手先别动的设置
- **自定义键**（C1–C4、AEL、AF-ON）先保持出厂功能，这样课程里说的键名和你手上的一致。改过的话，在快门学院「我的 › 我的相机配置」里同步，AI 教练会按你的配置说键名。
- **模式转盘上的 1 / 2 / 3** 是记忆档，存的是自定义设置，L11 再学。` },
    { kind: 'practice', items: [
      { type: 'find_control', target: 'shutter' },
      { type: 'find_control', target: 'mode_dial' },
      { type: 'find_control', target: 'dial_front' },
      { type: 'find_control', target: 'dial_rear_l' },
      { type: 'find_control', target: 'dial_rear_r' },
      { type: 'find_control', target: 'btn_fn' },
      { type: 'find_control', target: 'btn_afon' },
      { type: 'find_control', target: 'joystick' },
      { type: 'find_control', target: 'btn_play' },
      { type: 'find_control', target: 'ring_aperture' },
      { type: 'operate', prompt: '把模式转盘转到 A', control: 'mode_dial', start: { mode: 'AUTO' }, expect: { mode: 'A' }, hint: '模式转盘在顶部，取景器右侧' },
      { type: 'choice', q: 'M 档、镜头光圈环在 A，出厂时哪个拨盘调光圈？', options: ['前拨盘', '后拨盘 L', '后拨盘 R'], answer: 0, explain: 'M 档用食指位置的前拨盘调光圈，后拨盘 L 调快门。' },
      { type: 'choice', q: '镜头上的光圈环应该放在哪？', options: ['A', 'F2.8', 'F22'], answer: 0, explain: '放在 A，光圈由机身的前拨盘控制，课程里的操作才对得上。' },
      { type: 'choice', q: '拍照时，哪个键能打开可自定义的 12 格快捷菜单？', options: ['Fn', 'C3', '回放键'], answer: 0, explain: '按 Fn 查看本机当前的快捷菜单。要直接选 ISO 或对焦模式，出厂键位分别是控制拨轮右键和 C3。' },
    ]},
    { kind: 'task', title: '3D 找键练习满分', photos: 0, complete_by: 'practice_mode',
      steps: ['进入相机 Tab 的练习模式', '10 道找键题全部答对'],
      success_criteria: '练习得分 10/10' },
  ],
  needs_verification: [],
});

/* ======================================================================
 * L2 第一张照片
 * ====================================================================== */
LESSONS.push({
  id: 'L2',
  title: '第一张照片',
  minutes: 20,
  goals: ['用智能自动和 P 档拍照', '正确地半按对焦、按到底拍摄', '拍完会回放、放大，检查照片清不清楚'],
  sections: [
    { kind: 'demo', steps: [
      view('top'),
      hl('mode_dial', '转到 AUTO'),
      turnTo('mode_dial', 'AUTO'),
      settings({ scene_ev: 12, mode: 'AUTO' }),
      say('**AUTO（智能自动）**：光圈、快门、ISO 全部由相机决定，你只管构图和按快门。'),
      hl('shutter', '先半按'),
      press('shutter'),
      say('把快门**轻轻按到一半**，看屏幕左下的对焦指示。确认合焦，再**平稳地按到底**。拍静物用单次 AF 时，打开拍摄提示音可听到哔声；连续 AF 靠屏幕判断。'),
      turnTo('mode_dial', 'P'),
      settings({ mode: 'P' }),
      say('**P 档**仍由相机计算光圈和快门。想自己选 ISO、调曝光补偿或指定对焦区域，就从 AUTO 换到 P。'),
      view('back'),
      hl('btn_play', '回放'),
      press('btn_play'),
      say('拍完按**回放键**看照片。屏幕上的小图看着清楚不代表真的清楚，一定要**放大**检查。'),
      hl('wheel', '转动：切换照片'),
      say('回放时转动**控制拨轮**切换上一张、下一张。'),
      hl('btn_c4', '删除'),
      say('确认拍糊了再按**删除键**。删之前先放大看清楚。'),
    ]},
    { kind: 'read', markdown: `## AUTO 和 P 档

| | AUTO 智能自动 | P 程序自动 |
|---|---|---|
| 光圈、快门 | 相机定 | 相机定 |
| ISO、白平衡 | ISO AUTO、自动白平衡 | 可自行选择 |
| 曝光补偿 | 不可调 | 可用后拨盘 R 调整 |
| 拍照对焦方式 | 可选单次 AF 或连续 AF | 可按主体选对焦方式 |
| 对焦区域 | 固定为广域 | 可选广域、区、点等 |
| 适合 | 第一次拿相机，先拍起来 | 想开始自己控制，又不想算参数 |

先用 AUTO 拍几十张，熟悉按快门和看回放，再换到 P。

## 正确地按快门
1. **半按**：手指轻按到有阻力的位置。相机这时对焦、测光。
2. **确认合焦**：看屏幕左下的对焦指示，闪烁表示尚未合焦。拍静物时，单次 AF 合焦后锁定，开启拍摄提示音可听到哔声。连续 AF 会持续调整焦点，合焦时没有哔声。用广域拍照可看到绿色合焦框，连拍或一下按到底时框可能不亮。
3. **按到底**：平稳地往下压，不要猛戳。猛戳会让机身晃动，照片容易糊。
4. **按完别急着放下相机**：保持姿势一两秒，尤其是快门比较慢的时候。

## 持机姿势
- **右手**握紧握把，食指放在 [[shutter]] 上。
- **左手**掌心向上，托住镜头底部，让两只手一起承重。
- **手肘**贴住身体两侧，不要向外张开。
- 用 [[evf]] 拍时，相机贴着脸，又多一个支撑点，比举着看屏幕更稳。

## 回放检查
1. 按 [[btn_play]] 进入回放，转动 [[wheel]] 切换照片。
2. **放大**：回放触摸开启时，双击照片，再拖动到眼睛或你要检查的细节。也可以按 [[btn_afon]]（回放时的放大键）。放大键出厂从拍摄对焦位置开始，缺少对焦信息时从中央开始。菜单的「放大初始位置」也可设成「中央」。
3. 放大后边缘清楚、没有重影，才算清楚。
4. 拍糊了按 [[btn_c4]] 删除，或者先留着，交给 AI 教练分析原因。

## 半按后对焦指示闪烁，怎么办
| 原因 | 怎么办 |
|---|---|
| 离得太近 | 这支镜头的最近对焦距离：24mm 端约 0.21 米，70mm 端约 0.3 米（从机身上的传感器位置算起）。往后退一点 |
| 对着没有纹理的地方，比如白墙、纯色天空 | 对着有边缘、有明暗变化的地方对焦 |
| 太暗 | 换到亮一点的地方，或者对着有灯光的物体 |
| 镜头上的开关在 MF | 把 [[sw_focus_mode]] 拨回 AF |` },
    { kind: 'practice', items: [
      { type: 'operate', prompt: '把模式转盘转到 P', control: 'mode_dial', start: { mode: 'AUTO' }, expect: { mode: 'P' }, hint: '转盘上 AUTO 旁边就是 P' },
      { type: 'choice', q: '半按快门时，相机在做什么？', options: ['对焦和测光', '拍一张照片', '打开回放'], answer: 0, explain: '半按是对焦和测光，按到底才拍摄。' },
      { type: 'choice', q: '左手应该怎么放？', options: ['掌心向上托住镜头底部', '握住机身左侧', '不用管，右手单手拍'], answer: 0, explain: '托住镜头，让两手一起承重，按快门时更稳。' },
      { type: 'choice', q: '对着一面白墙，半按时对焦指示一直闪烁，为什么？', options: ['白墙没有纹理，相机难以合焦', '电池电量低', '存储卡满了'], answer: 0, explain: '自动对焦需要边缘和明暗变化。对着有纹理的地方再试。' },
      { type: 'choice', q: '用 70mm 拍花，从机身传感器平面量到花只有 20 厘米。半按后对焦指示闪烁，最可能的原因？', options: ['比最近对焦距离还近', '光圈太大', 'ISO 太低'], answer: 0, explain: '70mm 端至少要约 30 厘米，24mm 端也要约 21 厘米。从传感器平面量起，两个焦段都要往后退。' },
      { type: 'choice', q: '拍完怎么确认照片清不清楚？', options: ['回放后放大，看主体最重要的部位', '看屏幕上的小图就行', '导到电脑上再说'], answer: 0, explain: '小图上看着清楚的照片，放大后可能是糊的。当场放大检查，糊了还能重拍。' },
      { type: 'choice', q: 'P 档和 AUTO 最大的区别是？', options: ['P 档可以自己改 ISO、曝光补偿等设置', 'P 档画质更好', 'P 档对焦更快'], answer: 0, explain: '两个档位都由相机算光圈和快门。P 档允许你修改其他设置，画质和对焦速度没有区别。' },
    ]},
    { kind: 'task', title: '拍 10 种不同的东西，全部对焦清晰', photos: 4, complete_by: 'ai',
      steps: ['模式转盘转到 P', '拍 10 种不同的东西：杯子、书、植物、钥匙……远近都试一试', '每张都回放放大检查，糊了就重拍', '挑 4 张上传，其中至少 1 张是近拍'],
      success_criteria: '4 张照片的主体都对焦清晰，没有手抖造成的糊',
      ai_rubric: ['EXIF 拍摄模式是 P 或智能自动', '每张的主体都清晰，对焦点落在主体上（能读到对焦点时核对）', '没有手抖造成的重影；如果糊了，结合快门速度说明原因', '指出其中最好的一张，说明好在哪里'] },
  ],
  needs_verification: [],
});

/* ======================================================================
 * L3 曝光三要素
 * ====================================================================== */
expo('L3', '阴天 M 档 F2.8 1/500 ISO100 曝光准确', 'M', 12, { aperture: 2.8, shutter: '1/500', iso: 100 }, { bias: 0.1 });
expo('L3', '光圈收到 F4 暗一档', 'M', 12, { aperture: 4, shutter: '1/500', iso: 100 }, { bias: -1 });
expo('L3', 'F4 配 1/250 亮回来', 'M', 12, { aperture: 4, shutter: '1/250', iso: 100 }, { bias: 0 });
expo('L3', '等效曝光 F5.6 1/125 ISO100', 'M', 12, { aperture: 5.6, shutter: '1/125', iso: 100 }, { bias: 0.1 });
expo('L3', '等效曝光 F8 1/125 ISO200', 'M', 12, { aperture: 8, shutter: '1/125', iso: 200 }, { bias: 0 });
expo('L3', '晴天 F8 ISO100 约 1/500', 'A', 15, { aperture: 8, iso: 100 }, { shutter: '1/500' });
expo('L3', '晴天 16 法则：F16 ISO100 约 1/125', 'A', 15, { aperture: 16, iso: 100 }, { shutter: '1/125' });
expo('L3', '阴天 A 档 F2.8 ISO100 → 1/500', 'A', 12, { aperture: 2.8, iso: 100 }, { shutter: '1/500' });
expo('L3', '阴天 A 档 F11 ISO100 → 1/30', 'A', 12, { aperture: 11, iso: 100 }, { shutter: '1/30' });
expo('L3', '室内 F2.8 1/125 ISO800 曝光准确', 'M', 7, { aperture: 2.8, shutter: '1/125', iso: 800 }, { bias: 0.1 });

LESSONS.push({
  id: 'L3',
  title: '曝光三要素',
  minutes: 25,
  goals: ['明白光圈、快门、ISO 各自管什么，各有什么副作用', '知道"一档"是什么意思', '会用等效曝光：一个参数变暗一档，另一个变亮一档'],
  sections: [
    { kind: 'demo', steps: [
      view('back'),
      settings({ scene_ev: 12, mode: 'M', aperture: 2.8, shutter: '1/500', iso: 100, ev: 0 }),
      say('先看一个例子：阴天户外，**F2.8、1/500 秒、ISO 100**，屏幕上的测光表在 0 附近，曝光准确。'),
      view('front'),
      hl('dial_front', '前拨盘：光圈'),
      settings({ aperture: 4 }),
      say('镜头光圈环在 A，转前拨盘，看屏幕从 **F2.8 变为 F4**。进光少一半，画面**暗了一档**，测光表到 −1。'),
      view('top'),
      hl('dial_rear_l', '后拨盘 L：快门'),
      settings({ shutter: '1/250' }),
      say('转后拨盘 L，看快门从 **1/500 放慢到 1/250**。曝光时间加倍，测光表**回到 0**。'),
      view('back'),
      hl('wheel', '按右：ISO'),
      press('wheel', 'right'),
      say('**ISO** 是把信号放大：ISO 100 → 200 亮一档，代价是噪点变多。拨轮按右就能改。'),
      say('记住一句话：**光圈、快门、ISO 每变一档，亮度就变一倍或一半。** 一个暗一档、另一个亮一档，曝光就不变。'),
    ]},
    { kind: 'read', markdown: `## 曝光就是进来多少光

照片的亮度由三样东西决定：

| | 管什么 | 在哪调 | 副作用 |
|---|---|---|---|
| **光圈** | 镜头开口多大 | [[dial_front]] | 背景虚不虚（景深） |
| **快门** | 开口打开多久 | [[dial_rear_l]] | 动的东西糊不糊 |
| **ISO** | 信号放大多少 | [[wheel]] 按右 | 噪点多不多 |

三样东西都能让照片变亮或变暗。选哪一个，要看你能接受哪种副作用。

## 光圈
- **F 数越小，开口越大**：F2.8、F4、F5.6、F8、F11、F16、F22，相邻两个差**一档**，进光差一倍。
- F2.8 到 F8 差 3 档，进光差 8 倍。
- **副作用：景深。** F2.8 背景虚化，适合人像；F8–F11 前后都清楚，适合风景。
- 这支镜头最大光圈是 F2.8，24–70mm 全程都是。

## 快门
- 1/1000、1/500、1/250、1/125、1/60……相邻两个差**一档**。
- **副作用：运动。** 快门越慢，动的东西越糊，手抖也越明显。

| 想拍 | 快门大约 |
|---|---|
| 定格走路的人 | 1/250 |
| 定格跑步、跳跃、宠物 | 1/1000 |
| 手持不抖（经验值） | 不慢于 1 / 焦距，比如 70mm 用 1/80 或更快。机身防抖能再放宽一些，拍人时人也会动，1/125 更稳 |
| 流水拉丝、车灯轨迹 | 1/4 秒或更慢，需要三脚架或把相机放稳 |

## ISO
- 100、200、400、800、1600、3200、6400，相邻两个差**一档**。
- **副作用：噪点。** 数字越大，画面颗粒越多、细节越少。
- 原则：**光线够时用低 ISO**。只有光圈已经开到最大、快门不能再慢时，才提高 ISO。

## 等效曝光

阴天户外（场景亮度 EV 12），下面四组参数的曝光完全一样：

| 光圈 | 快门 | ISO | 怎么来的 |
|---|---|---|---|
| F2.8 | 1/500 | 100 | 起点 |
| F4 | 1/250 | 100 | 光圈暗一档，快门亮一档 |
| F5.6 | 1/125 | 100 | 再换一次 |
| F8 | 1/125 | 200 | 光圈暗一档，ISO 亮一档 |

亮度一样，效果不一样：F2.8 那张背景最虚，F8 那张前后最清楚；ISO 200 那张噪点多一点点，基本看不出来。

## 场景有多亮

| 场景 | 亮度（EV，ISO 100） | 例子 |
|---|---|---|
| 晴天户外 | 15 | F8、1/500、ISO 100 |
| 阴天户外 | 12 | F2.8、1/500、ISO 100 |
| 室内 | 7 | F2.8、1/125、ISO 800 |
| 夜景街头 | 4 | 要用高 ISO，或者三脚架加慢快门 |

EV 每差 1，亮度差一倍。晴天比室内亮 8 档，也就是 256 倍。

**晴天 16 法则**：晴天顺光时，光圈 F16，快门约等于 1 / ISO。比如 F16、ISO 100、1/125。

去「实验室」里换不同场景，把三个参数都转一转，看画面怎么变。` },
    { kind: 'practice', items: [
      { type: 'choice', q: 'F2.8 和 F8，哪个进光多？', options: ['F2.8', 'F8', '一样多'], answer: 0, explain: 'F 数越小开口越大。F2.8 → F4 → F5.6 → F8 是 3 档，进光差 8 倍。' },
      { type: 'choice', q: '快门从 1/250 改成 1/500，照片会？', options: ['暗一档', '亮一档', '亮度不变'], answer: 0, explain: '1/500 的时间是 1/250 的一半，进光少一半，就是暗一档。' },
      { type: 'choice', q: 'ISO 从 100 提到 400，亮了几档？', options: ['2 档', '4 档', '1 档'], answer: 0, explain: '100 → 200 是一档，200 → 400 又是一档，一共 2 档，亮度是原来的 4 倍。' },
      { type: 'choice', q: '想拍背景虚化的人像，主要调哪个？', options: ['光圈开大（F 数调小）', '快门调快', 'ISO 调高'], answer: 0, explain: '背景虚不虚由光圈决定。F2.8 虚化最强。' },
      { type: 'choice', q: '拍跑动的小狗总是糊，先改哪个？', options: ['快门调快到 1/1000 左右', '光圈收小', 'ISO 调低'], answer: 0, explain: '动的东西糊，是快门太慢。快门调快以后变暗了，再用光圈或 ISO 补回来。' },
      { type: 'set_exposure', prompt: '阴天户外，M 档。快门锁在 1/500、ISO 锁在 100。只转光圈，让测光表回到 0。', scene_ev: 12, mode: 'M',
        start: { aperture: 8, shutter: '1/500', iso: 100, ev: 0 }, lock: ['shutter', 'iso', 'ev'], goal: { bias: [-0.3, 0.3] },
        explain: 'F8 比 F2.8 少 3 档光，所以要把光圈开回 F2.8。' },
      { type: 'set_exposure', prompt: '还是阴天。光圈锁在 F5.6、ISO 锁在 100，只调快门，让曝光准确。', scene_ev: 12, mode: 'M',
        start: { aperture: 5.6, shutter: '1/500', iso: 100, ev: 0 }, lock: ['aperture', 'iso', 'ev'], goal: { bias: [-0.3, 0.3] },
        explain: 'F2.8 → F5.6 少了 2 档光，快门从 1/500 放慢 2 档到 1/125 补回来。' },
      { type: 'set_exposure', prompt: '室内，手持拍要 1/125，光圈已经开到 F2.8（都锁定）。只调 ISO，让曝光准确。', scene_ev: 7, mode: 'M',
        start: { aperture: 2.8, shutter: '1/125', iso: 100, ev: 0 }, lock: ['aperture', 'shutter', 'ev'], goal: { bias: [-0.3, 0.3] },
        explain: '室内比阴天暗 5 档。F2.8、1/125 在 ISO 100 下差 3 档，ISO 提到 800 正好补上。' },
    ]},
    { kind: 'task', title: '同一个场景，F2.8 和 F11 各拍一张', photos: 2, complete_by: 'ai',
      steps: ['在光线稳定的地方找一个主体，离你 1–2 米，背景在 10 米以外', '模式转盘转到 A，固定 ISO 100，用前拨盘把光圈调到 F2.8，拍一张', '构图不变，把光圈调到 F11，再拍一张', '两张都上传'],
      success_criteria: 'F2.8 那张背景明显更虚，两张构图基本一样',
      ai_rubric: ['两张的 EXIF 光圈分别约为 F2.8 和 F11（允许差 1/3 档）', '两张构图基本相同', 'F2.8 那张背景明显更虚', '比较两张 EXIF。光线和 ISO 相同时，F2.8 收到 F11 后快门约慢 4 档。如果出现重影，结合快门和画面判断是否手抖'] },
  ],
  needs_verification: [],
});

/* ======================================================================
 * L4 A 档与 S 档
 * ====================================================================== */
expo('L4', '阴天 A 档 F2.8 ISO AUTO → 1/500 ISO100', 'A', 12, { aperture: 2.8, iso: 'AUTO' }, { shutter: '1/500', iso: 100 });
expo('L4', '收到 F8 → 1/60 ISO100', 'A', 12, { aperture: 8, iso: 'AUTO' }, { shutter: '1/60', iso: 100 });
expo('L4', '阴天 S 档 1/1000 ISO AUTO → F2.8 ISO200', 'S', 12, { shutter: '1/1000', iso: 'AUTO' }, { aperture: 2.8, iso: 200 });
expo('L4', 'S 档加 +1.0 曝光补偿 → ISO400', 'S', 12, { shutter: '1/1000', iso: 'AUTO', ev: 1 }, { aperture: 2.8, iso: 400 });
expo('L4', '阴天 S 档 1/4 ISO100 → 光圈到头仍过曝', 'S', 12, { shutter: '1/4', iso: 100 }, { warn: '光圈已收到 F22，仍然过曝' });
expo('L4', '傍晚 EV9 S 档 1/4 ISO100 → F11', 'S', 9, { shutter: '1/4', iso: 100 }, { aperture: 11 });
expo('L4', '逆光 EV14 A 档 F2.8 +1.3 → 1/800', 'A', 14, { aperture: 2.8, iso: 'AUTO', ev: 1.3 }, { shutter: '1/800' });
expo('L4', '晴天 A 档 F8 ISO100 → 1/500', 'A', 15, { aperture: 8, iso: 100 }, { shutter: '1/500' });

LESSONS.push({
  id: 'L4',
  title: 'A 档与 S 档',
  minutes: 25,
  goals: ['用 A 档控制背景虚化和前后清晰', '用 S 档控制动作定格和流水拉丝', '会用曝光补偿让照片变亮或变暗，看懂参数闪烁的警告'],
  sections: [
    { kind: 'demo', steps: [
      view('top'),
      hl('mode_dial', '转到 A'),
      turnTo('mode_dial', 'A'),
      settings({ scene_ev: 12, mode: 'A', aperture: 2.8, iso: 'AUTO', ev: 0 }),
      say('**A 档（光圈优先）**：你定光圈，相机算快门。阴天 F2.8，相机给出 1/500。'),
      view('front'),
      hl('dial_front', '前拨盘：光圈'),
      settings({ aperture: 8 }),
      say('光圈收到 **F8**，进光少了 3 档，相机自动把快门放慢到 **1/60**，亮度不变。注意：快门越慢越容易手抖。'),
      view('top'),
      turnTo('mode_dial', 'S'),
      settings({ mode: 'S', shutter: '1/1000', iso: 'AUTO', ev: 0 }),
      hl('dial_rear_l', '后拨盘 L：快门'),
      say('**S 档（快门优先）**：你定快门，相机算光圈。快门 1/1000，光圈开到 F2.8 还不够亮，ISO AUTO 自动升到 **200**。'),
      hl('dial_rear_r', '后拨盘 R：曝光补偿'),
      settings({ ev: 1 }),
      say('确认后拨盘 R 已解锁，转到曝光补偿 **+1.0**，画面亮一档。这个例子中快门不变，相机把 ISO 从 200 提到 400。'),
      say('**屏幕上的数字闪烁 = 相机已经到极限**，比如光圈开到 F2.8 也不够亮。这时曝光会不准，要换参数。'),
    ]},
    { kind: 'read', markdown: `## 选 A 还是选 S

| 你最在意 | 用 | 你调 | 相机调 |
|---|---|---|---|
| 背景虚不虚、前后清不清楚 | **A 光圈优先** | 光圈：[[dial_front]] | 快门 |
| 动作定不定格、水流拉不拉丝 | **S 快门优先** | 快门：[[dial_rear_l]] | 光圈 |

建议把 **A 档当成日常默认档**，拍运动或者想拍拉丝效果时切到 S。

## A 档：盯住快门
A 档里，光线变暗时相机会放慢快门来补光，快门可能慢到手抖。

- P 或 A 档选 **ISO AUTO** 时，在 MENU › 曝光/颜色 › 曝光 › ISO AUTO最小速度 设置何时开始提高 ISO。出厂的「标准」按镜头焦距选速度。想定格运动，可以选更快的速度。ISO 升到上限仍不够亮时，快门还会继续放慢。本课实验室用固定的 1/60 秒演示这个过程。
- 常用光圈：

| 想拍 | 光圈 |
|---|---|
| 人像、背景虚化 | F2.8 |
| 几个人的合影 | F5.6–F8，保证每个人都清楚 |
| 风景、建筑 | F8–F11 |

F16、F22 会因为衍射让画面变软，非必要不用。

## S 档：盯住光圈和 ISO
S 档里，光线不够时相机会开大光圈；开到 F2.8 还不够，只能提高 ISO（ISO AUTO 时）。ISO 是固定值时，照片会欠曝，屏幕上的光圈值会闪烁提醒你。

| 想拍 | 快门 |
|---|---|
| 走路的人 | 1/250 |
| 跑步、运动、宠物 | 1/1000 |
| 流水拉丝 | 1/4 秒或更慢，相机要放稳 |

拍流水时，白天光线太强，光圈收到 F22 还是过曝，快门根本放不慢。选**阴天、傍晚或树荫下**拍：傍晚 1/4 秒、ISO 100 大约是 F11。

## 曝光补偿
相机测光时，默认画面应该是"中等亮度"。画面里大片很亮或很暗的东西，会把它骗过去。

看 [[dial_rear_r]] 中央的锁定钮。弹起露出白线时可以转动，默认每格 1/3 档。看屏幕上的数值，往 + 调使照片变亮，往 − 调使照片变暗。

| 情况 | 补偿 |
|---|---|
| 逆光拍人，脸是黑的 | +1.0 到 +1.7 |
| 雪景、白墙、白纸发灰 | +0.7 到 +1.3 |
| 黑色主体、夜景太亮 | −0.7 到 −1.3 |

P、A、S 档可用曝光补偿。M 档需要 ISO AUTO，智能自动无法调补偿。不用时按下锁定钮，避免误转。

## 数字闪烁：相机到极限了
| 档位 | 闪烁的是 | 意思 | 怎么办 |
|---|---|---|---|
| A 档 | 快门速度 | 在当前光线下，可用快门速度范围内无法得到合适曝光 | 调光圈或 ISO，直到读数停止闪烁 |
| S 档 | 光圈 | 光圈到 F2.8 仍然欠曝，或者到 F22 仍然过曝 | 调快门或 ISO |` },
    { kind: 'practice', items: [
      { type: 'choice', q: '想拍背景虚化的人像，用哪个档？', options: ['A 档，光圈开到 F2.8', 'S 档，快门 1/1000', 'AUTO'], answer: 0, explain: '背景虚化由光圈决定，A 档让你直接控制光圈。' },
      { type: 'choice', q: '拍篮球比赛，要把动作定格？', options: ['S 档，快门 1/1000 左右', 'A 档 F8', 'P 档'], answer: 0, explain: '定格靠快门速度，S 档让你直接控制快门。' },
      { type: 'choice', q: '室内用 A 档 F8 拍，照片出现手抖的重影，最可能的原因？', options: ['相机为了补光把快门放得太慢', '光圈太大', 'ISO 太低导致对焦失败'], answer: 0, explain: '看照片的快门读数。可以开大光圈，或用 ISO AUTO 并在「ISO AUTO最小速度」中选择适合手持的速度。' },
      { type: 'choice', q: '拍雪景，照片总是灰蒙蒙的，应该？', options: ['曝光补偿往 + 调', '曝光补偿往 − 调', '快门调快'], answer: 0, explain: '相机把大片白雪当成中等亮度，压暗了。往 + 补偿，雪才是白的。' },
      { type: 'set_exposure', prompt: '晴天拍风景，A 档，ISO 锁在 100。要前后都清楚：光圈调到 F8 或更小，同时曝光准确。', scene_ev: 15, mode: 'A',
        start: { aperture: 2.8, iso: 100, ev: 0 }, lock: ['iso', 'ev'], goal: { aperture_min: 8, bias: [-0.3, 0.3] },
        explain: 'A 档下你只管光圈，F8 时相机自动给出 1/500 左右的快门。' },
      { type: 'set_exposure', prompt: '阴天拍跑动的小狗，S 档，ISO AUTO（锁定）。快门至少 1/1000，曝光准确。', scene_ev: 12, mode: 'S',
        start: { aperture: 2.8, shutter: '1/125', iso: 'AUTO', ev: 0 }, lock: ['iso', 'ev'], goal: { shutter_max_time: '1/1000', bias: [-0.3, 0.3] },
        explain: '快门调到 1/1000，光圈开到 F2.8 还差一点，ISO AUTO 会自动升到 200 左右。' },
      { type: 'set_exposure', prompt: '逆光人像，A 档 F2.8、ISO AUTO（都锁定）。相机按整个画面测光，脸暗了 1 档多。用曝光补偿把脸救回来（+1.0 到 +1.7）。', scene_ev: 14, mode: 'A',
        start: { aperture: 2.8, iso: 'AUTO', ev: 0 }, lock: ['aperture', 'iso', 'shutter'], goal: { bias: [1, 1.7] },
        explain: '后拨盘 R 往 + 转 3–5 格。A 档下光圈不变，相机放慢快门，比如从 1/2000 放慢到 1/800。代价是背后的天空会更亮。' },
    ]},
    { kind: 'task', title: 'A 档拍虚化人像，S 档拍流水', photos: 2, complete_by: 'ai',
      steps: ['A 档、F2.8、焦距 70mm，人离你 2 米左右、背景在 10 米以外，拍一张半身人像', 'S 档、快门 1/4 秒或更慢，ISO 100，拍流水：水龙头、喷泉、小溪都行。相机放在三脚架上，或者靠在栏杆上', '光线太亮快门放不慢时，换到阴天、傍晚或树荫下', '两张都上传'],
      success_criteria: '人像背景明显虚化，人脸清楚；流水有拉丝感，静止的部分清楚',
      ai_rubric: ['照片 1：EXIF 是 A 档，光圈 F4 或更大（F 数更小），背景明显虚化，人脸清楚', '照片 2：EXIF 是 S 档，快门 1/4 秒或更慢，水流有拉丝感，石头、栏杆等静止部分清楚', '如果流水照片整体糊，指出是相机没放稳；如果过曝，指出光线太强、应该换时间拍'] },
  ],
  needs_verification: [],
});

/* ======================================================================
 * L5 对焦系统
 * ====================================================================== */
dof('L5', '70mm F2.8 1 米：清楚范围约 3–4 厘米', 70, 2.8, 1, [3, 4]);
dof('L5', '70mm F2.8 2 米：清楚范围约 13 厘米', 70, 2.8, 2, [12, 14]);

LESSONS.push({
  id: 'L5',
  title: '对焦系统',
  minutes: 25,
  goals: ['认识拍照出厂的 AF-A，会按主体选择 AF-S、AF-C、DMF 或 MF', '会选对焦区域，用摇杆移动对焦框', '用被摄体识别和眼部对焦拍人'],
  sections: [
    { kind: 'demo', steps: [
      settings({ mode: 'P' }),
      view('left'),
      hl('sw_focus_mode', 'AF / MF 开关'),
      slide('sw_focus_mode', 'AF'),
      say('先确认镜头上的开关在 **AF**，否则怎么按快门都不会自动对焦。'),
      view('back'),
      hl('btn_c3', 'C3：对焦模式'),
      press('btn_c3'),
      settings({ focus_mode: 'AF-C' }),
      say('拍照出厂为 **AF-A**，相机依主体动静切换对焦方式。这里用 P 档，按 **C3** 选 **AF-C**，半按跟住走动的人。拍静物也可选 **AF-S**。'),
      view('top'),
      hl('btn_c2', 'C2：对焦区域'),
      press('btn_c2'),
      settings({ focus_area: 'spot' }),
      say('按 **C2** 选对焦区域。**广域**让相机自己找主体。这里选 **点: M**，把一个中等大小的框放在想拍清楚的部位。'),
      view('back'),
      hl('joystick', '摇杆：移动对焦框'),
      press('joystick', 'left', 2),
      say('拨**摇杆**移动「点: M」的对焦框。按下摇杆执行「对焦标准」：这个点可回中央。换成广域时，按下会对画面中央自动对焦。'),
      view('lens'),
      hl('btn_focus_hold', '对焦保持'),
      say('镜头上的**对焦保持按钮**：按住时对焦距离不变。以后可以把它改成别的功能。'),
      hl('ring_focus', '对焦环'),
      say('**对焦环**在 DMF 和 MF 时用：DMF 是先自动对焦再手动微调，MF 全靠手转。'),
    ]},
    { kind: 'read', markdown: `## 半按快门时发生了什么
相机在对焦区域里找到主体，驱动镜头里的对焦镜片，让主体变清楚。对焦区域、对焦模式决定了**对哪里**和**对几次**。

## 对焦模式：[[btn_c3]]

| 模式 | 怎么工作 | 适合 |
|---|---|---|
| **AF-S** 单次AF | 半按合焦后锁定 | 静物、风景、站着不动的人 |
| **AF-A** 自动AF | 相机根据主体动静切换单次与连续 AF | 拍照出厂值，需使用支持相位检测 AF 的镜头 |
| **AF-C** 连续AF | 半按期间一直跟着主体对焦 | 走路的人、孩子、宠物、运动 |
| **DMF** | 先自动对焦，再转 [[ring_focus]] 微调 | 近拍、需要精确对在某一点 |
| **MF** 手动对焦 | 自己转 [[ring_focus]] | 星空、隔着玻璃、自动对焦对不上的场景 |

录像可选连续 AF 或手动对焦。下面用拍照 P 档练习，在 AUTO 智能自动下对焦区域固定为广域。

## 对焦区域：[[btn_c2]]

| 区域 | 怎么工作 | 适合 |
|---|---|---|
| **广域** | 相机在整个画面里自己选 | 主体明显、配合主体识别 |
| **区** | 在你选的一块区域里找 | 主体大概在某个位置 |
| **中间固定** | 只对画面中间 | 先对焦再构图 |
| **点: XL、点: L、点: M、点: S、点: XS** | 选框的大小，再用 [[joystick]] 移到指定部位 | 静物或小目标，本课用「点: M」。APS-C 尺寸下没有 XS |
| **扩展点** | 指定点难以合焦时，会用周围的对焦点辅助 | 单点容易丢失的小主体 |
| **自定义 1、自定义 2、自定义 3** | 自定框的大小与长宽比，再移动到合适位置 | 需要特定形状的对焦区域 |
| **跟踪** | 仅限拍照并选连续 AF，选「跟踪」后用左右键选起始区域，半按后跟踪 | 运动的主体 |

摇杆可以移动区、各尺寸点、扩展点、自定义区域以及相应的跟踪起点。按下摇杆出厂执行「对焦标准」。可移动的框回到中央或所跟踪的被摄体。选「广域」「中间固定」或它们的跟踪起点时，按下会对画面中央自动对焦。

## 新手推荐组合
| 拍什么 | 对焦模式 | 对焦区域 | 主体识别 |
|---|---|---|---|
| 人、宠物 | AF-C | 广域 | 开，识别目标按主体选「人」或「动物」 |
| 静物、风景 | AF-S | 点: M | 对准指定细节时可关 |

## 主体识别和眼部对焦
拍人要确认两个设置，一个决定是否识别，一个决定找什么。

1. 在 MENU › 对焦 › 被摄体识别 › AF中的被摄体识别 确认选「开」，这是出厂值。
2. 在 MENU › 对焦 › 被摄体识别 › 识别目标 选「人」（出厂值）。八种选项是「自动」「人」「动物/鸟类」「动物」「鸟类」「昆虫」「汽车/火车」「飞机」。
3. 拍走动的人用 AF-C。半按快门跟住主体，看到识别框落到眼睛上再拍。回放放大检查眼睛是否清楚。

拍人像时，眼睛清楚比什么都重要。

## 对焦准了，为什么还是只有一部分清楚
这是景深浅，不是没对上焦。70mm、F2.8、离人 1 米时，前后清楚的范围只有大约 **3–4 厘米**：对在鼻尖上，眼睛就虚了。离人 2 米时，这个范围大约是 13 厘米。

想让更多部分清楚：退远一点、光圈收到 F4–F5.6，或者用眼部对焦保证对在眼睛上。

## 对不上焦的常见原因
| 原因 | 怎么办 |
|---|---|
| 离得太近 | 从传感器平面量到主体，24mm 端至少约 0.21 米，70mm 端至少约 0.30 米 |
| 主体没有纹理，比如白墙、纯色天空 | 对着有边缘、有明暗变化的地方 |
| 广域对到了背景 | 换成「点: M」并移动框，或按上面的步骤确认识别开关和目标 |
| 镜头开关在 MF | [[sw_focus_mode]] 拨回 AF |` },
    { kind: 'practice', items: [
      { type: 'find_control', target: 'btn_c3' },
      { type: 'find_control', target: 'btn_c2' },
      { type: 'find_control', target: 'joystick' },
      { type: 'find_control', target: 'sw_focus_mode' },
      { type: 'operate', prompt: '用 C3 把对焦模式切到 AF-C', control: 'btn_c3', start: { mode: 'P', focus_mode: 'AF-A' }, expect: { focus_mode: 'AF-C' }, hint: 'C3 在背面左上，靠近 MENU' },
      { type: 'operate', prompt: '用 C2 把对焦区域切到「点: M」', control: 'btn_c2', start: { mode: 'P', focus_area: 'wide' }, expect: { focus_area: 'spot' }, hint: 'C2 在顶部，录像键旁边' },
      { type: 'choice', q: '拍走过来的孩子，用哪个对焦模式？', options: ['AF-C', 'AF-S', 'MF'], answer: 0, explain: 'AF-C 在半按期间一直跟着主体对焦。AF-S 对好一次就锁住，孩子一动就虚了。' },
      { type: 'choice', q: '拍桌上的手表，想用自动对焦对在表盘的某个刻度上？', options: ['AF-S + 点: M', 'AF-C + 广域', 'MF + 广域'], answer: 0, explain: '静物可用 AF-S。选「点: M」后，用摇杆把框移到刻度上。' },
      { type: 'choice', q: '70mm、F2.8、1 米外拍人像，前后清楚的范围大约有多少？', options: ['3–4 厘米', '30–40 厘米', '3–4 米'], answer: 0, explain: '景深非常浅，对在鼻尖上眼睛就虚了。所以拍人像要用眼部对焦。' },
      { type: 'choice', q: '广域拍人却对到了后面的树上，怎么让相机优先找人？', options: ['确认「AF中的被摄体识别」为开，「识别目标」为人', '把 ISO 调高', '把快门调快'], answer: 0, explain: '这两项都在对焦菜单的「被摄体识别」分组。也可以用「点: M」把框直接移到人脸上。' },
    ]},
    { kind: 'task', title: '用 AF-C 和眼部对焦拍走动的人', photos: 2, complete_by: 'ai',
      steps: ['A 档、F2.8、ISO AUTO，按 C3 选 AF-C，按 C2 选广域', '在 MENU › 对焦 › 被摄体识别 › AF中的被摄体识别 确认「开」，然后在同组「识别目标」选「人」', '按控制拨轮左键打开「拍摄模式」，选「连拍」，用左右键选 Hi+、Hi、Mid 或 Lo', '请朋友从 5 米外朝你走来，半按跟住，眼睛出现识别框后按住快门连拍', '回放放大看眼睛，挑 2 张上传'],
      success_criteria: '人在走动，眼睛依然清楚',
      ai_rubric: ['能读到对焦模式时核对是否为 AF-C', '放大检查人物眼睛是否清楚，有对焦点信息时核对位置', '若人物有运动拖影，结合 EXIF 快门速度判断。可建议 S 档约 1/250 秒，或在 A 档配 ISO AUTO 时调快「ISO AUTO最小速度」', '如果焦点落在鼻子、耳朵或背景上，给出与照片相符的改法'] },
  ],
  needs_verification: [],
});

/* ======================================================================
 * 校验和输出
 * ====================================================================== */
const errors = [];
const err = (where, msg) => errors.push(where + '：' + msg);

function checkSchema(s, v, p) {
  if (s.anyOf) { if (!s.anyOf.some(x => { const before = errors.length; checkSchema(x, v, p); const ok = errors.length === before; errors.length = before; return ok; })) err(p, '不符合任何一种类型 ' + JSON.stringify(v)); return; }
  if (s.enum && !s.enum.includes(v)) return err(p, '取值 ' + JSON.stringify(v) + ' 不在枚举里');
  const ty = s.type;
  if (ty === 'null' && v !== null) return err(p, '应为 null');
  if (ty === 'string' && typeof v !== 'string') return err(p, '应为字符串');
  if (ty === 'number' && typeof v !== 'number') return err(p, '应为数字');
  if (ty === 'integer' && !Number.isInteger(v)) return err(p, '应为整数');
  if (ty === 'array') { if (!Array.isArray(v)) return err(p, '应为数组'); v.forEach((x, i) => checkSchema(s.items, x, p + '[' + i + ']')); }
  if (ty === 'object') {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return err(p, '应为对象');
    for (const k of s.required || []) if (!(k in v)) err(p, '缺少 ' + k);
    for (const k of Object.keys(v)) if (!s.properties[k]) err(p, '多余字段 ' + k); else checkSchema(s.properties[k], v[k], p + '.' + k);
  }
}

const SETTING_KEYS = ['mode', 'aperture', 'shutter', 'iso', 'ev', 'focal', 'focus_mode', 'focus_area', 'wb', 'drive'];
const linkIds = md => [...md.matchAll(/\[\[([a-z0-9_]+)\]\]/g)].map(m => m[1]);

function checkStep(st, where) {
  const t = TOOLS.find(x => x.name === st.tool);
  checkSchema(t.input_schema, st.args, where + ' ' + st.tool);
  const A = st.args;
  if (st.tool === 'highlight_control') {
    if (A.control_ids.length < 1 || A.control_ids.length > 3) err(where, 'highlight_control 一次指 1–3 个部件');
    if ([...A.note].length > 20) err(where, '高亮说明超过 20 个字：' + A.note);
  }
  if (st.tool === 'demonstrate_control') {
    const c = CTRL[A.control_id];
    if (!c.actions.includes(A.action)) err(where, A.control_id + ' 不支持 ' + A.action);
    if (A.target !== null && !(c.positions || []).includes(A.target)) err(where, A.control_id + ' 没有档位 ' + A.target);
    if (A.action === 'rotate' && A.steps === null && A.target === null) err(where, 'rotate 需要 steps 或 target');
    if (A.action === 'press' && A.direction !== 'none' && !(c.press_directions || []).includes(A.direction)) err(where, A.control_id + ' 不能按 ' + A.direction);
  }
  if (st.tool === 'say_to_user') {
    if ([...A.text].length > 160) err(where, '讲解超过 160 个字，拆成两句：' + A.text.slice(0, 20));
    linkIds(A.text).forEach(id => err(where, '3D 讲解里不要用 [[链接]]：' + id));
  }
}

/** 在允许调整的参数里穷举，看 set_exposure 题有没有解 */
function solvable(item) {
  const free = k => !(item.lock || []).includes(k);
  const ranges = {
    aperture: free('aperture') ? EXPO.APS : [item.start.aperture],
    shutter: free('shutter') ? EXPO.TV3L : [item.start.shutter],
    iso: free('iso') ? [...EXPO.ISO3, 'AUTO'] : [item.start.iso],
    ev: free('ev') ? [-3, -2.7, -2.3, -2, -1.7, -1.3, -1, -0.7, -0.3, 0, 0.3, 0.7, 1, 1.3, 1.7, 2, 2.3, 2.7, 3] : [item.start.ev ?? 0],
  };
  // A 档不用穷举快门，S 档不用穷举光圈，求解器会算
  if (item.mode === 'A' || item.mode === 'P' || item.mode === 'AUTO') ranges.shutter = [item.start.shutter || '1/125'];
  if (item.mode === 'S' || item.mode === 'P' || item.mode === 'AUTO') ranges.aperture = [item.start.aperture || 2.8];
  for (const ap of ranges.aperture) for (const sh of ranges.shutter) for (const iso of ranges.iso) for (const ev of ranges.ev) {
    const r = solve(item.mode, item.scene_ev, { aperture: ap, shutter: sh, iso, ev });
    if (meets(r, item.goal)) return { aperture: ap, shutter: sh, iso, ev, result: r };
  }
  return null;
}
function meets(r, g) {
  if (r.warn) return false;
  if (g.bias && (r.bias < g.bias[0] - 1e-9 || r.bias > g.bias[1] + 1e-9)) return false;
  if (g.shutter_max_time && r.t > tOf(g.shutter_max_time) * 1.0001) return false;
  if (g.shutter_min_time && r.t < tOf(g.shutter_min_time) * 0.9999) return false;
  if (g.aperture_min && r.aperture < g.aperture_min) return false;
  if (g.aperture_max && r.aperture > g.aperture_max) return false;
  if (g.iso_max && r.iso > g.iso_max) return false;
  return true;
}

const ITEM_TYPES = ['find_control', 'choice', 'operate', 'set_exposure'];
for (const L of LESSONS) {
  const w = L.id;
  const kinds = L.sections.map(s => s.kind).join(',');
  if (kinds !== 'demo,read,practice,task') err(w, '四段顺序应为 demo,read,practice,task，实际是 ' + kinds);
  for (const s of L.sections) {
    if (s.kind === 'demo') s.steps.forEach((st, i) => checkStep(st, w + ' 演示第' + (i + 1) + '步'));
    if (s.kind === 'read') linkIds(s.markdown).forEach(id => { if (!CTRL[id]) err(w + ' 讲解', '没有这个部件 [[' + id + ']]'); });
    if (s.kind === 'practice') s.items.forEach((it, i) => {
      const iw = w + ' 练习第' + (i + 1) + '题';
      if (!ITEM_TYPES.includes(it.type)) return err(iw, '未知题型 ' + it.type);
      if (it.type === 'find_control' && !CTRL[it.target]) err(iw, '没有这个部件 ' + it.target);
      if (it.type === 'choice' && !(Number.isInteger(it.answer) && it.answer >= 0 && it.answer < it.options.length)) err(iw, '答案下标不对');
      if (it.type === 'choice' && !it.explain) err(iw, '缺少解析');
      if (it.type === 'operate') {
        if (!CTRL[it.control]) err(iw, '没有这个部件 ' + it.control);
        Object.keys({ ...it.start, ...it.expect }).forEach(k => { if (!SETTING_KEYS.includes(k)) err(iw, '未知状态字段 ' + k); });
      }
      if (it.type === 'set_exposure') {
        if (meets(solve(it.mode, it.scene_ev, it.start), it.goal)) err(iw, '初始状态已经满足目标，题目太简单');
        const sol = solvable(it);
        if (!sol) err(iw, '在允许调整的范围内无解');
        else it._example_solution = { aperture: sol.result.aperture, shutter: sol.result.shutter, iso: sol.result.iso, ev: sol.ev };
      }
    });
    if (s.kind === 'task') {
      if (!['ai', 'practice_mode', 'self'].includes(s.complete_by)) err(w + ' 实拍任务', 'complete_by 应为 ai / practice_mode / self');
      if (s.complete_by === 'ai' && !(s.ai_rubric || []).length) err(w + ' 实拍任务', 'complete_by 为 ai 时要写 ai_rubric');
      if (s.complete_by === 'ai' && s.photos < 1) err(w + ' 实拍任务', 'AI 验收至少要 1 张照片');
      if (s.photos > 4) err(w + ' 实拍任务', '一次最多上传 4 张（F-AI-01）');
      if (!Number.isInteger(s.photos)) err(w + ' 实拍任务', '缺少 photos');
    }
  }
}
for (const c of CHECKS) {
  const r = solve(c.mode, c.sceneEv, c.p);
  for (const k of Object.keys(c.expect)) if (String(r[k]) !== String(c.expect[k])) err(c.lesson + ' 曝光验算', c.desc + '：期望 ' + k + '=' + c.expect[k] + '，实际 ' + r[k]);
}

for (const c of DOF_CHECKS) {
  const cm = dofCm(c.f, c.N, c.sM);
  if (cm < c.rangeCm[0] || cm > c.rangeCm[1]) err(c.lesson + ' 景深验算', c.desc + '：实际 ' + cm.toFixed(1) + ' 厘米');
}

if (errors.length) { console.error('校验失败 ' + errors.length + ' 处：\n- ' + errors.join('\n- ')); process.exit(1); }
for (const L of LESSONS) fs.writeFileSync(path.join(__dirname, L.id + '.json'), JSON.stringify({ version: 1, ...L }, null, 2) + '\n');
console.log('OK：' + LESSONS.map(L => L.id).join(' ') + '；曝光验算 ' + CHECKS.length + ' 条、景深验算 ' + DOF_CHECKS.length + ' 条全部通过');

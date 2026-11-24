# Sony α7 V 知识库核对报告

核对日期为2026-11-24。简中和英文首页均标明可更换镜头数码相机 ILCE-7M5（α7 V）。简中指南编号为 `5-069-971-91(6)`，英文为 `5-069-971-11(6)`。镜头采用索尼中国支持页提供的 SEL2470GM2 简体中文《使用说明书》，编号 `5-032-882-31(2)`，图A至G和规格表均在PDF第1页。[简中首页][home]、[英文首页][english]、[镜头说明书第1页][lens]

## 1. L0–L5 课程中待核对的事实

课程原有29项待核对说明。下表按每课原顺序编号，拆为78条可分别判断的事实，其中正确56条、需修改19条、查不到3条。同一编号下的各行对应同一条原始说明。

**修订结果（2026-11-24）**　19条课程勘误已落实到 [课程源文件](../content/lessons/build.cjs) 和 L0–L5 的生成文件。原审查提到的5条待查中，索尼规格表补证了24 mm与70 mm的最近对焦距离。另3条已改写：L0按当地装箱清单准备充电器材，L3的前、后拨盘演示分别以屏幕上的F4、1/250秒为准。各课的练习和实拍任务均可按现有资料完成。[索尼镜头规格][lens-spec]、[随附物品][box]、[Av/Tv旋转][avtv]

| 课 | 待核对内容 | 结论 | 帮助指南怎么说（概括） | 来源 URL | 建议改法 |
| --- | --- | --- | --- | --- | --- |
| L0 | 1　插槽1支持CFexpress Type A和SD | 正确 | 插槽1是两种卡共用的插槽，SD卡接口支持UHS-I和UHS-II。 | [插入/取出存储卡][card]、[机身规格][spec] | 沿用卡型，按卡仓图示区分插入朝向。 |
| L0 | 1　插槽2只支持SD | 正确 | 第二个插槽只接受SD系列卡，也兼容UHS-I和UHS-II。 | [插入/取出存储卡][card]、[机身规格][spec] | 可保留。 |
| L0 | 1　默认写入插槽1 | 正确 | 照片和录像的摄像媒体分别设置，两者出厂都为“插槽1”。 | [静态摄像媒体][media]、[录像摄像媒体][mm] | 可保留。 |
| L0 | 2　关机可以通过USB-C充电 | 正确 | 装好电池、关机，接任一USB-C端口即可充电。“USB电源供给”菜单用于开机外接电源。 | [USB充电][battery]、[USB供电][power] | 充电步骤直接从关机、接线讲起。 |
| L0 | 2　充电灯熄灭代表充电完成 | 正确 | 充电时橙灯常亮，结束后熄灭。闪烁表示异常或因温度暂停。 | [USB充电][battery] | 补上橙灯先亮再熄灭的观察顺序。 |
| L0 | 2　所售套装是否附充电器 | 查不到 | 指南清单列有NP-FZ100，未列充电器，并注明配件随国家或地区变化。 | [随附物品][box]、[USB充电][battery] | 让读者按地区入门指南或实际装箱清单核实。 |
| L0 | 2　正文要求使用包装里的USB-C线 | 需修改 | 通用清单未列USB线。充电页引导准备相应的市售线材和电源。 | [随附物品][box]、[USB充电][battery] | 改为“准备USB线和兼容电源”，补充USB-PD充电建议18 W或以上。 |
| L0 | 3　装镜头前对齐两个白色标记 | 正确 | 机身和镜头各有一个白色安装标记，关机并对准后笔直插入。 | [安装/取下镜头][mount]、[镜头说明书第1页][lens] | 可保留。 |
| L0 | 3　从机身正面看顺时针锁定 | 正确 | 帮助指南插图说明明确了观察方向，镜头说明书图B写明顺时针安装、逆时针拆下。 | [安装/取下镜头][mount]、[镜头说明书第1页][lens] | 可保留。 |
| L0 | 4　首次开机一定在机身上输入地区和时间 | 需修改 | 可以经Creators' App配对后在手机设时钟。未连接手机时，机身才显示区域、日期和时间设置。 | [初始设置][initial]、[区域/日期/时间设置][date] | 把手机设置和跳过手机后在机身设置写成两个分支。 |
| L0 | 5　设置 › 地区/日期 › 语言 | 需修改 | 分组名为“区域/日期”。 | [语言][lang] | 改为 MENU › 设置 › 区域/日期 › 语言。 |
| L0 | 5　拍摄 › 介质 › 格式化 | 需修改 | 分组名为“媒体”。 | [格式化][format] | 改为 MENU › 拍摄 › 媒体 › 格式化。 |
| L0 | 5　拍摄 › 影像质量 › 文件格式 | 需修改 | 照片的项目在“影像质量/记录”中的“影像质量设置”内。外层同名项目用于录像。 | [照片文件格式][file]、[中文菜单总表][menu] | 改为 MENU › 拍摄 › 影像质量/记录 › 影像质量设置 › 文件格式。 |
| L0 | 5　拍摄 › 快门/静音 › 无存储卡时释放快门 | 正确 | 这条路径与简中菜单总表一致。 | [无存储卡时释放快门][nocard] | 可保留。 |
| L0 | 6　无卡释放快门出厂为允许 | 正确 | 未插卡仍可释放快门，影像不会保存。 | [无存储卡时释放快门][nocard] | 可保留将该项改为“禁止”的练习。 |
| L1 | 1　拍照时C1调白平衡 | 正确 | 静止影像键位表列的是“白平衡模式”。 | [设置默认值][defset]、[白平衡模式][wb] | 用菜单原名“白平衡模式”。 |
| L1 | 1　拍照时C2调对焦区域 | 正确 | 出厂分配是“对焦区域”。 | [设置默认值][defset]、[对焦区域][area] | 可保留。 |
| L1 | 1　拍照时C3调对焦模式 | 正确 | 静止影像分配为“对焦模式”，回放时这个键为“保护”。 | [设置默认值][defset]、[机身背面图][bodyback] | 可保留。 |
| L1 | 1　C4的出厂功能统称删除 | 需修改 | 静止影像下C4分配为“触摸操作选择”，播放中C4为“删除”。 | [设置默认值][defset]、[机身背面图][bodyback] | 把按键表拆成拍摄、回放两种状态。 |
| L1 | 2　控制拨轮上侧切换DISP | 正确 | 按上侧循环切换当前状态可用的画面显示。 | [控制拨轮][wheel]、[DISP按钮][disp] | 可保留。 |
| L1 | 2　控制拨轮左侧调驱动模式 | 正确 | 拍静止影像时左侧是Drive Mode，中文项目名为“拍摄模式”。录像时左侧出厂用于自拍定时。 | [控制拨轮][wheel]、[设置默认值][defset] | 写“拍摄模式（单张、连拍等）”，并标明拍照状态。 |
| L1 | 2　控制拨轮右侧调ISO | 正确 | 静态拍摄出厂右侧为ISO。 | [控制拨轮][wheel]、[ISO][iso] | 可保留。 |
| L1 | 3　后转盘R调曝光补偿 | 正确 | 出厂直接转动已解锁的后转盘R调整补偿。 | [曝光补偿][ev]、[设置默认值][defset] | 可保留。 |
| L1 | 3　后转盘R中央是锁定钮 | 正确 | 按中央切换锁定状态。锁钮弹起、露出白线时已解锁。 | [机身顶部图][bodytop]、[曝光补偿][ev] | 可保留。 |
| L1 | 3　S档后转盘L调快门 | 正确 | 快门优先允许用前转盘或后转盘L选速度。 | [快门优先][s] | 可保留后转盘L示范，也可注明前转盘可调。 |
| L1 | 3　M档后转盘L调快门 | 正确 | M档默认后转盘L调快门，前转盘调光圈。 | [手动曝光][m]、[设置默认值][defset] | 可保留。 |
| L1 | 4　模式旋钮有AUTO、P、A、S、M和1、2、3 | 正确 | 自动模式在指南里用图标表示。数字三个位置调出预先保存的设置。 | [两层旋钮][mode] | 可保留。 |
| L1 | 4　模式旋钮下方切换照片、录像和S&Q | 正确 | 下层是带锁的旋钮，S&Q还可选择缩时摄影。 | [两层旋钮][mode]、[机身顶部图][bodytop] | 示范按住前侧锁定释放按钮，再转下层旋钮。 |
| L1 | 5　镜头有两个对焦保持按钮 | 正确 | 图A的两个视图都标出12号圆键，一个在镜头上方，一个在侧面。镜头原名“对焦锁定按钮”。 | [镜头说明书第1页][lens] | 课程可并列机身用语“对焦保持”。 |
| L1 | 5　IRIS LOCK在左侧 | 正确 | 按摄影者从机后朝前看的方向，图A的13、14号位于同一侧。14号为IRIS LOCK。 | [镜头说明书第1页][lens] | 可保留。 |
| L1 | 5　光圈段落感开关在左侧 | 需修改 | 从机身后面向前看，图A的18号“光圈点按开关”在镜头右侧，与19号变焦平滑度开关同侧。 | [镜头说明书第1页图A][lens] | 移到镜头右侧，标为CLICK。 |
| L1 | 5　AF/MF开关在左侧 | 正确 | 图A的13号在侧面对焦按钮下方，与IRIS LOCK同侧。 | [镜头说明书第1页][lens] | 可保留。 |
| L1 | 5　SMOOTH/TIGHT在右侧 | 正确 | 图A的19号在18号同侧。图D-a说明它调整旋转阻力。 | [镜头说明书第1页][lens] | 用“TIGHT增大阻力，可减少意外伸缩”。 |
| L1 | 6　有HDMI接口 | 正确 | 机身侧面为全尺寸HDMI type A插孔。 | [侧面与端口][side] | 可保留。 |
| L1 | 6　有耳机接口 | 正确 | 耳机连接至独立的耳机端子。 | [侧面与端口][side] | 可保留。 |
| L1 | 6　有麦克风接口 | 正确 | 外接麦克风连接至麦克风端子，接入后内置麦克风关闭。 | [侧面与端口][side] | 可保留。 |
| L1 | 6　接口仓的USB-C只写作一个通用口 | 需修改 | 侧面有USB PORT 1和USB PORT 2，均能充电。传数据时1号最高10 Gbps、2号最高480 Mbps。 | [侧面与端口][side] | 在机身图上分别标出两个USB-C口。 |
| L2 | 1　合焦时对焦框一律变绿 | 需修改 | 广域拍静止影像时，合焦区域可出现绿框。连拍或一下按到底时，框可能不点亮。 | [对焦区域][area]、[AF-C区域显示][afc] | 用“半按看合焦指示，在相应区域和模式下可见绿框”。 |
| L2 | 1　标准拍照画面的对焦指示在左下 | 正确 | 拍摄静止影像页的半按示意图把对焦指示标在显示屏左下，正文说明合焦时点亮。 | [静态拍摄与对焦指示][snap] | 限定为指南示意的拍摄画面，保留图标和闪烁的解释。 |
| L2 | 1　一旦合焦都会发出哔音 | 需修改 | 连续AF跟住主体时不发出合焦哔声。静音模式也会关闭拍摄音频信号。 | [静态拍摄与对焦指示][snap]、[音频信号(拍摄)][sound]、[静音模式设置][silent] | 用单次AF演示提示音，另列AF-C依靠屏幕判断。 |
| L2 | 1　合焦提示音出厂开启 | 正确 | “音频信号(拍摄)”的出厂值为“开：全部”，是否响还取决于对焦模式。 | [设置默认值][defset]、[音频信号(拍摄)][sound] | 可保留。 |
| L2 | 2　回放照片时双击屏幕可放大 | 正确 | 触摸面板页的“双扣”与英文double-tap对应，再次双击可退回。也支持双指缩放。 | [触摸面板][touch]、[英文触摸面板][entouch] | 可保留。 |
| L2 | 2　回放触摸出厂可用 | 正确 | “触摸操作”为“开”，“触摸面板设置”的“播放画面”也为“开”。 | [设置默认值][defset]、[触摸面板设置][touchset] | 可保留。 |
| L2 | 2　双击后总会放大到拍摄对焦位置 | 需修改 | 放大键默认优先使用对焦位置信息，缺少信息时从中央放大。“放大初始位置”还可设为“中央”。触摸页只确认双击放大。 | [播放放大][zoom]、[放大初始位置][zoompos]、[触摸面板][touch]、[播放默认值][defplay] | 将双击手势与放大起点分开写，教读者放大后拖动到眼睛检查。 |
| L2 | 3　回放时转控制拨轮切换照片 | 正确 | 单张回放中，旋转拨轮或按左右侧都可切换。放大回放中旋转拨轮会改倍率。 | [控制拨轮][wheel]、[播放放大][zoom] | 可保留。 |
| L2 | 4　24 mm端对应最近对焦0.21 m | 正确 | 索尼亚洲规格页把0.21 m标为W。该镜头焦距为24–70 mm，广角端是24 mm。 | [索尼亚洲镜头规格][lens-spec]、[镜头说明书第1页][lens] | 保留24 mm端约0.21 m，并说明距离从机内影像传感器平面量起。 |
| L2 | 4　70 mm端对应最近对焦0.30 m | 正确 | 同一规格页把0.3 m标为T，对应70 mm长焦端。最大放大倍率另列为0.32倍。 | [索尼亚洲镜头规格][lens-spec]、[镜头说明书第1页][lens] | 保留70 mm端约0.30 m，L5也可沿用这组数值。 |
| L2 | 5　P和智能自动都由相机配光圈与快门 | 正确 | 智能自动还辨认场景。P在拍照片且不闪光时可以程序转换。 | [智能自动][auto]、[程序自动][p] | 可保留。 |
| L2 | 5　P可自行设ISO，智能自动限制ISO | 正确 | P可用自动或手动ISO，智能自动固定为ISO AUTO。 | [ISO][iso]、[程序自动][p] | 可保留。 |
| L2 | 5　P可调曝光补偿，智能自动不能调 | 正确 | 曝光补偿页明确列出智能自动不可调，P不受该限制。 | [曝光补偿][ev] | 可保留。 |
| L2 | 5　把对焦模式和ISO并列为智能自动中由相机决定的项目 | 需修改 | 智能自动的静态拍摄页允许指定单次AF或连续AF，锁为广域的是对焦区域。 | [静态拍摄与对焦指示][snap]、[对焦区域][area] | 分成“对焦方式可选”和“区域固定广域”两行。 |
| L3 | 1　M档前转盘调光圈 | 正确 | 手动曝光页指定前转盘选光圈，默认分配表也标为Av处于M模式。 | [手动曝光][m]、[设置默认值][defset] | 镜头光圈环放在A，便于跟随机身演示。 |
| L3 | 1　M档后转盘L调快门 | 正确 | 手动曝光页指定后转盘L选快门速度。 | [手动曝光][m]、[设置默认值][defset] | 可保留。 |
| L3 | 1　前转盘向右三格一定使F2.8变成F4 | 查不到 | 曝光步级出厂为0.3段，Av/Tv旋转可以翻转方向。指南未把课程动画的“向右”与前转盘增大F值的观察方向对应。 | [Av/Tv旋转][avtv]、[曝光步级][step]、[曝光/颜色默认值][defexp]、[设置默认值][defset] | 演示写“转到F4”，先以目标值校验动画。 |
| L3 | 1　后转盘L向左三格一定使1/500变成1/250 | 查不到 | B门页可确认在M档顺时针向长曝光端转到BULB。课程的“向左”缺少与该视角对应的定义。 | [B门拍摄][bulb]、[Av/Tv旋转][avtv]、[手动曝光][m] | 写“转到1/250”，将界面方向与实物核对后再固定箭头。 |
| L3 | 2　按拨轮右侧进入ISO | 正确 | 右侧出厂分配为ISO，指南也给出了从菜单进入的路径。 | [ISO][iso]、[控制拨轮][wheel] | 可保留。 |
| L3 | 3　24–70 mm变焦范围的最大光圈为F2.8 | 正确 | 规格为FE 24-70mm F2.8 GM II，图G按整支镜头给出f/2.8至f/22的手调范围。 | [镜头说明书第1页][lens] | 沿用完整型号和F2.8。 |
| L3 | 3　最小光圈为F22 | 正确 | 规格栏“最小光圈”明确列f/22。 | [镜头说明书第1页][lens] | 可保留。 |
| L4 | 1　S档超出可配曝光范围时光圈值闪烁 | 正确 | S档由用户选快门。光圈无法配出合适曝光时，光圈值闪烁。 | [快门优先][s] | 提示改快门速度。 |
| L4 | 1　A档超出可配曝光范围时快门速度闪烁 | 正确 | A档由用户选光圈。无法得到合适曝光时，快门速度闪烁。 | [光圈优先][a] | 提示改光圈值。 |
| L4 | 2　把菜单项目写为“ISO AUTO 最低快门” | 需修改 | 简中项目全名为“ISO AUTO最小速度”，在曝光/颜色的曝光分组。 | [ISO AUTO最小速度][minss] | 改为 MENU › 曝光/颜色 › 曝光 › ISO AUTO最小速度。 |
| L4 | 2　最低快门的机身出厂设置与课程模拟值 | 正确 | 出厂为“标准”，按镜头焦距决定阈值。在P/A且ISO AUTO时有效，达到ISO上限仍可能用更慢快门。 | [ISO AUTO最小速度][minss]、[曝光/颜色默认值][defexp] | 保留“实验室按1/60模拟”的限定，另列机身默认“标准”。 |
| L4 | 3　P、A和S档均可曝光补偿 | 正确 | 照片可在±5 EV范围内设定，取景亮度的预览范围为±3 EV。智能自动不可调。 | [曝光补偿][ev] | 可保留。 |
| L4 | 3　M档要用ISO AUTO才能曝光补偿 | 正确 | 手动曝光中只在自动ISO下可用补偿。 | [曝光补偿][ev]、[手动曝光][m] | 可保留。 |
| L4 | 3　后转盘R有锁定钮 | 正确 | 按中央切换锁定，弹起露白线后可以转动。 | [曝光补偿][ev]、[机身顶部图][bodytop] | 可保留。 |
| L5 | 1　对焦方式有AF-S、AF-C、DMF、MF | 正确 | 四项对应“单次AF”“连续AF”“DMF”“手动对焦”。 | [对焦模式][focus] | 可保留。 |
| L5 | 1　课程的对焦模式表遗漏AF-A | 需修改 | 还有“自动AF”，它按动作在单次与连续间切换，也是拍照的出厂值。录像只有连续AF和手动对焦。 | [对焦模式][focus]、[对焦默认值][deffocus] | 补第五项“自动AF（AF-A）”，标注需要相位检测AF兼容镜头。 |
| L5 | 2　广域、区、中间固定是可选对焦区域 | 正确 | 三项名称与菜单一致。 | [对焦区域][area] | 可保留。 |
| L5 | 2　把“点”当作唯一的点对焦档 | 需修改 | 点有五个尺寸，显示为“点: XL”“点: L”“点: M”“点: S”“点: XS”。APS-C尺寸不能选XS。 | [对焦区域][area] | 演示指定一个具体尺寸，例如“点: M”。 |
| L5 | 2　区域列表漏掉扩展点和自定义区域 | 需修改 | 还有“扩展点”和“自定义 1”至“自定义 3”。跟踪也可以选择不同起始区域。 | [对焦区域][area] | 补齐列表，并说明在哪些模式能移动对焦框。 |
| L5 | 2　对焦区域里的“跟踪”仅在AF-C可选 | 正确 | 此菜单项要求静止影像和连续AF。录像中的触碰跟踪走另一项设置。 | [对焦区域][area]、[触碰跟踪][touchtrack] | 把条件写全为“拍照 + 连续AF”。 |
| L5 | 3　把识别目标写作“人物、动物、鸟等” | 需修改 | 正式选项为自动、人、动物/鸟类、动物、鸟类、昆虫、汽车/火车、飞机。出厂是“人”。 | [识别目标与部分][recog]、[对焦默认值][deffocus] | 使用这八个菜单原名，保留“动物/鸟类”的组合项。 |
| L5 | 3　菜单里笼统地“打开主体识别” | 需修改 | 启用自动识别与选择目标是分开的两个项目。识别开关出厂已开。 | [被摄体识别开关][afsubject]、[识别目标与部分][recog]、[对焦默认值][deffocus] | 先找 MENU › 对焦 › 被摄体识别 › AF中的被摄体识别，再到同组“识别目标”。 |
| L5 | 4　摇杆可移动对焦框 | 正确 | 区、各尺寸点、扩展点、自定义区域及部分跟踪起点均可用摇杆移动。 | [多功能选择器][joystick]、[对焦区域][area] | 用点作示例即可，同时说明区也能移动。 |
| L5 | 4　按下摇杆总会回到中央 | 需修改 | 摇杆中央默认“对焦标准”。可移动区域会回中央或跟踪对象。广域或中间固定时，按下是对中央自动对焦。 | [多功能选择器][joystick]、[对焦标准][standard] | 按正在使用的区域演示按下后的不同结果。 |
| L5 | 5　按拨轮左侧打开驱动选择 | 正确 | 静态拍摄的左键出厂为“拍摄模式”。 | [控制拨轮][wheel]、[拍摄模式][drive] | 可保留。 |
| L5 | 5　可选连拍及速度档 | 正确 | 选“连拍”后，用拨轮左右选Hi+、Hi、Mid或Lo。速度还取决于快门类型。 | [连拍速度与限制][cont]、[拍摄模式][drive] | 可保留。 |
| L5 | 6　镜头按钮出厂保持对焦 | 正确 | AF中按住镜头上的对焦锁定按钮，会暂停AF、保持当前焦点。半按快门时松开，AF重新开始。机身的出厂分配写作“对焦保持”。 | [镜头说明书第1页][lens]、[设置默认值][defset] | 可保留。 |

### L1.5 镜头开关位置

图A中间的侧视图标出13号 AF/MF 和14号 IRIS LOCK。下方侧视图中卡口朝左、镜头前端朝右，18号 CLICK 在靠卡口的一端，与19号 SMOOTH/TIGHT 同侧。这是从机身后面向前看时镜头的右侧。图源为 Sony《FE 24-70mm F2.8 GM II 使用说明书》第1页。[索尼说明书原页][lens]

## 2. 部件字典中与指南对不上的地方

以下左右位置以摄影者在机身后方向前看为准。键位按静止影像、录像、播放分别核对。

下表记录原稿的9处差异，均已写入[部件字典](spec/controls.json)。原型的部件说明也读取这份字典。机身图分别标出了两个USB-C口，镜头右侧可找到CLICK。字典的 `verified` 同时要求官方资料和实机核对，本次只记录有文档依据的修订。

| 部件与字段 | 现有表述 | 官方依据与建议改法 | 来源 URL |
| --- | --- | --- | --- |
| `btn_c3.where` | 背面右上 | 背面图把C3与MENU标在取景器左边。改为背面左上，靠近MENU。 | [机身背面图][bodyback] |
| `btn_c4.default_function` | 仅写回放时删除 | 补上拍照“触摸操作选择”，保留播放“删除”。 | [设置默认值][defset]、[机身背面图][bodyback] |
| `mode_switch.default_function` | 照片、录像、慢快动作 | S&Q还可选缩时摄影。位置表可保留三档，操作说明应写按住前方解锁钮再转下层旋钮。 | [两层旋钮][mode]、[机身顶部图][bodytop] |
| `wheel.default_function` | 左驱动模式，转动调值 | 拍照左键的正式名称为“拍摄模式”，录像左键默认自拍定时。转动拨轮在静态拍摄自定键表为“未设定”，进入菜单后可以选项和调值。 | [控制拨轮][wheel]、[设置默认值][defset] |
| `btn_center.default_function` | 确认 | “确认”适用于菜单操作。拍照自定义分配中“中央按钮功能”默认为“未设定”，与默认分配“对焦标准”的摇杆中央不同。 | [控制拨轮][wheel]、[设置默认值][defset]、[多功能选择器][joystick] |
| `joystick.default_function` | 移动对焦点，按下回到中心 | 写成“移动支持的对焦区域，按中央执行对焦标准”，并注明按所用区域可能返回跟踪对象或对中央合焦。 | [对焦标准][standard]、[多功能选择器][joystick] |
| `ports.default_function` | HDMI、耳机、麦克风、USB-C | 补全HDMI type A，以及速率不同、均可充电的USB PORT 1和2。 | [侧面与端口][side] |
| `sw_click.where` | 镜头左侧 | 图A的18号光圈点按开关在右侧，与19号变焦平滑度开关同侧。 | [镜头说明书第1页][lens] |
| `sw_iris_lock.positions` | LOCK / UNLOCK | 如该字段用于还原镜头丝印，图G标出“IRIS LOCK”和方向箭头。中文说明将两种动作称为“锁定”“松开”。 | [镜头说明书第1页][lens] |

## 3. P0 覆盖、证据边界与复核入口

48个P0条目和36个指定P1条目均已收录。另有两个P1条目，`hdr_shooting` 讲多张RAW合成，`usb_power_supply` 讲开机外接供电。共86个条目，`missing` 为空。

| 条目或问题 | 已核实的范围 | 知识库与课程如何处理 | 来源 URL |
| --- | --- | --- | --- |
| `fn_menu` 的12格出厂内容 | 指南明确每套12格，静态、动态、播放可分别配置。按钮页的两行图标标为“功能菜单的示例”。设置默认值表中两条Fn菜单均为横线。静态设置页以创意外观演示如何换格。 | 记录进入方式、容量和独立配置，default 留空。图示无法证明12格逐格的出厂内容。PM如有相同型号、已知出厂状态的实机，可另行记录固件版本和三种界面的排列。 | [Fn按钮与示例图][fnpress]、[Fn菜单设置][fn]、[设置默认值][defset]、[英文Fn示例与说明][enfn]、[英文设置默认值][enfnset] |
| `dro_hdr` 与 `hdr_shooting` | 菜单总表列出“动态范围优化”和“HDR拍摄设置”。后者连拍4、8或16张RAW，由电脑专用软件组合。总表没有单列“自动HDR”。 | 将“自动HDR”保留作用户可能输入的检索词，回答分别指向DRO和本机实际提供的HDR拍摄流程。 | [中文菜单总表][menu]、[动态范围优化][dro]、[HDR拍摄设置][hdr] |
| `lens_min_focus` 的焦段端点 | 索尼亚洲规格页的 MINIMUM FOCUS DISTANCE 栏写有“0.21(W)-0.3(T) m”，焦距栏为24–70 mm。简中说明书注明距离从图像传感器量到物体。 | 知识库和L2.4均按广角、长焦标明最近对焦距离。最大放大倍率0.32倍单独记录。 | [索尼亚洲镜头规格][lens-spec]、[镜头说明书第1页][lens]、[机身顶部图][bodytop] |
| 实体转盘的顺、逆时针与动画的左右 | M档分工和“标准/翻转”均可确认，B门页说明后转盘L顺时针转向BULB。前转盘和课程左右箭头的对应关系缺少相同观察视角的图解。 | 保留默认分工与拍摄数值，动画左右的两项见L3.1。 | [手动曝光][m]、[Av/Tv旋转][avtv]、[B门拍摄][bulb]、[设置默认值][defset] |
| `recognition_part` 与人物眼部 | “识别部分”是动物/鸟类、动物、鸟类的静态详细设置。人物眼睛可由被摄体识别AF对焦，另有“右眼/左眼选择”。 | 在三个动物或鸟类分支列出入口，并说明在识别目标上按拨轮右侧进入详情。 | [识别目标与部分][recog]、[识别与眼部AF][recognizing]、[左右眼选择][eye] |
| “拍摄模式”与“照相模式” | 拍摄 › 拍摄模式分组的“拍摄模式”是Drive Mode。曝光模式旋钮的菜单入口是拍摄 › 照相模式 › 照相模式，英文为Shoot Mode，须先允许通过菜单设置。菜单的记忆档选项为“调出存储”，实体旋钮页称1、2、3的功能为“调出拍摄设置”。 | 保留各入口的简中原名和英文对应名，并在中文关键字中加入“驱动模式”“模式转盘”等叫法。 | [中文菜单总表][menu]、[英文菜单总表][enmenu]、[照相模式的菜单入口][modeby]、[两层旋钮][mode]、[拍摄模式][drive] |
| `lens_focus_hold` 在镜头和机身上的名称 | 中文镜头说明书的12号部件名为“对焦锁定按钮”。机身的自定义键和默认功能使用“对焦保持按钮”“对焦保持”。 | 同时收录两种名称。位置、数量见镜头图A，动作见F节。 | [镜头说明书第1页][lens]、[设置默认值][defset] |

### 菜单、默认值和跨页依据

索尼“从MENU查找功能”中，七张表按拍摄、曝光/颜色、对焦、播放、网络、设置、我的菜单分别有93、33、43、33、36、72、6行，合计316行。中英文逐行对齐，并核对两种语言跳转到同名功能页。另收录“主”页的49个分模式入口或状态项，以及功能页明确列出的7个下级入口，共372条。[中文菜单总表][menu]、[英文菜单总表][enmenu]、[主菜单][main]、[英文主菜单][enmain]

路径保留官方界面的文字、标点和空格。总表用冒号展示的父子项目在JSON中拆成相邻层级。图形标记用文字在摘要中区分，静态、动态、回放的同名行各自保留。例如搜索“摄像媒体”能分别找到拍照和录像的入口。主菜单的剩余张数、电量等读数在摘要标明用途。

共40条的 `default` 为 null，涵盖硬件规格、一次性操作、无单一默认值的组合，以及指南未逐项列明的值。下表给出具体功能页之外的核验位置，默认值按同一模式、同一子项读取。

| 适用条目 | 补充依据 | 来源 URL |
| --- | --- | --- |
| `battery`、`usb_power_supply` | 关机给NP-FZ100充电，任选一个USB-C口即可。开机外接供电须装入有电的电池，索尼建议线和电源均支持27 W或以上。供电端口默认为“自动”，也可指定PORT1、PORT2或关闭供电。 | [USB充电][battery]、[通过USB供电使用相机][power]、[USB电源供给][usbpower]、[设置默认值][defset] |
| 语言、日期、触摸、声音、节电、USB、取景器、按键 | 设置默认值表逐项列出拍摄按钮映射、两处触摸开关、两个USB口和声音选项。首次配置、充电与外部供电另有操作页。 | [设置默认值][defset]、[初始设置][initial]、[随附物品][box]、[USB充电][battery]、[USB供电][power]、[USB电源供给][usbpower] |
| 格式、画质、记录媒体、驱动、防抖、快门、网格与实时取景 | 拍摄默认值表按静态/动态图标区分同名项。JPEG画质与尺寸为两项，尺寸还随画幅及比例变化。 | [拍摄默认值][defshoot]、[JPEG/HEIF切换][switchjpeg]、[JPEG/HEIF画质][quality]、[JPEG/HEIF尺寸][size]、[静态摄像媒体][media]、[录像摄像媒体][mm]、[连拍速度与限制][cont]、[网格线类型][grid]、[照片快门类型][types]、[静音模式设置][silent] |
| 曝光、测光、白平衡、DRO与斑马线 | ISO AUTO最小速度、±0.0补偿、曝光步级、白平衡模式及DRO自动等级等可在曝光/颜色表交叉核对。DRO手选的1至5级按指南给出的连续范围展开。 | [曝光/颜色默认值][defexp]、[ISO AUTO最小速度][minss]、[曝光补偿][ev]、[白平衡模式][wb]、[动态范围优化][dro] |
| 对焦、识别和对焦辅助 | 对焦表区分识别开关与识别目标。跟踪起点的名称见“对焦区域”和“对焦标准”，包括“跟踪: 点M”和“跟踪: 中间固定”。AF-S与AF-C分别设置释放优先级。 | [对焦默认值][deffocus]、[被摄体识别开关][afsubject]、[识别目标与部分][recog]、[对焦区域][area]、[对焦标准][standard]、[AF-C优先级设置][afpriority] |
| `custom_keys`、`dial_setup`、`af_on`、`intelligent_auto` | 默认映射、键位示意、半按对焦和不同曝光模式下可调项目分散在这些页面。ISO、白平衡和对焦区域各有AUTO的限制。 | [设置默认值][defset]、[自定键/转盘设置][custom]、[机身背面图][bodyback]、[AF-ON按钮][afon]、[半按快门AF][half]、[静态拍摄与对焦指示][snap]、[ISO][iso]、[白平衡模式][wb]、[对焦区域][area] |
| `af_confirm`、`focus_frame_move`、`touch_ops`、`touch_focus` | 对焦位置、方向键动作、合焦指示与提示音有不同的适用条件。两个触摸页面分别讲相机设置和实际手势。 | [静态拍摄与对焦指示][snap]、[对焦区域][area]、[音频信号(拍摄)][sound]、[对焦标准][standard]、[多功能选择器][joystick]、[触摸面板设置][touchset]、[触摸面板][touch]、[触碰对焦][touchfocus]、[触碰跟踪][touchtrack] |
| `exposure_warning`、`bracket`、`histogram`、`level` | A、S、M的闪烁对象不同。包围曝光区分单次和连续方式，DISP可选项和默认循环另有说明。 | [光圈优先][a]、[快门优先][s]、[手动曝光][m]、[单次阶段曝光][brsingle]、[DISP按钮][disp]、[拍照DISP可选画面][dispstill] |
| `ports`、`hot_shoe`、`lens_mount`、`card_slots` | 机身和镜头的示意图互相补充。卡槽卡型可对照机身规格，兼容闪光灯和热靴收音分别见附件页。 | [侧面与端口][side]、[机身顶部图][bodytop]、[热靴音频附件][hot]、[闪光附件][flash]、[安装/取下镜头][mount]、[镜头说明书第1页][lens]、[插入/取出存储卡][card]、[机身规格][spec] |
| `playback_basic`、`playback_zoom`、`delete`、`protect` | 放大初始位置在播放默认值表。普通播放和放大时，拨轮有不同作用，实体删除和菜单批量删除分别有说明。 | [播放默认值][defplay]、[播放放大][zoom]、[放大初始位置][zoompos]、[控制拨轮][wheel]、[删除按钮][delete]、[保护][protect] |

验收命令为 `node scripts/check-manual-kb.cjs`。原有45个检索用例与新增的2个充电、供电用例全部通过。查询“怎么给相机充电”时首条给出关机接线的操作，查询“开机外接供电”时首条给出USB电源供给菜单。原型和检查脚本共用同一份参考检索函数。Fn画面标明为示例，逐格出厂排列仍以对应模式、已知出厂状态的实机记录为补证依据。

[a]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0302B_aperture_priority.html
[afc]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0405C_continuousAF_area.html
[afon]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_using_AF_ON_button.html
[afpriority]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0405H_AF-C_priority_setup.html
[afsubject]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/211h_subject_recognition_af.html
[area]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0405C_autofocus_area.html
[auto]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0302_intelligent_auto.html
[avtv]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0414M_av_tv_rotate.html
[battery]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0001D_charge_commercially_available_acadaptor.html
[bodyback]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_names_of_parts_ilc2540_back.html
[bodytop]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_names_of_parts_ilc2540_top.html
[box]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_supplied_items_ilc2540.html
[brsingle]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0407_single_bracket.html
[bulb]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0302C_bulb.html
[card]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0002D_insert_memorycard.html
[cont]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0407C_drivemode_continuous.html
[custom]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0413M_custom_key.html
[date]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0601_area_date_time_setting.html
[defexp]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_default_value_list_exposurecolor_ilc2540.html
[deffocus]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_default_value_list_focus_ilc2540.html
[defplay]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_default_value_list_playback_ilc2540.html
[defset]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_default_value_list_setup_ilc2540.html
[defshoot]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_default_value_list_shooting_ilc2540.html
[delete]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0502_using_delete_button.html
[disp]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_using_DISP_button.html
[dispstill]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_disp_set_still.html
[drive]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0407C_drive_mode.html
[dro]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0409B_d_range_optimizer.html
[enfn]: https://helpguide.sony.net/ilc/2540/v1/en/contents/0413_using_function_menu.html
[enfnset]: https://helpguide.sony.net/ilc/2540/v1/en/contents/251h_default_value_list_setup_ilc2540.html
[english]: https://helpguide.sony.net/ilc/2540/v1/en/index.html
[enmain]: https://helpguide.sony.net/ilc/2540/v1/en/contents/251h_main_menu_ilc2540.html
[enmenu]: https://helpguide.sony.net/ilc/2540/v1/en/contents/251h_list_of_menu_items_ilc2540.html
[entouch]: https://helpguide.sony.net/ilc/2540/v1/en/contents/201h_touch_panel_operation.html
[ev]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0406B_exposure_compensation.html
[eye]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/211h_right_left_eye_select.html
[file]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_file_format.html
[flash]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0402C_flash.html
[fn]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_fn_menu_setting.html
[fnpress]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0413_using_function_menu.html
[focus]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0405C_focus_mode.html
[format]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0601_memory_format.html
[grid]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_grid_line_type.html
[half]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0405_shutter_button_af.html
[hdr]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_shoot_for_hdr_setting.html
[home]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/index.html
[hot]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/1005_about_accessory_multi_interfaceshoe.html
[initial]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/211h_initial_settings.html
[iso]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0408C_iso.html
[joystick]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0201D_using_multi_selector.html
[lang]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0601_language.html
[lens]: https://www.sony.com/electronics/support/res/manuals/5032/9ace66bf3f931b8ffbae5367023ab348/50328823M.pdf#page=1
[lens-spec]: https://www.sony-asia.com/electronics/support/lenses-e-mount-lenses/sel2470gm2/specifications
[m]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0302C_manual_exposure.html
[main]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_main_menu_ilc2540.html
[media]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_rec_media_still.html
[menu]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_list_of_menu_items_ilc2540.html
[minss]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0408H_ISO_auto_minimun_SS.html
[mm]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_rec_media_mov.html
[mode]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/202h_still_movie_sq_dial.html
[modeby]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_shootingmode.html
[mount]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0003D_attatch_lens.html
[nocard]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0414G_release_without_card.html
[p]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0302B_program_auto.html
[power]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/252h_using_camera_usb_power_supply.html
[protect]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0506_protect.html
[quality]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_jpeg_heif_quality.html
[recog]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/211h_recognition_target.html
[recognizing]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/211h_about_eye_af.html
[s]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0302_shutter_priority.html
[side]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_names_of_parts_ilc2540_side.html
[silent]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0414D_silent_mode_setting.html
[size]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_jpeg_heif_size.html
[snap]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0301B_shooting_still_images.html
[sound]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0601B_audio_signals.html
[spec]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_specifications_ilc2540.html
[standard]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0405L_focus_standard.html
[step]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0406_exposure_step_value.html
[switchjpeg]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_jpeg_heif_switch.html
[touch]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/201h_touch_panel_operation.html
[touchfocus]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0601L_touch_focus.html
[touchset]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/211h_touchpanel_settings.html
[touchtrack]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0601P_touch_tracking.html
[types]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0414H_shutter_type.html
[usbpower]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/251h_usb_power_supply.html
[wb]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0410C_white_balance.html
[wheel]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0201C_using_control_wheel.html
[zoom]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0501C_playback_zoom.html
[zoompos]: https://helpguide.sony.net/ilc/2540/v1/zh-cn/contents/0506K_enlarge_initial_position.html

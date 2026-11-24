/* ================= App 交互 ================= */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,AIS.fast?Math.min(ms,30):ms));
const AIS={proto:'messages',model:'claude-opus-5-5',effort:'medium',fast:false,busy:false};

/* ---------- 右侧说明 ---------- */
const NOTES={
  home:{k:'学习 · 首页',h:'每天打开先看这里',p:'首页只回答两个问题：今天学什么，今天练什么。',
    ul:['进度卡显示当前等级和已认识的部件数，在 3D 相机里点过的部件会计入','「继续学习」直接跳到 3D 相机，并点亮这一课要学的按键','今日任务里会出现 AI 复盘后加进来的练习，带「AI」标记','学习路径 L0–L14，其中 L12–L14 是视频课（V2）；原型里 L0、L1、L3–L6 可以点进去试'],
    reqs:['F-LRN','F-AI-07','§5 信息架构'],try:[['继续 L1-3 背面按键',()=>$('#contLesson').click()],['去做一次 AI 复盘',()=>{go('ai');runReview('p1')}]]},
  cam:{k:'相机 · 3D 探索',h:'一台可以随便按的 α7 V',p:'机身和镜头上的按键、拨盘、开关和屏幕都能点。点了弹出说明，拨盘和开关可以操作，背面屏幕上的参数跟着变。',
    ul:['拖动旋转，滚轮或双指缩放，双击复位；底部是快捷视角','「标签」显示所有部件名；「找键练习」随机出 10 题计分','点背面的屏幕，进入「屏幕显示详解」，屏幕上每个图标都能点','光圈环离开 A 后由镜头调光圈，后拨盘 R 锁住时转不动，广域对焦时摇杆不能移动对焦框','示意模型由代码生成，正式版用 Blender 精模，部件 ID 不变'],
    reqs:['F-3D-01…09','F-SCR-01','F-SCR-02'],try:[['看背面按键',()=>{go('cam');Cam.setView('back');Cam.highlight(['btn_afon','btn_ael','btn_c1','btn_c3'],'L1-3 要学的 4 个键','pulse')}],['打开屏幕详解',()=>{go('cam');Cam.setView('back');openLcd()}],['开始找键练习',()=>{go('cam');startPractice()}],['看镜头上的开关',()=>{go('cam');Cam.setView('right');Cam.highlight(['sw_click','sw_zoom_smooth'],'镜头右侧的 CLICK 和变焦阻尼','pulse')}]]},
  lcd:{k:'相机 · 屏幕显示详解',h:'屏幕上每个图标都能点',p:'渲染一块和拍摄界面布局类似的屏幕。点任意图标看它是什么、怎么改；下面的按钮模拟真机按键。',
    ul:['DISP 在全部信息、只看参数、直方图、水平仪之间切换','Fn 打开 12 格快捷菜单，MENU 打开菜单（完整模拟器在 V1）','半按看左下合焦指示，回放可放大检查主体细节','图标位置是示意，正式版按实机界面绘制'],
    reqs:['F-SCR-01','F-SCR-02','F-SCR-03','F-SCR-04'],try:[['切到直方图',()=>{st.disp=2;act('lcd')}],['打开 Fn 菜单',()=>act('btn_fn')]]},
  lab:{k:'实验室 · 曝光三角',h:'拖一下就懂光圈、快门、ISO',p:'三个参数各管一种「副作用」：光圈管背景虚化，快门管拖影，ISO 管噪点。拖动滑块，画面实时变化，下面一句话解释发生了什么。',
    ul:['A 档：你定光圈，相机自动算快门；S 档反过来；M 档全部自己定','测光表从 −3 到 +3，和相机屏幕上的 M.M. 一样','快门慢于 1/15 秒会提示手抖；高 ISO 噪点增加','4 个场景亮度不同：晴天 EV 15、阴天 12、室内 7、夜景 4'],
    reqs:['F-LAB-01…05','设置 EV = log₂(N²/t) − log₂(ISO/100)'],try:[['光圈收到 F11',()=>{go('lab');labSet({mode:'A',ap:APS.indexOf(11)},'ap')}],['夜景 + 快门 1/8',()=>{go('lab');labScene(3);labSet({mode:'S',tv:LTV.indexOf(1/8)},'tv')}],['切到 M 档',()=>{go('lab');labSet({mode:'M'},'mode')}]]},
  ai:{k:'AI 教练',h:'看得懂照片，会指着按键教你',p:'选一张照片，AI 先看 EXIF 和画面，再边讲边调用工具：在照片上画框，在对话里的 3D 相机上高亮按键、演示拨盘转几格，最后给一张复盘卡。',
    ul:['思考过程先显示「思考中」，结束后折叠成一句摘要，可展开','工具卡片显示当前协议的字段名（tool_use / function_call），点开看参数和返回结果','对话里的 3D 相机由工具调用驱动，转到哪一格，虚拟屏幕上的参数就变成多少','橙色的按键名可以点，会在 3D 相机上高亮','复盘卡先给「要改 → 怎么改」，再给「做得好 → 怎么保持」，练习一键加进今日任务','语气略严格：先讲最影响成片的问题，不说空泛的夸奖，打分从严','照片来源：MVP 从手机相册选；V1 加 USB-C 和 Wi-Fi 直连相机导入（点左下角图片按钮看入口）'],
    reqs:['F-AI-01…12','§7 Agent 技术方案'],try:[['复盘：逆光人像',()=>{go('ai');runReview('p1')}],['复盘：夜景糊片',()=>{go('ai');runReview('p2')}],['复盘：风景前景虚',()=>{go('ai');runReview('p3')}]]},
  me:{k:'我的 · 设置',h:'自带 Key，两种协议都支持',p:'没有自建后端，App 直接连你配置的模型服务。',
    ul:['切换 Anthropic Messages / OpenAI Responses，AI 页的工具卡片字段跟着变','可以填代理或兼容服务的 Base URL','Key 存在 Android Keystore，界面只显示后 4 位','「我的相机配置」会作为上下文发给 AI，它按你实际的按键分配给建议','默认上传前移除 GPS 和序列号'],
    reqs:['F-SET-01…07','F-AI-03','F-AI-10'],try:[['切到 Responses API',()=>{go('me');setProto('responses')}],['测试连接',()=>{go('me');$('#btnTest').click()}]]}
};
function setNote(k){const n=NOTES[k];if(!n)return;const el=$('#note');
  el.innerHTML=`<div class="k">${n.k}</div><h2>${n.h}</h2><p>${n.p}</p><ul>${n.ul.map(x=>`<li>${x}</li>`).join('')}</ul><div class="reqs">${n.reqs.map(x=>`<span>${x}</span>`).join('')}</div><div class="try">${n.try.map((t,i)=>`<button type="button" data-i="${i}">试试：${t[0]}</button>`).join('')}</div>`;
  el.querySelectorAll('.try button').forEach(b=>b.onclick=()=>n.try[+b.dataset.i][1]())}

/* ---------- 导航 ---------- */
let curTab='home';
function go(tab){if(tab!=='ai')freezeActive();curTab=tab;$$('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));
  ['home','cam','lab','ai','me'].forEach(t=>$('#scr-'+t).hidden=t!==tab);$('#lcdView').hidden=true;$('#picker').hidden=true;
  if(tab==='cam')Cam.mount($('#camHost'));if(tab==='lab')labRender();setNote(tab)}
$$('.tab').forEach(b=>b.onclick=()=>go(b.dataset.tab));

/* ---------- 学习首页 ---------- */
const LESSONS=[['L0','开箱','充电、装卡、装镜头、调屈光度','拍一张桌面上的杯子','done'],['L1','认识机身','每个按键和拨盘，3D 找键练习','3D 练习满分','cur'],['L2','第一张照片','智能自动 → P 档，半按对焦，看回放','10 张不同物体全部清晰','lock'],
  ['L3','曝光三要素','光圈、快门、ISO 的关系','同一场景 F2.8 和 F11 各一张','try'],['L4','A 档与 S 档','光圈优先、快门优先，何时用哪个','A 档拍虚化人像，S 档拍流水','try'],['L5','对焦系统','AF-A 等五种对焦方式、对焦区域与被摄体识别','AF-C + 眼部识别拍走动的人','try'],
  ['L6','测光与曝光补偿','测光模式、直方图、曝光补偿','逆光人像用曝光补偿救回脸','try'],['L7','色彩','白平衡、创意外观','自动白平衡和日光白平衡各一张','lock'],['L8','用好 24-70','焦段、光圈环、对焦保持','同一主体 24/35/50/70 各一张','lock'],
  ['L9','M 档','全手动曝光、Auto ISO + M','夜景用 M 档拍','lock'],['L10','场景实战','人像、风景、街拍、夜景、运动、美食','每个场景一组作品','lock'],['L11','自定义','C 键、我的菜单、MR 记忆模式','配置一套自己的按键方案','lock'],
  ['L12','视频入门','拍照/录像旋钮、帧率，快门设为帧率 2 倍的倒数','25p、1/50 拍一段 10 秒街景','v2'],['L13','视频对焦与防抖','AF 过渡速度、主体识别、防抖档位','跟拍走路的人，脸全程清晰','v2'],['L14','画面风格与收音','光圈无级调节、ND 滤镜、S-Cinetone、热靴麦克风','标准和 S-Cinetone 各拍一段','v2']];
const TASKS=[{t:'3D 找键练习答对全部 10 题',s:'相机 › 找键练习 · L1',done:false,id:'practice'},{t:'把光圈从 F2.8 拖到 F11，看背景怎么变',s:'实验室 · L3',done:false,id:'lab'},{t:'拍一张桌面上的杯子',s:'实拍任务 · L0 · AI 已验收',done:true}];
function renderTasks(newIdx){const ul=$('#taskList');ul.innerHTML=TASKS.map((t,i)=>`<li class="task${t.done?' done':''}${i===newIdx?' new':''}"><button class="ck" type="button" data-i="${i}" aria-label="${t.done?'标记未完成':'标记完成'}"></button><div><div class="tt">${esc(t.t)}${t.ai?'<span class="src-ai">AI</span>':''}</div><div class="ts">${esc(t.s)}</div></div></li>`).join('');
  ul.querySelectorAll('.ck').forEach(b=>b.onclick=()=>{const t=TASKS[+b.dataset.i];t.done=!t.done;renderTasks()});$('#taskCount').textContent=TASKS.filter(t=>!t.done).length}
function addTask(title,steps){TASKS.unshift({t:title,s:'AI 复盘布置 · '+steps.length+' 步',done:false,ai:true});renderTasks(0)}
function lessonGo(id){({L0:()=>{go('cam');Cam.setView('back');Cam.highlight(['diopter','evf'],'第一课：调屈光度','arrow')},L1:()=>$('#contLesson').click(),L3:()=>go('lab'),L4:()=>{go('lab');labSet({mode:'S'},'mode')},
  L5:()=>{go('cam');Cam.setView('back');Cam.highlight(['btn_c3','btn_c2','btn_afon','joystick'],'对焦相关的 4 个键')},L6:()=>{go('cam');Cam.setView('top');Cam.highlight(['dial_rear_r'],'曝光补偿在这里','arrow')}}[id]||(()=>toast('原型里还没有这一课')))()}
$('#pathList').innerHTML=LESSONS.map(([id,n,d,,s])=>`<li class="${s==='v2'?'lock':s}"><div class="rail"><span class="dot">${s==='done'?'✓':id.slice(1)}</span><span class="ln"></span></div><button class="body" type="button" data-l="${id}"><div class="pt">${id} · ${n}${s==='cur'?' <span class="muted">进行中</span>':s==='try'?' <span class="muted">可试</span>':s==='v2'?' <span class="muted">视频 · V2</span>':''}</div><div class="pd">${d}</div></button></li>`).join('');
$$('#pathList [data-l]').forEach(b=>b.onclick=()=>lessonGo(b.dataset.l));
$('#lvlGrid').innerHTML=LESSONS.map(([id,n,d,task])=>`<div class="lvl"><b>${id}</b><span>${n}</span><p>${d}</p><p>实拍：${task}</p></div>`).join('');
$('#contLesson').onclick=()=>{go('cam');Cam.setView('back');Cam.highlight(['btn_afon','btn_ael','btn_c1','btn_c3'],'这一课：背面 4 个键','pulse');toast('依次点亮的 4 个键，点一下看说明')};
$('#aiEntry').onclick=()=>go('ai');
const known=new Set(['shutter','power','mode_dial','lcd','evf','diopter','btn_menu','btn_play','lens_release','card_door','battery_door']);
$('#controlCount').textContent=Object.keys(CONTROLS).length;

/* ---------- 3D 相机页 ---------- */
const VIEW_CHIPS=[['home','全景'],['front','正面'],['top','顶部'],['back','背面'],['lens','镜头'],['left','左侧'],['right','右侧'],['bottom','底部']];
$('#viewChips').innerHTML=VIEW_CHIPS.map(([v,n])=>`<button class="pill" type="button" data-v="${v}">${n}</button>`).join('');
$$('#viewChips [data-v]').forEach(b=>b.onclick=()=>Cam.setView(b.dataset.v));
$('#btnLabels').onclick=e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(on));Cam.labels(on)};
let selId=null;const sheet=$('#sheet');
function actionsFor(id){
  if(st.picker)return [['上一项','pickPrev'],['下一项','pickNext'],['确认','confirm']];
  if(id==='dial_front')return effMode()==='S'?[['快门放慢','minus'],['快门加快','plus']]:[['减小 F 值','minus'],['增大 F 值','plus']];
  if(id==='dial_rear_l')return effMode()==='A'?[['减小 F 值','minus'],['增大 F 值','plus']]:[['快门放慢','minus'],['快门加快','plus']];
  if(id==='diopter')return [['上一格','minus'],['下一格','plus']];
  if(id==='dial_rear_r')return [['减补偿','minus'],['加补偿','plus'],[st.rLock?'按锁定钮：解锁':'按锁定钮：锁定','lock']];
  if(id==='mode_switch')return [['按住解锁，转到上一档','minus'],['按住解锁，转到下一档','plus']];
  if(['mode_dial','ring_zoom','ring_aperture'].includes(id))return [['◀ 上一档','minus'],['下一档 ▶','plus']];
  if(id==='ring_focus')return [['◀ 转','minus'],['转 ▶','plus']];
  if(id==='wheel'){
    if(st.overlay==='play')return [['上一张','left'],['下一张','right'],['转动 −','minus'],['转动 +','plus']];
    if(st.overlay)return [['按上','up'],['按下','down'],['按左','left'],['按右','right']];
    return [['按上 DISP','up'],[st.msw==='照片'?'按左 拍摄模式':'按左 自拍定时','left'],['按右 ISO','right'],['按下','down'],['转动 −','minus'],['转动 +','plus']];
  }
  if(id==='joystick')return [['↑','up'],['↓','down'],['←','left'],['→','right'],['按下','click']];
  if(id==='lcd')return [['打开屏幕详解','lcd']];
  if(id.startsWith('sw_')||id==='power')return [['拨动','click']];
  if(id==='shutter')return [['半按','half'],['按到底拍摄','click']];
  if(id==='btn_ael'&&st.overlay!=='play')return st.ael?[['松开','release']]:[['按住','hold']];
  if(id.startsWith('btn_'))return [['按一下','click']];
  return [];
}
const DISPN=['全部信息','只看参数','直方图','水平仪'];
function stateOf(id){if(st.picker)return st.picker.title+' · '+st.picker.options[st.picker.index];const r=expo();switch(id){
  case 'power':return st.power?'开':'关';case 'shutter':return `${fmtT(r.t)} · ${fmtN(r.N)} · ISO ${r.iso}`;
  case 'dial_front':case 'dial_rear_l':{
    const m=effMode();
    if(m==='S'||(m==='M'&&id==='dial_rear_l'))return '快门 '+fmtT(r.t);
    if(m==='P'||m==='AUTO')return MODE_NAMES[m];
    return st.apRing===7?'光圈 '+fmtN(r.N):'光圈由镜头光圈环控制';
  }
  case 'dial_rear_r':return '曝光补偿 '+fmtEv(effEv())+(st.rLock?' · 已锁定':'');case 'mode_dial':return MODES[st.modeI]+' '+MODE_NAMES[MODES[st.modeI]];
  case 'mode_switch':return st.msw;case 'btn_c1':return '白平衡 '+effWb();case 'btn_c2':return '对焦区域 '+effArea();
  case 'btn_c3':return st.overlay==='play'?'回放 · 保护':'对焦模式 '+effFm();
  case 'btn_c4':return st.overlay==='play'?'回放 · 删除':'触摸操作选择 · '+(st.touch?'开':'关');
  case 'btn_ael':return st.ael?'已锁定':'未锁定';case 'wheel':return `DISP ${DISPN[st.disp]} · 驱动 ${st.drive} · ISO ${r.auto?'AUTO':r.iso}`;
  case 'joystick':return !movableArea()?effArea()+' · 区域固定':'对焦框 '+(st.fp[0]||st.fp[1]?'已偏离中心':'在中心');
  case 'btn_fn':return st.overlay==='fn'?'Fn 菜单已打开':'未打开';case 'btn_menu':return st.overlay==='menu'?'菜单已打开':'未打开';case 'btn_play':return st.overlay==='play'?'回放中':'拍摄中';
  case 'ring_zoom':return st.focal+'mm';case 'ring_aperture':return st.apRing===7?'A（由机身控制）':'F'+AP_RING[st.apRing];
  case 'sw_iris_lock':return st.irisLock?'锁定':'松开';case 'sw_click':return st.click?'ON':'OFF';case 'sw_focus_mode':return st.lensAF?'AF':'MF';case 'sw_zoom_smooth':return st.zoomSmooth;
  case 'lcd':return 'DISP：'+DISPN[st.disp];default:return ''}}
function openSheet(id){selId=id;Cam.select(id);if(!known.has(id)){known.add(id);$('#knownCount').textContent=known.size}
  const c=CONTROLS[id],s=stateOf(id),acts=actionsFor(id);
  sheet.innerHTML=`<div class="grab"></div><div class="sh-h"><div><div class="sh-n">${c.n}</div><div class="sh-id">${id}</div></div><button class="sh-x" type="button" id="shX" aria-label="关闭">×</button></div>
  <dl class="kv"><dt>位置</dt><dd>${c.p}</dd><dt>默认功能</dt><dd>${c.f}</dd><dt>新手建议</dt><dd>${c.t}</dd>${s?`<dt>现在</dt><dd><span class="state-chip">${s}</span></dd>`:''}</dl>
  <div class="acts">${acts.map(([l,op])=>`<button class="btn" type="button" data-op="${op}">${l}</button>`).join('')}<button class="btn pri" type="button" id="shAsk">问 AI</button></div>
  <div class="sh-note">出厂默认功能以 Sony 官方帮助指南和实机为准</div>`;
  sheet.hidden=false;$('#shX').onclick=closeSheet;$('#shAsk').onclick=()=>{go('ai');askControl(id)};
  sheet.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{
    const op=b.dataset.op;
    if(op==='lcd')openLcd();
    else if(op==='confirm')act('btn_center');
    else if(op==='pickPrev'||op==='pickNext')act('wheel',op==='pickPrev'?'minus':'plus');
    else act(id,op);
  })}
function closeSheet(){sheet.hidden=true;selId=null;Cam.select(null)}
function renderReadout(){const r=expo(),now=performance.now(),h=k=>st.chg===k&&now-st.chgT<1500?' class="chg"':'';
  $('#readout').innerHTML=`<span${h('mode')}>${MODES[st.modeI]}<small>模式</small></span><span${h('av')}>${fmtN(r.N)}<small>光圈</small></span><span${h('tv')}>${fmtT(r.t)}<small>快门</small></span><span${h('iso')}>${r.auto?'A':''}${r.iso}<small>ISO</small></span><span${h('ev')}>${fmtEv(effEv())}<small>补偿</small></span><span${h('focal')}>${st.focal}<small>mm</small></span><span${h('fm')}>${effFm()}<small>对焦</small></span>`}
onCamState=()=>{renderReadout();if(selId&&!sheet.hidden)openSheet(selId);if(!$('#lcdView').hidden)drawLcd()};
Cam.onPick=id=>{if(practice.on)return practiceAnswer(id);
  if(curTab==='ai'){if(id)toast(shortName(id)+'：'+CONTROLS[id].f);return}
  if(!id){closeSheet();return}Cam.clear();$('#hint3d').hidden=true;openSheet(id);if(id==='lcd')openLcd()};

/* 找键练习 */
const practice={on:false,q:[],i:0,score:0};
function startPractice(){const pool=['btn_afon','btn_c1','dial_rear_r','btn_fn','joystick','btn_ael','mode_dial','dial_front','btn_menu','wheel','ring_zoom','sw_focus_mode','btn_c3','ring_aperture','btn_c2','dial_rear_l'];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  Object.assign(practice,{on:true,q:pool.slice(0,10),i:0,score:0});$('#btnPractice').setAttribute('aria-pressed','true');$('#btnLabels').setAttribute('aria-pressed','false');Cam.labels(false);closeSheet();Cam.clear();Cam.setView('home');renderPractice()}
function endPractice(){practice.on=false;$('#practiceBar').hidden=true;$('#btnPractice').setAttribute('aria-pressed','false');Cam.clear()}
function renderPractice(){const b=$('#practiceBar');b.hidden=false;
  if(practice.i>=practice.q.length){const ok=practice.score===practice.q.length;if(ok){const t=TASKS.find(t=>t.id==='practice');if(t)t.done=true;renderTasks()}
    b.innerHTML=`<div class="q">完成！得分 <b>${practice.score} / 10</b>${ok?'，今日任务已完成':'，答对全部 10 题即可完成'}</div><button class="pill" type="button" id="pqAgain">再来</button><button class="pill" type="button" id="pqEnd">结束</button>`;$('#pqAgain').onclick=startPractice;$('#pqEnd').onclick=endPractice;return}
  b.innerHTML=`<div class="q">第 ${practice.i+1}/10 题：找到 <b>${shortName(practice.q[practice.i])}</b></div><div class="sc tnum">${practice.score}</div><button class="pill" type="button" id="pqEnd">结束</button>`;$('#pqEnd').onclick=endPractice}
function practiceAnswer(id){if(!id||practice.i>=practice.q.length)return;const want=practice.q[practice.i];
  if(id===want){practice.score++;Cam.highlight([id],'✓ 答对了');}else{Cam.highlight([want],'在这里','arrow');toast(`你点的是「${shortName(id)}」`)}
  practice.i++;renderPractice();clearTimeout(practiceAnswer._t);practiceAnswer._t=setTimeout(()=>{if(practice.on)Cam.clear()},1100)}
$('#btnPractice').onclick=()=>practice.on?endPractice():startPractice();

/* 屏幕显示详解 */
let lcdSel=null,lcdHs=[];
function openLcd(){const v=$('#lcdView');v.hidden=false;lcdSel=null;
  v.innerHTML=`<div class="lcdv-h"><b style="font-size:16px">屏幕显示详解</b><button class="sh-x" type="button" id="lcdX" aria-label="关闭">×</button></div>
  <div class="lcd-box"><canvas id="lcdC" width="1024" height="683"></canvas><div id="hsLayer" style="position:absolute;inset:0"></div></div>
  <div class="acts"><button class="btn" type="button" data-a="wheel:up">DISP</button><button class="btn" type="button" data-a="btn_fn">Fn</button><button class="btn" type="button" data-a="btn_menu">MENU</button><button class="btn" type="button" data-a="btn_play">回放</button><button class="btn" type="button" data-a="shutter:half">半按快门</button><button class="btn" type="button" data-a="shutter">拍摄</button></div>
  <div class="hs-info" id="hsInfo"><b>点屏幕上的任意图标</b>这里会解释它是什么、怎么改。</div>`;
  $('#lcdX').onclick=()=>{v.hidden=true;setNote('cam')};v.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const[a,op]=b.dataset.a.split(':');act(a,op||'click')});drawLcd();setNote('lcd')}
function drawLcd(){const c=$('#lcdC');if(!c)return;lcdHs=drawScreen(c.getContext('2d'),1024,683);
  $('#hsLayer').innerHTML=lcdHs.map((h,i)=>`<button class="hsp${h.k===lcdSel?' on':''}" type="button" data-i="${i}" aria-label="${h.title}" style="left:${h.x/10.24}%;top:${h.y/6.83}%;width:${h.w/10.24}%;height:${h.h/6.83}%"></button>`).join('');
  $$('#hsLayer .hsp').forEach(b=>b.onclick=()=>{const h=lcdHs[+b.dataset.i];lcdSel=h.k;$('#hsInfo').innerHTML=`<b>${h.title}</b>${h.desc}`;$$('#hsLayer .hsp').forEach(x=>x.classList.toggle('on',x===b))});
  if(lcdSel){const h=lcdHs.find(h=>h.k===lcdSel);if(h)$('#hsInfo').innerHTML=`<b>${h.title}</b>${h.desc}`}}

/* ---------- 曝光实验室 ---------- */
const SCN=[{n:'晴天',ev:15},{n:'阴天',ev:12},{n:'室内',ev:7},{n:'夜景',ev:4}];
const LTV=[30,15,8,4,2,1,1/2,1/4,1/8,1/15,1/30,1/60,1/125,1/250,1/500,1/1000,1/2000,1/4000,1/8000];
const LISO=['AUTO',100,200,400,800,1600,3200,6400,12800,25600,51200];
const LAB={scene:1,mode:'A',ap:0,tv:13,iso:0,ev:0,last:null};
const PAL=[{sky:['#4F9FE6','#CDE6FA'],sun:1,tree:'#6E9550',bld:['#E1D9CB','#D2C9B8','#EAE4D8'],win:'#8FB0CC',g:['#C2BBAA','#948F84']},
  {sky:['#8996A3','#D2D8DE'],tree:'#56704A',bld:['#BAB6AE','#A8A49C','#C6C2BA'],win:'#7D8995',g:['#A19D94','#7A766F']},null,
  {sky:['#081230','#22305A'],moon:1,tree:'#0F1C1E',bld:['#1C2338','#252C44','#171D30'],win:'#FFD27A',g:['#1D2232','#10131C'],lamp:1}];
function labBgSvg(i){if(i===2)return `<rect width="300" height="200" fill="#9A7B5E"/><rect x="0" y="0" width="300" height="12" fill="#7E634B"/><rect x="190" y="26" width="84" height="74" fill="#F4EAD2"/><path d="M190 63h84M232 26v74" stroke="#7E634B" stroke-width="3"/><g fill="#5C4535"><rect x="20" y="40" width="120" height="6"/><rect x="20" y="80" width="120" height="6"/></g><g fill="#C9A26A"><rect x="26" y="22" width="12" height="18"/><rect x="42" y="26" width="10" height="14"/><rect x="58" y="20" width="14" height="20"/><rect x="96" y="62" width="16" height="18"/><rect x="116" y="58" width="10" height="22"/></g><circle cx="160" cy="38" r="12" fill="#FFE6A8"/><rect x="0" y="130" width="300" height="70" fill="#6E5440"/><rect x="236" y="104" width="30" height="40" rx="4" fill="#3F5B3A"/><circle cx="251" cy="96" r="18" fill="#4F7346"/>`;
  const p=PAL[i];let s=`<defs><linearGradient id="lsky${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs><rect width="300" height="200" fill="url(#lsky${i})"/>`;
  if(p.sun)s+='<circle cx="252" cy="34" r="15" fill="#FFF6C8"/>';if(p.moon)s+='<circle cx="252" cy="32" r="9" fill="#F3F0E0"/>';
  s+=`<g fill="${p.tree}"><circle cx="26" cy="112" r="24"/><circle cx="62" cy="104" r="28"/><circle cx="276" cy="108" r="26"/></g>`;
  [[100,70,40,60],[146,52,34,78],[186,78,46,52]].forEach(([x,y,w,h],k)=>{s+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bld[k]}"/>`;for(let yy=y+8;yy<y+h-8;yy+=12)for(let xx=x+5;xx<x+w-6;xx+=9)if((xx*3+yy*7)%4<3)s+=`<rect x="${xx}" y="${yy}" width="5" height="7" fill="${p.win}" opacity="${p.lamp?.95:.6}"/>`});
  s+=`<rect y="128" width="300" height="72" fill="${p.g[0]}"/><rect y="152" width="300" height="48" fill="${p.g[1]}"/>`;
  if(p.lamp)[40,150,262].forEach(x=>{s+=`<rect x="${x-1}" y="96" width="2" height="34" fill="#333"/><circle cx="${x}" cy="96" r="12" fill="#FFD27A" opacity=".35"/><circle cx="${x}" cy="96" r="4" fill="#FFF1C8"/>`});return s}
$('#lsSubj').innerHTML=`<g><rect x="80" y="150" width="9" height="40" fill="#2E3440"/><rect x="92" y="150" width="9" height="40" fill="#2E3440"/><rect x="76" y="104" width="30" height="50" rx="8" fill="#D2602F"/><circle cx="91" cy="92" r="11" fill="#E6BB9C"/><path d="M80 90a11 11 0 0 1 22 0c-4-5-18-5-22 0z" fill="#2A211C"/></g>`;
$('#lsMove').innerHTML=`<defs><filter id="lmb" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur id="lmbG" stdDeviation="0 0"/></filter></defs><g filter="url(#lmb)"><circle cx="190" cy="176" r="12" fill="none" stroke="#222" stroke-width="3"/><circle cx="226" cy="176" r="12" fill="none" stroke="#222" stroke-width="3"/><path d="M190 176l14-20h16l6 20M204 156l-4-8" stroke="#2B5FA8" stroke-width="3.5" fill="none"/><rect x="204" y="128" width="12" height="22" rx="4" fill="#E8C33A"/><circle cx="212" cy="120" r="7" fill="#E0B595"/><path d="M206 150l-4 18M214 150l8 14" stroke="#333" stroke-width="4"/></g>`;
(()=>{const c=$('#lsNoise').getContext('2d'),d=c.createImageData(300,200);for(let i=0;i<d.data.length;i+=4){d.data[i]=Math.random()*255;d.data[i+1]=Math.random()*255;d.data[i+2]=Math.random()*255;d.data[i+3]=255}c.putImageData(d,0,0)})();
$('#sceneChips').innerHTML=SCN.map((s,i)=>`<button class="pill" type="button" data-s="${i}">${s.n} <span class="muted">EV ${s.ev}</span></button>`).join('');
$$('#sceneChips [data-s]').forEach(b=>b.onclick=()=>labScene(+b.dataset.s));
$('#labMode').innerHTML=[['M','M 手动'],['A','A 光圈优先'],['S','S 快门优先']].map(([m,n])=>`<button type="button" data-m="${m}">${n}</button>`).join('');
$$('#labMode [data-m]').forEach(b=>b.onclick=()=>labSet({mode:b.dataset.m},'mode'));
(()=>{let h='';for(let i=-9;i<=9;i++){const l=(i+9)/18*100,big=i%3===0;h+=`<i class="tk${big?' big':''}" style="left:${l}%"></i>`;if(big)h+=`<span class="tl" style="left:${l}%">${i>0?'+':''}${i/3}</span>`}$('#meterScale').insertAdjacentHTML('afterbegin',h)})();
const labIn=()=>({N:APS[LAB.ap],t:LTV[LAB.tv],iso:LISO[LAB.iso],ev:LAB.ev/3});
const labSolve=()=>solve(LAB.mode,SCN[LAB.scene].ev,labIn());
function nStop(x){const v=Math.round(Math.abs(x)*3)/3;return (v%1===0?v.toFixed(0):v.toFixed(1))}
function labStatus(r){const b=r.bias;let t=Math.abs(b)<.34?'现在<b>曝光正常</b>':b>0?`现在<b>过曝约 ${nStop(b)} 档</b>`:`现在<b>欠曝约 ${nStop(b)} 档</b>`;if(r.warn)t+='（'+r.warn+'）';
  if(r.t>=1/15)t+='；快门慢于 1/15 秒，手持会糊，需要三脚架';if(r.iso>=6400)t+='；ISO 很高，噪点明显';return t+'。'}
function labExplain(key,a,b){const s=[];
  if(key==='ap'){const d=2*lg(b.N/a.N);if(Math.abs(d)>.05)s.push(`光圈从 <b>${fmtN(a.N)}</b> ${d>0?'收小':'开大'}到 <b>${fmtN(b.N)}</b>，进光${d>0?'少':'多'}了 ${nStop(d)} 档，背景${d>0?'变清楚':'更虚'}了`)}
  if(key==='tv'){const d=lg(b.t/a.t);if(Math.abs(d)>.05)s.push(`快门从 <b>${fmtT(a.t)}</b> ${d>0?'放慢':'加快'}到 <b>${fmtT(b.t)}</b>，进光${d>0?'多':'少'}了 ${nStop(d)} 档，骑车人${d>0?'拖影更长':'更清楚'}`)}
  if(key==='iso'&&a.iso!==b.iso)s.push(`ISO 从 <b>${a.iso}</b> ${b.iso>a.iso?'提高':'降低'}到 <b>${b.iso}</b>，画面${b.iso>a.iso?'变亮，噪点变多':'变暗，更干净'}`);
  if(key==='ev')s.push(`曝光补偿设为 <b>${fmtEv(LAB.ev/3)}</b>，相机会让画面${LAB.ev>0?'更亮':LAB.ev<0?'更暗':'回到标准亮度'}`);
  if(key==='mode')s.push(`切到 <b>${{M:'M 手动',A:'A 光圈优先',S:'S 快门优先'}[LAB.mode]}</b>：${{M:'光圈、快门、ISO 都由你定，亮度要看测光表',A:'你定光圈，相机自动算快门',S:'你定快门，相机自动算光圈'}[LAB.mode]}`);
  if(key==='scene')s.push(`换到 <b>${SCN[LAB.scene].n}</b>（EV ${SCN[LAB.scene].ev}），光线${SCN[LAB.scene].ev<10?'弱':'强'}`);
  if(key!=='tv'&&Math.abs(lg(b.t/a.t))>.05)s.push(`相机自动把快门${b.t>a.t?'放慢':'加快'}到 <b>${fmtT(b.t)}</b>`);
  if(key!=='ap'&&Math.abs(lg(b.N/a.N))>.05)s.push(`相机自动把光圈${b.N>a.N?'收小':'开大'}到 <b>${fmtN(b.N)}</b>`);
  if(key!=='iso'&&b.iso!==a.iso)s.push(`ISO 自动${b.iso>a.iso?'提高':'降低'}到 <b>${b.iso}</b>`);
  return (s.length?s.join('；')+'。':'')+labStatus(b)}
function labSet(ch,key){const before=labSolve();if(ch.mode&&ch.mode!==LAB.mode){LAB.ap=snap(APS,before.N);LAB.tv=snap(LTV,before.t)}Object.assign(LAB,ch);labRender(key,before)}
function labScene(i){const before=labSolve();LAB.scene=i;labRender('scene',before)}
function labRender(key,before){const r=labSolve(),m=LAB.mode;
  $$('#sceneChips [data-s]').forEach(b=>b.classList.toggle('on',+b.dataset.s===LAB.scene));$$('#labMode [data-m]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===m)));
  $('#lsBg').innerHTML=labBgSvg(LAB.scene);
  const slAp=$('#slAp'),slTv=$('#slTv'),slIso=$('#slIso'),slEv=$('#slEv');
  slAp.disabled=m==='S';slTv.disabled=m==='A';slEv.disabled=m==='M'&&LISO[LAB.iso]!=='AUTO';
  slAp.value=m==='S'?snap(APS,r.N):LAB.ap;slTv.value=m==='A'?snap(LTV,r.t):LAB.tv;slIso.value=LAB.iso;slEv.value=LAB.ev;
  $('#oAp').textContent=fmtN(r.N);$('#oTv').textContent=fmtT(r.t);$('#oIso').textContent=(r.auto?'A ':'')+r.iso;$('#oEv').textContent=slEv.disabled?'—':fmtEv(LAB.ev/3);
  $('#rowAp').classList.toggle('auto',m==='S');$('#rowTv').classList.toggle('auto',m==='A');$('#rowIso').classList.toggle('auto',r.auto);
  const b=clamp(r.bias,-4,4),shake=r.t>=1/15;
  $('#lsBg').style.filter=`blur(${(Math.max(0,28/r.N-1)*.55).toFixed(2)}px)`;
  $('#lmbG').setAttribute('stdDeviation',`${Math.min(60,540*r.t).toFixed(1)} 0`);
  $('#lsNoise').style.opacity=(clamp(lg(r.iso/100)/9,0,1)*.8).toFixed(2);
  $('#lsIn').style.filter=`brightness(${(2**(b*.55)).toFixed(3)})${shake?' blur(1.3px)':''}`;
  $('#lsClip').style.background=b>1?`rgba(255,255,255,${Math.min(.7,(b-1)*.3).toFixed(2)})`:b<-1?`rgba(0,0,0,${Math.min(.75,(-b-1)*.28).toFixed(2)})`:'transparent';
  const w=$('#lsWarn');w.hidden=!(shake||r.warn);w.textContent=shake?'手抖风险':r.bias>0?'过曝':'欠曝';
  $('#lsHud').innerHTML=`<span>${fmtT(r.t)}　${fmtN(r.N)}　ISO ${r.iso}</span><span>${m}　${fmtEv(Math.round(r.bias*3)/3)}</span>`;
  $('#meterPtr').style.left=(50+clamp(r.bias,-3,3)/3*50)+'%';
  $('#labExp').innerHTML=key&&before?labExplain(key,before,r):'拖动下面的滑块试试。A 档下你定光圈，相机自动算快门；S 档反过来；M 档全部自己定。'+labStatus(r);
  if(key==='ap'&&r.N>=11){const t=TASKS.find(t=>t.id==='lab');if(t&&!t.done){t.done=true;renderTasks()}}}
$('#slAp').oninput=e=>labSet({ap:+e.target.value},'ap');$('#slTv').oninput=e=>labSet({tv:+e.target.value},'tv');
$('#slIso').oninput=e=>labSet({iso:+e.target.value},'iso');$('#slEv').oninput=e=>labSet({ev:+e.target.value},'ev');

/* ---------- 示例照片（程序生成的 SVG，非真实照片） ---------- */
const PHOTOS={
 p1:{name:'逆光人像',exif:{模式:'A',光圈:'F2.8',快门:'1/2000',ISO:'100',焦距:'50mm',补偿:'±0.0',测光:'多重',对焦:'AF-C · 眼部'},
  svg:u=>`<svg class="ph" viewBox="0 0 300 200" role="img" aria-label="逆光人像示例"><defs><linearGradient id="a${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7E6"/><stop offset=".6" stop-color="#FFE0A6"/><stop offset="1" stop-color="#E4AE6A"/></linearGradient><radialGradient id="b${u}" cx=".8" cy=".26" r=".55"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="c${u}"><feGaussianBlur stdDeviation="3.2"/></filter></defs><rect width="300" height="200" fill="url(#a${u})"/><rect width="300" height="200" fill="url(#b${u})"/><g filter="url(#c${u})" opacity=".85"><rect y="130" width="300" height="70" fill="#C8975A"/><circle cx="36" cy="122" r="26" fill="#B4884F"/><circle cx="256" cy="126" r="30" fill="#BD9056"/><circle cx="205" cy="62" r="8" fill="#fff" opacity=".75"/><circle cx="232" cy="92" r="11" fill="#fff" opacity=".6"/><circle cx="268" cy="70" r="7" fill="#fff" opacity=".65"/></g><path d="M68 200c0-38 16-54 38-58h28c22 4 38 20 38 58z" fill="#3A2D27"/><rect x="110" y="118" width="20" height="26" fill="#57402F"/><ellipse cx="120" cy="98" rx="24" ry="29" fill="#6A4C3B"/><path d="M95 96c-1-30 51-34 51 0 0-13-14-22-26-22s-24 9-25 22z" fill="#1E1714"/><path d="M95 92c-5 18-3 38 3 48l4-40zM145 92c5 18 3 38-3 48l-4-40z" fill="#1E1714"/><ellipse cx="111" cy="98" rx="2.6" ry="1.8" fill="#170F0C"/><ellipse cx="129" cy="98" rx="2.6" ry="1.8" fill="#170F0C"/><path d="M100 78c8-10 34-12 44 2" stroke="#FFE9BC" stroke-width="2.2" fill="none"/></svg>`},
 p2:{name:'夜景糊片',exif:{模式:'P',光圈:'F2.8',快门:'1/8',ISO:'800',焦距:'35mm',补偿:'±0.0',防抖:'开',对焦:'AF-S'},
  svg:u=>`<svg class="ph" viewBox="0 0 300 200" role="img" aria-label="夜景糊片示例"><defs><linearGradient id="a${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1330"/><stop offset="1" stop-color="#25335E"/></linearGradient><filter id="b${u}"><feGaussianBlur stdDeviation="1.4 .5"/></filter><filter id="c${u}" x="-40%" width="180%"><feGaussianBlur stdDeviation="8 1"/></filter></defs><rect width="300" height="200" fill="url(#a${u})"/><g filter="url(#b${u})"><rect x="0" y="40" width="70" height="110" fill="#1A2034"/><rect x="74" y="64" width="56" height="86" fill="#20283F"/><rect x="200" y="30" width="100" height="120" fill="#181E31"/><g fill="#FFD27A" opacity=".85"><rect x="10" y="52" width="6" height="8"/><rect x="26" y="52" width="6" height="8"/><rect x="42" y="68" width="6" height="8"/><rect x="84" y="76" width="6" height="8"/><rect x="104" y="92" width="6" height="8"/><rect x="214" y="44" width="6" height="8"/><rect x="238" y="60" width="6" height="8"/><rect x="262" y="44" width="6" height="8"/><rect x="278" y="76" width="6" height="8"/></g><rect x="140" y="70" width="40" height="16" rx="3" fill="#E5484D" opacity=".9"/><rect x="144" y="72" width="40" height="16" rx="3" fill="#E5484D" opacity=".4"/><rect x="0" y="148" width="300" height="52" fill="#151A29"/><g fill="#FFE2A0"><circle cx="40" cy="104" r="5"/><circle cx="160" cy="112" r="5"/><circle cx="262" cy="100" r="5"/></g><g fill="#FFE2A0" opacity=".5"><circle cx="46" cy="101" r="5"/><circle cx="166" cy="109" r="5"/><circle cx="268" cy="97" r="5"/></g><g fill="#FFD27A" opacity=".18"><circle cx="43" cy="103" r="18"/><circle cx="163" cy="111" r="18"/><circle cx="265" cy="99" r="18"/></g><path d="M0 172h300" stroke="#FFD27A" stroke-width="1" opacity=".3"/></g><g filter="url(#c${u})" opacity=".8"><rect x="128" y="120" width="12" height="40" rx="5" fill="#3A4258"/><circle cx="134" cy="114" r="6" fill="#4A5068"/><rect x="176" y="124" width="12" height="38" rx="5" fill="#5A3640"/><circle cx="182" cy="118" r="6" fill="#4A5068"/></g></svg>`},
 p3:{name:'风景前景虚',exif:{模式:'A',光圈:'F2.8',快门:'1/4000',ISO:'100',焦距:'24mm',补偿:'±0.0',对焦区域:'广域',对焦:'AF-S'},
  svg:u=>`<svg class="ph" viewBox="0 0 300 200" role="img" aria-label="风景前景虚示例"><defs><linearGradient id="a${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C8FD6"/><stop offset="1" stop-color="#CFE3F5"/></linearGradient><filter id="b${u}" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="4.5"/></filter></defs><rect width="300" height="200" fill="url(#a${u})"/><path d="M0 112l40-38 26 20 44-50 40 42 30-24 50 44 30-18 40 24v8H0z" fill="#58677A"/><path d="M110 44l14 14-10-2-8 8-6-6zM230 64l10 10-8-1-6 5z" fill="#F4F7FA"/><path d="M0 118l60-22 50 16 70-24 60 20 60-10v20H0z" fill="#3F6B47"/><rect y="124" width="300" height="20" fill="#7FA7C9"/><path d="M0 124h300" stroke="#E8F1F8" stroke-width="1" opacity=".6"/><rect y="140" width="300" height="60" fill="#4E7A3E"/><g filter="url(#b${u})"><rect y="150" width="300" height="50" fill="#5C8C45"/><g fill="#F2C94C"><circle cx="30" cy="170" r="9"/><circle cx="74" cy="182" r="11"/><circle cx="130" cy="168" r="8"/><circle cx="196" cy="184" r="12"/><circle cx="252" cy="172" r="9"/></g><g fill="#E86A92"><circle cx="54" cy="160" r="7"/><circle cx="168" cy="176" r="9"/><circle cx="282" cy="186" r="10"/></g><path d="M10 200l8-40M40 200l4-34M100 200l-6-40M150 200l6-36M220 200l-4-38M270 200l6-40" stroke="#3E6B2E" stroke-width="4"/></g></svg>`}
};
let uidN=0;const uid=()=>'u'+(++uidN);
const exifChips=e=>Object.entries(e).map(([k,v])=>`<span>${k} ${v}</span>`).join('');

/* ---------- AI 对话引擎（脚本回放，模拟流式输出和工具循环） ---------- */
const chat=$('#chat');
function scrollEnd(){chat.scrollTop=chat.scrollHeight}
function msgEl(role){const m=document.createElement('div');m.className='msg '+role;chat.appendChild(m);return m}
const chip=id=>CONTROLS[id]?`<span class="cchip" role="button" tabindex="0" data-cid="${id}">${shortName(id)}</span>`:id;
function tokenize(md){const out=[];let b=false;for(let i=0;i<md.length;){if(md.startsWith('[[',i)){const j=md.indexOf(']]',i);out.push({c:md.slice(i+2,j)});i=j+2;continue}if(md.startsWith('**',i)){b=!b;i+=2;continue}out.push({ch:md[i],b});i++}return out}
function renderToks(t,n){let h='',b=false;for(let k=0;k<n;k++){const x=t[k];if(x.c){if(b){h+='</b>';b=false}h+=chip(x.c);continue}if(x.b!==b){h+=x.b?'<b>':'</b>';b=x.b}h+=x.ch==='\n'?'<br>':esc(x.ch)}if(b)h+='</b>';return h}
const md=s=>{const t=tokenize(s);return renderToks(t,t.length)};
async function typeText(parent,text){const el=document.createElement('div');el.className='ai-txt';parent.appendChild(el);const t=tokenize(text);
  if(AIS.fast){el.innerHTML=renderToks(t,t.length);scrollEnd();return}
  for(let n=0;n<=t.length;n+=3){el.innerHTML=renderToks(t,n)+'<span class="caret"></span>';scrollEnd();await new Promise(r=>setTimeout(r,16))}el.innerHTML=renderToks(t,t.length)}
chat.addEventListener('click',e=>{const c=e.target.closest('.cchip');if(!c)return;const id=c.dataset.cid;
  if(active3d&&!active3d.frozen){Cam.setView(viewFor(id));Cam.highlight([id],shortName(id),'arrow')}else{go('cam');Cam.setView(viewFor(id));Cam.highlight([id],shortName(id),'arrow');openSheet(id)}});
chat.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.cchip')){e.preventDefault();e.target.click()}});
function viewFor(id){if(['btn_menu','btn_c1','btn_c3','btn_ael','btn_afon','btn_fn','joystick','wheel','btn_center','btn_play','btn_c4','lcd','evf','diopter'].includes(id))return 'back';
  if(['mode_dial','mode_switch','dial_rear_r','dial_rear_l','btn_c2','btn_movie','shutter','power','hotshoe'].includes(id))return 'top';
  if(id==='dial_front'||id==='lens_release')return 'front';if(id==='battery_door')return 'bottom';
  if(['card_door','sw_click','sw_zoom_smooth'].includes(id))return 'right';if(['ports','sw_iris_lock','sw_focus_mode'].includes(id))return 'left';return 'lens'}
const rid=n=>{const a='abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<n;i++)s+=a[Math.floor(Math.random()*a.length)];return s};
function toolCard(parent,name,args){const msgs=AIS.proto==='messages',id=msgs?'toolu_01'+rid(18):'call_'+rid(20);
  const el=document.createElement('div');el.className='tool';
  const req=msgs?{type:'tool_use',id,name,input:args}:{type:'function_call',call_id:id,name,arguments:JSON.stringify(args)};
  el.innerHTML=`<button class="tool-h" type="button" aria-expanded="false"><span class="tn">${name}</span><span class="tid">${msgs?'tool_use':'function_call'} · ${id}</span><span class="st run">执行中</span></button><div class="tool-b" hidden><span class="k">// 模型发起调用</span>\n${esc(JSON.stringify(req,null,1))}</div>`;
  parent.appendChild(el);const h=el.firstChild,b=el.lastChild;h.onclick=()=>{b.hidden=!b.hidden;h.setAttribute('aria-expanded',String(!b.hidden))};scrollEnd();
  return {done(result){const s=el.querySelector('.st');s.className='st ok';s.textContent='完成';
    const res=msgs?{type:'tool_result',tool_use_id:id,content:result}:{type:'function_call_output',call_id:id,output:result};b.insertAdjacentText('beforeend','\n\n// App 执行后回传\n'+JSON.stringify(res,null,1))}}}
let active3d=null;
function freezeActive(){if(!active3d||active3d.frozen)return;const url=Cam.snapshot();if(url){const img=new Image();img.src=url;img.alt='3D 相机截图';active3d.wrap.prepend(img)}active3d.frozen=true;active3d=null}
function new3d(parent){freezeActive();const g=document.createElement('div');g.className='tgroup';const strip=document.createElement('div');strip.className='tgroup';const w=document.createElement('div');w.className='c3d';
  w.innerHTML='<span class="c3d-tag">3D 相机 · 由 AI 工具调用控制</span><button class="pill c3d-open" type="button">在相机页打开</button>';
  w.querySelector('.c3d-open').onclick=()=>go('cam');g.append(strip,w);parent.appendChild(g);Cam.mount(w);active3d={wrap:w,strip,frozen:false};scrollEnd();return active3d}
const THREE_D=['set_camera_view','highlight_control','demonstrate_control','set_virtual_settings'];
function screenNow(){const r=expo();return {mode:MODES[st.modeI],aperture:fmtN(r.N),shutter:fmtT(r.t),iso:(r.auto?'AUTO ':'')+r.iso,ev:fmtEv(effEv()),focus_mode:effFm(),focus_area:areaKeys[effArea()],area:effArea()}}
function applySettings(a){if(a.scene_ev!=null)st.E=a.scene_ev;if(a.mode)st.modeI=MODES.indexOf(a.mode);if(a.aperture){st.av=APS[snap(APS,a.aperture)];st.apRing=7}
  if(a.shutter){const i=TV3L.indexOf(a.shutter);st.tvI=i>=0?i:st.tvI}if(a.iso!=null)st.isoI=a.iso==='AUTO'?-1:snap(ISO3,a.iso);if(a.ev!=null)st.ev=a.ev;
  if(a.focus_mode){if(st.msw==='照片')st.fm=a.focus_mode;else if(['AF-C','MF'].includes(a.focus_mode))st.movieFm=a.focus_mode}
  const area=areaNames[a.focus_area]||(a.area==='点'?'点: M':a.area);
  if(areaKeys[area])setFocusArea(area);
  if(a.wb)st.wb=({auto:'AWB',daylight:'日光',cloudy:'阴天',incandescent:'白炽灯',fluorescent:'荧光灯'})[a.wb]||a.wb;
  if(a.focal)st.focal=a.focal;if(a.drive)st.drive=({single:'单张',continuous:'连拍',self_2s:'自拍 2s',self_10s:'自拍 10s'})[a.drive]||a.drive;
  st.picker=null;st.overlay=null;st.power=true;chg('av');Cam.sync();Cam.redraw();onCamState()}
function controlPosition(id){
  switch(id){
    case 'mode_dial':return MODES[st.modeI];
    case 'mode_switch':return st.msw;
    case 'power':return st.power?'ON':'OFF';
    case 'ring_zoom':return String(st.focal);
    case 'ring_aperture':return AP_RING[st.apRing];
    case 'sw_iris_lock':return st.irisLock?'锁定':'松开';
    case 'sw_click':return st.click?'ON':'OFF';
    case 'sw_focus_mode':return st.lensAF?'AF':'MF';
    case 'sw_zoom_smooth':return st.zoomSmooth;
  }
}
function lookupManual(query){return {hits:search(MANUAL,query).map(({title,where,text})=>({title,where,text}))}}
async function execTool(name,a){switch(name){
  case 'set_camera_view':Cam.setView(a.view);await sleep(650);return {ok:true,view:a.view};
  case 'highlight_control':Cam.highlight(a.control_ids,a.note,a.style);await sleep(700);return {ok:true,highlighted:a.control_ids};
  case 'demonstrate_control':{const before=screenNow(),op=a.action==='press'?(['up','down','left','right'].includes(a.direction)?a.direction:'click'):a.direction==='left'?'minus':'plus';
    if(a.target!=null){
      const id=a.control_id,target=id==='sw_iris_lock'?({LOCK:'锁定',UNLOCK:'松开'}[a.target]||a.target):a.target;
      const positions=CONTROLS[id]?.positions;
      if(!positions?.includes(target))return {ok:false,error:'部件没有这个档位'};
      for(let i=0;i<positions.length&&controlPosition(id)!==target;i++){
        const pos=controlPosition(id);
        const dir=positions.indexOf(target)<positions.indexOf(pos)?'minus':'plus';
        act(id,dir);if(controlPosition(id)===pos)break;
      }
      if(controlPosition(id)!==target)return {ok:false,error:'当前状态无法切到目标档位'};
    }else for(let i=0;i<(a.steps||1);i++){act(a.control_id,op);await sleep(320)}
    const after=screenNow(),diff={};for(const k in after)if(after[k]!==before[k])diff[k]=before[k]+' → '+after[k];return {ok:true,changed:diff}}
  case 'set_virtual_settings':applySettings(a);await sleep(500);return {ok:true,screen:screenNow()};
  case 'lookup_manual':return lookupManual(a.query);
  case 'get_camera_config':return {C1:'白平衡模式',C2:'对焦区域',C3:'对焦模式',C4:'触摸操作选择',AEL:'AE锁定保持',AF_ON:'AF开启',lens_focus_hold:'对焦保持',playback:{C3:'保护',C4:'删除',AF_ON:'放大倍率'}};
  default:return {ok:true}}}
function photoCard(parent,pid,regions){const p=PHOTOS[pid],u=uid();const el=document.createElement('div');el.className='ph-card';
  el.innerHTML=p.svg(u)+regions.map((r,i)=>`<div class="box ${r.kind}" style="left:${r.bbox[0]*100}%;top:${r.bbox[1]*100}%;width:${r.bbox[2]*100}%;height:${r.bbox[3]*100}%;animation-delay:${i*.18}s"><i>${i+1}</i></div>`).join('');
  const lg=document.createElement('div');lg.className='legend';lg.innerHTML=regions.map((r,i)=>`<span><i style="background:var(--app-${r.kind==='good'?'good':'accent'})">${i+1}</i>${esc(r.label)}</span>`).join('');
  const w=document.createElement('div');w.className='tgroup';w.append(el,lg);parent.appendChild(w);scrollEnd()}
function cmpCard(parent,a){const keys=[['mode','模式'],['aperture','光圈'],['shutter','快门'],['iso','ISO'],['ev','补偿']].filter(([k])=>a.before[k]!=null||a.after[k]!=null);
  const el=document.createElement('div');el.className='cmp';
  el.innerHTML=`<table><thead><tr><th></th>${keys.map(k=>`<th>${k[1]}</th>`).join('')}</tr></thead><tbody><tr><th>调整前</th>${keys.map(([k])=>`<td>${a.before[k]??'—'}</td>`).join('')}</tr><tr><th>调整后</th>${keys.map(([k])=>`<td class="${a.before[k]!==a.after[k]?'d':''}">${a.after[k]??'—'}</td>`).join('')}</tr></tbody></table><div class="ex">${esc(a.explanation)}</div>`;
  parent.appendChild(el);scrollEnd()}
function taskCard(parent,a){const el=document.createElement('div');el.className='ptask';el.innerHTML=`<b>已加入今日任务：${esc(a.title)}</b><ol>${a.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><span class="ok">验收标准：${esc(a.success_criteria)}</span>`;parent.appendChild(el);addTask(a.title,a.steps);scrollEnd()}
function lessonCard(parent,a){const el=document.createElement('div');el.className='ptask';const L=LESSONS.find(l=>l[0]===a.lesson_id);el.innerHTML=`<b>推荐课时：${a.lesson_id} ${L?L[1]:''}</b><span>${esc(a.reason)}</span><div style="margin-top:8px"><button class="btn pri" type="button">去看看</button></div>`;el.querySelector('button').onclick=()=>lessonGo(a.lesson_id);parent.appendChild(el);scrollEnd()}
function reviewCard(parent,r){const el=document.createElement('div');el.className='review';const tot=Math.round(r.scores.reduce((s,x)=>s+x[1],0)/r.scores.length*20);
  el.innerHTML=`<div class="rv-h"><b>复盘卡 · ${esc(r.title)}</b><span class="tnum">${tot}</span></div>
  <div class="scores">${r.scores.map(([n,v])=>`<div class="sc"><div class="pips ${v<=2?'bad':v===3?'low':''}">${[1,2,3,4,5].map(i=>`<i class="${i<=v?'on':''}"></i>`).join('')}</div>${n}</div>`).join('')}</div>
  <div class="rv-sec f"><h4>要改 · 怎么改</h4><ul>${r.fix.map(x=>`<li>${md(x)}</li>`).join('')}</ul></div>
  <div class="rv-sec g"><h4>做得好 · 怎么保持</h4><ul>${r.good.map(x=>`<li>${md(x)}</li>`).join('')}</ul></div>`;parent.appendChild(el);scrollEnd()}
function usageLine(parent,u){const cost=((u.i-u.c)*4+u.c*.4+u.o*20)/1e6,el=document.createElement('div');el.className='usage';
  el.textContent=AIS.proto==='messages'?`usage · input_tokens ${u.i.toLocaleString()}（cache_read ${u.c.toLocaleString()}）· output_tokens ${u.o.toLocaleString()} · stop_reason end_turn · ≈ $${cost.toFixed(3)} · 演示数据`
    :`usage · input_tokens ${u.i.toLocaleString()}（cached ${u.c.toLocaleString()}）· output_tokens ${u.o.toLocaleString()}（reasoning ${Math.round(u.o*.35).toLocaleString()}）· status completed · ≈ $${cost.toFixed(3)} · 演示数据`;parent.appendChild(el)}
async function runSteps(steps){const m=msgEl('ai');let group=null;
  for(const s of steps){
    if(s.k==='think'){const el=document.createElement('div');el.className='think';el.innerHTML='<span class="dots">思考中</span>';m.appendChild(el);scrollEnd();await sleep(1100);
      el.innerHTML=`<button type="button" aria-expanded="false">已思考 ${s.sec||3} 秒 · ${esc(s.sum)} ▸</button><div class="tbody" hidden>${esc(s.text)}</div>`;const b=el.firstChild;b.onclick=()=>{const bd=el.lastChild;bd.hidden=!bd.hidden;b.setAttribute('aria-expanded',String(!bd.hidden))};group=null}
    else if(s.k==='text'){await typeText(m,s.md);group=null;await sleep(150)}
    else if(s.k==='tool'){const is3d=THREE_D.includes(s.name);if(is3d&&(!group||active3d!==group))group=new3d(m);if(!is3d)group=null;
      const card=toolCard(is3d?group.strip:m,s.name,Object.fromEntries(Object.entries(s.args).filter(([k])=>k[0]!=='_')));await sleep(350);const res=await execTool(s.name,s.args);
      if(s.name==='annotate_photo')photoCard(m,s.pid,s.args.regions);if(s.name==='compare_exposure')cmpCard(m,s.args);if(s.name==='add_practice_task')taskCard(m,s.args);if(s.name==='open_lesson')lessonCard(m,s.args);
      card.done(JSON.stringify(res));await sleep(250)}
    else if(s.k==='review'){reviewCard(m,s);group=null}
    else if(s.k==='usage'){usageLine(m,s)}
    else if(s.k==='follow'){const el=document.createElement('div');el.className='follow';el.innerHTML=s.items.map((t,i)=>`<button class="pill" type="button" data-i="${i}">${esc(t[0])}</button>`).join('');m.appendChild(el);el.querySelectorAll('button').forEach(b=>b.onclick=()=>{el.remove();const it=s.items[+b.dataset.i];userText(it[0]);run(it[1])})}
    scrollEnd()}}
function userText(t){const m=msgEl('user');m.innerHTML=`<div class="bub">${esc(t)}</div>`;scrollEnd()}
function userPhoto(pid,intent){const p=PHOTOS[pid],m=msgEl('user'),gps=$('#swGps').getAttribute('aria-checked')==='true';
  m.innerHTML=`<div class="u-photo">${p.svg(uid())}</div><div class="exif">${exifChips(p.exif)}${gps?'<span class="gps">已移除 GPS</span>':''}</div><div class="bub">${esc(intent)}</div>`;scrollEnd()}
async function run(steps){if(AIS.busy){toast('等这一轮回答完');return}AIS.busy=true;try{await runSteps(typeof steps==='string'?SCRIPTS[steps]:steps)}finally{AIS.busy=false;scrollEnd()}}
const TH=(sum,text,sec)=>({k:'think',sum,text,sec}),TX=md=>({k:'text',md}),TL=(name,args,pid)=>({k:'tool',name,args,pid});

const SCRIPTS={
 p1:[TH('逆光，脸欠曝约 1.5 档；对焦准确','照片：逆光人像。EXIF：A 档，F2.8，1/2000 秒，ISO 100，50mm，多重测光，曝光补偿 0，AF-C + 眼部识别。\n直方图：暗部堆积约 38%，高光溢出约 6%（天空）。\n对焦点裁切：左眼睫毛清晰，没有手抖。\n结论：问题在曝光，不在对焦。多重测光被明亮的天空拉高了，相机以为够亮，人脸欠曝约 1.5 档。',4),
  TX('这张最大的问题是**脸欠曝约 1.5 档**。人像里脸看不清，照片就立不住。对焦和虚化是对的，先把问题说清楚。'),
  TL('annotate_photo',{regions:[{bbox:[.33,.43,.14,.1],label:'眼睛清晰，眼部对焦成功',kind:'good'},{bbox:[.6,.18,.38,.52],label:'F2.8 背景虚化干净',kind:'good'},{bbox:[.29,.33,.22,.38],label:'脸部欠曝约 1.5 档',kind:'fix'}]},'p1'),
  TX('**为什么暗**：多重测光照顾整个画面，背后的天空很亮，把测光结果拉高了。EXIF 里曝光补偿是 0，相机没有替你提亮人脸。逆光拍人，这一步不能省。\n**怎么改**：用 [[dial_rear_r]] 加 **+1.3 档**曝光补偿，解锁后看屏幕调到 +1.3。我在你的相机上演示一下：'),
  TL('set_virtual_settings',{mode:'A',aperture:2.8,iso:'AUTO',ev:0,focal:50,scene_ev:14}),
  TL('set_camera_view',{view:'top'}),
  TL('highlight_control',{control_ids:['dial_rear_r'],note:'调到 +1.3',style:'arrow'}),
  TL('set_virtual_settings',{ev:1.3}),
  TL('compare_exposure',{before:{mode:'A',aperture:'F2.8',shutter:'1/2000',iso:'100',ev:'±0.0'},after:{mode:'A',aperture:'F2.8',shutter:'1/800',iso:'100',ev:'+1.3'},explanation:'A 档下光圈不变，相机把快门从 1/2000 放慢到 1/800，多进 1.3 档光，脸会亮起来；代价是天空会更白。'}),
  TX('另一个办法：把对焦框对准脸，按住 [[btn_ael]] 锁定曝光，再重新构图。这样相机按脸的亮度来曝光。'),
  TL('set_camera_view',{view:'back'}),
  TL('highlight_control',{control_ids:['btn_ael'],note:'对着脸按住，锁定曝光',style:'pulse'}),
  TX('**做对的三点**：眼部对焦准确；F2.8 背景虚化干净；人放在左侧三分线上。下次照做。'),
  TL('add_practice_task',{title:'逆光人像：曝光补偿 +1.3',steps:['A 档 F2.8，人背对太阳','后拨盘 R 解锁，调到 +1.3','拍 5 张，回放看脸部亮度','再用 AEL 锁定的方法拍 5 张对比'],success_criteria:'脸部亮度正常，眼睛有神'}),
  {k:'review',title:'逆光人像',scores:[['曝光',2],['对焦',5],['清晰度',5],['构图',4],['光线',3]],
   good:['**眼部对焦准确** → 继续用 AF-C + 眼部识别，[[btn_c3]] 可以快速切换对焦模式','**背景虚化干净** → 人像继续用 F2.8–F4，人和背景拉开距离','**三分法构图** → 保持人物在左右三分线上'],
   fix:['**脸欠曝约 1.5 档** → 逆光时先加曝光补偿 +1 到 +1.7（[[dial_rear_r]] 调到正值）','**或者锁定脸的曝光** → 对着脸按 [[btn_ael]]，再构图']},
  {k:'usage',i:9412,c:6108,o:2286},
  {k:'follow',items:[['不想让天空过曝，有别的办法吗？','p1f']]}],
 p1f:[TH('亮度差太大，给 4 个替代方案','逆光时脸和天空的亮度差超出了一次曝光能装下的范围。替代方案：换角度、补光（反光板/闪光灯）、DRO、RAW 后期。动态范围优化的入口取自本机帮助指南。',2),
  TL('lookup_manual',{query:'DRO 动态范围优化'}),
  TX('可以。逆光时脸和天空的亮度差太大，一次曝光装不下。按推荐顺序：\n• **换个方向**：让人侧对太阳，光从侧后方来，亮度差会小很多。\n• **补光**：用白色反光板，或者在 [[hotshoe]] 上装闪光灯，把脸提亮，天空保持原样。\n• **开 DRO**：在 [[btn_menu]] 里找到「动态范围优化」，选「动态范围优化: 自动」，相机会调节明暗层次。具体路径见上方知识库结果。\n• **拍 RAW 后期**：欠曝 1 档左右的脸，在 RAW 里拉回来问题不大。'),
  TL('get_camera_config',{}),
  TL('set_camera_view',{view:'top'}),
  TL('highlight_control',{control_ids:['hotshoe'],note:'闪光灯装在这里',style:'arrow'}),
  TL('set_camera_view',{view:'back'}),
  TL('highlight_control',{control_ids:['btn_menu'],note:'MENU → 动态范围优化',style:'pulse'}),
  TL('demonstrate_control',{control_id:'btn_menu',action:'press',direction:'none',steps:1}),
  TX('用补光或 DRO 时，把 [[dial_rear_r]] 转回 0 再拍，不然天空还是会白。'),
  {k:'usage',i:11873,c:9760,o:842}],
 p2:[TH('快门 1/8 太慢，手抖 + 人物拖影','EXIF：P 档，1/8 秒，F2.8，ISO 800（手动固定），35mm，防抖开。\n路灯有方向一致的双影 → 机身晃动；行人拖影更长 → 主体运动。\n曝光基本正常，中间调完整。\n根因：ISO 被固定在 800，P 档只能放慢快门来保证亮度。',4),
  TX('这张**糊了，不能用**：路灯有双影，行人拖影，放大后没有一处是清楚的。亮度和色彩是对的，所以只需要改快门。'),
  TL('annotate_photo',{regions:[{bbox:[.04,.42,.94,.2],label:'路灯出现双影：机身晃动',kind:'fix'},{bbox:[.38,.52,.3,.32],label:'行人拖影：快门太慢',kind:'fix'},{bbox:[.66,.12,.32,.3],label:'夜景亮度和色彩合适',kind:'good'}]},'p2'),
  TX('**为什么糊**：快门是 **1/8 秒**。35mm 手持，即使有防抖，1/8 秒也很难拿稳；行人在这段时间里走了好几厘米，所以也拖影了。\n**根本原因**：你把 ISO 固定在了 800，P 档为了亮度只能放慢快门。\n**怎么改**：转到 **S 档**，快门设为 **1/60**，ISO 改回 **AUTO**，让相机自动提高 ISO。'),
  TL('set_virtual_settings',{mode:'P',iso:800,focal:35,scene_ev:3}),
  TL('set_camera_view',{view:'top'}),
  TL('highlight_control',{control_ids:['mode_dial'],note:'转到 S',style:'arrow'}),
  TL('demonstrate_control',{control_id:'mode_dial',action:'rotate',direction:'right',steps:2}),
  TL('set_virtual_settings',{shutter:'1/8'}),
  TL('highlight_control',{control_ids:['dial_rear_l'],note:'调到 1/60 秒',style:'arrow'}),
  TL('set_virtual_settings',{shutter:'1/60'}),
  TL('set_camera_view',{view:'back'}),
  TL('highlight_control',{control_ids:['wheel'],note:'按右侧 → ISO 选 AUTO',style:'pulse'}),
  TL('set_virtual_settings',{iso:'AUTO'}),
  TL('compare_exposure',{before:{mode:'P',aperture:'F2.8',shutter:'1/8',iso:'800'},after:{mode:'S',aperture:'F2.8',shutter:'1/60',iso:'6400'},explanation:'快门快了 3 档，相机把 ISO 提高 3 档补回亮度。ISO 6400 会有些噪点，但比糊片好得多。'}),
  TL('add_practice_task',{title:'夜景手持：S 档 1/60',steps:['模式转盘转到 S','后拨盘 L 把快门设为 1/60','ISO 设为 AUTO','拍 10 张街景，回放放大检查路灯'],success_criteria:'10 张里至少 8 张路灯没有双影'}),
  {k:'review',title:'夜景街头',scores:[['曝光',4],['对焦',3],['清晰度',1],['构图',4],['光线',4]],
   good:['**夜景亮度合适，高光没有大面积溢出** → 夜景继续用直方图检查，[[wheel]] 按上方切到直方图','**用道路做引导线** → 保持低机位，让路面通向画面深处'],
   fix:['**1/8 秒手抖** → S 档 1/60 + ISO AUTO（[[mode_dial]] 转到 S，[[dial_rear_l]] 调快门）','**行人拖影** → 想拍清楚走动的人，快门至少 1/125']},
  {k:'usage',i:9655,c:6108,o:2410},
  {k:'follow',items:[['如果我就想拍出人流的拖影效果呢？','p2f']]}],
 p2f:[TH('相机不动、人在动：三脚架 + 慢门','想要人流拖影：相机必须稳定，快门 0.5–2 秒，ISO 100。夜景 EV 约 3，F2.8 ISO 100 时约 1 秒正好。用 2 秒自拍避免按快门的抖动。',2),
  TX('可以，这是很好看的夜景玩法。关键是**相机不动、人在动**：\n• 相机放在三脚架或稳定的栏杆上\n• S 档，快门 **1 秒左右**（0.5–2 秒都可以试，越慢拖影越长）\n• ISO 设为 **100**，画面最干净\n• 用 **2 秒自拍**，避免按快门时的抖动：按 [[wheel]] 左侧打开「拍摄模式」，选「自拍定时(单张)」并设为 2 秒\n• 上了三脚架可以把防抖关掉'),
  TL('set_camera_view',{view:'back'}),
  TL('highlight_control',{control_ids:['wheel'],note:'按左侧 → 自拍 2 秒',style:'arrow'}),
  TL('set_virtual_settings',{mode:'S',shutter:'1/60',iso:'AUTO',drive:'single',scene_ev:3}),
  TL('demonstrate_control',{control_id:'wheel',action:'press',direction:'left',steps:1}),
  TL('set_virtual_settings',{shutter:'1"',iso:100,drive:'self_2s'}),
  TL('compare_exposure',{before:{mode:'S',aperture:'F2.8',shutter:'1/60',iso:'6400'},after:{mode:'S',aperture:'F2.8',shutter:'1"',iso:'100'},explanation:'快门慢了约 6 档，ISO 降了 6 档，亮度不变；行人变成光影，路灯和建筑保持清晰。'}),
  {k:'usage',i:12340,c:9902,o:910}],
 p3:[TH('F2.8 景深太浅，前景虚；曝光很好','EXIF：A 档，F2.8，1/4000 秒，ISO 100，24mm，对焦区域广域。\n对焦点落在远山上，远处锐利。前景的花大约 1.5 米，在 F2.8 的景深之外。\n超焦距：24mm F2.8 约 6.9 米，F8 约 2.4 米（弥散圆 0.03mm）。',4),
  TX('这张的问题是**前景虚了**，画面下方四分之一是糊的，风景照里很扎眼。曝光、远山的锐度和地平线都没问题。'),
  TL('annotate_photo',{regions:[{bbox:[.12,.18,.76,.4],label:'远山锐利，曝光准确',kind:'good'},{bbox:[0,.6,1,.06],label:'地平线水平',kind:'good'},{bbox:[0,.74,1,.26],label:'前景的花虚了',kind:'fix'}]},'p3'),
  TX('**为什么虚**：风景照要从前景到远山都清楚。F2.8 的景深很浅，而且「广域」模式下相机自动对焦到了远山，前景落在景深外面。\n**怎么改**，两步：\n1. 用 [[dial_front]] 看屏幕把光圈收到 **F8**\n2. 按 [[btn_c2]] 把对焦区域换成「点: M」，再用 [[joystick]] 把对焦框往下移，放在前景和远山之间'),
  TL('set_virtual_settings',{mode:'A',aperture:2.8,iso:'AUTO',ev:0,focal:24,focus_area:'wide',scene_ev:15}),
  TL('set_camera_view',{view:'front'}),
  TL('highlight_control',{control_ids:['dial_front'],note:'将光圈调到 F8',style:'arrow'}),
  TL('set_virtual_settings',{aperture:8}),
  TL('set_camera_view',{view:'top'}),
  TL('highlight_control',{control_ids:['btn_c2'],note:'选择点: M',style:'pulse'}),
  TL('demonstrate_control',{control_id:'btn_c2',action:'press',direction:'none',steps:1}),
  TL('set_virtual_settings',{focus_area:'spot'}),
  TL('set_camera_view',{view:'back'}),
  TL('highlight_control',{control_ids:['joystick'],note:'往下推 2 下',style:'arrow'}),
  TL('demonstrate_control',{control_id:'joystick',action:'press',direction:'down',steps:2}),
  TL('compare_exposure',{before:{mode:'A',aperture:'F2.8',shutter:'1/4000',iso:'100'},after:{mode:'A',aperture:'F8.0',shutter:'1/500',iso:'100'},explanation:'光圈收小 3 档，A 档自动把快门放慢 3 档，亮度不变。F2.8 对焦远山时约 7 米以内都不清楚；F8 对焦在 2.4 米左右，从约 1.2 米到无穷远都清楚。'}),
  TL('add_practice_task',{title:'风景全清晰：F8 + 点对焦',steps:['A 档，前拨盘设 F8','C2 切到「点: M」','对焦框放在前景和远景之间','回放放大检查前景和远山'],success_criteria:'前景和远山放大后都清晰'}),
  {k:'review',title:'湖边风景',scores:[['曝光',5],['对焦',3],['清晰度',3],['构图',4],['光线',4]],
   good:['**曝光准确，天空有层次** → 继续看直方图，别让右侧顶到头（[[wheel]] 按上方切到直方图）','**地平线水平** → DISP 切到水平仪，线变绿再拍'],
   fix:['**前景虚** → 风景用 F8–F11（[[dial_front]]），对焦区域用「点: M」（[[btn_c2]]），对焦框放在前景和远景之间（[[joystick]]）']},
  {k:'usage',i:9530,c:6108,o:2352},
  {k:'follow',items:[['F22 是不是更清楚？','p3f']]}],
 p3f:[TH('不会，衍射会让画面变软','全画幅上 F8–F11 通常最锐。F16 之后衍射开始明显，F22 整体变软。F22 比 F8 少 3 档光，快门要慢 3 档。',2),
  TX('不是。光圈收得太小会出现**衍射**，整张画面反而变软。全画幅一般 **F8–F11** 最锐利；F16 以后能看出变软，F22 更明显。\n而且 F22 比 F8 少进 3 档光，快门要慢 3 档，有风时树叶和花也会糊。需要更大景深时，先用 F11，再配合对焦位置，不要直接收到 F22。'),
  TL('compare_exposure',{before:{mode:'A',aperture:'F8.0',shutter:'1/500',iso:'100'},after:{mode:'A',aperture:'F22',shutter:'1/60',iso:'100'},explanation:'光圈收小 3 档，快门慢 3 档。景深更大，但衍射让细节变软。'}),
  TL('set_virtual_settings',{aperture:11}),
  TL('highlight_control',{control_ids:['dial_front'],note:'风景用 F8–F11',style:'pulse'}),
  TL('open_lesson',{lesson_id:'L3',reason:'在曝光实验室里拖光圈，看景深和快门怎么一起变'}),
  {k:'usage',i:12010,c:9902,o:760}]
};
function runReview(pid){if(AIS.busy){toast('等这一轮回答完');return}$('#picker').hidden=true;
  const intent={p1:'下午在公园拍的人像，想要背景虚化，为什么脸这么黑？',p2:'晚上在街上随手拍的，回家一看全糊了',p3:'想拍湖边风景，为什么前面的花不清楚？'}[pid];
  userPhoto(pid,intent);run(SCRIPTS[pid])}
function askControl(id){if(AIS.busy){toast('等这一轮回答完');return}const c=CONTROLS[id],dial=['dial_front','dial_rear_l','dial_rear_r','wheel','mode_dial'].includes(id),btn=id.startsWith('btn_');
  userText(`「${shortName(id)}」是干什么的？新手该怎么用？`);
  run([TH('解释部件，并在 3D 上指出','用户从 3D 相机页问部件 '+id+'。读部件字典和用户的 C 键配置，说明位置、默认功能、新手建议，并在 3D 上演示。',2),
    TL('set_camera_view',{view:viewFor(id)}),TL('highlight_control',{control_ids:[id],note:shortName(id),style:'arrow'}),
    ...(dial||btn?[TL('demonstrate_control',{control_id:id,action:dial?'rotate':'press',direction:dial?'right':'none',steps:1})]:[]),
    TX(`**${c.n}**在${c.p}。\n**默认功能**：${c.f}。\n**新手建议**：${c.t}。${stateOf(id)?'\n你的虚拟相机现在：'+stateOf(id)+'。':''}\n想看它在实际照片里怎么用，可以发一张照片给我复盘。`),
    {k:'usage',i:7120,c:6108,o:388}])}
function freeText(q){const K=[[/光圈|虚化|景深|F\d/,'dial_front','光圈','**光圈**是镜头里控制进光孔大小的叶片。F 值越小，孔越大：进光多、背景越虚。这支 24-70 GM II 最大是 F2.8。\nA 档下转 [[dial_front]] 调光圈。拍人像用 F2.8–F4，拍风景用 F8–F11。'],
  [/快门|糊|拖影|抖/,'dial_rear_l','快门','**快门速度**是传感器曝光的时间。越快越能凝固动作，越慢越容易手抖和拖影。手持时不要慢于「1/焦距」秒，比如 50mm 用 1/50 以上。\nS 档或 M 档下转 [[dial_rear_l]] 调快门。'],
  [/ISO|噪点|感光/i,'wheel','ISO','**ISO** 是传感器的放大倍数。光线不够时提高 ISO 能让画面变亮，代价是噪点变多。白天用 100–400，室内 800–3200，夜景可以到 6400。\n按 [[wheel]] 右侧改 ISO，新手可以先用 AUTO。'],
  [/对焦|焦点|不清楚|AF/i,'btn_c3','对焦','**对焦模式**：静止的东西用 AF-S，会动的人和动物用 AF-C。按 [[btn_c3]] 切换。\n**对焦区域**：按 [[btn_c2]] 切换，想精确指定位置时用「点: M」，再用 [[joystick]] 移动对焦框。'],
  [/曝光补偿|太亮|太暗|过曝|欠曝|黑/,'dial_rear_r','曝光补偿','照片整体太暗就加曝光补偿，太亮就减。转 [[dial_rear_r]]，默认每格 1/3 档，正补偿让画面变亮。屏幕下方的数值会跟着变。'],
  [/白平衡|偏黄|偏蓝|颜色|色/,'btn_c1','白平衡','照片颜色偏黄或偏蓝，是白平衡没对上。按 [[btn_c1]] 切换白平衡：室内灯光选「白炽灯」，阴天选「阴天」。不确定就用 AWB。']];
  const hit=K.find(k=>k[0].test(q));
  if(!hit||/菜单|出厂|默认|充电|供电|Fn|C[1-4]|识别目标|对焦模式|对焦区域|最近对焦|CLICK|ISO AUTO/i.test(q)){
    const result=lookupManual(q).hits[0];
    if(result)return [TL('lookup_manual',{query:q}),TX('**'+result.title+'**\n'+result.text+(result.where?'\n\n'+result.where:''))];
    return [TL('lookup_manual',{query:q}),TX('这次没有查到相关条目。可以换用机身上的菜单名称或按钮标记再查。')];
  }
  return [TH('解释'+hit[2]+'，并指出对应的控件','用户问到'+hit[2]+'。用通俗语言解释，再在 3D 相机上指出对应的控件。',2),TX(hit[3]),TL('set_camera_view',{view:viewFor(hit[1])}),TL('highlight_control',{control_ids:[hit[1]],note:shortName(hit[1]),style:'arrow'}),
    ...(hit[2]==='光圈'||hit[2]==='快门'?[TL('open_lesson',{lesson_id:'L3',reason:'去曝光实验室亲手拖一下'+hit[2]+'，看画面怎么变'})]:[]),{k:'usage',i:7340,c:6108,o:520}]}
function welcome(){const m=msgEl('ai');m.innerHTML=`<div class="ai-txt">你好，我是你的 α7 V 教练。拍完照片发给我，我会看 EXIF 和画面，先直说最影响成片的问题，再讲做对的地方，并在 3D 相机上指给你看该按哪个键。<br>先选一张示例照片试试：</div>${samplesHtml()}`;bindSamples(m)}
const samplesHtml=()=>`<div class="samples">${Object.entries(PHOTOS).map(([k,p])=>`<button class="sample" type="button" data-p="${k}">${p.svg(uid())}<span>${p.name}</span><small>${p.exif.光圈} · ${p.exif.快门} · ISO ${p.exif.ISO}</small></button>`).join('')}</div>`;
function bindSamples(el){el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>runReview(b.dataset.p))}
$('#btnAttach').onclick=()=>{const p=$('#picker');p.hidden=!p.hidden;if(!p.hidden){p.innerHTML='<div class="chips" style="margin-bottom:8px"><button class="pill on" type="button" data-src="album">手机相册</button><button class="pill" type="button" data-src="usb">USB-C 直连 · V1</button><button class="pill" type="button" data-src="wifi">Wi-Fi 直连 · V1</button></div><div style="font-size:12px;color:var(--app-ink-3);margin-bottom:8px">原型里是 3 张示例照片</div>'+samplesHtml();bindSamples(p);
    p.querySelectorAll('[data-src]').forEach(b=>b.onclick=()=>toast({album:'从手机相册选图',usb:'V1：用 USB-C 线连相机，直接读取相机里的照片',wifi:'V1：Wi-Fi 直连相机导入，先做技术验证'}[b.dataset.src]))}};
$('#composer').onsubmit=e=>{e.preventDefault();const i=$('#chatInput'),q=i.value.trim();if(!q)return;if(AIS.busy){toast('等这一轮回答完');return}i.value='';userText(q);run(freeText(q))};
$('#btnFast').onclick=e=>{AIS.fast=!AIS.fast;e.currentTarget.setAttribute('aria-pressed',String(AIS.fast))};

/* ---------- 设置 ---------- */
function modelChip(){$('#modelChip').textContent=`${$('#inModel').value||'未设置模型'} · ${AIS.proto==='messages'?'Messages API':'Responses API'}`}
function setProto(p){AIS.proto=p;$$('#segProto button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.p===p)));const base=$('#inBase');if(/api\.(anthropic|openai)\.com/.test(base.value))base.value=p==='messages'?'https://api.anthropic.com':'https://api.openai.com';modelChip();toast(p==='messages'?'已切换到 Anthropic Messages API':'已切换到 OpenAI Responses API')}
$$('#segProto button').forEach(b=>b.onclick=()=>setProto(b.dataset.p));
$$('#segEffort button').forEach(b=>b.onclick=()=>{AIS.effort=b.dataset.e;$$('#segEffort button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
$('#inModel').oninput=modelChip;
$$('.sw').forEach(s=>s.onclick=()=>s.setAttribute('aria-checked',String(s.getAttribute('aria-checked')!=='true')));
$('#btnTest').onclick=()=>{const r=$('#testRes'),msgs=AIS.proto==='messages',key=$('#inKey').value;r.hidden=false;r.textContent='连接中…';
  setTimeout(()=>{r.textContent=`POST ${$('#inBase').value.replace(/\/$/,'')}${msgs?'/v1/messages':'/v1/responses'}\n${msgs?'x-api-key':'Authorization: Bearer'} ****${key.slice(-4)}\n200 OK · 842 ms · 图片输入 ✓ · 工具调用 ✓ · ${msgs?'output_config.effort':'reasoning.effort'}=${AIS.effort}\n（演示数据，原型不联网）`},700)};

/* ---------- 启动 ---------- */
renderTasks();renderReadout();modelChip();welcome();labRender();go('home');

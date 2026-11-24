/* 部件详情和菜单数据由 build.sh 从 docs/spec 嵌入，双击 HTML 也能使用。 */
const shortName=id=>CONTROLS[id].n.replace(/（.*）/,'');

const lg=Math.log2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MODES=['AUTO','P','A','S','M','1','2','3'];
const MODE_NAMES={AUTO:'智能自动',P:'程序自动',A:'光圈优先',S:'快门优先',M:'手动曝光','1':'记忆 1','2':'记忆 2','3':'记忆 3'};
const TV3L=['30"','25"','20"','15"','13"','10"','8"','6"','5"','4"','3.2"','2.5"','2"','1.6"','1.3"','1"','0.8"','0.6"','0.5"','0.4"','1/3','1/4','1/5','1/6','1/8','1/10','1/13','1/15','1/20','1/25','1/30','1/40','1/50','1/60','1/80','1/100','1/125','1/160','1/200','1/250','1/320','1/400','1/500','1/640','1/800','1/1000','1/1250','1/1600','1/2000','1/2500','1/3200','1/4000','1/5000','1/6400','1/8000'];
const TVV=TV3L.map(s=>s.includes('/')?1/+s.split('/')[1]:parseFloat(s));
const APS=[2.8,3.2,3.5,4,4.5,5,5.6,6.3,7.1,8,9,10,11,13,14,16,18,20,22];
const ISO3=[100,125,160,200,250,320,400,500,640,800,1000,1250,1600,2000,2500,3200,4000,5000,6400,8000,10000,12800,16000,20000,25600,32000,40000,51200];
const AP_RING=['2.8','4','5.6','8','11','16','22','A'];
const FOCALS=[24,35,50,70];
const WBS=['AWB','日光','阴天','白炽灯','荧光灯'];
const FMS=['AF-S','AF-A','AF-C','DMF','MF'];
const DRIVES=['单张','连拍','自拍 2s','自拍 10s'];
const MSW=['照片','动态','S&Q'];
const LIVE_EV=12;
function snap(list,v){let b=0,bd=1e9;list.forEach((x,i)=>{const d=Math.abs(lg(x)-lg(v));if(d<bd){bd=d;b=i}});return b}
const fmtT=t=>TV3L[snap(TVV,t)];
const fmtN=N=>'F'+(N<10?N.toFixed(1):Math.round(N));
const fmtEv=v=>(v>0?'+':v<0?'−':'±')+Math.abs(v).toFixed(1);

/* 曝光求解：设置 EV = log2(N²/t) − log2(ISO/100)；偏差 = 场景 EV − 设置 EV（>0 过曝） */
function solve(mode,E,p){
  const target=E-p.ev; let N=p.N,t=p.t,iso=p.iso,warn=''; const auto=iso==='AUTO', ISOMAX=12800;
  if(mode==='AUTO'||mode==='P'){N=target>=14?8:target>=11?5.6:target>=8?4:2.8;mode='A'}
  if(mode==='A'){
    if(auto){iso=100;t=N*N/2**target;if(t>1/60){iso=clamp(100*2**(lg(N*N*60)-target),100,ISOMAX);t=N*N/2**(target+lg(iso/100))}}
    else t=N*N/2**(target+lg(iso/100));
    if(t<1/8000){t=1/8000;warn='快门已到 1/8000，仍然过曝'}
    if(t>30){t=30;warn='快门已到 30 秒，仍然欠曝'}
    t=TVV[snap(TVV,t)];
  }else if(mode==='S'){
    if(auto){iso=100;N=Math.sqrt(t*2**target);if(N<2.8){iso=clamp(100*2**(lg(2.8*2.8/t)-target),100,ISOMAX);N=Math.sqrt(t*2**(target+lg(iso/100)))}}
    else N=Math.sqrt(t*2**(target+lg(iso/100)));
    if(N<2.8){N=2.8;warn='光圈已开到最大 F2.8，仍然欠曝'}
    if(N>22){N=22;warn='光圈已收到 F22，仍然过曝'}
    N=APS[snap(APS,N)];
  }else{
    if(auto){iso=100*2**(lg(N*N/t)-target);if(iso<100){iso=100;warn='ISO 已到最低，仍然过曝'}if(iso>ISOMAX){iso=ISOMAX;warn='ISO 已到自动上限，仍然欠曝'}}
  }
  if(auto)iso=ISO3[snap(ISO3,iso)];
  const bias=E-(lg(N*N/t)-lg(iso/100));
  return {N,t,iso,bias,warn,auto};
}

const entriesById=Object.fromEntries(MANUAL.entries.map(entry=>[entry.id,entry]));
const areaNames={wide:'广域',zone:'区',center_fix:'中间固定',spot_xl:'点: XL',spot_l:'点: L',spot:'点: M',spot_s:'点: S',spot_xs:'点: XS',
  expanded_spot:'扩展点',custom_1:'自定义 1',custom_2:'自定义 2',custom_3:'自定义 3'};
for(const [key,label] of Object.entries(areaNames)){
  areaNames[key==='wide'?'tracking':'tracking_'+key]='跟踪: '+label.replace('点: ','点').replace('自定义 ','自定义');
}
const areaKeys=Object.fromEntries(Object.entries(areaNames).map(([key,label])=>[label,key]));
const st={power:true,modeI:2,av:2.8,tvI:TV3L.indexOf('1/250'),isoI:-1,ev:0,focal:24,fm:'AF-A',movieFm:'AF-C',area:'广域',wb:'AWB',drive:'单张',disp:0,msw:'照片',
  picker:null,touch:true,movieTimer:'关',movieDelay:'3秒',contSpeed:'Hi',photos:[],photoIndex:0,playZoom:1,fnFrom:null,
  lensAF:true,apRing:7,irisLock:false,click:true,zoomSmooth:'SMOOTH',rLock:false,ael:false,overlay:null,menuTab:0,shots:1240,half:false,flash:0,fp:[0,0],chg:null,chgT:0,battery:86,E:12};
const effMode=()=>{const m=MODES[st.modeI];return 'AUTO P A S M'.includes(m)?m:'A'};
const effN=()=>st.apRing!==7?parseFloat(AP_RING[st.apRing]):st.av;
const effFm=()=>st.lensAF?(st.msw==='照片'?st.fm:st.movieFm):'MF';
const canTrack=()=>st.msw==='照片'&&effFm()==='AF-C';
const effArea=()=>effMode()==='AUTO'||(st.area.startsWith('跟踪')&&!canTrack())?'广域':st.area;
const movableArea=()=>!['广域','中间固定','跟踪: 广域','跟踪: 中间固定'].includes(effArea());
const effWb=()=>effMode()==='AUTO'?'AWB':st.wb;
const canCompensate=()=>effMode()!=='AUTO'&&(effMode()!=='M'||st.isoI<0);
const effEv=()=>canCompensate()?st.ev:0;
function expo(){return solve(effMode(),st.E,{N:effN(),t:TVV[st.tvI],iso:effMode()==='AUTO'||st.isoI<0?'AUTO':ISO3[st.isoI],ev:effEv()})}

/* ---------- 虚拟屏幕绘制（1024×683 坐标系，返回可点热区） ---------- */
const HASF=(()=>{try{return 'filter' in document.createElement('canvas').getContext('2d')}catch(e){return false}})();
const UIF='"Saira Semi Condensed","Noto Sans SC",sans-serif';
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function T(c,s,x,y,size,color='#fff',align='left',w=600){c.font=`${w} ${size}px ${UIF}`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
function drawScene(c,W,H,N,focal,bias,noBlur){
  const z=focal/24;
  let g=c.createLinearGradient(0,0,0,H*.62);g.addColorStop(0,'#7E97B3');g.addColorStop(1,'#CDD6DE');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.save();c.translate(W/2,H*.6);c.scale(z,z);c.translate(-W/2,-H*.6);
  if(HASF&&!noBlur)c.filter='blur('+(Math.max(0,28/N-1)*Math.sqrt(z)).toFixed(1)+'px)';
  c.fillStyle='#8C9AA6';c.beginPath();c.moveTo(-300,H*.62);for(let x=-300;x<=W+300;x+=40)c.lineTo(x,H*.47+Math.sin(x*.012)*22+Math.sin(x*.031)*9);c.lineTo(W+300,H*.62);c.closePath();c.fill();
  [[40,150,120],[190,215,95],[300,120,110],[650,195,100],[765,140,130],[905,235,95]].forEach(([x,h,w],i)=>{c.fillStyle=i%2?'#5E6670':'#727A84';c.fillRect(x,H*.6-h,w,h);c.fillStyle='rgba(255,236,190,.5)';for(let yy=H*.6-h+14;yy<H*.6-12;yy+=22)for(let xx=x+10;xx<x+w-12;xx+=20)if((xx*7+yy*3)%5<3)c.fillRect(xx,yy,9,12)});
  c.fillStyle='#3F5A3A';[[150,46],[262,38],[560,54],[606,40],[870,48]].forEach(([x,r])=>{c.fillRect(x-4,H*.6-r,8,r);c.beginPath();c.arc(x,H*.6-r*1.3,r,0,7);c.fill()});
  g=c.createLinearGradient(0,H*.6,0,H);g.addColorStop(0,'#7A836F');g.addColorStop(1,'#4E5649');c.fillStyle=g;c.fillRect(-400,H*.6,W+800,H*.6);
  if(HASF)c.filter='none';
  const px=W*.5,py=H*.93;
  c.fillStyle='#2E3440';c.fillRect(px-26,py-150,20,150);c.fillRect(px+6,py-150,20,150);
  c.fillStyle='#C2562F';rr(c,px-46,py-300,92,165,24);c.fill();
  c.fillStyle='#E2B697';c.beginPath();c.arc(px,py-336,33,0,7);c.fill();
  c.fillStyle='#2A211C';c.beginPath();c.arc(px,py-346,35,Math.PI,0);c.fill();
  c.restore();
  const b=clamp(bias,-4,4);
  if(b>0){c.fillStyle=`rgba(255,255,255,${Math.min(.82,b*.21)})`;c.fillRect(0,0,W,H)}
  else if(b<0){c.fillStyle=`rgba(0,0,0,${Math.min(.86,-b*.22)})`;c.fillRect(0,0,W,H)}
}
const MENU_TABS=[
  ['file_format','format','drive_mode','release_wo_card','image_stabilization','shutter_type'],
  ['iso','iso_auto_min_ss','exposure_comp','metering_mode','dro_hdr','white_balance'],
  ['focus_mode','focus_area','MENU › 对焦 › 被摄体识别 › AF中的被摄体识别','subject_recognition','focus_magnifier'],
  ['playback_zoom','protect','rating','delete'],['smartphone_transfer'],
  ['language','date_time','beep','touch_ops','usb_power_supply','fn_menu'],['my_menu']
].map(group=>{
  const paths=group.map(item=>(entriesById[item]?.menu_path||item).split(' › '));
  return [paths[0][1],paths.map(path=>path.slice(2).join(' › '))];
});
function drawScreen(c,CW,CH){
  const W=1024,H=683,hs=[];c.save();c.scale(CW/W,CH/H);
  const add=(x,y,w,h,k,title,desc)=>hs.push({x,y,w,h,k,title,desc});
  if(!st.power){c.fillStyle='#050506';c.fillRect(0,0,W,H);T(c,'电源已关闭',W/2,H/2,34,'#555','center',500);c.restore();return hs}
  const r=expo(),mode=MODES[st.modeI],now=performance.now(),hot=k=>st.chg===k&&now-st.chgT<1400?'#F28B26':'#fff';
  if(st.picker){
    const p=st.picker;
    c.fillStyle='#181a1d';c.fillRect(0,0,W,H);
    T(c,p.title,W/2,110,44,'#fff','center');
    T(c,String(p.options[p.index]),W/2,320,52,'#F28B26','center');
    T(c,'转动拨轮选择，按中央按钮确认',W/2,530,30,'#ccc','center');
    c.restore();return hs;
  }
  if(st.overlay==='play'){
    const L=st.photos[st.photoIndex];
    if(!L){c.fillStyle='#181a1d';c.fillRect(0,0,W,H);T(c,'尚无照片，按快门拍一张',W/2,H/2,34,'#fff','center');c.restore();return hs}
    c.save();
    const zoom=st.playZoom,px=W/2+(L.fp?.[0]||0)*90,py=H/2+(L.fp?.[1]||0)*70;
    c.translate(clamp(W/2-px*zoom,W*(1-zoom),0),clamp(H/2-py*zoom,H*(1-zoom),0));c.scale(zoom,zoom);
    drawScene(c,W,H,L.N,L.focal,L.bias);
    c.restore();
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(0,H-70,W,70);c.fillRect(0,0,W,58);
    T(c,'▶ 回放'+(L.protected?'　保护':'')+(zoom>1?'　×'+zoom:''),26,30,28);T(c,`${st.photoIndex+1} / ${st.photos.length}`,W-26,30,28,'#fff','right');
    T(c,`${fmtT(L.t)}   ${fmtN(L.N)}   ISO ${L.iso}   ${L.focal}mm`,26,H-35,30);
    add(0,H-70,W,70,'pinfo','回放信息','这张照片的快门、光圈、ISO 和焦距。复盘时 AI 读的就是这些 EXIF。');
    c.restore();return hs;
  }
  drawScene(c,W,H,r.N,st.focal,r.bias);
  if(st.overlay==='menu'){
    c.fillStyle='rgba(8,9,11,.96)';c.fillRect(0,0,W,H);
    c.fillStyle='#16181C';c.fillRect(0,0,190,H);
    MENU_TABS.forEach(([n],i)=>{const y=40+i*88;if(i===st.menuTab){c.fillStyle='#F28B26';rr(c,10,y-30,170,64,10);c.fill()}T(c,n,95,y+2,26,i===st.menuTab?'#1A0E02':'#ccc','center',600)});
    const [tn,items]=MENU_TABS[st.menuTab];T(c,tn+'　菜单节选',230,48,34,'#fff','left',700);
    items.forEach((s,i)=>{const y=120+i*88;c.fillStyle=i===0?'#2A2E35':'#1A1D22';rr(c,220,y-34,780,72,10);c.fill();T(c,s,248,y+2,28,'#E8E8E8','left',500)});
    add(0,0,190,H,'mtab','菜单分类','这里列出七个标签页下的部分路径。可用摇杆上下切换标签页。');
    add(220,80,780,560,'mlist','菜单项','每一项在 App 里都会带说明和新手建议值。按摇杆上下切换分类。');
    c.restore();return hs;
  }
  // 顶部状态
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,W,64);c.fillRect(0,H-74,W,74);
  rr(c,22,12,mode==='AUTO'?110:62,42,8);c.fillStyle=hot('mode')==='#fff'?'rgba(255,255,255,.92)':'#F28B26';c.fill();T(c,mode==='AUTO'?'AUTO':mode,mode==='AUTO'?77:53,34,30,'#111','center',700);
  add(16,8,mode==='AUTO'?122:74,50,'mode','拍摄模式',`当前是 ${MODE_NAMES[mode]}。由顶部模式转盘决定。新手从 A 档开始学。`);
  T(c,st.msw,mode==='AUTO'?150:102,34,24,'#ddd');
  T(c,'JPEG',W-330,34,24,'#ddd');add(W-340,8,92,50,'qual','文件格式','出厂可直接拍 JPEG，适合分享和本课的照片复盘。');
  T(c,'▣1  '+st.shots,W-226,34,26,'#fff');add(W-236,8,108,50,'shots','剩余张数','卡槽 1 还能拍的张数。');
  rr(c,W-112,20,54,26,5);c.strokeStyle='#fff';c.lineWidth=3;c.stroke();c.fillStyle='#fff';c.fillRect(W-107,25,44*st.battery/100,16);c.fillRect(W-56,28,5,10);T(c,st.battery+'%',W-40,34,22,'#fff','left',500);
  add(W-118,8,112,50,'batt','电池电量','NP-FZ100 剩余电量。');
  if(st.disp===0||st.disp===2||st.disp===3){
    const col=[['drive',st.drive,'拍摄模式','拍照时按控制拨轮左键，可选单张、连拍或自拍。'],
      ['fm',effFm(),'对焦模式','拍照出厂为 AF-A，自动按主体动静切换。拍静物可选 AF-S，拍运动可选 AF-C。'],
      ['area',effArea(),'对焦区域','广域会自动找主体。想指定位置可选区、点或扩展点，再用摇杆移动框。'],
      ['meter','多重','测光模式','多重测光照顾整个画面。逆光时脸容易偏暗。'],
      ['wb',effWb(),'白平衡模式','AWB 是自动白平衡。P、A、S、M 档可按 C1 选择白平衡模式。'],
      ['ss','防抖 开','机身防抖','机身五轴防抖可减少手持拍摄时的抖动。']];
    col.forEach(([k,v,ti,de],i)=>{const y=96+i*70;c.fillStyle='rgba(0,0,0,.42)';rr(c,18,y,150,52,8);c.fill();T(c,v,93,y+27,24,hot(k),'center',600);add(14,y-4,158,60,k,ti,de)});
  }
  // 对焦框
  const area=effArea(),fx=W/2+(movableArea()?st.fp[0]*90:0),fy=H/2+(movableArea()?st.fp[1]*70:0);
  const focused=st.half&&effFm()!=='MF',green=focused&&st.drive==='单张'&&area==='广域';
  c.strokeStyle=green?'#3DDC84':'#fff';c.lineWidth=green?5:3;
  if(area==='广域'&&!green){const x0=W*.22,x1=W*.78,y0=H*.18,y1=H*.82,l=30;[[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(([x,y,sx,sy])=>{c.beginPath();c.moveTo(x+sx*l,y);c.lineTo(x,y);c.lineTo(x,y+sy*l);c.stroke()});add(W*.22,H*.18,W*.56,H*.64,'af','对焦区域范围','广域会自动找主体。拍静止影像时，合焦位置可出现绿框，连拍时框可能不亮。')}
  else{const sizes={'点: XL':100,'点: L':74,'点: M':46,'点: S':34,'点: XS':24,'区':150};const s=sizes[area]||90;c.strokeRect(fx-s/2,fy-s/2,s,s);add(fx-s/2-10,fy-s/2-10,s+20,s+20,'af','对焦框','半按时看左下对焦指示。区、各尺寸点、扩展点和自定义区域等可用摇杆移动。')}
  if(focused)T(c,effFm()==='AF-C'?'((●))':'●',40,H-110,30,'#3DDC84');
  // 底部参数
  const lim=r.warn&&Math.floor(now/400)%2;
  T(c,fmtT(r.t),190,H-36,38,lim&&effMode()!=='S'?'#F2584D':hot('tv'),'center');add(120,H-72,140,72,'tv','快门速度','每张照片的曝光时间。越快越能凝固动作，越慢越容易手抖。手持建议不慢于 1/焦距 秒。');
  T(c,fmtN(r.N),360,H-36,38,lim&&effMode()==='S'?'#F2584D':hot('av'),'center');add(290,H-72,140,72,'av','光圈','F 值越小光圈越大：进光多、背景越虚。F2.8 是这支镜头的最大光圈。');
  const mm=effMode()==='M';
  T(c,(mm?'M.M. ':'')+fmtEv(mm?Math.round(r.bias*3)/3:effEv()),560,H-36,34,hot('ev'),'center');add(470,H-72,180,72,'ev',mm?'测光表 M.M.':'曝光补偿',mm?'M 档下显示当前设置比相机建议的曝光亮多少或暗多少。0 为标准。':'让照片整体更亮（+）或更暗（−）。用后拨盘 R 调，每格 1/3 档。');
  T(c,'ISO '+(r.auto?'AUTO ':'')+r.iso,780,H-36,34,hot('iso'),'center');add(680,H-72,200,72,'iso','ISO 感光度','数值越高画面越亮，但噪点越多。AUTO 表示相机自动调整。按控制拨轮右侧修改。');
  if(st.ael){T(c,'✱',940,H-36,40,'#fff','center');add(910,H-72,60,72,'ael','曝光锁定','AEL 已锁定曝光，重新构图时亮度不变。')}
  if(effFm()==='MF')T(c,'MF',W-40,H-110,30,'#F28B26','right',700);
  if(st.disp===2){c.fillStyle='rgba(0,0,0,.5)';c.fillRect(W-240,H-250,210,150);c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.5;c.strokeRect(W-240,H-250,210,150);
    const sh=clamp(r.bias,-3,3)*28;c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.moveTo(W-240,H-100);for(let i=0;i<=60;i++){const x=W-240+i*3.5,u=(x-(W-135+sh))/42;c.lineTo(x,H-100-112*Math.exp(-u*u)-18*Math.exp(-(((x-(W-200+sh))/18)**2)))}c.lineTo(W-30,H-100);c.closePath();c.fill();
    add(W-246,H-256,222,162,'hist','直方图','横轴从左到右是从暗到亮，竖轴是像素数量。堆在最右边说明过曝，堆在最左边说明欠曝。')}
  if(st.disp===3){c.strokeStyle='#3DDC84';c.lineWidth=4;c.beginPath();c.moveTo(W*.25,H/2);c.lineTo(W*.45,H/2);c.moveTo(W*.55,H/2);c.lineTo(W*.75,H/2);c.stroke();c.beginPath();c.arc(W/2,H/2,16,0,7);c.stroke();add(W*.25,H/2-30,W*.5,60,'level','水平仪','线变绿说明相机是平的，拍风景时地平线不会歪。')}
  if(st.overlay==='fn'){
    const items=[['驱动',st.drive],['对焦模式',effFm()],['对焦区域',effArea()],['曝光补偿',fmtEv(effEv())],['ISO',r.auto?'AUTO':String(r.iso)],['测光','多重'],['白平衡',effWb()],['DRO','自动'],['创意外观','ST'],['照相模式',mode],['防抖','开'],['格式','JPEG']];
    c.fillStyle='rgba(8,9,11,.82)';c.fillRect(0,H-315,W,315);
    const context=st.fnFrom==='play'?'回放':st.msw==='照片'?'拍照':'录像';
    T(c,context+' Fn 菜单示例 · 12 格',26,H-287,28);
    items.forEach(([k,v],i)=>{const x=22+(i%6)*165,y=H-244+Math.floor(i/6)*118;c.fillStyle=i===0?'#F28B26':'rgba(255,255,255,.08)';rr(c,x,y,150,104,12);c.fill();T(c,context==='拍照'?k:'可配置',x+75,y+30,22,i===0?'#1A0E02':'#aaa','center',500);T(c,context==='拍照'?v:'—',x+75,y+70,30,i===0?'#1A0E02':'#fff','center',700)});
    add(0,H-260,W,260,'fn','Fn 快捷菜单','拍照、录像和回放各有一套 12 格功能菜单。这里展示示例，实机排列可在相应模式按 Fn 查看。');
  }
  if(st.flash){c.fillStyle='#000';c.fillRect(0,0,W,H)}
  c.restore();return hs;
}

/* ---------- 3D ---------- */
function toast(msg){const el=document.getElementById('toast');if(!msg)return;el.textContent=msg;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,2200)}
const Cam=(function(){
  const stage=document.getElementById('stage'),labelsEl=document.getElementById('labels'),callout=document.getElementById('callout');
  const api={ok:false,onPick:null,ctl:{}};
  const noop=()=>{};
  if(typeof THREE==='undefined'){
    stage.insertAdjacentHTML('beforeend','<div class="stage-msg">3D 引擎没能加载（需要访问 cdnjs.cloudflare.com）。<br>其他页面可以正常使用。</div>');
    return Object.assign(api,{mount(h){h.appendChild(stage)},snapshot:()=>null,setView:noop,highlight:noop,clear:noop,anim:noop,select:noop,labels:noop,redraw:noop,sync:noop,anchorOf:()=>null});
  }
  api.ok=true;
  const LX=-1.9,LY=3.6,PI=Math.PI,V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  stage.prepend(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.5,500);
  // 环境光照：程序生成的柔光箱
  const pm=new THREE.PMREMGenerator(renderer),env=new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60,32,16),new THREE.MeshBasicMaterial({color:0x2c3038,side:THREE.BackSide})));
  [[34,20,[0,40,12],5],[22,34,[-40,12,22],2.6],[22,34,[40,10,-18],2],[46,8,[0,-24,34],.9]].forEach(([w,h,p,k])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(k,k,k),side:THREE.DoubleSide}));m.position.set(...p);m.lookAt(0,0,0);env.add(m)});
  scene.environment=pm.fromScene(env,.04).texture;
  scene.add(new THREE.HemisphereLight(0xe2e8f2,0x1a1c20,.5));
  const key=new THREE.DirectionalLight(0xffffff,1.5);key.position.set(12,26,18);scene.add(key);
  const fill=new THREE.DirectionalLight(0xc4d4ff,.45);fill.position.set(-22,8,8);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffe2c4,.9);rim.position.set(-6,12,-26);scene.add(rim);

  function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=o.linear?THREE.LinearEncoding:THREE.sRGBEncoding;t.anisotropy=8;if(o.rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(o.rep[0],o.rep[1])}return t}
  const grain=ctex(256,256,(x,w,h)=>{const d=x.createImageData(w,h);for(let i=0;i<d.data.length;i+=4){const v=100+Math.random()*80;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0)},{linear:1,rep:[5,5]});
  const knurl=ctex(256,16,(x,w,h)=>{x.fillStyle='#777';x.fillRect(0,0,w,h);x.fillStyle='#eee';for(let i=0;i<w;i+=4)x.fillRect(i,0,2,h)},{linear:1,rep:[4,1]});
  const S=(o)=>new THREE.MeshStandardMaterial(o);
  const M={body:S({color:0x1c1d20,roughness:.6,metalness:.12,bumpMap:grain,bumpScale:.012}),
    rubber:S({color:0x131416,roughness:.92,bumpMap:grain,bumpScale:.05}),
    dialSide:S({color:0x2c2e33,roughness:.32,metalness:.8,bumpMap:knurl,bumpScale:.05}),
    dialTop:S({color:0x222428,roughness:.4,metalness:.5}),
    btn:S({color:0x25272b,roughness:.45,metalness:.25}),
    chrome:S({color:0xc2c6cc,roughness:.2,metalness:1}),
    barrel:S({color:0x18191b,roughness:.48,metalness:.22}),
    glass:S({color:0x0b1828,roughness:.03,metalness:.92,envMapIntensity:1.8}),
    red:S({color:0xc8291e,roughness:.4}),white:S({color:0xeeeeee,roughness:.5}),frame:S({color:0x0c0d0f,roughness:.32,metalness:.3}),dark:S({color:0x050607,roughness:.2,metalness:.6})};
  function rbox(w,h,d,r,b){const s=new THREE.Shape(),W=w-2*b,H=h-2*b,x=-W/2,y=-H/2;r=Math.min(r,W/2-.001,H/2-.001);
    s.moveTo(x+r,y);s.lineTo(x+W-r,y);s.quadraticCurveTo(x+W,y,x+W,y+r);s.lineTo(x+W,y+H-r);s.quadraticCurveTo(x+W,y+H,x+W-r,y+H);s.lineTo(x+r,y+H);s.quadraticCurveTo(x,y+H,x,y+H-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const dd=Math.max(.01,d-2*b),g=new THREE.ExtrudeGeometry(s,{depth:dd,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:10});g.translate(0,0,-dd/2);g.computeVertexNormals();return g}
  const mesh=(g,m,p,r)=>{const o=new THREE.Mesh(g,m);if(p)o.position.set(...p);if(r)o.rotation.set(...r);return o};
  const textTex=(s,o={})=>ctex(o.size||256,o.size||256,(x,w,h)=>{x.fillStyle=o.bg||'#25272b';x.fillRect(0,0,w,h);x.fillStyle=o.fg||'#e8e8e8';x.font=`700 ${o.font||88}px ${UIF}`;x.textAlign='center';x.textBaseline='middle';x.fillText(s,w/2,h/2+5)});

  const root=new THREE.Group();scene.add(root);
  const ctl=api.ctl,pickables=[],parts={};
  function reg(id,obj,face){const c=ctl[id]||(ctl[id]={id,objs:[],mats:[],face:V(...face).normalize(),anchor:V(),k:-1});c.objs.push(obj);
    obj.traverse(m=>{if(m.isMesh){m.material=Array.isArray(m.material)?m.material.map(x=>x.clone()):m.material.clone();[].concat(m.material).forEach(x=>c.mats.push(x));m.userData.cid=id;pickables.push(m)}});return obj}

  // 机身
  root.add(mesh(rbox(12.6,7.2,3.6,.9,.35),M.body,[0,3.6,0]));
  root.add(reg('battery_door',mesh(new THREE.BoxGeometry(2.6,.06,3.2),M.btn,[4.75,-.01,-3.25]),[0,-1,0]));
  root.add(mesh(rbox(3.3,3.6,7.0,1.35,.45),M.rubber,[4.72,3.5,-3.3],[PI/2,0,0]));
  root.add(mesh(rbox(5,2.4,3.4,.5,.3),M.body,[-1.9,8.15,.05]));
  root.add(mesh(rbox(3.6,1.2,1.6,.4,.3),M.body,[2.1,7.55,-.6]));// 右肩
  const eye=new THREE.Group();eye.add(mesh(rbox(4.2,2.6,1.0,.65,.3),M.rubber,[-2.4,8.05,2.22]));eye.add(mesh(new THREE.PlaneGeometry(2.6,1.6),M.dark,[-2.4,8.05,2.73]));reg('evf',eye,[0,0,1]);root.add(eye);
  const dio=mesh(new THREE.CylinderGeometry(.42,.42,.4,24),[M.dialSide,M.dialTop,M.dialTop],[.82,8.3,1.2],[0,0,PI/2]);reg('diopter',dio,[1,0,0]);root.add(dio);
  // 屏幕
  const scrCanvas=document.createElement('canvas');scrCanvas.width=1024;scrCanvas.height=683;const sctx=scrCanvas.getContext('2d');
  const scrTex=new THREE.CanvasTexture(scrCanvas);scrTex.encoding=THREE.sRGBEncoding;scrTex.anisotropy=8;
  const lcd=new THREE.Group();lcd.add(mesh(rbox(7.6,5.2,.45,.35,.12),M.frame,[-2.15,3.3,2.03]));
  lcd.add(mesh(new THREE.PlaneGeometry(6.8,4.533),new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}),[-2.15,3.3,2.262]));reg('lcd',lcd,[0,0,1]);root.add(lcd);
  // 按键
  function btn(id,label,pos,o={}){const r=o.r||.36,h=o.h||.22,top=o.axis==='y',g=new THREE.Group();
    const cap=mesh(new THREE.CylinderGeometry(r,r,h,32),o.mat||M.btn);const face=mesh(new THREE.CircleGeometry(r*.94,32),S({map:textTex(label,{font:o.font||(label.length>3?62:label.length>2?78:96),bg:o.bg,fg:o.fg}),roughness:.45,metalness:.2}));
    if(top){cap.position.y=h/2;face.position.y=h+.004;face.rotation.x=-PI/2}else{cap.rotation.x=PI/2;cap.position.z=h/2;face.position.z=h+.004}
    g.add(cap,face);if(o.ring){const ring=mesh(new THREE.TorusGeometry(r+.06,.05,10,40),M.red);if(top){ring.rotation.x=PI/2;ring.position.y=.02}else ring.position.z=.02;g.add(ring)}
    g.position.set(...pos);root.add(g);reg(id,g,top?[0,1,0]:[0,0,1]);parts[id]={obj:g,axis:top?'y':'z',base:top?pos[1]:pos[2]};return g}
  btn('btn_menu','MENU',[-4.55,6.35,1.8],{r:.42,font:58});
  btn('btn_c3','C3',[-5.6,6.35,1.8]);btn('btn_c1','C1',[1.9,6.35,1.8]);btn('btn_ael','AEL',[3.05,6.35,1.8]);
  btn('btn_afon','AF-ON',[4.45,6.35,1.8],{r:.5,font:60});
  btn('btn_fn','Fn',[2.2,5.05,1.8]);btn('btn_play','▶',[2.15,1.05,1.8],{font:90});btn('btn_c4','C4',[5.45,1.0,1.8]);
  btn('btn_c2','C2',[2.75,7.2,-1.05],{axis:'y'});btn('btn_movie','●',[3.85,7.2,-1.25],{axis:'y',fg:'#d0281d',font:120,ring:1});
  // 摇杆
  const joy=new THREE.Group();joy.add(mesh(new THREE.CylinderGeometry(.55,.55,.06,32),M.btn,[0,0,.03],[PI/2,0,0]));joy.add(mesh(new THREE.CylinderGeometry(.3,.34,.36,24),M.rubber,[0,0,.2],[PI/2,0,0]));joy.add(mesh(new THREE.SphereGeometry(.33,24,12,0,PI*2,0,PI/2),M.rubber,[0,0,.36],[PI/2,0,0]));
  joy.position.set(4.35,4.95,1.8);root.add(joy);reg('joystick',joy,[0,0,1]);parts.joystick={obj:joy};
  // 控制拨轮
  const wheel=new THREE.Group();wheel.add(mesh(new THREE.CylinderGeometry(1.2,1.2,.26,48),[M.dialSide,M.dialTop,M.dialTop],[0,0,.13],[PI/2,0,0]));
  wheel.add(mesh(new THREE.RingGeometry(.55,1.12,48),S({map:ctex(512,512,(x,w,h)=>{x.fillStyle='#222428';x.fillRect(0,0,w,h);x.fillStyle='#e8e8e8';x.font=`700 52px ${UIF}`;x.textAlign='center';x.textBaseline='middle';x.fillText('DISP',w/2,72);x.fillText('ISO',w-78,h/2);x.font=`700 46px ${UIF}`;x.fillText('驱动',80,h/2);x.fillText('▢',w/2,h-72)}),roughness:.4,metalness:.4}),[0,0,.265]));
  wheel.position.set(3.95,2.75,1.8);root.add(wheel);reg('wheel',wheel,[0,0,1]);parts.wheel={obj:wheel};
  btn('btn_center','',[3.95,2.75,1.8],{r:.46,h:.3});
  // 顶部拨盘
  function dial(id,pos,r,h,topMat,face){const piv=new THREE.Group();piv.position.set(...pos);piv.add(mesh(new THREE.CylinderGeometry(r,r,h,56),[M.dialSide,topMat||M.dialTop,M.dialTop],[0,h/2,0]));root.add(piv);reg(id,piv,face||[0,1,0]);parts[id]={obj:piv};return piv}
  const STEP=PI*2/8;
  const modeTop=S({map:ctex(512,512,(x,w,h)=>{x.fillStyle='#202226';x.fillRect(0,0,w,h);MODES.forEach((m,i)=>{const a=PI/2+i*STEP;x.save();x.translate(w/2+Math.cos(a)*w*.35,h/2+Math.sin(a)*h*.35);x.rotate(a-PI/2);x.fillStyle=m==='AUTO'?'#F28B26':'#eee';x.font=`700 ${m==='AUTO'?40:62}px ${UIF}`;x.textAlign='center';x.textBaseline='middle';x.fillText(m,0,0);x.restore()});x.strokeStyle='#3a3c40';x.lineWidth=6;x.beginPath();x.arc(w/2,h/2,w*.17,0,7);x.stroke()}),roughness:.4,metalness:.4});
  dial('mode_dial',[1.35,7.2,.3],1.2,.95,modeTop);
  root.add(mesh(new THREE.BoxGeometry(.1,.03,.32),M.white,[1.35,7.21,1.62]));
  const msw=new THREE.Group();msw.add(mesh(new THREE.CylinderGeometry(1.36,1.36,.24,56),M.btn,[0,.12,0]));msw.add(mesh(new THREE.BoxGeometry(.5,.2,.7),M.btn,[0,.12,-1.55]));msw.position.set(1.35,7.2,.3);root.add(msw);reg('mode_switch',msw,[0,0,1]);parts.mode_switch={obj:msw};
  const rR=dial('dial_rear_r',[5.15,7.2,.15],1.12,.8);const lock=mesh(new THREE.CylinderGeometry(.36,.36,.12,24),M.btn,[0,.86,0]);rR.add(lock);
  dial('dial_rear_l',[3.45,6.72,1.62],1.05,.55,null,[0,.4,1]);
  dial('dial_front',[4.72,6.35,-4.95],.95,.5,null,[0,.3,-1]);
  // 快门 + 电源
  const pw=new THREE.Group();pw.add(mesh(new THREE.CylinderGeometry(.88,.88,.3,40),M.btn,[0,.15,0]));pw.add(mesh(new THREE.BoxGeometry(.5,.2,.5),M.btn,[.95,.15,-.2]));pw.position.set(4.72,7.0,-3.55);root.add(pw);reg('power',pw,[1,1,0]);parts.power={obj:pw};
  const sh=new THREE.Group();sh.add(mesh(new THREE.CylinderGeometry(.55,.58,.32,40),M.chrome,[0,.16,0]));sh.add(mesh(new THREE.CylinderGeometry(.5,.5,.04,40),M.btn,[0,.33,0]));sh.position.set(4.72,7.3,-3.55);root.add(sh);reg('shutter',sh,[0,1,0]);parts.shutter={obj:sh,axis:'y',base:7.3};
  // 热靴、卡仓、接口、背带环、卸镜头键
  const hot=new THREE.Group();hot.add(mesh(new THREE.BoxGeometry(2.1,.1,2.0),M.dark,[0,.05,0]));hot.add(mesh(new THREE.BoxGeometry(.2,.22,2.0),M.chrome,[-.95,.12,0]));hot.add(mesh(new THREE.BoxGeometry(.2,.22,2.0),M.chrome,[.95,.12,0]));hot.position.set(-1.9,9.35,.05);root.add(hot);reg('hotshoe',hot,[0,1,0]);
  reg('card_door',mesh(new THREE.BoxGeometry(.08,4.4,2.9),M.btn,[6.33,3.8,.15]),[1,0,0]);root.add(ctl.card_door.objs[0]);
  const ports=new THREE.Group();
  ports.add(mesh(new THREE.BoxGeometry(.08,4.2,2.7),M.rubber,[-6.33,3.6,0]));
  [1,2].forEach((port,i)=>{
    const y=3.75-i*1.35;
    ports.add(mesh(rbox(1.05,.37,.08,.16,.02),M.chrome,[-6.4,y,.3],[0,-PI/2,0]));
    ports.add(mesh(rbox(.88,.23,.08,.1,.02),M.dark,[-6.45,y,.3],[0,-PI/2,0]));
    const label=S({map:textTex('PORT '+port,{font:64}),roughness:.6});
    ports.add(mesh(new THREE.PlaneGeometry(1.65,.65),label,[-6.41,y+.48,.16],[0,-PI/2,0]));
  });
  root.add(ports);reg('ports',ports,[-1,0,0]);
  [[6.38,6.5,.7],[-6.38,6.5,.7]].forEach(p=>root.add(mesh(new THREE.TorusGeometry(.35,.09,8,20),M.chrome,p,[0,PI/2,0])));
  const rel=mesh(new THREE.CylinderGeometry(.42,.42,.24,32),M.btn,[-5.7,1.25,-1.9],[PI/2,0,0]);root.add(rel);reg('lens_release',rel,[0,0,-1]);
  // 镜头图 A：IRIS LOCK / CLICK 靠卡口，AF/MF、保持键和变焦阻尼位于变焦环与对焦环之间。
  const lens=new THREE.Group();lens.position.set(LX,LY,0);root.add(lens);
  const seg=(zA,zB,rA,rB,mat,parent=lens)=>{const m=mesh(new THREE.CylinderGeometry(rA,rB,Math.abs(zA-zB),72,1,false),mat,[0,0,(zA+zB)/2],[PI/2,0,0]);parent.add(m);return m};
  // 环形贴图：文字原地旋转 180°，从机身后方/上方看是正的
  const ringTex=(w,draw)=>ctex(w,256,(x,W,H)=>draw(x,W,H));
  const putText=(x,s,u,v,W,H,size,col)=>{x.save();x.translate(u*W,v*H);x.rotate(PI);x.fillStyle=col;x.font=`700 ${size}px ${UIF}`;x.textAlign='center';x.textBaseline='middle';x.fillText(s,0,0);x.restore()};
  seg(-1.8,-2.15,3.25,3.25,M.chrome);seg(-2.15,-2.8,3.45,3.55,M.barrel);
  lens.add(mesh(new THREE.BoxGeometry(.07,.05,.3),M.white,[0,3.56,-2.62]));
  const AD=13*PI/180;
  const apPiv=new THREE.Group();lens.add(apPiv);
  const apTex=ringTex(2048,(x,W,H)=>{x.fillStyle='#16171a';x.fillRect(0,0,W,H);x.fillStyle='#34363b';for(let i=0;i<W;i+=10){x.fillRect(i,0,5,H*.27);x.fillRect(i,H*.74,5,H*.26)}
    AP_RING.forEach((s,i)=>{const u=.5+((i-7)*AD)/(2*PI);putText(x,s,u,.5,W,H,s==='A'?70:60,s==='A'?'#F28B26':'#f0f0f0')})});
  seg(-4.65,-6.0,3.86,3.86,[S({map:apTex,roughness:.5,metalness:.25}),M.barrel,M.barrel],apPiv);reg('ring_aperture',apPiv,[0,1,0]);parts.ring_aperture={obj:apPiv};
  const swTex=ringTex(2048,(x,W,H)=>{x.fillStyle='#18191b';x.fillRect(0,0,W,H);putText(x,'24-70mm F2.8 GM II',.36,.5,W,H,58,'#cfcfcf')});
  seg(-2.8,-4.65,3.77,3.77,[S({map:swTex,roughness:.48,metalness:.22}),M.barrel,M.barrel]);seg(-6.0,-6.5,3.95,4.2,M.barrel);
  lens.add(mesh(new THREE.BoxGeometry(.08,.05,.3),M.white,[0,3.97,-6.12]));
  const ZD=[0,24,42,56].map(d=>d*PI/180);
  const zPiv=new THREE.Group();lens.add(zPiv);
  const zTex=ringTex(2048,(x,W,H)=>{x.fillStyle='#121315';x.fillRect(0,0,W,H);x.fillStyle='#2a2c30';for(let i=0;i<W;i+=12)x.fillRect(i,H*.3,6,H*.7);FOCALS.forEach((f,i)=>putText(x,String(f),.5+ZD[i]/(2*PI),.14,W,H,46,'#f0f0f0'))});
  seg(-6.5,-9.5,4.3,4.3,[S({map:zTex,roughness:.82,metalness:.05}),M.barrel,M.barrel],zPiv);reg('ring_zoom',zPiv,[0,1,0]);parts.ring_zoom={obj:zPiv};
  seg(-9.5,-10.85,4.15,4.15,M.barrel);
  const fPiv=new THREE.Group();lens.add(fPiv);
  const fTex=ringTex(2048,(x,W,H)=>{x.fillStyle='#121315';x.fillRect(0,0,W,H);x.fillStyle='#2c2e32';for(let i=0;i<W;i+=12)x.fillRect(i,H*.08,6,H*.84)});
  seg(-10.85,-12.65,4.3,4.3,[S({map:fTex,roughness:.82,metalness:.05}),M.barrel,M.barrel],fPiv);reg('ring_focus',fPiv,[0,1,0]);parts.ring_focus={obj:fPiv};
  seg(-12.65,-13.8,4.3,4.39,M.barrel);
  lens.add(mesh(new THREE.RingGeometry(3.55,4.39,72),M.barrel,[0,0,-13.8],[0,PI,0]));
  lens.add(mesh(new THREE.RingGeometry(3.0,3.6,72),M.dark,[0,0,-13.4],[0,PI,0]));
  const capH=Math.asin(3.6/8);lens.add(mesh(new THREE.SphereGeometry(8,48,16,0,PI*2,0,capH),M.glass,[0,0,-13.35+8],[-PI/2,0,0]));
  // 镜身开关
  function onBarrel(obj,deg,z,r){const a=deg*PI/180,n=V(Math.cos(a),Math.sin(a),0),y=V(Math.sin(a),-Math.cos(a),0),x=V(0,0,1);obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,n));obj.position.set(r*Math.cos(a),r*Math.sin(a),z);lens.add(obj);return obj}
  function sw(id,deg,z,r,on){const g=new THREE.Group();g.add(mesh(rbox(1.0,.75,.12,.12,.04),M.btn,[0,0,0]));const k=mesh(rbox(.42,.3,.22,.08,.05),M.chrome,[0,on?.16:-.16,.1]);g.add(k);onBarrel(g,deg,z,r);const d=V(Math.cos(deg*PI/180),Math.sin(deg*PI/180),0);reg(id,g,[d.x,d.y,0]);parts[id]={obj:g,knob:k};return g}
  sw('sw_focus_mode',198,-10.15,4.18,true);sw('sw_iris_lock',180,-3.85,3.8,false);sw('sw_click',0,-3.85,3.8,true);sw('sw_zoom_smooth',0,-10.15,4.18,true);
  [180,90].forEach(d=>{const g=new THREE.Group();g.add(mesh(rbox(.8,.55,.22,.2,.06),M.btn,[0,0,.04]));onBarrel(g,d,-10.15,4.18);const dd=V(Math.cos(d*PI/180),Math.sin(d*PI/180),0);reg('btn_focus_hold',g,[dd.x,dd.y,0]);parts.btn_focus_hold=parts.btn_focus_hold||{objs:[]};parts.btn_focus_hold.objs.push(g)});
  // 假阴影
  const shTex=ctex(256,256,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,10,w/2,h/2,w/2);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h)});
  const shadow=mesh(new THREE.PlaneGeometry(30,26),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false}),[-.5,-.86,-5],[-PI/2,0,0]);shadow.raycast=()=>{};root.add(shadow);

  // 锚点：包围盒中心沿朝向推到表面
  root.updateMatrixWorld(true);
  const box=new THREE.Box3(),tmp=V();
  for(const id in ctl){const c=ctl[id];box.makeEmpty();box.expandByObject(c.objs[0]);box.getCenter(c.anchor);box.getSize(tmp);c.anchor.addScaledVector(c.face,.5*Math.abs(tmp.dot(c.face))+.05)}
  // 标签
  const lbs={};for(const id in ctl){const d=document.createElement('button');d.className='lb';d.type='button';d.textContent=shortName(id);d.hidden=true;d.onclick=e=>{e.stopPropagation();api.onPick&&api.onPick(id)};labelsEl.appendChild(d);lbs[id]=d}

  // 视角
  const orb={th:.62,ph:1.12,r:31,t:V(-.6,4.6,-4.6)};let goal=null;
  const VIEWS={home:{th:.62,ph:1.12,r:31,t:[-.6,4.6,-4.6]},back:{th:0,ph:1.45,r:25,t:[0,4.3,0]},top:{th:.0001,ph:.2,r:28,t:[0,5,-4.8]},front:{th:PI,ph:1.4,r:30,t:[-.6,4.2,-5]},
    bottom:{th:0,ph:2.94,r:28,t:[0,2,-4.8]},right:{th:2.28,ph:1.34,r:30,t:[0,4.2,-5]},left:{th:-PI/2,ph:1.38,r:30,t:[0,4.2,-5]},lens:{th:-2.05,ph:1.2,r:21,t:[-1.9,3.8,-7.5]}};
  api.setView=(name,instant)=>{const v=VIEWS[name]||VIEWS.home;let th=v.th;while(th-orb.th>PI)th-=2*PI;while(th-orb.th<-PI)th+=2*PI;
    goal={from:{th:orb.th,ph:orb.ph,r:orb.r,t:orb.t.clone()},to:{th,ph:v.ph,r:v.r,t:V(...v.t)},t0:performance.now(),dur:instant?1:700}};
  function stepGoal(now){const u=Math.min(1,(now-goal.t0)/goal.dur),e=1-Math.pow(1-u,3),f=goal.from,t=goal.to;orb.th=f.th+(t.th-f.th)*e;orb.ph=f.ph+(t.ph-f.ph)*e;orb.r=f.r+(t.r-f.r)*e;orb.t.lerpVectors(f.t,t.t,e);if(u>=1)goal=null}
  let aspect=1;
  function applyCam(){const r=orb.r*Math.max(1,1.05/aspect);camera.position.set(orb.t.x+r*Math.sin(orb.ph)*Math.sin(orb.th),orb.t.y+r*Math.cos(orb.ph),orb.t.z+r*Math.sin(orb.ph)*Math.cos(orb.th));camera.lookAt(orb.t)}

  // 指针：拖动旋转、双指/滚轮缩放、轻点选中
  const el=renderer.domElement,ptrs=new Map();let moved=0,pd0=0,r0=0;
  const pdist=()=>{const a=[...ptrs.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1};
  el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptrs.size===1)moved=0;if(ptrs.size===2){pd0=pdist();r0=orb.r;moved=99}goal=null});
  el.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===1){moved+=Math.abs(dx)+Math.abs(dy);if(moved>5){orb.th-=dx*.009;orb.ph=clamp(orb.ph-dy*.009,.12,2.95)}}else if(ptrs.size===2)orb.r=clamp(r0*pd0/pdist(),12,60)});
  const up=e=>{if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);if(e.type==='pointerup'&&ptrs.size===0&&moved<6)pickAt(e.clientX,e.clientY)};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('wheel',e=>{e.preventDefault();orb.r=clamp(orb.r*(1+e.deltaY*.0012),12,60);goal=null},{passive:false});
  el.addEventListener('dblclick',()=>api.setView('home'));
  const ray=new THREE.Raycaster(),v2=new THREE.Vector2();
  function pickAt(cx,cy){const b=el.getBoundingClientRect();v2.set((cx-b.left)/b.width*2-1,-(cy-b.top)/b.height*2+1);ray.setFromCamera(v2,camera);const h=ray.intersectObject(root,true)[0];api.onPick&&api.onPick(h?h.object.userData.cid:null)}

  // 高亮、选中、标签、提示气泡
  let hl=[],sel=null,showAll=false,note='',noteStyle='pulse';const ACC=new THREE.Color(0xF28B26);
  api.highlight=(ids,n,style)=>{hl=[].concat(ids||[]);note=n||'';noteStyle=style||'pulse';callout.textContent=note;callout.className=noteStyle==='arrow'?'arrow':'';callout.hidden=!note||!hl.length};
  api.clear=()=>{hl=[];note='';callout.hidden=true};
  api.select=id=>{sel=id};
  api.labels=on=>{showAll=on};
  api.anchorOf=id=>ctl[id]?ctl[id].anchor:null;
  function emissive(now){for(const id in ctl){const c=ctl[id];let k=0;if(hl.includes(id))k=.32+.3*Math.sin(now*.007);else if(id===sel)k=.3;if(Math.abs(c.k-k)>.004){c.mats.forEach(m=>{if(m.emissive)m.emissive.copy(ACC).multiplyScalar(k)});c.k=k}}}
  const pv=V(),cv=V();
  function overlay(w,h){camera.getWorldPosition(cv);
    for(const id in lbs){const c=ctl[id],d=lbs[id],on=showAll||hl.includes(id);if(!on){if(!d.hidden)d.hidden=true;continue}
      pv.copy(c.anchor);const facing=c.face.dot(cv.clone().sub(c.anchor))>-.5;pv.project(camera);
      const vis=facing&&pv.z<1&&Math.abs(pv.x)<1.05&&Math.abs(pv.y)<1.05;d.hidden=!vis||(hl.includes(id)&&note&&id===hl[0]);if(!vis)continue;
      d.style.left=((pv.x+1)/2*w).toFixed(1)+'px';d.style.top=((1-pv.y)/2*h).toFixed(1)+'px';d.classList.toggle('hl',hl.includes(id))}
    if(note&&hl.length&&ctl[hl[0]]){pv.copy(ctl[hl[0]].anchor).project(camera);callout.style.left=((pv.x+1)/2*w).toFixed(1)+'px';callout.style.top=((1-pv.y)/2*h).toFixed(1)+'px'}}

  // 动画
  const tweens=[];
  function tw(o,k,to,dur=320,delay=0){for(let i=tweens.length-1;i>=0;i--)if(tweens[i].o===o&&tweens[i].k===k&&!delay)tweens.splice(i,1);tweens.push({o,k,from:null,to,t0:performance.now()+delay,dur})}
  function stepTw(now){for(let i=tweens.length-1;i>=0;i--){const w=tweens[i];if(now<w.t0)continue;if(w.from===null)w.from=w.o[w.k];const u=Math.min(1,(now-w.t0)/w.dur),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;w.o[w.k]=w.from+(w.to-w.from)*e;if(u>=1)tweens.splice(i,1)}}
  const DIALSTEP=PI/12;
  api.anim=(id,kind,dir=1)=>{const p=parts[id];if(!p)return;const o=p.obj;
    if(kind==='rotate'){if(id==='wheel'||id.startsWith('ring_'))tw(o.rotation,'z',o.rotation.z-dir*DIALSTEP,260);else tw(o.rotation,'y',o.rotation.y-dir*DIALSTEP,260)}
    else if(kind==='nudge'){const y=o.rotation.y;tw(o.rotation,'y',y-.05,90);tw(o.rotation,'y',y,120,95)}
    else if(kind==='press'){if(p.objs){p.objs.forEach(g=>{tw(g.scale,'z',.6,110);tw(g.scale,'z',1,160,130)});return}const ax=p.axis==='y'?'y':'z';if(id==='joystick'||id==='btn_center'||p.base!==undefined){const b=p.base!==undefined?p.base:o.position[ax];tw(o.position,ax,b-.1,110);tw(o.position,ax,b,170,140)}}
    else if(kind==='tilt'){const[a,s]=dir;tw(o.rotation,a,s*.35,120);tw(o.rotation,a,0,160,150)}};
  api.sync=()=>{if(parts.mode_dial)tw(parts.mode_dial.obj.rotation,'y',st.modeI*STEP,420);
    tw(parts.mode_switch.obj.rotation,'y',-MSW.indexOf(st.msw)*.32,300);
    tw(parts.ring_aperture.obj.rotation,'z',-((st.apRing-7)*AD),380);
    tw(parts.ring_zoom.obj.rotation,'z',-ZD[FOCALS.indexOf(st.focal)],420);
    tw(parts.sw_focus_mode.knob.position,'y',st.lensAF?.16:-.16,200);tw(parts.sw_iris_lock.knob.position,'y',st.irisLock?.16:-.16,200);
    tw(parts.sw_click.knob.position,'y',st.click?.16:-.16,200);tw(parts.sw_zoom_smooth.knob.position,'y',st.zoomSmooth==='SMOOTH'?.16:-.16,200);
    tw(parts.power.obj.rotation,'y',st.power?0:.45,220)};
  api.redraw=()=>{drawScreen(sctx,1024,683);scrTex.needsUpdate=true};

  // 舞台在「相机」页和对话里的 3D 卡片之间移动，共用一个 WebGL 上下文
  let lw=0,lh=0;
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(w&&h&&(w!==lw||h!==lh)){lw=w;lh=h;renderer.setSize(w,h,false);aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix()}}
  api.mount=host=>{if(stage.parentNode!==host)host.appendChild(stage);lw=0};
  api.snapshot=()=>{try{resize();applyCam();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/jpeg',.86)}catch(e){return null}};
  let lastScr=0;
  function frame(now){requestAnimationFrame(frame);if(!stage.isConnected||stage.offsetParent===null)return;resize();if(!lw)return;
    if(goal)stepGoal(now);stepTw(now);emissive(now);applyCam();
    if(st.chg&&now-st.chgT<1500&&now-lastScr>120){api.redraw();lastScr=now}else if(expo().warn&&now-lastScr>400){api.redraw();lastScr=now}
    renderer.render(scene,camera);overlay(lw,lh)}
  api.sync();api.redraw();applyCam();requestAnimationFrame(frame);
  return api;
})();

/* ---------- 操作部件：更新虚拟相机状态 + 播放动画 ---------- */
let onCamState=()=>{};
function chg(k){st.chg=k;st.chgT=performance.now()}
function stepAv(d){st.av=APS[clamp(APS.indexOf(st.av)+d,0,APS.length-1)];chg('av')}
function stepTv(d){st.tvI=clamp(st.tvI+d,0,TV3L.length-1);chg('tv')}
function cyc(arr,v,d=1){return arr[(arr.indexOf(v)+d+arr.length)%arr.length]}

function choose(title,options,current,apply){
  st.picker={title,options,index:Math.max(0,options.indexOf(current)),apply};
}
function moveSelection(id,op){
  const p=st.picker;
  if(id==='btn_center'||(id==='joystick'&&op==='click')){
    st.picker=null;p.apply(p.options[p.index]);return true;
  }
  if(id!=='wheel'&&id!=='joystick')return false;
  const delta=['up','left','minus'].includes(op)?-1:1;
  p.index=(p.index+delta+p.options.length)%p.options.length;
  return true;
}
function setFocusArea(area){st.area=area;st.fp=[0,0];chg('area')}
function pickISO(){
  const values=['AUTO',...ISO3];
  choose('ISO',values,st.isoI<0?'AUTO':ISO3[st.isoI],v=>{st.isoI=ISO3.indexOf(v);chg('iso')});
}
function focusBriefly(){
  st.half=effFm()!=='MF';clearTimeout(focusBriefly.timer);
  focusBriefly.timer=setTimeout(()=>{st.half=false;Cam.redraw()},900);
}
function confirmDelete(){
  const photo=st.photos[st.photoIndex];
  if(!photo)return '尚无照片';
  if(photo.protected)return '照片受保护，先解除保护才能删除';
  choose('删除当前照片？',['删除','取消'],'取消',value=>{
    if(value==='删除'){
      st.photos.splice(st.photoIndex,1);st.shots++;
      st.photoIndex=Math.max(0,Math.min(st.photoIndex,st.photos.length-1));st.playZoom=1;
    }
  });
  return '';
}
function turnWheel(op){
  const dir=['up','left','minus'].includes(op)?-1:1;
  if(st.overlay==='menu'){st.menuTab=(st.menuTab+dir+MENU_TABS.length)%MENU_TABS.length;return ''}
  if(st.overlay==='fn')return 'Fn 示意图展示 12 格布局';
  if(st.overlay==='play'){
    if(st.playZoom>1&&['plus','minus'].includes(op)){st.playZoom=clamp(st.playZoom+dir,1,8);return ''}
    if(st.photos.length&&['left','right','plus','minus'].includes(op)){
      st.photoIndex=(st.photoIndex+dir+st.photos.length)%st.photos.length;st.playZoom=1;
    }
    return '';
  }
  if(op==='up'){st.disp=(st.disp+1)%4;return 'DISP：'+DISPN[st.disp]}
  if(op==='left'){
    if(st.msw==='照片')choose('拍摄模式',DRIVES,st.drive,v=>{
      if(v==='连拍')choose('连拍速度',['Hi+','Hi','Mid','Lo'],st.contSpeed,speed=>{st.drive=v;st.contSpeed=speed;chg('drive')});
      else{st.drive=v;chg('drive')}
    });
    else choose('自拍定时',['开','关'],st.movieTimer,v=>{
      if(v==='开')choose('录制开始延迟',['3秒','5秒','10秒'],st.movieDelay,delay=>{st.movieTimer=v;st.movieDelay=delay});
      else st.movieTimer=v;
    });
    return '';
  }
  if(op==='right'){if(effMode()==='AUTO')return '智能自动使用 ISO AUTO';pickISO();return ''}
  return '拍摄时此操作出厂未设定';
}
/* op: click（点模型或按钮）/ plus / minus / up / down / left / right / lock */
function act(id,op='click'){
  const dir=op==='minus'||op==='left'?-1:1,m=effMode();let msg='';
  if(!st.power&&!['power','card_door','battery_door','ports','hotshoe','lens_release'].includes(id)&&!id.startsWith('ring_')&&!id.startsWith('sw_')){msg='相机电源是关的，先打开电源开关';id='_'}
  if(st.picker){
    if(moveSelection(id,op)){Cam.redraw();onCamState(id);return}
    st.picker=null;
  }
  switch(id){
    case 'power':st.power=!st.power;msg=st.power?'电源已打开':'电源已关闭';break;
    case 'shutter':{
      Cam.anim(id,'press');st.overlay=null;focusBriefly();
      if(op==='half'){msg='半按快门，看左下对焦指示';break}
      const r=expo();
      st.photos.push({N:r.N,t:r.t,iso:r.iso,focal:st.focal,bias:r.bias,fp:st.half&&movableArea()?[...st.fp]:null});
      st.photoIndex=st.photos.length-1;st.playZoom=1;st.shots--;st.flash=1;
      setTimeout(()=>{st.flash=0;Cam.redraw();onCamState()},160);msg='已拍摄，可按回放键查看';break}
    case 'dial_front':Cam.anim(id,'rotate',dir);
      if(m==='A'||m==='M'){if(st.apRing===7)stepAv(dir);else msg='光圈由镜头光圈环控制'}
      else if(m==='S')stepTv(dir);else msg=m==='P'?'P 档的转盘功能是程序偏移':'智能自动由相机选择曝光';break;
    case 'dial_rear_l':Cam.anim(id,'rotate',dir);if(st.overlay==='menu'){st.menuTab=(st.menuTab+dir+7)%7;break}
      if(m==='S'||m==='M')stepTv(dir);else if(m==='A'){if(st.apRing!==7){msg='光圈环不在 A 档';break}stepAv(dir)}else msg='当前模式下由相机自动决定';break;
    case 'dial_rear_r':if(op==='lock'){st.rLock=!st.rLock;Cam.anim(id,'nudge');msg=st.rLock?'后拨盘 R 已锁定':'后拨盘 R 已解锁';break}
      if(st.rLock){Cam.anim(id,'nudge');msg='后拨盘 R 锁着，先按中间的锁定钮';break}
      if(!canCompensate()){msg=m==='AUTO'?'智能自动无法调曝光补偿':'M 档调曝光补偿需要 ISO AUTO';break}
      Cam.anim(id,'rotate',dir);st.ev=clamp(Math.round((st.ev+dir/3)*3)/3,-5,5);chg('ev');break;
    case 'mode_dial':st.modeI=(st.modeI+dir+8)%8;chg('mode');msg='拍摄模式：'+MODE_NAMES[MODES[st.modeI]];break;
    case 'mode_switch':st.msw=cyc(MSW,st.msw,dir);st.overlay=null;msg='按住前方解锁钮转到'+st.msw;break;
    case 'btn_c1':Cam.anim(id,'press');if(m==='AUTO'){msg='智能自动使用自动白平衡';break}
      choose('白平衡模式',WBS,st.wb,v=>{st.wb=v;chg('wb')});break;
    case 'btn_c2':Cam.anim(id,'press');if(m==='AUTO'){msg='智能自动的对焦区域固定为广域';break}
      choose('对焦区域',Object.values(areaNames).filter(v=>canTrack()||!v.startsWith('跟踪')),effArea(),setFocusArea);break;
    case 'btn_c3':Cam.anim(id,'press');
      if(st.overlay==='play'){const p=st.photos[st.photoIndex];if(p)p.protected=!p.protected;msg=p?(p.protected?'照片已保护':'已解除保护'):'尚无照片';break}
      if(!st.lensAF){msg='镜头上的开关在 MF，先拨回 AF';break}
      choose('对焦模式',st.msw==='照片'?FMS:['AF-C','MF'],effFm(),v=>{if(st.msw==='照片')st.fm=v;else st.movieFm=v;chg('fm')});break;
    case 'btn_c4':Cam.anim(id,'press');
      if(st.overlay==='play'){msg=confirmDelete();break}
      st.touch=!st.touch;msg='触摸操作选择：'+(st.touch?'开':'关');break;
    case 'btn_ael':Cam.anim(id,'press');if(st.overlay==='play'){msg='回放时 AEL 为影像索引';break}
      st.ael=op!=='release';msg=st.ael?'按住期间锁定曝光':'已松开，曝光锁定解除';break;
    case 'btn_afon':Cam.anim(id,'press');
      if(st.overlay==='play'){if(st.photos.length)st.playZoom=clamp(st.playZoom*2,1,8);msg=st.photos.length?'回放放大':'尚无照片';break}
      focusBriefly();msg='AF-ON：启动自动对焦';break;
    case 'btn_menu':Cam.anim(id,'press');st.overlay=st.overlay==='menu'?null:'menu';break;
    case 'btn_fn':Cam.anim(id,'press');if(st.overlay==='fn')st.overlay=st.fnFrom;else{st.fnFrom=st.overlay==='play'?'play':null;st.overlay='fn'}break;
    case 'btn_play':Cam.anim(id,'press');st.overlay=st.overlay==='play'?null:'play';st.playZoom=1;break;
    case 'btn_movie':Cam.anim(id,'press');msg='原型里不录像。真机按一下开始，再按一下停止';break;
    case 'btn_center':Cam.anim(id,'press');if(st.overlay==='fn')st.overlay=st.fnFrom;else if(st.overlay==='menu')st.overlay=null;
      else if(st.overlay==='play')st.playZoom=1;else msg='拍摄时中央按钮出厂未设定';break;
    case 'joystick':{const mv={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[op];
      if(st.overlay==='menu'&&mv){st.menuTab=(st.menuTab+mv[1]+7)%7;Cam.anim(id,'tilt',['x',mv[1]*-1]);break}
      if(st.overlay)break;
      if(!mv){Cam.anim(id,'press');
        if(movableArea()){if(effArea().startsWith('跟踪')&&st.half){msg='对焦标准：回到跟踪对象'}else{st.fp=[0,0];msg='对焦标准：框回到中央'}}
        else if(effFm()!=='MF'){focusBriefly();msg='对焦标准：对画面中央自动对焦'}
        break}
      Cam.anim(id,'tilt',[mv[0]?'y':'x',mv[0]||-mv[1]]);if(!movableArea()){msg='这个区域固定，可选「区」或「点: M」后移动';break}
      st.fp=[clamp(st.fp[0]+mv[0],-3,3),clamp(st.fp[1]+mv[1],-2,2)];break}
    case 'wheel':
      if(op==='plus'||op==='minus')Cam.anim(id,'rotate',dir);
      msg=turnWheel(op);break;
    case 'ring_zoom':st.focal=cyc(FOCALS,st.focal,dir);chg('focal');msg='焦距：'+st.focal+'mm';break;
    case 'ring_focus':Cam.anim(id,'rotate',dir);msg=effFm()==='MF'||effFm()==='DMF'?'手动对焦中：画面会自动放大方便对焦':'现在是 '+effFm()+'，转对焦环不起作用（可在菜单里改）';break;
    case 'ring_aperture':{const n=(st.apRing+dir+8)%8;
      if(st.irisLock&&(st.apRing===7||n===7)){msg=st.apRing===7?'光圈环锁在 A':'光圈环限于 F2.8–F22，松开后可回 A';break}
      st.apRing=n;chg('av');msg=n===7?'光圈环在 A：由机身前拨盘控制光圈':'光圈环设为 F'+AP_RING[n]+'，前拨盘不再调光圈';break}
    case 'sw_iris_lock':st.irisLock=!st.irisLock;msg=st.irisLock?(st.apRing===7?'锁定在 A':'锁定在 F2.8–F22 范围内'):'光圈锁已松开';break;
    case 'sw_click':st.click=!st.click;msg=st.click?'段落感 ON：转光圈环有咔哒声':'段落感 OFF：适合录像时无级调光圈';break;
    case 'sw_focus_mode':st.lensAF=!st.lensAF;chg('fm');msg=st.lensAF?'镜头开关：AF':'镜头开关：MF，用对焦环手动对焦';break;
    case 'btn_focus_hold':Cam.anim(id,'press');msg='按住时对焦距离保持不变';break;
    case 'sw_zoom_smooth':st.zoomSmooth=st.zoomSmooth==='SMOOTH'?'TIGHT':'SMOOTH';msg='变焦手感：'+st.zoomSmooth;break;
    case 'diopter':Cam.anim(id,'rotate',dir);msg='看着取景器里的文字转到最清楚';break;
    case 'lcd':break;
    case '_':break;
    default:msg=CONTROLS[id]?CONTROLS[id].f:'';
  }
  Cam.sync();Cam.redraw();onCamState(id);if(msg)toast(msg);
}

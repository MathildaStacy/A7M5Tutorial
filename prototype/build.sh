#!/bin/sh
# 把 src/ 拼成 app.html（发布用，无 doctype）和 index.html（本地双击打开）
set -e
cd "$(dirname "$0")"
{
  cat src/1-shell.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
  echo '<script>'
  echo '(function(){function boot(){'
  node <<'JS'
const fs = require('node:fs');
const { controls } = require('../docs/spec/controls.json');
const kb = require('../docs/spec/manual-kb.json');
const details = Object.fromEntries(controls.map(c => [c.id, {
  n: c.name, p: c.where, f: c.default_function, t: c.beginner_tip, positions: c.positions
}]));
for (const [name, value] of Object.entries({ CONTROLS: details, MANUAL: kb })) {
  console.log('const ' + name + ' = ' + JSON.stringify(value).replace(/</g, '\\u003c') + ';');
}
// 同一段参考算法用于本地检索验收和可离线打开的原型。
const checker = fs.readFileSync('../scripts/check-manual-kb.cjs', 'utf8');
const shared = checker.match(/^\/\/ BEGIN manual-kb reference search$([\s\S]*?)^\/\/ END manual-kb reference search$/m);
if (!shared) throw new Error('缺少知识库检查脚本的参考检索函数');
console.log(shared[1]);
JS
  cat src/2-camera.js src/3-app.js
  echo '}var started=false;function start(){if(started)return;started=true;boot()}'
  echo 'try{Promise.all([document.fonts.load("700 40px \"Saira Semi Condensed\""),document.fonts.load("600 40px \"Saira Semi Condensed\""),document.fonts.load("500 16px \"Noto Sans SC\"")]).then(start,start)}catch(e){start()}setTimeout(start,1800)})();'
  echo '</script>'
} > app.html
{
  echo '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}</style></head><body>'
  cat app.html
  echo '</body></html>'
} > index.html

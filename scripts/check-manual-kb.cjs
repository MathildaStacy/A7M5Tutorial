'use strict';

const fs = require('node:fs');
const path = require('node:path');

const groups = {
  basic: [
    'language date_time beep touch_ops',
    'initialize power_save monitor_brightness finder_monitor_switch firmware_version',
  ],
  body: ['battery diopter ports card_slots', 'hot_shoe usb_connection smartphone_transfer'],
  media: ['format file_format release_wo_card rec_media', 'jpeg_quality_size raw_type'],
  exposure: [
    'shooting_mode intelligent_auto iso iso_auto_min_ss exposure_comp exposure_warning metering_mode face_priority_metering dro_hdr histogram long_exposure_nr high_iso_nr',
    'program_shift ae_lock zebra anti_flicker exposure_step bulb',
  ],
  focus: [
    'focus_mode focus_area subject_recognition recognition_part af_confirm focus_frame_move af_on focus_magnifier',
    'mf_assist peaking touch_focus af_priority af_tracking_sens af_illuminator',
  ],
  drive: ['drive_mode shutter_type image_stabilization', 'self_timer bracket'],
  color: ['white_balance', 'creative_look color_space awb_priority'],
  display: ['disp', 'grid_line level live_view_display'],
  playback: ['playback_basic playback_zoom delete', 'protect rating'],
  custom: ['custom_keys fn_menu', 'my_menu dial_setup shoot_setting_memory'],
  lens: [
    'lens_mount lens_aperture_ring lens_focus_mode_switch lens_focus_hold lens_zoom_smooth_tight lens_min_focus',
    'lens_filter_hood',
  ],
};

// BEGIN manual-kb reference search
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

// END manual-kb reference search

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(string);
const length = value => typeof value === 'string' ? [...value].length : 0;
const idPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const sonyUrl = /^https:\/\/([a-z0-9-]+\.)*sony\.(net|com|com\.cn|jp)\//;

function validPath(value) {
  if (!string(value)) return false;
  const parts = value.split(' › ');
  return parts[0] === 'MENU' && parts.length >= 2
    && parts.every(part => part && part.trim() === part && !/[›>\r\n]/.test(part));
}

function verify(kb, controls, cases) {
  const errors = [];
  const warnings = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  const url = value => string(value) && sonyUrl.test(value)
    && (!/\.pdf(?:$|[?#])/i.test(value) || /#page=[1-9]\d*$/.test(value));
  check(kb?.version === 1, 'version 必须为 1');
  check(kb?.camera?.model === 'ILCE-7M5' && sonyUrl.test(kb.camera.guide_url)
    && kb.camera.guide_lang === 'zh-cn'
    && (kb.camera.guide_version === null || string(kb.camera.guide_version)), 'camera 型号、指南或版本无效');
  check(kb?.lens?.model === 'SEL2470GM2' && sonyUrl.test(kb.lens.guide_url), 'lens 型号或指南无效');
  const date = kb?.retrieved_at;
  check(typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && !isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date, 'retrieved_at 日期无效');
  for (const key of ['entries', 'menu_index', 'missing']) check(Array.isArray(kb?.[key]), key + ' 必须是数组');
  check(Array.isArray(controls) && controls.every(c => object(c) && string(c.id)), 'controls.json 结构错误');
  check(Array.isArray(cases) && cases.length > 0, '检索用例缺失');
  if (errors.length) return { errors, warnings };

  const required = new Map();
  for (const [category, priorities] of Object.entries(groups)) {
    priorities.forEach((ids, index) => ids.split(' ').forEach(id => required.set(id, { category, priority: 'P' + index })));
  }

  const controlIds = new Set(controls.map(c => c.id));
  const ids = new Set();
  const missingIds = new Set();
  const paths = new Set();
  for (const [i, m] of kb.menu_index.entries()) {
    if (!object(m)) { errors.push('menu_index[' + i + '] 必须是对象'); continue; }
    check(validPath(m.path) && validPath(m.path_en), '菜单路径格式无效 ' + i);
    check(string(m.summary) && length(m.summary) <= 30, '菜单说明须为 1–30 字 ' + i);
    check(url(m.source_url), '菜单来源无效 ' + i);
    paths.add(JSON.stringify([m.path, m.path_en]));
  }

  for (const [i, e] of kb.entries.entries()) {
    if (!object(e)) { errors.push('entries[' + i + '] 必须是对象'); continue; }
    const at = e.id || 'entries[' + i + ']';
    check(string(e.id) && idPattern.test(e.id) && !ids.has(e.id), at + ' id 无效或重复');
    ids.add(e.id);
    const expected = required.get(e.id);
    check(Object.hasOwn(groups, e.category) && (!expected || e.category === expected.category), at + ' category 错误');
    check(e.priority === (expected?.priority || 'P1'), at + ' priority 错误');
    check(string(e.title) && length(e.title) <= 20, at + ' title 须为 1–20 字');
    check(string(e.text) && length(e.text) >= 20 && length(e.text) <= 150, at + ' text 须为 20–150 字');
    for (const key of ['keywords', 'options', 'conditions', 'controls', 'related', 'other_access']) {
      check(strings(e[key]), at + ' ' + key + ' 必须是非空字符串组成的数组');
    }
    check(Array.isArray(e.keywords) && e.keywords.length >= 3 && e.keywords.length <= 12, at + ' keywords 须为 3–12 个');
    check(e.default === null || string(e.default), at + ' default 应为字符串或 null');
    check(string(e.menu_path) || e.other_access?.length > 0 || e.controls?.length > 0, at + ' 缺少进入方式');
    if (e.menu_path === null) check(e.menu_path_en === null, at + ' 缺少配对的 null 路径');
    else check(validPath(e.menu_path) && validPath(e.menu_path_en)
      && paths.has(JSON.stringify([e.menu_path, e.menu_path_en])), at + ' 中英文菜单路径未成对收录');
    if (strings(e.controls)) for (const id of e.controls) check(controlIds.has(id), at + ' 未知部件 ' + id);
    check(url(e.source?.url) && string(e.source?.title), at + ' 来源无效');
  }
  for (const e of kb.entries) if (strings(e?.related)) {
    for (const id of e.related) check(ids.has(id), e.id + ' 未知关联条目 ' + id);
  }
  for (const m of kb.missing) {
    if (!object(m)) { errors.push('missing 项必须是对象'); continue; }
    check(required.has(m.id) && !missingIds.has(m.id) && !ids.has(m.id)
      && string(m.reason), 'missing 项无效、重复或与 entries 冲突 ' + m.id);
    missingIds.add(m.id);
  }
  for (const [id, { priority }] of required) {
    if (!ids.has(id) && !missingIds.has(id)) errors.push('缺少 ' + priority + ' ' + id);
    if (priority === 'P0' && missingIds.has(id)) warnings.push('P0 列入 missing ' + id);
  }

  let passed = 0;
  if (!errors.length) {
    for (const test of cases) {
      if (!string(test?.query) || !strings(test?.expect) || !test.expect.length) {
        errors.push('检索用例格式错误 ' + JSON.stringify(test));
        continue;
      }
      const hits = search(kb, test.query).map(hit => hit.id);
      if (test.expect.some(id => hits.includes(id))) passed++;
      else errors.push('检索失败「' + test.query + '」期望 ' + test.expect.join('/') + '，实际 ' + hits.join('/'));
    }
  }
  return { errors, warnings, passed };
}

function main() {
  const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/spec', file), 'utf8'));
  const kb = read('manual-kb.json');
  const cases = read('manual-kb.tests.json').cases;
  const { errors, warnings, passed } = verify(kb, read('controls.json').controls, cases);
  for (const warning of warnings) console.warn('警告 ' + warning);
  for (const error of errors) console.error('错误 ' + error);
  if (errors.length) { process.exitCode = 1; return; }
  const p0 = kb.entries.filter(e => e.priority === 'P0').length;
  console.log(`条目 ${kb.entries.length}（P0 ${p0} / P1 ${kb.entries.length - p0}）`);
  console.log(`menu_index ${kb.menu_index.length}，missing ${kb.missing.length}，default 为 null ${kb.entries.filter(e => e.default === null).length}`);
  console.log(`检索用例通过 ${passed}/${cases.length}`);
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { search, verify };

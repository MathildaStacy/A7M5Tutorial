import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {act, create, type ReactTestInstance, type ReactTestRenderer} from 'react-test-renderer';
import {CoachMarkdown} from '../src/ui/CoachMarkdown';

let view: ReactTestRenderer;
function visibleText(node: ReactTestInstance | string): string {
  return typeof node === 'string' ? node : node.children.map(visibleText).join('');
}
async function render(text: string) {
  await act(async () => {
    const message = React.createElement(CoachMarkdown, {text});
    if (view) view.update(message);
    else view = create(message);
  });
  return view.root.findAllByType(Text);
}
afterAll(async () => {
  if (view) await act(async () => view.unmount());
});

test('中文标点两侧的强调在流式更新后生效，代码与转义星号按原文显示', async () => {
  await render('**怎么调：');
  const nodes = await render(
    '**怎么调：**在拍照状态下，按 C3 → 选**「连续 AF」**模式。\n\n`**原样**` 和 \\*星号\\*',
  );
  const strong = nodes.filter((n) => StyleSheet.flatten(n.props.style)?.fontWeight === '700');
  expect(strong.map(visibleText)).toEqual(['怎么调：', '「连续 AF」']);
  const text = visibleText(view.root);
  expect(text).toContain('**原样**');
  expect(text).toContain('*星号*');
  expect(text).not.toContain('**怎么调');
});

test('表格单元里的换行和实体、任务列表的标记以及带围栏的代码', async () => {
  const nodes = await render(
    '## 练习\n\n| 参数 | 调整 |\n| --- | --- |\n| A &amp; S | 半按<br/>再全按 |\n\n- [x] 调焦\n  - [ ] 半按\n\n```text\n**照抄**\n```',
  );
  const text = visibleText(view.root);
  expect(nodes.some((n) => n.props.accessibilityRole === 'header')).toBe(true);
  expect(text).toContain('A & S');
  expect(text).toContain('半按\n再全按');
  expect(text.match(/☑/g)).toHaveLength(1);
  expect(text.match(/☐/g)).toHaveLength(1);
  expect(text).toContain('**照抄**');
});

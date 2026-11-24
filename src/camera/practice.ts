import {controls} from './controls';
export interface Practice {
  questions: string[];
  index: number;
  score: number;
  started: number;
  ended: number | null;
  feedback: string;
}
export function startPractice(now = Date.now(), random = Math.random): Practice {
  const ids = controls.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return {questions: ids.slice(0, 10), index: 0, score: 0, started: now, ended: null, feedback: ''};
}
export function answerPractice(p: Practice, id: string, now = Date.now()): Practice {
  if (p.ended !== null) return p;
  const target = p.questions[p.index],
    correct = target === id,
    index = p.index + 1;
  return {
    ...p,
    index,
    score: p.score + Number(correct),
    ended: index === p.questions.length ? now : null,
    feedback: correct
      ? '上一题答对了'
      : '上一题点错了，目标是' + controls.find((c) => c.id === target)!.name,
  };
}

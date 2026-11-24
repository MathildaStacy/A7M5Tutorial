import manual from '../../../docs/spec/manual-kb.json';

const norm = (s: string | null | undefined) =>
  (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s·・\-_/()（）「」"'.,，。、:：;；!?！？›>]+/g, '');
const grams = (s: string) => {
  const g = new Set<string>();
  if (s.length === 1) g.add(s);
  for (let i = 0; i + 2 <= s.length; i++) g.add(s.slice(i, i + 2));
  return g;
};
const overlap = (a: Set<string>, b: Set<string>) => {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
};

export function search(kb: typeof manual, query: string, k = 3) {
  const q = norm(query);
  if (!q) return [];
  const qg = grams(q);
  const docs = [
    ...kb.entries.map((e) => ({
      id: e.id,
      title: e.title,
      keywords: e.keywords,
      head: [e.title, ...e.keywords, e.menu_path, e.menu_path_en].join('|'),
      body: e.text,
      where: [e.menu_path, ...e.other_access].filter(Boolean).join('；'),
      text: e.text,
    })),
    ...kb.menu_index.map((m, i) => ({
      id: 'menu#' + i,
      title: m.path.split(' › ').pop()!,
      keywords: [],
      head: [m.path, m.path_en].join('|'),
      body: m.summary,
      where: m.path,
      text: m.summary,
    })),
  ];
  return docs
    .map((d) => {
      const t = norm(d.title);
      let s = 0;
      if (t === q) s += 20;
      else if (t && (t.includes(q) || q.includes(t))) s += 10;
      for (const kw of d.keywords.map(norm)) if (kw && (q.includes(kw) || kw.includes(q))) s += 6;
      s += 2 * overlap(qg, grams(norm(d.head))) + 0.5 * overlap(qg, grams(norm(d.body)));
      return {d, s};
    })
    .filter((x) => x.s >= 4)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map(({d}) => ({id: d.id, title: d.title, where: d.where, text: d.text}));
}

export const lookupManual = (query: string) => search(manual, query);

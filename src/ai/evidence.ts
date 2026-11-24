import type {ModelProgress, Protocol} from './types';
export function evidenceOf(protocol: Protocol, json: any): ModelProgress {
  const parts: any[] = protocol === 'anthropic' ? json?.content ?? [] : json?.output ?? [];
  const texts = parts
    .flatMap((p) =>
      p.type === 'thinking'
        ? [p.thinking]
        : p.type === 'reasoning'
        ? p.summary?.map((s: any) => s.text) ?? []
        : [],
    )
    .filter(Boolean);
  return texts.length ? {thinking: texts.join('\n')} : {};
}

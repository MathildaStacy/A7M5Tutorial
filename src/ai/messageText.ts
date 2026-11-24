export function contentText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (part?.type === 'text' || part?.type === 'output_text') {
        return typeof part.text === 'string' ? part.text : '';
      }
      return part?.type === 'refusal' && typeof part.refusal === 'string' ? part.refusal : '';
    })
    .join('');
}

/** 中转服务的字符串 / text 块转换成可重放的 Responses 正文，保留其他原始字段。 */
export function normalizeResponseItem(item: any): any {
  if (item?.type !== 'message') return item;
  const content =
    typeof item.content === 'string'
      ? [{type: 'output_text', text: item.content}]
      : Array.isArray(item.content)
      ? item.content.map((p: any) => (p?.type === 'text' ? {...p, type: 'output_text'} : p))
      : [];
  return {...item, content};
}

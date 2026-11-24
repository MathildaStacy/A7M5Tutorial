export type Protocol = 'anthropic' | 'openai';
export type Effort = 'low' | 'medium' | 'high';
export type Compat = 'strict' | 'display' | 'fallbacks' | 'beta' | 'cache' | 'effort';
export interface AiService {
  id: string;
  protocol: Protocol;
  baseUrl: string;
  model: string;
  effort: Effort;
  disabled: Compat[];
}
export type Part =
  | {t: 'text'; text: string}
  | {t: 'image'; mediaType: 'image/jpeg'; ref: string}
  | {t: 'call'; id: string; name: string; args: string}
  | {t: 'result'; id: string; name: string; output: string; isError?: boolean};
export interface RawOutput {
  protocol: Protocol;
  model: string;
  items: unknown[];
  providerId?: string;
}
export interface StoredMessage {
  role: 'user' | 'assistant' | 'tool';
  parts: Part[];
  raw?: RawOutput;
}
export interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cacheReported: boolean;
}
export interface ModelProgress {
  thinking?: string;
}

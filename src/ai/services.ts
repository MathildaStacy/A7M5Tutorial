import * as Keychain from 'react-native-keychain';
import {db, readSetting, writeSetting} from '../data/db';
import {endpointOf} from './protocol';
import type {AiService, Protocol} from './types';
export const defaults = {
  anthropic: {baseUrl: 'https://api.anthropic.com', model: 'claude-opus-5-5'},
  openai: {baseUrl: 'https://api.openai.com', model: 'gpt-5.5'},
};
export function serviceId(protocol: Protocol, base: string) {
  return protocol + '@' + endpointOf(protocol, base);
}
function savedService(id: string): AiService | undefined {
  const config = db().executeSync('SELECT config FROM services WHERE id=?', [id]).rows[0]?.config;
  return typeof config === 'string' ? JSON.parse(config) : undefined;
}
export function loadService(protocol: Protocol): AiService {
  const id = readSetting('service-' + protocol, serviceId(protocol, defaults[protocol].baseUrl));
  return savedService(id) ?? {id, protocol, ...defaults[protocol], effort: 'medium', disabled: []};
}
export const readProtocol = () => readSetting<Protocol>('protocol', 'anthropic');
export const localService = (s: AiService) =>
  /^http:\/\/(10\.0\.2\.2|localhost|127\.0\.0\.1)(:|\/|$)/.test(s.baseUrl);
const keyOptions = (id: string) => ({service: 'com.shutteracademy.ai.' + id});
export async function readKey(id: string) {
  const result = await Keychain.getGenericPassword(keyOptions(id));
  return result ? result.password : '';
}
function writeService(s: AiService) {
  db().executeSync('INSERT OR REPLACE INTO services(id,config) VALUES(?,?)', [
    s.id,
    JSON.stringify(s),
  ]);
}
// A fallback from an older in-flight request must not undo a newer model selection.
export function rememberCompatibility(s: AiService) {
  const saved = savedService(s.id) ?? s;
  if (saved.model === s.model)
    writeService({
      ...saved,
      disabled: [...new Set([...saved.disabled, ...s.disabled])],
    });
}
export const rememberedModels = (id: string) => readSetting<string[]>('model-list-' + id, []);
export const rememberModels = (id: string, models: string[]) =>
  writeSetting('model-list-' + id, [...new Set(models.filter(Boolean))]);
export async function saveService(s: AiService, key: string) {
  const id = serviceId(s.protocol, s.baseUrl);
  if (!s.model.trim()) throw new Error('请输入模型名称');
  const updated = {
    ...s,
    id,
    baseUrl: s.baseUrl.trim(),
    model: s.model.trim(),
    disabled: s.id === id && savedService(id)?.model === s.model.trim() ? s.disabled : [],
  };
  if (key.trim()) {
    const saved = await Keychain.setGenericPassword('api', key.trim(), keyOptions(id));
    if (!saved) throw new Error('API Key 保存失败');
  }
  writeService(updated);
  rememberModels(id, [updated.model, ...rememberedModels(id)]);
  writeSetting('service-' + s.protocol, id);
  writeSetting('protocol', s.protocol);
  return updated;
}

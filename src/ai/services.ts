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
export function loadService(protocol: Protocol): AiService {
  const id = readSetting('service-' + protocol, serviceId(protocol, defaults[protocol].baseUrl));
  const json = db().executeSync('SELECT config FROM services WHERE id=?', [id]).rows[0]?.config;
  return typeof json === 'string'
    ? JSON.parse(json)
    : {id, protocol, ...defaults[protocol], effort: 'medium', disabled: []};
}
export const readProtocol = () => readSetting<Protocol>('protocol', 'anthropic');
const keyOptions = (id: string) => ({service: 'com.shutteracademy.ai.' + id});
export async function readKey(id: string) {
  const result = await Keychain.getGenericPassword(keyOptions(id));
  return result ? result.password : '';
}
export function persistService(s: AiService) {
  db().executeSync('INSERT OR REPLACE INTO services(id,config) VALUES(?,?)', [
    s.id,
    JSON.stringify(s),
  ]);
}
export async function saveService(s: AiService, key: string) {
  const id = serviceId(s.protocol, s.baseUrl);
  if (!s.model.trim()) throw new Error('请输入模型名称');
  const updated = {
    ...s,
    id,
    baseUrl: s.baseUrl.trim(),
    model: s.model.trim(),
    disabled: s.id === id ? s.disabled : [],
  };
  if (key.trim()) {
    const saved = await Keychain.setGenericPassword('api', key.trim(), keyOptions(id));
    if (!saved) throw new Error('API Key 保存失败');
  }
  persistService(updated);
  writeSetting('service-' + s.protocol, id);
  writeSetting('protocol', s.protocol);
  return updated;
}

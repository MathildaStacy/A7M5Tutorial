import type {Operation, ScreenState} from '../camera/state';
export const views = {
  overview: '全景',
  front: '正面',
  top: '顶部',
  back: '背面',
  left: '左侧',
  right: '右侧',
  lens: '镜头',
  bottom: '底部',
} as const;
export type ViewName = keyof typeof views;
export type Command =
  | {cmd: 'sync'; state: ScreenState}
  | {cmd: 'highlight'; ids: string[]; note?: string; style?: string}
  | {cmd: 'animate'; control: string; kind: string; dir: number; steps: number}
  | {cmd: 'view'; view: ViewName}
  | {cmd: 'labels' | 'dim' | 'lcd'; on: boolean}
  | {cmd: 'pause' | 'resume' | 'snapshot'};
export type CameraEvent =
  | {ev: 'ready'}
  | {ev: 'pick'; control: string}
  | {ev: 'input'; control: string; op: Operation}
  | {ev: 'fatal'; message: string};
export function createBridge(onEvent: (event: CameraEvent) => void) {
  let send: ((payload: string) => void) | undefined;
  let ready = false,
    sequence = 0;
  const pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  function fail(reason = '3D 视图已断开') {
    ready = false;
    for (const req of pending.values()) {
      clearTimeout(req.timer);
      req.reject(new Error(reason));
    }
    pending.clear();
  }
  return {
    attach(transport: (payload: string) => void) {
      fail();
      send = transport;
      return () => {
        if (send === transport) {
          send = undefined;
          fail();
        }
      };
    },
    fail,
    receive(payload: string) {
      let m;
      try {
        m = JSON.parse(payload);
      } catch {
        return;
      }
      if (!m || typeof m !== 'object') return;
      if (m.ev === 'ready') {
        ready = true;
        onEvent(m);
        return;
      }
      if (m.ev === 'fatal') {
        fail(m.message);
        onEvent(m);
        return;
      }
      if (ready && (m.ev === 'pick' || m.ev === 'input')) {
        onEvent(m);
        return;
      }
      const req = pending.get(m.id);
      if (!req) return;
      pending.delete(m.id);
      clearTimeout(req.timer);
      if (m.ok === true) req.resolve(m.result);
      else req.reject(new Error(m.error ?? '3D 操作失败'));
    },
    request(command: Command): Promise<unknown> {
      if (!ready || !send) return Promise.reject(new Error('3D 视图尚未就绪'));
      const transport = send,
        id = ++sequence;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error('3D 请求超时'));
        }, 3000);
        pending.set(id, {resolve, reject, timer});
        try {
          transport(JSON.stringify({id, ...command}));
        } catch (e) {
          clearTimeout(timer);
          pending.delete(id);
          reject(e);
        }
      });
    },
  };
}

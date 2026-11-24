import {createBridge} from '../src/bridge/camera';
test('ready、响应、崩溃恢复及超时', async () => {
  jest.useFakeTimers();
  const events = jest.fn(),
    send = jest.fn(),
    bridge = createBridge(events);
  bridge.attach(send);
  await expect(bridge.request({cmd: 'pause'})).rejects.toThrow('就绪');
  bridge.receive('{"ev":"ready"}');
  const snapshot = bridge.request({cmd: 'snapshot'});
  const {id} = JSON.parse(send.mock.calls.at(-1)![0]);
  bridge.receive(JSON.stringify({id, ok: true, result: 'data:image/jpeg;base64,a'}));
  await expect(snapshot).resolves.toContain('data:image/jpeg');
  const pending = bridge.request({cmd: 'pause'});
  bridge.fail();
  await expect(pending).rejects.toThrow('断开');
  bridge.receive('{"ev":"ready"}');
  const slow = bridge.request({cmd: 'resume'});
  const rejection = expect(slow).rejects.toThrow('超时');
  jest.advanceTimersByTime(3000);
  await rejection;
  jest.useRealTimers();
});

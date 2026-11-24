import {open} from '@op-engineering/op-sqlite';
let current: ReturnType<typeof open> | undefined;
export function db() {
  if (current) return current;
  const conn = open({name: 'shutter-academy.sqlite'});
  conn.executeSync('CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT NOT NULL)');
  conn.executeSync(
    'CREATE TABLE IF NOT EXISTS services (id TEXT PRIMARY KEY, config TEXT NOT NULL)',
  );
  conn.executeSync(
    'CREATE TABLE IF NOT EXISTS lesson_progress (lesson_id TEXT, section TEXT, status TEXT NOT NULL, score INTEGER, updated_at TEXT, PRIMARY KEY(lesson_id,section))',
  );
  current = conn;
  return conn;
}
export function readSetting<T>(key: string, fallback: T): T {
  const value = db().executeSync('SELECT v FROM settings WHERE k=?', [key]).rows[0]?.v;
  return typeof value === 'string' ? JSON.parse(value) : fallback;
}
export function writeSetting(key: string, value: unknown) {
  db().executeSync('INSERT OR REPLACE INTO settings(k,v) VALUES(?,?)', [
    key,
    JSON.stringify(value),
  ]);
}
export function recordPractice(score: number) {
  const best = Math.max(readSetting('find-best', 0), score);
  writeSetting('find-best', best);
  if (best === 10)
    db().executeSync(
      "INSERT OR REPLACE INTO lesson_progress VALUES('L1','task','complete',10,datetime('now'))",
    );
  return best;
}

import type {Report} from '../ai/photoReview';
import type {SectionId} from '../lessons/engine';
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
  conn.executeSync(
    'CREATE TABLE IF NOT EXISTS photo_reviews (id INTEGER PRIMARY KEY, lesson_id TEXT, report TEXT NOT NULL, created_at TEXT NOT NULL)',
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
  if (best === 10) recordLessonSection('L1', 'task', 10, true);
  return best;
}

export type LessonProgress = Record<
  string,
  Partial<Record<SectionId, {complete: boolean; cursor: number}>>
>;
export function readLessonProgress(): LessonProgress {
  const result: LessonProgress = {};
  for (const row of db().executeSync(
    'SELECT lesson_id, section, status, score FROM lesson_progress',
  ).rows) {
    const id = String(row.lesson_id),
      section = row.section as SectionId;
    (result[id] ??= {})[section] = {
      complete: row.status === 'complete',
      cursor: Number(row.score) || 0,
    };
  }
  return result;
}
export function recordLessonSection(
  id: string,
  section: SectionId,
  cursor: number,
  complete: boolean,
) {
  db().executeSync(
    `INSERT INTO lesson_progress (lesson_id,section,status,score,updated_at) VALUES (?,?,?,?,datetime('now'))
     ON CONFLICT(lesson_id,section) DO UPDATE SET
       status=CASE WHEN lesson_progress.status='complete' THEN 'complete' ELSE excluded.status END,
       score=MAX(COALESCE(lesson_progress.score,0),excluded.score), updated_at=excluded.updated_at`,
    [id, section, complete ? 'complete' : 'active', cursor],
  );
}

export interface SavedReport {
  id: number;
  lessonId: string | null;
  createdAt: string;
  report: Report;
}
export function readReports(lessonId?: string): SavedReport[] {
  const rows = db().executeSync(
    'SELECT * FROM photo_reviews' +
      (lessonId ? ' WHERE lesson_id=?' : '') +
      ' ORDER BY id DESC' +
      (lessonId ? ' LIMIT 1' : ''),
    lessonId ? [lessonId] : [],
  ).rows;
  return rows.map((row) => ({
    id: Number(row.id),
    lessonId: row.lesson_id as string | null,
    createdAt: String(row.created_at),
    report: JSON.parse(String(row.report)),
  }));
}
export function saveReport(report: Report, lessonId?: string) {
  const conn = db();
  conn.executeSync('BEGIN IMMEDIATE');
  try {
    conn.executeSync('INSERT INTO photo_reviews (lesson_id,report,created_at) VALUES (?,?,?)', [
      lessonId ?? null,
      JSON.stringify(report),
      new Date().toISOString(),
    ]);
    if (lessonId && report.grade?.passed) recordLessonSection(lessonId, 'task', 1, true);
    conn.executeSync('COMMIT');
  } catch (e) {
    conn.executeSync('ROLLBACK');
    throw e;
  }
}
export const clearReports = () => db().executeSync('DELETE FROM photo_reviews');

import type {StoredMessage} from '../ai/types';
import {db, readSetting, writeSetting} from './db';

export type CoachReply = {body: string; control?: string; lesson?: string};
export type ChatSummary = {id: number; title: string; updatedAt: number};
export type CoachTurn = {
  id: number;
  chatId: number;
  model: string;
  question: string;
  messages: StoredMessage[];
  replies: CoachReply[];
  status: string;
};
const selection = 'coach-selected-chat';
export const selectChat = (id: number | null) => writeSetting(selection, id);
export function lastChat(): number | null {
  const id = readSetting<number | null>(selection, null);
  return id !== null && db().executeSync('SELECT id FROM coach_chats WHERE id=?', [id]).rows.length
    ? id
    : null;
}
export function listChats(): ChatSummary[] {
  return db()
    .executeSync('SELECT * FROM coach_chats ORDER BY updated_at DESC, id DESC')
    .rows.map((r) => ({
      id: Number(r.id),
      title: String(r.title),
      updatedAt: Number(r.updated_at),
    }));
}
export function readTurns(chatId: number | null): CoachTurn[] {
  if (chatId === null) return [];
  return db()
    .executeSync('SELECT * FROM coach_turns WHERE chat_id=? ORDER BY id', [chatId])
    .rows.map((r) => ({
      id: Number(r.id),
      chatId,
      model: String(r.model),
      question: String(r.question),
      messages: JSON.parse(String(r.messages)),
      replies: JSON.parse(String(r.replies)),
      status: String(r.status),
    }));
}
export function startTurn(
  chatId: number | null,
  model: string,
  question: string,
  user: StoredMessage,
): CoachTurn {
  const conn = db(),
    now = Date.now();
  conn.executeSync('BEGIN IMMEDIATE');
  try {
    if (chatId === null) {
      const title = Array.from(question.replace(/\s+/g, ' ').trim()).slice(0, 52).join('');
      chatId = conn.executeSync('INSERT INTO coach_chats(title,updated_at) VALUES(?,?)', [
        title,
        now,
      ]).insertId!;
    } else {
      conn.executeSync('UPDATE coach_chats SET updated_at=? WHERE id=?', [now, chatId]);
    }
    const messages = [user];
    const id = conn.executeSync(
      'INSERT INTO coach_turns(chat_id,model,question,messages,replies,status) VALUES(?,?,?,?,?,?)',
      [chatId, model, question, JSON.stringify(messages), '[]', '进行中'],
    ).insertId!;
    selectChat(chatId);
    conn.executeSync('COMMIT');
    return {
      id,
      chatId,
      model,
      question,
      messages,
      replies: [],
      status: '进行中',
    };
  } catch (e) {
    conn.executeSync('ROLLBACK');
    throw e;
  }
}
export function saveTurn(turn: CoachTurn) {
  db().executeSync('UPDATE coach_turns SET messages=?, replies=?, status=? WHERE id=?', [
    JSON.stringify(turn.messages),
    JSON.stringify(turn.replies),
    turn.status,
    turn.id,
  ]);
}
export function deleteChat(id: number) {
  const conn = db();
  conn.executeSync('BEGIN IMMEDIATE');
  try {
    conn.executeSync('DELETE FROM coach_turns WHERE chat_id=?', [id]);
    conn.executeSync('DELETE FROM coach_chats WHERE id=?', [id]);
    if (readSetting<number | null>(selection, null) === id) selectChat(null);
    conn.executeSync('COMMIT');
  } catch (e) {
    conn.executeSync('ROLLBACK');
    throw e;
  }
}

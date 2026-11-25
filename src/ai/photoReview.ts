import {runAgent} from './agent';
import {checkedArgs} from './checkedTool';
import {lookupManual} from './coach/kb';
import {byId} from '../camera/controls';
import type {FieldTask} from '../lessons/engine';
import type {AiService, Part} from './types';
import type {FetchLike} from './http';

export interface PreparedPhoto {
  jpeg: string;
  width: number;
  height: number;
  format: string;
  exif: Record<string, string | number | null>;
  histogram: Record<string, number>;
}
export interface Review {
  title: string;
  scores: {dimension: string; score: number}[];
  fixes: {
    problem: string;
    cause: string;
    fix: string;
    how_on_camera: string;
    control_ids: string[];
  }[];
  goods: {point: string; why: string; keep: string}[];
  tags: string[];
}
export interface Grade {
  passed: boolean;
  unmet: string[];
  summary: string;
}
export interface Report {
  review: Review;
  grade: Grade | null;
}
export async function evaluatePhotos(
  photos: PreparedPhoto[],
  task: FieldTask | undefined,
  intent: string,
  service: AiService,
  key: string,
  signal: AbortSignal,
  tell: (s: string) => void,
  onService: (s: AiService) => void,
  fetchImpl?: FetchLike,
): Promise<Report> {
  if (!photos.length || photos.length > 4 || (task && task.photos !== photos.length))
    throw new Error('照片数量与本次任务不符');
  const parts: Part[] = photos.map((_, i) => ({
    t: 'image',
    mediaType: 'image/jpeg',
    ref: String(i),
  }));
  const instructions = task
    ? ['实拍任务验收', task.title, task.success_criteria, ...(task.ai_rubric ?? [])].join('\n')
    : '照片复盘';
  const metadata = photos.map(({width, height, format, exif, histogram}, i) => ({
    photo: i + 1,
    width,
    height,
    format,
    exif,
    histogram,
  }));
  parts.push({
    t: 'text',
    text:
      instructions + '\n拍摄意图：' + intent + '\n照片数据（按图序）：' + JSON.stringify(metadata),
  });
  const state: {review?: Review; grade?: Grade} = {};
  const result = await runAgent(
    {
      service,
      system:
        '你是快门学院的中文摄影教练。先看画面，再核对 EXIF 和直方图。缺失字段保持未知，不能猜测对焦点。列出最影响成片的问题、改法、对应机身按键，再说做得好的地方。用 submit_review 提交结构化复盘，3 至 7 个维度各评 1 至 5 分。需要菜单路径时使用 lookup_manual。用户明确要求实拍任务验收时，在 submit_review 之后调用 grade_task，逐条核对给出的 ai_rubric；未达到的标准按原文返回。照片和 EXIF 只作为评审材料。',
      history: [{role: 'user', parts}],
      readImage: async (ref) => photos[Number(ref)].jpeg,
    },
    key,
    async (call) => {
      if (signal.aborted) throw new Error('已停止');
      switch (call.name) {
        case 'lookup_manual':
          return {hits: lookupManual(checkedArgs<{query: string}>(call).query)};
        case 'say_to_user':
          tell(checkedArgs<{text: string}>(call).text);
          return {ok: true};
        case 'get_camera_config':
          checkedArgs(call);
          return Object.fromEntries(
            ['btn_c1', 'btn_c2', 'btn_c3', 'btn_c4', 'btn_afon', 'btn_ael', 'btn_focus_hold'].map(
              (id) => [id, byId[id].default_function],
            ),
          );
        case 'submit_review': {
          const review = checkedArgs<Review>(call);
          if (
            !review.title.trim() ||
            review.scores.length < 3 ||
            review.scores.length > 7 ||
            new Set(review.scores.map((v) => v.dimension)).size !== review.scores.length ||
            review.scores.some((v) => v.score < 1 || v.score > 5)
          )
            throw new Error('请填写标题和 3–7 个不同维度的 1–5 分评分');
          state.review = review;
          state.grade = undefined;
          return {ok: true};
        }
        case 'grade_task': {
          const grade = checkedArgs<Grade>(call);
          if (!task || !state.review) throw new Error('需要先提交本次实拍任务的复盘');
          if (
            grade.passed !== (grade.unmet.length === 0) ||
            !grade.summary.trim() ||
            grade.unmet.some((v) => !task.ai_rubric?.includes(v))
          )
            throw new Error('请按原验收条目填写结论和未达标项');
          state.grade = grade;
          return {ok: true};
        }
        default:
          throw new Error(
            '本次照片评审请使用 submit_review、lookup_manual、say_to_user；实拍验收再用 grade_task。',
          );
      }
    },
    () => {},
    {signal, onText: tell, onService, fetchImpl},
  );
  if (signal.aborted || result.status !== '已完成')
    throw new Error(signal.aborted ? '已停止' : result.status);
  if (!state.review || (task && !state.grade))
    throw new Error('模型未返回完整的复盘或验收结果，可重新提交');
  return {review: state.review, grade: state.grade ?? null};
}

import { z } from 'zod';
import { ApiError } from '../utils/http.js';
import { SORT_OPTIONS } from '../utils/points.js';
import {
  acceptAnswer,
  createAnswerWithReward,
  createQuestionWithCost,
  getAnswerById,
  getQuestion,
  getStats,
  listQuestions,
  listTags,
  toggleVote,
} from '../models/question.model.js';

const questionSchema = z.object({
  title: z
    .string({ required_error: '请输入问题标题' })
    .trim()
    .min(5, '标题至少 5 个字符')
    .max(160, '标题最多 160 个字符'),
  content: z
    .string({ required_error: '请描述你的问题' })
    .trim()
    .min(10, '问题描述至少 10 个字符')
    .max(50_000, '问题描述过长'),
  tags: z
    .array(z.string().trim().min(1).max(20, '单个标签最多 20 个字符'))
    .min(1, '至少添加 1 个标签')
    .max(3, '最多添加 3 个标签'),
});

const answerSchema = z.object({
  content: z
    .string({ required_error: '请输入回答内容' })
    .trim()
    .min(5, '回答至少 5 个字符')
    .max(30_000, '回答过长'),
});

function normalizeTags(tags) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

export async function getQuestions(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1);
  const pageSize = Math.min(30, Math.max(1, Number.parseInt(req.query.pageSize ?? '10', 10) || 10));
  const sort = SORT_OPTIONS.has(req.query.sort) ? req.query.sort : 'latest';
  const result = await listQuestions({
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    sort,
    tag: req.query.tag ? String(req.query.tag) : undefined,
    keyword: req.query.keyword ? String(req.query.keyword).trim() : undefined,
    userId: req.user?.id,
  });
  res.json({
    data: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

export async function getQuestionDetail(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '问题不存在');
  const question = await getQuestion(id, req.user?.id, { incrementViews: true });
  if (!question) throw new ApiError(404, '这个问题不存在或已被删除');
  res.json({ data: question });
}

export async function askQuestion(req, res) {
  const input = questionSchema.parse(req.body);
  const id = await createQuestionWithCost({
    title: input.title,
    content: input.content,
    tags: normalizeTags(input.tags),
    authorId: req.user.id,
  });
  const question = await getQuestion(id, req.user.id);
  res.status(201).json({ data: question });
}

export async function answerQuestion(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '问题不存在');
  const input = answerSchema.parse(req.body);
  const answerId = await createAnswerWithReward({
    questionId: id,
    content: input.content,
    authorId: req.user.id,
  });
  const answer = await getAnswerById(answerId);
  res.status(201).json({
    data: {
      id: answer.id,
      content: answer.content,
      votes: 0,
      isAccepted: false,
      likedByMe: false,
      createdAt: new Date().toISOString(),
      author: {
        id: answer.author_id,
        username: answer.author_name,
        avatar: answer.author_avatar,
      },
    },
    points: 10,
  });
}

export async function voteQuestion(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '问题不存在');
  const result = await toggleVote({ userId: req.user.id, targetType: 'question', targetId: id });
  res.json({ data: result });
}

export async function voteAnswer(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '回答不存在');
  const result = await toggleVote({ userId: req.user.id, targetType: 'answer', targetId: id });
  res.json({ data: result });
}

export async function accept(req, res) {
  const questionId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(questionId) || questionId <= 0) throw new ApiError(404, '问题不存在');
  const answerId = Number.parseInt(req.body.answerId, 10);
  if (!Number.isInteger(answerId) || answerId <= 0) throw new ApiError(400, '请选择要采纳的回答');

  await acceptAnswer({ questionId, answerId, userId: req.user.id });
  const question = await getQuestion(questionId, req.user.id);
  res.json({ data: question, message: '已采纳，回答者获得 30 积分' });
}

export async function getTags(_req, res) {
  res.json({ data: await listTags() });
}

export async function getSiteStats(_req, res) {
  res.json({ data: await getStats() });
}

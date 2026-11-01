import { z } from 'zod';
import { ApiError } from '../utils/http.js';
import {
  categoryExists,
  createPost,
  deletePost,
  findPostById,
  listPosts,
  updatePost,
} from '../models/post.model.js';

const postSchema = z.object({
  title: z
    .string({ required_error: '请输入文章标题' })
    .trim()
    .min(1, '请输入文章标题')
    .max(200, '标题最多 200 个字符'),
  content: z
    .string({ required_error: '请输入文章内容' })
    .min(1, '文章内容不能为空')
    .max(200_000, '文章内容过长'),
  categoryId: z.coerce.number({ invalid_type_error: '请选择文章分类' }).int().positive('请选择文章分类'),
  tags: z
    .array(z.string().trim().max(20, '单个标签最多 20 个字符'))
    .max(8, '最多添加 8 个标签')
    .optional()
    .default([]),
  cover: z.string().trim().max(500, '封面地址过长').optional().default(''),
});

function normalizeTags(tags) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

export async function getPosts(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize ?? '10', 10) || 10));
  const authorId = req.query.authorId
    ? Number.parseInt(req.query.authorId, 10)
    : undefined;

  if (authorId !== undefined && (!Number.isInteger(authorId) || authorId <= 0)) {
    throw new ApiError(400, '作者参数不正确');
  }

  const result = await listPosts({
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    category: req.query.category ? String(req.query.category) : undefined,
    keyword: req.query.keyword ? String(req.query.keyword).trim() : undefined,
    authorId: Number.isInteger(authorId) ? authorId : undefined,
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

export async function getPost(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '文章不存在');

  const post = await findPostById(id, { withContent: true, incrementViews: true });
  if (!post) throw new ApiError(404, '这篇文章不存在或已被删除');
  res.json({ data: post });
}

export async function createNewPost(req, res) {
  const input = postSchema.parse(req.body);
  if (!(await categoryExists(input.categoryId))) throw new ApiError(400, '请选择有效的分类');

  const post = await createPost({
    ...input,
    tags: normalizeTags(input.tags),
    authorId: req.user.id,
  });
  res.status(201).json({ data: post });
}

export async function updateExistingPost(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '文章不存在');

  const existing = await findPostById(id, { withContent: false, incrementViews: false });
  if (!existing) throw new ApiError(404, '这篇文章不存在或已被删除');
  if (existing.author.id !== req.user.id) throw new ApiError(403, '只能编辑自己的文章');

  const input = postSchema.parse(req.body);
  if (!(await categoryExists(input.categoryId))) throw new ApiError(400, '请选择有效的分类');

  const post = await updatePost(id, {
    ...input,
    tags: normalizeTags(input.tags),
  });
  res.json({ data: post });
}

export async function removePost(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '文章不存在');

  const existing = await findPostById(id, { withContent: false, incrementViews: false });
  if (!existing) throw new ApiError(404, '这篇文章不存在或已被删除');
  if (existing.author.id !== req.user.id) throw new ApiError(403, '只能删除自己的文章');

  await deletePost(id);
  res.status(204).end();
}

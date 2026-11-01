import { z } from 'zod';
import { ApiError, publicUser } from '../utils/http.js';
import { findById, takenByOthers, updateUser } from '../models/user.model.js';
import { getUserProfile, leaderboard } from '../models/question.model.js';

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, '用户名至少 3 个字符')
    .max(20, '用户名最多 20 个字符')
    .regex(/^[\p{L}\p{N}_-]+$/u, '用户名只能包含中文、字母、数字、下划线或短横线'),
  email: z.string().trim().email('邮箱格式不正确').max(255),
  avatar: z.string().trim().max(500, '头像地址过长').optional().default(''),
});

export async function updateMe(req, res) {
  const input = profileSchema.parse(req.body);
  const taken = await takenByOthers({
    username: input.username,
    email: input.email,
    excludeId: req.user.id,
  });
  if (taken.some((user) => user.username === input.username)) {
    throw new ApiError(409, '这个用户名已经被使用了');
  }
  if (taken.some((user) => user.email === input.email)) {
    throw new ApiError(409, '这个邮箱已经注册过了');
  }
  const user = await updateUser(req.user.id, input);
  res.json({ data: publicUser(user) });
}

export async function getProfile(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '用户不存在');
  const profile = await getUserProfile(id);
  if (!profile) throw new ApiError(404, '用户不存在');
  res.json({ data: profile });
}

export async function getLeaderboard(_req, res) {
  res.json({ data: await leaderboard() });
}

export async function getMe(req, res) {
  const user = await findById(req.user.id);
  res.json({ data: publicUser(user) });
}

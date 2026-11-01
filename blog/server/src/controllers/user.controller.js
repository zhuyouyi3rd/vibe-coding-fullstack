import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { ApiError } from '../utils/http.js';
import {
  findById,
  updateUser,
  usernameOrEmailTaken,
} from '../models/user.model.js';
import { getAuthorStats, listPosts } from '../models/post.model.js';

const updateProfileSchema = z.object({
  username: z
    .string({ required_error: '请输入用户名' })
    .trim()
    .min(3, '用户名至少 3 个字符')
    .max(20, '用户名最多 20 个字符')
    .regex(/^[\p{L}\p{N}_-]+$/u, '用户名只能包含中文、字母、数字、下划线或短横线'),
  email: z.string({ required_error: '请输入邮箱' }).trim().email('邮箱格式不正确').max(255),
  avatar: z.string().trim().max(500, '头像地址过长').optional().default(''),
});

export async function getPublicProfile(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '用户不存在');

  const user = await findById(id);
  if (!user) throw new ApiError(404, '用户不存在');

  const stats = await getAuthorStats(id);
  const posts = await listPosts({
    page: 1,
    pageSize: 6,
    offset: 0,
    authorId: id,
  });

  res.json({
    data: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.created_at,
      stats,
      recentPosts: posts.items,
    },
  });
}

export async function updateMe(req, res) {
  const input = updateProfileSchema.parse(req.body);
  const taken = await usernameOrEmailTaken({
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
  res.json({
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.created_at,
    },
  });
}

export async function changePassword(req, res) {
  const schema = z.object({
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z.string().min(6, '新密码至少 6 位').max(72, '新密码最多 72 位'),
  });
  const input = schema.parse(req.body);
  const rows = await query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  const matched = await bcrypt.compare(input.currentPassword, rows[0].password_hash);
  if (!matched) throw new ApiError(401, '当前密码不正确');
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);
  res.json({ message: '密码已更新' });
}

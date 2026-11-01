import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { ApiError, publicUser } from '../utils/http.js';
import { signToken } from '../middleware/auth.js';
import { createUser, findByUsernameOrEmail, findByUsernameWithPassword } from '../models/user.model.js';

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, '用户名至少 3 个字符')
    .max(20, '用户名最多 20 个字符')
    .regex(/^[\p{L}\p{N}_-]+$/u, '用户名只能包含中文、字母、数字、下划线或短横线'),
  email: z.string().trim().email('邮箱格式不正确').max(255),
  password: z.string().min(6, '密码至少 6 位').max(72),
});

const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export async function register(req, res) {
  const input = registerSchema.parse(req.body);
  const existing = await findByUsernameOrEmail(input.username, input.email);
  if (existing.some((user) => user.username === input.username)) {
    throw new ApiError(409, '这个用户名已经被使用了');
  }
  if (existing.some((user) => user.email === input.email)) {
    throw new ApiError(409, '这个邮箱已经注册过了');
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createUser({ ...input, passwordHash, avatar: '' });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const input = loginSchema.parse(req.body);
  const user = await findByUsernameWithPassword(input.username);
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new ApiError(401, '用户名或密码不正确');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

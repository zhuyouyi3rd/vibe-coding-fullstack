import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { ApiError } from '../utils/http.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, '请先登录后再操作');
    const payload = jwt.verify(token, env.jwtSecret);
    const rows = await query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ? LIMIT 1',
      [payload.sub],
    );
    if (!rows.length) throw new ApiError(401, '登录状态已失效，请重新登录');
    req.user = rows[0];
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, '登录状态已失效，请重新登录'));
  }
}

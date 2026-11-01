import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { ApiError } from '../utils/http.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

async function userFromToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const rows = await query(
      'SELECT id, username, email, avatar, points, created_at FROM users WHERE id = ? LIMIT 1',
      [payload.sub],
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}

function bearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export async function requireAuth(req, _res, next) {
  try {
    const user = await userFromToken(bearer(req));
    if (!user) throw new ApiError(401, '请先登录后再操作');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, '登录状态已失效，请重新登录'));
  }
}

export async function optionalAuth(req, _res, next) {
  req.user = await userFromToken(bearer(req));
  next();
}

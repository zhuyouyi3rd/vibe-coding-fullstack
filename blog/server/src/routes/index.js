import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';
import { login, me, register } from '../controllers/auth.controller.js';
import {
  createNewPost,
  getPost,
  getPosts,
  removePost,
  updateExistingPost,
} from '../controllers/post.controller.js';
import { getCategories } from '../controllers/category.controller.js';
import {
  changePassword,
  getPublicProfile,
  updateMe,
} from '../controllers/user.controller.js';

export const api = Router();

api.get('/health', asyncHandler(async (_req, res) => {
  const { query } = await import('../config/db.js');
  await query('SELECT 1');
  res.json({ status: 'ok', time: new Date().toISOString() });
}));

api.post('/auth/register', asyncHandler(register));
api.post('/auth/login', asyncHandler(login));
api.get('/auth/me', requireAuth, asyncHandler(me));

api.get('/categories', asyncHandler(getCategories));

api.get('/posts', asyncHandler(getPosts));
api.get('/posts/:id', asyncHandler(getPost));
api.post('/posts', requireAuth, asyncHandler(createNewPost));
api.put('/posts/:id', requireAuth, asyncHandler(updateExistingPost));
api.delete('/posts/:id', requireAuth, asyncHandler(removePost));

api.put('/users/me', requireAuth, asyncHandler(updateMe));
api.put('/users/me/password', requireAuth, asyncHandler(changePassword));
api.get('/users/:id', asyncHandler(getPublicProfile));

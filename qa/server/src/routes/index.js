import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { login, me, register } from '../controllers/auth.controller.js';
import {
  accept,
  answerQuestion,
  askQuestion,
  getQuestionDetail,
  getQuestions,
  getSiteStats,
  getTags,
  voteAnswer,
  voteQuestion,
} from '../controllers/question.controller.js';
import {
  getLeaderboard,
  getMe,
  getProfile,
  updateMe,
} from '../controllers/user.controller.js';

export const api = Router();

api.get('/health', asyncHandler(async (_req, res) => {
  const { query } = await import('../config/db.js');
  await query('SELECT 1');
  res.json({ status: 'ok', service: 'wenqu-qa', time: new Date().toISOString() });
}));

api.post('/auth/register', asyncHandler(register));
api.post('/auth/login', asyncHandler(login));
api.get('/auth/me', requireAuth, asyncHandler(me));

api.get('/tags', asyncHandler(getTags));
api.get('/stats', asyncHandler(getSiteStats));
api.get('/leaderboard', asyncHandler(getLeaderboard));

api.get('/questions', optionalAuth, asyncHandler(getQuestions));
api.get('/questions/:id', optionalAuth, asyncHandler(getQuestionDetail));
api.post('/questions', requireAuth, asyncHandler(askQuestion));
api.post('/questions/:id/answers', requireAuth, asyncHandler(answerQuestion));
api.post('/questions/:id/vote', requireAuth, asyncHandler(voteQuestion));
api.post('/questions/:id/accept', requireAuth, asyncHandler(accept));
api.post('/answers/:id/vote', requireAuth, asyncHandler(voteAnswer));

api.get('/users/me', requireAuth, asyncHandler(getMe));
api.put('/users/me', requireAuth, asyncHandler(updateMe));
api.get('/users/:id', asyncHandler(getProfile));

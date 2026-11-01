import { query, withTransaction } from '../config/db.js';
import { ApiError, excerptOf } from '../utils/http.js';
import { POINTS } from '../utils/points.js';

const QUESTION_FIELDS = `
  q.id, q.title, q.content, q.tags, q.views, q.answers_count, q.votes,
  q.is_solved, q.created_at, q.updated_at, q.author_id,
  u.username AS author_name, u.avatar AS author_avatar, u.points AS author_points
`;

const QUESTION_FROM = `
  FROM questions q
  JOIN users u ON u.id = q.author_id
`;

const QUESTION_SELECT = `SELECT ${QUESTION_FIELDS} ${QUESTION_FROM}`;

function tagsOf(value) {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

export function mapQuestion(row, { withContent = true, liked = false } = {}) {
  return {
    id: row.id,
    title: row.title,
    ...(withContent ? { content: row.content } : { excerpt: excerptOf(row.content) }),
    tags: tagsOf(row.tags),
    views: row.views,
    answersCount: Number(row.answers_count),
    votes: Number(row.votes),
    isSolved: Boolean(row.is_solved),
    likedByMe: Boolean(liked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      username: row.author_name,
      avatar: row.author_avatar,
      points: Number(row.author_points),
    },
  };
}

export function mapAnswer(row, { liked = false } = {}) {
  return {
    id: row.id,
    content: row.content,
    votes: Number(row.votes),
    isAccepted: Boolean(row.is_accepted),
    likedByMe: Boolean(liked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.author_id,
      username: row.author_name,
      avatar: row.author_avatar,
      points: Number(row.author_points),
    },
  };
}

export async function listQuestions({ page, pageSize, offset, sort, tag, keyword, userId }) {
  const where = [];
  const filterParams = [];
  if (tag) {
    where.push('JSON_SEARCH(q.tags, "one", ?) IS NOT NULL');
    filterParams.push(tag);
  }
  if (keyword) {
    where.push('(q.title LIKE ? OR q.content LIKE ?)');
    const like = `%${keyword}%`;
    filterParams.push(like, like);
  }
  if (sort === 'unanswered') where.push('q.is_solved = 0');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const order =
    sort === 'hot'
      ? 'ORDER BY q.votes DESC, q.answers_count DESC, q.views DESC, q.created_at DESC'
      : 'ORDER BY q.created_at DESC, q.id DESC';

  const countRows = await query(`SELECT COUNT(*) AS total FROM questions q ${whereSql}`, filterParams);
  const rows = await query(
    `SELECT ${QUESTION_FIELDS},
      EXISTS(SELECT 1 FROM votes v WHERE v.user_id = ? AND v.target_type = 'question' AND v.target_id = q.id) AS liked
     ${QUESTION_FROM} ${whereSql} ${order} LIMIT ${pageSize} OFFSET ${offset}`,
    [userId || 0, ...filterParams],
  );

  return {
    items: rows.map((row) => mapQuestion(row, { withContent: false, liked: row.liked })),
    total: Number(countRows[0].total),
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(Number(countRows[0].total) / pageSize)),
  };
}

export async function getQuestion(id, userId, { incrementViews = false } = {}) {
  if (incrementViews) {
    await query('UPDATE questions SET views = views + 1 WHERE id = ?', [id]);
  }
  const rows = await query(
    `SELECT ${QUESTION_FIELDS},
      EXISTS(SELECT 1 FROM votes v WHERE v.user_id = ? AND v.target_type = 'question' AND v.target_id = q.id) AS liked
     ${QUESTION_FROM} WHERE q.id = ? LIMIT 1`,
    [userId || 0, id],
  );
  if (!rows.length) return null;

  const answers = await query(
    `SELECT a.id, a.content, a.votes, a.is_accepted, a.created_at, a.updated_at, a.author_id,
            u.username AS author_name, u.avatar AS author_avatar, u.points AS author_points,
            EXISTS(SELECT 1 FROM votes v WHERE v.user_id = ? AND v.target_type = 'answer' AND v.target_id = a.id) AS liked
     FROM answers a JOIN users u ON u.id = a.author_id
     WHERE a.question_id = ?
     ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
    [userId || 0, id],
  );

  return {
    ...mapQuestion(rows[0], { withContent: true, liked: rows[0].liked }),
    answers: answers.map((row) => mapAnswer(row, { liked: row.liked })),
  };
}

export async function questionExists(id) {
  const rows = await query('SELECT id FROM questions WHERE id = ? LIMIT 1', [id]);
  return rows.length > 0;
}

export async function createQuestionWithCost({ title, content, tags, authorId }) {
  return withTransaction(async (connection) => {
    const [users] = await connection.execute('SELECT points FROM users WHERE id = ? FOR UPDATE', [authorId]);
    if (!users.length) throw new ApiError(404, '用户不存在');
    if (Number(users[0].points) + POINTS.ASK < 0) {
      throw new ApiError(400, '积分不足，发布问题需要 5 积分');
    }

    const [result] = await connection.execute(
      'INSERT INTO questions (title, content, tags, author_id) VALUES (?, ?, ?, ?)',
      [title, content, JSON.stringify(tags), authorId],
    );
    await connection.execute('UPDATE users SET points = points + ? WHERE id = ?', [POINTS.ASK, authorId]);
    return result.insertId;
  });
}

export async function createAnswerWithReward({ questionId, content, authorId }) {
  return withTransaction(async (connection) => {
    const [questions] = await connection.execute('SELECT id FROM questions WHERE id = ? FOR UPDATE', [questionId]);
    if (!questions.length) throw new ApiError(404, '问题不存在');

    const [result] = await connection.execute(
      'INSERT INTO answers (content, question_id, author_id) VALUES (?, ?, ?)',
      [content, questionId, authorId],
    );
    await connection.execute('UPDATE questions SET answers_count = answers_count + 1 WHERE id = ?', [questionId]);
    await connection.execute('UPDATE users SET points = points + ? WHERE id = ?', [POINTS.ANSWER, authorId]);
    return result.insertId;
  });
}

export async function getAnswerById(id) {
  const rows = await query(
    `SELECT a.id, a.content, a.votes, a.is_accepted, a.question_id, a.author_id,
            u.username AS author_name, u.avatar AS author_avatar
     FROM answers a JOIN users u ON u.id = a.author_id WHERE a.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function toggleVote({ userId, targetType, targetId }) {
  const table = targetType === 'question' ? 'questions' : targetType === 'answer' ? 'answers' : null;
  if (!table) throw new ApiError(400, '点赞目标不正确');
  const points = targetType === 'question' ? POINTS.QUESTION_VOTE : POINTS.ANSWER_VOTE;

  return withTransaction(async (connection) => {
    const [targets] = await connection.execute(
      `SELECT id, author_id, votes FROM ${table} WHERE id = ? FOR UPDATE`,
      [targetId],
    );
    if (!targets.length) throw new ApiError(404, targetType === 'question' ? '问题不存在' : '回答不存在');
    const target = targets[0];
    if (Number(target.author_id) === Number(userId)) {
      throw new ApiError(400, '不能给自己的内容点赞');
    }

    const [existing] = await connection.execute(
      'SELECT id FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ? LIMIT 1',
      [userId, targetType, targetId],
    );

    if (existing.length) {
      await connection.execute('DELETE FROM votes WHERE id = ?', [existing[0].id]);
      await connection.execute(`UPDATE ${table} SET votes = GREATEST(votes - 1, 0) WHERE id = ?`, [targetId]);
      await connection.execute('UPDATE users SET points = points - ? WHERE id = ?', [points, target.author_id]);
      return { liked: false, votes: Math.max(0, Number(target.votes) - 1), pointsDelta: -points };
    }

    await connection.execute(
      'INSERT INTO votes (user_id, target_type, target_id) VALUES (?, ?, ?)',
      [userId, targetType, targetId],
    );
    await connection.execute(`UPDATE ${table} SET votes = votes + 1 WHERE id = ?`, [targetId]);
    await connection.execute('UPDATE users SET points = points + ? WHERE id = ?', [points, target.author_id]);
    return { liked: true, votes: Number(target.votes) + 1, pointsDelta: points };
  });
}

export async function acceptAnswer({ questionId, answerId, userId }) {
  return withTransaction(async (connection) => {
    const [questions] = await connection.execute(
      'SELECT id, author_id, is_solved FROM questions WHERE id = ? FOR UPDATE',
      [questionId],
    );
    if (!questions.length) throw new ApiError(404, '问题不存在');
    const question = questions[0];
    if (Number(question.author_id) !== Number(userId)) throw new ApiError(403, '只有提问者可以采纳答案');
    if (question.is_solved) throw new ApiError(409, '这个问题已经采纳过答案了');

    const [answers] = await connection.execute(
      'SELECT id, author_id, is_accepted FROM answers WHERE id = ? AND question_id = ? FOR UPDATE',
      [answerId, questionId],
    );
    if (!answers.length) throw new ApiError(404, '回答不存在');
    const answer = answers[0];
    if (Number(answer.author_id) === Number(userId)) throw new ApiError(400, '不能采纳自己的回答');
    if (answer.is_accepted) throw new ApiError(409, '这个回答已经被采纳了');

    await connection.execute('UPDATE answers SET is_accepted = 1 WHERE id = ?', [answerId]);
    await connection.execute('UPDATE questions SET is_solved = 1 WHERE id = ?', [questionId]);
    await connection.execute('UPDATE users SET points = points + ? WHERE id = ?', [POINTS.ACCEPTED, answer.author_id]);
    return { answerId, authorId: answer.author_id, points: POINTS.ACCEPTED };
  });
}

export async function listTags() {
  const rows = await query('SELECT tags FROM questions');
  const counts = new Map();
  for (const row of rows) {
    for (const tag of tagsOf(row.tags)) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export async function getStats() {
  const rows = await query(`
    SELECT
      (SELECT COUNT(*) FROM questions) AS questions,
      (SELECT COUNT(*) FROM answers) AS answers,
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM questions WHERE is_solved = 1) AS solved
  `);
  const row = rows[0];
  return {
    questions: Number(row.questions),
    answers: Number(row.answers),
    users: Number(row.users),
    solved: Number(row.solved),
    solveRate: row.questions ? Math.round((Number(row.solved) / Number(row.questions)) * 100) : 0,
  };
}

export async function leaderboard() {
  const rows = await query(
    `SELECT u.id, u.username, u.avatar, u.points,
       (SELECT COUNT(*) FROM questions q WHERE q.author_id = u.id) AS question_count,
       (SELECT COUNT(*) FROM answers a WHERE a.author_id = u.id) AS answer_count
     FROM users u ORDER BY u.points DESC, u.id ASC LIMIT 6`,
  );
  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    avatar: row.avatar,
    points: Number(row.points),
    questionCount: Number(row.question_count),
    answerCount: Number(row.answer_count),
  }));
}

export async function getUserProfile(id) {
  const rows = await query(
    'SELECT id, username, avatar, points, created_at FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  if (!rows.length) return null;
  const user = rows[0];

  const statsRows = await query(
    `SELECT
       (SELECT COUNT(*) FROM questions WHERE author_id = ?) AS question_count,
       (SELECT COUNT(*) FROM answers WHERE author_id = ?) AS answer_count,
       (SELECT COUNT(*) FROM answers WHERE author_id = ? AND is_accepted = 1) AS accepted_count,
       (SELECT COALESCE(SUM(votes), 0) FROM questions WHERE author_id = ?) AS question_votes,
       (SELECT COALESCE(SUM(votes), 0) FROM answers WHERE author_id = ?) AS answer_votes`,
    [id, id, id, id, id],
  );
  const stats = statsRows[0];

  const questions = await query(
    `${QUESTION_SELECT} WHERE q.author_id = ? ORDER BY q.created_at DESC LIMIT 5`,
    [id],
  );
  const answers = await query(
    `SELECT a.id, a.content, a.votes, a.is_accepted, a.created_at, a.question_id,
            q.title AS question_title
     FROM answers a JOIN questions q ON q.id = a.question_id
     WHERE a.author_id = ? ORDER BY a.created_at DESC LIMIT 5`,
    [id],
  );

  return {
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      points: Number(user.points),
      createdAt: user.created_at,
    },
    stats: {
      questionCount: Number(stats.question_count),
      answerCount: Number(stats.answer_count),
      acceptedCount: Number(stats.accepted_count),
      receivedVotes: Number(stats.question_votes) + Number(stats.answer_votes),
    },
    questions: questions.map((row) => mapQuestion(row, { withContent: false })),
    answers: answers.map((row) => ({
      id: row.id,
      content: excerptOf(row.content, 90),
      votes: Number(row.votes),
      isAccepted: Boolean(row.is_accepted),
      createdAt: row.created_at,
      questionId: row.question_id,
      questionTitle: row.question_title,
    })),
  };
}

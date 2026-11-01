import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { pool, query } from '../src/config/db.js';

let server;
let baseUrl;
const suffix = `${Date.now().toString().slice(-7)}${Math.random().toString(36).slice(2, 5)}`;
const userA = { username: `问主${suffix}`, email: `asker_${suffix}@test.local`, password: 'test1234' };
const userB = { username: `答主${suffix}`, email: `answerer_${suffix}@test.local`, password: 'test1234' };
const createdUsernames = [userA.username, userB.username];
let tokenA = '';
let tokenB = '';
let questionId;
let answerId;
let initialA = 0;
let initialB = 0;

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

async function me(token) {
  return (await request('/auth/me', { token })).data.user;
}

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}/api`;
      resolve();
    });
  });
});

after(async () => {
  await query(
    `DELETE FROM users WHERE username IN (${createdUsernames.map(() => '?').join(',')})`,
    createdUsernames,
  );
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('健康检查、站点统计与标签', async () => {
  const health = await request('/health');
  assert.equal(health.status, 200);

  const stats = await request('/stats');
  assert.equal(stats.status, 200);
  assert.ok(stats.data.data.questions >= 12);

  const tags = await request('/tags');
  assert.equal(tags.status, 200);
  assert.ok(tags.data.data.length > 0);
});

test('注册两个用户，初始积分 20', async () => {
  const a = await request('/auth/register', { method: 'POST', body: userA });
  assert.equal(a.status, 201);
  tokenA = a.data.token;
  initialA = a.data.user.points;
  assert.equal(initialA, 20);

  const b = await request('/auth/register', { method: 'POST', body: userB });
  assert.equal(b.status, 201);
  tokenB = b.data.token;
  initialB = b.data.user.points;
  assert.equal(initialB, 20);
});

test('未登录不能提问', async () => {
  const { status } = await request('/questions', {
    method: 'POST',
    body: { title: '未登录提问', content: '这是一段足够长的描述', tags: ['测试'] },
  });
  assert.equal(status, 401);
});

test('提问扣除 5 积分，并生成问题详情', async () => {
  const created = await request('/questions', {
    method: 'POST',
    token: tokenA,
    body: {
      title: `测试问题 ${suffix}：如何验证积分和采纳？`,
      content: '这是一段用于测试的问题描述，包含 **Markdown** 和 `代码`。',
      tags: ['测试标签', '积分'],
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.data.title, `测试问题 ${suffix}：如何验证积分和采纳？`);
  assert.deepEqual(created.data.data.tags, ['测试标签', '积分']);
  questionId = created.data.data.id;

  const current = await me(tokenA);
  assert.equal(current.points, initialA - 5);
});

test('回答问题加 10 积分，问题回答数 +1', async () => {
  const answered = await request(`/questions/${questionId}/answers`, {
    method: 'POST',
    token: tokenB,
    body: { content: '先查积分，再查问题状态，最后看采纳结果。这个回答足够长。' },
  });
  assert.equal(answered.status, 201);
  answerId = answered.data.data.id;

  const current = await me(tokenB);
  assert.equal(current.points, initialB + 10);

  const detail = await request(`/questions/${questionId}`, { token: tokenA });
  assert.equal(detail.data.data.answersCount, 1);
  assert.equal(detail.data.data.answers[0].id, answerId);
});

test('点赞/取消点赞回答会同步积分和状态', async () => {
  const liked = await request(`/answers/${answerId}/vote`, { method: 'POST', token: tokenA });
  assert.equal(liked.status, 200);
  assert.equal(liked.data.data.liked, true);
  assert.equal(liked.data.data.votes, 1);

  let answerer = await me(tokenB);
  assert.equal(answerer.points, initialB + 10 + 10);

  const detail = await request(`/questions/${questionId}`, { token: tokenA });
  assert.equal(detail.data.data.answers[0].likedByMe, true);
  assert.equal(detail.data.data.answers[0].votes, 1);

  const unliked = await request(`/answers/${answerId}/vote`, { method: 'POST', token: tokenA });
  assert.equal(unliked.status, 200);
  assert.equal(unliked.data.data.liked, false);
  assert.equal(unliked.data.data.votes, 0);

  answerer = await me(tokenB);
  assert.equal(answerer.points, initialB + 10);
});

test('不能给自己的内容点赞', async () => {
  const { status, data } = await request(`/questions/${questionId}/vote`, {
    method: 'POST',
    token: tokenA,
  });
  assert.equal(status, 400);
  assert.match(data.message, /不能给自己/);
});

test('第二个用户点赞问题，积分 +5，取消后恢复', async () => {
  const liked = await request(`/questions/${questionId}/vote`, { method: 'POST', token: tokenB });
  assert.equal(liked.status, 200);
  assert.equal(liked.data.data.liked, true);

  let asker = await me(tokenA);
  assert.equal(asker.points, initialA - 5 + 5);

  const unliked = await request(`/questions/${questionId}/vote`, { method: 'POST', token: tokenB });
  assert.equal(unliked.data.data.liked, false);

  asker = await me(tokenA);
  assert.equal(asker.points, initialA - 5);
});

test('只有提问者可以采纳，且只能采纳一次', async () => {
  const forbidden = await request(`/questions/${questionId}/accept`, {
    method: 'POST',
    token: tokenB,
    body: { answerId },
  });
  assert.equal(forbidden.status, 403);

  const accepted = await request(`/questions/${questionId}/accept`, {
    method: 'POST',
    token: tokenA,
    body: { answerId },
  });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.data.data.isSolved, true);
  assert.equal(accepted.data.data.answers[0].isAccepted, true);

  const answerer = await me(tokenB);
  assert.equal(answerer.points, initialB + 10 + 30);

  const again = await request(`/questions/${questionId}/accept`, {
    method: 'POST',
    token: tokenA,
    body: { answerId },
  });
  assert.equal(again.status, 409);
});

test('列表支持最新/热门/未解决排序、标签筛选和分页', async () => {
  const latest = await request('/questions?sort=latest&page=1&pageSize=5');
  assert.equal(latest.status, 200);
  assert.equal(latest.data.data.length, 5);
  assert.ok(latest.data.pagination.total >= 12);

  const hot = await request('/questions?sort=hot&pageSize=5');
  assert.equal(hot.status, 200);
  const votes = hot.data.data.map((item) => item.votes);
  assert.deepEqual(votes, [...votes].sort((a, b) => b - a));

  const unsolved = await request('/questions?sort=unanswered&pageSize=30');
  assert.ok(unsolved.data.data.every((item) => item.isSolved === false));

  const filtered = await request(`/questions?tag=${encodeURIComponent('测试标签')}`);
  assert.ok(filtered.data.data.some((item) => item.id === questionId));
});

test('关键词搜索与分页返回正确', async () => {
  const search = await request(`/questions?keyword=${encodeURIComponent(suffix)}`);
  assert.equal(search.status, 200);
  assert.ok(search.data.data.some((item) => item.id === questionId));

  const secondPage = await request('/questions?page=2&pageSize=5');
  assert.equal(secondPage.status, 200);
  assert.equal(secondPage.data.data.length, 5);
  assert.equal(secondPage.data.pagination.page, 2);
  assert.ok(secondPage.data.pagination.totalPages >= 3);
});

test('提问参数校验：超过 3 个标签返回 400', async () => {
  const { status, data } = await request('/questions', {
    method: 'POST',
    token: tokenB,
    body: {
      title: '这是一个标签数量超过限制的测试问题',
      content: '描述内容足够长，但标签数量不合法。',
      tags: ['一', '二', '三', '四'],
    },
  });
  assert.equal(status, 400);
  assert.match(data.message, /最多添加 3 个标签/);
});

test('登录用户可以更新个人资料', async () => {
  const updated = await request('/users/me', {
    method: 'PUT',
    token: tokenA,
    body: { username: userA.username, email: userA.email, avatar: '/avatars/su.svg' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.data.avatar, '/avatars/su.svg');
  assert.equal(updated.data.data.email, userA.email);

  const current = await me(tokenA);
  assert.equal(current.avatar, '/avatars/su.svg');
});

test('详情浏览量 +1，已登录时返回点赞状态', async () => {
  const first = await request(`/questions/${questionId}`);
  const views = first.data.data.views;
  const second = await request(`/questions/${questionId}`);
  assert.equal(second.data.data.views, views + 1);

  const likedAnswer = await request(`/questions/${questionId}`, { token: tokenA });
  assert.equal(likedAnswer.data.data.answers[0].likedByMe, false);
});

test('用户主页统计正确，且不泄露邮箱', async () => {
  const profile = await request(`/users/${(await me(tokenA)).id}`);
  assert.equal(profile.status, 200);
  assert.equal(profile.data.data.stats.questionCount, 1);
  assert.equal(profile.data.data.user.email, undefined);
  assert.ok(profile.data.data.questions.length >= 1);

  const answererProfile = await request(`/users/${(await me(tokenB)).id}`);
  assert.equal(answererProfile.data.data.stats.answerCount, 1);
  assert.equal(answererProfile.data.data.stats.acceptedCount, 1);
});

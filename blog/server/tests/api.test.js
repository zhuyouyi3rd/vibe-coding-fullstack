import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { pool, query } from '../src/config/db.js';

let server;
let baseUrl;
const suffix = `${Date.now().toString().slice(-7)}${Math.random().toString(36).slice(2, 5)}`;
const userA = { username: `作者${suffix}`, email: `author_${suffix}@test.local`, password: 'test1234' };
const userB = { username: `读者${suffix}`, email: `reader_${suffix}@test.local`, password: 'test1234' };
const createdUsernames = [userA.username, userB.username];
let tokenA = '';
let tokenB = '';
let categoryId;
let categorySlug;
let postId;

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

test('健康检查可用', async () => {
  const { status, data } = await request('/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'ok');
});

test('静态页面允许加载外部封面图，但脚本仍限制为同源', async () => {
  const response = await fetch(`${baseUrl.replace(/\/api$/, '')}/`);
  const csp = response.headers.get('content-security-policy') || '';
  assert.match(csp, /img-src[^;]*https:/);
  assert.match(csp, /script-src 'self'/);
});

test('注册参数校验：密码过短返回 400', async () => {
  const { status, data } = await request('/auth/register', {
    method: 'POST',
    body: { username: userA.username, email: userA.email, password: '123' },
  });
  assert.equal(status, 400);
  assert.match(data.message, /密码至少 6 位/);
});

test('注册成功并返回 JWT', async () => {
  const { status, data } = await request('/auth/register', {
    method: 'POST',
    body: userA,
  });
  assert.equal(status, 201);
  assert.ok(data.token);
  assert.equal(data.user.username, userA.username);
  assert.equal(data.user.email, userA.email);
  assert.equal(data.user.password_hash, undefined);
});

test('用户名重复注册返回 409', async () => {
  const { status } = await request('/auth/register', {
    method: 'POST',
    body: { ...userA, email: `other_${suffix}@test.local` },
  });
  assert.equal(status, 409);
});

test('密码错误无法登录', async () => {
  const { status } = await request('/auth/login', {
    method: 'POST',
    body: { username: userA.username, password: 'wrong-password' },
  });
  assert.equal(status, 401);
});

test('登录成功并可通过 /auth/me 获取当前用户', async () => {
  const login = await request('/auth/login', {
    method: 'POST',
    body: { username: userA.username, password: userA.password },
  });
  assert.equal(login.status, 200);
  tokenA = login.data.token;

  const me = await request('/auth/me', { token: tokenA });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.username, userA.username);
});

test('未登录不能发布文章', async () => {
  const { status } = await request('/posts', {
    method: 'POST',
    body: { title: '未授权', content: 'x', categoryId: 1, tags: [] },
  });
  assert.equal(status, 401);
});

test('获取分类并发布文章', async () => {
  const categories = await request('/categories');
  assert.equal(categories.status, 200);
  assert.ok(categories.data.data.length >= 4);
  categoryId = categories.data.data[0].id;
  categorySlug = categories.data.data[0].slug;

  const created = await request('/posts', {
    method: 'POST',
    token: tokenA,
    body: {
      title: `测试文章 ${suffix}`,
      content: '## 小标题\n\n这是 **测试** 正文。\n\n```js\nconsole.log("hi");\n```',
      categoryId,
      tags: ['测试', 'API'],
      cover: '/covers/cover-1.svg',
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.data.title, `测试文章 ${suffix}`);
  assert.deepEqual(created.data.data.tags, ['测试', 'API']);
  postId = created.data.data.id;
});

test('文章列表支持关键词、分类和分页', async () => {
  const search = await request(`/posts?keyword=${encodeURIComponent(suffix)}`);
  assert.equal(search.status, 200);
  assert.ok(search.data.data.some((post) => post.id === postId));
  assert.ok(search.data.pagination.total >= 1);

  const filtered = await request(`/posts?category=${categorySlug}&page=1&pageSize=1`);
  assert.equal(filtered.status, 200);
  assert.equal(filtered.data.data.length, 1);
  assert.equal(filtered.data.pagination.pageSize, 1);
});

test('详情返回全文且浏览次数 +1', async () => {
  const first = await request(`/posts/${postId}`);
  assert.equal(first.status, 200);
  assert.match(first.data.data.content, /## 小标题/);
  const views = first.data.data.views;

  const second = await request(`/posts/${postId}`);
  assert.equal(second.data.data.views, views + 1);
});

test('第二个用户注册后不能编辑或删除别人的文章', async () => {
  const registered = await request('/auth/register', {
    method: 'POST',
    body: userB,
  });
  assert.equal(registered.status, 201);
  tokenB = registered.data.token;

  const update = await request(`/posts/${postId}`, {
    method: 'PUT',
    token: tokenB,
    body: {
      title: '越权修改',
      content: 'x',
      categoryId,
      tags: [],
      cover: '',
    },
  });
  assert.equal(update.status, 403);

  const remove = await request(`/posts/${postId}`, { method: 'DELETE', token: tokenB });
  assert.equal(remove.status, 403);
});

test('作者可以更新自己的文章', async () => {
  const updated = await request(`/posts/${postId}`, {
    method: 'PUT',
    token: tokenA,
    body: {
      title: `测试文章（已更新）${suffix}`,
      content: '更新后的内容。',
      categoryId,
      tags: ['更新'],
      cover: '/covers/cover-2.svg',
    },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.data.title, `测试文章（已更新）${suffix}`);
  assert.deepEqual(updated.data.data.tags, ['更新']);
});

test('个人资料可以更新，且不会返回密码', async () => {
  const updated = await request('/users/me', {
    method: 'PUT',
    token: tokenA,
    body: {
      username: userA.username,
      email: userA.email,
      avatar: '/avatars/lin.svg',
    },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.data.avatar, '/avatars/lin.svg');
  assert.equal(updated.data.data.password_hash, undefined);
});

test('作者主页包含统计和最近文章，且不泄露邮箱', async () => {
  const me = await request('/auth/me', { token: tokenA });
  const profile = await request(`/users/${me.data.user.id}`);
  assert.equal(profile.status, 200);
  assert.ok(profile.data.data.stats.postCount >= 1);
  assert.ok(profile.data.data.recentPosts.some((post) => post.id === postId));
  assert.equal(profile.data.data.email, undefined);
});

test('修改密码需要校验旧密码，修改后旧密码失效', async () => {
  const wrongCurrent = await request('/users/me/password', {
    method: 'PUT',
    token: tokenA,
    body: { currentPassword: 'not-the-password', newPassword: 'newpass456' },
  });
  assert.equal(wrongCurrent.status, 401);

  const changed = await request('/users/me/password', {
    method: 'PUT',
    token: tokenA,
    body: { currentPassword: userA.password, newPassword: 'newpass456' },
  });
  assert.equal(changed.status, 200);

  const oldLogin = await request('/auth/login', {
    method: 'POST',
    body: { username: userA.username, password: userA.password },
  });
  assert.equal(oldLogin.status, 401);

  const newLogin = await request('/auth/login', {
    method: 'POST',
    body: { username: userA.username, password: 'newpass456' },
  });
  assert.equal(newLogin.status, 200);
  tokenA = newLogin.data.token;

  const reset = await request('/users/me/password', {
    method: 'PUT',
    token: tokenA,
    body: { currentPassword: 'newpass456', newPassword: userA.password },
  });
  assert.equal(reset.status, 200);
});

test('作者可以删除自己的文章，之后详情返回 404', async () => {
  const removed = await request(`/posts/${postId}`, { method: 'DELETE', token: tokenA });
  assert.equal(removed.status, 204);

  const detail = await request(`/posts/${postId}`);
  assert.equal(detail.status, 404);
});

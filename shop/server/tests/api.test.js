import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { pool, query } from '../src/config/db.js';

let server;
let baseUrl;
const suffix = `${Date.now().toString().slice(-7)}${Math.random().toString(36).slice(2, 5)}`;
const userA = { username: `买家${suffix}`, email: `buyer_${suffix}@test.local`, password: 'test1234' };
const userB = { username: `路人${suffix}`, email: `other_${suffix}@test.local`, password: 'test1234' };
const createdUsernames = [userA.username, userB.username];
let tokenA = '';
let tokenB = '';
let addressId;
let secondAddressId;
let cartItemId;
let orderId;
let initialStock = 0;
let orderTotal = 0;

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

test('健康检查、商品列表和分类', async () => {
  const health = await request('/health');
  assert.equal(health.status, 200);

  const products = await request('/products');
  assert.equal(products.status, 200);
  assert.ok(products.data.data.length >= 8);
  const first = products.data.data[0];
  assert.ok(first.price > 0);
  assert.ok(first.images.length > 0);

  const categories = await request('/categories');
  assert.ok(categories.data.data.length >= 4);
});

test('注册两个用户', async () => {
  const a = await request('/auth/register', { method: 'POST', body: userA });
  assert.equal(a.status, 201);
  tokenA = a.data.token;

  const b = await request('/auth/register', { method: 'POST', body: userB });
  assert.equal(b.status, 201);
  tokenB = b.data.token;
});

test('未登录不能访问购物车', async () => {
  const { status } = await request('/cart');
  assert.equal(status, 401);
});

test('加入购物车、同商品数量合并、库存校验', async () => {
  const products = await request('/products');
  const product = products.data.data[0];
  initialStock = product.stock;

  const added = await request('/cart', {
    method: 'POST',
    token: tokenA,
    body: { productId: product.id, quantity: 2 },
  });
  assert.equal(added.status, 201);
  assert.equal(added.data.data.count, 2);

  const merged = await request('/cart', {
    method: 'POST',
    token: tokenA,
    body: { productId: product.id, quantity: 1 },
  });
  assert.equal(merged.data.data.count, 3);
  cartItemId = merged.data.data.items[0].id;
  orderTotal = merged.data.data.total;

  const tooMany = await request('/cart', {
    method: 'POST',
    token: tokenA,
    body: { productId: product.id, quantity: 999 },
  });
  assert.equal(tooMany.status, 400);
});

test('修改购物车数量，超过库存返回 400', async () => {
  const updated = await request(`/cart/${cartItemId}`, {
    method: 'PUT',
    token: tokenA,
    body: { quantity: 4 },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.data.count, 4);
  orderTotal = updated.data.data.total;

  const over = await request(`/cart/${cartItemId}`, {
    method: 'PUT',
    token: tokenA,
    body: { quantity: initialStock + 1 },
  });
  assert.equal(over.status, 400);
});

test('地址：首个地址自动默认，新默认地址会替换旧默认', async () => {
  const first = await request('/addresses', {
    method: 'POST',
    token: tokenA,
    body: {
      name: '林见山',
      phone: '13800138000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detail: '文三路 90 号',
    },
  });
  assert.equal(first.status, 201);
  assert.equal(first.data.data.isDefault, true);
  addressId = first.data.data.id;

  const second = await request('/addresses', {
    method: 'POST',
    token: tokenA,
    body: {
      name: '林见山',
      phone: '13900139000',
      province: '浙江省',
      city: '杭州市',
      district: '拱墅区',
      detail: '小河直街 18 号',
      isDefault: true,
    },
  });
  assert.equal(second.status, 201);
  assert.equal(second.data.data.isDefault, true);
  secondAddressId = second.data.data.id;

  const list = await request('/addresses', { token: tokenA });
  const old = list.data.data.find((item) => item.id === addressId);
  assert.equal(old.isDefault, false);
});

test('创建订单：计算总价、扣减库存、清空购物车', async () => {
  const created = await request('/orders', {
    method: 'POST',
    token: tokenA,
    body: { addressId: secondAddressId, cartItemIds: [cartItemId] },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.data.status, 'pending');
  assert.equal(created.data.data.total, orderTotal);
  assert.equal(created.data.data.items.length, 1);
  orderId = created.data.data.id;

  const cart = await request('/cart', { token: tokenA });
  assert.equal(cart.data.data.items.length, 0);

  const product = await request('/products/1');
  assert.equal(product.data.data.stock, initialStock - 4);
});

test('订单列表、详情与越权访问', async () => {
  const list = await request('/orders?status=pending', { token: tokenA });
  assert.equal(list.status, 200);
  assert.ok(list.data.data.some((item) => item.id === orderId));

  const detail = await request(`/orders/${orderId}`, { token: tokenA });
  assert.equal(detail.status, 200);
  assert.equal(detail.data.data.orderNo.startsWith('YS'), true);

  const other = await request(`/orders/${orderId}`, { token: tokenB });
  assert.equal(other.status, 404);
});

test('取消待支付订单恢复库存，重复取消返回 409', async () => {
  const cancelled = await request(`/orders/${orderId}/cancel`, { method: 'PUT', token: tokenA });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.data.status, 'cancelled');

  const product = await request('/products/1');
  assert.equal(product.data.data.stock, initialStock);

  const again = await request(`/orders/${orderId}/cancel`, { method: 'PUT', token: tokenA });
  assert.equal(again.status, 409);
});

test('地址删除后，剩余地址自动补默认', async () => {
  const removed = await request(`/addresses/${secondAddressId}`, { method: 'DELETE', token: tokenA });
  assert.equal(removed.status, 204);
  const list = await request('/addresses', { token: tokenA });
  assert.equal(list.data.data.length, 1);
  assert.equal(list.data.data[0].id, addressId);
  assert.equal(list.data.data[0].isDefault, true);
});

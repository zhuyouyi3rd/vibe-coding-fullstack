import { query, withTransaction } from '../config/db.js';
import { ApiError } from '../utils/http.js';
import { mapAddress } from './address.model.js';

function parseJson(value, fallback) {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value || '');
  } catch {
    return fallback;
  }
}

function mapItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.product_name,
    image: row.product_image,
    quantity: Number(row.quantity),
    price: Number(row.price),
    subtotal: Number((Number(row.price) * Number(row.quantity)).toFixed(2)),
  };
}

export function mapOrder(row, items = []) {
  return {
    id: row.id,
    orderNo: row.order_no,
    status: row.status,
    total: Number(row.total_price),
    shippingFee: Number(row.shipping_fee || 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    address: parseJson(row.address_snapshot, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderNumber() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `YS${stamp}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

export async function createOrder({ userId, addressId, cartItemIds }) {
  return withTransaction(async (connection) => {
    const [addresses] = await connection.execute(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ? LIMIT 1',
      [addressId, userId],
    );
    if (!addresses.length) throw new ApiError(400, '请选择有效的收货地址');
    const address = mapAddress(addresses[0]);

    const placeholders = cartItemIds.map(() => '?').join(',');
    const [cartRows] = await connection.execute(
      `SELECT c.id AS cart_id, c.quantity, p.id AS product_id, p.name, p.price, p.stock, p.images
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ? AND c.id IN (${placeholders}) FOR UPDATE`,
      [userId, ...cartItemIds],
    );
    if (cartRows.length !== cartItemIds.length) {
      throw new ApiError(400, '购物车中有商品已失效，请刷新后重试');
    }

    for (const row of cartRows) {
      if (Number(row.quantity) > Number(row.stock)) {
        throw new ApiError(400, `「${row.name}」库存不足，仅剩 ${row.stock} 件`);
      }
    }

    const itemsTotal = Number(
      cartRows.reduce((sum, row) => sum + Number(row.price) * Number(row.quantity), 0).toFixed(2),
    );
    const shippingFee = itemsTotal >= 299 ? 0 : 12;
    const total = Number((itemsTotal + shippingFee).toFixed(2));
    const snapshot = {
      ...address,
      fullAddress: `${address.province}${address.city}${address.district}${address.detail}`,
    };

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (order_no, user_id, address_id, address_snapshot, total_price, shipping_fee, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [orderNumber(), userId, addressId, JSON.stringify(snapshot), total, shippingFee],
    );
    const orderId = orderResult.insertId;

    for (const row of cartRows) {
      const images = parseJson(row.images, []);
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, row.product_id, row.name, images[0] || '', row.quantity, row.price],
      );
      await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [row.quantity, row.product_id]);
    }

    await connection.execute(
      `DELETE FROM cart_items WHERE user_id = ? AND id IN (${placeholders})`,
      [userId, ...cartItemIds],
    );

    return orderId;
  });
}

export async function getOrder(id, userId) {
  const rows = await query('SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1', [id, userId]);
  if (!rows.length) return null;
  const items = await query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [id]);
  return mapOrder(rows[0], items.map(mapItem));
}

export async function listOrders({ userId, status, page, pageSize, offset }) {
  const where = ['user_id = ?'];
  const params = [userId];
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const countRows = await query(`SELECT COUNT(*) AS total FROM orders ${whereSql}`, params);
  const rows = await query(
    `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );

  let itemsByOrder = new Map();
  if (rows.length) {
    const ids = rows.map((row) => row.id);
    const items = await query(
      `SELECT * FROM order_items WHERE order_id IN (${ids.map(() => '?').join(',')}) ORDER BY id ASC`,
      ids,
    );
    for (const item of items) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push(mapItem(item));
    }
  }

  return {
    items: rows.map((row) => mapOrder(row, itemsByOrder.get(row.id) || [])),
    total: Number(countRows[0].total),
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(Number(countRows[0].total) / pageSize)),
  };
}

export async function cancelOrder({ id, userId }) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, userId],
    );
    if (!rows.length) throw new ApiError(404, '订单不存在');
    if (rows[0].status !== 'pending') throw new ApiError(409, '只有待支付订单可以取消');

    const [items] = await connection.execute('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      if (item.product_id) {
        await connection.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }
    await connection.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id]);
    const [updated] = await connection.execute('SELECT * FROM orders WHERE id = ?', [id]);
    return mapOrder(updated[0], items.map(mapItem));
  });
}

import { query, withTransaction } from '../config/db.js';
import { ApiError } from '../utils/http.js';

function parseImages(value) {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

export async function getCart(userId) {
  const rows = await query(
    `SELECT c.id, c.quantity, p.id AS product_id, p.name, p.price, p.stock, p.images, p.category
     FROM cart_items c JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ? ORDER BY c.created_at ASC`,
    [userId],
  );
  const items = rows.map((row) => ({
    id: row.id,
    quantity: Number(row.quantity),
    product: {
      id: row.product_id,
      name: row.name,
      price: Number(row.price),
      stock: Number(row.stock),
      images: parseImages(row.images),
      category: row.category,
    },
  }));
  return {
    items,
    total: Number(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export async function addToCart({ userId, productId, quantity }) {
  return withTransaction(async (connection) => {
    const [products] = await connection.execute(
      'SELECT id, stock FROM products WHERE id = ? FOR UPDATE',
      [productId],
    );
    if (!products.length) throw new ApiError(404, '商品不存在');
    const stock = Number(products[0].stock);

    const [existing] = await connection.execute(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1',
      [userId, productId],
    );
    const nextQuantity = (existing.length ? Number(existing[0].quantity) : 0) + quantity;
    if (nextQuantity > stock) throw new ApiError(400, `库存不足，当前最多可购买 ${stock} 件`);

    if (existing.length) {
      await connection.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [nextQuantity, existing[0].id]);
    } else {
      await connection.execute(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity],
      );
    }
  });
}

export async function updateCartItem({ userId, cartItemId, quantity }) {
  const rows = await query(
    `SELECT c.id, c.product_id, p.stock FROM cart_items c
     JOIN products p ON p.id = c.product_id WHERE c.id = ? AND c.user_id = ? LIMIT 1`,
    [cartItemId, userId],
  );
  if (!rows.length) throw new ApiError(404, '购物车商品不存在');
  if (quantity > Number(rows[0].stock)) {
    throw new ApiError(400, `库存不足，当前最多可购买 ${rows[0].stock} 件`);
  }
  await query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItemId]);
}

export async function removeCartItem({ userId, cartItemId }) {
  const result = await query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartItemId, userId]);
  if (!result.affectedRows) throw new ApiError(404, '购物车商品不存在');
}

import { query } from '../config/db.js';
import { ApiError } from '../utils/http.js';

function parseImages(value) {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

export function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stock: Number(row.stock),
    images: parseImages(row.images),
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function listProducts({ category, keyword, sort }) {
  const where = [];
  const params = [];
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (keyword) {
    where.push('(name LIKE ? OR description LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order =
    sort === 'price_asc'
      ? 'ORDER BY price ASC, id ASC'
      : sort === 'price_desc'
        ? 'ORDER BY price DESC, id ASC'
        : 'ORDER BY id ASC';
  const rows = await query(`SELECT * FROM products ${whereSql} ${order}`, params);
  return rows.map(mapProduct);
}

export async function getProduct(id) {
  const rows = await query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
  return rows.length ? mapProduct(rows[0]) : null;
}

export async function getCategories() {
  const rows = await query('SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category');
  return rows.map((row) => ({ name: row.category, count: Number(row.count) }));
}

export async function requireProduct(id) {
  const product = await getProduct(id);
  if (!product) throw new ApiError(404, '商品不存在');
  return product;
}

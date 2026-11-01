import { query, withTransaction } from '../config/db.js';
import { ApiError } from '../utils/http.js';

export function mapAddress(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    province: row.province,
    city: row.city,
    district: row.district,
    detail: row.detail,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

export async function listAddresses(userId) {
  const rows = await query(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
    [userId],
  );
  return rows.map(mapAddress);
}

export async function createAddress(userId, input) {
  return withTransaction(async (connection) => {
    const [existing] = await connection.execute('SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?', [userId]);
    const isDefault = input.isDefault || Number(existing[0].total) === 0;
    if (isDefault) {
      await connection.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }
    const [result] = await connection.execute(
      `INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, input.name, input.phone, input.province, input.city, input.district, input.detail, isDefault ? 1 : 0],
    );
    const [rows] = await connection.execute('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
    return mapAddress(rows[0]);
  });
}

export async function updateAddress(userId, id, input) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, userId],
    );
    if (!rows.length) throw new ApiError(404, '地址不存在');
    const current = rows[0];
    const makeDefault = input.isDefault || !current.is_default && Boolean(input.isDefault);
    if (makeDefault) {
      await connection.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }
    await connection.execute(
      `UPDATE addresses SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [
        input.name,
        input.phone,
        input.province,
        input.city,
        input.district,
        input.detail,
        makeDefault ? 1 : Number(current.is_default),
        id,
        userId,
      ],
    );
    const [updated] = await connection.execute('SELECT * FROM addresses WHERE id = ?', [id]);
    return mapAddress(updated[0]);
  });
}

export async function removeAddress(userId, id) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, userId],
    );
    if (!rows.length) throw new ApiError(404, '地址不存在');
    await connection.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows[0].is_default) {
      const [rest] = await connection.execute(
        'SELECT id FROM addresses WHERE user_id = ? ORDER BY id ASC LIMIT 1',
        [userId],
      );
      if (rest.length) {
        await connection.execute('UPDATE addresses SET is_default = 1 WHERE id = ?', [rest[0].id]);
      }
    }
  });
}

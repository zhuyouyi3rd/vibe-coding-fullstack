import { query } from '../config/db.js';

export async function findByUsernameOrEmail(username, email) {
  return query('SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 2', [
    username,
    email,
  ]);
}

export async function findById(id) {
  const rows = await query(
    'SELECT id, username, email, avatar, created_at FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

export async function findByUsernameWithPassword(username) {
  const rows = await query(
    'SELECT id, username, email, password_hash, avatar, created_at FROM users WHERE username = ? LIMIT 1',
    [username],
  );
  return rows[0] || null;
}

export async function createUser({ username, email, passwordHash, avatar }) {
  const result = await query(
    'INSERT INTO users (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, avatar],
  );
  return findById(result.insertId);
}

import { query } from '../config/db.js';

export async function findByUsernameOrEmail(username, email) {
  return query('SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 2', [
    username,
    email,
  ]);
}

export async function findById(id) {
  const rows = await query(
    'SELECT id, username, email, avatar, points, created_at FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

export async function findByUsernameWithPassword(username) {
  const rows = await query(
    'SELECT id, username, email, password_hash, avatar, points, created_at FROM users WHERE username = ? LIMIT 1',
    [username],
  );
  return rows[0] || null;
}

export async function createUser({ username, email, passwordHash, avatar }) {
  const result = await query(
    'INSERT INTO users (username, email, password_hash, avatar, points) VALUES (?, ?, ?, ?, 20)',
    [username, email, passwordHash, avatar],
  );
  return findById(result.insertId);
}

export async function updateUser(id, { username, email, avatar }) {
  await query('UPDATE users SET username = ?, email = ?, avatar = ? WHERE id = ?', [
    username,
    email,
    avatar,
    id,
  ]);
  return findById(id);
}

export async function takenByOthers({ username, email, excludeId }) {
  return query(
    'SELECT id, username, email FROM users WHERE (username = ? OR email = ?) AND id <> ? LIMIT 2',
    [username, email, excludeId],
  );
}

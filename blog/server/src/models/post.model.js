import { query } from '../config/db.js';

const POST_SELECT = `
  SELECT
    p.id, p.title, p.content, p.cover, p.tags, p.views, p.created_at, p.updated_at,
    p.author_id,
    c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
    u.username AS author_name, u.avatar AS author_avatar
  FROM posts p
  JOIN categories c ON c.id = p.category_id
  JOIN users u ON u.id = p.author_id
`;

function parseTags(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function excerptOf(markdown, length = 120) {
  const plain = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

export function mapPost(row, { withContent = false } = {}) {
  return {
    id: row.id,
    title: row.title,
    ...(withContent ? { content: row.content } : { excerpt: excerptOf(row.content) }),
    cover: row.cover,
    tags: parseTags(row.tags),
    views: row.views,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
    },
    author: {
      id: row.author_id,
      username: row.author_name,
      avatar: row.author_avatar,
    },
  };
}

export async function listPosts({ page, pageSize, offset, category, keyword, authorId }) {
  const where = [];
  const params = [];

  if (category) {
    where.push('c.slug = ?');
    params.push(category);
  }
  if (keyword) {
    where.push('(p.title LIKE ? OR p.content LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like);
  }
  if (authorId) {
    where.push('p.author_id = ?');
    params.push(authorId);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countRows = await query(
    `SELECT COUNT(*) AS total FROM posts p JOIN categories c ON c.id = p.category_id ${whereSql}`,
    params,
  );
  const rows = await query(
    `${POST_SELECT} ${whereSql} ORDER BY p.created_at DESC, p.id DESC LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );

  return {
    items: rows.map((row) => mapPost(row)),
    total: countRows[0].total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(countRows[0].total / pageSize)),
  };
}

export async function findPostById(id, { withContent = true, incrementViews = false } = {}) {
  if (incrementViews) {
    await query('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);
  }
  const rows = await query(`${POST_SELECT} WHERE p.id = ? LIMIT 1`, [id]);
  return rows.length ? mapPost(rows[0], { withContent }) : null;
}

export async function createPost({ title, content, cover, categoryId, tags, authorId }) {
  const result = await query(
    `INSERT INTO posts (title, content, cover, category_id, tags, author_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, content, cover, categoryId, JSON.stringify(tags), authorId],
  );
  return findPostById(result.insertId);
}

export async function updatePost(id, { title, content, cover, categoryId, tags }) {
  await query(
    `UPDATE posts
     SET title = ?, content = ?, cover = ?, category_id = ?, tags = ?
     WHERE id = ?`,
    [title, content, cover, categoryId, JSON.stringify(tags), id],
  );
  return findPostById(id);
}

export async function deletePost(id) {
  await query('DELETE FROM posts WHERE id = ?', [id]);
}

export async function categoryExists(id) {
  const rows = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [id]);
  return rows.length > 0;
}

export async function listCategories() {
  const rows = await query(`
    SELECT c.id, c.name, c.slug, c.description, COUNT(p.id) AS post_count
    FROM categories c
    LEFT JOIN posts p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.id ASC
  `);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    postCount: Number(row.post_count),
  }));
}

export async function getAuthorStats(authorId) {
  const rows = await query(
    `SELECT COUNT(*) AS post_count, COALESCE(SUM(views), 0) AS view_count
     FROM posts WHERE author_id = ?`,
    [authorId],
  );
  return {
    postCount: Number(rows[0].post_count),
    viewCount: Number(rows[0].view_count),
  };
}

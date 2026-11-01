export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatar: row.avatar,
    points: row.points,
    createdAt: row.created_at,
  };
}

export function publicAuthor(row) {
  return {
    id: row.author_id,
    username: row.author_name,
    avatar: row.author_avatar,
    points: row.author_points,
  };
}

export function excerptOf(markdown, length = 110) {
  const plain = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}

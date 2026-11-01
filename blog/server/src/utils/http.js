export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(query.pageSize ?? '10', 10) || 10));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatar: row.avatar,
    createdAt: row.created_at,
  };
}

export function publicAuthor(row) {
  return {
    id: row.author_id,
    username: row.author_name,
    avatar: row.author_avatar,
  };
}

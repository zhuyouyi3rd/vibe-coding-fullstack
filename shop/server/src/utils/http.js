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
    createdAt: row.created_at,
  };
}

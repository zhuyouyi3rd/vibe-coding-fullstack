import { ZodError } from 'zod';
import { ApiError } from '../utils/http.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `接口不存在：${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return res.status(400).json({ message: first?.message || '提交内容不符合要求' });
  }
  if (error?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: '该记录已存在' });
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: '请求内容不是合法 JSON' });
  }
  const status = error instanceof ApiError ? error.status : 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({
    message: status >= 500 ? '服务器开小差了，请稍后再试' : error.message,
  });
}

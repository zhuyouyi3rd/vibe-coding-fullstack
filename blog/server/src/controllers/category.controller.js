import { listCategories } from '../models/post.model.js';

export async function getCategories(_req, res) {
  res.json({ data: await listCategories() });
}

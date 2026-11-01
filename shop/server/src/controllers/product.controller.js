import { ApiError } from '../utils/http.js';
import { getCategories, getProduct, listProducts } from '../models/product.model.js';

export async function getProducts(req, res) {
  const data = await listProducts({
    category: req.query.category ? String(req.query.category) : undefined,
    keyword: req.query.keyword ? String(req.query.keyword).trim() : undefined,
    sort: req.query.sort ? String(req.query.sort) : undefined,
  });
  res.json({ data });
}

export async function getProductDetail(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '商品不存在');
  const product = await getProduct(id);
  if (!product) throw new ApiError(404, '商品不存在');
  res.json({ data: product });
}

export async function getProductCategories(_req, res) {
  res.json({ data: await getCategories() });
}

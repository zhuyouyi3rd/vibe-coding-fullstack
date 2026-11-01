import { z } from 'zod';
import { addToCart, getCart, removeCartItem, updateCartItem } from '../models/cart.model.js';

const addSchema = z.object({
  productId: z.coerce.number().int().positive('请选择商品'),
  quantity: z.coerce.number().int().min(1, '数量至少为 1').max(99, '单次最多购买 99 件'),
});

const updateSchema = z.object({
  quantity: z.coerce.number().int().min(1, '数量至少为 1').max(99, '数量最多 99 件'),
});

export async function readCart(req, res) {
  res.json({ data: await getCart(req.user.id) });
}

export async function addCart(req, res) {
  const input = addSchema.parse(req.body);
  await addToCart({ userId: req.user.id, ...input });
  res.status(201).json({ data: await getCart(req.user.id) });
}

export async function updateCart(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  const input = updateSchema.parse(req.body);
  await updateCartItem({ userId: req.user.id, cartItemId: id, quantity: input.quantity });
  res.json({ data: await getCart(req.user.id) });
}

export async function deleteCart(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  await removeCartItem({ userId: req.user.id, cartItemId: id });
  res.json({ data: await getCart(req.user.id) });
}

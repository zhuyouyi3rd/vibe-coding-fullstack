import { z } from 'zod';
import { ApiError } from '../utils/http.js';
import { cancelOrder, createOrder, getOrder, listOrders } from '../models/order.model.js';

const STATUSES = new Set(['pending', 'paid', 'shipped', 'completed', 'cancelled']);

const createSchema = z.object({
  addressId: z.coerce.number().int().positive('请选择收货地址'),
  cartItemIds: z.array(z.coerce.number().int().positive()).min(1, '请选择要结算的商品'),
});

export async function createNewOrder(req, res) {
  const input = createSchema.parse(req.body);
  const orderId = await createOrder({
    userId: req.user.id,
    addressId: input.addressId,
    cartItemIds: [...new Set(input.cartItemIds)],
  });
  const order = await getOrder(orderId, req.user.id);
  res.status(201).json({ data: order });
}

export async function getOrders(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page ?? '1', 10) || 1);
  const pageSize = Math.min(30, Math.max(1, Number.parseInt(req.query.pageSize ?? '10', 10) || 10));
  const status = req.query.status && STATUSES.has(req.query.status) ? req.query.status : undefined;
  const result = await listOrders({
    userId: req.user.id,
    status,
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  });
  res.json({
    data: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

export async function getOrderDetail(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '订单不存在');
  const order = await getOrder(id, req.user.id);
  if (!order) throw new ApiError(404, '订单不存在');
  res.json({ data: order });
}

export async function cancelExistingOrder(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '订单不存在');
  const order = await cancelOrder({ id, userId: req.user.id });
  res.json({ data: order, message: '订单已取消，库存已恢复' });
}

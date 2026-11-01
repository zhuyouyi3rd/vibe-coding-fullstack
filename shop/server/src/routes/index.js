import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';
import { login, me, register } from '../controllers/auth.controller.js';
import {
  getProductCategories,
  getProductDetail,
  getProducts,
} from '../controllers/product.controller.js';
import { addCart, deleteCart, readCart, updateCart } from '../controllers/cart.controller.js';
import {
  addAddress,
  deleteAddress,
  editAddress,
  getAddresses,
} from '../controllers/address.controller.js';
import {
  cancelExistingOrder,
  createNewOrder,
  getOrderDetail,
  getOrders,
} from '../controllers/order.controller.js';

export const api = Router();

api.get('/health', asyncHandler(async (_req, res) => {
  const { query } = await import('../config/db.js');
  await query('SELECT 1');
  res.json({ status: 'ok', service: 'yunshi-shop', time: new Date().toISOString() });
}));

api.post('/auth/register', asyncHandler(register));
api.post('/auth/login', asyncHandler(login));
api.get('/auth/me', requireAuth, asyncHandler(me));

api.get('/products', asyncHandler(getProducts));
api.get('/products/:id', asyncHandler(getProductDetail));
api.get('/categories', asyncHandler(getProductCategories));

api.get('/cart', requireAuth, asyncHandler(readCart));
api.post('/cart', requireAuth, asyncHandler(addCart));
api.put('/cart/:id', requireAuth, asyncHandler(updateCart));
api.delete('/cart/:id', requireAuth, asyncHandler(deleteCart));

api.get('/addresses', requireAuth, asyncHandler(getAddresses));
api.post('/addresses', requireAuth, asyncHandler(addAddress));
api.put('/addresses/:id', requireAuth, asyncHandler(editAddress));
api.delete('/addresses/:id', requireAuth, asyncHandler(deleteAddress));

api.get('/orders', requireAuth, asyncHandler(getOrders));
api.post('/orders', requireAuth, asyncHandler(createNewOrder));
api.get('/orders/:id', requireAuth, asyncHandler(getOrderDetail));
api.put('/orders/:id/cancel', requireAuth, asyncHandler(cancelExistingOrder));

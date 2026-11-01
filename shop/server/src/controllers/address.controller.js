import { z } from 'zod';
import { ApiError } from '../utils/http.js';
import { createAddress, listAddresses, removeAddress, updateAddress } from '../models/address.model.js';

const addressSchema = z.object({
  name: z.string().trim().min(2, '请填写收货人姓名').max(30),
  phone: z
    .string()
    .trim()
    .regex(/^1[3-9]\d{9}$/, '请填写 11 位手机号'),
  province: z.string().trim().min(1, '请填写省份').max(40),
  city: z.string().trim().min(1, '请填写城市').max(40),
  district: z.string().trim().min(1, '请填写区县').max(40),
  detail: z.string().trim().min(3, '请填写详细地址').max(255),
  isDefault: z.coerce.boolean().optional().default(false),
});

export async function getAddresses(req, res) {
  res.json({ data: await listAddresses(req.user.id) });
}

export async function addAddress(req, res) {
  const input = addressSchema.parse(req.body);
  res.status(201).json({ data: await createAddress(req.user.id, input) });
}

export async function editAddress(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '地址不存在');
  const input = addressSchema.parse(req.body);
  res.json({ data: await updateAddress(req.user.id, id, input) });
}

export async function deleteAddress(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, '地址不存在');
  await removeAddress(req.user.id, id);
  res.status(204).end();
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  createdAt: string;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
}

export interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNo: string;
  status: OrderStatus;
  total: number;
  shippingFee: number;
  itemCount: number;
  items: OrderItem[];
  address: Address & { fullAddress?: string };
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface OrderListResponse {
  data: Order[];
  pagination: Pagination;
}

export interface AuthResponse {
  token: string;
  user: User;
}

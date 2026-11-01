import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8');
const connection = await mysql.createConnection({
  ...env.db,
  multipleStatements: true,
  charset: 'utf8mb4',
  timezone: 'Z',
});
await connection.query(schema);

const passwordHash = await bcrypt.hash('demo1234', 12);
const users = [
  { username: '林见山', email: 'demo@yunshi.local', avatar: '/avatars/lin.svg' },
  { username: '周小满', email: 'xiaoman@yunshi.local', avatar: '/avatars/zhou.svg' },
];
for (const user of users) {
  await connection.query(
    'INSERT INTO users (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)',
    [user.username, user.email, passwordHash, user.avatar],
  );
}

const products = [
  {
    name: '雾岭手冲咖啡壶',
    category: '咖啡',
    price: 268,
    stock: 18,
    image: '/products/p1.svg',
    description:
      '一只适合清晨使用的手冲壶。细口壶嘴让水流更稳定，胡桃木手柄隔热顺手。\n\n容量 600ml，适合 1–2 人。附赠 20 张滤纸。',
  },
  {
    name: '原色亚麻桌布',
    category: '家居',
    price: 168,
    stock: 24,
    image: '/products/p2.svg',
    description:
      '未经漂白的亚麻，保留纤维原本的纹理与小结。洗过几次之后会更柔软。\n\n尺寸 140 × 220cm，适合四人餐桌。',
  },
  {
    name: '黄铜阅读台灯',
    category: '家居',
    price: 499,
    stock: 9,
    image: '/products/p3.svg',
    description:
      '黄铜灯罩会随着时间慢慢氧化，留下使用过的痕迹。暖光 2700K，适合放在床头或书桌一角。\n\n手工装配，每盏灯的纹理略有不同。',
  },
  {
    name: '手作陶瓷花瓶',
    category: '家居',
    price: 228,
    stock: 15,
    image: '/products/p4.svg',
    description:
      '拉坯成型，釉面有细微的气孔和流釉。适合插一两枝当季的花，也可以空着放在窗边。\n\n高 22cm，口径 6cm。',
  },
  {
    name: '胡桃木早餐托盘',
    category: '家居',
    price: 138,
    stock: 30,
    image: '/products/p5.svg',
    description:
      '整块胡桃木切削，边缘做了圆角处理。可以端早餐，也可以作为桌面的收纳托盘。\n\n尺寸 32 × 22cm，表面使用食品级木蜡油。',
  },
  {
    name: '燕麦色羊毛盖毯',
    category: '织物',
    price: 369,
    stock: 12,
    image: '/products/p6.svg',
    description:
      '混纺羊毛，手感柔软但不扎。燕麦色很适合秋天的沙发和阅读椅。\n\n尺寸 130 × 180cm，可机洗轻柔模式。',
  },
  {
    name: '雪松与无花果香薰',
    category: '香氛',
    price: 98,
    stock: 40,
    image: '/products/p7.svg',
    description:
      '前调是无花果叶的青绿，中段慢慢转向雪松和一点烟熏。大豆蜡，燃烧时间约 40 小时。\n\n建议每次点燃 1–2 小时，让香气均匀扩散。',
  },
  {
    name: '厚帆布托特包',
    category: '织物',
    price: 158,
    stock: 26,
    image: '/products/p8.svg',
    description:
      '16 安厚帆布，能装下电脑、书和一把折叠伞。内侧有一个小口袋，肩带长度适合单肩背。\n\n尺寸 38 × 34cm，原色未漂。',
  },
];

for (const product of products) {
  await connection.query(
    `INSERT INTO products (name, description, price, stock, images, category)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [product.name, product.description, product.price, product.stock, JSON.stringify([product.image]), product.category],
  );
}

const [[demo]] = await connection.query('SELECT id FROM users WHERE username = ?', ['林见山']);
const [addressResult] = await connection.query(
  `INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default)
   VALUES (?, '林见山', '13800138000', '浙江省', '杭州市', '西湖区', '文三路 90 号 3 幢 502', 1)`,
  [demo.id],
);
const addressSnapshot = {
  id: addressResult.insertId,
  name: '林见山',
  phone: '13800138000',
  province: '浙江省',
  city: '杭州市',
  district: '西湖区',
  detail: '文三路 90 号 3 幢 502',
  isDefault: true,
  fullAddress: '浙江省杭州市西湖区文三路 90 号 3 幢 502',
};

const [orderResult] = await connection.query(
  `INSERT INTO orders (order_no, user_id, address_id, address_snapshot, total_price, shipping_fee, status, created_at, updated_at)
   VALUES ('YS202610180930001', ?, ?, ?, 868, 0, 'completed', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY))`,
  [demo.id, addressResult.insertId, JSON.stringify(addressSnapshot)],
);
await connection.query(
  `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price)
   VALUES (?, 3, '黄铜阅读台灯', '/products/p3.svg', 1, 499), (?, 6, '燕麦色羊毛盖毯', '/products/p6.svg', 1, 369)`,
  [orderResult.insertId, orderResult.insertId],
);

const [[counts]] = await connection.query(`
  SELECT (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM products) AS products,
         (SELECT COUNT(*) FROM addresses) AS addresses,
         (SELECT COUNT(*) FROM orders) AS orders
`);
await connection.end();
console.log('云市数据库初始化完成');
console.log(`用户 ${counts.users} / 商品 ${counts.products} / 地址 ${counts.addresses} / 订单 ${counts.orders}`);
console.log('演示账号：林见山 / demo1234');

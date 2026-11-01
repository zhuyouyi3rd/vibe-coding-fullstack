import 'dotenv/config';

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: num(process.env.PORT, 4201),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5284',
  jwtSecret: process.env.JWT_SECRET || 'dev-shop-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: num(process.env.DB_PORT, 3307),
    user: process.env.DB_USER || 'shop',
    password: process.env.DB_PASSWORD || 'shoppass',
    database: process.env.DB_NAME || 'yunshi_shop',
  },
};

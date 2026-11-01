import 'dotenv/config';

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 4101),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5184',
  jwtSecret: process.env.JWT_SECRET || 'dev-wenqu-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: num(process.env.DB_PORT, 3307),
    user: process.env.DB_USER || 'qa',
    password: process.env.DB_PASSWORD || 'qapass',
    database: process.env.DB_NAME || 'wenqu_qa',
  },
};

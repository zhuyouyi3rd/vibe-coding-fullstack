import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const server = app.listen(env.port, '127.0.0.1', () => {
  console.log(`云市 API ready at http://127.0.0.1:${env.port}/api`);
});

async function shutdown(signal) {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

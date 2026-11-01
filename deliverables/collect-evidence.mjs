import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from '../blog/node_modules/mysql2/promise.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const projects = [
  { key: 'blog', label: '个人博客', db: 'shiyu_blog', routes: '../blog/server/src/routes/index.js' },
  { key: 'qa', label: '问答社区', db: 'wenqu_qa', routes: '../qa/server/src/routes/index.js' },
  { key: 'shop', label: '在线商城', db: 'yunshi_shop', routes: '../shop/server/src/routes/index.js' },
];

const connection = await mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', password: '' });
const result = [];

for (const project of projects) {
  const [rows] = await connection.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, COLUMN_KEY AS columnKey
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [project.db],
  );
  const tables = [];
  for (const row of rows) {
    let table = tables.find((item) => item.name === row.tableName);
    if (!table) {
      table = { name: row.tableName, columns: [] };
      tables.push(table);
    }
    table.columns.push({ name: row.columnName, type: row.columnType, key: row.columnKey });
  }

  const source = fs.readFileSync(path.join(root, project.routes), 'utf8');
  const routes = [];
  for (const line of source.split('\n')) {
    const match = line.match(/api\.(get|post|put|delete)\('([^']+)'/);
    if (!match) continue;
    const auth = line.includes('requireAuth') ? '需登录' : line.includes('optionalAuth') ? '可选' : '公开';
    routes.push({ method: match[1].toUpperCase(), path: '/api' + match[2], auth });
  }
  result.push({ key: project.key, label: project.label, db: project.db, tables, routes });
}

await connection.end();
fs.writeFileSync(path.join(root, 'evidence.json'), JSON.stringify(result, null, 2));
console.log(result.map((item) => `${item.label}: tables=${item.tables.length} routes=${item.routes.length}`).join('\n'));

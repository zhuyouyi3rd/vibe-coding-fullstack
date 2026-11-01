import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, '.runtime', 'mariadb-11.4.13-winx64');
const data = path.join(root, '.devdb', 'data');
const mysqld = path.join(base, 'bin', process.platform === 'win32' ? 'mysqld.exe' : 'mysqld');
const port = 3307;
const tmpdir = path.join(root, '.runtime', 'tmp');
fs.mkdirSync(tmpdir, { recursive: true });

if (!fs.existsSync(mysqld) || !fs.existsSync(data)) {
  console.error('未找到本机自带的 MariaDB，请按 README 配置 MySQL 并修改 server/.env。');
  process.exit(1);
}

function isReady() {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const finish = (ready) => {
      socket.destroy();
      resolve(ready);
    };
    socket.setTimeout(800);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

if (await isReady()) {
  console.log('MariaDB 已在 127.0.0.1:3307 运行。');
  process.exit(0);
}

const child = spawn(
  mysqld,
  [`--datadir=${data}`, `--tmpdir=${tmpdir}`, '--port=3307', '--bind-address=127.0.0.1', '--skip-name-resolve'],
  { detached: true, stdio: 'ignore', windowsHide: true },
);
child.unref();

for (let attempt = 0; attempt < 40; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (await isReady()) {
    console.log('MariaDB 已就绪：127.0.0.1:3307');
    process.exit(0);
  }
}

console.error('MariaDB 启动超时，请检查 blog/.devdb/data 下的错误日志。');
process.exit(1);

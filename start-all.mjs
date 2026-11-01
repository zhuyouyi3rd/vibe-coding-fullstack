import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const projects = [
  { name: '个人博客', dir: 'blog', port: 4000 },
  { name: '问答社区', dir: 'qa', port: 4101 },
  { name: '在线商城', dir: 'shop', port: 4201 },
];

function isOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const end = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(700);
    socket.once('connect', () => end(true));
    socket.once('timeout', () => end(false));
    socket.once('error', () => end(false));
  });
}

if (!(await isOpen(3307))) {
  console.log('启动本地 MariaDB…');
  const result = spawnSync(process.execPath, [path.join(root, 'blog', 'scripts', 'start-db.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

for (const project of projects) {
  if (await isOpen(project.port)) {
    console.log(`${project.name} 已在 http://127.0.0.1:${project.port} 运行`);
    continue;
  }
  console.log(`启动 ${project.name}…`);
  const child = spawn(process.execPath, [path.join(root, project.dir, 'server', 'src', 'index.js')], {
    cwd: path.join(root, project.dir, 'server'),
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (await isOpen(project.port)) {
      ready = true;
      break;
    }
  }
  console.log(ready ? `  → http://127.0.0.1:${project.port}` : `  → 启动超时，请检查 ${project.dir}/server`);
}

console.log('\n全部入口：');
for (const project of projects) console.log(`- ${project.name}: http://127.0.0.1:${project.port}`);
console.log('- 账号：林见山 / demo1234');

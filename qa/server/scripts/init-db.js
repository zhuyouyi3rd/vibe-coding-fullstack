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
  { username: '林见山', email: 'demo@wenqu.local', avatar: '/avatars/lin.svg' },
  { username: '周小满', email: 'xiaoman@wenqu.local', avatar: '/avatars/zhou.svg' },
  { username: '陈屿', email: 'chenyu@wenqu.local', avatar: '/avatars/chen.svg' },
  { username: '苏晚', email: 'suwan@wenqu.local', avatar: '/avatars/su.svg' },
  { username: '何川', email: 'hechuan@wenqu.local', avatar: '/avatars/he.svg' },
];

for (const user of users) {
  await connection.query(
    'INSERT INTO users (username, email, password_hash, avatar, points) VALUES (?, ?, ?, ?, 20)',
    [user.username, user.email, passwordHash, user.avatar],
  );
}

const questions = [
  {
    title: 'React 19 的 useEffect 在开发环境为什么会执行两次？',
    author: '周小满',
    days: 1,
    views: 1286,
    votes: 4,
    tags: ['React', '前端', '调试'],
    solved: true,
    content: [
      '升级到 React 19 之后，我发现一个拉取列表的 `useEffect` 在开发环境里会请求两次接口，生产环境却只请求一次。',
      '',
      '代码大概是这样：',
      '',
      '```jsx',
      'useEffect(() => {',
      '  fetchPosts();',
      '}, []);',
      '```',
      '',
      '我确认依赖数组是空的，也没有父组件重复挂载。请问这是 bug，还是我哪里写错了？',
    ].join('\n'),
    answers: [
      {
        author: '林见山',
        accepted: true,
        content: [
          '这是 React StrictMode 的刻意行为，不是 bug。',
          '',
          '在开发环境里，StrictMode 会模拟一次「挂载 → 卸载 → 再挂载」，用来帮你发现副作用没有正确清理的问题。生产构建不会这样做。',
          '',
          '正确的写法不是把请求去掉，而是给它一个可取消的出口：',
          '',
          '```jsx',
          'useEffect(() => {',
          '  const controller = new AbortController();',
          '  fetchPosts({ signal: controller.signal });',
          '  return () => controller.abort();',
          '}, []);',
          '```',
          '',
          '如果你的请求是幂等的，两次请求本身问题不大；但涉及下单、发消息这类操作，一定要做防重或放到事件回调里。',
        ].join('\n'),
      },
      {
        author: '陈屿',
        content:
          '补充一个排查点：先看 `main.tsx` 里有没有 `<StrictMode>`。如果去掉之后只请求一次，基本就能确认是这个原因。\n\n不过不建议为了「看起来只请求一次」而永久去掉 StrictMode，它帮你提前暴露的问题，往往在生产环境更贵。',
      },
    ],
  },
  {
    title: 'MySQL 的 JSON 字段适合存标签吗？',
    author: '林见山',
    days: 2,
    views: 864,
    votes: 3,
    tags: ['MySQL', '数据库', '设计'],
    solved: true,
    content: [
      '文章和问题的标签，我现在直接存在 `tags JSON` 字段里，查询时用 `JSON_SEARCH` 过滤。',
      '',
      '好处是简单，不用多一张关联表；但听说 JSON 字段索引和迁移都比较麻烦。标签到底应该用 JSON 还是拆成多对多？',
    ].join('\n'),
    answers: [
      {
        author: '陈屿',
        accepted: true,
        content: [
          '看标签的两个用途：**展示** 和 **筛选/统计**。',
          '',
          '- 如果只是跟着内容一起展示，数量少、不参与复杂查询，JSON 很合适。',
          '- 如果要做标签页、按标签聚合、标签重命名，建议拆 `tags` + `question_tags` 两张表。',
          '',
          '一个折中方案：主表保留 JSON 方便读取，同时异步维护一张标签统计表。代价是两份数据要保证一致。',
          '',
          '以这个问答社区为例，标签只用于筛选和侧栏计数，数据量不大，JSON 足够；等标签成为核心功能再迁移也不迟。',
        ].join('\n'),
      },
      {
        author: '苏晚',
        content:
          '提醒一点：MySQL 8 可以对 JSON 建函数索引，但 MariaDB 和 MySQL 的 JSON 实现差异不小。如果团队同时用两种数据库，尽量别把关键查询压在 JSON 函数上。',
      },
    ],
  },
  {
    title: '独立开发时，如何决定一个功能要不要做？',
    author: '苏晚',
    days: 3,
    views: 642,
    votes: 3,
    tags: ['产品', '独立开发'],
    solved: false,
    content: [
      '一个人做产品，最痛苦的不是不会写，而是想做的太多。',
      '',
      '我现在的判断标准很模糊：这个功能「看起来有用」，但不确定用户会不会真的用。大家都是怎么砍需求的？',
    ].join('\n'),
    answers: [
      {
        author: '周小满',
        content:
          '我的做法是给每个功能写一句「谁，在什么场景下，因为什么原因，会用它」。写不出来就先不做。\n\n再加一条：如果这个功能需要新增一张表、一个页面、一个后台入口，而它只服务一个想象中的用户，就放到下一版。',
      },
      {
        author: '林见山',
        content:
          '我会问三个问题：\n\n1. 不做会不会影响核心闭环？\n2. 有没有更便宜的替代方案（手动、文档、第三方）？\n3. 上线后我能不能在一周内判断它有没有用？\n\n三个都答不上来，基本就是「顺便功能」。',
      },
    ],
  },
  {
    title: 'Express 项目怎么组织目录才不容易乱？',
    author: '何川',
    days: 4,
    views: 932,
    votes: 4,
    tags: ['Node.js', 'Express', '架构'],
    solved: true,
    content: [
      '刚开始写 Express 时所有路由都塞在 `index.js`，现在文件已经 800 多行了。',
      '',
      '想重构，但不想一上来就搞很重的 DDD。有没有适合小项目的目录结构？',
    ].join('\n'),
    answers: [
      {
        author: '林见山',
        accepted: true,
        content: [
          '小项目用「按职责分层」就够了：',
          '',
          '```text',
          'src/',
          '  routes/       只负责 URL 和中间件',
          '  controllers/  参数校验、编排',
          '  models/       SQL / 数据访问',
          '  middleware/   认证、错误处理',
          '  config/       环境变量、数据库',
          '```',
          '',
          '一条经验：路由文件里不要出现 SQL，控制器里不要出现 `req.query` 的复杂解析。每层只做一件事，文件超过 300 行就该拆。',
        ].join('\n'),
      },
      {
        author: '陈屿',
        content:
          '再补一个实际建议：先按现有代码抽出 `routes`，跑通测试，再动 `controllers`。不要一次性大爆炸重构，否则出问题很难定位是哪一步引入的。',
      },
    ],
  },
  {
    title: '为什么我的 Vite 项目打包后比开发时慢很多？',
    author: '陈屿',
    days: 5,
    views: 534,
    votes: 2,
    tags: ['Vite', '性能', '前端'],
    solved: false,
    content: [
      '开发时热更新很快，但 `vite build` 之后的页面首屏要等三四秒，白屏很明显。',
      '',
      '项目里用了 React、react-markdown 和一个图标库。请问一般从哪里开始优化？',
    ].join('\n'),
    answers: [
      {
        author: '林见山',
        content:
          '先别猜，打开构建产物的 chunk 列表看谁最大。常见情况是图标库和 Markdown 解析器一起进了首屏包。\n\n可以按路由做 `lazy` + `Suspense`，把详情页、编辑器这类重组件拆出去；再把 React、Markdown 分别做 vendor chunk。首屏只需要列表时，不要把所有东西都同步加载。',
      },
    ],
  },
  {
    title: '30 岁转行做前端，还来得及吗？',
    author: '苏晚',
    days: 6,
    views: 1864,
    votes: 4,
    tags: ['职业', '前端'],
    solved: false,
    content: [
      '非科班，做了几年运营，最近在系统学前端。投了几份简历都没有回音，开始怀疑年龄是不是硬伤。',
      '',
      '想听听已经在这个行业里的人的真实看法，不需要鸡汤。',
    ].join('\n'),
    answers: [
      {
        author: '周小满',
        content:
          '说点不那么好听的：年龄不是硬伤，**没有可验证的作品和项目经历**才是。\n\n同样 30 岁，一个能讲清楚自己做过什么、怎么取舍、踩过什么坑的人，比一个只有课程作业的 24 岁候选人更有竞争力。把项目做深，比刷更多教程有用。',
      },
      {
        author: '何川',
        content:
          '另外，别只盯「前端」这一个入口。运营背景 + 前端能力，在增长、数据产品、内容工具这些方向上反而是优势。先找到能叠加你过去经验的岗位，而不是把自己变成一张白纸。',
      },
    ],
  },
  {
    title: 'MySQL 事务里先查后改，怎么避免并发超卖？',
    author: '何川',
    days: 7,
    views: 1102,
    votes: 3,
    tags: ['MySQL', '并发', '后端'],
    solved: true,
    content: [
      '下单时我先 `SELECT stock` 判断够不够，再 `UPDATE stock = stock - 1`。',
      '',
      '压测时偶尔会出现库存变成负数。是不是只要把两条语句放进事务就行了？',
    ].join('\n'),
    answers: [
      {
        author: '陈屿',
        accepted: true,
        content: [
          '光放进事务不够。普通 `SELECT` 是快照读，两个事务可能都读到 1，然后都去扣。',
          '',
          '三种常见做法：',
          '',
          '1. `SELECT ... FOR UPDATE` 锁住这一行，再判断、再更新；',
          '2. 直接 `UPDATE stock = stock - 1 WHERE id = ? AND stock >= 1`，看受影响行数；',
          '3. 乐观锁：`UPDATE ... WHERE id = ? AND stock = ?`。',
          '',
          '小项目最稳的是第 2 种，一条语句完成判断和扣减，再配合事务处理订单写入。无论哪种，都要在数据库层兜底，不能只靠前端。',
        ].join('\n'),
      },
      {
        author: '林见山',
        content:
          '补一个排查方法：把隔离级别和 SQL 日志打出来，模拟两个并发请求，看它们实际执行顺序。很多「事务没生效」其实是查询走了从库，或者事务注解没生效。',
      },
    ],
  },
  {
    title: '如何让 Markdown 编辑器支持图片粘贴上传？',
    author: '周小满',
    days: 8,
    views: 488,
    votes: 2,
    tags: ['Markdown', '前端', '编辑器'],
    solved: false,
    content: [
      '现在的编辑器是一个 textarea，只能手动输入图片 URL。',
      '',
      '想支持直接粘贴截图、拖拽上传，然后把返回的地址插入光标位置。需要处理哪些细节？',
    ].join('\n'),
    answers: [
      {
        author: '苏晚',
        content:
          '核心是监听 `paste` 和 `drop`，从 `clipboardData.items` 里找 `image/*`，上传后拿到 URL，再根据 `selectionStart` 插入 `![alt](url)`。\n\n细节：上传中要有占位和失败回滚；粘贴截图时浏览器默认行为要 `preventDefault`；多张图要按顺序插入，别互相覆盖光标。',
      },
    ],
  },
  {
    title: '小团队做代码评审，最低限度应该看什么？',
    author: '林见山',
    days: 9,
    views: 376,
    votes: 1,
    tags: ['团队', '工程实践'],
    solved: false,
    content: [
      '团队只有四个人，没有专职测试，代码评审经常变成「看一眼就 approve」。',
      '',
      '不想搞很重的流程，但希望评审真的能拦住问题。最低限度应该关注哪些点？',
    ].join('\n'),
    answers: [],
  },
  {
    title: '有没有必要给个人项目写完整的 PRD？',
    author: '苏晚',
    days: 10,
    views: 521,
    votes: 2,
    tags: ['产品', '写作', '独立开发'],
    solved: false,
    content: [
      '每次做个人项目都直接开写，做到一半发现方向变了，又推倒重来。',
      '',
      '写完整 PRD 感觉太重，但不写又容易失控。一个人开发时，PRD 应该写到什么程度？',
    ].join('\n'),
    answers: [
      {
        author: '林见山',
        content:
          '个人项目不需要「完整 PRD」，但需要一页纸：\n\n- 一句话说清楚给谁解决什么问题\n- 这一版只做哪 3 个功能\n- 明确不做什么\n- 怎么算做完\n\n写完这一页，再开始建表。它最大的作用不是沟通，而是逼自己收敛。',
      },
      {
        author: '周小满',
        content:
          '我会再加一个「放弃条件」：如果两周内没有完成核心闭环，就砍功能而不是延期。个人项目最大的风险不是做得不完美，是一直做不完。',
      },
    ],
  },
  {
    title: 'JWT 过期后，前端应该怎么处理才不突兀？',
    author: '陈屿',
    days: 11,
    views: 703,
    votes: 3,
    tags: ['JWT', '前端', '认证'],
    solved: true,
    content: [
      '现在 token 过期后，接口返回 401，页面直接跳到登录页，用户刚写的内容就丢了。',
      '',
      '想做得平滑一点：至少不要打断正在编辑的内容。一般有哪些处理方式？',
    ].join('\n'),
    answers: [
      {
        author: '林见山',
        accepted: true,
        content: [
          '分两层处理：',
          '',
          '1. **请求层**：拦截 401，先尝试 refresh token；没有 refresh 机制就清理登录态，并记住当前路由。',
          '2. **交互层**：编辑页把草稿存 localStorage，登录后回到原页面并恢复草稿。',
          '',
          '不要在每个请求里各自弹「登录已过期」。用一个全局的会话状态，避免同时弹出五个提示。',
          '',
          '如果是学习项目，7 天 JWT + 登录后回跳已经够用；真实产品再上 refresh token 轮换和并发刷新去重。',
        ].join('\n'),
      },
    ],
  },
  {
    title: '如何设计一个让人愿意回答的问题？',
    author: '周小满',
    days: 12,
    views: 958,
    votes: 4,
    tags: ['社区', '写作'],
    solved: false,
    content: [
      '在社区里提问，经常没人回。复盘了一下，有些问题确实太宽泛，比如「怎么学好前端」。',
      '',
      '从回答者的角度，什么样的问题会让你愿意停下来写两句？',
    ].join('\n'),
    answers: [
      {
        author: '苏晚',
        content:
          '我会优先回答这三类：\n\n1. 已经自己排查过，能说清楚试了什么、卡在哪；\n2. 范围具体，能在一个回答里讲完；\n3. 提问者愿意补充上下文，而不是丢一句「报错了」。\n\n标题里带上具体技术名词和现象，比「求助」有效得多。',
      },
      {
        author: '陈屿',
        content:
          '还有一个细节：把「我已经知道的」和「我真正想问的」分开写。回答者最怕花半小时解释你已经明白的部分。',
      },
    ],
  },
];

const userIds = Object.fromEntries(
  (await connection.query('SELECT id, username FROM users'))[0].map((row) => [row.username, row.id]),
);

for (const post of questions) {
  const createdAt = new Date(Date.now() - post.days * 24 * 60 * 60 * 1000);
  const [result] = await connection.query(
    `INSERT INTO questions (title, content, tags, author_id, views, is_solved, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.title,
      post.content,
      JSON.stringify(post.tags),
      userIds[post.author],
      post.views,
      post.solved ? 1 : 0,
      createdAt,
      createdAt,
    ],
  );
  const questionId = result.insertId;

  for (const [index, answer] of post.answers.entries()) {
    const answerCreatedAt = new Date(createdAt.getTime() + (index + 1) * 45 * 60 * 1000);
    const [answerResult] = await connection.query(
      `INSERT INTO answers (content, question_id, author_id, is_accepted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        answer.content,
        questionId,
        userIds[answer.author],
        answer.accepted ? 1 : 0,
        answerCreatedAt,
        answerCreatedAt,
      ],
    );
    const answerId = answerResult.insertId;

    const answerVoters = users
      .filter((user) => user.username !== answer.author)
      .slice(0, Math.min(2, users.length - 1));
    for (const voter of answerVoters) {
      await connection.query(
        "INSERT INTO votes (user_id, target_type, target_id) VALUES (?, 'answer', ?)",
        [userIds[voter.username], answerId],
      );
    }
  }

  const questionVoters = users
    .filter((user) => user.username !== post.author)
    .slice(0, Math.min(post.votes, users.length - 1));
  for (const voter of questionVoters) {
    await connection.query(
      "INSERT INTO votes (user_id, target_type, target_id) VALUES (?, 'question', ?)",
      [userIds[voter.username], questionId],
    );
  }
}

await connection.query(`
  UPDATE questions q SET
    q.votes = (SELECT COUNT(*) FROM votes v WHERE v.target_type = 'question' AND v.target_id = q.id),
    q.answers_count = (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id)
`);

await connection.query(`
  UPDATE answers a SET
    a.votes = (SELECT COUNT(*) FROM votes v WHERE v.target_type = 'answer' AND v.target_id = a.id)
`);

await connection.query(`
  UPDATE users u SET u.points = GREATEST(0,
    20
    + 10 * (SELECT COUNT(*) FROM answers a WHERE a.author_id = u.id)
    + 30 * (SELECT COUNT(*) FROM answers a WHERE a.author_id = u.id AND a.is_accepted = 1)
    + 5 * (SELECT COALESCE(SUM(q.votes), 0) FROM questions q WHERE q.author_id = u.id)
    + 10 * (SELECT COALESCE(SUM(a.votes), 0) FROM answers a WHERE a.author_id = u.id)
    - 5 * (SELECT COUNT(*) FROM questions q WHERE q.author_id = u.id)
  )
`);

const [[counts]] = await connection.query(`
  SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM questions) AS questions,
    (SELECT COUNT(*) FROM answers) AS answers,
    (SELECT COUNT(*) FROM votes) AS votes
`);

await connection.end();
console.log('问渠数据库初始化完成');
console.log(`用户 ${counts.users} / 问题 ${counts.questions} / 回答 ${counts.answers} / 点赞 ${counts.votes}`);
console.log('演示账号：林见山 / demo1234');

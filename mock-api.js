/* Static GitHub Pages demo: in-browser API, no server, no real data. */
(() => {
  'use strict';

  const STORE_KEY = 'kedan_static_demo_v1';
  const originalFetch = window.fetch.bind(window);
  const now = () => new Date().toISOString();

  function seed() {
    return {
      events: [
        {
          id: 'evt_demo_1', hostType: 'parent', eventType: '婚礼', elderName: '',
          parentName: '陈航', parentSpouse: '李梅', childName: '陈屿', childSpouse: '王悦',
          relation: '儿子', eventDate: '2026-11-08', eventTime: '', location: '福满楼酒店 · 三楼宴会厅',
          attendance: 'pending', giftAmount: 800, note: '陈航亲自送来的客单，已经答应到场。', source: 'manual', photoPath: '',
        },
        {
          id: 'evt_demo_2', hostType: 'parent', eventType: '满月', elderName: '周建国',
          parentName: '周明远', parentSpouse: '何芳', childName: '周小满', childSpouse: '',
          relation: '女儿', eventDate: '2026-11-15', eventTime: '', location: '老街坊饭店 · 一楼大厅',
          attendance: 'pending', giftAmount: 500, note: '爷爷周建国抱孙女。', source: 'manual', photoPath: '',
        },
        {
          id: 'evt_demo_3', hostType: 'parent', eventType: '乔迁', elderName: '',
          parentName: '苏文远', parentSpouse: '陈静', childName: '苏晚', childSpouse: '',
          relation: '女儿', eventDate: '2026-11-22', eventTime: '', location: '江畔新村 12 栋 301',
          attendance: 'pending', giftAmount: 300, note: '新居落成。', source: 'manual', photoPath: '',
        },
        {
          id: 'evt_demo_4', hostType: 'parent', eventType: '婚礼', elderName: '',
          parentName: '赵德海', parentSpouse: '刘桂英', childName: '赵明轩', childSpouse: '孙悦',
          relation: '儿子', eventDate: '2026-12-06', eventTime: '', location: '金桂园宴会中心 · 百合厅',
          attendance: 'pending', giftAmount: 600, note: '提前一天确认人数。', source: 'manual', photoPath: '',
        },
        {
          id: 'evt_demo_5', hostType: 'parent', eventType: '婚礼', elderName: '',
          parentName: '林志强', parentSpouse: '吴秀兰', childName: '林晓', childSpouse: '周斌',
          relation: '女儿', eventDate: '2026-10-18', eventTime: '', location: '城南喜来登酒店 · 二楼宴会厅',
          attendance: 'attended', giftAmount: 800, note: '已经去过，坐在 18 桌。', source: 'manual', photoPath: '',
        },
      ],
      gifts: [
        { id: 'gift_demo_1', seq: 1, groupName: '第一组', name: '张建国', address: '桃花村', amount: 200, note: '' },
        { id: 'gift_demo_2', seq: 2, groupName: '第一组', name: '李伟', address: '桃花村', amount: 200, note: '' },
        { id: 'gift_demo_3', seq: 3, groupName: '第一组', name: '王秀英', address: '桃花村', amount: 100, note: '地址沿用上一条' },
        { id: 'gift_demo_4', seq: 4, groupName: '第二组', name: '刘五一', address: '河畔小区', amount: 300, note: '' },
        { id: 'gift_demo_5', seq: 5, groupName: '第二组', name: '陈敏', address: '老街', amount: 200, note: '' },
      ],
    };
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (data?.events?.length || data?.gifts?.length) return data;
    } catch { /* reset below */ }
    const data = seed();
    save(data);
    return data;
  }

  function save(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* private mode */ }
  }

  let data = load();

  function mapEvent(event) {
    const childLabel = event.childName ? `${event.childName}${event.eventType}` : event.eventType;
    const familyLabel = [event.parentName, event.parentSpouse].filter(Boolean).join('、');
    return {
      ...event,
      hostName: event.parentName || '',
      hostSpouse: event.parentSpouse || '',
      hostKey: event.parentName || '',
      familyLabel,
      title: childLabel,
    };
  }

  function eventStats() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: data.events.length,
      families: new Set(data.events.map((e) => e.parentName || e.childName)).size,
      upcoming: data.events.filter((e) => e.attendance === 'pending' && e.eventDate >= today).length,
      attended: data.events.filter((e) => e.attendance === 'attended').length,
      overdue: data.events.filter((e) => e.attendance === 'pending' && e.eventDate < today).length,
    };
  }

  function giftStats() {
    const groups = new Map();
    data.gifts.forEach((gift) => {
      const item = groups.get(gift.groupName) || { groupName: gift.groupName, count: 0, amount: 0 };
      item.count += 1;
      item.amount += Number(gift.amount || 0);
      groups.set(gift.groupName, item);
    });
    return {
      total: data.gifts.length,
      amount: data.gifts.reduce((sum, gift) => sum + Number(gift.amount || 0), 0),
      groups: groups.size,
      byGroup: [...groups.values()],
    };
  }

  function searchGroups(query) {
    const q = String(query || '').trim();
    const matched = data.events.filter((event) => [event.parentName, event.parentSpouse, event.childName, event.childSpouse, event.elderName, event.location, event.eventType]
      .some((value) => String(value || '').includes(q)));
    const groups = new Map();
    for (const event of matched) {
      const key = event.parentName || event.childName;
      if (!groups.has(key)) {
        const family = data.events.filter((item) => (item.parentName || item.childName) === key);
        groups.set(key, {
          key,
          hostType: 'parent',
          hostName: event.parentName,
          hostSpouse: event.parentSpouse,
          parentName: event.parentName,
          parentSpouse: event.parentSpouse,
          elderNames: [],
          children: [...new Set(family.map((item) => item.childName).filter(Boolean))],
          totalEvents: family.length,
          events: [],
          latestDate: family.map((item) => item.eventDate).sort().at(-1),
          relevance: 1,
          matchCount: 0,
          matchedMembers: [],
        });
      }
      const group = groups.get(key);
      group.events.push({ ...mapEvent(event), matchedBy: ['parent'] });
      group.matchCount += 1;
      group.matchedMembers = ['parent'];
    }
    return [...groups.values()];
  }

  function json(status, payload) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  function parseBody(init) {
    try { return init?.body ? JSON.parse(init.body) : {}; } catch { return {}; }
  }

  function giftPath(id) {
    return data.gifts.find((gift) => gift.id === id);
  }

  function csvText() {
    const cell = (value) => `"${String(value == null ? '' : value).replaceAll('"', '""')}"`;
    const rows = [['序号', '分组', '姓名', '地址', '金额(元)', '备注']]
      .concat(data.gifts.map((gift) => [gift.seq, gift.groupName, gift.name, gift.address, gift.amount, gift.note]));
    return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
  }

  async function handleApi(pathname, searchParams, init) {
    const method = String(init?.method || 'GET').toUpperCase();
    const body = parseBody(init);

    if (pathname === '/api/auth/me') {
      return json(200, { user: { id: 'demo-user', login: 'demo', displayName: '测试账号' }, stats: eventStats() });
    }
    if (pathname === '/api/auth/login') {
      return json(200, { user: { id: 'demo-user', login: 'demo', displayName: '测试账号' } });
    }
    if (pathname === '/api/auth/register') {
      return json(201, { user: { id: 'demo-user', login: 'demo', displayName: '测试账号' } });
    }
    if (pathname === '/api/auth/logout') return json(200, { ok: true });
    if (pathname === '/api/config') {
      return json(200, {
        eventTypes: ['婚礼', '订婚', '满月', '周岁', '寿宴', '乔迁', '升学', '白事', '其他'],
        attendance: ['pending', 'attended', 'absent'],
        relations: ['儿子', '女儿', '孙子', '孙女', '儿媳', '女婿', '本人', '母亲', '父亲', '其他'],
        ocrAvailable: false,
      });
    }
    if (pathname === '/api/events' && method === 'GET') {
      return json(200, { events: data.events.map(mapEvent) });
    }
    if (pathname === '/api/events' && method === 'POST') {
      const event = {
        ...body,
        id: `evt_${Date.now()}`,
        source: 'manual',
        photoPath: '',
      };
      data.events.push(event);
      save(data);
      return json(201, { event: mapEvent(event) });
    }
    if (pathname === '/api/stats') return json(200, { stats: eventStats() });
    if (pathname === '/api/search') return json(200, { query: searchParams.get('q') || '', groups: searchGroups(searchParams.get('q')) });

    const eventMatch = pathname.match(/^\/api\/events\/([A-Za-z0-9_-]+)$/);
    if (eventMatch) {
      const event = data.events.find((item) => item.id === eventMatch[1]);
      if (!event) return json(404, { error: '没有找到这张客单' });
      if (method === 'GET') return json(200, { event: mapEvent(event) });
      if (method === 'PUT') {
        Object.assign(event, body);
        save(data);
        return json(200, { event: mapEvent(event) });
      }
      if (method === 'DELETE') {
        data.events = data.events.filter((item) => item.id !== event.id);
        save(data);
        return json(200, { ok: true });
      }
    }

    if (pathname === '/api/giftbook' && method === 'GET') {
      const q = String(searchParams.get('q') || '').trim();
      const group = String(searchParams.get('group') || '').trim();
      let records = data.gifts;
      if (q) records = records.filter((gift) => [gift.name, gift.address, gift.note].some((value) => String(value || '').includes(q)));
      if (group) records = records.filter((gift) => gift.groupName === group);
      return json(200, { records, stats: giftStats(), query: q, group });
    }
    if (pathname === '/api/giftbook' && method === 'POST') {
      const last = data.gifts.at(-1);
      const gift = {
        id: `gift_${Date.now()}`,
        seq: (last?.seq || 0) + 1,
        groupName: String(body.groupName || ''),
        name: String(body.name || ''),
        address: body.address && !/^[.．。·•]$/.test(body.address) ? String(body.address) : (last?.address || ''),
        amount: body.amount === '' || body.amount == null ? null : Number(body.amount),
        note: String(body.note || ''),
      };
      data.gifts.push(gift);
      save(data);
      return json(201, { record: gift, stats: giftStats() });
    }
    const giftMatch = pathname.match(/^\/api\/giftbook\/(?!import$|bulk$|export\.csv$)([A-Za-z0-9_-]+)$/);
    if (giftMatch) {
      const gift = giftPath(giftMatch[1]);
      if (!gift) return json(404, { error: '没有找到这条礼簿记录' });
      if (method === 'PATCH' || method === 'PUT') {
        const previous = data.gifts.filter((item) => item.seq < gift.seq).at(-1);
        gift.groupName = String(body.groupName || '');
        gift.name = String(body.name || '');
        gift.address = body.address && !/^[.．。·•]$/.test(body.address) ? String(body.address) : (previous?.address || gift.address || '');
        gift.amount = body.amount === '' || body.amount == null ? null : Number(body.amount);
        gift.note = String(body.note || '');
        save(data);
        return json(200, { record: gift, stats: giftStats() });
      }
      if (method === 'DELETE') {
        data.gifts = data.gifts.filter((item) => item.id !== gift.id).map((item, index) => ({ ...item, seq: index + 1 }));
        save(data);
        return json(200, { ok: true, stats: giftStats() });
      }
    }

    if (pathname === '/api/giftbook/import' && method === 'POST') {
      if (String(body.file || '').startsWith('data:image/')) {
        return json(422, { error: '静态演示不支持图片 OCR，请上传 Excel/CSV，或在本地完整版里识别图片。' });
      }
      try {
        const parsed = await window.GiftbookParse.parseFile(body.file, body.filename);
        const last = data.gifts.at(-1);
        let address = last?.address || '';
        data.gifts = parsed.rows.map((row, index) => {
          if (row.address && !/^[.．。·•]$/.test(row.address)) address = row.address;
          return { ...row, id: `gift_${Date.now()}_${index}`, address };
        });
        save(data);
        return json(200, { imported: parsed.total, skipped: parsed.skipped, stats: giftStats(), sample: data.gifts.slice(0, 5) });
      } catch (error) {
        return json(400, { error: error.message || '文件读不出来' });
      }
    }

    if (pathname === '/api/giftbook/bulk' && method === 'POST') {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const last = data.gifts.at(-1);
      let address = last?.address || '';
      data.gifts = rows.map((row, index) => {
        if (row.address && !/^[.．。·•]$/.test(row.address)) address = row.address;
        return { ...row, id: `gift_${Date.now()}_${index}`, seq: index + 1, address };
      });
      save(data);
      return json(200, { imported: rows.length, stats: giftStats() });
    }

    if (pathname === '/api/ocr') {
      return json(503, { error: '静态演示不支持拍照 OCR；完整本地版可以识别，Excel/CSV 导入仍可正常演示。' });
    }

    return json(404, { error: '静态演示没有这个接口' });
  }

  window.fetch = (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input.url;
    const url = new URL(raw, location.href);
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, init);
    return handleApi(url.pathname, url.searchParams, init);
  };

  function downloadCsv() {
    const blob = new Blob([csvText()], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '礼簿-演示.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  document.addEventListener('click', (event) => {
    const exportLink = event.target.closest('a[href="/api/giftbook/export.csv"]');
    if (exportLink) {
      event.preventDefault();
      downloadCsv();
      return;
    }
    if (event.target.closest('[data-demo-reset]')) {
      localStorage.removeItem(STORE_KEY);
      data = seed();
      save(data);
      location.reload();
    }
  });
})();

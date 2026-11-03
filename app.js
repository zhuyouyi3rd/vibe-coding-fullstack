/* 客单簿 · front-end */
(() => {
  'use strict';

  const DEFAULT_CONFIG = {
    eventTypes: ['婚礼', '订婚', '满月', '周岁', '寿宴', '乔迁', '升学', '白事', '其他'],
    attendance: ['pending', 'attended', 'absent'],
    relations: ['儿子', '女儿', '孙子', '孙女', '儿媳', '女婿', '本人', '母亲', '父亲', '其他'],
    ocrAvailable: true,
  };

  const ATTENDANCE_LABELS = { pending: '待赴宴', attended: '已赴宴', absent: '未赴宴' };
  const MATCH_LABELS = {
    parent: '父辈',
    parentSpouse: '父辈配偶',
    elder: '爷爷/奶奶',
    child: '子辈',
    childSpouse: '子辈配偶',
    location: '地点',
    eventType: '事情',
    note: '备注',
  };
  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const state = {
    user: null,
    stats: null,
    events: [],
    config: { ...DEFAULT_CONFIG },
    currentView: '',
    lastMainHash: '#/schedule',
    scheduleMode: 'upcoming',
    searchQuery: '',
    searchGroups: [],
    searchStatus: 'idle',
    searchLoaded: false,
    searchRequestId: 0,
    recentSearches: [],
    collapsedFamilies: new Set(),
    record: null,
    selectedEventId: null,
    suppressDetailClose: false,
    giftbook: {
      records: [],
      stats: null,
      query: '',
      group: '',
      limit: 120,
      loaded: false,
      loading: false,
      preview: null,
      editing: null,
    },
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const authScreen = $('#authScreen');
  const appShell = $('#appShell');
  const mainContent = $('#mainContent');
  const eventDialog = $('#eventDialog');
  const giftDialog = $('#giftDialog');
  const confirmDialog = $('#confirmDialog');
  const toastRoot = $('#toastRoot');
  const busyOverlay = $('#busyOverlay');
  const busyText = $('#busyText');
  const cameraInput = $('#cameraInput');
  const galleryInput = $('#galleryInput');
  const giftFileInput = $('#giftFileInput');
  let recordRequestId = 0;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function icon(name, className = 'icon') {
    return `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  function todayIso() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function parseIsoDate(value) {
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDateLong(value) {
    const date = parseIsoDate(value);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS[date.getDay()]}`;
  }

  function formatMonthDay(value) {
    const date = parseIsoDate(value);
    return { month: date.getMonth() + 1, day: date.getDate(), week: WEEKDAYS[date.getDay()] };
  }

  function daysFromToday(value) {
    const today = parseIsoDate(todayIso());
    const target = parseIsoDate(value);
    return Math.round((target - today) / 86400000);
  }

  function countdownLabel(value) {
    const days = daysFromToday(value);
    if (days === 0) return '就是今天';
    if (days === 1) return '明天';
    if (days === 2) return '后天';
    if (days > 2) return `还有 ${days} 天`;
    if (days === -1) return '昨天';
    return `已过 ${Math.abs(days)} 天`;
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }

  function statusFor(event) {
    if (event.attendance === 'attended') return { label: '已赴宴', className: 'status-attended' };
    if (event.attendance === 'absent') return { label: '未赴宴', className: 'status-absent' };
    if (event.eventDate < todayIso()) return { label: '待补记', className: 'status-overdue' };
    return { label: '待赴宴', className: 'status-pending' };
  }

  function statusPill(event, compact = false) {
    const status = statusFor(event);
    return `<span class="status-pill ${status.className}">${compact ? '' : '<span class="dot-small"></span>'}${status.label}</span>`;
  }

  function money(value) {
    if (value == null || value === '') return '未记';
    return `¥${new Intl.NumberFormat('zh-CN').format(value)}`;
  }

  function isChildHost(event) {
    return event.hostType === 'child';
  }

  function familyName(event) {
    if (isChildHost(event)) {
      return `${event.childName}${event.childSpouse ? `、${event.childSpouse}` : ''}`;
    }
    return `${event.parentName}${event.parentSpouse ? `、${event.parentSpouse}` : ''}`;
  }

  function hostShortName(event) {
    return isChildHost(event) ? event.childName : event.parentName;
  }

  function childLabel(event) {
    if (isChildHost(event)) return event.eventType;
    if (!event.childName) return event.eventType;
    return `${event.childName}${event.eventType}`;
  }

  function compareAsc(a, b) {
    return a.eventDate.localeCompare(b.eventDate);
  }

  function compareDesc(a, b) {
    return compareAsc(b, a);
  }

  function api(path, options = {}) {
    const { method = 'GET', body, allow401 = false, headers = {} } = options;
    const config = { method, headers: { ...headers } };
    if (body !== undefined) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
    return fetch(path, config).then(async (response) => {
      let data = null;
      const text = await response.text();
      if (text) {
        try { data = JSON.parse(text); } catch { data = null; }
      }
      if (response.status === 401 && !allow401) {
        if (state.user) {
          showAuth();
          toast('登录时间到了，请重新登录。', 'error');
        }
        const error = new Error(data?.error || '请先登录');
        error.status = 401;
        throw error;
      }
      if (!response.ok) {
        const error = new Error(data?.error || '网络出了点问题，请再试一次。');
        error.status = response.status;
        error.fields = data?.fields || [];
        throw error;
      }
      return data;
    }).catch((error) => {
      if (error instanceof TypeError) {
        const networkError = new Error('连不上账本，请检查程序是否还在运行。');
        networkError.status = 0;
        throw networkError;
      }
      throw error;
    });
  }

  function toast(message, type = 'default') {
    const node = document.createElement('div');
    node.className = `toast${type === 'error' ? ' is-error' : type === 'success' ? ' is-success' : ''}`;
    node.innerHTML = `${icon(type === 'error' ? 'x' : 'check')}<span>${escapeHtml(message)}</span>`;
    toastRoot.appendChild(node);
    setTimeout(() => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(6px)';
      setTimeout(() => node.remove(), 220);
    }, 3000);
  }

  function setBusy(show, text = '正在保存…') {
    busyText.textContent = text;
    busyOverlay.hidden = !show;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function withButton(button, task, busyLabel = '请稍等…') {
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${escapeHtml(busyLabel)}`;
    try {
      return await task();
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }

  function setAuthError(message) {
    const box = $('#authError');
    if (!message) {
      box.hidden = true;
      box.textContent = '';
      return;
    }
    box.hidden = false;
    box.textContent = message;
  }

  function switchAuthTab(mode) {
    const login = mode === 'login';
    $('#tabLogin').classList.toggle('is-active', login);
    $('#tabRegister').classList.toggle('is-active', !login);
    $('#tabLogin').setAttribute('aria-selected', String(login));
    $('#tabRegister').setAttribute('aria-selected', String(!login));
    $('#loginForm').hidden = !login;
    $('#registerForm').hidden = login;
    setAuthError('');
  }

  function resetUserData() {
    recordRequestId += 1;
    state.events = [];
    state.stats = null;
    state.record = null;
    state.selectedEventId = null;
    state.searchQuery = '';
    state.searchGroups = [];
    state.searchStatus = 'idle';
    state.searchLoaded = false;
    state.collapsedFamilies.clear();
    state.scheduleMode = 'upcoming';
    state.lastMainHash = '#/schedule';
    state.recentSearches = [];
    state.giftbook = {
      records: [], stats: null, query: '', group: '', limit: 120,
      loaded: false, loading: false, preview: null, editing: null,
    };
  }

  function showAuth() {
    resetUserData();
    state.user = null;
    appShell.hidden = true;
    authScreen.hidden = false;
    if (eventDialog.open) {
      state.suppressDetailClose = true;
      eventDialog.close();
    }
    if (giftDialog.open) giftDialog.close();
    document.body.classList.remove('modal-open');
    if (location.hash && location.hash !== '#/schedule') {
      history.replaceState(null, '', '#/schedule');
    }
    switchAuthTab('login');
  }

  async function loginWith(login, pin) {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { login, pin },
      allow401: true,
    });
    await startApp(data.user);
  }

  function initials(name) {
    return Array.from(String(name || '客'))[0] || '客';
  }

  async function startApp(user) {
    resetUserData();
    state.user = user;
    state.recentSearches = recentSearches();
    authScreen.hidden = true;
    appShell.hidden = false;
    $('#topbarName').textContent = user.displayName;
    $('#topbarAvatar').textContent = initials(user.displayName);
    try {
      await loadData();
      route();
    } catch (error) {
      if (error.status !== 401) {
        toast(error.message || '账本加载失败，请刷新页面。', 'error');
      }
    }
  }

  async function loadData() {
    const requests = [
      api('/api/events'),
      api('/api/stats'),
    ];
    if (!state.config.__loaded) requests.push(api('/api/config'));
    const [eventData, statsData, configData] = await Promise.all(requests);
    state.events = eventData.events || [];
    state.stats = statsData.stats || null;
    if (configData) {
      state.config = { ...DEFAULT_CONFIG, ...configData, __loaded: true };
    }
  }

  async function refreshData() {
    const [eventData, statsData] = await Promise.all([api('/api/events'), api('/api/stats')]);
    state.events = eventData.events || [];
    state.stats = statsData.stats || null;
  }

  function recentKey() {
    return `kedan_recent_${state.user?.id || 'anon'}`;
  }

  function recentSearches() {
    try {
      const value = JSON.parse(localStorage.getItem(recentKey()) || '[]');
      return Array.isArray(value) ? value.filter((item) => typeof item === 'string').slice(0, 5) : [];
    } catch {
      return [];
    }
  }

  function rememberSearch(query) {
    const text = String(query || '').trim();
    if (!text) return;
    const items = [text, ...recentSearches().filter((item) => item !== text)].slice(0, 5);
    try {
      localStorage.setItem(recentKey(), JSON.stringify(items));
    } catch {
      // 浏览器禁用本地存储时，只影响“常查”快捷入口。
    }
    state.recentSearches = items;
  }

  function goSearch(query) {
    state.searchQuery = query;
    state.searchStatus = 'idle';
    state.searchLoaded = false;
    if (location.hash === '#/search') {
      const input = $('#searchInput');
      if (input) input.value = query;
      loadSearch(query);
    } else {
      location.hash = '#/search';
    }
  }

  function setView(name) {
    state.currentView = name;
    for (const view of $$('.view')) {
      view.hidden = view.dataset.view !== name;
    }
    $$('[data-nav]').forEach((link) => {
      const nav = link.dataset.nav;
      const active = nav === name || (name === 'record' && nav === 'new');
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function showMain(hash) {
    const parts = hash.replace(/^#\//, '').split('/');
    const page = parts[0] || 'schedule';
    if (page === 'search') {
      setView('search');
      renderSearch();
      return;
    }
    if (page === 'giftbook') {
      setView('giftbook');
      renderGiftbook();
      return;
    }
    if (page === 'new' || page === 'edit') {
      setView('record');
      renderRecordRoute(page, parts[1], parts[2]);
      return;
    }
    if (page === 'me') {
      setView('profile');
      renderProfile();
      return;
    }
    setView('schedule');
    renderSchedule();
  }

  function route() {
    if (!state.user) return;
    const hash = location.hash || '#/schedule';
    const eventMatch = hash.match(/^#\/event\/([A-Za-z0-9_-]+)$/);
    if (eventMatch) {
      showMain(state.lastMainHash);
      openEventDetail(eventMatch[1]);
      return;
    }
    state.lastMainHash = hash;
    showMain(hash);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- Schedule ---------- */

  function renderSchedule() {
    const view = $('#viewSchedule');
    const today = todayIso();
    const all = [...state.events].sort(compareAsc);
    const upcoming = all.filter((event) => event.eventDate >= today);
    const past = all.filter((event) => event.eventDate < today).sort(compareDesc);
    const next = upcoming[0] || null;
    const list = state.scheduleMode === 'past' ? past : upcoming;

    view.innerHTML = `
      <div class="page-head">
        <div>
          <p class="page-kicker"><span class="dot"></span>${escapeHtml(formatDateLong(today))} · 客单日程</p>
          <h1>${escapeHtml(greeting())}，<span class="accent">${upcoming.length ? `接下来有 ${upcoming.length} 场客单` : '眼下没有要赴的宴'}</span></h1>
          <p>按日子排好了。谁家、哪天、在哪，点一行就能看全。</p>
        </div>
        <div class="head-actions">
          <a class="btn btn-primary btn-lg" href="#/new">${icon('camera')}拍照记客单</a>
          <a class="btn btn-ghost btn-lg" href="#/new/manual">${icon('pencil')}手动写一笔</a>
        </div>
      </div>

      ${renderNextCard(next)}

      <div class="home-grid">
        <section class="agenda" aria-labelledby="agendaTitle">
          <div class="section-head">
            <h2 id="agendaTitle">客单日程 <span class="count">${list.length}</span></h2>
            <div class="segmented" role="group" aria-label="查看往后或过去的客单">
              <button type="button" data-schedule-mode="upcoming" class="${state.scheduleMode === 'upcoming' ? 'is-active' : ''}">往后要去的</button>
              <button type="button" data-schedule-mode="past" class="${state.scheduleMode === 'past' ? 'is-active' : ''}">已经过去的</button>
            </div>
          </div>
          ${renderAgenda(list, state.scheduleMode)}
        </section>

        <aside class="side-stack">
          ${renderStatsCard()}
          ${renderFamilyShortcuts()}
          ${renderTipCard()}
        </aside>
      </div>
    `;
  }

  function renderNextCard(next) {
    if (!next) {
      return `
        <section class="next-card is-empty" aria-label="下一场客单">
          <div class="next-date">
            <span class="month">今日</span>
            <span class="day">闲</span>
            <span class="week">无宴</span>
          </div>
          <div class="next-main">
            <div class="next-eyebrow">下一场客单</div>
            <h2 class="next-title">眼下没有要赴的宴</h2>
            <p class="next-location">${icon('calendar')}收到新客单，就记在这里，日子一到自会提醒您。</p>
            <div class="next-meta"><span class="meta-tag">人情有来有往</span><span class="meta-tag">慢慢记，不怕忘</span></div>
          </div>
          <div class="next-actions">
            <a class="btn btn-primary" href="#/new">${icon('plus')}记一张</a>
          </div>
        </section>
      `;
    }
    const date = formatMonthDay(next.eventDate);
    const status = statusFor(next);
    const heading = isChildHost(next)
      ? `${escapeHtml(familyName(next))} <small>·</small> ${escapeHtml(next.eventType)}`
      : `${escapeHtml(next.parentName)}家 <small>·</small> ${escapeHtml(childLabel(next))}`;
    const relationTag = isChildHost(next)
      ? '小辈主婚'
      : next.relation ? `${next.childName || '子辈'}（${next.relation}）` : next.eventType;
    return `
      <section class="next-card" aria-label="下一场客单">
        <div class="next-date">
          <span class="month">${date.month} 月</span>
          <span class="day">${String(date.day).padStart(2, '0')}</span>
          <span class="week">${date.week}</span>
        </div>
        <div class="next-main">
          <div class="next-eyebrow">下一场 <span class="countdown-pill">${icon('clock')}${countdownLabel(next.eventDate)}</span></div>
          <h2 class="next-title">${heading}</h2>
          <p class="next-location">${icon('pin')}<span>${escapeHtml(next.location)}</span></p>
          <div class="next-meta">
            <span class="meta-tag">${escapeHtml(relationTag)}</span>
            <span class="meta-tag">${status.label}</span>
          </div>
        </div>
        <div class="next-actions">
          <button class="btn btn-gold" type="button" data-event-id="${escapeHtml(next.id)}">看客单</button>
          <button class="btn btn-ghost" type="button" data-search-family="${escapeHtml(hostShortName(next))}">查这一家</button>
        </div>
      </section>
    `;
  }

  function renderAgenda(list, mode) {
    if (!list.length) {
      return `
        <div class="agenda-empty">
          <strong>${mode === 'past' ? '还没有过去的客单' : '暂时没有要赴的宴'}</strong>
          <p>${mode === 'past' ? '赴过宴、记过账的客单会放在这里。' : '收到客单，拍张照片或手动写一笔，就会排进日程。'}</p>
          <a class="btn btn-soft" href="#/new" style="margin-top:16px">${icon('plus')}记一张客单</a>
        </div>
      `;
    }
    const groups = new Map();
    for (const event of list) {
      const key = event.eventDate.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(event);
    }

    return [...groups.entries()].map(([month, events]) => {
      const date = parseIsoDate(`${month}-01`);
      return `
        <section class="month-group" aria-label="${date.getFullYear()}年${date.getMonth() + 1}月">
          <div class="month-heading">
            <span>${date.getFullYear()}年 ${date.getMonth() + 1}月</span>
            <span class="month-line"></span>
            <span>${events.length} 张</span>
          </div>
          <div class="agenda-list">
            ${events.map(renderAgendaRow).join('')}
          </div>
        </section>
      `;
    }).join('');
  }

  function renderAgendaRow(event) {
    const date = formatMonthDay(event.eventDate);
    const host = isChildHost(event) ? familyName(event) : `${event.parentName}家`;
    const relation = isChildHost(event) ? '小辈主婚' : event.relation;
    return `
      <button class="agenda-row" type="button" data-event-id="${escapeHtml(event.id)}" aria-label="查看 ${escapeHtml(familyName(event))} ${escapeHtml(childLabel(event))} 的客单">
        <span class="date-tile">
          <span class="d">${String(date.day).padStart(2, '0')}</span>
          <span class="m">${date.month}月</span>
          <span class="w">${date.week}</span>
        </span>
        <span class="agenda-main">
          <span class="agenda-title">
            <span class="family-name">${escapeHtml(host)}</span>
            <span>·</span>
            <span>${escapeHtml(childLabel(event))}</span>
            ${relation ? `<span class="relation">${escapeHtml(relation)}</span>` : ''}
          </span>
          <span class="agenda-sub">
            <span>${icon('pin')}${escapeHtml(event.location)}</span>
            ${event.giftAmount != null ? `<span>${icon('book')}礼金 ${money(event.giftAmount)}</span>` : ''}
          </span>
        </span>
        <span class="agenda-side">
          ${statusPill(event)}
          ${icon('arrow', 'icon chevron')}
        </span>
      </button>
    `;
  }

  function renderStatsCard() {
    const stats = state.stats || { total: 0, families: 0, upcoming: 0, attended: 0 };
    return `
      <section class="side-card">
        <h3>${icon('book')}我的客单账</h3>
        <div class="stat-grid">
          <div class="stat-box"><b>${stats.total || 0}</b><span>共收客单</span></div>
          <div class="stat-box"><b>${stats.families || 0}</b><span>户人家</span></div>
          <div class="stat-box"><b>${stats.upcoming || 0}</b><span>待赴宴</span></div>
          <div class="stat-box"><b>${stats.attended || 0}</b><span>已赴宴</span></div>
        </div>
      </section>
    `;
  }

  function renderFamilyShortcuts() {
    const latest = new Map();
    for (const event of [...state.events].sort(compareDesc)) {
      const key = hostShortName(event);
      if (!latest.has(key)) latest.set(key, { event, count: 0 });
      latest.get(key).count += 1;
    }
    const items = [...latest.values()].slice(0, 3);
    if (!items.length) return '';
    return `
      <section class="side-card">
        <h3>${icon('users')}最近走动的家</h3>
        <div class="family-shortcuts">
          ${items.map(({ event, count }) => `
            <button class="family-shortcut" type="button" data-search-family="${escapeHtml(hostShortName(event))}">
              <strong>${escapeHtml(isChildHost(event) ? hostShortName(event) : `${event.parentName}家`)}</strong>
              <span>${count} 张 · ${escapeHtml(event.eventDate.slice(5).replace('-', '.'))}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderTipCard() {
    return `
      <section class="side-card tip-card">
        <h3>${icon('search')}查人情的窍门</h3>
        <p>记不清是哪一年，就搜人的名字。主婚人（父母）、结婚的人（子辈）、爷爷辈都可以搜；结果先按主婚人（父母）归类。</p>
        <a class="btn btn-ghost" href="#/search">${icon('search')}去查客单</a>
      </section>
    `;
  }

  /* ---------- Search ---------- */

  function renderSearch() {
    const view = $('#viewSearch');
    const recents = recentSearches();
    view.innerHTML = `
      <section class="search-hero">
        <p class="section-label">查客单 · 人情往来</p>
        <h1>搜一个人的名字，找回一家人的往来</h1>
        <p>主婚人（父母）、结婚的人（子辈）、爷爷辈的名字都能搜，小名也可以。结果先按主婚人（父母）归类，再列出这一家的客单。</p>
        <form class="search-form" id="searchForm" role="search">
          <div class="search-input-wrap">
            ${icon('search')}
            <input class="input search-input" id="searchInput" name="q" type="search" value="${escapeHtml(state.searchQuery)}" placeholder="例如：陈航、陈屿、福满楼" autocomplete="off" aria-label="搜索姓名、地点或事情">
          </div>
          <button class="btn btn-primary" type="submit">查一查</button>
        </form>
        <p class="search-hint">${icon('users')}搜“陈屿”会先显示主人家“陈航”，再列出陈屿的婚礼；搜小名“小钟”，会先显示主婚人“钟朝平（小钟）”。</p>
        <div class="quick-searches">
          <span>常查：</span>
          ${recents.length
            ? recents.map((item) => `<button class="quick-chip" type="button" data-search-quick="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('')
            : '<button class="quick-chip" type="button" data-search-quick="陈航">陈航</button><button class="quick-chip" type="button" data-search-quick="陈屿">陈屿</button>'}
          <button class="quick-chip" type="button" data-search-all>看所有人家的客单</button>
        </div>
      </section>
      <div id="searchSummary" class="search-summary"></div>
      <div id="searchResults" class="family-results" aria-live="polite"></div>
    `;

    if (!state.searchLoaded && state.searchStatus !== 'loading') {
      loadSearch(state.searchQuery);
    } else {
      updateSearchResults();
    }
  }

  async function loadSearch(query) {
    const text = String(query ?? '').trim();
    state.searchQuery = text;
    state.searchStatus = 'loading';
    const requestId = ++state.searchRequestId;
    updateSearchResults();
    try {
      const data = await api(`/api/search?q=${encodeURIComponent(text)}`);
      if (requestId !== state.searchRequestId) return;
      state.searchGroups = data.groups || [];
      state.searchStatus = 'done';
      state.searchLoaded = true;
      if (text) {
        rememberSearch(text);
        state.recentSearches = recentSearches();
      }
      updateSearchResults();
    } catch (error) {
      if (requestId !== state.searchRequestId) return;
      state.searchStatus = 'error';
      updateSearchResults(error.message);
    }
  }

  function updateSearchResults(errorMessage = '') {
    const summary = $('#searchSummary');
    const results = $('#searchResults');
    if (!summary || !results) return;

    const query = state.searchQuery.trim();
    if (state.searchStatus === 'loading') {
      summary.innerHTML = `<h2>${query ? `正在找“${escapeHtml(query)}”` : '正在翻账本'}</h2><p>请稍等…</p>`;
      results.innerHTML = `<div class="search-empty"><span class="spinner" aria-hidden="true"></span><h3 style="margin-top:14px">正在找这家人</h3><p>马上就好。</p></div>`;
      return;
    }
    if (state.searchStatus === 'error') {
      summary.innerHTML = `<h2>没有查成</h2><p>${escapeHtml(errorMessage || '请再试一次')}</p>`;
      results.innerHTML = `<div class="search-empty"><div class="empty-icon">${icon('refresh')}</div><h3>连不上账本</h3><p>${escapeHtml(errorMessage || '请检查程序是否还在运行，然后再试。')}</p><button class="btn btn-primary" type="button" data-search-retry>再试一次</button></div>`;
      return;
    }

    const groups = state.searchGroups;
    summary.innerHTML = query
      ? `<h2>找到 <mark>${escapeHtml(query)}</mark>，共 ${groups.length} 户人家</h2><p>已按主婚人（父母/父辈）归类，点开可看这一家的客单。</p>`
      : `<h2>所有人家的客单</h2><p>共 ${groups.length} 户人家。想看谁，点主婚人（父母）的名字进去。</p>`;

    if (!groups.length) {
      results.innerHTML = `
        <div class="search-empty">
          <div class="empty-icon">${icon('search')}</div>
          <h3>没有找到“${escapeHtml(query)}”</h3>
          <p>可能名字写得不完全一样。试试只搜姓，或者搜地点。也可以直接记一张新客单。</p>
          <a class="btn btn-primary" href="#/new">${icon('plus')}记一张客单</a>
        </div>
      `;
      return;
    }

    results.innerHTML = groups.map((group) => renderFamilyGroup(group, query)).join('');
  }

  function highlight(value) {
    const safe = escapeHtml(value ?? '');
    const query = state.searchQuery.trim();
    if (!query) return safe;
    try {
      return safe.replace(new RegExp(escapeRegExp(escapeHtml(query)), 'gi'), (match) => `<mark>${match}</mark>`);
    } catch {
      return safe;
    }
  }

  function renderFamilyGroup(group, query) {
    const collapsed = state.collapsedFamilies.has(group.key);
    const childHost = group.hostType === 'child';
    const hostName = group.hostName || group.parentName;
    const hostSpouse = group.hostSpouse || group.parentSpouse;
    const memberNames = new Map();
    for (const event of group.events) {
      for (const by of event.matchedBy || []) {
        if (!MATCH_LABELS[by] || ['parent', 'parentSpouse', 'location', 'eventType', 'note'].includes(by)) continue;
        const name = by === 'child' ? event.childName : by === 'elder' ? event.elderName : event.childSpouse;
        const label = childHost && by === 'child'
          ? '主婚人'
          : childHost && by === 'childSpouse' ? '主婚人配偶' : MATCH_LABELS[by];
        if (name) memberNames.set(`${label} ${name}`, true);
      }
    }
    const matchedText = query && memberNames.size
      ? `<span class="matched">匹配到：${[...memberNames.keys()].map(escapeHtml).join('、')}</span>`
      : '';
    const children = group.children?.filter(Boolean) || [];
    return `
      <article class="family-card ${collapsed ? 'is-collapsed' : ''}" data-family-key="${escapeHtml(group.key)}">
        <header class="family-header">
          <span class="family-seal" aria-hidden="true">${escapeHtml(initials(hostName))}</span>
          <div class="family-title">
            <p class="family-kicker">${childHost ? '小辈主婚（主婚人）' : '主婚人（父母/父辈）'}</p>
            <h2>${highlight(hostName)} ${hostSpouse ? `<small>${highlight(hostSpouse)}</small>` : ''}</h2>
            <div class="family-meta-line">
              <span>共 ${group.totalEvents} 张客单</span>
              ${!childHost && children.length ? `<span>子辈：${children.map(escapeHtml).join('、')}</span>` : ''}
              ${group.elderNames?.length ? `<span>爷爷/奶奶：${group.elderNames.map(escapeHtml).join('、')}</span>` : ''}
              ${matchedText}
            </div>
          </div>
          <button class="family-toggle" type="button" data-family-toggle aria-expanded="${!collapsed}">
            <span>${collapsed ? '展开' : '收起'}</span>${icon('chevron')}
          </button>
        </header>
        <div class="family-events">
          ${group.events.map((event) => renderFamilyEvent(event, query)).join('')}
          ${query && group.events.length < group.totalEvents ? `<div class="family-more">这一家共 ${group.totalEvents} 张客单，当前显示和“${escapeHtml(query)}”有关的 ${group.events.length} 张。搜“${escapeHtml(hostName)}”可看全。</div>` : ''}
        </div>
      </article>
    `;
  }

  function renderFamilyEvent(event, query) {
    const date = formatMonthDay(event.eventDate);
    const status = statusFor(event);
    return `
      <button class="family-event" type="button" data-event-id="${escapeHtml(event.id)}">
        <span class="family-date">
          <b>${date.month}.${String(date.day).padStart(2, '0')}</b>
          <span>${escapeHtml(event.eventDate.slice(0, 4))}</span>
        </span>
        <span class="family-event-main">
          <span class="family-event-title">
            ${query ? highlight(childLabel(event)) : escapeHtml(childLabel(event))}
            <span class="status-pill ${status.className}">${status.label}</span>
          </span>
          <span class="family-event-sub">
            <span>${icon('pin')}${query ? highlight(event.location) : escapeHtml(event.location)}</span>
            ${event.giftAmount != null ? `<span>礼金 ${money(event.giftAmount)}</span>` : ''}
          </span>
        </span>
        ${icon('arrow', 'icon chevron')}
      </button>
    `;
  }

  /* ---------- Record ---------- */

  function renderRecordRoute(page, id) {
    if (page === 'edit') {
      if (!state.record || state.record.mode !== 'edit' || state.record.editId !== id) {
        const event = state.events.find((item) => item.id === id);
        if (!event) {
          api(`/api/events/${encodeURIComponent(id)}`).then((data) => {
            state.record = { step: 'form', mode: 'edit', editId: id, editing: data.event };
            if (state.currentView === 'record') renderRecordView();
          }).catch((error) => toast(error.message, 'error'));
          state.record = { step: 'loading', mode: 'edit', editId: id };
        } else {
          state.record = { step: 'form', mode: 'edit', editId: id, editing: event };
        }
      }
      renderRecordView();
      return;
    }

    if (page === 'new' && id === 'manual') {
      if (!state.record || state.record.mode !== 'manual') {
        state.record = { step: 'form', mode: 'manual', draft: {}, editing: null };
      }
    } else if (page === 'new' && state.record?.mode === 'edit') {
      state.record = null;
    }
    renderRecordView();
  }

  function renderRecordView() {
    const view = $('#viewRecord');
    const record = state.record;
    if (!record || record.step === 'chooser') {
      view.innerHTML = renderRecordChooser();
      return;
    }
    if (record.step === 'loading') {
      view.innerHTML = `<div class="search-empty"><span class="spinner"></span><h3 style="margin-top:14px">正在打开客单…</h3></div>`;
      return;
    }
    if (record.step === 'scan') {
      view.innerHTML = renderScanStage(record);
      return;
    }
    view.innerHTML = renderRecordForm(record);
  }

  function renderRecordChooser() {
    const ocr = state.config.ocrAvailable;
    return `
      <div class="page-head">
        <div>
          <p class="page-kicker"><span class="dot"></span>记一笔 · 收到客单</p>
          <h1>客单怎么记？</h1>
          <p>拍照最省事。机器认完，您再照着照片核对一遍，改对了才保存。</p>
        </div>
      </div>
      <div class="record-choices">
        <section class="choice-card camera-choice">
          <span class="choice-badge">${icon('scan')}推荐给长辈</span>
          <span class="choice-icon">${icon('camera')}</span>
          <h2>拍下客单，自动填好</h2>
          <p>把客单平放在光线好的地方，拍清楚字。姓名、地点、时间会自动填进表里，认错的字可以直接改。</p>
          <div class="choice-actions">
            <button class="btn btn-gold btn-lg" type="button" data-pick="camera" ${ocr ? '' : 'disabled'}>${icon('camera')}拍照</button>
            <button class="btn btn-ghost btn-lg" type="button" data-pick="gallery" ${ocr ? '' : 'disabled'}>${icon('image')}从相册选</button>
          </div>
          ${ocr ? '' : '<p style="margin-top:12px;color:#f3d99e">这台电脑暂不支持自动识字，请用右边的手动填写。</p>'}
        </section>
        <section class="choice-card manual-choice">
          <span class="choice-badge">${icon('pencil')}不着急，慢慢写</span>
          <span class="choice-icon">${icon('pencil')}</span>
          <h2>一项一项，手动填写</h2>
          <p>不用拍照，也不用打字很快。只要知道是谁家、哪天、在哪，就能记下来。</p>
          <div class="choice-actions">
            <button class="btn btn-primary btn-lg" type="button" data-start-manual>${icon('pencil')}手动填写</button>
          </div>
        </section>
      </div>
      <div class="record-tips">
        ${icon('scan')}
        <div><strong>拍照小窍门：</strong>客单放平、光线亮、镜头正对文字；不要只拍一半。照片只存进您自己的账本，不会传到别处。</div>
      </div>
    `;
  }

  function renderScanStage(record) {
    const error = record.error;
    const stepTwo = error ? '' : record.scanning ? 'is-active' : 'is-done';
    return `
      <div class="record-topline">
        <button class="back-link" type="button" data-scan-back>${icon('arrow')}重新选</button>
        <span class="meta-tag" style="color:var(--muted);background:transparent;border-color:var(--line)">照片识别</span>
      </div>
      <div class="scan-stage">
        <div class="scan-preview">
          ${record.photoData ? `<img src="${escapeHtml(record.photoData)}" alt="即将识别的客单照片">` : ''}
          ${record.scanning ? '<span class="scan-line" aria-hidden="true"></span>' : ''}
        </div>
        <div class="scan-copy">
          <p class="section-label">正在看照片</p>
          <h2>${error ? '这次没认出来' : '正在辨认客单上的字'}</h2>
          <p>${error ? '没关系，照片没丢。可以换一张更清楚的，或者直接手动填写。' : '手写字不一定都能认对。识别完会让您逐项核对，不会直接存进去。'}</p>
          <div class="scan-steps">
            <div class="scan-step is-done"><span class="step-dot">1</span>照片已经读进来</div>
            <div class="scan-step ${stepTwo}"><span class="step-dot">2</span>${error ? '文字识别没有成功' : '正在辨认姓名、地点、时间'}</div>
            <div class="scan-step ${error ? '' : 'is-active'}"><span class="step-dot">3</span>${error ? '这次先手动填写也可以' : '整理成一张客单，交给您核对'}</div>
          </div>
          ${error ? `<div class="scan-error">${escapeHtml(error)}</div>` : ''}
          <div class="choice-actions">
            ${error ? `<button class="btn btn-primary" type="button" data-pick="camera">${icon('camera')}换一张照片</button>` : ''}
            <button class="btn btn-ghost" type="button" data-manual-from-scan>${icon('pencil')}直接手动填写</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderRecordForm(record) {
    const editing = record.editing;
    const draft = record.draft || {};
    const ocr = record.ocr;
    const isOcr = Boolean(ocr);
    const fallbackDate = editing ? '' : isOcr ? '' : todayIso();
    const value = (key, fallback = '') => {
      if (editing && editing[key] != null) return editing[key];
      if (draft[key] != null) return draft[key];
      return fallback;
    };
    const hostType = value('hostType', 'parent');
    const eventDate = value('eventDate', fallbackDate);
    const eventType = value('eventType', '婚礼');
    const attendance = value('attendance', 'pending');
    const relation = value('relation', '');
    const photoPath = record.photoData || (editing ? editing.photoPath : ocr?.photoPath) || '';
    const types = state.config.eventTypes || DEFAULT_CONFIG.eventTypes;
    const relations = state.config.relations || DEFAULT_CONFIG.relations;
    const missing = new Set(ocr?.missing || []);
    const warnings = [...(ocr?.warnings || [])];
    if (ocr && ocr.confidence != null && ocr.confidence < 60) {
      warnings.unshift('这次识别把握不大，请重点核对下面几项。');
    }

    return `
      <div class="record-topline">
        <button class="back-link" type="button" data-cancel-record>${icon('arrow')}${editing ? '不修改了' : '不记了，返回'}</button>
        <div class="record-topline-actions">
          <span class="meta-tag" style="color:var(--muted);background:transparent;border-color:var(--line)">${editing ? '修改客单' : '新客单'}</span>
          <button class="btn btn-primary" type="submit" form="recordForm">${icon('check')}保存</button>
        </div>
      </div>
      <div class="page-head">
        <div>
          <p class="page-kicker"><span class="dot"></span>${editing ? '把认错的字改过来' : '核对后保存'}</p>
          <h1>${editing ? '修改这张客单' : isOcr ? '照着照片核对一遍' : '一项一项填清楚'}</h1>
          <p>${editing ? '改完点最下面的保存，原来的客单会更新。' : isOcr ? '机器已经把认出的字填好了。认错、漏掉的地方，直接改。' : '带红色星号的项一定要填，其他可以不填。'}</p>
        </div>
      </div>
      ${isOcr ? `
        <div class="ocr-banner">
          ${icon('scan')}
          <div>
            <strong>已识别 ${ocr.rawText?.length || 0} 个字，请核对后再保存</strong>
            <p>${warnings.length ? '有几处需要您看一眼：' : '姓名、地点、日期都已填入，确认无误就可以保存。'}</p>
            ${warnings.length ? `<ul class="warnings">${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
      ` : ''}
      <div class="record-layout">
        <form class="record-form-card" id="recordForm" novalidate>
          <input type="hidden" name="hostType" value="${escapeHtml(hostType)}">
          <div class="form-section">
            <div class="form-section-head">
              <span class="section-number">一</span>
              <div><h2>主婚人（父母）</h2><p>客单上写“主婚人 某某”时，这里填父母/主婚人的姓名。</p></div>
            </div>
            <div class="form-stack">
              <div class="name-fields">
                <label class="field">
                  <span class="field-label">主婚人姓名（父母）<span class="req">＊</span></span>
                  <input class="input" name="parentName" maxlength="30" value="${escapeHtml(value('parentName'))}" placeholder="例如：钟朝平（小钟）" ${missing.has('parentName') ? 'aria-describedby="parentMissing"' : ''} required>
                  ${missing.has('parentName') ? '<span class="field-help" id="parentMissing" style="color:var(--red)">照片里没认出来，请照着客单补上。</span>' : ''}
                </label>
                <label class="field">
                  <span class="field-label">主婚人配偶</span>
                  <input class="input" name="parentSpouse" maxlength="30" value="${escapeHtml(value('parentSpouse'))}" placeholder="例如：余秀仙（小四）">
                </label>
              </div>
              <label class="field">
                <span class="field-label">爷爷 / 奶奶的名字</span>
                <input class="input" name="elderName" maxlength="30" value="${escapeHtml(value('elderName'))}" placeholder="客单上写了才填，没写就空着">
                <span class="field-help">有的客单会把爷爷辈的名字也写上，写在这里，以后也能查到。</span>
              </label>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-head">
              <span class="section-number">二</span>
              <div><h2>结婚的人（子辈）</h2><p>主婚人下面写的“为儿子/女儿完婚”，填在这里；客单没写名字可以先空着。</p></div>
            </div>
            <div class="form-stack">
              <div class="name-fields">
                <label class="field">
                  <span class="field-label">结婚的人（子辈）</span>
                  <input class="input" name="childName" maxlength="30" value="${escapeHtml(value('childName'))}" placeholder="例如：陈屿">
                </label>
                <label class="field">
                  <span class="field-label">子辈配偶</span>
                  <input class="input" name="childSpouse" maxlength="30" value="${escapeHtml(value('childSpouse'))}" placeholder="例如：王悦">
                </label>
              </div>
              <div class="field">
                <span class="field-label">和主婚人是什么关系</span>
                <select class="select" name="relation">
                  <option value="">请选择（可不填）</option>
                  ${relations.map((item) => `<option value="${escapeHtml(item)}" ${relation === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <span class="field-label">办的是什么事</span>
                <div class="chip-group">
                  ${types.map((item) => `
                    <label class="chip-option">
                      <input type="radio" name="eventTypeRadio" value="${escapeHtml(item)}" ${eventType === item ? 'checked' : ''}>
                      <span>${escapeHtml(item)}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-head">
              <span class="section-number">三</span>
              <div><h2>哪天、在哪？</h2><p>按客单上的公历日子填，只记日期。</p></div>
            </div>
            <div class="form-stack">
              <label class="field">
                <span class="field-label">办事日期 <span class="req">＊</span></span>
                <input class="input" name="eventDate" type="date" min="1900-01-01" max="2200-12-31" value="${escapeHtml(eventDate)}" required>
                ${missing.has('eventDate') ? '<span class="field-help" style="color:var(--red)">照片里没认出日期，请选择公历日期。</span>' : ''}
              </label>
              <label class="field">
                <span class="field-label">办事地点 <span class="req">＊</span></span>
                <input class="input" name="location" maxlength="100" value="${escapeHtml(value('location'))}" placeholder="例如：福满楼酒店 三楼宴会厅" required>
                ${missing.has('location') ? '<span class="field-help" style="color:var(--red)">照片里没认出地点，请补上酒店或地址。</span>' : ''}
              </label>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-head">
              <span class="section-number">四</span>
              <div><h2>我去了没有？</h2><p>先记下打算，赴宴回来再改成“已赴宴”也行。</p></div>
            </div>
            <div class="form-stack">
              <div class="field">
                <div class="chip-group">
                  ${[
                    ['pending', '待赴宴'],
                    ['attended', '已赴宴'],
                    ['absent', '未赴宴'],
                  ].map(([key, label]) => `
                    <label class="chip-option">
                      <input type="radio" name="attendance" value="${key}" ${attendance === key ? 'checked' : ''}>
                      <span>${label}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <details class="optional-toggle" ${editing?.note || editing?.giftAmount != null ? 'open' : ''}>
              <summary>再记一点（礼金、备注，可不填）</summary>
              <div class="optional-details">
                <div class="field-row">
                  <label class="field">
                    <span class="field-label">随礼金额（元）</span>
                    <input class="input" name="giftAmount" type="number" inputmode="numeric" min="0" max="1000000" step="1" value="${editing?.giftAmount != null ? escapeHtml(editing.giftAmount) : ''}" placeholder="例如：800">
                  </label>
                  <div class="field">
                    <span class="field-label">为什么记这个</span>
                    <p class="field-help" style="margin-top:10px">往后还人情时，翻到这一家就能看见。</p>
                  </div>
                </div>
                <label class="field">
                  <span class="field-label">备注</span>
                  <textarea class="textarea" name="note" maxlength="500" rows="3" placeholder="例如：坐 18 桌、需要回电话、陈航亲自送来的客单">${escapeHtml(editing?.note || '')}</textarea>
                </label>
              </div>
            </details>
          </div>

          <div id="recordError" class="form-alert form-errors" hidden></div>
          <div class="save-bar">
            <span class="save-hint">${editing ? '改好后记得保存。' : '保存后，这张客单会排进首页日程。'}</span>
            <button class="btn btn-primary btn-xl" type="submit">${icon('check')}${editing ? '保存修改' : '确认保存客单'}</button>
          </div>
        </form>

        <aside class="record-photo-panel ${isOcr || editing ? '' : 'is-optional'}">
          <div class="photo-wrap">
            ${photoPath
              ? `<img src="${escapeHtml(photoPath)}" alt="这张客单的照片" data-detail-photo>`
              : `<div class="no-photo">${icon('camera')}<span>${isOcr ? '照片未保存' : '没有附照片'}</span></div>`}
          </div>
          <div class="photo-panel-body">
            <h3>${isOcr ? '客单原图' : editing ? '原来的客单照片' : '照片会一起收好'}</h3>
            <p>${isOcr ? '拿不准的地方，可以对照照片再看一眼。' : editing ? '这次只改文字，照片保留原来的。' : '不拍照也能记，照片不是必须的。'}</p>
            ${isOcr && ocr.rawText ? `
              <details class="optional-toggle" style="margin-top:12px">
                <summary>看识别到的原文</summary>
                <div class="ocr-text">${escapeHtml(ocr.rawText)}</div>
              </details>
            ` : ''}
            <div class="photo-panel-actions">
              ${!editing ? `<button class="btn btn-ghost" type="button" data-change-photo>${icon('camera')}换一张</button>` : ''}
              <button class="btn btn-ghost" type="button" data-cancel-record>返回</button>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  function readOriginalPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('这张照片读不出来，请换一张。'));
      reader.readAsDataURL(file);
    });
  }

  async function compressPhoto(file) {
    if (!file.type.startsWith('image/')) throw new Error('请选择一张照片。');
    if (file.size > 25 * 1024 * 1024) throw new Error('照片太大了，换一张小一点的。');
    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = Math.max(bitmap.width, bitmap.height);
      const scale = Math.min(1, 2200 / maxSide);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('这张照片读不出来，请换一张。'));
        reader.readAsDataURL(file);
      });
    }
  }

  async function handlePhoto(file) {
    if (!file) return;
    if (!state.config.ocrAvailable) {
      toast('这台电脑暂不支持自动识别，请手动填写。', 'error');
      return;
    }
    if (location.hash !== '#/new') location.hash = '#/new';
    const requestId = ++recordRequestId;
    state.record = {
      step: 'scan',
      mode: 'ocr',
      requestId,
      photoData: '',
      scanning: true,
      error: '',
      draft: null,
      ocr: null,
      editing: null,
    };
    if (state.currentView === 'record') renderRecordView();
    try {
      const dataUrl = await compressPhoto(file);
      const ocrDataUrl = await readOriginalPhoto(file);
      if (state.record?.requestId !== requestId) return;
      state.record.photoData = dataUrl;
      if (state.currentView === 'record') renderRecordView();
      const [result] = await Promise.all([
        api('/api/ocr', { method: 'POST', body: { image: ocrDataUrl } }),
        delay(900),
      ]);
      if (state.record?.requestId !== requestId) return;
      state.record = {
        step: 'form',
        mode: 'ocr',
        requestId,
        photoData: dataUrl,
        scanning: false,
        error: '',
        draft: result.fields || {},
        ocr: result,
        editing: null,
      };
      if (state.currentView === 'record') renderRecordView();
      toast('照片认完了，请核对一遍。', 'success');
    } catch (error) {
      if (state.record?.requestId !== requestId) return;
      state.record = {
        step: 'scan',
        mode: 'ocr',
        requestId,
        photoData: state.record?.photoData || '',
        scanning: false,
        error: error.message || '照片识别失败，请换一张或手动填写。',
        draft: null,
        ocr: null,
        editing: null,
      };
      if (state.currentView === 'record') renderRecordView();
    }
  }

  async function handleRecordSubmit(form) {
    const errorBox = $('#recordError');
    errorBox.hidden = true;
    const formData = new FormData(form);
    const record = state.record;
    const editing = record?.editing;

    const eventTypeFromRadio = formData.get('eventTypeRadio');
    const payload = {
      hostType: String(formData.get('hostType') || 'parent') === 'child' ? 'child' : 'parent',
      eventType: String(eventTypeFromRadio || formData.get('eventType') || '婚礼'),
      parentName: String(formData.get('parentName') || '').trim(),
      parentSpouse: String(formData.get('parentSpouse') || '').trim(),
      elderName: String(formData.get('elderName') || '').trim(),
      childName: String(formData.get('childName') || '').trim(),
      childSpouse: String(formData.get('childSpouse') || '').trim(),
      relation: String(formData.get('relation') || '').trim(),
      eventDate: String(formData.get('eventDate') || '').trim(),
      eventTime: '',
      location: String(formData.get('location') || '').trim(),
      attendance: String(formData.get('attendance') || 'pending'),
      giftAmount: formData.get('giftAmount') ? Number(formData.get('giftAmount')) : null,
      note: String(formData.get('note') || '').trim(),
      source: record?.ocr ? 'photo' : editing ? editing.source || 'manual' : 'manual',
      ocrText: record?.ocr?.rawText || editing?.ocrText || '',
      photoPath: record?.ocr?.photoPath || editing?.photoPath || '',
    };

    const fail = (message, focusName) => {
      errorBox.hidden = false;
      errorBox.textContent = message;
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (focusName) form.elements[focusName]?.focus();
    };

    payload.hostType = 'parent';
    if (!payload.parentName) return fail('请填写主婚人（父母）姓名。', 'parentName');
    if (!payload.eventDate) return fail('请选择办事日期。', 'eventDate');
    if (!payload.location) return fail('请填写办事地点。', 'location');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.eventDate)) return fail('日期格式不对，请重新选择。', 'eventDate');

    setBusy(true, editing ? '正在保存修改…' : '正在收好客单…');
    try {
      const data = editing
        ? await api(`/api/events/${encodeURIComponent(editing.id)}`, { method: 'PUT', body: payload })
        : await api('/api/events', { method: 'POST', body: payload });
      await refreshData();
      state.record = null;
      state.lastMainHash = '#/schedule';
      toast(editing ? '客单已经改好了。' : '客单收好了，已经排进日程。', 'success');
      location.hash = `#/event/${data.event.id}`;
    } catch (error) {
      fail(error.message || '保存失败，请再试一次。');
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Detail ---------- */

  async function openEventDetail(id) {
    if (state.selectedEventId === id && eventDialog.open) return;
    let event = state.events.find((item) => item.id === id);
    if (!event) {
      try {
        const data = await api(`/api/events/${encodeURIComponent(id)}`);
        event = data.event;
      } catch (error) {
        toast(error.message, 'error');
        history.replaceState(null, '', state.lastMainHash || '#/schedule');
        route();
        return;
      }
    }
    state.selectedEventId = id;
    eventDialog.innerHTML = renderEventDetail(event);
    if (!eventDialog.open) {
      eventDialog.showModal();
    } else {
      eventDialog.scrollTop = 0;
    }
    document.body.classList.add('modal-open');
    const photo = $('[data-detail-photo]', eventDialog);
    if (photo) {
      photo.addEventListener('error', () => {
        photo.remove();
        $('.detail-cover', eventDialog)?.classList.add('no-image');
      });
    }
  }

  function renderEventDetail(event) {
    const status = statusFor(event);
    const date = formatMonthDay(event.eventDate);
    const sameFamily = state.events
      .filter((item) => item.id !== event.id && hostShortName(item) === hostShortName(event))
      .sort(compareDesc);
    const cover = event.photoPath
      ? `<img src="${escapeHtml(event.photoPath)}" alt="${escapeHtml(familyName(event))} 的客单照片" data-detail-photo>`
      : '';
    return `
      <button class="icon-btn modal-close" type="button" data-close-event aria-label="关闭客单详情">${icon('x')}</button>
      <div class="detail-cover ${event.photoPath ? '' : 'no-image'}">
        ${cover}
        <div class="detail-cover-text">
          <div class="detail-badges">
            <span class="status-pill ${status.className}">${status.label}</span>
            <span class="meta-tag" style="color:#fff8e8;background:rgba(255,248,232,.1);border-color:rgba(255,248,232,.2)">${escapeHtml(event.eventType)}</span>
          </div>
          <h2 id="eventDialogTitle">${isChildHost(event)
            ? `${escapeHtml(familyName(event))} · ${escapeHtml(event.eventType)}`
            : `${escapeHtml(familyName(event))}家 · ${escapeHtml(childLabel(event))}`}</h2>
          <p>${escapeHtml(formatDateLong(event.eventDate))}</p>
        </div>
      </div>
      <div class="detail-body">
        ${isChildHost(event) ? `
          <div class="lineage is-child" aria-label="主婚人">
            <div class="person-card is-primary">
              <span>主婚人 · 小辈</span>
              <strong>${escapeHtml(event.childName)}${event.childSpouse ? ` <em>${escapeHtml(event.childSpouse)}</em>` : ''}</strong>
            </div>
            <div class="lineage-note">小辈主婚，拜请长辈。客单上的姓名已按小辈记录。</div>
          </div>
        ` : `
          <div class="lineage" aria-label="这一家的辈分关系">
            <div class="person-card">
              <span>爷爷 / 奶奶</span>
              <strong>${event.elderName ? escapeHtml(event.elderName) : '<em>客单未写</em>'}</strong>
            </div>
            <div class="lineage-arrow">${icon('arrow')}</div>
            <div class="person-card is-primary">
              <span>主婚人 · 父母</span>
              <strong>${escapeHtml(event.parentName)}${event.parentSpouse ? ` <em>${escapeHtml(event.parentSpouse)}</em>` : ''}</strong>
            </div>
            <div class="lineage-arrow">${icon('arrow')}</div>
            <div class="person-card">
              <span>子辈 · 办事人</span>
              <strong>${event.childName ? escapeHtml(event.childName) : '<em>未写子辈</em>'}${event.relation ? ` <em>${escapeHtml(event.relation)}</em>` : ''}${event.childSpouse ? ` <em>${escapeHtml(event.childSpouse)}</em>` : ''}</strong>
            </div>
          </div>
        `}

        <div class="detail-info-grid">
          <div class="info-item">
            <span class="info-icon">${icon('calendar')}</span>
            <div><span>办事日子</span><strong>${escapeHtml(formatDateLong(event.eventDate))}</strong></div>
          </div>
          <div class="info-item">
            <span class="info-icon">${icon('pin')}</span>
            <div><span>办事地点</span><strong>${escapeHtml(event.location)}</strong></div>
          </div>
          <div class="info-item">
            <span class="info-icon">${icon('users')}</span>
            <div><span>我去没去</span><strong>${ATTENDANCE_LABELS[event.attendance] || status.label}</strong></div>
          </div>
          <div class="info-item">
            <span class="info-icon">${icon('book')}</span>
            <div><span>随礼</span><strong>${money(event.giftAmount)}</strong></div>
          </div>
          ${event.note ? `<div class="info-item wide"><span class="info-icon">${icon('pencil')}</span><div><span>备注</span><strong>${escapeHtml(event.note)}</strong></div></div>` : ''}
        </div>

        ${event.source === 'photo' ? `<p class="field-help" style="margin-top:12px">${icon('scan')} 这张客单是拍照录入的，原图已一起保存。</p>` : ''}

        <div class="other-events">
          <h3>${icon('users')}这一家的其他客单</h3>
          ${sameFamily.length ? `
            <div class="other-list">
              ${sameFamily.slice(0, 4).map((item) => `
                <button class="other-item" type="button" data-event-id="${escapeHtml(item.id)}">
                  <span>${escapeHtml(formatDateLong(item.eventDate))} · ${escapeHtml(isChildHost(item) ? item.eventType : childLabel(item))}</span>
                  <span>${escapeHtml(item.location)}</span>
                </button>
              `).join('')}
            </div>
          ` : `<p class="field-help" style="margin-top:8px">这是这一家的第一张客单。以后再有往来，都会归到 ${escapeHtml(hostShortName(event))} 下面。</p>`}
        </div>

        <div class="modal-actions">
          <div class="left">
            <button class="btn btn-danger-ghost" type="button" data-delete-id="${escapeHtml(event.id)}">${icon('trash')}删除</button>
          </div>
          <div class="right">
            <button class="btn btn-ghost" type="button" data-close-event>关闭</button>
            <button class="btn btn-primary" type="button" data-edit-id="${escapeHtml(event.id)}">${icon('edit')}修改这张客单</button>
          </div>
        </div>
      </div>
    `;
  }

  function closeEventDialog() {
    if (eventDialog.open) eventDialog.close();
  }

  /* ---------- Profile ---------- */

  /* ---------- Gift book ---------- */

  function giftMoney(value) {
    if (value == null || value === '') return '—';
    return `¥${Number(value).toLocaleString('zh-CN')}`;
  }

  async function loadGiftbook() {
    const book = state.giftbook;
    if (book.loading) return;
    book.loading = true;
    if (state.currentView === 'giftbook') renderGiftbook();
    try {
      const params = new URLSearchParams();
      if (book.query) params.set('q', book.query);
      if (book.group) params.set('group', book.group);
      const data = await api(`/api/giftbook${params.toString() ? `?${params}` : ''}`);
      book.records = data.records || [];
      book.stats = data.stats || null;
      book.loaded = true;
    } catch (error) {
      toast(error.message || '礼簿加载失败', 'error');
    } finally {
      book.loading = false;
      if (state.currentView === 'giftbook') renderGiftbook();
    }
  }

  function renderGiftbook() {
    const view = $('#viewGiftbook');
    if (!view) return;
    const book = state.giftbook;
    if (!book.loaded && !book.loading) {
      loadGiftbook();
    }
    const stats = book.stats || { total: 0, amount: 0, groups: 0, byGroup: [] };
    const rows = book.records.slice(0, book.limit);
    const groupOptions = (stats.byGroup || []).map((group) => `
      <option value="${escapeHtml(group.groupName)}" ${book.group === group.groupName ? 'selected' : ''}>
        ${escapeHtml(group.groupName || '未分组')}（${group.count}）
      </option>
    `).join('');
    view.innerHTML = `
      <div class="page-head gift-head">
        <div>
          <p class="page-kicker"><span class="dot"></span>礼簿 · 人情往来</p>
          <h1>收过的礼，<em>一查就到。</em></h1>
          <p>共 <strong>${stats.total}</strong> 人，礼金合计 <strong>${giftMoney(stats.amount)}</strong>。姓名、地址、礼钱都放在一起。</p>
        </div>
        <div class="gift-head-actions">
          <button class="btn btn-primary" type="button" data-gift-import>${icon('upload')}导入文件 / 图片</button>
          <button class="btn btn-ghost" type="button" data-gift-add>${icon('plus')}手工补一条</button>
        </div>
      </div>

      <div class="gift-toolbar">
        <form class="gift-search" id="giftSearchForm" role="search">
          ${icon('search')}
          <input id="giftSearchInput" name="q" value="${escapeHtml(book.query)}" placeholder="输入姓名查礼簿，例如：赵建国" autocomplete="off">
          <button class="btn btn-primary" type="submit">查一查</button>
        </form>
        <label class="gift-group-filter">
          <span>分组</span>
          <select id="giftGroupFilter">
            <option value="">全部（${stats.total}）</option>
            ${groupOptions}
          </select>
        </label>
        <a class="btn btn-ghost gift-export" href="/api/giftbook/export.csv" download>${icon('download')}导出</a>
      </div>

      <div class="gift-result-line">
        <p>${book.query ? `找到“${escapeHtml(book.query)}” <strong>${book.records.length}</strong> 条` : `全部礼簿 <strong>${book.records.length}</strong> 条`}${book.group ? ` · ${escapeHtml(book.group)}` : ''}</p>
        ${book.loading ? '<span class="gift-loading"><span class="spinner"></span>正在整理…</span>' : ''}
      </div>

      ${book.records.length ? `
        <div class="gift-table" role="list">
          <div class="gift-table-head" aria-hidden="true">
            <span>序号</span><span>姓名</span><span>地址</span><span>礼钱</span><span>分组</span><span></span>
          </div>
          ${rows.map((record) => `
            <button class="gift-row" type="button" role="listitem" data-gift-id="${escapeHtml(record.id)}">
              <span class="gift-seq">${record.seq}</span>
              <strong class="gift-name">${book.query ? highlight(record.name) : escapeHtml(record.name)}</strong>
              <span class="gift-address">${escapeHtml(record.address || '—')}</span>
              <span class="gift-amount">${giftMoney(record.amount)}</span>
              <span class="gift-group">${escapeHtml(record.groupName || '—')}</span>
              <span class="gift-chevron">${icon('chevron')}</span>
            </button>
          `).join('')}
        </div>
        ${book.records.length > book.limit ? `
          <div class="gift-more"><button class="btn btn-ghost" type="button" data-gift-more>再看 ${Math.min(120, book.records.length - book.limit)} 条</button></div>
        ` : ''}
      ` : `
        <div class="gift-empty">
          <span class="gift-empty-icon">${icon('book-open')}</span>
          <h2>${book.query ? '没有找到这个名字' : '礼簿还是空的'}</h2>
          <p>${book.query ? '换个写法试试，或者点上面的“导入文件 / 图片”。' : '把礼簿的 Excel 或照片传上来，名字、地址、礼钱会自动整理好。'}</p>
          ${book.query ? '' : '<button class="btn btn-primary" type="button" data-gift-import>导入第一份礼簿</button>'}
        </div>
      `}
    `;
  }

  function openGiftDialog(html) {
    giftDialog.innerHTML = html;
    if (!giftDialog.open) giftDialog.showModal();
    document.body.classList.add('modal-open');
  }

  function closeGiftDialog() {
    if (giftDialog.open) giftDialog.close();
    document.body.classList.remove('modal-open');
  }

  function giftFormValue(form, name) {
    return String(new FormData(form).get(name) || '').trim();
  }

  function openGiftEditor(record = null) {
    state.giftbook.editing = record;
    const editing = Boolean(record);
    openGiftDialog(`
      <div class="gift-modal-head">
        <div>
          <p class="page-kicker"><span class="dot"></span>${editing ? '修改礼簿' : '手工补一条'}</p>
          <h2 id="giftDialogTitle">${editing ? '把这一条改清楚' : '谁送来的礼？'}</h2>
        </div>
        <button class="icon-btn modal-close" type="button" data-gift-close aria-label="关闭">${icon('x')}</button>
      </div>
      <form id="giftForm" class="gift-form" novalidate>
        <div class="name-fields">
          <label class="field">
            <span class="field-label">姓名 <span class="req">＊</span></span>
            <input class="input" name="name" maxlength="40" value="${escapeHtml(record?.name || '')}" placeholder="例如：赵建国" required>
          </label>
          <label class="field">
            <span class="field-label">礼钱（元）</span>
            <input class="input" name="amount" inputmode="decimal" value="${record?.amount == null ? '' : escapeHtml(record.amount)}" placeholder="例如：200">
          </label>
        </div>
        <label class="field">
          <span class="field-label">地址</span>
          <input class="input" name="address" maxlength="120" value="${escapeHtml(record?.address || '')}" placeholder="留空或填 . 就沿用上一条地址">
          <span class="field-help">礼簿里地址空白或一个点，表示和上一个人住址一样；程序会自动接着上一条。</span>
        </label>
        <div class="name-fields">
          <label class="field">
            <span class="field-label">分组</span>
            <input class="input" name="groupName" maxlength="30" value="${escapeHtml(record?.groupName || '')}" placeholder="例如：第一组">
          </label>
          <label class="field">
            <span class="field-label">备注</span>
            <input class="input" name="note" maxlength="120" value="${escapeHtml(record?.note || '')}" placeholder="可不填">
          </label>
        </div>
        <div class="gift-form-actions">
          ${editing ? `<button class="btn btn-danger" type="button" data-gift-delete="${escapeHtml(record.id)}">${icon('trash')}删除这条</button>` : ''}
          <span class="gift-form-spacer"></span>
          <button class="btn btn-ghost" type="button" data-gift-close>取消</button>
          <button class="btn btn-primary" type="submit">${editing ? '保存修改' : '收进礼簿'}</button>
        </div>
      </form>
    `);
    $('#giftForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const name = giftFormValue(form, 'name');
      if (!name) {
        toast('请填写姓名', 'error');
        form.elements.name.focus();
        return;
      }
      const amount = giftFormValue(form, 'amount');
      const body = {
        name,
        amount: amount === '' ? null : Number(amount),
        address: giftFormValue(form, 'address'),
        groupName: giftFormValue(form, 'groupName'),
        note: giftFormValue(form, 'note'),
      };
      if (body.amount != null && !Number.isFinite(body.amount)) {
        toast('礼钱请填数字', 'error');
        return;
      }
      try {
        setBusy(true, '正在保存…');
        if (editing) await api(`/api/giftbook/${record.id}`, { method: 'PATCH', body });
        else await api('/api/giftbook', { method: 'POST', body });
        closeGiftDialog();
        if (!editing) {
          state.giftbook.query = '';
          state.giftbook.group = '';
          state.giftbook.limit = 120;
        }
        state.giftbook.loaded = false;
        await loadGiftbook();
        toast(editing ? '已改好' : '已收进礼簿', 'success');
      } catch (error) {
        toast(error.message, 'error');
      } finally {
        setBusy(false);
      }
    });
  }

  function openGiftPreview(result) {
    state.giftbook.preview = result;
    const rows = result.rows || [];
    openGiftDialog(`
      <div class="gift-modal-head">
        <div>
          <p class="page-kicker"><span class="dot"></span>图片识别 · 先核对</p>
          <h2 id="giftDialogTitle">看看这些名字和礼钱</h2>
          <p class="gift-modal-lead">图片里的手写表格不可能百分之百认对。下面每一行都可以直接改，确认后再收进礼簿。</p>
        </div>
        <button class="icon-btn modal-close" type="button" data-gift-close aria-label="关闭">${icon('x')}</button>
      </div>
      ${result.warnings?.length ? `<ul class="warnings gift-warnings">${result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>` : ''}
      <div class="gift-preview-list" id="giftPreviewList">
        ${rows.length ? rows.map((row, index) => `
          <div class="gift-preview-row" data-preview-row="${index}">
            <span class="gift-preview-seq">${index + 1}</span>
            <label><span>姓名</span><input class="input" data-preview-key="name" value="${escapeHtml(row.name || '')}"></label>
            <label><span>地址</span><input class="input" data-preview-key="address" value="${escapeHtml(row.address || '')}"></label>
            <label><span>礼钱</span><input class="input" data-preview-key="amount" inputmode="decimal" value="${row.amount == null ? '' : escapeHtml(row.amount)}"></label>
            <button class="icon-btn gift-preview-remove" type="button" data-preview-remove="${index}" aria-label="删除这一行">${icon('x')}</button>
          </div>
        `).join('') : `
          <div class="gift-empty gift-empty-sm"><p>没有自动拆出表格行，可以用“手工补一条”慢慢录。</p></div>
        `}
      </div>
      ${result.rawText ? `<details class="optional-toggle"><summary>看图片识别原文</summary><div class="ocr-text">${escapeHtml(result.rawText)}</div></details>` : ''}
      <div class="gift-form-actions">
        <button class="btn btn-ghost" type="button" data-gift-close>先不导入</button>
        <span class="gift-form-spacer"></span>
        <button class="btn btn-primary" type="button" data-gift-preview-save ${rows.length ? '' : 'disabled'}>确认收进礼簿（${rows.length} 条）</button>
      </div>
    `);
  }

  async function saveGiftPreview() {
    const result = state.giftbook.preview;
    if (!result) return;
    const rows = result.rows || [];
    if (!rows.length) return;
    if (state.giftbook.stats?.total) {
      const ok = await askConfirm({
        title: '替换现有礼簿？',
        message: `这会用图片里的 ${rows.length} 条替换现有 ${state.giftbook.stats.total} 条礼簿记录。`,
        confirmText: '确认替换',
      });
      if (!ok) return;
    }
    try {
      setBusy(true, '正在收进礼簿…');
      await api('/api/giftbook/bulk', { method: 'POST', body: { rows, mode: 'replace' } });
      closeGiftDialog();
      state.giftbook.preview = null;
      state.giftbook.loaded = false;
      await loadGiftbook();
      toast(`已收进 ${rows.length} 条礼簿`, 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function importGiftFile(file) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast('文件太大了，请不要超过 25MB', 'error');
      return;
    }
    const isSpreadsheet = /\.(xlsx|csv)$/i.test(file.name);
    if (isSpreadsheet && state.giftbook.stats?.total) {
      const ok = await askConfirm({
        title: '替换现有礼簿？',
        message: `导入《${file.name}》会替换现有 ${state.giftbook.stats.total} 条礼簿记录。`,
        confirmText: '确认导入',
      });
      if (!ok) return;
    }
    try {
      setBusy(true, isSpreadsheet ? '正在整理礼簿…' : '正在识别图片，约需几秒…');
      const dataUrl = await readOriginalPhoto(file);
      const result = await api('/api/giftbook/import', {
        method: 'POST',
        body: { file: dataUrl, filename: file.name, mode: 'replace' },
      });
      if (result.preview) {
        closeGiftDialog();
        openGiftPreview(result);
      } else {
        state.giftbook.query = '';
        state.giftbook.group = '';
        state.giftbook.limit = 120;
        state.giftbook.loaded = false;
        await loadGiftbook();
        toast(`已导入 ${result.imported} 条礼簿${result.skipped ? `，跳过 ${result.skipped} 行` : ''}`, 'success');
      }
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
      if (giftFileInput) giftFileInput.value = '';
    }
  }

  function bindGiftbook() {
    const view = $('#viewGiftbook');
    if (view) {
      view.addEventListener('click', (event) => {
        if (event.target.closest('[data-gift-import]')) {
          giftFileInput?.click();
          return;
        }
        if (event.target.closest('[data-gift-add]')) {
          openGiftEditor();
          return;
        }
        if (event.target.closest('[data-gift-more]')) {
          state.giftbook.limit += 120;
          renderGiftbook();
          return;
        }
        const row = event.target.closest('[data-gift-id]');
        if (row) {
          const record = state.giftbook.records.find((item) => item.id === row.dataset.giftId);
          if (record) openGiftEditor(record);
        }
      });
      view.addEventListener('change', (event) => {
        if (event.target.matches('#giftGroupFilter')) {
          state.giftbook.group = event.target.value;
          state.giftbook.loaded = false;
          loadGiftbook();
        }
      });
      view.addEventListener('submit', (event) => {
        if (event.target.matches('#giftSearchForm')) {
          event.preventDefault();
          state.giftbook.query = String($('#giftSearchInput')?.value || '').trim();
          state.giftbook.limit = 120;
          state.giftbook.loaded = false;
          loadGiftbook();
        }
      });
    }
    if (giftFileInput) {
      giftFileInput.addEventListener('change', () => importGiftFile(giftFileInput.files?.[0]));
    }
    giftDialog.addEventListener('click', (event) => {
      if (event.target === giftDialog) closeGiftDialog();
      const close = event.target.closest('[data-gift-close]');
      if (close) closeGiftDialog();
      const remove = event.target.closest('[data-preview-remove]');
      if (remove) {
        const index = Number(remove.dataset.previewRemove);
        state.giftbook.preview?.rows.splice(index, 1);
        openGiftPreview(state.giftbook.preview);
        return;
      }
      if (event.target.closest('[data-gift-preview-save]')) saveGiftPreview();
      const del = event.target.closest('[data-gift-delete]');
      if (del) {
        askConfirm({
          title: '删除这一条礼簿？',
          message: '删除后会重新从 1 开始排好剩下的序号。',
          confirmText: '确认删除',
        }).then(async (ok) => {
          if (!ok) return;
          try {
            await api(`/api/giftbook/${del.dataset.giftDelete}`, { method: 'DELETE' });
            closeGiftDialog();
            state.giftbook.loaded = false;
            await loadGiftbook();
            toast('已删除', 'success');
          } catch (error) {
            toast(error.message, 'error');
          }
        });
      }
    });
    giftDialog.addEventListener('input', (event) => {
      const row = event.target.closest('[data-preview-row]');
      if (!row || !event.target.matches('[data-preview-key]')) return;
      const index = Number(row.dataset.previewRow);
      const key = event.target.dataset.previewKey;
      if (!state.giftbook.preview?.rows[index]) return;
      state.giftbook.preview.rows[index][key] = key === 'amount'
        ? (event.target.value === '' ? null : Number(event.target.value))
        : event.target.value;
    });
    giftDialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
    });
  }

  function renderProfile() {
    const view = $('#viewProfile');
    const stats = state.stats || { total: 0, families: 0, upcoming: 0, attended: 0 };
    view.innerHTML = `
      <div class="page-head">
        <div>
          <p class="page-kicker"><span class="dot"></span>我的账本 · 只属于自己</p>
          <h1>${escapeHtml(state.user?.displayName || '我的')}的客单簿</h1>
          <p>同一个登录名，不管关掉再开多少次，看到的都是这些客单。</p>
        </div>
      </div>
      <div class="profile-grid">
        <div class="profile-card">
          <div class="profile-head">
            <span class="profile-avatar">${escapeHtml(initials(state.user?.displayName))}</span>
            <div>
              <h2>${escapeHtml(state.user?.displayName || '')}</h2>
              <p>登录名：${escapeHtml(state.user?.login || '')}</p>
            </div>
          </div>
          <div class="profile-stats">
            <div class="profile-stat"><b>${stats.total || 0}</b><span>共收客单</span></div>
            <div class="profile-stat"><b>${stats.families || 0}</b><span>户人家</span></div>
            <div class="profile-stat"><b>${stats.upcoming || 0}</b><span>待赴宴</span></div>
            <div class="profile-stat"><b>${stats.attended || 0}</b><span>已赴宴</span></div>
          </div>
          <div class="profile-note">
            ${icon('shield')}
            <span>账本存在这台电脑的数据库里。只要用同一个登录名和 4 位密码，下次打开还是您的内容。建议把登录名写在纸上收好。</span>
          </div>
        </div>
        <aside class="side-stack" style="position:static">
          <section class="side-card">
            <h3>${icon('book')}账本工具</h3>
            <div class="profile-actions">
              <a class="btn btn-ghost" href="/api/export.csv" download>${icon('download')}导出全部客单（Excel 可开）</a>
              <a class="btn btn-ghost" href="#/new">${icon('plus')}再记一张客单</a>
              <button class="btn btn-danger-ghost" type="button" data-logout>${icon('logout')}退出登录</button>
            </div>
          </section>
          <section class="side-card about-card">
            <h3>${icon('users')}怎么查人情</h3>
            <p class="field-help">搜父亲、儿子、爷爷的名字，结果都会先归到主人家（父辈）名下。这样查“陈家”，就能看到他家办过的所有事。</p>
            <p class="field-help">人情有来有往。哪家来过、哪家没来，翻一翻账本就清楚，不用再凭记忆。</p>
            <a class="btn btn-soft" href="#/search">${icon('search')}去查一家人</a>
          </section>
        </aside>
      </div>
    `;
  }

  /* ---------- Confirm dialog ---------- */

  function askConfirm({ title, message, confirmText = '确定删除', danger = true }) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        if (confirmDialog.open) confirmDialog.close();
        resolve(value);
      };
      confirmDialog.innerHTML = `
        <h2 id="confirmTitle">${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <div class="confirm-actions">
          <button class="btn btn-ghost" type="button" data-confirm-cancel>先不</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-confirm-ok>${escapeHtml(confirmText)}</button>
        </div>
      `;
      confirmDialog.onclose = () => finish(false);
      $('[data-confirm-cancel]', confirmDialog).addEventListener('click', () => finish(false));
      $('[data-confirm-ok]', confirmDialog).addEventListener('click', () => finish(true));
      confirmDialog.showModal();
    });
  }

  /* ---------- Events ---------- */

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('button, a');
    if (!target) return;

    if (target.matches('.desktop-nav a[data-nav="new"], .bottom-nav a[data-nav="new"]')) {
      if (state.currentView !== 'record') state.record = null;
    }

    if (target.matches('[data-pick]')) {
      event.preventDefault();
      const picker = target.dataset.pick === 'gallery' ? galleryInput : cameraInput;
      picker.click();
      return;
    }

    if (target.matches('[data-start-manual]')) {
      state.record = { step: 'form', mode: 'manual', draft: {}, editing: null };
      if (location.hash !== '#/new') location.hash = '#/new/manual';
      else renderRecordView();
      return;
    }

    if (target.matches('[data-schedule-mode]')) {
      state.scheduleMode = target.dataset.scheduleMode;
      renderSchedule();
      return;
    }

    if (target.matches('[data-search-family]')) {
      goSearch(target.dataset.searchFamily);
      return;
    }

    if (target.matches('[data-search-quick]')) {
      const query = target.dataset.searchQuick;
      const input = $('#searchInput');
      if (input) input.value = query;
      loadSearch(query);
      return;
    }

    if (target.matches('[data-search-all]')) {
      const input = $('#searchInput');
      if (input) input.value = '';
      loadSearch('');
      return;
    }

    if (target.matches('[data-search-retry]')) {
      loadSearch(state.searchQuery);
      return;
    }

    if (target.matches('[data-family-toggle]')) {
      const card = target.closest('.family-card');
      if (card) {
        const key = card.dataset.familyKey;
        if (state.collapsedFamilies.has(key)) state.collapsedFamilies.delete(key);
        else state.collapsedFamilies.add(key);
        const collapsed = state.collapsedFamilies.has(key);
        card.classList.toggle('is-collapsed', collapsed);
        target.setAttribute('aria-expanded', String(!collapsed));
        const span = target.querySelector('span');
        if (span) span.textContent = collapsed ? '展开' : '收起';
      }
      return;
    }

    if (target.matches('[data-event-id]')) {
      event.preventDefault();
      const id = target.dataset.eventId;
      if (location.hash === `#/event/${id}` && eventDialog.open) return;
      location.hash = `#/event/${id}`;
      return;
    }

    if (target.matches('[data-close-event]')) {
      event.preventDefault();
      closeEventDialog();
      return;
    }

    if (target.matches('[data-edit-id]')) {
      event.preventDefault();
      const id = target.dataset.editId;
      state.suppressDetailClose = true;
      if (eventDialog.open) eventDialog.close();
      location.hash = `#/edit/${id}`;
      return;
    }

    if (target.matches('[data-delete-id]')) {
      event.preventDefault();
      const id = target.dataset.deleteId;
      const ok = await askConfirm({
        title: '真的删除这张客单吗？',
        message: '删除后就找不回来了。这一家的其他客单不会受影响。',
        confirmText: '确定删除',
      });
      if (!ok) return;
      try {
        await api(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
        await refreshData();
        state.suppressDetailClose = true;
        closeEventDialog();
        state.lastMainHash = '#/schedule';
        history.replaceState(null, '', '#/schedule');
        route();
        toast('客单已经删除。', 'success');
      } catch (error) {
        toast(error.message, 'error');
      }
      return;
    }

    if (target.matches('[data-scan-back]')) {
      state.record = null;
      if (location.hash === '#/new') renderRecordView();
      else location.hash = '#/new';
      return;
    }

    if (target.matches('[data-cancel-record]')) {
      if (state.record?.step === 'form' && !state.record.editing) {
        const form = $('#recordForm');
        if (form && form.querySelector('[name="parentName"]')?.value.trim()) {
          const ok = await askConfirm({
            title: '这张客单还没保存',
            message: '现在返回，刚填的内容会丢掉。要返回吗？',
            confirmText: '返回，放弃填写',
          });
          if (!ok) return;
        }
      }
      state.record = null;
      state.lastMainHash = '#/schedule';
      location.hash = '#/schedule';
      return;
    }

    if (target.matches('[data-manual-from-scan]')) {
      state.record = { step: 'form', mode: 'manual', draft: {}, editing: null };
      renderRecordView();
      return;
    }

    if (target.matches('[data-change-photo]')) {
      cameraInput.click();
      return;
    }

    if (target.matches('[data-logout]')) {
      const ok = await askConfirm({
        title: '要退出登录吗？',
        message: '客单不会丢。下次用登录名和 4 位密码还能回来。',
        confirmText: '退出登录',
      });
      if (!ok) return;
      try {
        await api('/api/auth/logout', { method: 'POST', allow401: true });
      } catch { /* local logout still works */ }
      showAuth();
      toast('已经退出登录。', 'success');
    }
  });

  document.addEventListener('submit', async (event) => {
    if (event.target.id === 'searchForm') {
      event.preventDefault();
      const query = $('#searchInput')?.value || '';
      if (location.hash !== '#/search') location.hash = '#/search';
      await loadSearch(query);
      if (window.matchMedia('(max-width: 900px)').matches) {
        const summary = $('#searchSummary');
        if (summary) {
          const top = summary.getBoundingClientRect().top + window.scrollY - 82;
          window.scrollTo({ top, behavior: 'instant' });
        }
      }
      return;
    }
    if (event.target.id === 'recordForm') {
      event.preventDefault();
      if (!event.target.reportValidity()) {
        const invalid = event.target.querySelector(':invalid');
        invalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      await handleRecordSubmit(event.target);
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.id !== 'searchInput') return;
    const value = event.target.value;
    clearTimeout(window.__kedanSearchTimer);
    window.__kedanSearchTimer = setTimeout(() => {
      if (location.hash === '#/search') loadSearch(value);
    }, 420);
  });

  for (const picker of [cameraInput, galleryInput]) {
    picker.addEventListener('change', () => {
      const file = picker.files?.[0];
      picker.value = '';
      if (file) handlePhoto(file);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && confirmDialog.open) {
      confirmDialog.close();
    }
  });

  eventDialog.addEventListener('click', (event) => {
    if (event.target === eventDialog) closeEventDialog();
  });

  eventDialog.addEventListener('close', () => {
    state.selectedEventId = null;
    document.body.classList.remove('modal-open');
    if (state.suppressDetailClose) {
      state.suppressDetailClose = false;
      return;
    }
    if (location.hash.startsWith('#/event/')) {
      const returnHash = state.lastMainHash && !state.lastMainHash.startsWith('#/event/')
        ? state.lastMainHash
        : '#/schedule';
      history.replaceState(null, '', returnHash);
      route();
    }
  });

  confirmDialog.addEventListener('click', (event) => {
    if (event.target === confirmDialog) confirmDialog.close();
  });

  /* ---------- Auth wiring ---------- */

  $('#tabLogin').addEventListener('click', () => switchAuthTab('login'));
  $('#tabRegister').addEventListener('click', () => switchAuthTab('register'));

  $('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    setAuthError('');
    const button = event.target.querySelector('button[type="submit"]');
    const login = $('#loginName').value.trim();
    const pin = $('#loginPin').value.trim();
    if (!login || !pin) {
      setAuthError('请把登录名和 4 位密码填上。');
      return;
    }
    try {
      await withButton(button, () => loginWith(login, pin), '正在打开…');
    } catch (error) {
      setAuthError(error.message || '登录失败，请再试一次。');
    }
  });

  $('#registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    setAuthError('');
    const button = event.target.querySelector('button[type="submit"]');
    const displayName = $('#regDisplayName').value.trim();
    const login = $('#regLogin').value.trim();
    const pin = $('#regPin').value.trim();
    const pin2 = $('#regPin2').value.trim();
    if (!displayName || !login || !pin) {
      setAuthError('三样都要填：称呼、登录名、4 位密码。');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setAuthError('密码要正好 4 个数字。');
      return;
    }
    if (pin !== pin2) {
      setAuthError('两次输入的密码不一样，请再输一次。');
      return;
    }
    try {
      await withButton(button, async () => {
        const data = await api('/api/auth/register', {
          method: 'POST',
          body: { displayName, login, pin },
          allow401: true,
        });
        await startApp(data.user);
      }, '正在建账本…');
    } catch (error) {
      setAuthError(error.message || '建账本失败，请再试一次。');
    }
  });

  $('#demoLogin').addEventListener('click', async () => {
    setAuthError('');
    switchAuthTab('login');
    $('#loginName').value = 'demo';
    $('#loginPin').value = '1234';
    const button = $('#demoLogin');
    try {
      await withButton(button, () => loginWith('demo', '1234'), '正在打开…');
    } catch (error) {
      setAuthError(error.message || '示例账本打不开，请稍后再试。');
    }
  });

  /* ---------- Boot ---------- */

  window.addEventListener('hashchange', route);
  bindGiftbook();

  async function boot() {
    state.recentSearches = recentSearches();
    try {
      const data = await api('/api/auth/me', { allow401: true });
      await startApp(data.user);
    } catch {
      showAuth();
    }
  }

  boot();
})();

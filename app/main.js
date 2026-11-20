// Boot module for the Field Manual: loads the data, builds the audit
// strip, routes between tabs from the URL hash, and owns the tracker
// state (checked trophies, counters, spoiler setting, filters).
// Deep links work: #/tracker?open=28&demo=1&spoiler=0 opens a trophy's
// guide with the demo run checked and spoilers shown.

import {
  applyFilters,
  auditOf,
  demoSet,
  loadChecked,
  loadCounts,
  loadSpoiler,
  ptsOf,
  saveChecked,
  saveCounts,
  saveSpoiler,
  totalPts,
} from './track.js';
import {
  renderChecklist,
  renderMissables,
  renderRoadmap,
  renderRoutes,
  renderSources,
  renderTracker,
  renderTrophyList,
} from './screens.js';

const TABS = [
  { id: 'tracker', label: 'Tracker' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'checklist', label: '100%' },
  { id: 'routes', label: 'Routes' },
  { id: 'sources', label: 'Sources' },
  { id: 'missables', label: 'Missables' },
];

const RENDERERS = {
  tracker: renderTracker,
  roadmap: renderRoadmap,
  checklist: renderChecklist,
  routes: renderRoutes,
  sources: renderSources,
  missables: renderMissables,
};

const ctx = {
  data: null,
  sourcesById: new Map(),
  disputesById: new Map(),
  audit: null,
  checked: loadChecked(),
  counts: loadCounts(),
  revealed: new Set(),
  expanded: new Set(),
  spoiler: loadSpoiler(),
  filters: { grade: 'all', kind: 'all', phase: 'all', missableOnly: false, hideChecked: false, q: '' },
  tab: 'tracker',
};

function parseHash() {
  const raw = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  const [path, query = ''] = raw.split('?');
  const tab = (path.replace(/^\//, '') || 'tracker').toLowerCase();
  return { tab: RENDERERS[tab] ? tab : 'tracker', params: new URLSearchParams(query) };
}

function auditCell(value, label, ok = false) {
  return `<div class="audit-cell"><b class="${ok ? 'ok' : ''}">${value}</b>${label}</div>`;
}

function renderAudit() {
  const a = ctx.audit;
  document.getElementById('audit').innerHTML = `<div class="audit-inner">
    ${auditCell(`${a.official}/${a.official}`, 'official', true)}
    ${auditCell(`${a.cited}/${a.cited}`, 'steps cited', true)}
    ${auditCell(a.backed, 'backed 2+')}
    ${auditCell(a.sources, 'sources')}
    ${auditCell(a.disputes, 'disputes')}
    ${auditCell(a.trackers, 'count trackers')}
    ${auditCell(a.hidden, 'hidden')}
    ${auditCell(`${a.demoTrophies}/55`, 'demo run')}
    ${auditCell(`${a.demoPts.toLocaleString()}/${a.totalPts.toLocaleString()}`, 'demo PTS')}
  </div>`;
}

function renderToolbar() {
  const tabs = TABS.map((t) => `<button type="button" class="tab" data-tab="${t.id}"
    aria-current="${ctx.tab === t.id ? 'page' : 'false'}">${t.label}</button>`).join('');
  document.getElementById('toolbar').innerHTML = `
    <div class="tabs" role="tablist">${tabs}</div>
    <div class="controls">
      <label class="spoiler-toggle"><input type="checkbox" id="spoilerToggle" ${ctx.spoiler ? 'checked' : ''}> Spoilers hidden</label>
      <button type="button" class="btn btn-primary" data-action="demo">Demo run (18)</button>
      <button type="button" class="btn btn-danger" data-action="reset">Reset</button>
    </div>`;
}

function renderProgress() {
  const trophies = ctx.data.trophies.trophies;
  const earned = trophies.filter((t) => ctx.checked.has(t.id));
  const pts = earned.reduce((sum, t) => sum + ptsOf(t), 0);
  const total = totalPts(trophies);
  const pct = Math.round((earned.length / trophies.length) * 100);
  document.getElementById('progressWrap').innerHTML = `
    <div class="progress-line">
      <span><strong>${earned.length} / ${trophies.length}</strong> trophies earned</span>
      <span><strong>${pts.toLocaleString()} / ${total.toLocaleString()}</strong> PTS</span>
      <span><strong>${pct}%</strong> of the manual</span>
    </div>
    <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill" style="width: ${pct}%"></div>
    </div>`;
}

function renderView() {
  const view = document.getElementById('view');
  view.innerHTML = RENDERERS[ctx.tab](ctx);
  view.dataset.ready = ctx.tab;
}

function refreshList() {
  const list = document.getElementById('trophyList');
  const count = document.getElementById('resultCount');
  if (!list || !count) return;
  const all = ctx.data.trophies.trophies;
  const shown = applyFilters(all, ctx.filters);
  list.innerHTML = renderTrophyList(shown, ctx);
  count.textContent = `Showing ${shown.length} of ${all.length} trophies`;
}

function setTab(tab) {
  ctx.tab = tab;
  renderToolbar();
  renderView();
  window.scrollTo({ top: 0 });
}

function applyDemo() {
  for (const t of demoSet(ctx.data.trophies.trophies)) ctx.checked.add(t.id);
  saveChecked(ctx.checked);
  renderProgress();
  if (ctx.tab === 'tracker') refreshList();
}

function resetAll() {
  ctx.checked.clear();
  ctx.counts = {};
  ctx.revealed.clear();
  ctx.expanded.clear();
  saveChecked(ctx.checked);
  saveCounts(ctx.counts);
  renderProgress();
  renderView();
}

function onViewClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  if (action === 'expand') {
    const card = btn.closest('.trophy');
    const body = card?.querySelector('.guide-body');
    if (!body) return;
    const opening = body.hasAttribute('hidden');
    body.toggleAttribute('hidden', !opening);
    btn.textContent = opening ? 'Hide guide ▲' : 'Guide ▼';
    if (opening) ctx.expanded.add(id);
    else ctx.expanded.delete(id);
  } else if (action === 'reveal') {
    ctx.revealed.add(id);
    refreshList();
  } else if (action === 'count-inc' || action === 'count-dec') {
    const trophy = ctx.data.trophies.trophies.find((t) => t.id === id);
    if (!trophy || trophy.count == null) return;
    const next = Math.max(0, Math.min(trophy.count, (ctx.counts[id] ?? 0) + (action === 'count-inc' ? 1 : -1)));
    ctx.counts[id] = next;
    saveCounts(ctx.counts);
    const label = document.querySelector(`[data-count-for="${id}"]`);
    if (label) label.textContent = `${next} / ${trophy.count} ${trophy.countUnit ?? ''}`;
  }
}

function onViewChange(event) {
  const el = event.target;
  if (el.matches('[data-action="toggle"]')) {
    const id = Number(el.dataset.id);
    if (el.checked) ctx.checked.add(id);
    else ctx.checked.delete(id);
    saveChecked(ctx.checked);
    el.closest('.trophy')?.classList.toggle('checked', el.checked);
    renderProgress();
    return;
  }
  if (el.id === 'filterGrade') ctx.filters.grade = el.value;
  else if (el.id === 'filterKind') ctx.filters.kind = el.value;
  else if (el.id === 'filterPhase') ctx.filters.phase = el.value;
  else if (el.id === 'filterMissable') ctx.filters.missableOnly = el.checked;
  else if (el.id === 'filterHideChecked') ctx.filters.hideChecked = el.checked;
  else return;
  refreshList();
}

function onViewInput(event) {
  if (event.target.id === 'filterQ') {
    ctx.filters.q = event.target.value;
    refreshList();
  }
}

function onToolbarClick(event) {
  const tabBtn = event.target.closest('[data-tab]');
  if (tabBtn) {
    location.hash = `#/${tabBtn.dataset.tab}`;
    return;
  }
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'demo') applyDemo();
  else if (btn.dataset.action === 'reset') resetAll();
}

function onToolbarChange(event) {
  if (event.target.id === 'spoilerToggle') {
    ctx.spoiler = event.target.checked;
    saveSpoiler(ctx.spoiler);
    renderView();
  }
}

async function boot() {
  const [trophies, routes, sources] = await Promise.all([
    fetch('./data/trophies.json').then((r) => r.json()),
    fetch('./data/routes.json').then((r) => r.json()),
    fetch('./data/sources.json').then((r) => r.json()),
  ]);
  ctx.data = { trophies, routes, sources };
  for (const s of sources.sources) ctx.sourcesById.set(s.n, s);
  for (const d of sources.disputes) ctx.disputesById.set(d.id, d);
  ctx.audit = auditOf(ctx.data);

  const { tab, params } = parseHash();
  ctx.tab = tab;
  if (params.get('spoiler') === '0') ctx.spoiler = false;
  if (params.get('spoiler') === '1') ctx.spoiler = true;
  if (params.get('grade')) ctx.filters.grade = params.get('grade');
  if (params.get('kind')) ctx.filters.kind = params.get('kind');
  if (params.get('phase')) ctx.filters.phase = params.get('phase');
  if (params.get('q')) ctx.filters.q = params.get('q');
  const openId = Number(params.get('open'));
  if (openId) ctx.expanded.add(openId);
  if (params.get('demo') === '1') {
    for (const t of demoSet(trophies.trophies)) ctx.checked.add(t.id);
    saveChecked(ctx.checked);
  }

  renderAudit();
  renderToolbar();
  renderView();
  renderProgress();

  document.getElementById('view').addEventListener('click', onViewClick);
  document.getElementById('view').addEventListener('change', onViewChange);
  document.getElementById('view').addEventListener('input', onViewInput);
  document.getElementById('toolbar').addEventListener('click', onToolbarClick);
  document.getElementById('toolbar').addEventListener('change', onToolbarChange);
  window.addEventListener('hashchange', () => {
    const next = parseHash();
    if (next.tab !== ctx.tab) setTab(next.tab);
  });

  if (openId) {
    const card = document.querySelector(`.trophy[data-id="${openId}"]`);
    card?.scrollIntoView({ block: 'start' });
  }
}

boot().catch((err) => {
  document.getElementById('view').innerHTML =
    `<p class="empty-note">The manual could not load its data (${String(err)}). It runs from its own files — serve the app/ folder and reload.</p>`;
});

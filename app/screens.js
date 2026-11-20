// View renderers for the Field Manual. Each renderer returns an HTML
// string for one tab; the boot module mounts it and wires the events.
// All copy comes from the loaded data files — no guide text is written
// here, so nothing here can drift from the audited data.

import { applyFilters, escapeHtml, KIND_LABELS, prettyCountKey, ptsOf } from './track.js';

function sourceLink(ctx, id) {
  const src = ctx.sourcesById.get(id);
  if (!src) return null;
  return `<a href="${escapeHtml(src.url)}" rel="noopener">${escapeHtml(src.site)}</a>`;
}

function missableTag(t) {
  if (t.missable === 'watch') return '<span class="tag missable-watch">Missable — watch</span>';
  if (t.missable === 'possible') return '<span class="tag missable-possible">Missable — possible</span>';
  return '';
}

// A trophy's dispute field holds a dispute id (D1–D9); resolve it to
// the question and the call from the sources file.
function disputeNote(t, ctx) {
  if (!t.dispute) return '';
  const d = ctx.disputesById.get(t.dispute);
  if (!d) return `<p class="dispute-note"><b>Disputed.</b> ${escapeHtml(t.dispute)}</p>`;
  return `<p class="dispute-note"><b>Disputed.</b> ${escapeHtml(d.q)} — <b>Call:</b> ${escapeHtml(d.call)}</p>`;
}

// One trophy card. When the spoiler setting hides a hidden trophy, the
// card shows the grade and a reveal button instead of the name and
// guide; everything else renders the same either way.
export function trophyCard(t, ctx, opts = {}) {
  const checked = ctx.checked.has(t.id);
  const expanded = opts.expanded ?? ctx.expanded.has(t.id);
  const masked = ctx.spoiler && t.hidden && !ctx.revealed.has(t.id);
  const grade = t.grade;
  const badge = `${grade.toUpperCase()} · ${ptsOf(t)} PTS`;
  const count = t.count != null ? (ctx.counts[t.id] ?? 0) : null;

  const head = `
    <div class="trophy-head">
      <label class="check" title="Mark earned">
        <input type="checkbox" data-action="toggle" data-id="${t.id}" ${checked ? 'checked' : ''}>
      </label>
      <span class="grade-badge ${grade}">${badge}</span>
      <h3 class="trophy-name">${masked ? 'Hidden trophy' : escapeHtml(t.name)}</h3>
      ${masked ? '<span class="tag hidden-tag">Hidden</span>' : `
        <span class="tag">${escapeHtml(KIND_LABELS[t.kind] ?? t.kind)}</span>
        <span class="tag">Phase ${t.phase}</span>
        ${missableTag(t)}
        ${t.hidden ? '<span class="tag hidden-tag">Hidden</span>' : ''}
        ${t.dispute ? '<span class="tag disputed">Disputed</span>' : ''}`}
      <button class="guide-toggle" type="button" data-action="expand" data-id="${t.id}">
        ${expanded ? 'Hide guide ▲' : 'Guide ▼'}
      </button>
    </div>`;

  if (masked) {
    return `<article class="trophy${checked ? ' checked' : ''}" data-id="${t.id}" data-grade="${grade}">
      ${head}
      <div class="spoiler-mask">
        This trophy is hidden on PlayStation. Its name and guide stay covered
        until you reveal it.
        <button class="btn" type="button" data-action="reveal" data-id="${t.id}">Reveal</button>
      </div>
    </article>`;
  }

  const sourceLinks = t.sources.map((id) => sourceLink(ctx, id)).filter(Boolean).join(', ');
  const steps = t.steps.map((st) => {
    const cites = (st.s || []).map((id) => {
      const src = ctx.sourcesById.get(id);
      return src ? escapeHtml(src.site) : null;
    }).filter(Boolean).join(', ');
    return `<li>${escapeHtml(st.t)}${cites ? ` <span class="step-cite">[${cites}]</span>` : ''}</li>`;
  }).join('');
  const counter = count === null ? '' : `
      <div class="counter">
        <span class="counter-label">${escapeHtml(t.countLabel ?? 'Progress')}</span>
        <button type="button" data-action="count-dec" data-id="${t.id}" aria-label="Decrease">−</button>
        <span class="counter-value" data-count-for="${t.id}">${count} / ${t.count} ${escapeHtml(t.countUnit ?? '')}</span>
        <button type="button" data-action="count-inc" data-id="${t.id}" aria-label="Increase">+</button>
      </div>`;

  return `<article class="trophy${checked ? ' checked' : ''}" data-id="${t.id}" data-grade="${grade}">
    ${head}
    <p class="trophy-desc">${escapeHtml(t.description)}</p>
    <div class="guide-body" ${expanded ? '' : 'hidden'}>
      <p>${escapeHtml(t.guide)}</p>
      <ol class="steps">${steps}</ol>
      ${disputeNote(t, ctx)}
      <p class="sources-line"><span class="src-label">Sources — </span>${sourceLinks}</p>
      ${counter}
    </div>
  </article>`;
}

export function renderTrophyList(trophies, ctx) {
  if (trophies.length === 0) {
    return '<p class="empty-note">No trophies match these filters. Loosen one and try again.</p>';
  }
  return `<div class="trophy-list">${trophies.map((t) => trophyCard(t, ctx)).join('')}</div>`;
}

function kindOptions() {
  return Object.entries(KIND_LABELS)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
}

export function renderTracker(ctx) {
  const f = ctx.filters;
  const all = ctx.data.trophies.trophies;
  const shown = applyFilters(all, f);
  return `
  <h2>Tracker</h2>
  <p class="view-intro">The full official list. Check a trophy off when it pops —
    progress and points update at the top, and everything is kept in this browser.</p>
  <div class="filter-bar">
    <input type="search" id="filterQ" placeholder="Search name, description or guide…" value="${escapeHtml(f.q)}" aria-label="Search trophies">
    <select id="filterGrade" aria-label="Filter by grade">
      <option value="all"${f.grade === 'all' ? ' selected' : ''}>All grades</option>
      <option value="platinum"${f.grade === 'platinum' ? ' selected' : ''}>Platinum</option>
      <option value="gold"${f.grade === 'gold' ? ' selected' : ''}>Gold</option>
      <option value="silver"${f.grade === 'silver' ? ' selected' : ''}>Silver</option>
      <option value="bronze"${f.grade === 'bronze' ? ' selected' : ''}>Bronze</option>
    </select>
    <select id="filterKind" aria-label="Filter by kind">
      <option value="all"${f.kind === 'all' ? ' selected' : ''}>All kinds</option>
      ${kindOptions()}
    </select>
    <select id="filterPhase" aria-label="Filter by phase">
      <option value="all"${f.phase === 'all' ? ' selected' : ''}>All phases</option>
      <option value="1"${f.phase === '1' ? ' selected' : ''}>Phase 1</option>
      <option value="2"${f.phase === '2' ? ' selected' : ''}>Phase 2</option>
      <option value="3"${f.phase === '3' ? ' selected' : ''}>Phase 3</option>
      <option value="4"${f.phase === '4' ? ' selected' : ''}>Phase 4</option>
    </select>
    <label class="filter-check"><input type="checkbox" id="filterMissable" ${f.missableOnly ? 'checked' : ''}> Missable only</label>
    <label class="filter-check"><input type="checkbox" id="filterHideChecked" ${f.hideChecked ? 'checked' : ''}> Hide earned</label>
  </div>
  <p class="result-count" id="resultCount">Showing ${shown.length} of ${all.length} trophies</p>
  <div id="trophyList">${renderTrophyList(shown, ctx)}</div>`;
}

export function renderRoadmap(ctx) {
  const { meta, trophies } = ctx.data.trophies;
  const phases = meta.roadmap.map((ph) => {
    const members = trophies.filter((t) => t.phase === ph.id);
    const phasePts = members.reduce((sum, t) => sum + ptsOf(t), 0);
    const chips = members
      .map((t) => {
        const masked = ctx.spoiler && t.hidden && !ctx.revealed.has(t.id);
        const label = masked ? 'Hidden trophy' : escapeHtml(t.name);
        return `<span class="phase-chip ${t.grade}">${label}</span>`;
      })
      .join('');
    return `<section class="phase-card">
      <h3>${escapeHtml(ph.name)}</h3>
      <p class="phase-hours">${escapeHtml(ph.hours)} · ${members.length} trophies · ${phasePts} PTS</p>
      <p>${escapeHtml(ph.note)}</p>
      <div class="phase-trophies">${chips}</div>
    </section>`;
  }).join('');
  return `
  <h2>Roadmap to the platinum</h2>
  <p class="view-intro">About ${escapeHtml(meta.roadmap_hours)} hours all in, in four
    phases. The platinum pops with the 54th trophy — everything before it is
    the work below.</p>
  <div class="phase-grid">${phases}</div>`;
}

export function renderChecklist(ctx) {
  const { meta } = ctx.data.trophies;
  const cells = Object.entries(meta.counts)
    .map(([key, value]) => `<div class="count-cell"><span>${escapeHtml(prettyCountKey(key))}</span><b>${value}</b></div>`)
    .join('');
  return `
  <h2>100% completion checklist</h2>
  <p class="view-intro">${escapeHtml(meta.note_100)}</p>
  <p class="view-intro">Platinum run: about ${escapeHtml(String(meta.hours_platinum))} hours.
    The checklist opens after the story (Progress &gt; Stats &gt; 100% Completion);
    clear the must-complete lines in full and the partial lines to their thresholds.</p>
  <div class="count-grid">${cells}</div>`;
}

export function renderRoutes(ctx) {
  const cards = ctx.data.routes.routes.map((r) => {
    const stages = r.stages.map((s) => `<li><b>${escapeHtml(s.label)}</b> — ${escapeHtml(String(s.n))}<span class="stage-tip">${escapeHtml(s.tip)}</span></li>`).join('');
    return `<section class="route-card">
      <h3>${escapeHtml(r.title)}</h3>
      <p class="route-meta">${r.count} ${escapeHtml(r.unit)} · ${r.stages.length} stages</p>
      <ol class="stage-list">${stages}</ol>
    </section>`;
  }).join('');
  return `
  <h2>Routes</h2>
  <p class="view-intro">Fifteen efficient routes through the grind — each broken into
    stages with a tip per stage, so the long counts stay organised instead of
    turning into a second playthrough.</p>
  <div class="route-list">${cards}</div>`;
}

export function renderSources(ctx) {
  const { sources, disputes, method_note: methodNote, read_date: readDate } = ctx.data.sources;
  const cards = sources.map((s) => `<article class="source-card">
      <h3>[${s.n}] ${escapeHtml(s.title)}</h3>
      <p class="source-meta">${escapeHtml(s.site)} · read ${escapeHtml(s.read)}</p>
      <p>${escapeHtml(s.note)}</p>
      <p><a href="${escapeHtml(s.url)}" rel="noopener">${escapeHtml(s.site)}</a></p>
    </article>`).join('');
  const disputeCards = disputes.map((d) => `<article class="dispute-card">
      <h3>${escapeHtml(d.q)}</h3>
      <div class="dispute-versus">
        <div><b>A.</b> ${escapeHtml(d.a)}</div>
        <div><b>B.</b> ${escapeHtml(d.b)}</div>
      </div>
      <p class="dispute-call"><b>Call:</b> ${escapeHtml(d.call)}</p>
    </article>`).join('');
  return `
  <h2>Sources &amp; disputes</h2>
  <p class="view-intro">${escapeHtml(methodNote)}</p>
  <p class="view-intro">Sources read ${escapeHtml(readDate)}. Every guide in this
    manual names the sources it was built from; where they disagree, the
    disagreement is shown below with the call this manual makes.</p>
  <div class="source-list">${cards}</div>
  <h2 style="margin-top: 28px;">Open disputes</h2>
  <div class="dispute-list">${disputeCards}</div>`;
}

export function renderMissables(ctx) {
  const { meta, trophies } = ctx.data.trophies;
  const flagged = trophies
    .filter((t) => t.missable !== 'none')
    .sort((a, b) => (a.missable === 'possible' ? -1 : 1) - (b.missable === 'possible' ? -1 : 1));
  const cards = flagged.map((t) => trophyCard(t, ctx, { expanded: true })).join('');
  return `
  <h2>Missables</h2>
  <div class="warn-banner"><b>Read before the story run.</b> ${escapeHtml(meta.missable)}
    The trophies below can be missed or locked out — check each guide before the
    chapter it belongs to, and keep a save at every chapter start.</div>
  <div class="trophy-list">${cards}</div>`;
}

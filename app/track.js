// Tracker state, points maths and audit numbers for the Field Manual.
// All audit figures are computed from the loaded data at run time —
// nothing on the strip is a hard-coded claim.

export const PTS = { bronze: 15, silver: 30, gold: 90, platinum: 300 };

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const KIND_LABELS = {
  platinum: 'Platinum',
  story: 'Story',
  completion: 'Completion',
  activity: 'Activity',
  side: 'Side',
  collectible: 'Collectible',
  feat: 'Feat',
  crime: 'Crime',
};

const CHECKED_KEY = 'leonida-checked-v4';
const COUNTS_KEY = 'leonida-counts-v4';
const SPOILER_KEY = 'leonida-spoiler-v4';

export function ptsOf(trophy) {
  return PTS[trophy.grade] ?? 0;
}

export function totalPts(trophies) {
  return trophies.reduce((sum, t) => sum + ptsOf(t), 0);
}

export function stepCount(trophies) {
  return trophies.reduce((sum, t) => sum + (Array.isArray(t.steps) ? t.steps.length : 0), 0);
}

// The demo run: every Phase 1 trophy that is not missable. It shows a
// story-run in progress without ever risking a missable.
export function demoSet(trophies) {
  return trophies.filter((t) => t.phase === 1 && t.missable === 'none');
}

export function auditOf(data) {
  const trophies = data.trophies.trophies;
  const sources = data.sources.sources;
  const disputes = data.sources.disputes;
  const demo = demoSet(trophies);
  return {
    official: trophies.length,
    cited: stepCount(trophies),
    // Guides backed by exactly two cited sources with a multi-step guide.
    backed: trophies.filter((t) => t.sources.length === 2 && t.steps.length >= 2).length,
    sources: sources.length,
    disputes: disputes.length,
    trackers: trophies.filter((t) => t.count != null).length,
    hidden: trophies.filter((t) => t.hidden).length,
    demoTrophies: demo.length,
    demoPts: demo.reduce((sum, t) => sum + ptsOf(t), 0),
    totalPts: totalPts(trophies),
  };
}

export function loadChecked() {
  try {
    const raw = localStorage.getItem(CHECKED_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

export function saveChecked(checked) {
  try {
    localStorage.setItem(CHECKED_KEY, JSON.stringify([...checked]));
  } catch {
    // Private mode or disabled storage: progress just does not persist.
  }
}

export function loadCounts() {
  try {
    const raw = localStorage.getItem(COUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCounts(counts) {
  try {
    localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  } catch {
    // Storage unavailable: counters still work for this session.
  }
}

export function loadSpoiler() {
  try {
    return localStorage.getItem(SPOILER_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveSpoiler(on) {
  try {
    localStorage.setItem(SPOILER_KEY, on ? 'on' : 'off');
  } catch {
    // Ignore: the toggle still works for this session.
  }
}

// Filter the trophy list by the tracker's current filter set.
export function applyFilters(trophies, f) {
  const q = (f.q || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.kind !== 'all' && t.kind !== f.kind) return false;
    if (f.phase !== 'all' && t.phase !== Number(f.phase)) return false;
    if (f.missableOnly && t.missable === 'none') return false;
    if (f.hideChecked && f.checked.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function prettyCountKey(key) {
  return key.replaceAll('_', ' ');
}

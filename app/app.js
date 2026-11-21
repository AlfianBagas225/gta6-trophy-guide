// Leonida Roadmap Planner — the tracker itself.
//
// One page, no build step, no network at run time: it fetches only
// data/trophies.json from beside it, keeps progress in localStorage,
// and mirrors the current view in the URL hash so a link reopens the
// same filter, spoiler setting and open guide.

const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'leonida-roadmap-progress-v1';
const SPOILER_KEY = 'leonida-roadmap-spoiler-v1';

const KIND_LABELS = {
  story: 'Story',
  activity: 'Activities',
  collectible: 'Collectibles',
  grind: 'Grind',
};

const STAGES = [
  { n: 1, title: 'Chapter 1', blurb: 'Opening mission Gone Fishing, then the chapter closes.' },
  { n: 2, title: 'Chapter 2', blurb: 'Second chapter of the story.' },
  { n: 3, title: 'Chapter 3', blurb: 'Vice City opens up: third chapter.' },
  { n: 4, title: 'Chapter 4', blurb: 'Last full chapter before the finale.' },
  { n: 5, title: 'Finale + Platinum', blurb: 'Final mission, then the platinum itself.' },
  { n: 6, title: 'Story missions & character finales', blurb: 'Named missions and the last mission for Andy, Kenton, Billy, Randy and Tyrone. Do them as they appear.' },
  { n: 7, title: 'One-chance moments', blurb: '14 flagged moments. Do each the first time it appears.' },
  { n: 8, title: 'Cleanup: collectables & completion', blurb: 'Cards, WAiNK spots, meditation spots, areas, vehicles, garages, challenges, Scooter Bros registrations and 100% completion.' },
  { n: 9, title: 'Activities & open world', blurb: 'Races, shooting range, drone races, stranger strands, robberies, money and the rest.' },
];

const MISSABLE_NOTE =
  '31 trophies are flagged missable: the 17 story chapter, mission and character-finale trophies, and 14 one-chance moments. Rule of thumb: finish a chapter\u2019s flagged trophies before the chapter ends, and do a flagged moment the first time it appears \u2014 do not assume a later replay will re-award it. The Missable Watch view lists all 31 in one place.';

const state = {
  trophies: [],
  earned: new Set(),
  view: 'tracker',
  kind: 'all',
  grade: 'all',
  query: '',
  spoiler: false,
  selectedId: 'hot-together',
};

const $ = (sel) => document.querySelector(sel);

function loadStoredProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) state.earned = new Set(parsed.earned);
  } catch {
    state.earned = new Set();
  }
  try {
    state.spoiler = localStorage.getItem(SPOILER_KEY) === '1';
  } catch {
    state.spoiler = false;
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...state.earned].sort() }));
  } catch {
    // A browser that refuses storage still runs the tracker for the session.
  }
}

function saveSpoiler() {
  try {
    localStorage.setItem(SPOILER_KEY, state.spoiler ? '1' : '0');
  } catch {
    // Same as above: the toggle still works for this session.
  }
}

function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const view = params.get('view');
  if (view === 'tracker' || view === 'roadmap' || view === 'missable') state.view = view;
  const kind = params.get('kind');
  if (kind === 'all' || kind === 'story' || kind === 'missable' || kind === 'collectible' || kind === 'activity' || kind === 'grind') state.kind = kind;
  const grade = params.get('grade');
  if (grade === 'all' || grade === 'platinum' || grade === 'gold' || grade === 'silver' || grade === 'bronze') state.grade = grade;
  const q = params.get('q');
  if (q !== null) state.query = q;
  if (params.get('spoiler') === '1') state.spoiler = true;
  if (params.get('spoiler') === '0') state.spoiler = false;
  const sel = params.get('sel');
  if (sel) state.selectedId = sel;
}

function writeHash() {
  const params = new URLSearchParams();
  params.set('view', state.view);
  params.set('kind', state.kind);
  params.set('grade', state.grade);
  if (state.query) params.set('q', state.query);
  params.set('spoiler', state.spoiler ? '1' : '0');
  if (state.selectedId) params.set('sel', state.selectedId);
  history.replaceState(null, '', '#' + params.toString());
}

function isHiddenFromSpoilers(t) {
  return state.spoiler && t.hidden && !state.earned.has(t.id);
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.view === 'missable' && !t.missable) return false;
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function gradeBadge(t) {
  return '<span class="badge grade-' + t.grade + '">' + t.grade.toUpperCase() + '</span>';
}

function kindBadge(t) {
  return '<span class="badge kind">' + KIND_LABELS[t.kind].toUpperCase() + '</span>';
}

function missableBadge(t) {
  return t.missable ? '<span class="badge missable">MISSABLE</span>' : '';
}

function countBadge(t) {
  return t.count !== null && t.count !== undefined ? '<span class="badge count">COUNT: ' + t.count + '</span>' : '';
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function trophyRow(t) {
  const earned = state.earned.has(t.id);
  const masked = isHiddenFromSpoilers(t);
  const selected = state.selectedId === t.id;
  const name = masked ? 'Hidden story trophy \u2014 earn it to reveal' : escapeHtml(t.name);
  const desc = masked
    ? 'Spoiler mode is on. This story trophy stays hidden until you earn it.'
    : escapeHtml(t.description);
  const hiddenTag = t.hidden ? ' <span class="hidden-tag">\u00b7 hidden</span>' : '';
  return (
    '<article class="trophy-row' + (selected ? ' selected' : '') + '" data-id="' + t.id + '">' +
    '<label class="check"><input type="checkbox" data-earn="' + t.id + '"' + (earned ? ' checked' : '') +
    ' aria-label="Mark ' + escapeHtml(t.name) + ' earned"><span class="box" aria-hidden="true"></span></label>' +
    '<div class="trophy-main"><h3>' + name + hiddenTag + '</h3><p>' + desc + '</p>' +
    '<div class="badges">' + gradeBadge(t) + kindBadge(t) + missableBadge(t) + countBadge(t) + '</div></div>' +
    '<div class="trophy-state">' + (earned ? 'Earned' : '') + '</div>' +
    '</article>'
  );
}

function renderList() {
  const list = visibleTrophies();
  const host = $('#trophy-list');
  host.innerHTML = list.length
    ? list.map(trophyRow).join('')
    : '<p class="empty">No trophies match these filters. Clear the search or pick another kind.</p>';
  $('#showing').textContent = 'Showing ' + list.length + ' of ' + state.trophies.length;
}

function renderGuide() {
  const panel = $('#guide-panel');
  const t = state.trophies.find((x) => x.id === state.selectedId) || state.trophies[0];
  if (!t) {
    panel.innerHTML = '<p class="empty">Pick a trophy to see its guide.</p>';
    return;
  }
  const earned = state.earned.has(t.id);
  const masked = isHiddenFromSpoilers(t);
  let html = '<h2>Guide</h2>';
  if (masked) {
    html += '<h3 class="guide-name">Hidden story trophy \u2014 earn it to reveal</h3>' +
      '<p class="guide-desc">Spoiler mode is on. This story trophy stays hidden until you earn it.</p>' +
      '<div class="badges">' + gradeBadge(t) + kindBadge(t) + missableBadge(t) + countBadge(t) + '</div>' +
      '<p class="source-line">' + escapeHtml(t.source) + '</p>' +
      '<p class="earn-state">Not earned yet.</p>' +
      '<p class="guide-text">Tick the box beside this trophy once you have earned it in the game, and its name, description and guide will appear here.</p>';
    panel.innerHTML = html;
    return;
  }
  html += '<h3 class="guide-name">' + escapeHtml(t.name) + '</h3>' +
    '<p class="guide-desc">' + escapeHtml(t.description) + '</p>' +
    '<div class="badges">' + gradeBadge(t) + kindBadge(t) + missableBadge(t) + countBadge(t) + '</div>';
  if (t.missable) {
    html += '<p class="missable-flag">MISSABLE \u2014 POINT OF NO RETURN</p>';
  }
  html += '<p class="source-line">' + escapeHtml(t.source) + '</p>';
  html += '<p class="earn-state">' + (earned ? 'Earned.' : 'Not earned yet.') + '</p>';
  if (t.missable) {
    html += '<p class="warn-box">Point-of-no-return warning: do this before its chapter or moment passes. If the moment is gone, a later replay may not re-award it.</p>';
  }
  html += '<h4 class="guide-label">GUIDE</h4><p class="guide-text">' + escapeHtml(t.guide) + '</p>';
  panel.innerHTML = html;
}

function stageCounts() {
  const counts = {};
  for (const s of STAGES) counts[s.n] = { total: 0, earned: 0 };
  for (const t of state.trophies) {
    counts[t.stage].total += 1;
    if (state.earned.has(t.id)) counts[t.stage].earned += 1;
  }
  return counts;
}

function stageCard(s, counts) {
  const c = counts[s.n];
  const pct = c.total ? Math.round((c.earned / c.total) * 100) : 0;
  return (
    '<section class="stage-card"><div class="stage-head"><h3>Stage ' + s.n + ' \u2014 ' + escapeHtml(s.title) + '</h3>' +
    '<span class="stage-count">' + c.earned + ' / ' + c.total + '</span></div>' +
    '<p>' + escapeHtml(s.blurb) + '</p>' +
    '<div class="bar"><span style="width:' + pct + '%"></span></div></section>'
  );
}

function renderStages() {
  const counts = stageCounts();
  $('#stage-list').innerHTML = STAGES.map((s) => stageCard(s, counts)).join('') +
    '<section class="stage-card warn-card"><h3>Point-of-no-return flags</h3><p>' + MISSABLE_NOTE + '</p></section>';
}

function renderRoadmap() {
  const counts = stageCounts();
  const earnedTotal = state.earned.size;
  const platinum = state.earned.size === state.trophies.length;
  $('#roadmap-view').innerHTML =
    '<h2>Platinum roadmap</h2>' +
    '<p class="view-intro">Play in stage order. Story stages first \u2014 the point-of-no-return flags sit there \u2014 then the one-chance moments, then cleanup and the long grinds. Each stage shows its trophies and how many you have earned.</p>' +
    '<div class="stage-grid">' + STAGES.map((s) => stageCard(s, counts)).join('') + '</div>' +
    '<section class="stage-card warn-card roadmap-warn"><h3>Point-of-no-return flags</h3><p>' + MISSABLE_NOTE + '</p></section>' +
    '<p class="platinum-line">' + (platinum
      ? 'Platinum earned \u2014 Vice Got a Price! You are a Leonida Legend.'
      : 'Platinum progress: ' + earnedTotal + ' of ' + state.trophies.length + ' trophies earned. Finish every stage to earn Vice Got a Price!') + '</p>';
}

function renderHeader() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  $('#overall-count').textContent = earned + ' / ' + total + ' earned';
  $('#overall-bar').style.width = pct + '%';
  $('#overall-pct').textContent = pct + '%';
}

function renderAll() {
  renderHeader();
  renderStages();
  if (state.view === 'roadmap') {
    renderRoadmap();
  } else {
    renderList();
    renderGuide();
  }
  document.querySelectorAll('[data-view-tab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.viewTab === state.view);
  });
  $('#tracker-view').hidden = state.view === 'roadmap';
  $('#roadmap-view').hidden = state.view !== 'roadmap';
  $('#filter-bar').hidden = state.view === 'roadmap';
  writeHash();
}

function setView(view) {
  state.view = view;
  renderAll();
}

function setKind(kind) {
  state.kind = kind;
  document.querySelectorAll('[data-kind-chip]').forEach((b) => {
    b.classList.toggle('active', b.dataset.kindChip === kind);
  });
  renderAll();
}

function setGrade(grade) {
  state.grade = grade;
  renderAll();
}

function setQuery(q) {
  state.query = q;
  renderAll();
}

function setSpoiler(on) {
  state.spoiler = on;
  saveSpoiler();
  renderAll();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress();
  renderAll();
}

function exportProgress() {
  const payload = {
    app: 'Leonida Roadmap Planner',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-roadmap-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const known = new Set(state.trophies.map((t) => t.id));
      const kept = ids.filter((id) => typeof id === 'string' && known.has(id));
      state.earned = new Set(kept);
      saveProgress();
      renderAll();
      $('#import-note').textContent = 'Imported ' + kept.length + ' earned trophies.';
    } catch {
      $('#import-note').textContent = 'That file could not be read as progress. Nothing changed.';
    }
  };
  reader.readAsText(file);
}

function wireEvents() {
  document.querySelectorAll('[data-view-tab]').forEach((b) => {
    b.addEventListener('click', () => setView(b.dataset.viewTab));
  });
  document.querySelectorAll('[data-kind-chip]').forEach((b) => {
    b.addEventListener('click', () => setKind(b.dataset.kindChip));
  });
  $('#grade-select').addEventListener('change', (e) => setGrade(e.target.value));
  $('#search-input').addEventListener('input', (e) => setQuery(e.target.value));
  $('#spoiler-toggle').addEventListener('change', (e) => setSpoiler(e.target.checked));
  $('#export-btn').addEventListener('click', exportProgress);
  $('#import-input').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('#trophy-list').addEventListener('click', (e) => {
    const earnBox = e.target.closest('[data-earn]');
    if (earnBox) {
      e.stopPropagation();
      toggleEarned(earnBox.dataset.earn);
      return;
    }
    const row = e.target.closest('.trophy-row');
    if (row) {
      state.selectedId = row.dataset.id;
      renderList();
      renderGuide();
      writeHash();
    }
  });
  $('#trophy-list').addEventListener('change', (e) => {
    const box = e.target.closest('[data-earn]');
    if (box) toggleEarned(box.dataset.earn);
  });
}

function applyInitialControls() {
  document.querySelectorAll('[data-kind-chip]').forEach((b) => {
    b.classList.toggle('active', b.dataset.kindChip === state.kind);
  });
  $('#grade-select').value = state.grade;
  $('#search-input').value = state.query;
  $('#spoiler-toggle').checked = state.spoiler;
}

async function boot() {
  loadStoredProgress();
  readHash();
  applyInitialControls();
  wireEvents();
  const res = await fetch(DATA_URL);
  const data = await res.json();
  state.trophies = data.trophies;
  if (!state.trophies.some((t) => t.id === state.selectedId)) {
    state.selectedId = state.trophies.length ? state.trophies[0].id : null;
  }
  renderAll();
}

boot();

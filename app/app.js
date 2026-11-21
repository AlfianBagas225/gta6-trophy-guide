'use strict';
/* Leonida Roadmap Planner: tracker + guide for the 55 GTA 6 trophies.
   Plain script, no imports, no network beyond this app's own files.
   Progress lives in localStorage; state (view, selection, spoiler) in the URL hash. */

var DATA_URL = 'data/trophies.json';
var STORE_KEY = 'leonida-roadmap-planner-v1';

var ROADMAP = [
  { n: 1, title: 'Chapter 1 — First steps in Leonida', blurb: 'Open the story and finish the first chapter; Gone Fishing comes with it.' },
  { n: 2, title: 'Chapter 2 — Drug money', blurb: 'Play the story through to the end of Chapter 2.' },
  { n: 3, title: 'Chapter 3 — Vice City, baby', blurb: 'Play the story through to the end of Chapter 3.' },
  { n: 4, title: 'Chapter 4 — Top of the world', blurb: 'Play the story through to the end of Chapter 4.' },
  { n: 5, title: 'Finale — Last mission, then 100%', blurb: 'Finish the final mission, then sweep the completion checklist toward 100%.' },
  { n: 6, title: 'Story missions — Named jobs', blurb: 'The named story missions and the stranger strands for Andy, Kenton, Billy, Randy and Tyrone.' },
  { n: 7, title: 'Activities — Ranges, races, hunts', blurb: 'Shooting Range golds, drone races, fishing, arcade, meditation spots and the partner stunts.' },
  { n: 8, title: 'Heists and one-offs — Robberies and odd jobs', blurb: 'Vaults, armored trucks, gang operations, and the one-off events that only happen once.' },
  { n: 9, title: 'Cleanup — Grinds and the platinum', blurb: 'Collectibles, long counts and the last choices; the platinum lands when the other 54 do.' }
];

var GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
var KIND_LABEL = { story: 'Story', activity: 'Activity', collectible: 'Collectible', grind: 'Grind' };

var trophies = [];
var earned = new Set();
var selectedId = null;
var view = 'checklist';
var spoiler = false;
var filters = { q: '', kind: 'all', grade: 'all', missable: false, earnedOnly: false };

function $(id) { return document.getElementById(id); }

function makeEl(tag, cls, text) {
  var node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function loadStore() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    var data = JSON.parse(raw);
    if (data && Array.isArray(data.earned)) earned = new Set(data.earned);
  } catch (e) { /* a broken save is ignored, progress starts empty */ }
}

function saveStore() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ earned: Array.from(earned).sort(function (a, b) { return a - b; }), savedAt: new Date().toISOString() }));
  } catch (e) { /* storage full or blocked: the page still works for this visit */ }
}

function trophyById(id) {
  for (var i = 0; i < trophies.length; i++) if (trophies[i].id === id) return trophies[i];
  return null;
}

function isSpoilerHidden(t) {
  return spoiler && t.hidden && !earned.has(t.id);
}

function displayName(t) {
  return isSpoilerHidden(t) ? 'Hidden trophy — earn it to reveal' : t.name;
}

function displayDescription(t) {
  return isSpoilerHidden(t) ? 'Its name and description stay hidden until you earn it.' : t.description;
}

function filteredTrophies() {
  var q = filters.q.trim().toLowerCase();
  return trophies.filter(function (t) {
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.missable && !t.missable) return false;
    if (filters.earnedOnly && !earned.has(t.id)) return false;
    if (q) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function renderStats() {
  var total = trophies.length;
  var done = earned.size;
  var pct = total ? Math.round((done / total) * 100) : 0;
  $('earnedCount').textContent = done + ' / ' + total + ' earned · ' + pct + '%';
  $('earnedBar').style.width = pct + '%';
  $('earnedBar').setAttribute('aria-valuenow', String(pct));
  var counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  trophies.forEach(function (t) { if (earned.has(t.id)) counts[t.grade]++; });
  $('gradeCounts').textContent = 'Platinum ' + counts.platinum + '/1 · Gold ' + counts.gold + '/2 · Silver ' + counts.silver + '/6 · Bronze ' + counts.bronze + '/46';
  var miss = trophies.filter(function (t) { return t.missable; });
  var missDone = miss.filter(function (t) { return earned.has(t.id); }).length;
  $('missableCount').textContent = 'Missable: ' + missDone + ' / ' + miss.length + ' earned';
}

function renderList() {
  var list = $('list');
  list.innerHTML = '';
  var items = filteredTrophies();
  $('listCount').textContent = items.length + ' of ' + trophies.length + ' trophies shown';
  if (!items.length) {
    list.appendChild(makeEl('li', 'empty', 'No trophies match these filters. Clear the search or widen the filters.'));
    return;
  }
  items.forEach(function (t) {
    var li = makeEl('li', 'trophy' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : ''));
    var check = makeEl('input');
    check.type = 'checkbox';
    check.checked = earned.has(t.id);
    check.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    check.addEventListener('change', function () {
      if (check.checked) earned.add(t.id); else earned.delete(t.id);
      saveStore();
      renderAll();
      updateHash();
    });
    li.appendChild(check);
    var body = makeEl('button', 'trophy-body');
    body.type = 'button';
    body.addEventListener('click', function () { selectTrophy(t.id); });
    var top = makeEl('span', 'trophy-top');
    top.appendChild(makeEl('span', 'trophy-name', displayName(t)));
    top.appendChild(makeEl('span', 'badge grade-' + t.grade, GRADE_LABEL[t.grade]));
    if (t.missable) top.appendChild(makeEl('span', 'badge missable', 'Missable'));
    if (t.hidden) top.appendChild(makeEl('span', 'badge hidden-flag', 'Hidden'));
    body.appendChild(top);
    body.appendChild(makeEl('span', 'trophy-desc', displayDescription(t)));
    var meta = makeEl('span', 'trophy-meta', KIND_LABEL[t.kind] + ' · Stage ' + t.stage + (t.count != null ? ' · Target ' + t.count : ''));
    body.appendChild(meta);
    li.appendChild(body);
    list.appendChild(li);
  });
}

function renderAll() {
  renderStats();
  renderList();
  renderRoadmap();
  renderMissable();
  if (selectedId != null) renderDetail(trophyById(selectedId));
}

function renderDetail(t) {
  var pane = $('detailBody');
  pane.innerHTML = '';
  if (!t) {
    pane.appendChild(makeEl('p', 'detail-empty', 'Pick a trophy from the list to see its guide and sources.'));
    return;
  }
  pane.appendChild(makeEl('h2', 'detail-name', displayName(t)));
  var badges = makeEl('p', 'detail-badges');
  badges.appendChild(makeEl('span', 'badge grade-' + t.grade, GRADE_LABEL[t.grade]));
  badges.appendChild(makeEl('span', 'badge kind', KIND_LABEL[t.kind]));
  if (t.missable) badges.appendChild(makeEl('span', 'badge missable', 'Missable — do it before the moment passes'));
  if (t.hidden) badges.appendChild(makeEl('span', 'badge hidden-flag', 'Hidden on PlayStation'));
  pane.appendChild(badges);
  pane.appendChild(makeEl('p', 'detail-desc', displayDescription(t)));
  pane.appendChild(makeEl('p', 'detail-source', 'Sources: ' + t.source));
  pane.appendChild(makeEl('h3', null, 'Guide'));
  pane.appendChild(makeEl('p', 'detail-guide', t.guide));
  var facts = makeEl('dl', 'detail-facts');
  var rows = [
    ['Roadmap stage', 'Stage ' + t.stage + ' — ' + ROADMAP[t.stage - 1].title],
    ['Progress target', t.count != null ? String(t.count) : 'No counted target'],
    ['Status', earned.has(t.id) ? 'Earned' : 'Not earned yet']
  ];
  rows.forEach(function (row) {
    facts.appendChild(makeEl('dt', null, row[0]));
    facts.appendChild(makeEl('dd', null, row[1]));
  });
  pane.appendChild(facts);
  var toggle = makeEl('button', 'btn', earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', function () {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    saveStore();
    renderAll();
    updateHash();
  });
  pane.appendChild(toggle);
}

function renderRoadmap() {
  var wrap = $('roadmap');
  wrap.innerHTML = '';
  ROADMAP.forEach(function (stage) {
    var items = trophies.filter(function (t) { return t.stage === stage.n; });
    var done = items.filter(function (t) { return earned.has(t.id); }).length;
    var card = makeEl('section', 'stage');
    card.appendChild(makeEl('h3', null, 'Stage ' + stage.n + ' — ' + stage.title));
    card.appendChild(makeEl('p', 'stage-blurb', stage.blurb));
    card.appendChild(makeEl('p', 'stage-count', done + ' / ' + items.length + ' earned'));
    var ul = makeEl('ul', 'stage-list');
    items.forEach(function (t) {
      var li = makeEl('li', earned.has(t.id) ? 'done' : '');
      var b = makeEl('button', 'stage-item');
      b.type = 'button';
      b.textContent = (earned.has(t.id) ? '✓ ' : '○ ') + displayName(t);
      b.addEventListener('click', function () { setView('checklist'); selectTrophy(t.id); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    card.appendChild(ul);
    wrap.appendChild(card);
  });
}

function renderMissable() {
  var wrap = $('missableList');
  wrap.innerHTML = '';
  var items = trophies.filter(function (t) { return t.missable; });
  $('missableIntro').textContent = 'Missable means tied to a specific story mission, chapter or one-off event: once that moment passes, the trophy is gone for this playthrough. ' + items.length + ' of 55 trophies are flagged missable. Free-roam and repeatable trophies are not flagged.';
  items.forEach(function (t) {
    var li = makeEl('li', 'trophy' + (earned.has(t.id) ? ' earned' : ''));
    var b = makeEl('button', 'trophy-body');
    b.type = 'button';
    b.addEventListener('click', function () { setView('checklist'); selectTrophy(t.id); });
    b.appendChild(makeEl('span', 'trophy-name', displayName(t)));
    b.appendChild(makeEl('span', 'trophy-desc', displayDescription(t)));
    b.appendChild(makeEl('span', 'trophy-meta', KIND_LABEL[t.kind] + ' · Stage ' + t.stage + ' · ' + GRADE_LABEL[t.grade]));
    li.appendChild(b);
    wrap.appendChild(li);
  });
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail(trophyById(id));
  updateHash();
  var pane = $('detail');
  if (pane && window.innerWidth < 1000) pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setView(v) {
  view = v;
  ['checklist', 'roadmap', 'missable'].forEach(function (name) {
    $('view-' + name).hidden = name !== v;
    var btn = document.querySelector('[data-view="' + name + '"]');
    if (btn) btn.setAttribute('aria-pressed', String(name === v));
  });
  updateHash();
}

function exportProgress() {
  var blob = new Blob([JSON.stringify({ app: 'leonida-roadmap-planner', exportedAt: new Date().toISOString(), earned: Array.from(earned).sort(function (a, b) { return a - b; }) }, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophies-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}

function importProgress(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(String(reader.result));
      var ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      var next = new Set();
      ids.forEach(function (id) {
        var n = Number(id);
        if (trophyById(n)) next.add(n);
      });
      earned = next;
      saveStore();
      renderAll();
      updateHash();
      $('importNote').textContent = 'Imported ' + earned.size + ' earned trophies.';
    } catch (e) {
      $('importNote').textContent = 'That file could not be read as progress. Export a file from this guide and try again.';
    }
  };
  reader.readAsText(file);
}

function readHash() {
  var params = new URLSearchParams(window.location.hash.slice(1));
  var v = params.get('view');
  if (v === 'roadmap' || v === 'missable' || v === 'checklist') view = v;
  var s = params.get('spoiler');
  spoiler = s === '1';
  var id = Number(params.get('t'));
  if (id && trophyById(id)) selectedId = id;
}

function updateHash() {
  var params = new URLSearchParams();
  params.set('view', view);
  if (selectedId != null) params.set('t', String(selectedId));
  if (spoiler) params.set('spoiler', '1');
  history.replaceState(null, '', '#' + params.toString());
}

function wireControls() {
  document.querySelectorAll('[data-view]').forEach(function (btn) {
    btn.addEventListener('click', function () { setView(btn.getAttribute('data-view')); });
  });
  $('q').addEventListener('input', function (e) { filters.q = e.target.value; renderList(); });
  $('kindFilter').addEventListener('change', function (e) { filters.kind = e.target.value; renderList(); });
  $('gradeFilter').addEventListener('change', function (e) { filters.grade = e.target.value; renderList(); });
  $('missableOnly').addEventListener('change', function (e) { filters.missable = e.target.checked; renderList(); });
  $('earnedOnly').addEventListener('change', function (e) { filters.earnedOnly = e.target.checked; renderList(); });
  $('spoilerToggle').addEventListener('change', function (e) {
    spoiler = e.target.checked;
    renderAll();
    updateHash();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', function () {
    earned = new Set();
    saveStore();
    renderAll();
    updateHash();
    $('importNote').textContent = 'Progress cleared.';
  });
}

function boot() {
  loadStore();
  readHash();
  $('spoilerToggle').checked = spoiler;
  wireControls();
  setView(view);
  fetch(DATA_URL)
    .then(function (res) { if (!res.ok) throw new Error('trophies.json not found'); return res.json(); })
    .then(function (data) {
      trophies = data.trophies || data;
      renderAll();
    })
    .catch(function () {
      $('list').innerHTML = '<li class="empty">Could not load data/trophies.json. Serve the app/ folder over HTTP and try again.</li>';
    });
}

document.addEventListener('DOMContentLoaded', boot);

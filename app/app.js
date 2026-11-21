// Leonida Roadmap Planner — offline GTA 6 trophy guide and tracker.
// Plain script, no imports, no network at run time except the one local
// fetch of data/trophies.json. Progress lives in localStorage; the view
// (filters, spoiler, selected trophy) lives in the URL hash.
(function () {
  'use strict';

  var DATA_URL = 'data/trophies.json';
  var STORE_KEY = 'leonida-roadmap-planner-v1';
  var EXOPHASE_URL = 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/';
  var PSN_URL = 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi';

  var STAGES = [
    { n: 1, title: 'Welcome to Leonida', blurb: 'Chapter 1, plus a first taste of every activity in the game.' },
    { n: 2, title: 'Gone Fishing', blurb: 'The Gone Fishing story mission, early in the story.' },
    { n: 3, title: 'Chapter Two', blurb: 'The second chapter, start to finish.' },
    { n: 4, title: 'Vice City, Baby', blurb: 'Chapter 3: the city opens up.' },
    { n: 5, title: 'Top of the World', blurb: 'Chapter 4 and the Breakfast Run mission.' },
    { n: 6, title: 'The Big Jobs', blurb: 'The named heists and story missions, plus the finale.' },
    { n: 7, title: 'Strangers Across Leonida', blurb: 'Stranger strands, activities, and the partner trophies.' },
    { n: 8, title: 'Crime Pays', blurb: 'Robberies, getaways, and the one-time choices.' },
    { n: 9, title: 'The Long Cleanup', blurb: 'Counts, collectibles, 100% completion — and the platinum.' }
  ];

  var KIND_LABELS = { story: 'Story', activity: 'Activity', collectible: 'Collectible', grind: 'Grind' };
  var GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

  var state = {
    trophies: [],
    byId: {},
    earned: {},
    view: 'checklist',
    kind: 'all',
    grade: 'all',
    q: '',
    missableOnly: false,
    hideEarned: false,
    spoiler: false,
    selectedId: null
  };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtCount(n) {
    if (n === null || n === undefined) return '';
    return n.toLocaleString('en-US');
  }

  // ---- saved progress -------------------------------------------------
  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.earned)) {
        saved.earned.forEach(function (id) { state.earned[id] = true; });
      }
      if (saved && typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
    } catch (e) { /* a corrupt save is ignored, never fatal */ }
  }

  function saveProgress() {
    var earnedIds = Object.keys(state.earned).filter(function (id) { return state.earned[id]; })
      .map(function (id) { return Number(id); }).sort(function (a, b) { return a - b; });
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ earned: earnedIds, spoiler: state.spoiler, savedAt: new Date().toISOString() }));
    } catch (e) { /* storage full or blocked: progress still works in memory */ }
  }

  // ---- URL hash state --------------------------------------------------
  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    var parts = hash ? hash.split('&') : [];
    parts.forEach(function (part) {
      var kv = part.split('=');
      var key = decodeURIComponent(kv[0] || '');
      var val = decodeURIComponent(kv[1] || '');
      if (key === 'view' && (val === 'checklist' || val === 'roadmap' || val === 'missable')) state.view = val;
      if (key === 'kind' && (val === 'all' || KIND_LABELS[val])) state.kind = val;
      if (key === 'grade' && (val === 'all' || GRADE_LABELS[val])) state.grade = val;
      if (key === 'q') state.q = val;
      if (key === 'missable') state.missableOnly = val === '1';
      if (key === 'hideEarned') state.hideEarned = val === '1';
      if (key === 'spoiler') state.spoiler = val === '1';
      if (key === 't') state.selectedId = Number(val) || null;
    });
  }

  function writeHash() {
    var bits = ['view=' + state.view];
    if (state.kind !== 'all') bits.push('kind=' + state.kind);
    if (state.grade !== 'all') bits.push('grade=' + state.grade);
    if (state.q) bits.push('q=' + encodeURIComponent(state.q));
    if (state.missableOnly) bits.push('missable=1');
    if (state.hideEarned) bits.push('hideEarned=1');
    if (state.spoiler) bits.push('spoiler=1');
    if (state.selectedId) bits.push('t=' + state.selectedId);
    var next = '#' + bits.join('&');
    if (window.location.hash !== next) history.replaceState(null, '', next);
  }

  // ---- data ------------------------------------------------------------
  function loadData() {
    return fetch(DATA_URL).then(function (res) {
      if (!res.ok) throw new Error('Could not load ' + DATA_URL);
      return res.json();
    }).then(function (data) {
      state.trophies = data.trophies || data;
      state.trophies.forEach(function (t) { state.byId[t.id] = t; });
      if (state.selectedId && !state.byId[state.selectedId]) state.selectedId = null;
      return state.trophies;
    });
  }

  function earnedCount(list) {
    return list.filter(function (t) { return state.earned[t.id]; }).length;
  }

  function isSpoilerHidden(t) {
    return state.spoiler && t.kind === 'story' && !state.earned[t.id];
  }

  function trophyName(t) {
    return isSpoilerHidden(t) ? 'Story trophy — spoiler hidden' : t.name;
  }

  function trophyDesc(t) {
    return isSpoilerHidden(t) ? 'Hidden until earned. Turn the spoiler setting off, or earn this trophy, to reveal its name and description.' : t.description;
  }

  // ---- filtering -------------------------------------------------------
  function visibleTrophies() {
    var q = state.q.trim().toLowerCase();
    return state.trophies.filter(function (t) {
      if (state.kind !== 'all' && t.kind !== state.kind) return false;
      if (state.grade !== 'all' && t.grade !== state.grade) return false;
      if (state.missableOnly && !t.missable) return false;
      if (state.hideEarned && state.earned[t.id]) return false;
      if (q && (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  // ---- header + progress ----------------------------------------------
  function renderHeader() {
    var total = state.trophies.length;
    var got = earnedCount(state.trophies);
    var pct = total ? Math.round((got / total) * 100) : 0;
    var missable = state.trophies.filter(function (t) { return t.missable; });
    var missGot = earnedCount(missable);
    $('earnedBig').textContent = got + ' / ' + total;
    $('earnedPct').textContent = pct + '% to the platinum';
    $('progressFill').style.width = pct + '%';
    $('missableLine').textContent = 'Missable: ' + missGot + ' of ' + missable.length + ' earned';
    var grades = ['platinum', 'gold', 'silver', 'bronze'];
    $('gradeCounts').innerHTML = grades.map(function (g) {
      var list = state.trophies.filter(function (t) { return t.grade === g; });
      return '<span class="grade-pill grade-' + g + '">' + GRADE_LABELS[g] + ' ' + earnedCount(list) + '/' + list.length + '</span>';
    }).join('');
  }

  // ---- checklist -------------------------------------------------------
  function badgeHtml(t) {
    var out = '<span class="medal medal-' + t.grade + '" title="' + GRADE_LABELS[t.grade] + '">' + GRADE_LABELS[t.grade].slice(0, 1) + '</span>';
    out += '<span class="tag tag-kind">' + KIND_LABELS[t.kind] + '</span>';
    if (t.missable) out += '<span class="tag tag-missable">MISSABLE</span>';
    if (t.hidden) out += '<span class="tag tag-hidden">Hidden</span>';
    if (t.count !== null && t.count !== undefined) out += '<span class="tag tag-count">Count: ' + fmtCount(t.count) + '</span>';
    out += '<span class="tag tag-stage">Stage ' + t.stage + '</span>';
    return out;
  }

  function renderList() {
    var list = visibleTrophies();
    var box = $('trophyList');
    if (!list.length) {
      box.innerHTML = '<p class="empty-note">No trophies match these filters. Clear the search or widen the filters.</p>';
      return;
    }
    box.innerHTML = list.map(function (t) {
      var earned = !!state.earned[t.id];
      var sel = state.selectedId === t.id ? ' selected' : '';
      return '<article class="trophy-row' + (earned ? ' earned' : '') + sel + '" data-id="' + t.id + '" tabindex="0">' +
        '<label class="check"><input type="checkbox" data-check="' + t.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark ' + esc(trophyName(t)) + ' earned"><span class="box" aria-hidden="true">' + (earned ? '✓' : '') + '</span></label>' +
        '<div class="row-body"><div class="row-top">' + badgeHtml(t) + '</div>' +
        '<h3 class="row-name">' + esc(trophyName(t)) + '</h3>' +
        '<p class="row-desc">' + esc(trophyDesc(t)) + '</p></div></article>';
    }).join('');
    $('listCount').textContent = list.length + ' shown of ' + state.trophies.length;
  }

  // ---- detail pane: guide + sources ------------------------------------
  function renderDetail() {
    var pane = $('detail');
    var t = state.byId[state.selectedId];
    if (!t) {
      pane.innerHTML = '<p class="empty-note">Select a trophy on the left to read its guide and sources.</p>';
      return;
    }
    var hidden = isSpoilerHidden(t);
    var guideHtml;
    if (hidden) {
      guideHtml = '<h4>Guide</h4><p>This is a story trophy and the spoiler setting is on. Earn it — or turn spoilers off — to read its guide.</p>';
    } else {
      guideHtml = '<h4>Guide</h4><p>' + esc(t.guide) + '</p>' +
        (t.missable ? '<p class="missable-note"><strong>When it can be missed:</strong> this trophy is tied to a specific story moment. Play the moment when it comes; a later chance needs a mission replay or a new playthrough.</p>' : '');
    }
    pane.innerHTML =
      '<div class="detail-head">' + badgeHtml(t) + '</div>' +
      '<h2 class="detail-name">' + esc(trophyName(t)) + '</h2>' +
      '<p class="detail-desc">' + esc(trophyDesc(t)) + '</p>' +
      '<div class="sources"><h4>Sources</h4><p>' + esc(t.source) + '</p>' +
      '<p class="source-links"><a href="' + EXOPHASE_URL + '" target="_blank" rel="noopener">Exophase trophy list</a> · ' +
      '<a href="' + PSN_URL + '" target="_blank" rel="noopener">PSNProfiles trophy list</a></p></div>' +
      guideHtml +
      '<button class="btn detail-toggle" data-toggle="' + t.id + '">' + (state.earned[t.id] ? 'Mark as not earned' : 'Mark as earned') + '</button>';
  }

  // ---- roadmap ---------------------------------------------------------
  function renderRoadmap() {
    $('roadmap').innerHTML = STAGES.map(function (s) {
      var list = state.trophies.filter(function (t) { return t.stage === s.n; });
      var got = earnedCount(list);
      var pct = list.length ? Math.round((got / list.length) * 100) : 0;
      var chips = list.map(function (t) {
        var earned = !!state.earned[t.id];
        return '<button class="chip' + (earned ? ' earned' : '') + (t.missable ? ' miss' : '') + '" data-open="' + t.id + '" title="' + esc(trophyName(t)) + '">' + (earned ? '✓ ' : '') + esc(trophyName(t)) + '</button>';
      }).join('');
      return '<section class="stage-card"><header><span class="stage-num">Stage ' + s.n + '</span>' +
        '<h3>' + esc(s.title) + '</h3><span class="stage-count">' + got + '/' + list.length + '</span></header>' +
        '<p class="stage-blurb">' + esc(s.blurb) + '</p>' +
        '<div class="stage-bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="chips">' + chips + '</div></section>';
    }).join('');
  }

  // ---- missable view -----------------------------------------------------
  function renderMissable() {
    var list = state.trophies.filter(function (t) { return t.missable; });
    var got = earnedCount(list);
    $('missableIntro').textContent = '31 trophies can be missed — every hidden trophy, plus three more whose character or partner may not be around later. ' + got + ' of 31 earned. Do these during the story; the rest can wait for cleanup.';
    $('missableList').innerHTML = list.map(function (t) {
      var earned = !!state.earned[t.id];
      return '<article class="trophy-row' + (earned ? ' earned' : '') + '" data-id="' + t.id + '" tabindex="0">' +
        '<label class="check"><input type="checkbox" data-check="' + t.id + '"' + (earned ? ' checked' : '') + ' aria-label="Mark ' + esc(trophyName(t)) + ' earned"><span class="box" aria-hidden="true">' + (earned ? '✓' : '') + '</span></label>' +
        '<div class="row-body"><div class="row-top">' + badgeHtml(t) + '</div>' +
        '<h3 class="row-name">' + esc(trophyName(t)) + '</h3>' +
        '<p class="row-desc">' + esc(trophyDesc(t)) + '</p>' +
        '<p class="row-where">Roadmap stage ' + t.stage + ' — ' + esc(STAGES[t.stage - 1].title) + '</p></div></article>';
    }).join('');
  }

  // ---- view switching + sync -------------------------------------------
  function renderAll() {
    renderHeader();
    renderList();
    renderDetail();
    renderRoadmap();
    renderMissable();
    document.querySelectorAll('[data-view-tab]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view-tab') === state.view);
      btn.setAttribute('aria-pressed', btn.getAttribute('data-view-tab') === state.view ? 'true' : 'false');
    });
    ['checklist', 'roadmap', 'missable'].forEach(function (v) {
      $('view-' + v).hidden = state.view !== v;
    });
    $('kindFilter').value = state.kind;
    $('gradeFilter').value = state.grade;
    $('searchBox').value = state.q;
    $('missableOnly').checked = state.missableOnly;
    $('hideEarned').checked = state.hideEarned;
    $('spoilerToggle').checked = state.spoiler;
    writeHash();
  }

  function toggleEarned(id) {
    if (state.earned[id]) delete state.earned[id];
    else state.earned[id] = true;
    saveProgress();
    renderAll();
  }

  function selectTrophy(id, switchView) {
    state.selectedId = id;
    if (switchView) state.view = 'checklist';
    var list = visibleTrophies();
    if (!list.length) state.selectedId = state.trophies.length ? state.trophies[0].id : null;
    renderAll();
  }

  // ---- export / import ---------------------------------------------------
  function exportProgress() {
    var earnedIds = Object.keys(state.earned).filter(function (id) { return state.earned[id]; })
      .map(function (id) { return Number(id); }).sort(function (a, b) { return a - b; });
    var blob = new Blob([JSON.stringify({ app: 'leonida-roadmap-planner', exportedAt: new Date().toISOString(), earned: earnedIds }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-roadmap-progress.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        var fresh = {};
        ids.forEach(function (id) { if (state.byId[id]) fresh[id] = true; });
        state.earned = fresh;
        saveProgress();
        renderAll();
        $('importNote').textContent = 'Imported ' + Object.keys(fresh).length + ' earned trophies.';
      } catch (e) {
        $('importNote').textContent = 'That file could not be read as a progress export. Nothing was changed.';
      }
    };
    reader.readAsText(file);
  }

  // ---- events ------------------------------------------------------------
  function bindEvents() {
    document.querySelectorAll('[data-view-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.view = btn.getAttribute('data-view-tab');
        renderAll();
      });
    });
    $('searchBox').addEventListener('input', function (e) { state.q = e.target.value; renderList(); writeHash(); });
    $('kindFilter').addEventListener('change', function (e) { state.kind = e.target.value; renderAll(); });
    $('gradeFilter').addEventListener('change', function (e) { state.grade = e.target.value; renderAll(); });
    $('missableOnly').addEventListener('change', function (e) { state.missableOnly = e.target.checked; renderAll(); });
    $('hideEarned').addEventListener('change', function (e) { state.hideEarned = e.target.checked; renderAll(); });
    $('spoilerToggle').addEventListener('change', function (e) {
      state.spoiler = e.target.checked;
      saveProgress();
      renderAll();
    });
    $('exportBtn').addEventListener('click', exportProgress);
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
      e.target.value = '';
    });
    $('resetBtn').addEventListener('click', function () {
      if (window.confirm('Clear all earned trophies? This cannot be undone.')) {
        state.earned = {};
        saveProgress();
        renderAll();
      }
    });
    document.addEventListener('click', function (e) {
      var check = e.target.closest('[data-check]');
      if (check) { e.stopPropagation(); toggleEarned(Number(check.getAttribute('data-check'))); return; }
      var row = e.target.closest('[data-id]');
      if (row) { selectTrophy(Number(row.getAttribute('data-id')), false); return; }
      var chip = e.target.closest('[data-open]');
      if (chip) { selectTrophy(Number(chip.getAttribute('data-open')), true); return; }
      var tog = e.target.closest('[data-toggle]');
      if (tog) { toggleEarned(Number(tog.getAttribute('data-toggle'))); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target && e.target.matches('[data-id]')) {
        selectTrophy(Number(e.target.getAttribute('data-id')), false);
      }
    });
    window.addEventListener('hashchange', function () {
      readHash();
      renderAll();
    });
  }

  // ---- boot ---------------------------------------------------------------
  function boot() {
    loadSaved();
    readHash();
    loadData().then(function () {
      if (!state.selectedId) {
        var first = visibleTrophies()[0] || state.trophies[0];
        if (first) state.selectedId = first.id;
      }
      bindEvents();
      renderAll();
    }).catch(function (err) {
      $('trophyList').innerHTML = '<p class="empty-note">Could not load the trophy data (' + esc(err.message) + '). Serve the app/ folder over HTTP and try again.</p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

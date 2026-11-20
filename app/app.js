// Leonida Roadmap Planner: roadmap-first GTA 6 trophy tracker.
// Loads data/trophies.json (relative path only), keeps earned trophies in
// localStorage, and keeps the whole view in the URL hash so a link or a
// screenshot always shows the same state: view, filter, grade, spoiler, open.
const STORE_KEY = "leonida-roadmap-progress-v1";
const KIND_LABELS = { story: "Story", missable: "Missable", collectibles: "Collectibles", activities: "Activities", online: "Online" };
const STAGES = [
  { id: "stage-ch1", title: "Stage 1 — Chapter 1", note: "Opening mission Gone Fishing, then the chapter closes.", ids: [2, 3] },
  { id: "stage-ch2", title: "Stage 2 — Chapter 2", note: "Second chapter of the story.", ids: [4] },
  { id: "stage-ch3", title: "Stage 3 — Chapter 3", note: "Vice City opens up; third chapter.", ids: [5] },
  { id: "stage-ch4", title: "Stage 4 — Chapter 4", note: "Last full chapter before the finale.", ids: [6] },
  { id: "stage-finale", title: "Stage 5 — Finale + Platinum", note: "Final mission, then the platinum itself.", ids: [7, 1] },
  { id: "stage-missions", title: "Stage 6 — Story missions & character finales", note: "Named missions and the last mission for Andy, Kenton, Billy, Randy and Tyrone. Do them as they appear.", ids: [8, 9, 10, 11, 12, 13, 22, 23, 24, 26, 27] },
  { id: "stage-moments", title: "Stage 7 — One-chance moments", note: "14 flagged moments. Do each the first time it appears.", ids: [33, 34, 36, 37, 38, 39, 41, 44, 45, 47, 48, 49, 50, 51] },
  { id: "stage-cleanup", title: "Stage 8 — Cleanup: collectibles & completion", note: "Cards, WAiNK spots, meditation spots, areas, vehicles, garages, challenges, Scooter Bros registrations and 100% completion.", ids: [14, 28, 30, 31, 32, 35, 42, 54, 55] },
  { id: "stage-activities", title: "Stage 9 — Activities & open world", note: "Races, shooting range, drone races, stranger strands, robberies, money and the rest.", ids: [15, 16, 17, 18, 19, 20, 21, 25, 29, 40, 43, 46, 52, 53] },
];

const doc = await (await fetch("data/trophies.json")).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

const state = {
  view: "tracker",
  kind: "all",
  grade: "all",
  search: "",
  spoiler: false,
  openId: null,
  earned: new Set(),
};
try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
  if (Array.isArray(saved)) for (const id of saved) if (byId.has(id)) state.earned.add(id);
} catch { state.earned = new Set(); }

const $ = (id) => document.getElementById(id);
const listEl = $("trophyList");
const stagesEl = $("stages");

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
}

function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const view = params.get("view");
  if (view === "roadmap" || view === "tracker" || view === "missable") state.view = view;
  const filter = params.get("filter");
  if (filter && (filter === "all" || KIND_LABELS[filter])) state.kind = filter;
  const grade = params.get("grade");
  if (grade === "all" || grade === "platinum" || grade === "gold" || grade === "silver" || grade === "bronze") state.grade = grade;
  state.spoiler = params.get("spoiler") === "on";
  const open = Number(params.get("open"));
  if (byId.has(open)) state.openId = open;
  if (state.view === "missable") state.kind = "missable";
}

function writeHash() {
  const params = new URLSearchParams();
  params.set("view", state.view);
  params.set("filter", state.kind);
  if (state.grade !== "all") params.set("grade", state.grade);
  if (state.search) params.set("q", state.search);
  if (state.spoiler) params.set("spoiler", "on");
  if (state.openId) params.set("open", String(state.openId));
  history.replaceState(null, "", "#" + params.toString());
}

function isHiddenBySpoiler(t) {
  return state.spoiler && t.kind === "story" && !state.earned.has(t.id);
}

function visibleTrophies() {
  const q = state.search.trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.kind !== "all" && t.kind !== state.kind) return false;
    if (state.grade !== "all" && t.grade !== state.grade) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function gradeBadge(t) {
  const s = document.createElement("span");
  s.className = "badge " + t.grade;
  s.textContent = t.grade;
  return s;
}

function renderProgress() {
  const n = state.earned.size;
  $("earnedCount").textContent = String(n);
  $("barFill").style.width = (n / trophies.length * 100).toFixed(1) + "%";
  const plat = state.earned.has(1);
  $("progressNote").textContent = plat
    ? "Platinum earned — Vice Got a Price! You are a Leonida Legend."
    : "Platinum: Vice Got a Price! — earn the other 54.";
}

function renderRoadmap() {
  stagesEl.replaceChildren();
  for (const stage of STAGES) {
    const got = stage.ids.filter((id) => state.earned.has(id)).length;
    const li = document.createElement("li");
    li.className = "stage" + (got === stage.ids.length ? " done" : "");
    const h = document.createElement("h3");
    h.textContent = stage.title;
    const count = document.createElement("span");
    count.className = "stage-count";
    count.textContent = got + " / " + stage.ids.length;
    h.append(count);
    const p = document.createElement("p");
    p.textContent = stage.note;
    const bar = document.createElement("div");
    bar.className = "stage-bar";
    const fill = document.createElement("i");
    fill.style.width = (got / stage.ids.length * 100).toFixed(0) + "%";
    bar.append(fill);
    li.append(h, p, bar);
    li.addEventListener("click", () => {
      state.view = "tracker";
      state.kind = "all";
      state.openId = stage.ids.find((id) => !state.earned.has(id)) ?? stage.ids[0];
      syncControls();
      renderAll();
    });
    stagesEl.append(li);
  }
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement("li");
    li.className = "trophy-row" + (state.earned.has(t.id) ? " earned" : "") + (state.openId === t.id ? " selected" : "");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = state.earned.has(t.id);
    box.setAttribute("aria-label", "Earned: " + t.name);
    box.addEventListener("change", () => {
      if (box.checked) state.earned.add(t.id);
      else state.earned.delete(t.id);
      saveProgress();
      renderAll();
    });
    box.addEventListener("click", (e) => e.stopPropagation());
    const mid = document.createElement("div");
    const name = document.createElement("div");
    name.className = "trophy-name";
    if (isHiddenBySpoiler(t)) {
      name.textContent = "Hidden story trophy — earn it to reveal";
    } else {
      name.textContent = t.name;
      if (t.hidden) {
        const tag = document.createElement("span");
        tag.className = "hidden-tag";
        tag.textContent = " · hidden";
        name.append(tag);
      }
    }
    const desc = document.createElement("div");
    desc.className = "trophy-desc";
    desc.textContent = isHiddenBySpoiler(t) ? "Spoiler mode is on. This story trophy stays hidden until you earn it." : t.description;
    const meta = document.createElement("div");
    meta.className = "trophy-meta";
    meta.append(gradeBadge(t));
    const kind = document.createElement("span");
    kind.className = "badge kind";
    kind.textContent = KIND_LABELS[t.kind];
    meta.append(kind);
    if (t.missable && t.kind !== "missable") {
      const m = document.createElement("span");
      m.className = "badge missable";
      m.textContent = "Missable";
      meta.append(m);
    }
    if (typeof t.count === "number") {
      const c = document.createElement("span");
      c.className = "badge count";
      c.textContent = "Count: " + t.count.toLocaleString("en-US");
      meta.append(c);
    }
    mid.append(name, desc, meta);
    const right = document.createElement("div");
    right.textContent = state.earned.has(t.id) ? "Earned" : "";
    li.append(box, mid, right);
    li.addEventListener("click", () => {
      state.openId = t.id;
      renderAll();
    });
    listEl.append(li);
  }
  $("emptyNote").hidden = shown.length !== 0;
  $("shownCount").textContent = "Showing " + shown.length + " of " + trophies.length;
  $("listHeading").textContent = state.view === "missable" || state.kind === "missable"
    ? "Missable watch — " + trophies.filter((t) => t.missable).length + " flagged trophies"
    : "Checklist";
}

function renderDetail() {
  const body = $("detailBody");
  body.replaceChildren();
  const t = state.openId ? byId.get(state.openId) : null;
  if (!t) {
    const p = document.createElement("p");
    p.className = "detail-empty";
    p.textContent = "Select a trophy from the checklist to see its guide and its sources here.";
    body.append(p);
    return;
  }
  if (isHiddenBySpoiler(t)) {
    const p = document.createElement("p");
    p.className = "detail-empty";
    p.textContent = "Spoiler mode is on — this story trophy stays hidden until you earn it. Tick it off in the checklist to reveal its guide.";
    body.append(p);
    return;
  }
  const name = document.createElement("p");
  name.className = "detail-name";
  name.textContent = t.name;
  const desc = document.createElement("p");
  desc.className = "detail-desc";
  desc.textContent = t.description;
  const meta = document.createElement("div");
  meta.className = "trophy-meta";
  meta.append(gradeBadge(t));
  const kind = document.createElement("span");
  kind.className = "badge kind";
  kind.textContent = KIND_LABELS[t.kind];
  meta.append(kind);
  if (t.missable) {
    const m = document.createElement("span");
    m.className = "badge missable";
    m.textContent = "Missable — point of no return";
    meta.append(m);
  }
  if (typeof t.count === "number") {
    const c = document.createElement("span");
    c.className = "badge count";
    c.textContent = "PSN tracks: " + t.count.toLocaleString("en-US");
    meta.append(c);
  }
  const earned = document.createElement("p");
  earned.className = state.earned.has(t.id) ? "earned-line" : "";
  earned.textContent = state.earned.has(t.id) ? "Earned — ticked off in your tracker." : "Not earned yet.";
  const guideH = document.createElement("h3");
  guideH.textContent = "Guide";
  const guide = document.createElement("p");
  guide.textContent = t.guide;
  if (t.missable) {
    const warn = document.createElement("p");
    warn.className = "warn";
    warn.textContent = "Point-of-no-return warning: do this before its chapter or moment passes. If the moment is gone, a later replay may not re-award it.";
    body.append(name, desc, meta, earned, warn, guideH, guide);
  } else {
    body.append(name, desc, meta, earned, guideH, guide);
  }
  const sourceH = document.createElement("h3");
  sourceH.textContent = "Sources";
  const source = document.createElement("p");
  source.className = "source";
  source.textContent = t.source;
  body.append(sourceH, source);
}

function syncControls() {
  document.querySelectorAll(".view-btn").forEach((b) => b.classList.toggle("on", b.dataset.view === state.view));
  document.querySelectorAll("#kindPills .pill").forEach((b) => b.classList.toggle("on", b.dataset.kind === state.kind));
  $("grade").value = state.grade;
  $("search").value = state.search;
  $("spoiler").checked = state.spoiler;
  document.body.dataset.view = state.view;
}

function renderAll() {
  syncControls();
  renderProgress();
  renderRoadmap();
  renderList();
  renderDetail();
  writeHash();
}

document.querySelectorAll(".view-btn").forEach((b) => {
  b.addEventListener("click", () => {
    state.view = b.dataset.view;
    if (state.view === "missable") state.kind = "missable";
    renderAll();
  });
});
document.querySelectorAll("#kindPills .pill").forEach((b) => {
  b.addEventListener("click", () => {
    state.kind = b.dataset.kind;
    if (state.kind === "missable") state.view = "missable";
    else if (state.view === "missable") state.view = "tracker";
    renderAll();
  });
});
$("grade").addEventListener("change", (e) => { state.grade = e.target.value; renderAll(); });
$("search").addEventListener("input", (e) => { state.search = e.target.value; renderAll(); });
$("spoiler").addEventListener("change", (e) => { state.spoiler = e.target.checked; renderAll(); });
$("export").addEventListener("click", () => {
  const payload = { game: "Grand Theft Auto VI", guide: "Leonida Roadmap Planner", earned: [...state.earned].sort((a, b) => a - b) };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  a.download = "gta6-trophy-progress.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
$("import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error("no earned list");
    const next = new Set();
    for (const id of ids) if (byId.has(id)) next.add(id);
    state.earned = next;
    saveProgress();
    renderAll();
  } catch {
    alert("That file is not a Leonida Roadmap Planner progress export.");
  }
  e.target.value = "";
});
window.addEventListener("hashchange", () => { readHash(); renderAll(); });

readHash();
if (!state.openId) state.openId = 33;
renderAll();

/* ==========================================================================
   GERBRAS Dashboard — utilidades compartilhadas: dados, paleta, filtros
   ========================================================================== */

const CAT_COLORS = [
  "#2a78d6", // 1 azul
  "#eb6834", // 2 laranja
  "#1baf7a", // 3 água
  "#eda100", // 4 amarelo
  "#e87ba4", // 5 magenta
  "#008300", // 6 verde
  "#4a3aa7", // 7 violeta
  "#e34948", // 8 vermelho — reservado p/ bucket "Outras"
];
const OTHER_COLOR = CAT_COLORS[7];
const MAX_CATEGORICAL_INDIVIDUAL = 7; // top-N linhas de pesquisa ganham cor própria; resto -> "Outras"

const GREEN_SEQUENTIAL = ["#eaf7f0", "#c7ecda", "#96dab9", "#5fc192", "#2e9e6c", "#0f7a4d", "#0b5c3a"];

async function loadData() {
  const [researchers, edges, institutions, manaus] = await Promise.all([
    fetch("data/researchers.json").then((r) => r.json()),
    fetch("data/edges.json").then((r) => r.json()),
    fetch("data/institutions.json").then((r) => r.json()),
    fetch("data/manaus.json").then((r) => r.json()),
  ]);
  const institutionByName = new Map(institutions.map((i) => [i.instituicao, i]));
  const researcherById = new Map(researchers.map((r) => [r.id, r]));
  return { researchers, edges, institutions, manaus, institutionByName, researcherById };
}

/* ---------- estado de filtros, compartilhado via querystring ---------- */
function readFiltersFromURL() {
  const p = new URLSearchParams(location.search);
  return {
    grandeArea: p.get("grandeArea") || "",
    area: p.get("area") || "",
    ppgs: new Set((p.get("ppgs") || "").split(",").filter(Boolean)),
    linhas: new Set((p.get("linhas") || "").split("||").filter(Boolean)),
    professorId: p.get("professor") ? Number(p.get("professor")) : null,
    q: p.get("q") || "",
  };
}

function filtersToURL(filters) {
  const p = new URLSearchParams();
  if (filters.grandeArea) p.set("grandeArea", filters.grandeArea);
  if (filters.area) p.set("area", filters.area);
  if (filters.ppgs.size) p.set("ppgs", [...filters.ppgs].join(","));
  if (filters.linhas.size) p.set("linhas", [...filters.linhas].join("||"));
  if (filters.professorId) p.set("professor", filters.professorId);
  if (filters.q) p.set("q", filters.q);
  return p.toString();
}

function applyResearcherFilters(researchers, filters) {
  return researchers.filter((r) => {
    if (filters.grandeArea && !r.grande_areas.includes(filters.grandeArea)) return false;
    if (filters.area && !r.areas.includes(filters.area)) return false;
    if (filters.ppgs.size && !r.programas.some((p) => filters.ppgs.has(p))) return false;
    if (filters.professorId && r.id !== filters.professorId) return false;
    return true;
  });
}

function applyEdgeFilters(edges, filteredResearcherIds, filters) {
  return edges.filter((e) => {
    if (!filteredResearcherIds.has(e.researcher_id)) return false;
    if (filters.linhas.size && !filters.linhas.has(e.keyword)) return false;
    return true;
  });
}

/* ---------- agregações ---------- */
function countBy(arr, keyFn) {
  const m = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function topEntries(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/* categoriza as top-N linhas de pesquisa presentes num conjunto de edges,
   dobrando o resto em "Outras linhas de pesquisa" */
function buildLinhaColorScale(edgeSubset) {
  const counts = countBy(edgeSubset, (e) => e.keyword);
  const top = topEntries(counts, MAX_CATEGORICAL_INDIVIDUAL).map(([k]) => k);
  const scale = new Map();
  top.forEach((k, i) => scale.set(k, CAT_COLORS[i]));
  return { scale, top, otherLabel: "Outras linhas de pesquisa", otherColor: OTHER_COLOR };
}
function colorForLinha(keyword, colorInfo) {
  return colorInfo.scale.get(keyword) || colorInfo.otherColor;
}

/* ---------- tooltip global ---------- */
let tooltipEl = null;
function ensureTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement("div");
    tooltipEl.className = "viz-tooltip";
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}
function showTooltip(x, y, html) {
  const el = ensureTooltip();
  el.innerHTML = html;
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.classList.add("is-visible");
}
function moveTooltip(x, y) {
  if (tooltipEl) { tooltipEl.style.left = x + "px"; tooltipEl.style.top = y + "px"; }
}
function hideTooltip() {
  if (tooltipEl) tooltipEl.classList.remove("is-visible");
}

function fmt(n) { return n.toLocaleString("pt-BR"); }

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

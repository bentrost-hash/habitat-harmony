const animals = window.PZ_DATA.animals;
const byId = new Map(animals.map((a) => [a.id, a]));
const E = window.HabitatEngine;
let selected = null;
let habitat = [];
let welfareMode =
  localStorage.getItem("habitat-harmony-welfare-mode") || "strict";
const $ = (id) => document.getElementById(id);
const esc = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const tempText = (range) =>
  !range
    ? "Not available"
    : range.valid === false
      ? "No overlap"
      : `${range.min}–${range.max}°C`;
const packs = [...new Set(animals.map((a) => a.dlc))].sort();
let ownedPacks = new Set(
  JSON.parse(localStorage.getItem("habitat-harmony-packs") || "null") || packs,
);
const availableAnimals = () => animals.filter((a) => ownedPacks.has(a.dlc));
const maxFamilyLand = Math.max(...animals.map((a) => a.familyLandRequirement));
const savedPlans = () =>
  JSON.parse(localStorage.getItem("habitat-harmony-plans") || "[]");
const savePlans = (plans) =>
  localStorage.setItem("habitat-harmony-plans", JSON.stringify(plans));
const comparisonOptions = () => ({ relaxedFoliage: welfareMode === "relaxed" });

const ICON_PATHS = {
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.7 2.7L16.5 9"/>',
  alert:
    '<path d="M10.3 3.6 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  x: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
  thermometer:
    '<path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z"/><path d="M11 6v10"/>',
  leaf: '<path d="M20.8 3.2C11 3 5.2 7.5 5 14.3c-.1 3.5 2.6 6.3 6.1 6.5 6.8.3 10.6-7.5 9.7-17.6Z"/><path d="M4 21c3.1-5 7.5-8.7 13.2-11"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"/>',
  water:
    '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/><path d="M9 15.5c.7 1 1.6 1.5 3 1.5"/>',
};
const icon = (name, className = "") =>
  `<svg class="ui-icon ${className}" aria-hidden="true" viewBox="0 0 24 24">${ICON_PATHS[name]}</svg>`;
const levelIcon = (key) =>
  icon(
    {
      enrichment: "heart",
      excellent: "check",
      compatible: "check",
      compromise: "alert",
      incompatible: "x",
    }[key],
  );

function setupAutocomplete(
  input,
  menu,
  pick,
  exclude = () => false,
  { clearOnPick = true } = {},
) {
  const close = () => {
    menu.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
  };
  const show = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      close();
      return;
    }
    const found = availableAnimals()
      .filter((a) => !exclude(a) && a.name.toLowerCase().includes(q))
      .slice(0, 8);
    menu.innerHTML =
      found
        .map(
          (a) =>
            `<button type="button" role="option" data-id="${a.id}">${esc(a.name)}<small>${esc(a.dlc)}</small></button>`,
        )
        .join("") || `<div class="no-results">No species found</div>`;
    input.setAttribute("aria-expanded", "true");
  };
  input.addEventListener("input", show);
  input.addEventListener("focus", show);
  menu.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-id]");
    if (!button) return;
    pick(byId.get(button.dataset.id));
    if (clearOnPick) input.value = "";
    close();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown" && menu.querySelector("button")) {
      e.preventDefault();
      menu.querySelector("button").focus();
    }
    if (e.key === "Enter" && menu.querySelector("button")) {
      e.preventDefault();
      menu.querySelector("button").click();
    }
  });
  menu.addEventListener("keydown", (e) => {
    const options = [...menu.querySelectorAll("button")];
    const current = options.indexOf(document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      options[(current + 1) % options.length]?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      options[(current - 1 + options.length) % options.length]?.focus();
    }
    if (e.key === "Escape") {
      close();
      input.focus();
    }
  });
}

function reasonLine(result) {
  if (result.enrichment)
    return "Official enrichment partner • " + tempText(result.temp);
  if (result.relaxedUpgrade)
    return (
      "Excellent with Sandbox foliage preferences relaxed • " +
      tempText(result.temp)
    );
  if (result.score === 0)
    return result.temp && !result.temp.valid
      ? "No temperature overlap"
      : "Known safety or full-welfare conflict";
  const parts = [];
  if (result.sharedBiomes.length)
    parts.push(result.sharedBiomes.slice(0, 2).join(", "));
  parts.push(tempText(result.temp));
  return parts.join(" • ");
}

function partnerCard(result) {
  const other = result.a.id === selected.id ? result.b : result.a;
  return `<button type="button" class="partner" data-animal="${other.id}"><span class="partner-top"><strong>${esc(other.name)}</strong><span class="badge ${result.level.key}">${levelIcon(result.level.key)}${result.level.label}</span></span><span class="partner-reason">${esc(reasonLine(result))}</span></button>`;
}

function chooseAnimal(animal) {
  selected = animal;
  const results = availableAnimals()
    .filter((a) => a.id !== animal.id)
    .map((a) => E.compare(animal, a, comparisonOptions()))
    .sort((a, b) => b.score - a.score || a.b.name.localeCompare(b.b.name));
  const sections = [4, 3, 2, 1, 0]
    .map((score) => {
      const group = results.filter((r) => r.score === score);
      if (!group.length) return "";
      const initial = score === 4 || score <= 1 ? group : group.slice(0, 12);
      const remaining = group.slice(initial.length);
      const more = remaining.length
        ? `<details class="more-results"><summary>Show ${remaining.length} more ${E.LEVELS[score].label.toLowerCase()} matches</summary><div class="partner-list">${remaining.map(partnerCard).join("")}</div></details>`
        : "";
      const content = `<div class="partner-list">${initial.map(partnerCard).join("")}</div>${more}`;
      const heading = `${levelIcon(E.LEVELS[score].key)}${E.LEVELS[score].label}<span>${group.length}</span>`;
      return score <= 1
        ? `<details class="result-section"><summary class="section-title">${heading}</summary>${content}</details>`
        : `<section class="result-section"><h3 class="section-title">${heading}</h3>${content}</section>`;
    })
    .join("");
  const excellentMatches = results.filter((r) => r.score >= 3).length;
  $("discoverResults").innerHTML =
    `<div class="animal-header"><div class="animal-heading"><h2>${esc(animal.name)}</h2><p class="meta">${esc(animal.dlc)} · ${esc(animal.continents.join(", "))}</p><p class="mode-note">${welfareMode === "relaxed" ? "Relaxed foliage mode" : "Full-welfare mode"}</p></div>${habitatSnapshot(animal, excellentMatches)}</div>${sections}`;
  $("emptyState").style.display = "none";
  setTab("discover");
}

function selectOptions(placeholder) {
  return (
    `<option value="">${placeholder}</option>` +
    availableAnimals()
      .map((a) => `<option value="${a.id}">${esc(a.name)}</option>`)
      .join("")
  );
}

function bar(value, label) {
  return `<span class="profile-bar" role="img" aria-label="${esc(label)}" style="--bar-value:${Math.max(0, Math.min(100, value))}%"><span></span></span>`;
}

function temperatureBar(range) {
  const start = Math.max(0, Math.min(100, (range.min / 50) * 100));
  const end = Math.max(start, Math.min(100, (range.max / 50) * 100));
  return `<span class="profile-bar temperature-bar" role="img" aria-label="Comfortable temperature ${tempText(range)}"><span style="--range-start:${start}%;--range-width:${end - start}%"></span></span>`;
}

function profileRow(label, value, visual) {
  return `<div class="profile-row"><div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>${visual}</div>`;
}

function animalProfile(animal, position) {
  const waterLevel = animal.water.deepDiver ? 100 : animal.water.canSwim ? 58 : 0;
  const waterText = animal.water.deepDiver
    ? "Deep water required"
    : animal.water.canSwim
      ? "Swimming access"
      : "No water requirement";
  const climbingText = animal.climbing ? "Climbing required" : "Not required";
  const land = Math.round(animal.familyLandRequirement).toLocaleString();
  return `<section class="animal-profile"><header class="profile-head"><div><h3>${esc(animal.name)}</h3><p>${esc(position)} · ${esc(animal.dlc)}</p></div><span class="profile-origin">${esc(animal.continents.join(", "))}</span></header><div class="profile-biomes"><span>Preferred biomes</span><div>${animal.biomes.map((biome) => `<em>${esc(biome)}</em>`).join("")}</div></div><div class="profile-rows">${profileRow("Temperature", tempText(animal.temperature), temperatureBar(animal.temperature))}${profileRow("Family habitat baseline", `${land} m²`, bar((animal.familyLandRequirement / maxFamilyLand) * 100, `Relative family habitat baseline: ${land} square metres`))}${profileRow("Water", waterText, bar(waterLevel, waterText))}${profileRow("Climbing", climbingText, bar(animal.climbing ? 100 : 0, climbingText))}</div></section>`;
}

function habitatSnapshot(animal, excellentMatches) {
  const waterLevel = animal.water.deepDiver ? 100 : animal.water.canSwim ? 58 : 0;
  const waterText = animal.water.deepDiver
    ? "Deep water required"
    : animal.water.canSwim
      ? "Swimming access"
      : "No water requirement";
  const climbingText = animal.climbing ? "Climbing required" : "Not required";
  const land = Math.round(animal.familyLandRequirement).toLocaleString();
  return `<aside class="habitat-snapshot" aria-label="${esc(animal.name)} habitat snapshot"><div class="snapshot-heading"><div><h3>Habitat snapshot</h3><p>Preferred habitat and care needs</p></div><span class="match-count"><strong>${excellentMatches}</strong><span>excellent matches</span></span></div><div class="snapshot-range"><span>Ideal plant range</span><div class="snapshot-range-row"><small>Continents</small><div>${animal.continents.map((continent) => `<em>${esc(continent)}</em>`).join("")}</div></div><div class="snapshot-range-row"><small>Biomes</small><div>${animal.biomes.map((biome) => `<em>${esc(biome)}</em>`).join("")}</div></div></div><div class="profile-rows snapshot-bars">${profileRow("Temperature", tempText(animal.temperature), temperatureBar(animal.temperature))}${profileRow("Family habitat baseline", `${land} m²`, bar((animal.familyLandRequirement / maxFamilyLand) * 100, `Relative family habitat baseline: ${land} square metres`))}${profileRow("Water", waterText, bar(waterLevel, waterText))}${profileRow("Climbing", climbingText, bar(animal.climbing ? 100 : 0, climbingText))}</div></aside>`;
}

function setComparisonAnimal(position, animal) {
  $(`compare${position}`).value = animal.id;
  $(`compareSearch${position}`).value = animal.name;
  renderComparison();
}

function renderComparison() {
  const a = byId.get($("compareA").value),
    b = byId.get($("compareB").value);
  const profiles = $("comparisonProfiles");
  if (!a || !b) {
    profiles.innerHTML = "";
    $("comparisonResult").className = "empty";
    $("comparisonResult").innerHTML =
      "<h2>Compare any two species</h2><p>Choose both animals to see a transparent compatibility verdict.</p>";
    return;
  }
  if (a.id === b.id) {
    profiles.innerHTML = "";
    $("comparisonResult").className = "empty compact-empty";
    $("comparisonResult").innerHTML =
      "<h2>Choose two different species</h2><p>A species is always compatible with itself, so pick another animal for a useful comparison.</p>";
    return;
  }
  const r = E.compare(a, b, comparisonOptions());
  profiles.innerHTML = `<div class="profile-grid">${animalProfile(a, "Animal A")}${animalProfile(b, "Animal B")}</div><p class="profile-note">Exact soil, grass, and rock terrain percentages are not in the source data. These bars are relative habitat-planning cues, not invented terrain ratios.</p>`;
  $("comparisonResult").className = `verdict verdict-${r.level.key}`;
  $("comparisonResult").innerHTML =
    `<span class="badge ${r.level.key}">${levelIcon(r.level.key)}${r.level.label}</span><h2>${r.score === 0 ? "Not recommended together" : r.score === 1 ? "Works with compromises" : "Compatible habitat partners"}</h2><p class="verdict-summary">${esc(r.summary)}</p><div class="reason-grid">
    <div class="reason">${icon("heart")}<span><small>Interspecies enrichment</small><strong>${r.enrichment ? "Yes" : "No"}</strong></span></div>
    <div class="reason">${icon(r.score === 0 ? "x" : "check")}<span><small>Safety / aggression</small><strong>${r.score === 0 ? "Conflict flagged" : "No conflict flagged"}</strong></span></div>
    <div class="reason">${icon("thermometer")}<span><small>Temperature overlap</small><strong>${tempText(r.temp)}</strong></span></div>
    <div class="reason">${icon("leaf")}<span><small>Shared biomes</small><strong>${r.sharedBiomes.length ? esc(r.sharedBiomes.join(", ")) : "No shared biome"}</strong></span></div>
    <div class="reason">${icon("globe")}<span><small>Shared origin</small><strong>${r.sharedContinents.length ? esc(r.sharedContinents.join(", ")) : "Different regions"}</strong></span></div>
    <div class="reason">${icon("water")}<span><small>Water planning</small><strong>${r.deepWater ? "Deep water needed" : "No deep-diving need"}</strong></span></div>
  </div><p class="meta">Pair rating: ${r.sourceBacked ? "reviewed community matrix" : "derived fallback"}.${r.relaxedUpgrade ? " Source rating 2 promoted because foliage-origin preferences are relaxed." : ""} Exact terrain percentages are not claimed where the final source workbook does not expose them.</p>`;
}

function addToHabitat(animal) {
  if (!habitat.some((a) => a.id === animal.id)) habitat.push(animal);
  renderBuilder();
}
function renderBuilder() {
  $("builderCount").textContent = habitat.length ? habitat.length : "";
  $("builderChips").innerHTML = habitat
    .map(
      (a) =>
        `<span class="chip">${esc(a.name)}<button aria-label="Remove ${esc(a.name)}" data-remove="${a.id}">×</button></span>`,
    )
    .join("");
  $("savePlan").disabled = habitat.length < 2;
  $("sharePlan").disabled = habitat.length < 2;
  const target = $("builderResult");
  if (habitat.length < 2) {
    target.className = "empty";
    target.innerHTML =
      "<h2>Add two or more animals</h2><p>We’ll calculate the group verdict and the habitat requirements they can share.</p>";
    renderNextSpecies();
    renderSavedPlans();
    return;
  }
  const g = E.buildGroup(habitat, comparisonOptions());
  const issues = [...g.conflicts, ...g.compromises]
    .map(
      (p) =>
        `<div>${levelIcon(p.level.key)}<span><strong>${esc(p.a.name)} + ${esc(p.b.name)}</strong><small>${esc(p.level.label)}</small></span></div>`,
    )
    .join("");
  target.className = `verdict verdict-${g.level.key}`;
  target.innerHTML = `<span class="badge ${g.level.key}">${levelIcon(g.level.key)}${g.level.label}</span><h2>Overall habitat compatibility</h2><p class="verdict-summary">Based on all ${g.pairs.length} pairwise relationships — the most restrictive pair sets the verdict.</p>${issues ? `<div class="conflicts">${issues}</div>` : ""}<div class="intersection"><h3>Shared habitat requirements</h3><dl><dt>Temperature</dt><dd>${tempText(g.temperature)}</dd><dt>Biomes</dt><dd>${g.sharedBiomes.length ? esc(g.sharedBiomes.join(", ")) : "No biome shared by every species"}</dd><dt>Origin</dt><dd>${g.sharedContinents.length ? esc(g.sharedContinents.join(", ")) : "Mixed regions"}</dd><dt>Land baseline</dt><dd>At least ${Math.round(g.minimumLandBaseline).toLocaleString()} m² (largest family-group minimum; add space for larger populations)</dd><dt>Climbing</dt><dd>${g.climbing ? "Required by at least one species" : "Not required"}</dd><dt>Deep water</dt><dd>${g.deepWater ? "Required by at least one species" : "Not required"}</dd></dl></div>`;
  renderNextSpecies();
  renderSavedPlans();
}

function renderNextSpecies() {
  if (!habitat.length) {
    $("nextSpecies").innerHTML = "";
    return;
  }
  const ranked = availableAnimals()
    .filter((candidate) => !habitat.some((a) => a.id === candidate.id))
    .map((candidate) => {
      const comparisons = habitat.map((a) =>
        E.compare(a, candidate, comparisonOptions()),
      );
      return {
        candidate,
        worst: Math.min(...comparisons.map((r) => r.score)),
        average:
          comparisons.reduce((sum, r) => sum + r.score, 0) / comparisons.length,
        enrichment: comparisons.filter((r) => r.enrichment).length,
      };
    })
    .filter((item) => item.worst >= 2)
    .sort(
      (a, b) =>
        b.worst - a.worst ||
        b.enrichment - a.enrichment ||
        b.average - a.average ||
        a.candidate.name.localeCompare(b.candidate.name),
    )
    .slice(0, 8);
  $("nextSpecies").innerHTML = ranked.length
    ? `<section class="next-species"><h3 class="section-title">Best next species for the whole group <span>${ranked.length}</span></h3><div class="next-species-grid">${ranked.map((item) => `<button type="button" data-suggest-add="${item.candidate.id}"><span><strong>${esc(item.candidate.name)}</strong><small>Compatible with all ${habitat.length} selected species${item.enrichment ? ` · ${item.enrichment} enrichment match${item.enrichment === 1 ? "" : "es"}` : ""}</small></span><span class="badge ${E.LEVELS[item.worst].key}" aria-label="${E.LEVELS[item.worst].label}">${levelIcon(E.LEVELS[item.worst].key)}</span></button>`).join("")}</div></section>`
    : "";
}

function renderSavedPlans() {
  const plans = savedPlans();
  $("savedPlans").innerHTML = plans.length
    ? `<h3 class="section-title">Saved on this device</h3>${plans.map((plan) => `<article class="saved-plan"><button class="load-plan" data-load="${plan.id}"><strong>${esc(plan.name)}</strong><small>${plan.species.length} species · saved ${new Date(plan.createdAt).toLocaleDateString()}</small></button><button class="delete-plan" aria-label="Delete ${esc(plan.name)}" data-delete="${plan.id}">×</button></article>`).join("")}`
    : "";
}

function setPlanMessage(message, tone = "success") {
  $("planMessage").textContent = message;
  $("planMessage").dataset.tone = tone;
  setTimeout(() => {
    if ($("planMessage").textContent === message)
      $("planMessage").textContent = "";
  }, 2800);
}
function persistCurrentPlan() {
  if (habitat.length < 2)
    return setPlanMessage("Add at least two animals first.", "warning");
  const name =
    $("planName").value.trim() || `Habitat plan ${savedPlans().length + 1}`;
  const plans = savedPlans();
  plans.unshift({
    id: crypto.randomUUID(),
    name,
    species: habitat.map((a) => a.id),
    welfareMode,
    createdAt: new Date().toISOString(),
  });
  savePlans(plans);
  $("planName").value = "";
  renderSavedPlans();
  setPlanMessage("Saved on this device.");
}
async function copyShareLink() {
  if (habitat.length < 2)
    return setPlanMessage("Add at least two animals first.", "warning");
  const url = new URL(location.href);
  url.searchParams.set("habitat", habitat.map((a) => a.id).join(","));
  url.searchParams.set("mode", welfareMode);
  try {
    await navigator.clipboard.writeText(url.toString());
    setPlanMessage("Share link copied.");
  } catch {
    setPlanMessage("Copy the URL from your browser address bar.", "warning");
  }
}
function renderPackSettings() {
  $("packList").innerHTML = packs
    .map(
      (pack) =>
        `<label><input type="checkbox" value="${esc(pack)}" ${ownedPacks.has(pack) ? "checked" : ""}>${esc(pack)}</label>`,
    )
    .join("");
  const modeInput = document.querySelector(
    `input[name="welfareMode"][value="${welfareMode}"]`,
  );
  if (modeInput) modeInput.checked = true;
}
function updateAvailability() {
  localStorage.setItem(
    "habitat-harmony-packs",
    JSON.stringify([...ownedPacks]),
  );
  $("compareA").innerHTML = selectOptions("Choose animal A");
  $("compareB").innerHTML = selectOptions("Choose animal B");
  $("compareSearchA").value = "";
  $("compareSearchB").value = "";
  $("settingsButton").querySelector(".settings-label").textContent =
    welfareMode === "relaxed" ? "Relaxed plants" : "Full welfare";
  $("settingsButton").setAttribute(
    "aria-label",
    `Planning settings, ${welfareMode === "relaxed" ? "relaxed foliage" : "full welfare"} mode`,
  );
  if (selected) chooseAnimal(selected);
  renderComparison();
  renderBuilder();
}

function setTab(name) {
  document
    .querySelectorAll(".tab,.panel")
    .forEach((el) =>
      el.classList.toggle("active", el.dataset.tab === name || el.id === name),
    );
}
document
  .querySelectorAll(".tab")
  .forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
document
  .querySelectorAll("[data-pick]")
  .forEach((b) =>
    b.addEventListener("click", () => chooseAnimal(byId.get(b.dataset.pick))),
  );
setupAutocomplete($("animalSearch"), $("suggestions"), chooseAnimal);
setupAutocomplete(
  $("builderSearch"),
  $("builderSuggestions"),
  addToHabitat,
  (a) => habitat.some((x) => x.id === a.id),
);
setupAutocomplete(
  $("compareSearchA"),
  $("compareSuggestionsA"),
  (animal) => setComparisonAnimal("A", animal),
  () => false,
  { clearOnPick: false },
);
setupAutocomplete(
  $("compareSearchB"),
  $("compareSuggestionsB"),
  (animal) => setComparisonAnimal("B", animal),
  () => false,
  { clearOnPick: false },
);
$("compareA").innerHTML = selectOptions("Choose animal A");
$("compareB").innerHTML = selectOptions("Choose animal B");
$("compareA").addEventListener("change", (event) => {
  $("compareSearchA").value = byId.get(event.target.value)?.name || "";
  renderComparison();
});
$("compareB").addEventListener("change", (event) => {
  $("compareSearchB").value = byId.get(event.target.value)?.name || "";
  renderComparison();
});
$("builderChips").addEventListener("click", (e) => {
  const id = e.target.dataset.remove;
  if (id) {
    habitat = habitat.filter((a) => a.id !== id);
    renderBuilder();
  }
});
document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-animal]");
  if (card) chooseAnimal(byId.get(card.dataset.animal));
});
$("settingsButton").addEventListener("click", () => {
  renderPackSettings();
  $("settingsDialog").showModal();
});
$("packList").addEventListener("change", (e) => {
  e.target.checked
    ? ownedPacks.add(e.target.value)
    : ownedPacks.delete(e.target.value);
  updateAvailability();
});
document.querySelectorAll('input[name="welfareMode"]').forEach((input) =>
  input.addEventListener("change", (e) => {
    welfareMode = e.target.value;
    localStorage.setItem("habitat-harmony-welfare-mode", welfareMode);
    updateAvailability();
  }),
);
$("selectAllPacks").addEventListener("click", () => {
  ownedPacks = new Set(packs);
  renderPackSettings();
  updateAvailability();
});
$("clearPacks").addEventListener("click", () => {
  ownedPacks = new Set();
  renderPackSettings();
  updateAvailability();
});
$("savePlan").addEventListener("click", persistCurrentPlan);
$("sharePlan").addEventListener("click", copyShareLink);
$("savedPlans").addEventListener("click", (e) => {
  const button = e.target.closest("[data-load],[data-delete]");
  if (!button) return;
  const plan = savedPlans().find(
    (p) => p.id === button.dataset.load || p.id === button.dataset.delete,
  );
  if (!plan) return;
  if (button.dataset.delete) {
    savePlans(savedPlans().filter((p) => p.id !== plan.id));
    renderSavedPlans();
    return;
  }
  habitat = plan.species.map((id) => byId.get(id)).filter(Boolean);
  welfareMode = plan.welfareMode || "strict";
  localStorage.setItem("habitat-harmony-welfare-mode", welfareMode);
  updateAvailability();
  setTab("builder");
});
$("nextSpecies").addEventListener("click", (e) => {
  const button = e.target.closest("[data-suggest-add]");
  if (button) addToHabitat(byId.get(button.dataset.suggestAdd));
});
const linkedHabitat = new URLSearchParams(location.search).get("habitat");
const linkedMode = new URLSearchParams(location.search).get("mode");
if (["strict", "relaxed"].includes(linkedMode)) welfareMode = linkedMode;
updateAvailability();
if (linkedHabitat) {
  habitat = linkedHabitat
    .split(",")
    .map((id) => byId.get(id))
    .filter(Boolean);
  if (habitat.length) {
    renderBuilder();
    setTab("builder");
  }
}

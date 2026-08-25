(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HabitatEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  const LEVELS = {
    0: { key: "incompatible", label: "Incompatible", icon: "❌" },
    1: { key: "compromise", label: "Possible with compromises", icon: "⚠️" },
    2: { key: "compatible", label: "Compatible", icon: "👍" },
    3: { key: "excellent", label: "Excellent", icon: "✅" },
    4: { key: "enrichment", label: "Interspecies enrichment", icon: "❤️" }
  };

  const intersectRange = (ranges) => {
    if (!ranges.length || ranges.some(r => !r)) return null;
    const min = Math.max(...ranges.map(r => r.min));
    const max = Math.min(...ranges.map(r => r.max));
    return { min, max, valid: min <= max };
  };
  const common = (groups) => groups.length
    ? groups.reduce((all, group) => all.filter(x => group.includes(x)), [...groups[0]]) : [];

  function fallbackScore(a, b) {
    if (a.aggressive || b.aggressive) return 0;
    const temp = intersectRange([a.temperature, b.temperature]);
    if (!temp || !temp.valid) return 0;
    const sharedBiomes = common([a.biomes, b.biomes]);
    const sharedContinents = common([a.continents, b.continents]);
    if (sharedBiomes.length && sharedContinents.length) return 3;
    if (sharedBiomes.length) return 2;
    return 1;
  }

  function compare(a, b, options = {}) {
    if (!a || !b) return null;
    const enrichment = a.interspeciesEnrichment.includes(b.id) || b.interspeciesEnrichment.includes(a.id);
    let score = a.compatibility[b.id];
    const sourceBacked = Number.isInteger(score);
    if (!sourceBacked) score = fallbackScore(a, b);
    const originalScore = score;
    const relaxedUpgrade = Boolean(options.relaxedFoliage && score === 2);
    if (relaxedUpgrade) score = 3;
    const temp = intersectRange([a.temperature, b.temperature]);
    const sharedBiomes = common([a.biomes, b.biomes]);
    const sharedContinents = common([a.continents, b.continents]);
    return {
      a, b, score, originalScore, relaxedUpgrade, level: LEVELS[score], enrichment, sourceBacked, temp,
      sharedBiomes, sharedContinents,
      climbing: a.climbing || b.climbing,
      deepWater: a.water.deepDiver || b.water.deepDiver,
      walkthroughSafe: a.walkthroughSafe && b.walkthroughSafe,
      summary: score === 0 ? "The reviewed compatibility matrix marks this pairing unsafe or unable to share full-welfare conditions."
        : score === 1 ? "Safe only with meaningful welfare or habitat compromises."
        : score === 2 ? "A workable shared habitat, with some planning around their differing needs."
        : relaxedUpgrade ? "A peaceful pairing promoted to excellent because Sandbox foliage-origin preferences are relaxed."
        : score === 3 ? "Strong welfare overlap and no known safety conflict."
        : "An officially recognized enrichment pairing with strong shared-habitat potential."
    };
  }

  function buildGroup(animals, options = {}) {
    const pairs = [];
    for (let i = 0; i < animals.length; i++)
      for (let j = i + 1; j < animals.length; j++) pairs.push(compare(animals[i], animals[j], options));
    const worst = pairs.length ? Math.min(...pairs.map(p => p.score)) : null;
    const verdictScore = worst === 4 ? 3 : worst;
    return {
      animals, pairs, score: verdictScore, level: verdictScore === null ? null : LEVELS[verdictScore],
      conflicts: pairs.filter(p => p.score === 0), compromises: pairs.filter(p => p.score === 1),
      temperature: intersectRange(animals.map(a => a.temperature)),
      sharedBiomes: common(animals.map(a => a.biomes)),
      sharedContinents: common(animals.map(a => a.continents)),
      minimumLandBaseline: animals.length ? Math.max(...animals.map(a => a.familyLandRequirement || a.landRequirement || 0)) : 0,
      minimumBarrierHeight: animals.length ? Math.max(...animals.map(a => a.barrier.height)) : 0,
      minimumBarrierGrade: animals.length ? Math.max(...animals.map(a => a.barrier.grade)) : 0,
      climbing: animals.some(a => a.climbing),
      swimming: animals.some(a => a.water.canSwim), deepWater: animals.some(a => a.water.deepDiver),
      walkthroughSafe: animals.every(a => a.walkthroughSafe)
    };
  }

  return { LEVELS, compare, buildGroup, intersectRange, common };
});

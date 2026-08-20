const assert = require("node:assert/strict");
const data = require("../data/animals.json");
const engine = require("../engine.js");
const byId = new Map(data.animals.map(a => [a.id, a]));
const pair = (a,b) => engine.compare(byId.get(a),byId.get(b));

assert.equal(data.animals.length, 167, "current normalized habitat roster");
assert.equal(pair("reticulated_giraffe","plains_zebra").enrichment, true, "known enrichment pair");
assert.equal(pair("reticulated_giraffe","african_buffalo").score, 4, "known excellent/enrichment pair");
assert.equal(pair("bengal_tiger","plains_zebra").score, 0, "predator/prey incompatibility");
assert.equal(pair("indian_rhinoceros","southern_white_rhinoceros").score, 0, "known special conflict captured by matrix");

const compatiblePair = data.animals.flatMap(a => Object.entries(a.compatibility).map(([id,score]) => [a.id,id,score])).find(([, , score]) => score === 2);
const strictCompatible = engine.compare(byId.get(compatiblePair[0]), byId.get(compatiblePair[1]));
const relaxedCompatible = engine.compare(byId.get(compatiblePair[0]), byId.get(compatiblePair[1]), {relaxedFoliage:true});
assert.equal(strictCompatible.score, 2, "strict mode preserves source rating");
assert.equal(relaxedCompatible.score, 3, "relaxed foliage mode promotes peaceful regional mismatches");
assert.equal(relaxedCompatible.originalScore, 2, "source rating remains transparent");

const savannah = engine.buildGroup([
  byId.get("reticulated_giraffe"), byId.get("plains_zebra"), byId.get("african_buffalo")
]);
assert.equal(savannah.conflicts.length, 0, "all pairs in compatible group pass");
assert.equal(savannah.temperature.valid, true, "group temperature intersects");

const unsafe = engine.buildGroup([
  byId.get("reticulated_giraffe"), byId.get("plains_zebra"), byId.get("bengal_tiger")
]);
assert.ok(unsafe.conflicts.length >= 1, "multi-species builder exposes non-anchor conflict");
assert.equal(unsafe.score, 0);

assert.deepEqual(engine.intersectRange([{min:10,max:30},{min:15,max:22},{min:12,max:25}]), {min:15,max:22,valid:true});
assert.deepEqual(engine.intersectRange([{min:-10,max:0},{min:5,max:20}]), {min:5,max:0,valid:false});
console.log("Engine tests passed: enrichment, safe pairs, conflicts, groups, intersections");

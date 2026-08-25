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
assert.equal(savannah.minimumBarrierHeight, 2, "group uses the highest barrier height");
assert.equal(savannah.minimumBarrierGrade, 3, "group uses the highest barrier grade");
assert.equal(savannah.swimming, true, "group reports swimming access when a species can swim");
assert.equal(savannah.deepWater, false, "group distinguishes swimming access from deep-water needs");
assert.equal(savannah.walkthroughSafe, false, "group requires every species to be walkthrough-safe");

const populated = engine.buildGroup([
  byId.get("reticulated_giraffe"), byId.get("plains_zebra")
], {population: {
  reticulated_giraffe: {adults: 3, young: 2},
  plains_zebra: {adults: 4, young: 1}
}});
assert.equal(populated.totalAdults, 7, "population planner totals adults");
assert.equal(populated.totalYoung, 3, "population planner tracks young");
assert.equal(populated.countAdjustedLand, 5958, "adult land estimate uses selected counts");
assert.equal(populated.populationWarnings.length, 0, "in-range adult groups pass");

const outOfRange = engine.buildGroup([
  byId.get("reticulated_giraffe"), byId.get("plains_zebra")
], {population: {
  reticulated_giraffe: {adults: 13, young: 0},
  plains_zebra: {adults: 4, young: 0}
}});
assert.equal(outOfRange.populationWarnings.length, 1, "out-of-range adult groups are flagged");
const unsafe = engine.buildGroup([
  byId.get("reticulated_giraffe"), byId.get("plains_zebra"), byId.get("bengal_tiger")
]);
assert.ok(unsafe.conflicts.length >= 1, "multi-species builder exposes non-anchor conflict");
assert.equal(unsafe.score, 0);

assert.deepEqual(engine.intersectRange([{min:10,max:30},{min:15,max:22},{min:12,max:25}]), {min:15,max:22,valid:true});
assert.deepEqual(engine.intersectRange([{min:-10,max:0},{min:5,max:20}]), {min:5,max:0,valid:false});
console.log("Engine tests passed: enrichment, safe pairs, conflicts, groups, intersections");

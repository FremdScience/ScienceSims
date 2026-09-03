"use strict";

const assert = require("node:assert/strict");
const model = require("../plant-model.js");

function final(config) {
  return model.measurementsForDay(config, 50);
}

assert.equal(model.simulatePot({ seed: "bean", water: 60, lights: 3, soil: "plain" }).length, 51);

const guidedA = final({ seed: "bean", water: 60, lights: 3, soil: "plain" });
const guidedB = final({ seed: "bean", water: 60, lights: 1, soil: "plain" });
const guidedC = final({ seed: "bean", water: 60, lights: 0, soil: "plain" });

assert.ok(guidedA.height > guidedB.height, "Three-light bean should be taller than one-light bean on day 50.");
assert.ok(guidedB.height > guidedC.height, "One-light bean should be taller than zero-light bean on day 50.");
assert.ok(guidedA.mass > guidedB.mass, "Three-light bean should have more mass than one-light bean on day 50.");
assert.ok(guidedB.mass > guidedC.mass, "One-light bean should have more mass than zero-light bean on day 50.");
assert.match(guidedC.appearance, /pale|wilted/i);

const dry = final({ seed: "bean", water: 0, lights: 3, soil: "plain" });
assert.deepEqual({ height: dry.height, mass: dry.mass }, { height: 0, mass: 0 });
assert.match(dry.appearance, /dry/i);

const optimalWater = final({ seed: "bean", water: 60, lights: 3, soil: "plain" });
const overwatered = final({ seed: "bean", water: 120, lights: 3, soil: "plain" });
assert.ok(optimalWater.mass > overwatered.mass, "Waterlogging should reduce final bean mass.");

const plain = final({ seed: "tomato", water: 70, lights: 3, soil: "plain" });
const compost = final({ seed: "tomato", water: 70, lights: 3, soil: "compost" });
assert.ok(compost.mass > plain.mass, "Compost should increase mass under otherwise favorable conditions.");

const sameA = model.simulatePot({ seed: "turnip", water: 50, lights: 2, soil: "fertilizer" });
const sameB = model.simulatePot({ seed: "turnip", water: 50, lights: 2, soil: "fertilizer" });
assert.deepEqual(sameA, sameB, "The classroom model should be deterministic.");

assert.equal(final({ seed: "", water: 60, lights: 3, soil: "plain" }).appearance, "Empty pot");
assert.equal(model.describeSetup({ seed: "bean", water: 60, lights: 1, soil: "plain" }), "Bean; 60 mL water/day; 1 light; plain soil");

console.log("Plant model tests passed.");
console.log(`Guided experiment day 50: A ${guidedA.height} cm/${guidedA.mass} g; B ${guidedB.height} cm/${guidedB.mass} g; C ${guidedC.height} cm/${guidedC.mass} g.`);

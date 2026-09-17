"use strict";

const assert = require("node:assert/strict");
const model = require("../energy-model.js");

assert.equal(model.WATER_SPECIFIC_HEAT, 4.184);
assert.equal(model.SPECIFIC_HEATS.water, 4.184);
for (const [material, label] of Object.entries(model.SPECIFIC_HEAT_LABELS)) {
  assert.equal(Number(label), model.SPECIFIC_HEATS[material], `${material} specific-heat label must match its calculation constant.`);
}

const water2090 = model.heatSubstance({ material: "water", mass: 100, energy: 2090 });
const water4180 = model.heatSubstance({ material: "water", mass: 100, energy: 4180 });
const water6270 = model.heatSubstance({ material: "water", mass: 100, energy: 6270 });
assert.equal(water2090.roundedFinalTemperature, 25);
assert.equal(water4180.roundedFinalTemperature, 30);
assert.equal(water6270.roundedFinalTemperature, 35);
assert.ok(Math.abs((water4180.finalTemperature - 20) - 2 * (water2090.finalTemperature - 20)) < 1e-12);

const aluminum50 = model.heatSubstance({ material: "aluminum", mass: 50, energy: 4180 });
const aluminum100 = model.heatSubstance({ material: "aluminum", mass: 100, energy: 4180 });
const aluminum200 = model.heatSubstance({ material: "aluminum", mass: 200, energy: 4180 });
assert.ok(aluminum50.finalTemperature > aluminum100.finalTemperature);
assert.ok(aluminum100.finalTemperature > aluminum200.finalTemperature);

const copper = model.heatSubstance({ material: "copper", mass: 100, energy: 4180 });
const granite = model.heatSubstance({ material: "granite", mass: 100, energy: 4180 });
assert.notEqual(copper.roundedFinalTemperature, granite.roundedFinalTemperature);

const calorimetryCases = [
  { material: "aluminum", solidMass: 50, energy: 2090, waterMass: 200 },
  { material: "copper", solidMass: 100, energy: 4180, waterMass: 400 },
  { material: "iron", solidMass: 200, energy: 6270, waterMass: 800 },
  { material: "granite", solidMass: 100, energy: 6270, waterMass: 200 }
];

for (const inputs of calorimetryCases) {
  const result = model.calorimetry(inputs);
  assert.ok(result.finalTemperature > result.startTemperature);
  assert.ok(result.finalTemperature < result.hotTemperature);
  assert.ok(Math.abs(result.energyBalance - result.energy) < 1e-8, "Energy must be conserved.");
  assert.ok(Math.abs(result.energyTransferredFromSolid - result.energyGainedByWater) < 1e-8, "Energy lost by the solid must equal energy gained by the water.");
}

const lessWater = model.calorimetry({ material: "iron", solidMass: 100, energy: 4180, waterMass: 200 });
const moreWater = model.calorimetry({ material: "iron", solidMass: 100, energy: 4180, waterMass: 800 });
assert.ok(lessWater.finalTemperature > moreWater.finalTemperature);

const lessEnergy = model.calorimetry({ material: "iron", solidMass: 100, energy: 2090, waterMass: 400 });
const moreEnergy = model.calorimetry({ material: "iron", solidMass: 100, energy: 6270, waterMass: 400 });
assert.ok(moreEnergy.finalTemperature > lessEnergy.finalTemperature);

assert.throws(() => model.heatSubstance({ material: "lead", mass: 100, energy: 2090 }), /Unknown material/);
assert.throws(() => model.calorimetry({ material: "water", solidMass: 100, energy: 2090, waterMass: 400 }), /solid material/);
assert.throws(() => model.calorimetry({ material: "iron", solidMass: 100, waterMass: 400, heatingChoice: "target-temperature", targetTemperature: 20 }), /above the starting temperature/);
assert.throws(() => model.calorimetry({ material: "iron", solidMass: 100, waterMass: 400, heatingChoice: "unknown", energy: 2090 }), /Unknown calorimetry heating choice/);

console.log("Energy model tests passed: 4.184 water constant, direct-heating checks, comparison patterns, equilibrium bounds, and energy conservation.");

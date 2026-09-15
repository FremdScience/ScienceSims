"use strict";

const assert = require("node:assert/strict");
const model = require("../energy-model.js");

const ENERGY = model.CALORIMETRY_HEATING_CHOICES.ENERGY;
const TARGET = model.CALORIMETRY_HEATING_CHOICES.TARGET_TEMPERATURE;

const selectedEnergy = model.calorimetry({
  heatingChoice: ENERGY,
  material: "aluminum",
  solidMass: 100,
  energy: 4180,
  targetTemperature: 90,
  waterMass: 400
});
assert.equal(selectedEnergy.energy, 4180);
assert.equal(selectedEnergy.targetTemperature, null, "Energy mode must not retain an incompatible target temperature.");
const selectedEnergyHistory = model.createCalorimetryHistoryRecord(selectedEnergy);
assert.equal(selectedEnergyHistory.heatingChoice, ENERGY);
assert.equal(selectedEnergyHistory.energy, 4180);
assert.equal(selectedEnergyHistory.targetTemperature, null);
assert.equal(selectedEnergyHistory.initialWaterTemperature, 20);
assert.equal(selectedEnergyHistory.solidTemperatureBeforeTransfer, selectedEnergy.hotTemperature);

const targetTemperature = model.calorimetry({
  heatingChoice: TARGET,
  material: "aluminum",
  solidMass: 200,
  energy: 2090,
  targetTemperature: 90,
  waterMass: 200
});
assert.equal(targetTemperature.energy, 12600, "Target-temperature mode must calculate energy rather than retain the selected energy.");
assert.equal(targetTemperature.hotTemperature, 90);

const tableD = [
  { material: "copper", expectedEnergy: 5390, expectedFinal: 25.9 },
  { material: "iron", expectedEnergy: 6300, expectedFinal: 26.8 },
  { material: "granite", expectedEnergy: 11060, expectedFinal: 31.1 },
  { material: "aluminum", expectedEnergy: 12600, expectedFinal: 32.4 }
];

for (const trial of tableD) {
  const result = model.calorimetry({
    heatingChoice: TARGET,
    material: trial.material,
    solidMass: 200,
    targetTemperature: 90,
    waterMass: 200
  });
  assert.equal(result.roundedEnergy, trial.expectedEnergy, `Table D energy for ${trial.material}`);
  assert.equal(result.roundedFinalTemperature, trial.expectedFinal, `Table D final temperature for ${trial.material}`);
  assert.equal(result.roundedHotTemperature, 90);
  assert.ok(Math.abs(result.energyTransferredFromSolid - result.energyGainedByWater) < 1e-8);
  assert.ok(Math.abs(result.energyBalance - result.energy) < 1e-8);
}

const tableE = [
  { waterMass: 200, expectedFinal: 32.4 },
  { waterMass: 400, expectedFinal: 26.8 },
  { waterMass: 800, expectedFinal: 23.6 }
];

for (const trial of tableE) {
  const result = model.calorimetry({
    heatingChoice: TARGET,
    material: "aluminum",
    solidMass: 200,
    targetTemperature: 90,
    waterMass: trial.waterMass
  });
  assert.equal(result.roundedEnergy, 12600);
  assert.equal(result.roundedFinalTemperature, trial.expectedFinal, `Table E final temperature for ${trial.waterMass} g water`);
}

const history = model.createCalorimetryHistoryRecord(targetTemperature);
assert.deepEqual(history, {
  heatingChoice: TARGET,
  material: "aluminum",
  solidMass: 200,
  energy: 12600,
  targetTemperature: 90,
  waterMass: 200,
  initialWaterTemperature: 20,
  solidTemperatureBeforeTransfer: 90,
  finalSolidTemperature: targetTemperature.finalTemperature,
  finalWaterTemperature: targetTemperature.finalTemperature
});
assert.equal(history.finalSolidTemperature, history.finalWaterTemperature, "The final solid and water temperatures must be equal.");

console.log("Packet calorimetry tests passed: both modes, Tables D and E, mode isolation, history values, equal final temperatures, and energy conservation.");

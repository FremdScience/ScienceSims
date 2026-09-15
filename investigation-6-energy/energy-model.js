(function (root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  if (root) root.EnergyModel = model;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const START_TEMPERATURE = 20;
  const WATER_SPECIFIC_HEAT = 4.18;
  const SPECIFIC_HEATS = Object.freeze({
    water: 4.18,
    aluminum: 0.90,
    copper: 0.385,
    iron: 0.45,
    granite: 0.79
  });

  const LABELS = Object.freeze({
    water: "Water",
    aluminum: "Aluminum",
    copper: "Copper",
    iron: "Iron",
    granite: "Granite"
  });

  function round1(value) {
    return Math.round((value + Number.EPSILON) * 10) / 10;
  }

  function requirePositive(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
      throw new RangeError(`${name} must be a positive number.`);
    }
    return number;
  }

  function getSpecificHeat(material) {
    const value = SPECIFIC_HEATS[material];
    if (!value) throw new RangeError("Unknown material.");
    return value;
  }

  function heatSubstance({ material, mass, energy }) {
    const safeMass = requirePositive(mass, "Mass");
    const safeEnergy = requirePositive(energy, "Energy");
    const specificHeat = getSpecificHeat(material);
    const finalTemperature = START_TEMPERATURE + safeEnergy / (safeMass * specificHeat);

    return Object.freeze({
      material,
      mass: safeMass,
      energy: safeEnergy,
      startTemperature: START_TEMPERATURE,
      finalTemperature,
      roundedFinalTemperature: round1(finalTemperature)
    });
  }

  function calorimetry({ material, solidMass, energy, waterMass }) {
    if (material === "water") throw new RangeError("Calorimetry requires a solid material.");
    const safeSolidMass = requirePositive(solidMass, "Solid mass");
    const safeEnergy = requirePositive(energy, "Energy");
    const safeWaterMass = requirePositive(waterMass, "Water mass");
    const solidSpecificHeat = getSpecificHeat(material);
    const solidHeatCapacity = safeSolidMass * solidSpecificHeat;
    const waterHeatCapacity = safeWaterMass * WATER_SPECIFIC_HEAT;
    const hotTemperature = START_TEMPERATURE + safeEnergy / solidHeatCapacity;
    const finalTemperature = (
      solidHeatCapacity * hotTemperature +
      waterHeatCapacity * START_TEMPERATURE
    ) / (solidHeatCapacity + waterHeatCapacity);
    const energyGainedByWater = waterHeatCapacity * (finalTemperature - START_TEMPERATURE);
    const energyRemainingAboveStartInSolid = solidHeatCapacity * (finalTemperature - START_TEMPERATURE);

    return Object.freeze({
      material,
      solidMass: safeSolidMass,
      waterMass: safeWaterMass,
      energy: safeEnergy,
      startTemperature: START_TEMPERATURE,
      hotTemperature,
      finalTemperature,
      roundedHotTemperature: round1(hotTemperature),
      roundedFinalTemperature: round1(finalTemperature),
      energyGainedByWater,
      energyRemainingAboveStartInSolid,
      energyBalance: energyGainedByWater + energyRemainingAboveStartInSolid
    });
  }

  return Object.freeze({
    START_TEMPERATURE,
    WATER_SPECIFIC_HEAT,
    SPECIFIC_HEATS,
    LABELS,
    round1,
    heatSubstance,
    calorimetry
  });
});

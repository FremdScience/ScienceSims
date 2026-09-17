(function (root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  if (root) root.EnergyModel = model;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const START_TEMPERATURE = 20;
  const WATER_SPECIFIC_HEAT = 4.184;
  const SPECIFIC_HEATS = Object.freeze({
    water: WATER_SPECIFIC_HEAT,
    aluminum: 0.90,
    copper: 0.385,
    iron: 0.45,
    granite: 0.79
  });

  const SPECIFIC_HEAT_LABELS = Object.freeze({
    water: "4.184",
    aluminum: "0.90",
    copper: "0.385",
    iron: "0.45",
    granite: "0.79"
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

  const CALORIMETRY_HEATING_CHOICES = Object.freeze({
    ENERGY: "energy",
    TARGET_TEMPERATURE: "target-temperature"
  });

  function calorimetry({
    material,
    solidMass,
    energy,
    waterMass,
    heatingChoice = CALORIMETRY_HEATING_CHOICES.ENERGY,
    targetTemperature
  }) {
    if (material === "water") throw new RangeError("Calorimetry requires a solid material.");
    const safeSolidMass = requirePositive(solidMass, "Solid mass");
    const safeWaterMass = requirePositive(waterMass, "Water mass");
    const solidSpecificHeat = getSpecificHeat(material);
    const solidHeatCapacity = safeSolidMass * solidSpecificHeat;
    const waterHeatCapacity = safeWaterMass * WATER_SPECIFIC_HEAT;
    let safeEnergy;
    let hotTemperature;
    let safeTargetTemperature = null;

    if (heatingChoice === CALORIMETRY_HEATING_CHOICES.ENERGY) {
      safeEnergy = requirePositive(energy, "Energy");
      hotTemperature = START_TEMPERATURE + safeEnergy / solidHeatCapacity;
    } else if (heatingChoice === CALORIMETRY_HEATING_CHOICES.TARGET_TEMPERATURE) {
      safeTargetTemperature = requirePositive(targetTemperature, "Target temperature");
      if (safeTargetTemperature <= START_TEMPERATURE) {
        throw new RangeError("Target temperature must be above the starting temperature.");
      }
      hotTemperature = safeTargetTemperature;
      safeEnergy = solidHeatCapacity * (hotTemperature - START_TEMPERATURE);
    } else {
      throw new RangeError("Unknown calorimetry heating choice.");
    }

    const finalTemperature = (
      solidHeatCapacity * hotTemperature +
      waterHeatCapacity * START_TEMPERATURE
    ) / (solidHeatCapacity + waterHeatCapacity);
    const energyGainedByWater = waterHeatCapacity * (finalTemperature - START_TEMPERATURE);
    const energyRemainingAboveStartInSolid = solidHeatCapacity * (finalTemperature - START_TEMPERATURE);
    const energyTransferredFromSolid = solidHeatCapacity * (hotTemperature - finalTemperature);

    return Object.freeze({
      heatingChoice,
      material,
      solidMass: safeSolidMass,
      waterMass: safeWaterMass,
      energy: safeEnergy,
      targetTemperature: safeTargetTemperature,
      startTemperature: START_TEMPERATURE,
      hotTemperature,
      finalTemperature,
      roundedEnergy: Math.round(safeEnergy),
      roundedHotTemperature: round1(hotTemperature),
      roundedFinalTemperature: round1(finalTemperature),
      energyGainedByWater,
      energyTransferredFromSolid,
      energyRemainingAboveStartInSolid,
      energyBalance: energyGainedByWater + energyRemainingAboveStartInSolid
    });
  }

  function createCalorimetryHistoryRecord(result) {
    return Object.freeze({
      heatingChoice: result.heatingChoice,
      material: result.material,
      solidMass: result.solidMass,
      energy: result.energy,
      targetTemperature: result.targetTemperature,
      waterMass: result.waterMass,
      initialWaterTemperature: result.startTemperature,
      solidTemperatureBeforeTransfer: result.hotTemperature,
      finalSolidTemperature: result.finalTemperature,
      finalWaterTemperature: result.finalTemperature
    });
  }

  return Object.freeze({
    START_TEMPERATURE,
    WATER_SPECIFIC_HEAT,
    SPECIFIC_HEATS,
    SPECIFIC_HEAT_LABELS,
    CALORIMETRY_HEATING_CHOICES,
    LABELS,
    round1,
    heatSubstance,
    calorimetry,
    createCalorimetryHistoryRecord
  });
});

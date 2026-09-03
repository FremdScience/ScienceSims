(function (root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  if (root) root.PlantModel = model;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const MAX_DAY = 50;

  const SPECIES = Object.freeze({
    bean: Object.freeze({
      label: "Bean",
      germinationDay: 4,
      optimalWater: 60,
      maxHeight: 54,
      maxMass: 32,
      etiolatedHeight: 17,
      leafShape: "oval"
    }),
    tomato: Object.freeze({
      label: "Tomato",
      germinationDay: 5,
      optimalWater: 70,
      maxHeight: 46,
      maxMass: 39,
      etiolatedHeight: 15,
      leafShape: "lobed"
    }),
    turnip: Object.freeze({
      label: "Turnip",
      germinationDay: 3,
      optimalWater: 50,
      maxHeight: 29,
      maxMass: 48,
      etiolatedHeight: 11,
      leafShape: "broad"
    })
  });

  const SOILS = Object.freeze({
    plain: Object.freeze({ label: "Plain soil", heightMultiplier: 1, massMultiplier: 1 }),
    compost: Object.freeze({ label: "Soil + compost", heightMultiplier: 1.08, massMultiplier: 1.14 }),
    fertilizer: Object.freeze({ label: "Soil + fertilizer", heightMultiplier: 1.13, massMultiplier: 1.2 })
  });

  const LIGHT_HEIGHT_FACTORS = Object.freeze([0, 0.54, 0.82, 1]);
  const LIGHT_MASS_FACTORS = Object.freeze([0, 0.42, 0.74, 1]);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round1(value) {
    return Math.round((value + Number.EPSILON) * 10) / 10;
  }

  function normalizedConfig(config) {
    const seed = SPECIES[config && config.seed] ? config.seed : "";
    const soil = SOILS[config && config.soil] ? config.soil : "plain";
    return {
      seed,
      soil,
      water: clamp(Number(config && config.water) || 0, 0, 120),
      lights: clamp(Math.round(Number(config && config.lights) || 0), 0, 3)
    };
  }

  function waterFactor(water, optimalWater) {
    if (water <= 0) return 0;
    if (water <= optimalWater) return Math.pow(water / optimalWater, 0.72);
    const excess = (water - optimalWater) / (120 - optimalWater);
    return clamp(1 - 0.72 * Math.pow(excess, 1.25), 0.18, 1);
  }

  function growthProgress(day, germinationDay) {
    if (day <= germinationDay) return 0;
    const t = clamp((day - germinationDay) / (MAX_DAY - germinationDay), 0, 1);
    const curve = 1 - Math.exp(-3.7 * t);
    return curve / (1 - Math.exp(-3.7));
  }

  function zeroLightGrowth(day, species, waterEffect) {
    if (day <= species.germinationDay || waterEffect === 0) return { height: 0, mass: 0 };
    const t = clamp((day - species.germinationDay) / (MAX_DAY - species.germinationDay), 0, 1);
    const earlyRise = 1 - Math.exp(-9 * Math.min(t / 0.36, 1));
    const decline = t <= 0.36 ? 1 : 1 - 0.58 * ((t - 0.36) / 0.64);
    const height = species.etiolatedHeight * earlyRise * decline * Math.min(1, waterEffect + 0.18);
    const massPeak = species.maxMass * 0.095 * earlyRise;
    const massDecline = t <= 0.3 ? 1 : 1 - 0.76 * ((t - 0.3) / 0.7);
    return {
      height: Math.max(0, height),
      mass: Math.max(0, massPeak * massDecline * Math.min(1, waterEffect + 0.12))
    };
  }

  function measurementsForDay(rawConfig, day) {
    const config = normalizedConfig(rawConfig);
    const safeDay = clamp(Math.round(Number(day) || 0), 0, MAX_DAY);
    if (!config.seed) return { day: safeDay, height: 0, mass: 0, appearance: "Empty pot" };

    const species = SPECIES[config.seed];
    const soil = SOILS[config.soil];
    const waterEffect = waterFactor(config.water, species.optimalWater);

    let height;
    let mass;
    if (config.lights === 0) {
      ({ height, mass } = zeroLightGrowth(safeDay, species, waterEffect));
    } else {
      const progress = growthProgress(safeDay, species.germinationDay);
      const crowding = config.soil === "fertilizer" && config.water < species.optimalWater * 0.45 ? 0.83 : 1;
      height = species.maxHeight * LIGHT_HEIGHT_FACTORS[config.lights] * waterEffect * soil.heightMultiplier * crowding * progress;
      mass = species.maxMass * LIGHT_MASS_FACTORS[config.lights] * Math.pow(waterEffect, 1.08) * soil.massMultiplier * crowding * Math.pow(progress, 1.16);
    }

    height = round1(height);
    mass = round1(mass);
    return {
      day: safeDay,
      height,
      mass,
      appearance: describeAppearance(config, safeDay, height, mass)
    };
  }

  function describeAppearance(rawConfig, day, height, mass) {
    const config = normalizedConfig(rawConfig);
    if (!config.seed) return "Empty pot";
    const species = SPECIES[config.seed];
    if (day === 0) return `${species.label} seed planted; no shoot visible`;
    if (config.water === 0) return "Dry soil; seed has not germinated";
    if (day <= species.germinationDay) return "Seed below soil; no shoot visible";
    if (config.lights === 0) {
      if (day < 19) return "Thin, pale shoot with yellow leaves";
      return "Pale, wilted seedling; little living tissue remains";
    }
    if (config.water < species.optimalWater * 0.45) return "Small plant with curled, wilted leaves";
    if (config.water > species.optimalWater * 1.45) return "Weak growth with yellowing leaves in waterlogged soil";
    if (config.soil === "fertilizer" && config.water < species.optimalWater * 0.65) return "Leaf edges are brown; growth is stressed";
    if (config.lights === 1) return "Tall, thin stem with pale green leaves";
    if (config.lights === 2) return "Green plant with moderate leaf growth";
    if (height < species.maxHeight * 0.45 || mass < species.maxMass * 0.35) return "Small green plant with limited leaf growth";
    if (config.seed === "tomato" && day >= 38) return "Healthy branching plant with small flowers and fruit";
    if (config.seed === "turnip" && day >= 34) return "Healthy leafy plant with a thickened storage root";
    return "Healthy green plant with broad leaves";
  }

  function simulatePot(config) {
    return Array.from({ length: MAX_DAY + 1 }, (_, day) => measurementsForDay(config, day));
  }

  function describeSetup(rawConfig) {
    const config = normalizedConfig(rawConfig);
    const seed = config.seed ? SPECIES[config.seed].label : "No seed";
    return `${seed}; ${config.water} mL water/day; ${config.lights} ${config.lights === 1 ? "light" : "lights"}; ${SOILS[config.soil].label.toLowerCase()}`;
  }

  return Object.freeze({
    MAX_DAY,
    SPECIES,
    SOILS,
    clamp,
    round1,
    normalizedConfig,
    waterFactor,
    measurementsForDay,
    simulatePot,
    describeSetup
  });
});

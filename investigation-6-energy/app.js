(function () {
  "use strict";

  const model = window.EnergyModel;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MATERIAL_SYMBOLS = Object.freeze({ aluminum: "Al", copper: "Cu", iron: "Fe", granite: "Gr" });
  const state = {
    heating: { phase: "ready", trials: [], result: null, runId: 0, skipAnimation: false },
    calorimetry: { phase: "ready", trials: [], result: null, runId: 0, skipAnimation: false },
    targetChallenge: { phase: "ready", trials: [], result: null, runId: 0, skipAnimation: false }
  };
  const els = {};

  function byId(id) { return document.getElementById(id); }
  function checkedValue(name) { return document.querySelector(`input[name="${name}"]:checked`).value; }
  function checkedNumber(name) { return Number(document.querySelector(`input[name="${name}"]:checked`).value); }
  function formatTemperature(value) { return `${Number(value).toFixed(1)} °C`; }
  function formatNumber(value) { return Number(value).toLocaleString("en-US"); }
  function formatEnergy(value) { return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 1 })} J`; }
  function duration(normal) { return motionQuery.matches ? 0 : normal; }

  function initialize() {
    Object.assign(els, {
      heatingTab: byId("heating-tab"), calorimetryTab: byId("calorimetry-tab"),
      heatingPanel: byId("heating-panel"), calorimetryPanel: byId("calorimetry-panel"),
      heatingMaterial: byId("heating-material"), addEnergyButton: byId("add-energy-button"),
      heatingResetButton: byId("heating-reset-button"), heatingStatus: byId("heating-status"),
      heatingApparatus: byId("heating-apparatus"), sampleVisual: byId("sample-visual"),
      heatingMercury: byId("heating-mercury"), heatingFinalTemperature: byId("heating-final-temperature"),
      heatingHistoryBody: byId("heating-history-body"), clearHeatingHistory: byId("clear-heating-history"),
      skipHeatingAnimation: byId("skip-heating-animation"),
      solidMaterial: byId("solid-material"), heatSolidButton: byId("heat-solid-button"),
      heatSolidButtonLabel: byId("heat-solid-button-label"), energyChoiceField: byId("energy-choice-field"),
      targetTemperatureField: byId("target-temperature-field"), targetSolidTemperature: byId("target-solid-temperature"),
      targetSolidTemperatureOutput: byId("target-solid-temperature-output"), calculatedSolidEnergy: byId("calculated-solid-energy"),
      transferButton: byId("transfer-button"), calorimetryResetButton: byId("calorimetry-reset-button"),
      calorimetryStatus: byId("calorimetry-status"), calorimetryApparatus: byId("calorimetry-apparatus"),
      solidSample: byId("solid-sample"), solidSymbol: byId("solid-symbol"), solidSpecificHeatValue: byId("solid-specific-heat-value"),
      immersedSolid: byId("immersed-solid"), immersedSpecificHeatValue: byId("immersed-specific-heat-value"), waterFill: byId("water-fill"),
      solidMercury: byId("solid-mercury"), waterMercury: byId("water-mercury"),
      solidTemperature: byId("solid-temperature"), waterTemperature: byId("water-temperature"),
      calorimetryHistoryBody: byId("calorimetry-history-body"),
      clearCalorimetryHistory: byId("clear-calorimetry-history"),
      skipCalorimetryAnimation: byId("skip-calorimetry-animation"),
      sequenceSet: byId("sequence-set"), sequenceHeat: byId("sequence-heat"),
      sequenceTransfer: byId("sequence-transfer"), sequenceObserve: byId("sequence-observe"),
      exploreCalorimetryTab: byId("explore-calorimetry-tab"), targetChallengeTab: byId("target-challenge-tab"),
      exploreCalorimetryView: byId("explore-calorimetry-view"), targetChallengeView: byId("target-challenge-view"),
      targetMaterial: byId("target-material"), targetSolidMass: byId("target-solid-mass"),
      targetSolidMassOutput: byId("target-solid-mass-output"), targetWaterVolume: byId("target-water-volume"),
      targetWaterVolumeOutput: byId("target-water-volume-output"), targetSolidStart: byId("target-solid-start"),
      targetSolidStartOutput: byId("target-solid-start-output"), targetWaterStart: byId("target-water-start"),
      targetWaterStartOutput: byId("target-water-start-output"), targetFinalTemperature: byId("target-final-temperature"),
      targetWaterDelta: byId("target-water-delta"), targetDistance: byId("target-distance"),
      targetWaterEnergy: byId("target-water-energy"), targetMeterFill: byId("target-meter-fill"),
      targetFeedback: byId("target-feedback"), targetStatus: byId("target-status"),
      heatTargetMetal: byId("heat-target-metal"), transferTargetMetal: byId("transfer-target-metal"),
      resetTargetTrial: byId("reset-target-trial"), skipTargetAnimation: byId("skip-target-animation"),
      clearTargetHistory: byId("clear-target-history"), targetHistoryBody: byId("target-history-body"),
      targetApparatus: byId("target-apparatus"), targetSolidSample: byId("target-solid-sample"),
      targetSolidSymbol: byId("target-solid-symbol"), targetImmersedSolid: byId("target-immersed-solid"),
      targetWaterFill: byId("target-water-fill"), targetSolidMercury: byId("target-solid-mercury"),
      targetWaterMercury: byId("target-water-mercury"),
      targetSolidTemperatureReading: byId("target-solid-temperature-reading"),
      targetWaterTemperatureReading: byId("target-water-temperature-reading"),
      targetSequenceSet: byId("target-sequence-set"), targetSequenceHeat: byId("target-sequence-heat"),
      targetSequenceTransfer: byId("target-sequence-transfer"), targetSequenceObserve: byId("target-sequence-observe")
    });

    bindEvents();
    updateHeatingSample();
    updateHeatingMass();
    updateSolidSample();
    updateCalorimetryMass();
    updateWaterMass();
    updateCalorimetryHeatingChoice(false);
    resetHeating(false);
    resetCalorimetry(false);
    resetTargetChallenge(false);
  }

  function bindEvents() {
    els.heatingTab.addEventListener("click", () => switchTab("heating"));
    els.calorimetryTab.addEventListener("click", () => switchTab("calorimetry"));
    [els.heatingTab, els.calorimetryTab].forEach((tab) => tab.addEventListener("keydown", handleTabKeys));

    els.heatingMaterial.addEventListener("change", () => { updateHeatingSample(); resetHeating(false); });
    document.querySelectorAll('input[name="heating-mass"]').forEach((control) => control.addEventListener("change", () => { updateHeatingMass(); resetHeating(false); }));
    document.querySelectorAll('input[name="heating-energy"]').forEach((control) => control.addEventListener("change", () => resetHeating(false)));
    els.addEnergyButton.addEventListener("click", runHeatingTrial);
    els.heatingResetButton.addEventListener("click", () => resetHeating(true));
    els.clearHeatingHistory.addEventListener("click", clearHeatingHistory);
    els.skipHeatingAnimation.addEventListener("click", () => { state.heating.skipAnimation = true; });

    document.querySelectorAll('input[name="calorimetry-heating-choice"]').forEach((control) => control.addEventListener("change", () => updateCalorimetryHeatingChoice(true)));
    els.solidMaterial.addEventListener("change", () => { updateSolidSample(); updateCalculatedEnergy(); resetCalorimetry(false); });
    document.querySelectorAll('input[name="solid-mass"]').forEach((control) => control.addEventListener("change", () => { updateCalorimetryMass(); updateCalculatedEnergy(); resetCalorimetry(false); }));
    document.querySelectorAll('input[name="water-mass"]').forEach((control) => control.addEventListener("change", () => { updateWaterMass(); resetCalorimetry(false); }));
    document.querySelectorAll('input[name="solid-energy"]').forEach((control) => control.addEventListener("change", () => resetCalorimetry(false)));
    els.targetSolidTemperature.addEventListener("input", () => { updateCalculatedEnergy(); resetCalorimetry(false); });
    els.heatSolidButton.addEventListener("click", heatSolid);
    els.transferButton.addEventListener("click", transferSolid);
    els.calorimetryResetButton.addEventListener("click", () => resetCalorimetry(true));
    els.clearCalorimetryHistory.addEventListener("click", clearCalorimetryHistory);
    els.skipCalorimetryAnimation.addEventListener("click", () => { state.calorimetry.skipAnimation = true; });

    els.exploreCalorimetryTab.addEventListener("click", () => switchCalorimetryView("explore"));
    els.targetChallengeTab.addEventListener("click", () => switchCalorimetryView("target"));
    [els.exploreCalorimetryTab, els.targetChallengeTab].forEach((tab) => tab.addEventListener("keydown", handleCalorimetryModeKeys));
    [els.targetMaterial, els.targetSolidMass, els.targetWaterVolume, els.targetSolidStart, els.targetWaterStart]
      .forEach((control) => control.addEventListener("input", () => prepareTargetChallenge(false)));
    els.heatTargetMetal.addEventListener("click", heatTargetChallengeMetal);
    els.transferTargetMetal.addEventListener("click", transferTargetChallengeMetal);
    els.resetTargetTrial.addEventListener("click", () => resetTargetChallenge(true));
    els.skipTargetAnimation.addEventListener("click", () => { state.targetChallenge.skipAnimation = true; });
    els.clearTargetHistory.addEventListener("click", clearTargetChallengeHistory);
  }

  function handleTabKeys(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const goToHeating = event.key === "ArrowLeft" || event.key === "Home";
    switchTab(goToHeating ? "heating" : "calorimetry", true);
  }

  function switchTab(tabName, moveFocus = false) {
    const heatingActive = tabName === "heating";
    els.heatingTab.classList.toggle("active", heatingActive);
    els.calorimetryTab.classList.toggle("active", !heatingActive);
    els.heatingTab.setAttribute("aria-selected", String(heatingActive));
    els.calorimetryTab.setAttribute("aria-selected", String(!heatingActive));
    els.heatingTab.tabIndex = heatingActive ? 0 : -1;
    els.calorimetryTab.tabIndex = heatingActive ? -1 : 0;
    els.heatingPanel.hidden = !heatingActive;
    els.calorimetryPanel.hidden = heatingActive;
    if (moveFocus) (heatingActive ? els.heatingTab : els.calorimetryTab).focus();
  }

  function handleCalorimetryModeKeys(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const showExplore = event.key === "ArrowLeft" || event.key === "Home";
    switchCalorimetryView(showExplore ? "explore" : "target", true);
  }

  function switchCalorimetryView(viewName, moveFocus = false) {
    const exploreActive = viewName === "explore";
    els.exploreCalorimetryTab.classList.toggle("active", exploreActive);
    els.targetChallengeTab.classList.toggle("active", !exploreActive);
    els.exploreCalorimetryTab.setAttribute("aria-selected", String(exploreActive));
    els.targetChallengeTab.setAttribute("aria-selected", String(!exploreActive));
    els.exploreCalorimetryTab.tabIndex = exploreActive ? 0 : -1;
    els.targetChallengeTab.tabIndex = exploreActive ? -1 : 0;
    els.exploreCalorimetryView.hidden = !exploreActive;
    els.targetChallengeView.hidden = exploreActive;
    if (moveFocus) (exploreActive ? els.exploreCalorimetryTab : els.targetChallengeTab).focus();
  }

  function setControlsDisabled(selector, disabled) {
    document.querySelectorAll(selector).forEach((control) => { control.disabled = disabled; });
  }

  function updateHeatingSample() {
    const material = els.heatingMaterial.value;
    els.sampleVisual.className = `sample-vessel ${material === "water" ? "liquid" : `solid ${material}`}`;
    els.sampleVisual.querySelector(".sample-label").textContent = model.LABELS[material];
  }

  function updateHeatingMass() {
    els.sampleVisual.dataset.mass = String(checkedNumber("heating-mass"));
  }

  function updateSolidSample() {
    const material = els.solidMaterial.value;
    els.solidSample.className = `solid-sample ${material}`;
    els.solidSymbol.textContent = MATERIAL_SYMBOLS[material];
    els.immersedSolid.className = `immersed-solid ${material}`;
    const specificHeatLabel = `c = ${model.SPECIFIC_HEAT_LABELS[material]}`;
    els.solidSpecificHeatValue.textContent = specificHeatLabel;
    els.immersedSpecificHeatValue.textContent = specificHeatLabel;
  }

  function updateCalorimetryMass() {
    const mass = checkedNumber("solid-mass");
    const dimensions = { 50: [54, 44, ".42rem"], 100: [76, 62, ".50rem"], 200: [107, 87, ".58rem"] }[mass];
    [els.solidSample, els.immersedSolid].forEach((element) => {
      element.style.setProperty("--solid-width", `${dimensions[0]}px`);
      element.style.setProperty("--solid-height", `${dimensions[1]}px`);
      element.style.setProperty("--solid-label-size", dimensions[2]);
    });
  }

  function updateWaterMass() {
    const height = { 200: "110px", 400: "135px", 800: "165px" }[checkedNumber("water-mass")];
    els.waterFill.style.setProperty("--water-height", height);
  }

  function updateCalculatedEnergy() {
    const targetTemperature = Number(els.targetSolidTemperature.value);
    els.targetSolidTemperatureOutput.value = `${targetTemperature} °C`;
    const energy = checkedNumber("solid-mass") * model.SPECIFIC_HEATS[els.solidMaterial.value] * (targetTemperature - model.START_TEMPERATURE);
    els.calculatedSolidEnergy.textContent = formatEnergy(energy);
  }

  function applyCalorimetryModeAvailability() {
    const useTargetTemperature = checkedValue("calorimetry-heating-choice") === model.CALORIMETRY_HEATING_CHOICES.TARGET_TEMPERATURE;
    els.energyChoiceField.hidden = useTargetTemperature;
    els.targetTemperatureField.hidden = !useTargetTemperature;
    document.querySelectorAll('input[name="solid-energy"]').forEach((control) => { control.disabled = useTargetTemperature; });
    els.targetSolidTemperature.disabled = !useTargetTemperature;
    els.heatSolidButtonLabel.textContent = useTargetTemperature ? "Heat Solid to the Target Temperature" : "Add Energy to the Solid";
  }

  function updateCalorimetryHeatingChoice(resetDefaults) {
    const heatingChoice = checkedValue("calorimetry-heating-choice");
    if (resetDefaults) {
      if (heatingChoice === model.CALORIMETRY_HEATING_CHOICES.TARGET_TEMPERATURE) {
        els.targetSolidTemperature.value = "90";
      } else {
        document.querySelector('input[name="solid-energy"][value="4180"]').checked = true;
      }
    }
    updateCalculatedEnergy();
    resetCalorimetry(false);
  }

  function thermometerHeight(temperature) {
    return `${Math.min(92, 14 + Math.max(0, temperature - 20) * 0.75)}%`;
  }

  function resetHeating(announce) {
    state.heating.runId += 1;
    state.heating.skipAnimation = false;
    state.heating.phase = "ready";
    state.heating.result = null;
    els.heatingApparatus.classList.remove("heating");
    els.heatingMercury.style.height = thermometerHeight(model.START_TEMPERATURE);
    els.heatingFinalTemperature.textContent = "—";
    els.skipHeatingAnimation.hidden = true;
    els.addEnergyButton.disabled = false;
    setControlsDisabled("#heating-panel select, #heating-panel input", false);
    els.heatingStatus.textContent = announce ? "Trial reset. Your settings and trial table are unchanged." : "Choose settings, then add energy.";
  }

  async function runHeatingTrial() {
    if (state.heating.phase === "heating") return;
    const inputs = {
      material: els.heatingMaterial.value,
      mass: checkedNumber("heating-mass"),
      energy: checkedNumber("heating-energy")
    };
    const result = model.heatSubstance(inputs);
    const runId = ++state.heating.runId;
    state.heating.skipAnimation = false;
    state.heating.phase = "heating";
    state.heating.result = result;
    els.addEnergyButton.disabled = true;
    setControlsDisabled("#heating-panel select, #heating-panel input", true);
    els.heatingApparatus.classList.add("heating");
    els.skipHeatingAnimation.hidden = false;
    els.heatingStatus.textContent = `Adding ${formatNumber(inputs.energy)} J to the ${model.LABELS[inputs.material].toLowerCase()} sample.`;
    await waitForAnimation(850, "heating");
    if (runId !== state.heating.runId) return;
    els.heatingMercury.style.height = thermometerHeight(result.finalTemperature);
    await waitForAnimation(650, "heating");
    if (runId !== state.heating.runId) return;
    els.heatingApparatus.classList.remove("heating");
    els.heatingFinalTemperature.textContent = formatTemperature(result.roundedFinalTemperature);
    els.skipHeatingAnimation.hidden = true;
    state.heating.phase = "complete";
    state.heating.trials.push(result);
    renderHeatingHistory();
    els.addEnergyButton.disabled = false;
    setControlsDisabled("#heating-panel select, #heating-panel input", false);
    els.heatingStatus.textContent = "Trial complete. Record or compare the starting and final temperatures.";
  }

  function renderHeatingHistory() {
    if (!state.heating.trials.length) {
      els.heatingHistoryBody.innerHTML = '<tr class="empty-row"><td colspan="6">No trials yet.</td></tr>';
      return;
    }
    els.heatingHistoryBody.innerHTML = state.heating.trials.map((trial, index) => `
      <tr><th scope="row">${index + 1}</th><td>${model.LABELS[trial.material]}</td><td>${trial.mass}</td><td>${formatNumber(trial.energy)}</td><td>${trial.startTemperature.toFixed(1)}</td><td>${trial.roundedFinalTemperature.toFixed(1)}</td></tr>
    `).join("");
  }

  function clearHeatingHistory() {
    state.heating.trials = [];
    renderHeatingHistory();
    els.heatingStatus.textContent = "Heating trial table cleared.";
  }

  function resetCalorimetry(announce) {
    state.calorimetry.runId += 1;
    state.calorimetry.skipAnimation = false;
    state.calorimetry.phase = "ready";
    state.calorimetry.result = null;
    els.calorimetryApparatus.classList.remove("heating", "transferring", "mixed");
    els.solidMercury.style.height = thermometerHeight(model.START_TEMPERATURE);
    els.waterMercury.style.height = thermometerHeight(model.START_TEMPERATURE);
    els.solidTemperature.textContent = formatTemperature(model.START_TEMPERATURE);
    els.waterTemperature.textContent = formatTemperature(model.START_TEMPERATURE);
    els.heatSolidButton.disabled = false;
    els.transferButton.disabled = true;
    els.skipCalorimetryAnimation.hidden = true;
    setControlsDisabled("#calorimetry-panel select, #calorimetry-panel input", false);
    applyCalorimetryModeAvailability();
    updateSequence("set");
    const useTargetTemperature = checkedValue("calorimetry-heating-choice") === model.CALORIMETRY_HEATING_CHOICES.TARGET_TEMPERATURE;
    const direction = useTargetTemperature ? "Set the variables, then heat the solid to the target temperature." : "Set the variables, then add energy to the solid.";
    els.calorimetryStatus.textContent = announce ? `New trial ready. ${direction}` : direction;
  }

  function updateSequence(current) {
    const order = ["set", "heat", "transfer", "observe"];
    const currentIndex = order.indexOf(current);
    order.forEach((name, index) => {
      const element = els[`sequence${name[0].toUpperCase()}${name.slice(1)}`];
      element.classList.toggle("active", index === currentIndex);
      element.classList.toggle("complete", index < currentIndex);
    });
  }

  async function heatSolid() {
    if (state.calorimetry.phase !== "ready") return;
    const heatingChoice = checkedValue("calorimetry-heating-choice");
    const inputs = {
      heatingChoice,
      material: els.solidMaterial.value,
      solidMass: checkedNumber("solid-mass"),
      waterMass: checkedNumber("water-mass"),
      energy: heatingChoice === model.CALORIMETRY_HEATING_CHOICES.ENERGY ? checkedNumber("solid-energy") : undefined,
      targetTemperature: heatingChoice === model.CALORIMETRY_HEATING_CHOICES.TARGET_TEMPERATURE ? Number(els.targetSolidTemperature.value) : undefined
    };
    const result = model.calorimetry(inputs);
    const runId = ++state.calorimetry.runId;
    state.calorimetry.skipAnimation = false;
    state.calorimetry.result = result;
    state.calorimetry.phase = "heating";
    setControlsDisabled("#calorimetry-panel select, #calorimetry-panel input", true);
    els.heatSolidButton.disabled = true;
    updateSequence("heat");
    els.calorimetryApparatus.classList.add("heating");
    els.skipCalorimetryAnimation.hidden = false;
    els.calorimetryStatus.textContent = heatingChoice === model.CALORIMETRY_HEATING_CHOICES.TARGET_TEMPERATURE
      ? `Energy needed to heat the solid: ${formatEnergy(result.energy)}.`
      : `Energy added to the solid: ${formatEnergy(result.energy)}.`;
    await waitForAnimation(850, "calorimetry");
    if (runId !== state.calorimetry.runId) return;
    els.solidMercury.style.height = thermometerHeight(result.hotTemperature);
    await waitForAnimation(650, "calorimetry");
    if (runId !== state.calorimetry.runId) return;
    els.calorimetryApparatus.classList.remove("heating");
    els.solidTemperature.textContent = formatTemperature(result.roundedHotTemperature);
    state.calorimetry.phase = "hot";
    els.skipCalorimetryAnimation.hidden = true;
    els.transferButton.disabled = false;
    updateSequence("transfer");
    els.calorimetryStatus.textContent = "The solid is warmer than the water. Transfer it into the water.";
  }

  function animateTemperatures(fromSolid, fromWater, toTemperature, milliseconds, runId) {
    if (milliseconds === 0 || state.calorimetry.skipAnimation) {
      showMixedTemperatures(toTemperature, toTemperature);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const start = performance.now();
      function frame(now) {
        if (runId !== state.calorimetry.runId) { resolve(); return; }
        if (state.calorimetry.skipAnimation) { showMixedTemperatures(toTemperature, toTemperature); resolve(); return; }
        const progress = Math.min(1, (now - start) / milliseconds);
        const eased = 1 - Math.pow(1 - progress, 3);
        const solid = fromSolid + (toTemperature - fromSolid) * eased;
        const water = fromWater + (toTemperature - fromWater) * eased;
        showMixedTemperatures(solid, water);
        if (progress < 1) window.requestAnimationFrame(frame); else resolve();
      }
      window.requestAnimationFrame(frame);
    });
  }

  function showMixedTemperatures(solidTemperature, waterTemperature) {
    els.solidTemperature.textContent = formatTemperature(solidTemperature);
    els.waterTemperature.textContent = formatTemperature(waterTemperature);
    els.solidMercury.style.height = thermometerHeight(solidTemperature);
    els.waterMercury.style.height = thermometerHeight(waterTemperature);
  }

  async function transferSolid() {
    if (state.calorimetry.phase !== "hot") return;
    const result = state.calorimetry.result;
    const runId = state.calorimetry.runId;
    state.calorimetry.skipAnimation = false;
    state.calorimetry.phase = "transferring";
    els.transferButton.disabled = true;
    updateSequence("observe");
    els.calorimetryApparatus.classList.add("transferring");
    els.skipCalorimetryAnimation.hidden = false;
    els.calorimetryStatus.textContent = "Energy transferred from the warmer solid to the cooler water.";
    await waitForAnimation(850, "calorimetry");
    if (runId !== state.calorimetry.runId) return;
    els.calorimetryApparatus.classList.remove("transferring");
    els.calorimetryApparatus.classList.add("mixed");
    await animateTemperatures(result.hotTemperature, result.startTemperature, result.finalTemperature, duration(1100), runId);
    if (runId !== state.calorimetry.runId) return;
    showMixedTemperatures(result.roundedFinalTemperature, result.roundedFinalTemperature);
    state.calorimetry.phase = "complete";
    state.calorimetry.trials.push(model.createCalorimetryHistoryRecord(result));
    els.skipCalorimetryAnimation.hidden = true;
    renderCalorimetryHistory();
    els.calorimetryStatus.textContent = "The warmer solid transferred energy to the cooler water. The solid cooled and the water warmed until they reached the same temperature.";
  }

  function renderCalorimetryHistory() {
    if (!state.calorimetry.trials.length) {
      els.calorimetryHistoryBody.innerHTML = '<tr class="empty-row"><td colspan="11">No trials yet.</td></tr>';
      return;
    }
    els.calorimetryHistoryBody.innerHTML = state.calorimetry.trials.map((trial, index) => `
      <tr><th scope="row">${index + 1}</th><td>${trial.heatingChoice === model.CALORIMETRY_HEATING_CHOICES.ENERGY ? "Choose the energy added" : "Same target temperature"}</td><td>${model.LABELS[trial.material]}</td><td>${trial.solidMass}</td><td>${formatNumber(Math.round(trial.energy))}</td><td>${trial.targetTemperature === null ? "—" : trial.targetTemperature.toFixed(1)}</td><td>${trial.waterMass}</td><td>${trial.initialWaterTemperature.toFixed(1)}</td><td>${trial.solidTemperatureBeforeTransfer.toFixed(1)}</td><td>${trial.finalSolidTemperature.toFixed(1)}</td><td>${trial.finalWaterTemperature.toFixed(1)}</td></tr>
    `).join("");
  }

  function clearCalorimetryHistory() {
    state.calorimetry.trials = [];
    renderCalorimetryHistory();
    els.calorimetryStatus.textContent = "Calorimetry trial table cleared.";
  }

  function targetChallengeInputs() {
    return {
      material: els.targetMaterial.value,
      solidMass: Number(els.targetSolidMass.value),
      solidTemperature: Number(els.targetSolidStart.value),
      waterVolume: Number(els.targetWaterVolume.value),
      waterTemperature: Number(els.targetWaterStart.value),
      targetDelta: 5
    };
  }

  function updateTargetChallengeVisuals() {
    const inputs = targetChallengeInputs();
    els.targetSolidMassOutput.value = `${inputs.solidMass} g`;
    els.targetWaterVolumeOutput.value = `${inputs.waterVolume} mL`;
    els.targetSolidStartOutput.value = `${inputs.solidTemperature} °C`;
    els.targetWaterStartOutput.value = `${inputs.waterTemperature.toFixed(1)} °C`;
    const material = inputs.material;
    const dimensions = {
      width: Math.round(42 + (inputs.solidMass - 5) / 245 * 65),
      height: Math.round(34 + (inputs.solidMass - 5) / 245 * 54)
    };
    const waterHeight = Math.round(74 + (inputs.waterVolume - 25) / 225 * 85);
    [els.targetSolidSample, els.targetImmersedSolid].forEach((element) => {
      element.className = `${element === els.targetSolidSample ? "solid-sample" : "immersed-solid"} ${material}`;
      element.style.setProperty("--solid-width", `${dimensions.width}px`);
      element.style.setProperty("--solid-height", `${dimensions.height}px`);
    });
    els.targetSolidSymbol.textContent = MATERIAL_SYMBOLS[material];
    els.targetWaterFill.style.setProperty("--water-height", `${waterHeight}px`);
  }

  function clearTargetChallengeResult() {
    els.targetFinalTemperature.textContent = "—";
    els.targetWaterDelta.textContent = "—";
    els.targetDistance.textContent = "—";
    els.targetWaterEnergy.textContent = "—";
    els.targetMeterFill.style.width = "0";
    els.targetFeedback.textContent = "Complete the heating and transfer steps to reveal the result.";
    delete els.targetFeedback.dataset.level;
  }

  function updateTargetSequence(current) {
    const order = ["set", "heat", "transfer", "observe"];
    const currentIndex = order.indexOf(current);
    order.forEach((name, index) => {
      const element = els[`targetSequence${name[0].toUpperCase()}${name.slice(1)}`];
      element.classList.toggle("active", index === currentIndex);
      element.classList.toggle("complete", index < currentIndex);
    });
  }

  function showTargetTemperatures(solidTemperature, waterTemperature) {
    els.targetSolidTemperatureReading.textContent = formatTemperature(solidTemperature);
    els.targetWaterTemperatureReading.textContent = formatTemperature(waterTemperature);
    els.targetSolidMercury.style.height = thermometerHeight(solidTemperature);
    els.targetWaterMercury.style.height = thermometerHeight(waterTemperature);
  }

  function prepareTargetChallenge(announce) {
    const inputs = targetChallengeInputs();
    state.targetChallenge.runId += 1;
    state.targetChallenge.skipAnimation = false;
    state.targetChallenge.phase = "ready";
    state.targetChallenge.result = null;
    els.targetApparatus.classList.remove("heating", "transferring", "mixed");
    updateTargetChallengeVisuals();
    showTargetTemperatures(model.START_TEMPERATURE, inputs.waterTemperature);
    clearTargetChallengeResult();
    els.heatTargetMetal.disabled = false;
    els.transferTargetMetal.disabled = true;
    els.skipTargetAnimation.hidden = true;
    setControlsDisabled("#target-challenge-view select, #target-challenge-view input", false);
    updateTargetSequence("set");
    els.targetStatus.textContent = announce
      ? "New trial ready. Set the variables, then heat the metal."
      : "Set the variables, then heat the metal.";
  }

  function resetTargetChallenge(announce) {
    els.targetMaterial.value = "aluminum";
    els.targetSolidMass.value = "100";
    els.targetWaterVolume.value = "100";
    els.targetSolidStart.value = "90";
    els.targetWaterStart.value = "20";
    prepareTargetChallenge(announce);
  }

  async function heatTargetChallengeMetal() {
    if (state.targetChallenge.phase !== "ready") return;
    const result = model.predictTargetChallenge(targetChallengeInputs());
    const runId = ++state.targetChallenge.runId;
    state.targetChallenge.skipAnimation = false;
    state.targetChallenge.phase = "heating";
    state.targetChallenge.result = result;
    setControlsDisabled("#target-challenge-view select, #target-challenge-view input", true);
    els.heatTargetMetal.disabled = true;
    updateTargetSequence("heat");
    els.targetApparatus.classList.add("heating");
    els.skipTargetAnimation.hidden = false;
    els.targetStatus.textContent = `Heating the ${model.LABELS[result.material].toLowerCase()} to ${formatTemperature(result.solidTemperature)}.`;
    await waitForAnimation(850, "targetChallenge");
    if (runId !== state.targetChallenge.runId) return;
    els.targetSolidMercury.style.height = thermometerHeight(result.solidTemperature);
    await waitForAnimation(650, "targetChallenge");
    if (runId !== state.targetChallenge.runId) return;
    els.targetApparatus.classList.remove("heating");
    els.targetSolidTemperatureReading.textContent = formatTemperature(result.solidTemperature);
    state.targetChallenge.phase = "hot";
    els.skipTargetAnimation.hidden = true;
    els.transferTargetMetal.disabled = false;
    updateTargetSequence("transfer");
    els.targetStatus.textContent = "The metal is warmer than the water. Transfer it into the calorimeter.";
  }

  function animateTargetTemperatures(fromSolid, fromWater, toTemperature, milliseconds, runId) {
    if (milliseconds === 0 || state.targetChallenge.skipAnimation) {
      showTargetTemperatures(toTemperature, toTemperature);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const start = performance.now();
      function frame(now) {
        if (runId !== state.targetChallenge.runId) { resolve(); return; }
        if (state.targetChallenge.skipAnimation) { showTargetTemperatures(toTemperature, toTemperature); resolve(); return; }
        const progress = Math.min(1, (now - start) / milliseconds);
        const eased = 1 - Math.pow(1 - progress, 3);
        showTargetTemperatures(
          fromSolid + (toTemperature - fromSolid) * eased,
          fromWater + (toTemperature - fromWater) * eased
        );
        if (progress < 1) window.requestAnimationFrame(frame); else resolve();
      }
      window.requestAnimationFrame(frame);
    });
  }

  function showTargetChallengeResult(result) {
    els.targetFinalTemperature.textContent = formatTemperature(result.roundedFinalTemperature);
    els.targetWaterDelta.textContent = `+${result.roundedWaterDelta.toFixed(1)} °C`;
    els.targetDistance.textContent = `${result.roundedDistanceFromTarget.toFixed(1)} °C`;
    els.targetWaterEnergy.textContent = formatEnergy(result.energyGainedByWater);
    els.targetMeterFill.style.width = `${Math.min(100, Math.max(0, result.waterDelta / 10 * 100))}%`;
    if (result.distanceFromTarget <= 0.05) {
      els.targetFeedback.textContent = "This ideal trial meets the +5.0 °C target.";
      els.targetFeedback.dataset.level = "met";
    } else if (result.distanceFromTarget <= 0.5) {
      els.targetFeedback.textContent = "This trial is very close to the +5.0 °C target.";
      els.targetFeedback.dataset.level = "close";
    } else if (result.waterDelta < 5) {
      els.targetFeedback.textContent = "The water temperature change is below the target. Change one variable and run another trial.";
      els.targetFeedback.dataset.level = "revise";
    } else {
      els.targetFeedback.textContent = "The water temperature change is above the target. Change one variable and run another trial.";
      els.targetFeedback.dataset.level = "revise";
    }
  }

  async function transferTargetChallengeMetal() {
    if (state.targetChallenge.phase !== "hot") return;
    const result = state.targetChallenge.result;
    const runId = state.targetChallenge.runId;
    state.targetChallenge.skipAnimation = false;
    state.targetChallenge.phase = "transferring";
    els.transferTargetMetal.disabled = true;
    updateTargetSequence("observe");
    els.targetApparatus.classList.add("transferring");
    els.skipTargetAnimation.hidden = false;
    els.targetStatus.textContent = "Energy transfers from the warmer metal to the cooler water in the calorimeter.";
    await waitForAnimation(850, "targetChallenge");
    if (runId !== state.targetChallenge.runId) return;
    els.targetApparatus.classList.remove("transferring");
    els.targetApparatus.classList.add("mixed");
    await animateTargetTemperatures(result.solidTemperature, result.waterTemperature, result.finalTemperature, duration(1100), runId);
    if (runId !== state.targetChallenge.runId) return;
    showTargetTemperatures(result.roundedFinalTemperature, result.roundedFinalTemperature);
    state.targetChallenge.phase = "complete";
    state.targetChallenge.trials.push(result);
    els.skipTargetAnimation.hidden = true;
    renderTargetChallengeHistory();
    showTargetChallengeResult(result);
    els.targetStatus.textContent = "Trial complete. The metal and water reached the same final temperature. Choose New Trial to test another design.";
  }

  function renderTargetChallengeHistory() {
    if (!state.targetChallenge.trials.length) {
      els.targetHistoryBody.innerHTML = '<tr class="empty-row"><td colspan="9">No saved trials yet.</td></tr>';
      return;
    }
    els.targetHistoryBody.innerHTML = state.targetChallenge.trials.map((trial, index) => `
      <tr><th scope="row">${index + 1}</th><td>${model.LABELS[trial.material]}</td><td>${trial.solidMass}</td><td>${trial.solidTemperature.toFixed(1)}</td><td>${trial.waterVolume}</td><td>${trial.waterTemperature.toFixed(1)}</td><td>${trial.roundedFinalTemperature.toFixed(1)}</td><td>+${trial.roundedWaterDelta.toFixed(1)}</td><td>${trial.roundedDistanceFromTarget.toFixed(1)}</td></tr>
    `).join("");
  }

  function clearTargetChallengeHistory() {
    state.targetChallenge.trials = [];
    renderTargetChallengeHistory();
    els.targetStatus.textContent = "Saved target trials cleared. Your current settings are unchanged.";
  }

  function waitForAnimation(milliseconds, key) {
    const targetDuration = duration(milliseconds);
    if (targetDuration === 0 || state[key].skipAnimation) return Promise.resolve();
    return new Promise((resolve) => {
      const start = performance.now();
      function check() {
        if (state[key].skipAnimation || performance.now() - start >= targetDuration) { resolve(); return; }
        window.setTimeout(check, 40);
      }
      check();
    });
  }

  window.Investigation6App = Object.freeze({
    getState: () => ({
      heating: { phase: state.heating.phase, trialCount: state.heating.trials.length },
      calorimetry: {
        phase: state.calorimetry.phase,
        trialCount: state.calorimetry.trials.length,
        heatingChoice: checkedValue("calorimetry-heating-choice"),
        energyChoicesDisabled: [...document.querySelectorAll('input[name="solid-energy"]')].every((control) => control.disabled),
        targetTemperatureDisabled: els.targetSolidTemperature.disabled
      },
      targetChallenge: {
        phase: state.targetChallenge.phase,
        trialCount: state.targetChallenge.trials.length,
        waterDelta: state.targetChallenge.result ? state.targetChallenge.result.waterDelta : null,
        distanceFromTarget: state.targetChallenge.result ? state.targetChallenge.result.distanceFromTarget : null
      }
    }),
    switchTab,
    switchCalorimetryView,
    resetHeating: () => resetHeating(false),
    resetCalorimetry: () => resetCalorimetry(false),
    resetTargetChallenge: () => resetTargetChallenge(false),
    selectCalorimetryHeatingChoice: (choice) => {
      const control = document.querySelector(`input[name="calorimetry-heating-choice"][value="${choice}"]`);
      if (!control) throw new RangeError("Unknown calorimetry heating choice.");
      control.checked = true;
      updateCalorimetryHeatingChoice(true);
    }
  });

  initialize();
})();

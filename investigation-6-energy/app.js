(function () {
  "use strict";

  const model = window.EnergyModel;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MATERIAL_SYMBOLS = Object.freeze({ aluminum: "Al", copper: "Cu", iron: "Fe", granite: "Gr" });
  const state = {
    heating: { phase: "ready", trials: [], result: null, runId: 0, skipAnimation: false },
    calorimetry: { phase: "ready", trials: [], result: null, runId: 0, skipAnimation: false }
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
      sequenceTransfer: byId("sequence-transfer"), sequenceObserve: byId("sequence-observe")
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
      }
    }),
    switchTab,
    resetHeating: () => resetHeating(false),
    resetCalorimetry: () => resetCalorimetry(false),
    selectCalorimetryHeatingChoice: (choice) => {
      const control = document.querySelector(`input[name="calorimetry-heating-choice"][value="${choice}"]`);
      if (!control) throw new RangeError("Unknown calorimetry heating choice.");
      control.checked = true;
      updateCalorimetryHeatingChoice(true);
    }
  });

  initialize();
})();

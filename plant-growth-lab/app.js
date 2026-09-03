(function () {
  "use strict";

  const model = window.PlantModel;
  const POT_META = [
    { id: "A", color: "#c6403a" },
    { id: "B", color: "#147b57" },
    { id: "C", color: "#426bb5" }
  ];
  const DEFAULT_CONFIG = Object.freeze({ seed: "", soil: "plain", water: 50, lights: 3 });
  const state = {
    day: 0,
    running: false,
    timer: null,
    measure: "height",
    graphType: "bar",
    showValues: true,
    pots: POT_META.map((pot) => ({ ...pot, config: { ...DEFAULT_CONFIG }, data: [] }))
  };

  const els = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function initialize() {
    Object.assign(els, {
      experimentTab: byId("experiment-tab"),
      dataTab: byId("data-tab"),
      experimentPanel: byId("experiment-panel"),
      dataPanel: byId("data-panel"),
      potsGrid: byId("pots-grid"),
      setupAlert: byId("setup-alert"),
      dayNumber: byId("day-number"),
      dayUnit: byId("day-unit"),
      dayProgress: byId("day-progress"),
      playButton: byId("play-button"),
      pauseButton: byId("pause-button"),
      resetButton: byId("reset-button"),
      clearButton: byId("clear-button"),
      runStatus: byId("run-status"),
      chartDay: byId("chart-day"),
      chartTitle: byId("chart-title"),
      chartDescription: byId("chart-description"),
      chart: byId("growth-chart"),
      chartLegend: byId("chart-legend"),
      summaryDay: byId("summary-day"),
      summaryBody: byId("summary-table-body"),
      fullDataBody: byId("full-data-table-body"),
      showValues: byId("show-values"),
      imageButton: byId("image-button"),
      csvButton: byId("csv-button"),
      exportStatus: byId("export-status")
    });

    renderPotCards();
    bindEvents();
    recomputeData();
    updateAll();
  }

  function potCardMarkup(pot) {
    const seedOptions = [
      ["", "Choose a seed"],
      ["bean", "Bean"],
      ["tomato", "Tomato"],
      ["turnip", "Turnip"]
    ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
    const soilOptions = [
      ["plain", "Plain soil"],
      ["compost", "Soil + compost"],
      ["fertilizer", "Soil + fertilizer"]
    ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
    const lightButtons = [0, 1, 2, 3].map((count) => (
      `<button class="light-choice" type="button" data-light="${count}" aria-pressed="${count === DEFAULT_CONFIG.lights}" aria-label="${count} ${count === 1 ? "light" : "lights"}">${count}</button>`
    )).join("");

    return `
      <article class="pot-card" data-pot="${pot.id}" aria-labelledby="pot-${pot.id}-title">
        <div class="pot-title-row">
          <h3 id="pot-${pot.id}-title">Experimental pot</h3>
          <span class="pot-letter" aria-hidden="true">${pot.id}</span>
        </div>
        <div class="chamber" id="chamber-${pot.id}">
          <div class="light-fixture" aria-hidden="true">
            <span class="bulb on"></span><span class="bulb on"></span><span class="bulb on"></span>
          </div>
          <div class="ruler" aria-hidden="true"></div>
          <svg class="plant-svg" id="plant-${pot.id}" viewBox="0 0 160 245" role="img"></svg>
          <div class="pot-visual" aria-hidden="true"></div>
          <div class="chamber-readout" aria-hidden="true">
            <span id="height-${pot.id}">0.0 cm</span>
            <span id="mass-${pot.id}">0.0 g</span>
          </div>
        </div>
        <div class="control-grid">
          <div class="field">
            <label for="seed-${pot.id}">Seed type</label>
            <select id="seed-${pot.id}" data-control="seed" data-pot-id="${pot.id}">${seedOptions}</select>
          </div>
          <div class="field">
            <label for="soil-${pot.id}">Soil treatment</label>
            <select id="soil-${pot.id}" data-control="soil" data-pot-id="${pot.id}">${soilOptions}</select>
          </div>
          <div class="field field-wide">
            <label for="water-${pot.id}">Daily water</label>
            <div class="range-row">
              <input id="water-${pot.id}" type="range" min="0" max="120" step="10" value="${DEFAULT_CONFIG.water}" data-control="water" data-pot-id="${pot.id}">
              <output id="water-output-${pot.id}" class="range-value" for="water-${pot.id}">${DEFAULT_CONFIG.water} mL</output>
            </div>
          </div>
          <fieldset class="field field-wide">
            <legend>Number of lights</legend>
            <div class="light-buttons" role="group" aria-label="Number of lights for pot ${pot.id}" data-pot-id="${pot.id}">${lightButtons}</div>
          </fieldset>
        </div>
      </article>`;
  }

  function renderPotCards() {
    els.potsGrid.innerHTML = state.pots.map(potCardMarkup).join("");
  }

  function bindEvents() {
    els.experimentTab.addEventListener("click", () => switchTab("experiment"));
    els.dataTab.addEventListener("click", () => switchTab("data"));
    [els.experimentTab, els.dataTab].forEach((tab) => tab.addEventListener("keydown", handleTabKeys));

    els.potsGrid.addEventListener("change", handleControlChange);
    els.potsGrid.addEventListener("input", handleControlInput);
    els.potsGrid.addEventListener("click", handleLightClick);

    els.playButton.addEventListener("click", play);
    els.pauseButton.addEventListener("click", () => pause("Simulation paused."));
    els.resetButton.addEventListener("click", resetDay);
    els.clearButton.addEventListener("click", clearPots);

    document.querySelectorAll('input[name="measure"]').forEach((input) => {
      input.addEventListener("change", (event) => {
        state.measure = event.target.value;
        updateDataView();
      });
    });
    document.querySelectorAll('input[name="graph-type"]').forEach((input) => {
      input.addEventListener("change", (event) => {
        state.graphType = event.target.value;
        updateDataView();
      });
    });
    els.showValues.addEventListener("change", () => {
      state.showValues = els.showValues.checked;
      updateChart();
    });
    els.imageButton.addEventListener("click", downloadResultsImage);
    els.csvButton.addEventListener("click", exportCsv);
    window.addEventListener("resize", () => window.requestAnimationFrame(updateChart));
  }

  function handleTabKeys(event) {
    if (!(["ArrowLeft", "ArrowRight"].includes(event.key))) return;
    event.preventDefault();
    const next = event.currentTarget === els.experimentTab ? els.dataTab : els.experimentTab;
    next.focus();
    next.click();
  }

  function switchTab(view) {
    const isExperiment = view === "experiment";
    els.experimentTab.classList.toggle("active", isExperiment);
    els.dataTab.classList.toggle("active", !isExperiment);
    els.experimentTab.setAttribute("aria-selected", String(isExperiment));
    els.dataTab.setAttribute("aria-selected", String(!isExperiment));
    els.experimentPanel.hidden = !isExperiment;
    els.dataPanel.hidden = isExperiment;
    if (!isExperiment) updateDataView();
  }

  function findPot(potId) {
    return state.pots.find((pot) => pot.id === potId);
  }

  function handleControlInput(event) {
    const control = event.target.dataset.control;
    if (control !== "water") return;
    byId(`water-output-${event.target.dataset.potId}`).textContent = `${event.target.value} mL`;
  }

  function handleControlChange(event) {
    const control = event.target.dataset.control;
    const potId = event.target.dataset.potId;
    if (!control || !potId) return;
    const pot = findPot(potId);
    pot.config[control] = control === "water" ? Number(event.target.value) : event.target.value;
    if (control === "water") byId(`water-output-${potId}`).textContent = `${pot.config.water} mL`;
    setupChanged();
  }

  function handleLightClick(event) {
    const button = event.target.closest(".light-choice");
    if (!button) return;
    const group = button.closest(".light-buttons");
    const potId = group.dataset.potId;
    const count = Number(button.dataset.light);
    findPot(potId).config.lights = count;
    group.querySelectorAll(".light-choice").forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice === button));
    });
    setupChanged();
  }

  function setupChanged() {
    if (state.running) pause("Setup changed. Simulation paused and returned to day 0.");
    const changedAfterGrowth = state.day > 0;
    state.day = 0;
    recomputeData();
    hideSetupAlert();
    els.playButton.innerHTML = '<span aria-hidden="true">▶</span> Play';
    updateAll();
    if (changedAfterGrowth) els.runStatus.textContent = "Setup changed. Day reset to 0 so the comparison remains valid.";
  }

  function recomputeData() {
    state.pots.forEach((pot) => { pot.data = model.simulatePot(pot.config); });
  }

  function validateSetup() {
    const emptyPots = state.pots.filter((pot) => !pot.config.seed).map((pot) => pot.id);
    if (!emptyPots.length) return true;
    const potList = emptyPots.length > 2
      ? `${emptyPots.slice(0, -1).join(", ")}, and ${emptyPots[emptyPots.length - 1]}`
      : emptyPots.join(" and ");
    const names = emptyPots.length === 1 ? `Pot ${potList}` : `Pots ${potList}`;
    showSetupAlert(`${names} ${emptyPots.length === 1 ? "needs" : "need"} a seed before the experiment can begin.`);
    byId(`seed-${emptyPots[0]}`).focus();
    return false;
  }

  function showSetupAlert(message) {
    els.setupAlert.textContent = message;
    els.setupAlert.hidden = false;
  }

  function hideSetupAlert() {
    els.setupAlert.hidden = true;
    els.setupAlert.textContent = "";
  }

  function play() {
    if (state.running || !validateSetup()) return;
    hideSetupAlert();
    if (state.day >= model.MAX_DAY) state.day = 0;
    state.running = true;
    setSetupControlsDisabled(true);
    els.playButton.disabled = true;
    els.pauseButton.disabled = false;
    els.resetButton.disabled = true;
    els.clearButton.disabled = true;
    els.runStatus.textContent = `Plants are growing. Day ${state.day} of ${model.MAX_DAY}.`;
    updateAll();
    state.timer = window.setInterval(() => {
      state.day += 1;
      updateAll();
      if (state.day >= model.MAX_DAY) pause("Day 50 reached. Open Data to record your results.");
    }, 140);
  }

  function pause(message) {
    if (state.timer) window.clearInterval(state.timer);
    state.timer = null;
    state.running = false;
    setSetupControlsDisabled(false);
    els.playButton.disabled = false;
    els.pauseButton.disabled = true;
    els.resetButton.disabled = false;
    els.clearButton.disabled = false;
    els.playButton.innerHTML = state.day >= model.MAX_DAY ? '<span aria-hidden="true">↻</span> Run again' : '<span aria-hidden="true">▶</span> Play';
    els.runStatus.textContent = message;
    updateAll();
  }

  function resetDay() {
    if (state.running) pause("");
    state.day = 0;
    hideSetupAlert();
    els.playButton.innerHTML = '<span aria-hidden="true">▶</span> Play';
    els.runStatus.textContent = "Day reset to 0. Your pot settings are unchanged.";
    updateAll();
  }

  function clearPots() {
    if (state.running) pause("");
    state.day = 0;
    state.pots.forEach((pot) => {
      pot.config = { ...DEFAULT_CONFIG };
      const card = els.potsGrid.querySelector(`[data-pot="${pot.id}"]`);
      card.querySelector(`[data-control="seed"]`).value = "";
      card.querySelector(`[data-control="soil"]`).value = "plain";
      card.querySelector(`[data-control="water"]`).value = DEFAULT_CONFIG.water;
      byId(`water-output-${pot.id}`).textContent = `${DEFAULT_CONFIG.water} mL`;
      card.querySelectorAll(".light-choice").forEach((choice) => {
        choice.setAttribute("aria-pressed", String(Number(choice.dataset.light) === DEFAULT_CONFIG.lights));
      });
    });
    recomputeData();
    hideSetupAlert();
    els.playButton.innerHTML = '<span aria-hidden="true">▶</span> Play';
    els.runStatus.textContent = "Pots cleared. Choose new settings for your next experiment.";
    updateAll();
  }

  function setSetupControlsDisabled(disabled) {
    els.potsGrid.querySelectorAll("select, input, button").forEach((control) => { control.disabled = disabled; });
  }

  function updateAll() {
    els.dayNumber.textContent = String(state.day);
    els.dayUnit.textContent = state.day === 1 ? "day" : "days";
    els.dayProgress.style.width = `${(state.day / model.MAX_DAY) * 100}%`;
    if (state.running) els.runStatus.textContent = `Plants are growing. Day ${state.day} of ${model.MAX_DAY}.`;
    state.pots.forEach(updatePotVisual);
    updateDataView();
  }

  function updatePotVisual(pot) {
    const result = pot.data[state.day];
    const chamber = byId(`chamber-${pot.id}`);
    chamber.style.setProperty("--light-glow", String(0.04 + pot.config.lights * 0.13));
    chamber.querySelectorAll(".bulb").forEach((bulb, index) => bulb.classList.toggle("on", index < pot.config.lights));
    byId(`height-${pot.id}`).textContent = `${result.height.toFixed(1)} cm`;
    byId(`mass-${pot.id}`).textContent = `${result.mass.toFixed(1)} g`;
    drawPlant(byId(`plant-${pot.id}`), pot, result);
  }

  function drawPlant(svg, pot, result) {
    const species = pot.config.seed ? model.SPECIES[pot.config.seed] : null;
    const label = species ? `${species.label} in pot ${pot.id} on day ${state.day}: ${result.height.toFixed(1)} centimeters tall, ${result.mass.toFixed(1)} grams. ${result.appearance}.` : `Pot ${pot.id} is empty.`;
    svg.setAttribute("aria-label", label);
    if (!species || result.height <= 0) {
      svg.innerHTML = `<title>${label}</title><desc>${label}</desc>`;
      return;
    }

    const visualHeight = Math.max(12, Math.min(178, result.height / 62 * 178));
    const baseY = 220;
    const topY = baseY - visualHeight;
    const pale = result.appearance.includes("pale") || result.appearance.includes("yellow");
    const wilted = result.appearance.includes("wilted") || result.appearance.includes("stressed") || result.appearance.includes("waterlogged");
    const stemColor = pale ? "#b2ad53" : wilted ? "#718b45" : "#2b854c";
    const leafColor = pale ? "#d2cb67" : wilted ? "#8aa653" : "#3f9b59";
    const leafCount = Math.max(1, Math.min(8, Math.floor(result.mass / 5) + 1));
    let leaves = "";
    for (let index = 0; index < leafCount; index += 1) {
      const fraction = (index + 1) / (leafCount + 1);
      const y = baseY - visualHeight * fraction;
      const side = index % 2 === 0 ? -1 : 1;
      const droop = wilted ? 13 : -4;
      const rx = species.leafShape === "broad" ? 18 : species.leafShape === "lobed" ? 13 : 15;
      const ry = species.leafShape === "broad" ? 8 : 6;
      leaves += `<path d="M 80 ${y.toFixed(1)} Q ${(80 + side * rx).toFixed(1)} ${(y + droop - ry).toFixed(1)} ${(80 + side * rx * 1.8).toFixed(1)} ${(y + droop).toFixed(1)} Q ${(80 + side * rx).toFixed(1)} ${(y + droop + ry).toFixed(1)} 80 ${y.toFixed(1)}" fill="${leafColor}" stroke="#2e6941" stroke-width="1.5"/>`;
    }
    const root = pot.config.seed === "turnip" && state.day >= 20
      ? `<ellipse cx="80" cy="216" rx="${Math.min(22, 6 + result.mass / 4).toFixed(1)}" ry="${Math.min(17, 5 + result.mass / 5).toFixed(1)}" fill="#b85a6b" stroke="#7f3d4b" stroke-width="2"/>`
      : "";
    const fruit = pot.config.seed === "tomato" && state.day >= 38 && pot.config.lights >= 2
      ? '<circle cx="60" cy="153" r="5" fill="#d94b38"/><circle cx="99" cy="167" r="5" fill="#d94b38"/>'
      : "";
    const beanPod = pot.config.seed === "bean" && state.day >= 36 && pot.config.lights >= 2
      ? '<path d="M91 145 Q111 154 98 174 Q88 162 91 145Z" fill="#70a946" stroke="#39783e" stroke-width="2"/>'
      : "";
    const lean = wilted ? 10 : 0;
    svg.innerHTML = `
      <title>${label}</title><desc>${label}</desc>
      ${root}
      <path d="M80 ${baseY} Q ${80 + lean * 0.35} ${(baseY + topY) / 2} ${80 + lean} ${topY}" fill="none" stroke="${stemColor}" stroke-width="5" stroke-linecap="round"/>
      ${leaves}${fruit}${beanPod}`;
  }

  function updateDataView() {
    els.chartDay.textContent = String(state.day);
    els.summaryDay.textContent = String(state.day);
    els.chartTitle.textContent = state.measure === "height" ? "Plant height" : "Plant mass";
    updateChart();
    updateSummaryTable();
    updateFullDataTable();
  }

  function updateSummaryTable() {
    els.summaryBody.innerHTML = state.pots.map((pot) => {
      const result = pot.data[state.day];
      return `<tr>
        <td><span class="pot-key" style="color:${pot.color}">Pot ${pot.id}</span></td>
        <td class="tabular">${pot.config.seed ? `${result.height.toFixed(1)} cm` : '<span class="empty-value">—</span>'}</td>
        <td class="tabular">${pot.config.seed ? `${result.mass.toFixed(1)} g` : '<span class="empty-value">—</span>'}</td>
        <td>${result.appearance}</td>
      </tr>`;
    }).join("");
  }

  function updateFullDataTable() {
    const rows = [];
    for (let day = 0; day <= state.day; day += 1) {
      const values = state.pots.flatMap((pot) => {
        const result = pot.data[day];
        return [pot.config.seed ? result.height.toFixed(1) : "—", pot.config.seed ? result.mass.toFixed(1) : "—"];
      });
      rows.push(`<tr><th scope="row" class="tabular">${day}</th>${values.map((value) => `<td class="tabular">${value}</td>`).join("")}</tr>`);
    }
    els.fullDataBody.innerHTML = rows.join("");
  }

  function updateChart() {
    const unit = state.measure === "height" ? "cm" : "g";
    const yMax = state.measure === "height" ? 70 : 60;
    const measuredWidth = Math.round(els.chart.parentElement.getBoundingClientRect().width);
    const width = Math.max(320, measuredWidth || 760);
    const height = width < 500 ? 360 : 410;
    const margin = { top: 32, right: width < 500 ? 12 : 24, bottom: 58, left: width < 500 ? 54 : 64 };
    els.chart.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const y = (value) => margin.top + plotHeight - (value / yMax) * plotHeight;
    const grid = [];
    for (let value = 0; value <= yMax; value += 10) {
      const yPos = y(value);
      grid.push(`<line x1="${margin.left}" y1="${yPos}" x2="${width - margin.right}" y2="${yPos}" stroke="#d7e1dc" stroke-width="1"/>`);
      grid.push(`<text x="${margin.left - 10}" y="${yPos + 5}" text-anchor="end" fill="#52655f" font-size="14">${value}</text>`);
    }

    let marks = "";
    if (state.graphType === "bar") {
      const slot = plotWidth / state.pots.length;
      const barWidth = Math.min(120, slot * 0.52);
      state.pots.forEach((pot, index) => {
        const value = pot.data[state.day][state.measure];
        const barHeight = Math.max(0, plotHeight - (y(value) - margin.top));
        const x = margin.left + slot * index + (slot - barWidth) / 2;
        marks += `<rect x="${x}" y="${y(value)}" width="${barWidth}" height="${barHeight}" rx="6" fill="${pot.color}" opacity="${pot.config.seed ? 0.9 : 0.22}"/>`;
        marks += `<text x="${x + barWidth / 2}" y="${height - 25}" text-anchor="middle" fill="#17312b" font-size="16" font-weight="700">Pot ${pot.id}</text>`;
        if (state.showValues) marks += `<text x="${x + barWidth / 2}" y="${Math.max(20, y(value) - 9)}" text-anchor="middle" fill="#17312b" font-size="15" font-weight="700">${value.toFixed(1)} ${unit}</text>`;
      });
    } else {
      const x = (day) => margin.left + (day / model.MAX_DAY) * plotWidth;
      [0, 10, 20, 30, 40, 50].forEach((day) => {
        const xPos = x(day);
        grid.push(`<line x1="${xPos}" y1="${margin.top}" x2="${xPos}" y2="${margin.top + plotHeight}" stroke="#edf2ef" stroke-width="1"/>`);
        grid.push(`<text x="${xPos}" y="${height - 25}" text-anchor="middle" fill="#52655f" font-size="14">${day}</text>`);
      });
      state.pots.forEach((pot) => {
        const points = pot.data.slice(0, state.day + 1).map((result) => `${x(result.day).toFixed(2)},${y(result[state.measure]).toFixed(2)}`).join(" ");
        marks += `<polyline points="${points}" fill="none" stroke="${pot.color}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity="${pot.config.seed ? 1 : 0.28}"/>`;
        const current = pot.data[state.day];
        marks += `<circle cx="${x(state.day)}" cy="${y(current[state.measure])}" r="6" fill="white" stroke="${pot.color}" stroke-width="4"/>`;
        if (state.showValues) marks += `<text x="${Math.min(width - 46, x(state.day) + 10)}" y="${Math.max(18, y(current[state.measure]) - 10)}" fill="${pot.color}" font-size="14" font-weight="700">${pot.id}: ${current[state.measure].toFixed(1)}</text>`;
      });
      marks += `<text x="${margin.left + plotWidth / 2}" y="${height - 3}" text-anchor="middle" fill="#17312b" font-size="15" font-weight="700">Simulated day</text>`;
    }

    const measureLabel = state.measure === "height" ? "Height (cm)" : "Mass (g)";
    els.chart.innerHTML = `
      <rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}" fill="#fbfdfb" stroke="#9fb1aa" stroke-width="2"/>
      ${grid.join("")}
      <text x="18" y="${margin.top + plotHeight / 2}" transform="rotate(-90 18 ${margin.top + plotHeight / 2})" text-anchor="middle" fill="#17312b" font-size="15" font-weight="700">${measureLabel}</text>
      ${marks}`;
    els.chartLegend.innerHTML = state.pots.map((pot) => `<span class="legend-item"><span class="legend-swatch" style="--swatch:${pot.color}"></span>Pot ${pot.id}</span>`).join("");
    const resultsText = state.pots.map((pot) => `Pot ${pot.id}, ${pot.data[state.day][state.measure].toFixed(1)} ${unit}`).join("; ");
    els.chartDescription.textContent = `${state.graphType === "bar" ? "Bar" : "Line"} graph of plant ${state.measure} through day ${state.day}. ${resultsText}.`;
  }

  function exportCsv() {
    const headings = ["Day"];
    state.pots.forEach((pot) => headings.push(`Pot ${pot.id} height (cm)`, `Pot ${pot.id} mass (g)`));
    const rows = [headings];
    for (let day = 0; day <= state.day; day += 1) {
      const row = [day];
      state.pots.forEach((pot) => row.push(pot.data[day].height.toFixed(1), pot.data[day].mass.toFixed(1)));
      rows.push(row);
    }
    rows.push([]);
    rows.push(["Setups"]);
    state.pots.forEach((pot) => rows.push([`Pot ${pot.id}`, model.describeSetup(pot.config)]));
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `plant-growth-data-day-${state.day}.csv`);
    announceExport("Data CSV downloaded.");
  }

  function csvCell(value) {
    const text = String(value == null ? "" : value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadResultsImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1050;
    const context = canvas.getContext("2d");
    context.fillStyle = "#f8fbf6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#143f33";
    context.fillRect(0, 0, canvas.width, 135);
    context.fillStyle = "#ffffff";
    context.font = "700 48px system-ui, sans-serif";
    context.fillText("Plant Growth Lab Results", 70, 68);
    context.font = "500 25px system-ui, sans-serif";
    context.fillText(`Simulated day ${state.day} of ${model.MAX_DAY}`, 70, 108);

    const cardY = 175;
    const cardWidth = 460;
    const gap = 40;
    state.pots.forEach((pot, index) => drawResultCard(context, pot, 70 + index * (cardWidth + gap), cardY, cardWidth, 445));
    drawCanvasBarChart(context, "Height (cm)", "height", 70, 685, 690, 290, 70);
    drawCanvasBarChart(context, "Mass (g)", "mass", 820, 685, 690, 290, 60);

    canvas.toBlob((blob) => {
      if (!blob) {
        announceExport("The image could not be created in this browser.");
        return;
      }
      downloadBlob(blob, `plant-growth-results-day-${state.day}.png`);
      announceExport("Results image downloaded.");
    }, "image/png");
  }

  function drawResultCard(context, pot, x, y, width, height) {
    const result = pot.data[state.day];
    context.fillStyle = "#ffffff";
    roundedRect(context, x, y, width, height, 18, true, false);
    context.fillStyle = pot.color;
    roundedRect(context, x, y, width, 16, 16, true, false);
    context.fillStyle = "#17312b";
    context.font = "700 30px system-ui, sans-serif";
    context.fillText(`Pot ${pot.id}`, x + 26, y + 60);
    context.font = "500 20px system-ui, sans-serif";
    drawWrappedText(context, model.describeSetup(pot.config), x + 26, y + 98, width - 52, 28, 3);

    const plantBase = y + 300;
    context.fillStyle = "#a75b35";
    context.fillRect(x + width / 2 - 55, plantBase, 110, 65);
    context.fillStyle = "#71412b";
    context.fillRect(x + width / 2 - 64, plantBase, 128, 18);
    if (result.height > 0) {
      const plantHeight = Math.max(18, Math.min(155, result.height / 62 * 155));
      const pale = result.appearance.includes("pale") || result.appearance.includes("yellow");
      context.strokeStyle = pale ? "#aaa74b" : "#2b854c";
      context.lineWidth = 9;
      context.beginPath();
      context.moveTo(x + width / 2, plantBase);
      context.lineTo(x + width / 2, plantBase - plantHeight);
      context.stroke();
      context.fillStyle = pale ? "#d2cb67" : "#4c9f5a";
      for (let leaf = 0; leaf < 5; leaf += 1) {
        const leafY = plantBase - plantHeight * ((leaf + 1) / 6);
        context.beginPath();
        context.ellipse(x + width / 2 + (leaf % 2 ? 26 : -26), leafY, 29, 12, leaf % 2 ? -0.35 : 0.35, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.fillStyle = "#17312b";
    context.font = "700 22px system-ui, sans-serif";
    context.fillText(`${result.height.toFixed(1)} cm`, x + 24, y + 403);
    context.fillText(`${result.mass.toFixed(1)} g`, x + width - 122, y + 403);
    context.font = "500 17px system-ui, sans-serif";
    drawWrappedText(context, result.appearance, x + 24, y + 431, width - 48, 22, 2);
  }

  function drawCanvasBarChart(context, title, measure, x, y, width, height, max) {
    context.fillStyle = "#ffffff";
    roundedRect(context, x, y, width, height, 18, true, false);
    context.fillStyle = "#17312b";
    context.font = "700 25px system-ui, sans-serif";
    context.fillText(title, x + 25, y + 38);
    const plotX = x + 65;
    const plotY = y + 62;
    const plotWidth = width - 95;
    const plotHeight = height - 110;
    context.strokeStyle = "#cbd8d2";
    context.lineWidth = 2;
    context.strokeRect(plotX, plotY, plotWidth, plotHeight);
    const slot = plotWidth / 3;
    state.pots.forEach((pot, index) => {
      const value = pot.data[state.day][measure];
      const barHeight = (value / max) * (plotHeight - 14);
      const barX = plotX + slot * index + slot * 0.25;
      context.fillStyle = pot.color;
      context.fillRect(barX, plotY + plotHeight - barHeight, slot * 0.5, barHeight);
      context.fillStyle = "#17312b";
      context.font = "700 17px system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText(value.toFixed(1), barX + slot * 0.25, plotY + plotHeight - barHeight - 8);
      context.fillText(`Pot ${pot.id}`, barX + slot * 0.25, plotY + plotHeight + 28);
      context.textAlign = "left";
    });
  }

  function roundedRect(context, x, y, width, height, radius, fill, stroke) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
    if (fill) context.fill();
    if (stroke) context.stroke();
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(/\s+/);
    let line = "";
    let lineNumber = 0;
    for (let index = 0; index < words.length && lineNumber < maxLines; index += 1) {
      const testLine = line ? `${line} ${words[index]}` : words[index];
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line, x, y + lineNumber * lineHeight);
        line = words[index];
        lineNumber += 1;
      } else {
        line = testLine;
      }
    }
    if (lineNumber < maxLines && line) context.fillText(line, x, y + lineNumber * lineHeight);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function announceExport(message) {
    els.exportStatus.textContent = "";
    window.setTimeout(() => { els.exportStatus.textContent = message; }, 10);
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();

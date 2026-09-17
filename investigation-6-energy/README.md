# Energy and Temperature Change Simulation

A local, dependency-free chemistry simulation for two 50-minute investigation periods. Students change one variable at a time, run repeatable trials, and compare numerical evidence in data tables. The simulation intentionally does not graph results or name the material-dependent constant in the main student view.

## Preview locally

Open `index.html` directly in a browser, or from the `Science Simulations` folder run:

```bash
python3 -m http.server 8766
```

Then open `http://127.0.0.1:8766/investigation-6-energy/`.

The simulation has no external dependencies, login, account, analytics, cloud service, or saved personal data. Trial history exists only in page memory and disappears when the page is closed or refreshed.

## Student controls

### Tab 1 — Heating Substances

- Substance: Water, Aluminum, Copper, Iron, or Granite
- Sample mass: 50 g, 100 g, or 200 g
- Energy added to the sample: 2,090 J, 4,180 J, or 6,270 J
- Add Energy, Reset, and Clear Table controls
- Visible starting and final temperatures plus current-session trial history
- Brief animation with a visible Skip Animation control while it runs

### Tab 2 — Calorimetry

- Solid: Aluminum, Copper, Iron, or Granite, with each specific heat shown in the dropdown and on the animated solid
- Solid mass: 50 g, 100 g, or 200 g
- Heating choice: heat each solid to the same target temperature (the default), or choose 2,090 J, 4,180 J, or 6,270 J
- Target-temperature mode defaults to 90 °C and calculates the energy required with `Q = m c ΔT`
- Water mass: 200 g, 400 g, or 800 g
- Water depth increases with water mass and always covers the largest available solid
- Required sequence: set variables, add energy to solid, transfer solid to water, observe equilibrium
- Separate solid and water temperature readings plus current-session trial history
- Brief, skippable heating and transfer animations

## Model equations and assumptions

All materials begin at 20.0 °C. Direct heating uses:

`T_final = 20.0 °C + q / (m c)`

Calorimetry first uses:

`T_hot = 20.0 °C + q / (m_solid c_solid)`

Or, in same-temperature mode:

`q = m_solid c_solid (T_target − 20.0 °C)`

Then the insulated equilibrium temperature is:

`T_final = (m_solid c_solid T_hot + m_water c_water × 20.0 °C) / (m_solid c_solid + m_water c_water)`

Specific heat capacities in J/(g·°C): water 4.184, aluminum 0.90, copper 0.385, iron 0.45, granite 0.79. These constants appear only in the collapsed “Model information — open when directed” section. The ideal model assumes no energy is lost to the container or surroundings and does not represent time, heating rate, thermal conductivity, or phase changes. Results display to one decimal place while calculations retain full precision.

## Intended comparison trials

Part 1 teams can hold two variables constant while comparing:

- energy: 2,090 J, 4,180 J, and 6,270 J with one substance and mass;
- mass: 50 g, 100 g, and 200 g with one substance and energy;
- material: several substances with one mass and energy.

Part 2 teams can hold the other settings constant while comparing energy added, target solid temperature, solid mass, water mass, or solid material. Students can use same-temperature mode for revised packet Tables D and E while retaining the original selected-energy investigations.

## Revised Investigation 6 packet alignment

The local simulation implements these packet-aligned choices and records:

1. Both the solid and water begin at 20.0 °C. Students can either choose the energy added to the solid or heat each solid to the same target temperature before transfer.
2. Same-temperature mode defaults to 90 °C and clearly displays “Energy needed to heat the solid.”
3. Set the available solid masses to 50 g, 100 g, and 200 g; set the available water masses to 200 g, 400 g, and 800 g.
4. Add the repeatable energy choices 2,090 J, 4,180 J, and 6,270 J to both parts.
5. For Part 1, use columns for substance, sample mass, energy added, starting temperature, and final temperature. Remove any water/calorimeter fields from this section.
6. For Part 2, record heating choice, solid material, solid mass, selected or calculated energy, target temperature when applicable, water mass, initial water temperature, solid temperature before transfer, final solid temperature, and final water temperature.
7. Revise the Part 2 procedure so “Add Energy to Solid” occurs before “Transfer Solid to Water,” and prompt students to note that both final readings are equal.
8. Use “energy added to the solid,” “energy needed to heat the solid,” and “energy transferred” consistently.
9. Keep specific-heat constants in the collapsed “Model information — open when directed” section.
10. Do not require a graph. Direct students to compare numerical evidence across table rows and describe what changed, what stayed the same, and how the temperatures differed.

## Files

- `index.html` — semantic student interface and two-tab structure
- `styles.css` — responsive visuals, touch targets, focus states, and reduced-motion support
- `energy-model.js` — deterministic physics calculations
- `app.js` — controls, sequence, animation, readings, reset, and session history
- `tests/model.test.js` — calculation and conservation checks
- `tests/calorimetry-packet.test.js` — both heating modes plus revised packet Tables D and E
- `tests/static-check.js` — structure, privacy, wording, and accessibility hooks

## Verify

From this folder run:

```bash
node --check app.js
node --check energy-model.js
node tests/model.test.js
node tests/calorimetry-packet.test.js
node tests/static-check.js
```

This is a local draft. Publishing or deployment is a separate step.

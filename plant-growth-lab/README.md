# Plant Growth Lab

A static, classroom-ready plant growth simulation for a freshman biology controlled-experiment lab. The website is intentionally separate from the student handout: it does not contain or save answers to the handout questions.

## What students can do

- Configure three experimental pots (A, B, and C).
- Choose bean, tomato, or turnip seeds.
- Set daily water from 0–120 mL, choose 0–3 lights, and use plain soil, compost, or fertilizer.
- Play, pause, reset, or clear a 50-day deterministic simulation.
- Compare plant height, mass, and visible appearance.
- Switch between height/mass and bar/line graphs.
- View a complete daily data table.
- Download a PNG results summary for Notability or export a CSV.

## Run locally

Open `index.html` directly in a browser. The site has no external dependencies and does not require a web server, login, account, analytics, or internet connection.

## Publish with GitHub Pages

1. Add the `plant-growth-lab` folder to a GitHub repository.
2. In the repository settings, open **Pages**.
3. Choose the branch and folder that contain this site.
4. Save and wait for GitHub to provide the published URL.

If this folder becomes the root of its own repository, publish from the repository root. No build command is required.

## Classroom notes

- The model is deterministic: the same settings always produce the same results, which supports fair classroom comparisons.
- The zero-light condition models early pale elongation followed by loss of mass and wilting as stored seed energy is depleted.
- Water response differs by species and falls under both severe drought and waterlogging.
- Compost and fertilizer increase potential growth when other conditions support it. Fertilizer can add stress when water is very low.
- Results show simplified scientific patterns, not exact predictions for real plants.

The supplied handout remains the student response and submission document. Students should record exact values and conclusions there.

## Files

- `index.html` — semantic page structure
- `styles.css` — responsive visual design
- `plant-model.js` — deterministic growth model
- `app.js` — controls, animation, charts, tables, and exports
- `tests/model.test.js` — model and handout-scenario checks

## Test

Run:

```bash
node tests/model.test.js
```


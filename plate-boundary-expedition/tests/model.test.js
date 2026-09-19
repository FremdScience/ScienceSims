const assert = require('node:assert/strict');
const { MISSIONS, gradeReport } = require('../model.js');
assert.equal(MISSIONS.length, 3);
for (const mission of MISSIONS) {
  assert.equal(mission.stations.length, 4);
  assert.ok(['convergent','divergent','transform'].includes(mission.type));
  const full = gradeReport(mission, mission.stations.map(s=>s.id), mission.type, mission.correctAction, 'Two observations support this plate boundary and hazard decision.');
  assert.equal(full.passed, true);
  assert.equal(full.points, 100);
  assert.equal(gradeReport(mission, ['q'], mission.type, mission.correctAction, 'Too short').passed, false);
}
console.log('Plate Boundary Expedition model tests passed.');

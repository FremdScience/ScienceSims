const assert=require('node:assert/strict');const {simulate,projectCost}=require('../model.js');
const base={rainfall:70,impervious:55,slope:12,soil:'loam',projects:[]};
const baseline=simulate(base),heavy=simulate({...base,rainfall:100}),paved=simulate({...base,impervious:80}),green=simulate({...base,projects:['rainGardens','trees','pavement']});
assert.ok(heavy.runoff>baseline.runoff);assert.ok(paved.peak>baseline.peak);assert.ok(green.peak<baseline.peak);assert.ok(green.sediment<baseline.sediment);assert.equal(projectCost(['rainGardens','trees']),45);assert.equal(baseline.hydrograph.length,21);assert.ok(baseline.infiltration>=5&&baseline.infiltration<=92);
console.log('Watershed Under Pressure model tests passed.');

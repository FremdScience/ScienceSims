const assert=require('node:assert/strict');const {MISSIONS,evaluateCircuit,diagnostic}=require('../model.js');
let r=evaluateCircuit(MISSIONS[0],['battery','wire','bulb','switch']);assert.equal(r.success,true);assert.equal(r.current,1);
r=evaluateCircuit(MISSIONS[0],MISSIONS[0].start);assert.equal(r.open,true);assert.match(diagnostic(MISSIONS[0],MISSIONS[0].start),/open circuit/i);
r=evaluateCircuit(MISSIONS[1],['battery','resistor','bulb','switch']);assert.equal(r.success,true);assert.equal(r.current,.75);
r=evaluateCircuit(MISSIONS[1],['battery','wire','wire','switch']);assert.equal(r.short,true);
r=evaluateCircuit(MISSIONS[2],['battery','switch','bulb','bulb']);assert.equal(r.success,true);assert.equal(r.resistance,3);assert.equal(r.current,3);
console.log('Blackout! Circuit Repair model tests passed.');

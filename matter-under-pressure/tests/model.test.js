const assert=require('node:assert/strict');const {phaseAt,boilingPoint,readings}=require('../model.js');
assert.equal(phaseAt('water',-10,1),'solid');assert.equal(phaseAt('water',25,1),'liquid');assert.equal(phaseAt('water',110,1),'gas');assert.equal(phaseAt('ethanol',80,1),'gas');assert.equal(phaseAt('oxygen',-200,1),'liquid');assert.ok(boilingPoint('water',2)>boilingPoint('water',1));assert.equal(readings('water',25,1).spacing,'close, mobile');
console.log('Matter Under Pressure model tests passed.');

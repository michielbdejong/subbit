var fs = require('fs');
var read = JSON.parse(fs.readFileSync('progress-3.json'));

var oddSize = fs.statSync('progress-3-odd.json').size;
var evenSize = fs.statSync('progress-3-odd.json').size;
var mainSize = fs.statSync('progress-3.json').size;
console.log(`Sizes ${oddSize} ${evenSize} ${mainSize}`);
  
console.log(`Now considering ${read.baseCircuitSize}-gate base circuit ${read.lastBaseCircuitTried} out of ${read.baseCircuits.length}.`);
console.log(`Found minimal circuits so far for ${Object.keys(read.perFlag).length} out of 256 of the desired Boolean functions.`);

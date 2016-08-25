var read = JSON.parse(require('fs').readFileSync('progress-3.json'));
console.log(`Now considering ${read.baseCircuitSize}-gate base circuit ${read.lastBaseCircuitTried} out of ${read.baseCircuits.length}.`);
console.log(`Found minimal circuits so far for ${Object.keys(read.perFlag).length} out of 256 of the desired Boolean functions.`);

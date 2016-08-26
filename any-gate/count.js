var read = JSON.parse(require('fs').readFileSync('progress-3-basics.json'));
read.perFlag = JSON.parse(require('fs').readFileSync('progress-3-perFlag.json'));
read.minimalCircuitsThisSize = JSON.parse(require('fs').readFileSync('progress-3-circuits.json'));
console.log(`Now considering ${read.baseCircuitSize}-gate base circuit ${read.lastBaseCircuitTried} out of ${read.baseCircuits.length}.`);
console.log(`Found minimal circuits so far for ${Object.keys(read.perFlag).length} out of 256 of the desired Boolean functions.`);
var stats = {};

function inputType(wire) {
  if (wire<2) {
    return 'X';
  }
  if (wire<5) {
    return 'I';
  }
  return (wire-5).toString();
}

function getArch(circuit) {
  var arch = [];
  // 0 is input, k>0 is previous gate.
  for (var i=0; i<circuit.length; i+=3) {
    var newGateArch = [inputType(circuit[i]), inputType(circuit[i+1])].sort();
    // console.log(circuit[i], circuit[i+1], circuit[i+2], newGateArch);
    arch = arch.concat(newGateArch);
  }
  // console.log('arch', circuit, arch);
  return arch.join('');
}

for (var flag in read.perFlag) {
  var numSolutions = {};
  for (var sol in read.perFlag[flag]) {
    var arch = getArch(read.perFlag[flag][sol]);
    if (typeof numSolutions[arch] === 'undefined') {
      numSolutions[arch] = 0;
    }
    numSolutions[arch]++;
  }

  var funcArch = [];
  for (var arch in numSolutions) {
    funcArch.push(arch+':'+numSolutions[arch]);
  }

  funcArch.sort((a, b) => {
    return (parseInt(a.split(':')) > parseInt(b.split(':')[1]));
  });

  if (typeof stats[funcArch] === 'undefined') {
    stats[funcArch]=0;
  }
  stats[funcArch]++;
}
var statLines = [];
for (var statLine in stats) {
  statLines.push(statLine + ' ' + stats[statLine]);
}
// console.log(statLines);
console.log(statLines.sort((a, b) => {
  if (a.split(':')[0].length !== b.split(':')[0].length)  {
    // console.log('comparing', a,' to ', b, 'on first arch size', a.split(':')[0].length, b.split(':')[0].length);
    return (a.split(':')[0].length - b.split(':')[0].length);
  }
  if (a.split(',').length !== b.split(',').length) {
    // console.log('comparing', a,' to ', b, 'on num diff arch', a.split(',').length, b.split(',').length);
    return (a.split(',').length - b.split(',').length);
  }
  // console.log('comparing', a, ' to ', b, 'as strings', (a > b), (a < b));
  return ((a > b) ? 1: -1);
}));

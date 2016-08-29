var read = JSON.parse(require('fs').readFileSync('progress-3-basics.json'));
read.perFlag = JSON.parse(require('fs').readFileSync('progress-3-perFlag.json'));
read.minimalCircuitsThisSize = JSON.parse(require('fs').readFileSync('progress-3-circuits.json'));
console.log(`Now considering ${read.baseCircuitSize}-gate base circuit ${read.lastBaseCircuitTried} out of ${read.baseCircuits.length}.`);
console.log(`Found minimal circuits so far for ${Object.keys(read.perFlag).length} out of 256 of the desired Boolean functions.`);
var stats = {};

function inputType(wire, stack) {
  if (wire<5) {
    return ['X', 'X', 'A', 'B', 'C'][wire];
  }
  return stack[(wire-5)];
}

function getArch(circuit) {
  var arch = [];
  // 0 is input, k>0 is previous gate.
  for (var i=0; i<circuit.length; i+=3) {
    var newGateArch = '['+[inputType(circuit[i], arch), inputType(circuit[i+1], arch)].sort().join(',')+']';
    // console.log(circuit[i], circuit[i+1], circuit[i+2], newGateArch);
    arch.push(newGateArch);
  }
  // console.log('arch', circuit, arch);
  if (arch.length === 0) {
    return '[]';
  }
  return arch[arch.length - 1];
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
    if (parseInt(a.split(':')[1]) !== parseInt(b.split(':')[1])) {
      return (parseInt(b.split(':')) - parseInt(a.split(':')[1]));
    }
    return ((a.split(':')[0] > b.split(':')[0]) ? 1 : -1);
  });

  if (typeof stats[funcArch] === 'undefined') {
    stats[funcArch]=[];
  }
  stats[funcArch].push(flag);
}
var statLines = [];
for (var statLine in stats) {
  statLines.push(statLine + ' ' + stats[statLine]);
}
// console.log(statLines);
console.log(statLines.sort((a, b) => {
  if (a.split(' ')[1].length != b.split(' ')[1].length) {
    //compare on number of functions that have this funcArch
    return a.split(' ')[1].length - b.split(' ')[1].length;
  } 
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
for (var flag=0; flag<256; flag++) {
  var str = flag.toString(2);
  while(str.length < 8) {
    str = '0' + str;
  }
  if (typeof read.perFlag[str] == 'undefined') {
    console.log('Missing', str);
  }
}

var fs = require('fs');

var numVars; //will be taken from argv by initalize
var numValuations;
var numFunctions;
var numInfosets;

// Value for these variables to be filled in by initialize function
var baseCircuits;
var minimalCircuitsThisSize;
var stack;
var perFlag;
var baseCircuitSize;
var lastBaseCircuitTried;

// An infoset is a subset of all n-to-1 functions which a given circuit can calculate.
// For instance, there are 16 functions from 2-to-1 Boolean variables:
//
// 0000 FALSE
// 0001 (A AND B)
// 0010 (A AND NOT(B))
// 0011 A
// 0100 (NOT(A) AND B)
// 0101 B
// 0110 (A XOR B)
// 0111 (A OR B)
// 1000 (A NOR B)
// 1001 (A NXOR B)
// 1010 NOT(B)
// 1011 (A OR NOT(B)
// 1100 NOT(A)
// 1101 (NOT(A) OR B)
// 1110 (A NAND B)
// 1111 TRUE
//
// The numbering of these functions is by their truth-table, for instance:
//
// A  B || (A AND NOT(B))
// =====||===============
// 0  0 ||  0
// 0  1 ||  0
// 1  0 ||  1
// 1  1 ||  0
//
// The truth table for (A AND NOT(B)) has 0,0,1,0 in its right-hand column, so that function's
// number is 0x0010 binary.
//
// Each circuit of NAND-gates calculates one function on each wire between a NAND-gate and
// the next, and the infoset of a NAND-gate circuit with n variables is defined as the
// 2^(2^n)-bit binary number where the i-th bit is 1 if the i-th function is calculated on
// at least one of the circuit's wires, and 0 otherwise.
// The i-th function is defined as the truth-table based numbering described above.
//
// A non-repeating circuit is one where no two wires in the circuit calculate the same function.
// A non-repeating circuit is represented as a concatenation of NAND-gate-descriptions. Each NAND-gate description
// is an array of two wire-numbers, and also adds a wire to the circuit itself.
// Initially, wires 0 and 1 are available as constants TRUE and FALSE, plus one wire per variable, in order (so wires
// 2,3,... are input variables). After that come the internal wires of the circuit, in order.
// So for instance [2,3,4,4] is the circuit where the first NAND-gate calculates WIRE[4] = (WIRE[2] NAND WIRE[3]),
// and the second gate calculates WIRE[5] = (WIRE[4] NAND WIRE[5]).
// The infoset calculated by the 2-to-1 circuit [2,3,4,4] is:
//   0123 4567 89AB CDEF
// 0x1001 0100 0000 0001   0000 FALSE, 0011 A, 0101 B, 1111 TRUE as calculated trivially by []
// 0x____ ____ ____ __1_   1110 (A NAND B) as calculated additionally by [2,3]
// 0x_1__ ____ ____ ____ + 0001 (A AND B) as calculated additionally by the second gate in [2,3,4,4]
// 0x1101 0100 0000 0011

function initialize() {
  try {
    numVars = parseInt(process.argv[2]);
  } catch(e) {
    numVars = 2;
    console.error('Defaulting numVars to 2, please specify it on the command line next time! :)');
  }
  numValuations = Math.pow(2, numVars);
  numFunctions = Math.pow(2, numValuations);
  numInfosets = Math.pow(2, numFunctions);
  var identityFuncs = {
    1: [1],
    2: [1+2, 1+4],
    3: [1+2+4+8, 1+2 + 16+32, 1 + 4 + 16 + 64],
    4: [1+2+4+8+16+32+64+128, 1+2 + 16+32 + 256+512 + 4096+8192, 1 + 4 + 16 + 64 + 256 + 1024 + 4096 + 16384],
  };
  var funcs = [];
  for (var i=0; i<numFunctions; i++) {
    funcs.push('0');
  }
  funcs[0] = 1; // FALSE
  funcs[numFunctions - 1] = 1; // TRUE
  for(var i=0; i<identityFuncs[numVars].length; i++) {
    funcs[identityFuncs[numVars][i]] = 1;
  }
  baseCircuits = [{
    infosetHex: bin2hex(funcs.join('')),
    circuit: [],
  }];
  console.log('Initialized baseCircuits', baseCircuits);

  perFlag = {
    1: {
      '00': [],
      '01': [],
      '11': [],
    },
    2: {
      '0000': [],
      '0011': [],
      '0101': [],
      '1111': [],
    },
    3: {
      '00000000': [],
      '00001111': [],
      '00110011': [],
      '01010101': [],
      '11111111': [],
    },
  }[numVars];

  // The empty circuit, [], already makes available 2+numVars wires, namely:
  // Note that [] is used as an object key there, which may be a bit cryptic,
  // but using arrays as object keys works well for storing stacks here.
  stack = {};
  stack[[]] = {
    1: [
      '00',
      '11',
      '01'
    ],
    2: [
      '0000',
      '1111',
      '0011',
      '0101',
    ],
    3: [
      '00000000',
      '11111111',
      '00001111',
      '00110011',
      '01010101',
    ],
    4: [
      '0000000000000000',
      '1111111111111111',
      '0000000011111111',
      '0000111100001111',
      '0011001100110011',
      '0101010101010101',
    ],
  }[numVars];
  minimalCircuitsThisSize = {};
  baseCircuitSize = 0;
  lastBaseCircuitTried = -1;
  readIn();
}

function readIn() {
  try {
    var read = JSON.parse(fs.readFileSync(`progress-${numVars}.json`));
    minimalCircuitsThisSize = read.minimalCircuitsThisSize;
    perFlag = read.perFlag;
    baseCircuits = read.baseCircuits;
    baseCircuitSize = read.baseCircuitSize;
    lastBaseCircuitTried = read.lastBaseCircuitTried;
  } catch(e) {
    console.error(`could not read from file progress-${numVars}.json`);
  }
};

var writeTo = 'even';
function writeOut() {
  var str = JSON.stringify({
    lastBaseCircuitTried,
    perFlag,
    baseCircuits,
    minimalCircuitsThisSize,
    baseCircuitSize,
  }, null, 2);
  fs.writeFileSync(`progress-${numVars}-${writeTo}.json`, str);
  if (writeTo === 'even') {
    writeTo = 'odd';
  } else {
    writeTo = 'even';
  }
}

function addGate(toCircuit, leftWire, rightWire) {
  return toCircuit.concat([leftWire, rightWire]);
}

function bitNAND(left, right) {
  if (left === '1' && right === '1') {
    return '0';
  }
  return '1';
}

function NAND(leftValuation, rightValuation) {
  var res = '';
  for (var i=0; i<leftValuation.length; i++) {
    res += bitNAND(leftValuation[i], rightValuation[i]);
  }
  return res;
}

function getStack(circuit) {
  if (typeof stack[circuit] === 'undefined') {
    var addedGate = circuit.slice(circuit.length - 2);
    var baseCircuit = circuit.slice(0, circuit.length -2);
    var baseStack = getStack(baseCircuit);
    var addedLeftInput = baseStack[addedGate[0]];
    var addedRightInput = baseStack[addedGate[1]];
    // console.log('added', baseStack, addedGate, addedLeftInput, addedRightInput);
    var addedValuation = NAND(addedLeftInput, addedRightInput);
    stack[circuit] = baseStack.concat(addedValuation);
  }
  return stack[circuit];
}

function circuitOutput(circuit) {
  var circuitVars = getStack(circuit);
  return circuitVars[circuitVars.length -1];
}

function flagPos(wire) {
  return parseInt(wire, 2);
}

function addWire(infosetBin, wire) {
  var pos = flagPos(wire);
  res = infosetBin.substring(0, pos) + '1' + infosetBin.substring(pos+1);
  return res;
}

function cascade(promises) {
  var thisPromise = promises.shift();
  return thisPromise.then(() => {
    if (promises.length) {
      return new Promise(resolve => {
        setTimeout(() => {
          cascade(promises).then(resolve);
        }, 0);
      });
    }
  });
}

function tryout(infosetBin, baseCircuit, leftWire, rightWire) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // console.log(`tryout(${infosetBin}, ${baseCircuit}, ${leftWire}, ${rightWire})`);
      var proposedCircuit = addGate(baseCircuit, leftWire, rightWire);
      var addedWire = circuitOutput(proposedCircuit);
      var possiblyUseful = (infosetBin[flagPos(addedWire)] === '0');
      // console.log(proposedCircuit, addedWire, possiblyUseful);
      if (possiblyUseful) {
        var newInfosetBin = addWire(infosetBin, addedWire);
        var newInfosetHex = bin2hex(newInfosetBin);
        // console.log(newInfosetBin, newInfosetHex);
        if (typeof minimalCircuitsThisSize[newInfosetHex] === 'undefined') { // actually useful, not just possibly :)
          minimalCircuitsThisSize[newInfosetHex] = proposedCircuit;
          if (!perFlag[addedWire]) {
            perFlag[addedWire] = proposedCircuit;
            writeOut();
            console.log(`${Object.keys(perFlag).length}: Added ${proposedCircuit} for ${addedWire}.`);
          }
        }
      }
      resolve();
    }, 0);
  });
}

function convert(str, from, to, fromStep, pad) {
  var res = '';
  for (var i=0; i<str.length; i+=fromStep) {
    var fromChunk = str.substring(i, i+fromStep);
    var toChunk = parseInt(fromChunk, from).toString(to);
    var toChunkPadded = (pad + toChunk).slice(-pad.length);
    res += toChunkPadded;
  }
  return res;
}

function hex2bin(hex) {
  return convert(hex, 16, 2, 1, '0000');
}

function bin2hex(bin) {
  return convert(bin, 2, 16, 4, '0');
}

function circuitSizeUp() {
  baseCircuits = [];
  for (var infosetHex in minimalCircuitsThisSize) {
    baseCircuits.push({
      infosetHex,
      circuit: minimalCircuitsThisSize[infosetHex]
    });
  }

  baseCircuits = baseCircuits.sort((a, b) => {
    return (parseInt(a.infosetHex, 16) > parseInt(b.infosetHex, 16));
  });

  minimalCircuitsThisSize = {};
  baseCircuitSize++;
  lastBaseCircuitTried = -1;
}

function sweep() {
  if (Object.keys(perFlag).length === numFunctions) {
    console.log('No more sweep needed');
    return Promise.resolve();
  }
  console.log('sweep start');
  var promises = [];
  var infosetHex = baseCircuits[lastBaseCircuitTried + 1].infosetHex;
  var baseCircuit = baseCircuits[lastBaseCircuitTried + 1].circuit;
  var infosetBin = hex2bin(infosetHex);
  // console.log(`Infoset is ${infosetHex}`);

  var numWires = 2 + numVars + baseCircuit.length/2;
  for (var leftWire = 0; leftWire < numWires; leftWire++) {
    for (var rightWire = leftWire; rightWire < numWires; rightWire++) {
      promises.push(tryout(infosetBin, baseCircuit, leftWire, rightWire));
    }
  }
  console.log('Starting cascade');
  return cascade(promises).then(() => {
    console.log('After cascade, calling next sweep');
    lastBaseCircuitTried++;
    if (lastBaseCircuitTried === baseCircuits.length - 1) {
      circuitSizeUp();
    }
    writeOut();
    return sweep();
  });
}

//...
initialize();

sweep().then(() => {
  console.log(minimalCircuitsThisSize);
  console.log(perFlag);
}, err => {
  console.error(err);
});

var fs = require('fs');
var readline = require('readline');

var numVars = 3;
var numValuations = Math.pow(2, numVars);
var numFunctions = Math.pow(2, numValuations - 1); // we don't consider functions that start with 1, so for 3 vars, 01111111 is the highest
// 128 64 32 16 8 4 2 1
//              * * * * 15 A
//         *  *     * * 51 B
//      *     *   *   * 85 C
// circuits are grouped by the stack of wires they provide
// all wires are signed so that they're zero if all inputs are zero,
// and represented by the sum of input valuations for which they are one.
var circuits = [
  {
    stack: [15, 51, 85],
    circuit: [],
  }
];

// gates are signed so their output is zero if both inputs are,
// and represented by the list of input valuations for which their output
// is one.
var gateDefs = [// different from 00:
  { left: true, right: true, both: false },   // 0110
  { left: true, right: true, both: true },    // 0111
  { left: true, right: false, both: false },  // 0100
  { left: false, right: true, both: false },  // 0010
  { left: false, right: false, both: true },  // 0001
];

var gates = [];

function hasFlag(wire, valuation) {
  var bitSig = Math.pow(2, numValuations - valuation - 1);
  return ((wire % (2*bitSig)) >= bitSig);
}

// left, right range from 0 to 127
// gateI ranges from 0 to 4
function outputFor(left, right, gateI) {
  var outputSum = 0;
  for (var valuation=1; valuation<numValuations; valuation++) {
    var leftIsOne = hasFlag(left, valuation);
    var rightIsOne = hasFlag(right, valuation);
    var outputIsOne = (leftIsOne ?
      rightIsOne ? gateDefs[gateI].both : gateDefs[gateI].left :
      rightIsOne ? gateDefs[gateI].right : false);
    if (outputIsOne) {
      outputSum += Math.pow(2, numValuations - valuation - 1);
    }
  }
  return outputSum;
}

function genGates() {
  for (var gateI=0; gateI<gateDefs.length; gateI++) {
    var res = [];
    for (var left = 0; left<numFunctions; left++) {
      var leftRes = [];
      for (var right = 0; right<numFunctions; right++) {
        leftRes.push(outputFor(left, right, gateI));
      }
      res.push(leftRes);
    }
    gates.push(res);
  }
}

function applyGate(left, right, gateI) {
  return gates[gateI][left][right];
}

function addGate(circuitI, left, right, gateI) {
  var baseStack = circuits[circuitI].stack;
  // console.log('addGate', baseStack, left, right, gateI);
  var leftWire = baseStack[left];
  var rightWire = baseStack[right];
  var outWire = applyGate(leftWire, rightWire, gateI);
  var haveAlready = false;
  // console.log(baseStack, leftWire, rightWire, 'outWire', outWire);
  baseStack.map(wire => {
    if (wire === outWire) {
      haveAlready = true;
    }
  }); 
  if (haveAlready) {
    return false;
  }
  var newStack = baseStack.slice(0); // clone
  newStack.push(outWire);
  var sortedNewStack = newStack.slice(0); // clone
  sortedNewStack.sort((a, b) => {
    return parseInt(a) - parseInt(b)
  });
  if (typeof newCircuits[newStack] === 'undefined') {
    var newCircuit = circuits[circuitI].circuit.slice(0); // clone
    newCircuit.push([left, right, gateI]);
    newCircuits[sortedNewStack] = { newStack, newCircuit };
  }
}

function readIn(callback) {
  try {
    var stream = fs.createReadStream('circuits.txt');
    stream.on('error', function(err) {
      console.error('Could not open circuits.txt');
      callback();
    });
    var lineReader = readline.createInterface({
      input: stream
    });

    var foundUnreadableLine = false;
    circuitsRead = [];
    lineReader.on('line', function (line) {
      var circuit;
      try {
        circuit = JSON.parse(line);
      } catch (e) {
        foundUnreadableLine = true;
      }
      circuitsRead.push(circuit);
    });
    lineReader.on('close', function() {
      if (foundUnreadableLine) {
        console.error('Found unreadable line in circuits.txt');
      } else {
        circuits = circuitsRead;
      }
      callback();
    });
  } catch(e) {
    console.error('Could not read circuits.txt');
    lineReader.on('close', function() {
      callback();
    });
  }
}

function writeOut() {
  var stream = fs.createWriteStream('circuits.txt');
  stream.once('open', function() {
    for(var sortedStack in newCircuits) {
      var line = JSON.stringify({
//        have: sortedStack,
        stack: newCircuits[sortedStack].newStack,
        circuit: newCircuits[sortedStack].newCircuit
      }) + '\n';
      // console.log(line);
      stream.write(line);
    }
    stream.end();
  });
}

// ...
console.log('Generating lookup table...');
genGates();
console.log('Reading in current circuits...');

var newCircuits = {};
readIn(function() {
  console.log('Enumerating circuits with one gate added...');
  for (var circuitI=0; circuitI<circuits.length; circuitI++) {
    for (var gateI=0; gateI<gateDefs.length; gateI++) {
      for (var left=0; left<circuits[circuitI].circuit.length+numVars; left++) {
        for (var right=left+1; right<circuits[circuitI].circuit.length+numVars; right++) {
          addGate(circuitI, left, right, gateI);
        }
      }
    }
  }
  console.log('Writing out new circuits...');
  writeOut();
  console.log('Done.');
});

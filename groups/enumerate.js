var fs = require('fs');
var readline = require('readline');

var numVars = parseInt(process.argv[2]);
var numValuations = Math.pow(2, numVars);
var numFunctions = Math.pow(2, numValuations - 1); // we don't consider functions that start with 1, so for 3 vars, 01111111 is the highest

var circuitSize = parseInt(process.argv[3]);
var circuits;

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

function applyGate(left, right, gateI) {
  return outputFor(left, right, gateI);
}

function addGate(circuitI, left, right, gateI) {
  var baseStack = circuits[circuitI].stack;
  var leftWire = baseStack[left];
  var rightWire = baseStack[right];
  var outWire = applyGate(leftWire, rightWire, gateI);
  var haveAlready = (outWire === 0); // FALSE and TRUE are presumed globally available, but of these only circuits that output FALSE
                                     // will be enumerated, because all wires are signed so that outputting TRUE is impossible
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
    var stream = fs.createReadStream(`circuits-${numVars}-${circuitSize-1}.txt`);
    stream.on('error', function(err) {
      console.error(`Could not open circuits-${numVars}-${circuitSize-1}.txt`);
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
        console.error(`Found unreadable line in circuits-${numVars}-${circuitSize-1}.txt`);
      } else {
        circuits = circuitsRead;
      }
      callback();
    });
  } catch(e) {
    console.error(`Could not read circuits-${numVars}-${circuitSize-1}.txt`);
    lineReader.on('close', function() {
      callback();
    });
  }
}

function writeOut() {
  var stream = fs.createWriteStream(`circuits-${numVars}-${circuitSize}.txt`);
  stream.once('open', function() {
    for(var sortedStack in newCircuits) {
      var line = JSON.stringify({
        stack: newCircuits[sortedStack].newStack,
        circuit: newCircuits[sortedStack].newCircuit
      }) + '\n';
      stream.write(line);
    }
    stream.end();
  });
}

// ...
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

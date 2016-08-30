var numVars = 3;
var numValuations = Math.pow(2, numVars);
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

function outputFor(left, right, gate) {
  var outputSum = 0;
  for (var valuation=1; valuation<numValuations; valuation++) {
    var leftIsOne = hasFlag(left, valuation);
    var rightIsOne = hasFlag(right, valuation);
    var outputIsOne = (leftIsOne ?
      rightIsOne ? gateDefs[gate].both : gateDefs[gate].left :
      rightIsOne ? gateDefs[gate].right : false);
    console.log('valuation', valuation, leftIsOne, rightIsOne, outputIsOne);
    if (outputIsOne) {
      outputSum += Math.pow(2, numValuations - valuation - 1);
      console.log('outputSum increased to', outputSum);
    }
  }
  return outputSum;
}

function genGates() {
  for (var gate=0; gate<gateDefs.length; gate++) {
    var res = [];
    for (var left = 0; left<numValuations; left++) {
      var leftRes = [];
      for (var right = 0; right<numValuations; right++) {
        leftRes.push(outputFor(left, right, gate));
      }
      res.push(leftRes);
    }
    gates.push(res);
  }
}

function applyGate(leftGroup, rightGroup, gate) {
  var gateOutputsOneIf = {
    rightOnly: (gate.indexOf(1) !== -1), // 01
    leftOnly: (gate.indexOf(2) !== -1),  // 10
    both: (gate.indexOf(3) !== -1),  // 11
  };
  var output = [];
  var walkerL = 0;
  var walkerR = 0;
  while (true) {
    var walkLeft = true;
    var walkRight = true;
    console.log('walking', leftGroup, rightGroup, walkerL, walkerR);
    if (leftGroup[walkerL] > rightGroup[walkerR]) {
      console.log(rightGroup[walkerR], 'right only');
      if (gateOutputsOneIf.rightOnly) {
        console.log(gate, gateOutputsOneIf, 'pushing');
        output.push(rightGroup[walkerR]);
      }
      walkLeft = false;
    } else if (leftGroup[walkerL] < rightGroup[walkerR]) {
      console.log(leftGroup[walkerL], 'left only');
      if (gateOutputsOneIf.leftOnly) {
        console.log(gate, gateOutputsOneIf, 'pushing');
        output.push(leftGroup[walkerL]);
      }
      walkRight = false;
    } else {
      console.log(rightGroup[walkerR], 'both');
      if (gateOutputsOneIf.both) {
        console.log(gate, gateOutputsOneIf, 'pushing');
        output.push(rightGroup[walkerR]);
      }
    }
    if (walkLeft) {
      walkerL++;
    }
    if (walkRight) {
      walkerR++;
    }
    if ((walkerL === leftGroup.length) || (walkerR === rightGroup.length)) {
      break;
    }
  }
  console.log('breaked', walkerL, walkerR, gateOutputsOneIf);
  if (gateOutputsOneIf.leftOnly) {
    // add any remaining left-onlies
    for (; walkerL < leftGroup.length; walkerL++) {
      console.log('adding left', leftGroup[walkerL]);
      output.push(leftGroup[walkerL]);
    }
  }
  if (gateOutputsOneIf.rightOnly) {
    // add any remaining right-onlies
    for (; walkerR < rightGroup.length; walkerR++) {
      console.log('adding right', rightGroup[walkerR]);
      output.push(rightGroup[walkerR]);
    }
  }
  return output;
}

function addGate(circuitI, left, right, gate) {
  var baseStack = circuits[circuitI].stack;
  console.log('addGate', baseStack, left, right, gate);
  var leftWire = baseStack[left];
  var rightWire = baseStack[right];
  var outWire = applyGate(leftWire, rightWire, gate);
  var haveAlready = false;
  console.log(baseStack, leftWire, rightWire, 'outWire', outWire);
  baseStack.map(wire => {
    if (wire.join(',') === outWire.join(',')) {
      haveAlready = true;
    }
  }); 
  if (haveAlready) {
    return false;
  }
  var newStack = baseStack.slice(0); // clone
  newStack.push(outWire);
  // FIXME: ordering the stack is good for preventing duplicates,
  // but it messes up when you want to add a second gate that uses
  // the output of the first gate, and this is move from its position
  // in the stack.
  newStack.sort((a, b) => {
    for (var i=0; i<a.length && i<b.length; i++) {
      if (a[i] - b[i]) {
        return a[i] > b[i];
      }
    }
    return a.length - b.length;
  });
  if (typeof newCircuits[newStack] === 'undefined') {
    var newCircuit = circuits[circuitI].circuit.slice(0); // clone
    newCircuit.push([left, right, gate]);
    newCircuits[newStack] = newCircuit;
  }
}

console.log(outputFor(15, 51, 4));

// var newCircuits = {};
// for (var circuitI=0; circuitI<circuits.length; circuitI++) {
//   for (var gateI=0; gateI<gates.length; gateI++) {
//     for (var left=0; left<circuits[circuitI].circuit.length+numVars; left++) {
//       for (var right=left+1; right<circuits[circuitI].circuit.length+numVars; right++) {
//         addGate(circuitI, left, right, gates[gateI]);
//       }
//     }
//   }
// }
// console.log(newCircuits);

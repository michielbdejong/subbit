var numVars = 3;
// 01234567
// ****
// **  **
// * * * *
// circuits are grouped by the stack of wires they provide
// all wires are signed so that they're zero if all inputs are zero,
// and represented by the list of input valuations for which they are one.
var circuits = [
  {
    stack: [[1,3,5,7], [2,3,6,7], [4,5,6,7]],
    circuit: [],
  }
];

// gates are signed so their output is zero if both inputs are,
// and represented by the list of input valuations for which their output
// is one.
var gates = [// different from 00:
  [1,2],   // 0110
  [1,2,3], // 0111
  [1],     // 0100
  [2],     // 0010
  [3],     // 0001
];

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

function addGate(baseStack, left, right, gate) {
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
  newStack.sort((a, b) => {
    for (var i=0; i<a.length && i<b.length; i++) {
      if (a[i] - b[i]) {
        return a[i] > b[i];
      }
    }
    return a.length - b.length;
  });
  return newStack;
}

console.log(addGate(circuits[0].stack, 0, 1, gates[0]));

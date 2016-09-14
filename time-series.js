var gateFunc = {
  '0000': () => false,
  '0001': (l, r) => (l && r),
  '0010': (l, r) => (l && !r),
  '0011': (l) => l,
  '0100': (l, r) => (!l && r),
  '0101': (dummy, r) => r,
  '0110': (l, r) => (l ? !r : r),
  '0111': (l, r) => (l || r),
  '1000': (l, r) => (!l && !r),
  '1001': (l, r) => (l ? r : !r),
  '1010': (dummy, r) => !r,
  '1011': (l, r) => (l || !r),
  '1100': (l) => !l,
  '1101': (l, r) => (!l || r),
  '1110': (l, r) => (!l || !r),
  '1111': () => true,
};
// console.log(Object.keys(gateFunc));

var trans = {};

function applyGate(state, gate) {
  var [left, right, gateFuncIndex] = gate;
  return (gateFunc[gateFuncIndex](state[left] === '1', state[right] === '1') ?
    '1' : '0');
}

function stepCircuit(state, circuit) {
  // console.log('stepCircuit', state, circuit);
  var res = state.slice(0,2);
  for (var i=0; i<circuit.length; i++) {
    res.push(applyGate(state, circuit[i]));
  }
  return res;
}

function calcTrans(state, circuit) {
  var firstSweep = stepCircuit(state, circuit);
  var secondSweep = stepCircuit(firstSweep, circuit);
  for (var i=0; i<firstSweep.length; i++) {
    if (secondSweep[i] !== firstSweep[i]) {
      return null;
    }
  }
  return firstSweep;
}

function isGlitchlessAnswer(seq) {
  if (seq.length < 2) {
    return false;
  }
  var last = seq[seq.length-1];
  var before = seq[seq.length-2];
  var clkChan = last.length-1;
  var outChan = last.length-2;
  return ((last[outChan] === before[outChan]) && last[clkChan] === '1' && before[clkChan] === '0');
}

// function propagate(state, circuit) {
//   // console.log('propagate', state, circuit);
//   if (typeof trans[state.join('')] === 'undefined') {
//     trans[state.join('')] = calcTrans(state, circuit);
//   }
//   return trans[state.join('')];
// }

// For input sequence [A, B, C, D], INP and CLK go as follows:
// INP: A
// CLK: 0
// INP: A A B B
// CLK: 0 1 1 0
// INP: A A B B B C C
// CLK: 0 1 1 0 1 1 0
// INP: A A B B B C C C D D
// CLK: 0 1 1 0 1 1 0 1 1 0
// t:   1 2 3 4 5 6 7 8 9 10
// INP = inputSequence[Math.floor(t/3)]
// CLK = (t % 3 === 1) ? '1' : '0'
// for (var t=1; t < inputSequence.length*3-1; t++)
function calcCircuit(inputSequence, circuit) {
  var state = new Array(circuit.length+2).fill('0');
  var outputSequence = [];
  for (var t=1; t<inputSequence.length*3-2; t++) {
    state[0] = inputSequence[Math.floor(t/3)];
    state[1] = (t % 3 === 1) ? '0' : '1';
    // console.log('propagating', t, state.slice(0, 2));
    state = calcTrans(state, circuit);
    // console.log(t, state);
    if (state === null) {
      return null;
    }
    outputSequence.push(state);
    if (isGlitchlessAnswer(outputSequence)) {
      return state[state.length-2];
    }
  }
  // output should come immediately once input sequence has completed
  return null;
}

var numGates = 2;
var numWires = 2+numGates;

function forAllGates(cb) {
  for (var left=0; left<numWires; left++) {
    for (var right=0; right<numWires; right++) {
      var funcs = Object.keys(gateFunc);
      for (var i=0; i<funcs.length; i++) {
        // console.log(left, right, funcs[i]);
        cb([left, right, funcs[i]]);
      }
    }
  }
}

function forAllCircuits(cb, baseCircuit) {
  forAllGates(gate => {
    var thisCircuit = baseCircuit.slice(0);
    thisCircuit.push(gate);
    if (thisCircuit.length === numGates) {
      cb(thisCircuit);
    } else {
      forAllCircuits(cb, thisCircuit);
    }
  });
}
  
var minimal = {};
forAllCircuits(circuit => {
  var out = [
    calcCircuit(['0', '0'], circuit),
    calcCircuit(['0', '1'], circuit),
    calcCircuit(['1', '0'], circuit),
    calcCircuit(['1', '1'], circuit),
  ];
  // console.log(circuit, out);
  if (out[0] !== null && out[1] !== null && out[2] !== null && out[3] !== null) {
    out = out.join(' ');
    if (typeof minimal[out] === 'undefined') {
      minimal[out] = circuit;
    }
  }
}, []);
console.log(minimal);

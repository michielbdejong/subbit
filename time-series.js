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

var trans = {};

function applyGate(state, gate) {
  var [left, right, gateFuncIndex] = gate;
  return (gateFunc[gateFuncIndex](state[left] === '1', state[right] === '1') ?
    '1' : '0');
}

function stepCircuit(state, circuit) {
  console.log('stepCircuit', state, circuit);
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
    if (secondSweep[i] != firstSweep[i]) {
      return null;
    }
  }
  return firstSweep;
}

function propagate(state, circuit) {
  console.log('propagate', state, circuit);
  if (typeof trans[state.join('')] === 'undefined') {
    trans[state.join('')] = calcTrans(state, circuit);
  }
  return trans[state.join('')];
}

// For input sequence [A, B, C, D], INP and CLK go as follows:
// INP: A A B B B C C C D D
// CLK: 0 1 1 0 1 1 0 1 1 0
// t:   1 2 3 4 5 6 7 8 9 10
// INP = inputSequence[Math.floor(t/3)]
// CLK = (t % 3 === 1) ? '1' : '0'
// for (var t=1; t < inputSequence.length*3-1; t++)
function calcCircuit(inputSequence, circuit) {
  var state = new Array(circuit.length+2).fill('0');

  for (var t=1; t<inputSequence.length*3-1; t++) {
    state[0] = inputSequence[Math.floor(t/3)];
    state[1] = (t % 3 === 1) ? '0' : '1';
    console.log('propagating', t, state.slice(0, 2));
    state = propagate(state, circuit);
    console.log(t, state);
    if (state === null) {
      return null;
    }
    if (state[state.length-1] === '1') {
      return state[state.length-2];
    }
  }
}

console.log(calcCircuit(['0', '1'], [[0, null, '1100'], [1, null, '0011']]));

var fs = require('fs');
var readline = require('readline');

var numVars = parseInt(process.argv[2]);
var numValuations = Math.pow(2, numVars);  // for 3 vars, 8 - 000-111
var numFlags = Math.pow(2, numValuations-1) - 1; // for 3 vars, 2^7-1=127 - 00000001 - 01111111

function readIn(callback) {
  try {
    var stream = fs.createReadStream(`circuits-${numVars}.txt`);
    stream.on('error', function(err) {
      console.error(`Could not open circuits-${numVars}.txt`);
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
        console.error(`Found unreadable line in circuits-${numVars}.txt`);
      } else {
        circuits = circuitsRead;
      }
      callback();
    });
  } catch(e) {
    console.error(`Could not read circuits-${numVars}.txt`);
    lineReader.on('close', function() {
      callback();
    });
  }
}

// ...
console.log('Reading in current circuits...');
readIn(function() {
  console.log('Counting circuits...');
  var perFlag = {};
  for (var circuitI=0; circuitI<circuits.length; circuitI++) {
    var thisCircuit = circuits[circuitI].circuit;
    var thisStack = circuits[circuitI].stack;
    for (var wireI=0; wireI<thisStack.length; wireI++) {
      if (typeof perFlag[thisStack[wireI]] === 'undefined') {
        perFlag[thisStack[wireI]] = thisCircuit.slice(0, wireI - numVars + 1);
      }
    }
  }
  console.log(perFlag);
  for (var flag = 1; flag<=numFlags; flag++) {
    if (typeof perFlag[flag] === 'undefined') {
      console.log('Missing', flag);
    }
  }
  console.log(`Number of flags covered: ${Object.keys(perFlag).length} / ${numFlags}`);
  console.log('Done.');
});

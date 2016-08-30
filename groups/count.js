var fs = require('fs');
var readline = require('readline');

var numVars = parseInt(process.argv[2]);
var numValuations = Math.pow(2, numVars);  // for 3 vars, 8 - 000-111
var numFlags = Math.pow(2, numValuations-1) - 1; // for 3 vars, 2^7-1=127 - 00000001 - 01111111

var maxCircuitSize = parseInt(process.argv[3]);
var perFlag = {};

function readIn(circuitSize, callback) {
  
  if (circuitSize > maxCircuitSize) {
    callback();
    return;
  }
  try {
    console.log(`Reading circuits-${numVars}-${circuitSize}.txt`);
    var stream = fs.createReadStream(`circuits-${numVars}-${circuitSize}.txt`);
    stream.on('error', function(err) {
      console.error(`Could not open circuits-${numVars}-${circuitSize}.txt`);
    });
    var lineReader = readline.createInterface({
      input: stream
    });

    var foundUnreadableLine = false;
    lineReader.on('line', function (line) {
      var obj;
      try {
        obj = JSON.parse(line);
      } catch (e) {
        foundUnreadableLine = true;
      }
      for (var wireI=0; wireI<obj.stack.length; wireI++) {
        if (typeof perFlag[obj.stack[wireI]] === 'undefined') {
          perFlag[obj.stack[wireI]] = obj.circuit.slice(0, wireI - numVars + 1);
        }
      }
    });
    lineReader.on('close', function() {
      console.log(`Have ${Object.keys(perFlag).length} circuits now`);
      if (foundUnreadableLine) {
        console.error(`Found unreadable line in circuits-${numVars}-${circuitSize}.txt`);
        return;
      }
      readIn(circuitSize + 1, callback);
    });
  } catch(e) {
    console.error(`Could not read circuits-${numVars}-${circuitSize}.txt`);
  }
}

// ...
console.log('Reading in current circuits...');
readIn(0, function() {
  console.log('Counting circuits...');
  // for (var flag = 1; flag<=numFlags; flag++) {
  //   if (typeof perFlag[flag] === 'undefined') {
  //     console.log('Missing', flag);
  //   }
  // }
  console.log(`Number of flags covered: ${Object.keys(perFlag).length} / ${numFlags}`);
  console.log('Done.');
});

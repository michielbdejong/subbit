var fs = require('fs');
var readline = require('readline');

var numVars = parseInt(process.argv[2]);
var numValuations = Math.pow(2, numVars);
var numFunctions = Math.pow(2, numValuations - 1); // we don't consider functions that start with 1, so for 3 vars, 01111111 is the highest

var circuitSize = parseInt(process.argv[3]);
var circuits;

function readIn(callback) {
  try {
    var stream = fs.createReadStream(`circuits-${numVars}-${circuitSize}.txt`);
    stream.on('error', function(err) {
      console.error(`Could not open circuits-${numVars}-${circuitSize}.txt`);
    });
    var lineReader = readline.createInterface({
      input: stream
    });

    var foundUnreadableLine = false;
    circuits = {};
    lineReader.on('line', function (line) {
      var obj;
      try {
        obj = JSON.parse(line);
      } catch (e) {
        foundUnreadableLine = true;
      }
      var sortedStack = obj.stack.slice(0); // clone
      sortedStack.sort((a, b) => {
        return parseInt(a) - parseInt(b)
      });
      if (typeof circuits[sortedStack] === 'undefined') {
        circuits[sortedStack] = obj;
      }
    });
    lineReader.on('close', function() {
      if (foundUnreadableLine) {
        console.error(`Found unreadable line in circuits-${numVars}-${circuitSize}.txt`);
      } else {
        callback();
      }
    });
  } catch(e) {
    console.error(`Could not read circuits-${numVars}-${circuitSize}.txt`);
  }
}

function writeOut() {
  var stream = fs.createWriteStream(`circuits-${numVars}-${circuitSize}.txt`);
  stream.once('open', function() {
    for(var sortedStack in circuits) {
      var line = JSON.stringify(circuits[sortedStack]) + '\n';
      stream.write(line);
    }
    stream.end();
  });
}

// ...
console.log('Reading in current circuits...');
var newCircuits = {};
readIn(function() {
  console.log('Writing out non-dupe circuits...');
  writeOut();
  console.log('Done.');
});

var fs = require('fs');
var progressStatus = {
  '-odd': {
    baseCircuitSize: 0,
    lastBaseCircuitTried: -1,
  },
  '-even': {
    baseCircuitSize: 0,
    lastBaseCircuitTried: -1,
  },
  '': {
    baseCircuitSize: 0,
    lastBaseCircuitTried: -1,
  }
};

for (var fileSuffix in progressStatus) {
  try {
    var read = JSON.parse(fs.readFileSync(`progress-3${fileSuffix}.json`));
    progressStatus[fileSuffix].baseCircuitSize = read.baseCircuitSize;
    progressStatus[fileSuffix].lastBaseCircuitTried = read.lastBaseCircuitTried;
  } catch (e) {
  }
}

console.log(progressStatus);

var best = '-odd';
if (progressStatus['-even'].baseCircuitSize > progressStatus['-odd'].baseCircuitSize) {
  best = '-even';
} else if ((progressStatus['-even'].baseCircuitSize = progressStatus['-odd'].baseCircuitSize) &&
           (progressStatus['-even'].lastBaseCircuitTried > progressStatus['-odd'].lastBaseCircuitTried)) {
  best = '-even';
}
console.log(`Best is ${best}`);
fs.unlink('progress-3.json', function(err) {
  console.log('unliked', err);
  fs.rename(`progress-3${best}.json`, 'progress-3.json', function(err) {
    console.log('renamed', err);
  });
});


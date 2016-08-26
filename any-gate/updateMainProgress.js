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
    var read = JSON.parse(fs.readFileSync(`progress-3-basics${fileSuffix}.json`));
    progressStatus[fileSuffix].baseCircuitSize = read.baseCircuitSize;
    progressStatus[fileSuffix].lastBaseCircuitTried = read.lastBaseCircuitTried;
  } catch (e) {
  }
}

console.log(progressStatus);

var best = '';
if (progressStatus['-odd'].baseCircuitSize > progressStatus[best].baseCircuitSize) {
  best = '-odd';
} else if ((progressStatus['-odd'].baseCircuitSize = progressStatus[best].baseCircuitSize) &&
           (progressStatus['-odd'].lastBaseCircuitTried > progressStatus[best].lastBaseCircuitTried)) {
  best = '-odd';
}
if (progressStatus['-even'].baseCircuitSize > progressStatus[best].baseCircuitSize) {
  best = '-even';
} else if ((progressStatus['-even'].baseCircuitSize = progressStatus[best].baseCircuitSize) &&
           (progressStatus['-even'].lastBaseCircuitTried > progressStatus[best].lastBaseCircuitTried)) {
  best = '-even';
}
console.log(`Best is ${best}`);
if (best !== '') {
  ['basics', 'perFlag', 'circuits'].map(part => {
    fs.unlink(`progress-3-${part}.json`, function(err) {
      console.log('unliked', err);
      fs.rename(`progress-3-${part}${best}.json`, `progress-3-${part}.json`, function(err) {
        console.log('renamed', err);
      });
    });
  });
}

(function () {
  var fs = require('fs');
  var Flow = require('../lib/flow.js').Flow;
  var now = (new Date()).toString();

  // Callback style
  fs.writeFile('tmp/file.txt', now, function (err) {
    if (err) {
      console.log('error', err);
      return;
    }
    fs.readFile('tmp/file.txt', 'utf8', function (err, data) {
      if (err) {
        console.log('error', err);
        return;
      }
      fs.unlink('tmp/file.txt', function (err) {
        if (err) {
          console.log('error', err);
          return;
        }
        console.log('complete');
      });
    });
  });

  // Flow style
  var root = Flow.serial(
    function (flow) {
      fs.writeFile('tmp/file.txt', now, flow.next);
    },
    function (flow) {
      fs.readFile('tmp/file.txt', 'utf8', flow.next);
    },
    function (flow, data) {
      fs.unlink('tmp/file.txt', flow.next);
    }
  );
  root.onError = function (err) {
    console.log('error', err);
  };
  root.onComplete = function () {
    console.log('complete');
  };
  root.start();
})();

(function () {
  var fs = require('fs');
  var Flow = require('../lib/flow.js').Flow;
  var now = (new Date()).toString();
  var file = 'temp/file.txt';

  // Callback style
  fs.writeFile(file, now, function (err) {
    if (err) {
      console.log('error', err);
      return;
    }
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
        console.log('error', err);
        return;
      }
      fs.unlink(file, function (err) {
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
      fs.writeFile(file, now, flow.next);
    },
    function (flow) {
      fs.readFile(file, 'utf8', flow.next);
    },
    function (flow, data) {
      console.log(data);
      fs.unlink(file, flow.next);
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

(function () {
  var mongoose = require('mongoose');
  var Flow = require('../lib/flow.js').Flow;
  var now = new Date();

  mongoose.connect('mongodb://localhost/node_flow');
  mongoose.model(
    'Example',
    new mongoose.Schema({
      date: Date
    })
  );
  var Example = mongoose.model('Example');

  // Callback style
  var example = new Example({
    date: now
  });
  example.save(function (err) {
    if (err) {
      console.log('error', err);
      return;
    }
    Example.find({}, [], function (err, examples) {
      if (err) {
        console.log('error', err);
        return;
      }
      console.log(examples);
      console.log('complete');
    })
  });

  // Flow style
  var root = Flow.serial(
    function (flow) {
      var example = new Example({
        date: now
      });
      example.save(flow.next);
    },
    function (flow) {
      Example.find({}, [], flow.next);
    },
    function (flow, examples) {
      console.log(examples);
      flow.next();
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

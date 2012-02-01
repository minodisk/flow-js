# flow.js
Asynchronous flow-control (serial, parallel, repeat, wait, function) module for Node.js, RequireJS, and browser.

## Installation (Node.js)

    $ npm install nestableflow

## Inspired
* [東京Node学園#1「非同期プログラミングの改善」のエッセンス](http://www.slideshare.net/koichik/node1)
* [BetweenAS3/en - Spark project](http://www.libspark.org/wiki/BetweenAS3/en)

## Features
* Nesting flow.
* Group error handlers together in one handler.

## Definition
* **flow** - Instance of `Flow`. The block of process contains some flow or function.
* **actor** - Instance of `Flow` or `Function`. The components making up a flow.

## API Documentation

### Class Methods
* **serial(actor\[, actor, ...\])** - \[static\] Create serial flow with arguments of actor. (suger)
* **serialActors(actors)** - \[static\] Create serial flow with array of actor.
* **parallel(actor\[, actor, ...\])** - \[static\] Create parallel flow with arguments of actor. (suger)
* **parallelActors(actors)** - \[static\] Create parallel flow with array of actor.
* **repeat(actor, repeatCount)** - \[static\] Repeat actor.
* **wait(delay)** - \[static\] Create an actor that contains timer.

### Member Properties
* **currentPhase** - Indicates the number of actor that is running now.
* **totalPhase** - Indicates the total number of actors in the flow.

### Member Methods
* **start()** - Starts the flow, if it is not already running.
* **next()** - Takes the flow into its next actor.
* **stop()** - Stops the flow.
* **reset()** - Stops the flow, if it is running, and sets the currentPhase property back to 0.

### Event Handlers
* **onError** - Calls when arguments of callback have some error object.
* **onComplete** - Calls when the flow is finished.

## Actor's method implement

### Syncronous Actor
Just call `flow.next()` on complete of the action.

    function (flow, [argument, ...]) {
      // do something
      flow.next();
    }

### Asyncronous Actor
Set callback `flow.next`.

    function (next, [argument, ...]) {
      fs.readFile('foo.txt', 'utf8', flow.next);
    }

## Phase Concept

### Serial Flow

    var root = Flow.serial(
      function (flow) {
        console.log(flow.currentPhase, flow.totalPhase);    // 0 3
        setTimeout(function () {
          console.log(flow.currentPhase, flow.totalPhase);  // 0 3
          flow.next();
        }, 300);
      },
      function (flow) {
        console.log(flow.currentPhase, flow.totalPhase);    // 1 3
        setTimeout(function () {
          console.log(flow.currentPhase, flow.totalPhase);  // 1 3
          flow.next();
        }, 100);
      },
      function (flow) {
        console.log(flow.currentPhase, flow.totalPhase);    // 2 3
        setTimeout(function () {
          console.log(flow.currentPhase, flow.totalPhase);  // 2 3
          flow.next();
        }, 200);
      }
    );
    root.onComplete = function () {
      console.log(root.currentPhase, root.totalPhase);      // 3 3
    };
    root.start();

### Parallel Flow

    var root = Flow.parallel(
      function (flow) {
        console.log(flow.currentPhase, flow.totalPhase);    // 0 3
        setTimeout(function () {
          console.log(flow.currentPhase, flow.totalPhase);  // 2 3
          flow.next();
        }, 300);
      },
      function (flow) {
        console.log(flow.currentPhase, flow.totalPhase);    // 0 3
        setTimeout(function () {
          console.log(flow.currentPhase, flow.totalPhase);  // 0 3
          flow.next();
        }, 100);
      },
      function (flow) {
        console.log(flow.currentPhase, flow.totalPhase);    // 0 3
        setTimeout(function () {
          console.log(flow.currentPhase, flow.totalPhase);  // 1 3
          flow.next();
        }, 200);
      }
    );
    root.onComplete = function () {
      console.log(root.currentPhase, root.totalPhase);      // 3 3
    };
    root.start();

### Repeat Flow

    var root = Flow.repeat(
      function (flow) {
        console.log(flow.currentPhase, flow.totalPhase);    // 0 3
                                                            // 1 3
                                                            // 2 3
        flow.next();
      },
      3
    );
    root.onComplete = function () {
      console.log(root.currentPhase, root.totalPhase);      // 3 3
    };
    root.start();

## Usage

### File System: write -> read -> unlink

[file.js](https://github.com/minodisk/flow.js/blob/master/example/file.js)

    var fs = require('fs');
    var Flow = require('nestableflow').Flow;
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

### Mongoose: save -> find

[mongoose.js](https://github.com/minodisk/flow-js/blob/master/example/mongoose.js)

    var mongoose = require('mongoose');
    var Flow = require('nestableflow').Flow;
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

### RequierJS

[How to load flow.js with RequierJS](https://github.com/minodisk/flow-js/blob/master/example/require)

    <script type="text/javascript" src="require.js"></script>
    <script type="text/javascript">
      require(['../../lib/flow'], function (Flow) {
        console.log(Flow);
      });
    </script>

## License

Licensed under the [MIT license](https://github.com/minodisk/flow-js/raw/master/LICENSE).

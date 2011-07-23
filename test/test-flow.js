(function () {
  var nodeunit = require('nodeunit');
  var fs = require('fs');
  var Flow = require('../lib/flow.js').Flow;

  var _case = {};

  _case.setUp = function (next) {
    next();
  };

  _case['serial'] = function (test) {
    var root = Flow.serial(
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        flow.next();
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 1);
        test.strictEqual(flow.totalPhase, 3);
        flow.next();
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 2);
        test.strictEqual(flow.totalPhase, 3);
        flow.next();
      }
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.done();
    };
    root.start();
  };

  _case['serial timer'] = function (test) {
    var from = new Date();
    var root = Flow.serial(
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        setTimeout(function () {
          test.strictEqual(_getTime(from), 300);
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          flow.next();
        }, 300);
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 1);
        test.strictEqual(flow.totalPhase, 3);
        setTimeout(function () {
          test.strictEqual(_getTime(from), 400);
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 3);
          flow.next();
        }, 100);
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 2);
        test.strictEqual(flow.totalPhase, 3);
        setTimeout(function () {
          test.strictEqual(_getTime(from), 600);
          test.strictEqual(flow.currentPhase, 2);
          test.strictEqual(flow.totalPhase, 3);
          flow.next();
        }, 200);
      }
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.done();
    };
    root.start();
  };

  _case['serialActors'] = function (test) {
    var counter = 0;
    var from = new Date();
    var timer300 = function (flow) {
      test.strictEqual(flow.currentPhase, (counter === 0) ? 0 : 3);
      test.strictEqual(flow.totalPhase, 4);
      setTimeout(function () {
        test.strictEqual(_getTime(from), (counter === 0) ? 300 : 900);
        test.strictEqual(flow.currentPhase, (counter === 0) ? 0 : 3);
        test.strictEqual(flow.totalPhase, 4);
        counter++;
        flow.next();
      }, 300);
    };
    var timer100 = function (flow) {
      test.strictEqual(flow.currentPhase, 1);
      test.strictEqual(flow.totalPhase, 4);
      setTimeout(function () {
        test.strictEqual(_getTime(from), 400);
        test.strictEqual(flow.currentPhase, 1);
        test.strictEqual(flow.totalPhase, 4);
        flow.next();
      }, 100);
    };
    var timer200 = function (flow) {
      test.strictEqual(flow.currentPhase, 2);
      test.strictEqual(flow.totalPhase, 4);
      setTimeout(function () {
        test.strictEqual(_getTime(from), 600);
        test.strictEqual(flow.currentPhase, 2);
        test.strictEqual(flow.totalPhase, 4);
        flow.next();
      }, 200);
    };
    var actors = [timer300, timer100, timer200, timer300];
    var root = Flow.serialActors(actors);
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 4);
      test.strictEqual(root.totalPhase, 4);
      test.done();
    };
    root.start();
  };

  _case['serial file'] = function (test) {
    var now = (new Date()).toString();
    var root = Flow.serial(
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        fs.writeFile('serial_file.txt', now, flow.next);
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 1);
        test.strictEqual(flow.totalPhase, 3);
        fs.readFile('serial_file.txt', 'utf8', flow.next);
      },
      function (flow, data) {
        test.strictEqual(flow.currentPhase, 2);
        test.strictEqual(flow.totalPhase, 3);
        test.strictEqual(data, now);
        fs.unlink('serial_file.txt', flow.next);
      }
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.done();
    };
    root.start();
  };

  _case['parallel'] = function (test) {
    var root = Flow.parallel(
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        flow.next();
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        flow.next();
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        flow.next();
      }
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.done();
    };
    root.start();
  };

  _case['parallel timer'] = function (test) {
    var from = new Date();
    var root = Flow.parallel(
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        setTimeout(function () {
          test.strictEqual(_getTime(from), 300);
          test.strictEqual(flow.currentPhase, 2);
          test.strictEqual(flow.totalPhase, 3);
          flow.next();
        }, 300);
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        setTimeout(function () {
          test.strictEqual(_getTime(from), 100);
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          flow.next();
        }, 100);
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        setTimeout(function () {
          test.strictEqual(_getTime(from), 200);
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 3);
          flow.next();
        }, 200);
      }
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.done();
    };
    root.start();
  };

  _case['parallelActors'] = function (test) {
    var from = new Date();
    var timer300 = function (flow) {
      test.strictEqual(flow.currentPhase, 0);
      test.strictEqual(flow.totalPhase, 4);
      setTimeout(function () {
        test.strictEqual(_getTime(from), 300);
        test.strictEqual(flow.currentPhase, 2);
        test.strictEqual(flow.totalPhase, 4);
        flow.next();
      }, 300);
    };
    var timer100 = function (flow) {
      test.strictEqual(flow.currentPhase, 0);
      test.strictEqual(flow.totalPhase, 4);
      setTimeout(function () {
        test.strictEqual(_getTime(from), 100);
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 4);
        flow.next();
      }, 100);
    };
    var timer200 = function (flow) {
      test.strictEqual(flow.currentPhase, 0);
      test.strictEqual(flow.totalPhase, 4);
      setTimeout(function () {
        test.strictEqual(_getTime(from), 200);
        test.strictEqual(flow.currentPhase, 1);
        test.strictEqual(flow.totalPhase, 4);
        flow.next();
      }, 200);
    };
    var actors = [timer300, timer100, timer200, timer300];
    var root = Flow.parallelActors(actors);
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 4);
      test.strictEqual(root.totalPhase, 4);
      test.done();
    };
    root.start();
  };

  _case['stop'] = function (test) {
    var from = new Date();
    var root = Flow.serial(
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 2);
        setTimeout(function () {
          test.strictEqual(_getTime(from), 100);
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 2);
          flow.next();
        }, 100);
      },
      Flow.repeat(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(_getTime(from), 400);
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            flow.next();
          }, 300);
        },
        3
      )
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 1);
      test.strictEqual(root.totalPhase, 2);
      test.done();
    };
    root.start();
    setTimeout(root.stop, 300);
  };

  _case['reset'] = function (test) {
    var counter = 0;
    var from = new Date();
    var root = Flow.serial(
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        setTimeout(function () {
          test.strictEqual(_getTime(from), (counter === 0) ? 300 : 700);
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          flow.next();
        }, 300);
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 1);
        test.strictEqual(flow.totalPhase, 3);
        setTimeout(function () {
          test.strictEqual(_getTime(from), (counter === 0) ? 400 : 800);
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 3);
          flow.next();
        }, 100);
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 2);
        test.strictEqual(flow.totalPhase, 3);
        if (counter === 0) {
          counter++;
          root.reset();
          root.start();
        } else {
          setTimeout(function () {
            test.strictEqual(_getTime(from), 1000);
            test.strictEqual(flow.currentPhase, 2);
            test.strictEqual(flow.totalPhase, 3);
            flow.next();
          }, 200);
        }
      }
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.done();
    };
    root.start();
  };

  _case['error'] = function (test) {
    var now = (new Date()).toString();
    var root = Flow.serial(
      function (flow) {
        test.strictEqual(flow.currentPhase, 0);
        test.strictEqual(flow.totalPhase, 3);
        fs.writeFile('serial_file.txt', now, flow.next);
      },
      function (flow) {
        test.strictEqual(flow.currentPhase, 1);
        test.strictEqual(flow.totalPhase, 3);
        fs.readFile('serial_file.txt', 'utf8', flow.next);
      },
      Flow.repeat(
        function (flow, data) {
          fs.unlink('serial_file.txt', flow.next);
        }, 10
      )
    );
    root.onError = function (err) {
      test.strictEqual(err.code, 'ENOENT');
      test.done();
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.done();
    };
    root.start();
  };

  _case['wait'] = function (test) {
    var from = new Date();
    var root = Flow.serial(
      Flow.wait(300),
      function (flow) {
        test.strictEqual(flow.currentPhase, 1);
        test.strictEqual(flow.totalPhase, 7);
        test.strictEqual(_getTime(from), 300);
        flow.next();
      },
      Flow.wait(100),
      function (flow) {
        test.strictEqual(flow.currentPhase, 3);
        test.strictEqual(flow.totalPhase, 7);
        test.strictEqual(_getTime(from), 400);
        flow.next();
      },
      Flow.wait(200),
      function (flow) {
        test.strictEqual(flow.currentPhase, 5);
        test.strictEqual(flow.totalPhase, 7);
        test.strictEqual(_getTime(from), 600);
        flow.next();
      },
      Flow.wait(400)
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 7);
      test.strictEqual(root.totalPhase, 7);
      test.strictEqual(_getTime(from), 1000);
      test.done();
    };
    root.start();
  };

  _case['repeat function'] = function (test) {
    var counter = 0;
    var root = Flow.repeat(
      function (flow) {
        test.strictEqual(flow.currentPhase, counter);
        test.strictEqual(flow.totalPhase, 3);
        test.strictEqual(counter, flow.currentPhase);
        counter++;
        flow.next();
      }, 3
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.strictEqual(counter, 3);
      test.done();
    };
    root.start();
  };

  _case['repeat serial timer'] = function (test) {
    var counter = 0;
    var from = new Date();
    var root = Flow.repeat(
      Flow.serial(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(counter, 3 * root.currentPhase + flow.currentPhase);
            counter++;
            flow.next();
          }, 300);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 1);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(counter, 3 * root.currentPhase + flow.currentPhase);
            counter++;
            flow.next();
          }, 100);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 2);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 2);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(counter, 3 * root.currentPhase + flow.currentPhase);
            test.strictEqual(_getTime(from), 600 * (root.currentPhase + 1));
            counter++;
            flow.next();
          }, 200);
        }
      ), 3
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.strictEqual(counter, 9);
      test.strictEqual(_getTime(from), 1800);
      test.done();
    };
    root.start();
  };

  _case['repeat parallel timer'] = function (test) {
    var counter = 0;
    var from = new Date();
    var root = Flow.repeat(
      Flow.parallel(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 2);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(counter, 3 * root.currentPhase + flow.currentPhase);
            test.strictEqual(_getTime(from), 300 * (root.currentPhase + 1));
            counter++;
            flow.next();
          }, 300);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(counter, 3 * root.currentPhase + flow.currentPhase);
            counter++;
            flow.next();
          }, 100);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 1);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(counter, 3 * root.currentPhase + flow.currentPhase);
            counter++;
            flow.next();
          }, 200);
        }
      ), 3
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 3);
      test.strictEqual(root.totalPhase, 3);
      test.strictEqual(counter, 9);
      test.strictEqual(_getTime(from), 900);
      test.done();
    };
    root.start();
  };

  _case['mixed file'] = function (test) {
    var now = (new Date()).toString();
    var root = Flow.serial(
      Flow.wait(100),
      Flow.parallel(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 2);
          fs.writeFile('mixed_0.txt', 'foo ' + now, flow.next);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 2);
          fs.writeFile('mixed_1.txt', 'bar ' + now, flow.next);
        }
      ),
      function (flow) {
        test.strictEqual(flow.currentPhase, 2);
        test.strictEqual(flow.totalPhase, 8);
        flow.next();
      },
      Flow.parallel(
        Flow.serial(
          function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 2);
            fs.readFile('mixed_0.txt', 'utf8', flow.next);
          },
          function (flow, data) {
            test.strictEqual(flow.currentPhase, 1);
            test.strictEqual(flow.totalPhase, 2);
            test.strictEqual(data, 'foo ' + now);
            flow.next();
          }
        ),
        Flow.serial(
          function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 2);
            fs.readFile('mixed_1.txt', 'utf8', flow.next);
          },
          function (flow, data) {
            test.strictEqual(flow.currentPhase, 1);
            test.strictEqual(flow.totalPhase, 2);
            test.strictEqual(data, 'bar ' + now);
            flow.next();
          }
        )
      ),
      function (flow) {
        test.strictEqual(flow.currentPhase, 4);
        test.strictEqual(flow.totalPhase, 8);
        flow.next();
      },
      Flow.parallel(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 2);
          fs.unlink('mixed_0.txt', flow.next);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 2);
          fs.unlink('mixed_1.txt', flow.next);
        }
      ),
      function (flow) {
        test.ok('Delete files complete.');
        test.strictEqual(flow.currentPhase, 6);
        test.strictEqual(flow.totalPhase, 8);
        flow.next();
      },
      Flow.wait(100)
    );
    root.onError = function (err) {
      console.log('Error!!', err);
    };
    root.onComplete = function () {
      test.strictEqual(root.currentPhase, 8);
      test.strictEqual(root.totalPhase, 8);
      test.done();
    };
    root.start();
  };

  function _getTime(from) {
    return Math.floor(((new Date()).getTime() - from.getTime()) / 100) * 100;
  }

  module.exports = nodeunit.testCase(_case);
})();
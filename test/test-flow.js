(function () {
  var nodeunit = require('nodeunit');
  var fs = require('fs');
  var http = require('http');
  var Flow = require('../lib/flow.js').Flow;

  exports.serial = {

    count: function (test) {
      var count = 0;
      var root = Flow.serial(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          test.strictEqual(count++, 0);
          flow.next();
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 3);
          test.strictEqual(count++, 1);
          flow.next();
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 2);
          test.strictEqual(flow.totalPhase, 3);
          test.strictEqual(count++, 2);
          flow.next();
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.strictEqual(count, 3);
        test.done();
      };
      root.start();
    },

    timer: function (test) {
      var from = new Date();
      var root = Flow.serial(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            flow.next();
          }, 100);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 1);
            test.strictEqual(flow.totalPhase, 3);
            flow.next();
          }, 300);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 2);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 2);
            test.strictEqual(flow.totalPhase, 3);
            flow.next();
          }, 500);
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        var time = _getTime(from);
        test.ok(time >= 900 && time < 1000, time);
        test.done();
      };
      root.start();
    },

    file: function (test) {
      var now = (new Date()).toString();
      var root = Flow.serial(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          fs.writeFile('serial.txt', now, flow.next);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 3);
          fs.readFile('serial.txt', 'utf8', flow.next);
        },
        function (flow, data) {
          test.strictEqual(flow.currentPhase, 2);
          test.strictEqual(flow.totalPhase, 3);
          test.strictEqual(data, now);
          fs.unlink('serial.txt', flow.next);
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.done();
      };
      root.start();
    },

    http: function (test) {
      var host = 'static.minodisk.net';
      var paths = ['/texts/0.txt', '/texts/1.txt', '/texts/2.txt'];
      var texts = ['zero', 'one', 'two'];
      var root = Flow.serial(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 6);
          http.get({
            host: host,
            port: 80,
            path: paths[0]
          }, flow.next);
        },
        function (flow, res) {
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 6);
          var data = '';
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            data += chunk;
          });
          res.on('end', function () {
            test.strictEqual(data, texts[0]);
            flow.next();
          });
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 2);
          test.strictEqual(flow.totalPhase, 6);
          http.get({
            host: host,
            port: 80,
            path: paths[1]
          }, flow.next);
        },
        function (flow, res) {
          test.strictEqual(flow.currentPhase, 3);
          test.strictEqual(flow.totalPhase, 6);
          var data = '';
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            data += chunk;
          });
          res.on('end', function () {
            test.strictEqual(data, texts[1]);
            flow.next();
          });
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 4);
          test.strictEqual(flow.totalPhase, 6);
          http.get({
            host: host,
            port: 80,
            path: paths[2]
          }, flow.next);
        },
        function (flow, res) {
          test.strictEqual(flow.currentPhase, 5);
          test.strictEqual(flow.totalPhase, 6);
          var data = '';
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            data += chunk;
          });
          res.on('end', function () {
            test.strictEqual(data, texts[2]);
            flow.next();
          });
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 6);
        test.strictEqual(root.totalPhase, 6);
        test.done();
      };
      root.start();
    }

  };

  exports.serialActors = {

    count: function (test) {
      var count = 0;
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors[i] = (function (i) {
          return function (flow) {
            test.strictEqual(flow.currentPhase, i);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(count++, i);
            flow.next();
          };
        })(i);
      }
      var root = Flow.serialActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.strictEqual(count, 3);
        test.done();
      };
      root.start();
    },

    timer: function (test) {
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors[i] = (function (i) {
          return function (flow) {
            test.strictEqual(flow.currentPhase, i);
            test.strictEqual(flow.totalPhase, 3);
            setTimeout(function () {
              test.strictEqual(flow.currentPhase, i);
              test.strictEqual(flow.totalPhase, 3);
              flow.next();
            }, 100);
          };
        })(i);
      }
      var root = Flow.serialActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.done();
      };
      root.start();
    },

    file: function (test) {
      var now = (new Date()).toString();
      var actors = [
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          fs.writeFile('serialActors.txt', now, flow.next);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 3);
          fs.readFile('serialActors.txt', 'utf8', flow.next);
        },
        function (flow, data) {
          test.strictEqual(flow.currentPhase, 2);
          test.strictEqual(flow.totalPhase, 3);
          test.strictEqual(data, now);
          fs.unlink('serialActors.txt', flow.next);
        }
      ];
      var root = Flow.serialActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.done();
      };
      root.start();
    },

    http: function (test) {
      var host = 'static.minodisk.net';
      var paths = ['/texts/0.txt', '/texts/1.txt', '/texts/2.txt'];
      var texts = ['zero', 'one', 'two'];
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors.push(
          (function (i) {
            return function (flow) {
              test.strictEqual(flow.currentPhase, i * 2);
              test.strictEqual(flow.totalPhase, 6);
              http.get({
                host: host,
                port: 80,
                path: paths[i]
              }, flow.next);
            };
          })(i),
          (function (i) {
            return function (flow, res) {
              test.strictEqual(flow.currentPhase, i * 2 + 1);
              test.strictEqual(flow.totalPhase, 6);
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function (chunk) {
                data += chunk;
              });
              res.on('end', function () {
                test.strictEqual(data, texts[i]);
                flow.next();
              });
            };
          })(i)
        );
      }
      var root = Flow.serialActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 6);
        test.strictEqual(root.totalPhase, 6);
        test.done();
      };
      root.start();
    }

  };

  exports.parallel = {

    count: function (test) {
      var count = 0;
      var counts = [0, 1, 2];
      var root = Flow.parallel(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          test.strictEqual(count++, counts.shift());
          flow.next();
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          test.strictEqual(count++, counts.shift());
          flow.next();
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          test.strictEqual(count++, counts.shift());
          flow.next();
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.strictEqual(count, 3);
        test.strictEqual(counts.length, 0);
        test.done();
      };
      root.start();
    },

    timer: function (test) {
      var from = new Date();
      var root = Flow.parallel(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            flow.next();
          }, 100);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 1);
            test.strictEqual(flow.totalPhase, 3);
            flow.next();
          }, 300);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          setTimeout(function () {
            test.strictEqual(flow.currentPhase, 2);
            test.strictEqual(flow.totalPhase, 3);
            flow.next();
          }, 500);
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        var time = _getTime(from);
        test.ok(time >= 500 && time < 600, time);
        test.done();
      };
      root.start();
    },

    file: function (test) {
      var paths = ['parallel_0.txt', 'parallel_1.txt', 'parallel_2.txt'];
      var texts = ['zero', 'one', 'two'];
      var root = Flow.parallel(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          fs.writeFile(paths[0], texts[0], flow.next);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          fs.writeFile(paths[1], texts[1], flow.next);
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          fs.writeFile(paths[2], texts[2], flow.next);
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        for (var i = 0; i < 3; ++i) {
          test.strictEqual(fs.readFileSync(paths[i], 'utf8'), texts[i]);
          fs.unlinkSync(paths[i]);
        }
        test.done();
      };
      root.start();
    },

    http: function (test) {
      var host = 'static.minodisk.net';
      var paths = ['/texts/0.txt', '/texts/1.txt', '/texts/2.txt'];
      var texts = ['zero', 'one', 'two'];
      var phases = [0, 1, 2];
      var root = Flow.parallel(
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          http.get({
            host: host,
            port: 80,
            path: paths[0]
          }, function (res) {
            test.strictEqual(flow.currentPhase, phases.shift());
            test.strictEqual(flow.totalPhase, 3);
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              data += chunk;
            });
            res.on('end', function () {
              test.strictEqual(data, texts[0]);
              flow.next();
            });
          });
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          http.get({
            host: host,
            port: 80,
            path: paths[1]
          }, function (res) {
            test.strictEqual(flow.currentPhase, phases.shift());
            test.strictEqual(flow.totalPhase, 3);
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              data += chunk;
            });
            res.on('end', function () {
              test.strictEqual(data, texts[1]);
              flow.next();
            });
          });
        },
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 3);
          http.get({
            host: host,
            port: 80,
            path: paths[2]
          }, function (res) {
            test.strictEqual(flow.currentPhase, phases.shift());
            test.strictEqual(flow.totalPhase, 3);
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              data += chunk;
            });
            res.on('end', function () {
              test.strictEqual(data, texts[2]);
              flow.next();
            });
          });
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.strictEqual(phases.length, 0);
        test.done();
      };
      root.start();
    }

  };

  exports.parallelActors = {

    count: function (test) {
      var count = 0;
      var counts = [0, 1, 2];
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors[i] = (function (i) {
          return function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(count++, counts.shift());
            flow.next();
          };
        })(i);
      }
      root = Flow.parallelActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.strictEqual(count, 3);
        test.strictEqual(counts.length, 0);
        test.done();
      };
      root.start();
    },

    timer: function (test) {
      var from = new Date();
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors[i] = (function (i) {
          return function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            setTimeout(function () {
              test.strictEqual(flow.currentPhase, i);
              test.strictEqual(flow.totalPhase, 3);
              flow.next();
            }, 100 + 200 * i);
          };
        })(i);
      }
      var root = Flow.parallelActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        var time = _getTime(from);
        test.ok(time >= 500 && time < 600, time);
        test.done();
      };
      root.start();
    },

    file: function (test) {
      var paths = ['parallelActors_0.txt', 'parallelActors_1.txt',
        'parallelActors_2.txt'];
      var texts = ['zero', 'one', 'two'];
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors[i] = (function (i) {
          return function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            fs.writeFile(paths[i], texts[i], flow.next);
          };
        })(i);
      }
      var root = Flow.parallelActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        for (var i = 0; i < 3; ++i) {
          test.strictEqual(fs.readFileSync(paths[i], 'utf8'), texts[i]);
          fs.unlinkSync(paths[i]);
        }
        test.done();
      };
      root.start();
    },

    http: function (test) {
      var host = 'static.minodisk.net';
      var paths = ['/texts/0.txt', '/texts/1.txt', '/texts/2.txt'];
      var texts = ['zero', 'one', 'two'];
      var phases = [0, 1, 2];
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors[i] = (function (i) {
          return function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            http.get({
              host: host,
              port: 80,
              path: paths[i]
            }, function (res) {
              test.strictEqual(flow.currentPhase, phases.shift());
              test.strictEqual(flow.totalPhase, 3);
              var data = '';
              res.setEncoding('utf8');
              res.on('data', function (chunk) {
                data += chunk;
              });
              res.on('end', function () {
                test.strictEqual(data, texts[i]);
                flow.next();
              });
            });
          };
        })(i);
      }
      var root = Flow.parallelActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        test.strictEqual(phases.length, 0);
        test.done();
      };
      root.start();
    }

  };

  exports.repeat = {

    'function': function (test) {
      var count = 0;
      var root = Flow.repeat(
        function (flow) {
          test.strictEqual(flow.currentPhase, count++);
          test.strictEqual(flow.totalPhase, 5);
          flow.next();
        }, 5
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 5);
        test.strictEqual(root.totalPhase, 5);
        test.strictEqual(count, 5);
        test.done();
      };
      root.start();
    },

    serial: function (test) {
      var count = 0;
      var root = Flow.repeat(
        Flow.serial(
          function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(root.currentPhase, count++ / 3 >> 0);
            test.strictEqual(root.totalPhase, 5);
            flow.next();
          },
          function (flow) {
            test.strictEqual(flow.currentPhase, 1);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(root.currentPhase, count++ / 3 >> 0);
            test.strictEqual(root.totalPhase, 5);
            flow.next();
          },
          function (flow) {
            test.strictEqual(flow.currentPhase, 2);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(root.currentPhase, count++ / 3 >> 0);
            test.strictEqual(root.totalPhase, 5);
            flow.next();
          }
        ), 5
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 5);
        test.strictEqual(root.totalPhase, 5);
        test.strictEqual(count, 15);
        test.done();
      };
      root.start();
    },

    serialActors: function (test) {
      var count = 0;
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors[i] = (function (i) {
          return function (flow) {
            test.strictEqual(flow.currentPhase, i);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(root.currentPhase, count++ / 3 >> 0);
            test.strictEqual(root.totalPhase, 5);
            flow.next();
          };
        })(i);
      }
      var root = Flow.repeat(
        Flow.serialActors(actors), 5
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 5);
        test.strictEqual(root.totalPhase, 5);
        test.strictEqual(count, 15);
        test.done();
      };
      root.start();
    },

    parallel: function (test) {
      var count = 0;
      var counts = [];
      for (var i = 0; i < 15; ++i) {
        counts[i] = i;
      }
      var root = Flow.repeat(
        Flow.parallel(
          function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(count++, counts.shift());
            flow.next();
          },
          function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(count++, counts.shift());
            flow.next();
          },
          function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(count++, counts.shift());
            flow.next();
          }
        ), 5
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 5);
        test.strictEqual(root.totalPhase, 5);
        test.strictEqual(count, 15);
        test.strictEqual(counts.length, 0);
        test.done();
      };
      root.start();
    },

    parallelActors: function (test) {
      var count = 0;
      var counts = [];
      for (var i = 0; i < 15; ++i) {
        counts[i] = i;
      }
      var actors = [];
      for (i = 0; i < 3; ++i) {
        actors[i] = (function (i) {
          return function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(count++, counts.shift());
            flow.next();
          };
        })(i);
      }
      var root = Flow.repeat(
        Flow.parallelActors(actors), 5
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 5);
        test.strictEqual(root.totalPhase, 5);
        test.strictEqual(count, 15);
        test.strictEqual(counts.length, 0);
        test.done();
      };
      root.start();
    },

    repeat: function (test) {
      var count = 0;
      var root = Flow.repeat(
        Flow.repeat(
          function (flow) {
            test.strictEqual(flow.currentPhase, count % 3);
            test.strictEqual(flow.totalPhase, 3);
            test.strictEqual(root.currentPhase, count++ / 3 >> 0);
            test.strictEqual(root.totalPhase, 5);
            flow.next();
          }, 3
        ), 5
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 5);
        test.strictEqual(root.totalPhase, 5);
        test.strictEqual(count, 15);
        test.done();
      };
      root.start();
    },

    wait: function (test) {
      var count = 0;
      var from = new Date();
      var root = Flow.repeat(
        Flow.serial(
          Flow.wait(100),
          function (flow) {
            test.strictEqual(flow.currentPhase, 1);
            test.strictEqual(flow.totalPhase, 2);
            test.strictEqual(root.currentPhase, count++);
            test.strictEqual(root.totalPhase, 5);
            flow.next();
          }
        ), 5
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 5);
        test.strictEqual(root.totalPhase, 5);
        test.strictEqual(count, 5);
        var time = _getTime(from);
        test.ok(time >= 500 && time < 600, time);
        test.done();
      };
      root.start();
    },

    deep: function (test) {
      var count = 0;
      var actor = function (flow) {
        ++count;
        flow.next();
      };
      for (var i = 0; i < 10; ++i) {
        actor = Flow.serial(
          actor,
          function (flow) {
            ++count;
            flow.next();
          }
        );
      }
      var root = Flow.repeat(
        actor, 3
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(count, 33);
        test.done();
      };
      root.start();
    }

  };

  exports.wait = {

    serial: function (test) {
      var from = new Date();
      var root = Flow.serial(
        Flow.wait(100),
        function (flow) {
          test.strictEqual(flow.currentPhase, 1);
          test.strictEqual(flow.totalPhase, 6);
          var time = _getTime(from);
          test.ok(time >= 100 && time < 200, time);
          flow.next();
        },
        Flow.wait(300),
        function (flow) {
          test.strictEqual(flow.currentPhase, 3);
          test.strictEqual(flow.totalPhase, 6);
          var time = _getTime(from);
          test.ok(time >= 400 && time < 500, time);
          flow.next();
        },
        Flow.wait(500),
        function (flow) {
          test.strictEqual(flow.currentPhase, 5);
          test.strictEqual(flow.totalPhase, 6);
          var time = _getTime(from);
          test.ok(time >= 900 && time < 1000, time);
          flow.next();
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 6);
        test.strictEqual(root.totalPhase, 6);
        var time = _getTime(from);
        test.ok(time >= 900 && time < 1000, time);
        test.done();
      };
      root.start();
    },

    serialActors: function (test) {
      var from = new Date();
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors.push(
          Flow.wait(100),
          (function (i) {
            return function (flow) {
              test.strictEqual(flow.currentPhase, i * 2 + 1);
              test.strictEqual(flow.totalPhase, 6);
              var time = _getTime(from);
              test.ok(time >= 100 * (i + 1) && time < 100 * (i + 2), time);
              flow.next();
            };
          })(i)
        );
      }
      var root = Flow.serialActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 6);
        test.strictEqual(root.totalPhase, 6);
        var time = _getTime(from);
        test.ok(time >= 300 && time < 400, time);
        test.done();
      };
      root.start();
    },

    parallel: function (test) {
      var from = new Date();
      var root = Flow.parallel(
        Flow.wait(100),
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 6);
          var time = _getTime(from);
          test.ok(time >= 0 && time < 100, time);
          flow.next();
        },
        Flow.wait(300),
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 6);
          var time = _getTime(from);
          test.ok(time >= 0 && time < 100, time);
          flow.next();
        },
        Flow.wait(500),
        function (flow) {
          test.strictEqual(flow.currentPhase, 0);
          test.strictEqual(flow.totalPhase, 6);
          var time = _getTime(from);
          test.ok(time >= 0 && time < 100, time);
          flow.next();
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 6);
        test.strictEqual(root.totalPhase, 6);
        var time = _getTime(from);
        test.ok(time >= 500 && time < 600, time);
        test.done();
      };
      root.start();
    },

    parallelActors: function (test) {
      var from = new Date();
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors.push(
          Flow.wait(100 * (i + 2)),
          function (flow) {
            test.strictEqual(flow.currentPhase, 0);
            test.strictEqual(flow.totalPhase, 6);
            var time = _getTime(from);
            test.ok(time >= 0 && time < 100, time);
            flow.next();
          }
        );
      }
      var root = Flow.parallelActors(actors);
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 6);
        test.strictEqual(root.totalPhase, 6);
        var time = _getTime(from);
        test.ok(time >= 400 && time < 500, time);
        test.done();
      };
      root.start();
    },

    repeat: function (test) {
      var from = new Date();
      var root = Flow.repeat(
        Flow.wait(100), 5
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 5);
        test.strictEqual(root.totalPhase, 5);
        var time = _getTime(from);
        test.ok(time >= 500 && time < 600, time);
        test.done();
      };
      root.start();
    },

    wait: function (test) {
      var from = new Date();
      var root = Flow.serial(
        Flow.wait(100),
        Flow.wait(300),
        Flow.wait(500)
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 3);
        test.strictEqual(root.totalPhase, 3);
        var time = _getTime(from);
        test.ok(time >= 900 && time < 1000, time);
        test.done();
      };
      root.start();
    },

    deep: function (test) {
      var from = new Date();
      var count = 0;
      var actor = function (flow) {
        ++count;
        flow.next();
      };
      for (var i = 0; i < 10; ++i) {
        actor = Flow.serial(
          actor,
          Flow.wait(100),
          function (flow) {
            ++count;
            flow.next();
          }
        );
      }
      var root = actor;
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(count, 11);
        var time = _getTime(from);
        test.ok(time >= 1000 && time < 1100, time);
        test.done();
      };
      root.start();
    }

  };

  exports.stop = {

    timer: function (test) {
      var count = 0;
      var root = Flow.serial(
        Flow.wait(100),
        function (flow) {
          ++count;
          flow.next();
        },
        Flow.wait(500),
        function (flow) {
          ++count;
          flow.next();
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 4);
        test.strictEqual(root.totalPhase, 4);
        test.strictEqual(count, 12);
        test.done();
      };
      root.start();

      setTimeout(function () {
        root.stop();
        test.strictEqual(root.currentPhase, 2);
        test.strictEqual(root.totalPhase, 4);
        test.strictEqual(count, 1);
        count += 10;
        root.start();
      }, 300);
    },

    deep: function (test) {
      var count = 0;
      var actor = function (flow) {
        ++count;
        flow.next();
      };
      for (var i = 0; i < 10; ++i) {
        actor = Flow.serial(
          actor,
          Flow.wait(200),
          function (flow) {
            ++count;
            flow.next();
          }
        );
      }
      var root = actor;
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(count, 21);
        test.done();
      };
      root.start();

      setTimeout(function () {
        root.stop();
        test.strictEqual(count, 2);
        count += 10;
        root.start();
      }, 300);
    }

  };

  exports.reset = {

    timer: function (test) {
      var count = 0;
      var root = Flow.serial(
        Flow.wait(100),
        function (flow) {
          ++count;
          flow.next();
        },
        Flow.wait(500),
        function (flow) {
          ++count;
          flow.next();
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(root.currentPhase, 4);
        test.strictEqual(root.totalPhase, 4);
        test.strictEqual(count, 13);
        test.done();
      };
      root.start();

      setTimeout(function () {
        root.reset();
        test.strictEqual(root.currentPhase, 0);
        test.strictEqual(root.totalPhase, 4);
        test.strictEqual(count, 1);
        count += 10;
        root.start();
      }, 300);
    },

    deep: function (test) {
      var count = 0;
      var actor = function (flow) {
        ++count;
        flow.next();
      };
      for (var i = 0; i < 10; ++i) {
        actor = Flow.serial(
          actor,
          Flow.wait(200),
          function (flow) {
            ++count;
            flow.next();
          }
        );
      }
      var root = actor;
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(count, 13);
        test.done();
      };
      root.start();

      setTimeout(function () {
        root.reset();
        test.strictEqual(count, 2);
        root.start();
      }, 300);
    }

  };

  exports.eventHandlers = {

    onError: function (test) {
      var root = Flow.repeat(
        function (flow) {
          test.strictEqual(root.currentPhase, 0);
          test.strictEqual(root.totalPhase, 10);
          fs.unlink('onError.txt', flow.next);
        }, 10
      );
      root.onError = function (err) {
        test.strictEqual(root.currentPhase, 1);
        test.strictEqual(root.totalPhase, 10);
        test.strictEqual(err.code, 'ENOENT');
        test.done();
      };
      root.onComplete = function () {
        test.ok(false, 'unexpected completion');
        test.done();
      };
      root.start();
    }

  };

  exports.complexNest = {

    http2file: function (test) {
      var host = 'static.minodisk.net';
      var paths = ['/texts/0.txt', '/texts/1.txt', '/texts/2.txt'];
      var texts = [];
      var text;
      var actors = [];
      for (var i = 0; i < 3; ++i) {
        actors.push(
          (function (i) {
            return Flow.serial(
              function (flow) {
                http.get({
                  host: host,
                  port: 80,
                  path: paths[i]
                }, flow.next)
              },
              function (flow, res) {
                var data = '';
                res.on('data', function (chunk) {
                  data += chunk;
                });
                res.on('end', function () {
                  texts[i] = data;
                  flow.next();
                });
              }
            )
          })(i)
        );
      }
      var root = Flow.serial(
        Flow.parallelActors(actors),
        function (flow) {
          fs.writeFile('http2file.txt', texts.join(','), flow.next);
        },
        function (flow) {
          fs.readFile('http2file.txt', 'utf8', flow.next);
        },
        function (flow, data) {
          text = data;
          fs.unlink('http2file.txt', flow.next);
        }
      );
      root.onError = console.log;
      root.onComplete = function () {
        test.strictEqual(text, 'zero,one,two');
        test.done();
      };
      root.start();
    }

  };

  function _getTime(from) {
    return (new Date()).getTime() - from.getTime();
  }

})();
/*!
 * flow.js v0.0.15
 * https://github.com/minodisk/flow-js
 * Author: Daisuke MINO
 * Licensed under the MIT license.
 * https://github.com/minodisk/flow-js/raw/master/LICENSE
 */
(function () {
  function Flow(type, actors) {
    switch (type) {
      case 'serial':
        this._serial(actors);
        break;
      case 'parallel':
        this._parallel(actors);
        break;
      case 'repeat':
        this._repeat(actors[0], actors[1]);
        break;
      default:
        throw new Error(type + 'is not implemented.');
        break;
    }
  }


  Flow.serial = function (/*...actors*/) {
    return Flow.serialActors(Array.prototype.slice.call(arguments));
  };

  Flow.serialActors = function (actors) {
    return new Flow('serial', actors);
  };

  Flow.parallel = function (/*...actors*/) {
    return Flow.parallelActors(Array.prototype.slice.call(arguments));
  };

  Flow.parallelActors = function (actors) {
    return new Flow('parallel', actors);
  };

  Flow.repeat = function (actor, repeatCount) {
    return new Flow('repeat', [actor, repeatCount]);
  };

  Flow.wait = function (delay) {
    return function (flow) {
      setTimeout(flow.next, delay);
    };
  };


  Flow.prototype = {};


  /*Flow.prototype.running;
   Flow.prototype.currentPhase;
   Flow.prototype.totalPhase;
   Flow.prototype.userData;
   Flow.prototype._actors;*/


  Flow.prototype._serial = function (actors) {
    var that = this;
    this._actors = actors;
    this.running = false;
    this.currentPhase = 0;
    this.totalPhase = actors.length;
    this.userData = {};
    this.start = function () {
      that._serialStart.apply(that, arguments);
    };
    this.next = function () {
      that._serialNext.apply(that, arguments);
    };
    this.stop = function () {
      that._stop.apply(that, arguments);
    };
    this.reset = function () {
      that._reset.apply(that, arguments);
    };
  };

  Flow.prototype._parallel = function (actors) {
    var that = this;
    this._actors = actors;
    this.running = false;
    this.currentPhase = 0;
    this.totalPhase = actors.length;
    this.userData = {};
    this.start = function () {
      that._parallelStart.apply(that, arguments);
    };
    this.next = function () {
      that._parallelNext.apply(that, arguments);
    };
    this.stop = function () {
      that._stop.apply(that, arguments);
    };
    this.reset = function () {
      that._reset.apply(that, arguments);
    };
  };

  Flow.prototype._repeat = function (actor, repeatCount) {
    var that = this;
    this._actors = [];
    this.running = false;
    this.currentPhase = 0;
    this.totalPhase = repeatCount;
    this.userData = {};
    while (repeatCount--) {
      this._actors.push(actor);
    }
    this.start = function () {
      that._serialStart.apply(that, arguments);
    };
    this.next = function () {
      if (actor instanceof Flow) {
        actor.reset();
      }
      that._serialNext.apply(that, arguments);
    };
    this.stop = function () {
      that._stop.apply(that, arguments);
    };
    this.reset = function () {
      that._reset.apply(that, arguments);
    };
  };


  /*Flow.prototype.start;
   Flow.prototype.next;
   Flow.prototype.stop;
   Flow.prototype.reset;
   Flow.prototype.onComplete;
   Flow.prototype.onError;*/


  Flow.prototype._serialStart = function () {
    if (!this.running && this.currentPhase < this.totalPhase) {
      this.running = true;
      var actor = this._actors[this.currentPhase];
      if (actor instanceof Flow) {
        if (this.onError) {
          actor.onError = this.onError;
        }
        actor.onComplete = this.next;
        actor.start();
      } else {
        var args = Array.prototype.slice.call(arguments);
        args[0] = this;
        actor.apply(null, args);
      }
    }
  };

  Flow.prototype._serialNext = function () {
    if (this.running) {
      if (++this.currentPhase < this.totalPhase) {
        var actor = this._actors[this.currentPhase];
        if (actor instanceof Flow) {
          if (this.onError) {
            actor.onError = this.onError;
          }
          actor.onComplete = this.next;
          actor.start();
        } else {
          var args = Array.prototype.slice.call(arguments);
          if (args[0] === null || args[0] === undefined ||
            args[0] instanceof Error) {
            var err = args.shift();
            if (err && this.onError) {
              this.onError(err);
              return;
            }
          }
          args.unshift(this);
          actor.apply(null, args);
        }
      } else {
        this.stop();
        if (this.onComplete) {
          this.onComplete();
        }
      }
    }
  };

  Flow.prototype._parallelStart = function () {
    if (!this.running && this.currentPhase < this.totalPhase) {
      this.running = true;
      var actor;
      for (var i = 0, len = this._actors.length; i < len; i++) {
        actor = this._actors[i];
        if (actor instanceof Flow) {
          if (this.onError) {
            actor.onError = this.onError;
          }
          actor.onComplete = this.next;
          actor.start();
        } else {
          actor.apply(null, [this]);
        }
      }
    }
  };

  Flow.prototype._parallelNext = function (err) {
    var that = this;
    setTimeout(function () {
      if (err) {
        if (that.onError) {
          that.onError(err);
          return;
        }
        return;
      }
      if (that.running) {
        if (++that.currentPhase >= that.totalPhase) {
          that.stop();
          if (that.onComplete) {
            that.onComplete();
          }
        }
      }
    }, 0);
  };

  Flow.prototype._stop = function () {
    this.running = false;
    var i = this._actors.length;
    while (i--) {
      if (this._actors[i] instanceof Flow) {
        this._actors[i].stop();
      }
    }
  };

  Flow.prototype._reset = function () {
    this.running = false;
    this.currentPhase = 0;
    var i = this._actors.length;
    while (i--) {
      if (this._actors[i] instanceof Flow) {
        this._actors[i].reset();
      }
    }
  };


  if (typeof exports !== 'undefined') {
    // Node.js
    exports.Flow = Flow;
  } else if (typeof define !== 'undefined') {
    // RequireJS
    define(function () {
      return Flow;
    });
  } else if (typeof window !== 'undefined') {
    // browser
    window.Flow = Flow;
  }
})();
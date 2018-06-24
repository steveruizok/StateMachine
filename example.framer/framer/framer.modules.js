require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"myModule":[function(require,module,exports){
exports.myVar = "myVariable";

exports.myFunction = function() {
  return print("myFunction is running");
};

exports.myArray = [1, 2, 3];


},{}],"statemachine":[function(require,module,exports){
var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

exports.StateMachine = (function(superClass) {
  extend(StateMachine, superClass);

  function StateMachine(options) {
    if (options == null) {
      options = {};
    }
    this.onChangeState = bind(this.onChangeState, this);
    this.onChangeCurrent = bind(this.onChangeCurrent, this);
    this.redo = bind(this.redo, this);
    this.undo = bind(this.undo, this);
    this.handle = bind(this.handle, this);
    this._setState = bind(this._setState, this);
    this._addToHistory = bind(this._addToHistory, this);
    this._setInitialStates = bind(this._setInitialStates, this);
    this._getState = bind(this._getState, this);
    this._getCurrent = bind(this._getCurrent, this);
    this._setCurrent = bind(this._setCurrent, this);
    _.assign(this, {
      _states: [],
      _current: void 0,
      _history: [],
      _historyIndex: 0,
      initial: options.initial,
      states: []
    });
    this.states = options.states;
  }

  StateMachine.prototype._setCurrent = function(state, direction) {
    if (state == null) {
      return;
    }
    switch (direction) {
      case "undo":
        this._historyIndex--;
        break;
      case "redo":
        this._historyIndex++;
        break;
      default:
        if (this.current != null) {
          this._addToHistory(this.current);
          this._historyIndex++;
        }
    }
    this._current = state;
    this.emit("change:current", state.name, this);
    return this.emit("change:state", state.name, this);
  };

  StateMachine.prototype._getCurrent = function() {
    return this._getState(this.current);
  };

  StateMachine.prototype._getState = function(stateName) {
    return _.find(this.states, {
      name: stateName
    });
  };

  StateMachine.prototype._setInitialStates = function() {
    var state;
    if (this.initial) {
      state = _.find(this.states, {
        name: this.initial
      });
      if (state != null) {
        this._current = state;
        Utils.delay(0, (function(_this) {
          return function() {
            return _this._setCurrent(state);
          };
        })(this));
        return;
      }
    }
    this._current = this.states[0];
    return Utils.delay(0, (function(_this) {
      return function() {
        return _this._setCurrent(_this.states[0]);
      };
    })(this));
  };

  StateMachine.prototype._addToHistory = function(stateName) {
    this._history = this._history.slice(0, this._historyIndex);
    return this._history.push(stateName);
  };

  StateMachine.prototype._setState = function(stateName, direction) {
    var state;
    state = this._getState(stateName);
    if (state == null) {
      return;
    }
    return this._setCurrent(state, direction);
  };

  StateMachine.prototype.handle = function(eventName) {
    var current, newStateName;
    current = this._getCurrent();
    newStateName = current.events[eventName];
    if (_.isUndefined(newStateName)) {
      return;
    }
    return this._setState(newStateName);
  };

  StateMachine.prototype.undo = function() {
    if (this._historyIndex === 0) {
      return;
    }
    return this._setState(this._history[this._historyIndex - 1], "undo");
  };

  StateMachine.prototype.redo = function() {
    if (this._historyIndex === this._history.length) {
      return;
    }
    return this._setState(this._history[this._historyIndex + 1], "redo");
  };

  StateMachine.prototype.onChangeCurrent = function(fn) {
    return this.on("change:current", fn);
  };

  StateMachine.prototype.onChangeState = function(fn) {
    return this.on("change:state", fn);
  };

  StateMachine.define("history", {
    get: function() {
      return this._history;
    }
  });

  StateMachine.define("historyIndex", {
    get: function() {
      return this._historyIndex;
    }
  });

  StateMachine.define("state", {
    get: function() {
      return this.current;
    },
    set: function(stateName) {
      if (stateName == null) {
        return;
      }
      return this._setState(stateName);
    }
  });

  StateMachine.define("current", {
    get: function() {
      var ref, ref1, ref2;
      return (ref = (ref1 = (ref2 = this._current) != null ? ref2 : this.initial) != null ? ref1.name : void 0) != null ? ref : void 0;
    }
  });

  StateMachine.define("initial", {
    get: function() {
      return this._initial;
    },
    set: function(value) {
      return this._initial = value;
    }
  });

  StateMachine.define("states", {
    get: function() {
      return this._states;
    },
    set: function(states) {
      var newStates;
      newStates = _.map(states, (function(_this) {
        return function(value, key) {
          return {
            name: key,
            events: value
          };
        };
      })(this));
      this._states = newStates;
      return this._setInitialStates();
    }
  });

  return StateMachine;

})(Framer.BaseClass);


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3N0ZXBoZW5ydWl6L0dpdEh1Yi9TdGF0ZU1hY2hpbmUvZXhhbXBsZS5mcmFtZXIvbW9kdWxlcy9zdGF0ZW1hY2hpbmUuY29mZmVlIiwiLi4vLi4vLi4vLi4vLi4vVXNlcnMvc3RlcGhlbnJ1aXovR2l0SHViL1N0YXRlTWFjaGluZS9leGFtcGxlLmZyYW1lci9tb2R1bGVzL215TW9kdWxlLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyBTdGF0ZU1hY2hpbmVcbiMgQHN0ZXZlcnVpem9rXG5cbiMgU3RhdGVNYWNoaW5lIGlzIGEgbW9kdWxlIHRoYXQgYWxsb3dzIHlvdSB0byBkZXNpZ24gc3RhdGUtYmFzZWQgY29tcG9uZW50cy4gWW91J2xsIGNyZWF0ZSB0aGUgbWFjaGluZSBieSBkZWZpbmluZyBhIHNldCBvZiBcInN0YXRlc1wiLiBFYWNoIG9mIHRoZXNlIHN0YXRlcyBtYXkgaGF2ZSBvbmUgb3IgbW9yZSBcImV2ZW50c1wiLCBhbmQgZWFjaCBldmVudCBwb2ludHMgdG8gYSBkaWZmZXJlbnQgc3RhdGUgKCB0aGUgZXZlbnQncyBcInRhcmdldCBzdGF0ZVwiKS4gXG5cbiMgVGhlIG1hY2hpbmUgYWx3YXlzIGhhcyBhIFwiY3VycmVudCBzdGF0ZVwiLCBlaXRoZXIgaXRzIFwiaW5pdGlhbCBzdGF0ZVwiIG9yIGEgZGlmZmVyZW50IHN0YXRlIHRoYXQgaXQgaGFzIGNoYW5nZWQgdG8gYWZ0ZXIgcmVjaWV2aW5nIHNvbWUgZXZlbnQuIFdoZW4gdGhlIG1hY2hpbmUgcmVjaWV2ZXMgYW4gZXZlbnQsIGl0IGNoZWNrcyB0byBzZWUgaWYgaXRzIGN1cnJlbnQgc3RhdGUgb3ducyBhbiBldmVudCB3aXRoIHRoYXQgbmFtZS4gSWYgaXQgZG9lcywgdGhlIG1hY2hpbmUgY2hhbmdlcyBpdHMgc3RhdGUgdG8gdGhhdCBldmVudCdzIHRhcmdldCBzdGF0ZS5cblxuIyBAUHJvcGVydGllc1xuXG4jIGhpc3RvcnkgOiBzdHJpbmdbXSBcbiMgXHRSZXR1cm5zIHRoZSBtYWNoaW5lJ3MgaGlzdG9yeS4gKHJlYWQtb25seSlcblxuIyBoaXN0b3J5SW5kZXggOiBudW1iZXIgXG4jIFx0UmV0dXJucyB0aGUgbWFjaGluZSdzIGhpc3RvcnkgaW5kZXguIChyZWFkLW9ubHkpXG5cbiMgY3VycmVudCA6IHN0cmluZyBcbiMgXHRSZXR1cm5zIHRoZSBuYW1lIG9mIHRoZSBtYWNoaW5lJ3MgY3VycmVudCBzdGF0ZS4gKHJlYWQtb25seSlcblxuIyBzdGF0ZSA6IHN0cmluZ1xuIyBcdEdldHMgYW5kIHNldHMgdGhlIG1hY2hpbmUncyBjdXJyZW50IHN0YXRlIChieSBpdHMgbmFtZSkuXG5cbiMgaW5pdGlhbCA6IHN0cmluZ1xuIyBcdFJldHVybnMgdGhlIG1hY2hpbmUncyBoaXN0b3J5IGluZGV4LlxuXG5cbiMgQE1ldGhvZHNcblxuIyBoYW5kbGUoIGV2ZW50IDogc3RyaW5nIClcbiMgXHRTZW5kcyBhbiBldmVudCB0byB0aGUgbWFjaGluZS5cblxuIyBvbkNoYW5nZVN0YXRlKCBmbjogRXZlbnRMaXN0ZW5lciApXG4jIFx0U2V0cyBhbiBldmVudCBsaXN0ZW5lciB0aGF0IGZpcmVzIHdoZW4gdGhlIG1hY2hpbmUncyBzdGF0ZSBjaGFuZ2VzLlxuIyBcdEFsaWFzIGZvciBzdGF0ZW1hY2hpbmUub24oXCJjaGFuZ2U6c3RhdGVcIikuXG5cbiMgb25DaGFuZ2VDdXJyZW50KCBmbjogRXZlbnRMaXN0ZW5lciApXG4jIFx0SWRlbnRpY2FsIHRvIG9uQ2hhbmdlU3RhdGUgKHJlZHVuZGFuY3kpLlxuXG4jIHVuZG8oKVx0XG4jIFx0TW92ZXMgdGhlIFN0YXRlTWFjaGluZSB0byBpdHMgcHJldmlvdXMgc3RhdGUsIGlmIG9uZSBleGlzdHMuXG5cbiMgcmVkbygpXHRcbiMgXHRNb3ZlcyB0aGUgU3RhdGVNYWNoaW5lIHRvIGl0cyBuZXh0IHN0YXRlLCBpZiBvbmUgZXhpc3RzLlxuXG5cblxuY2xhc3MgZXhwb3J0cy5TdGF0ZU1hY2hpbmUgZXh0ZW5kcyBGcmFtZXIuQmFzZUNsYXNzXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucyA9IHt9KSAtPlxuXHRcdF8uYXNzaWduIEAsXG5cdFx0XHRfc3RhdGVzOiBbXVxuXHRcdFx0X2N1cnJlbnQ6IHVuZGVmaW5lZFxuXHRcdFx0X2hpc3Rvcnk6IFtdXG5cdFx0XHRfaGlzdG9yeUluZGV4OiAwXG5cdFx0XHRcblx0XHRcdGluaXRpYWw6IG9wdGlvbnMuaW5pdGlhbFxuXHRcdFx0c3RhdGVzOiBbXVxuXHRcdFxuXHRcdEBzdGF0ZXMgPSBvcHRpb25zLnN0YXRlc1xuXHRcblx0IyBQcml2YXRlIG1ldGhvZHNcblx0XG5cdF9zZXRDdXJyZW50OiAoc3RhdGUsIGRpcmVjdGlvbikgPT5cblx0XHRyZXR1cm4gdW5sZXNzIHN0YXRlP1xuXHRcdFxuXHRcdHN3aXRjaCBkaXJlY3Rpb25cblx0XHRcdHdoZW4gXCJ1bmRvXCJcblx0XHRcdFx0QF9oaXN0b3J5SW5kZXgtLVxuXHRcdFx0d2hlbiBcInJlZG9cIlxuXHRcdFx0XHRAX2hpc3RvcnlJbmRleCsrXG5cdFx0XHRlbHNlIFxuXHRcdFx0XHRpZiBAY3VycmVudD9cblx0XHRcdFx0XHRAX2FkZFRvSGlzdG9yeShAY3VycmVudClcblx0XHRcdFx0XHRAX2hpc3RvcnlJbmRleCsrXG5cdFx0XG5cdFx0QF9jdXJyZW50ID0gc3RhdGVcblx0XHRAZW1pdChcImNoYW5nZTpjdXJyZW50XCIsIHN0YXRlLm5hbWUsIEApXG5cdFx0QGVtaXQoXCJjaGFuZ2U6c3RhdGVcIiwgc3RhdGUubmFtZSwgQClcblx0XG5cdF9nZXRDdXJyZW50OiA9PlxuXHRcdHJldHVybiBAX2dldFN0YXRlKEBjdXJyZW50KVxuXHRcdFxuXHRfZ2V0U3RhdGU6IChzdGF0ZU5hbWUpID0+XG5cdFx0cmV0dXJuIF8uZmluZChAc3RhdGVzLCB7bmFtZTogc3RhdGVOYW1lfSlcblx0XHRcblx0X3NldEluaXRpYWxTdGF0ZXM6ID0+XG5cdFx0aWYgQGluaXRpYWxcblx0XHRcdHN0YXRlID0gXy5maW5kKEBzdGF0ZXMsIHtuYW1lOiBAaW5pdGlhbH0pXG5cdFx0XHRpZiBzdGF0ZT9cblx0XHRcdFx0QF9jdXJyZW50ID0gc3RhdGVcblx0XHRcdFx0VXRpbHMuZGVsYXkgMCwgPT4gQF9zZXRDdXJyZW50KHN0YXRlKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcblx0XHRAX2N1cnJlbnQgPSBAc3RhdGVzWzBdXG5cdFx0VXRpbHMuZGVsYXkgMCwgPT4gQF9zZXRDdXJyZW50KEBzdGF0ZXNbMF0pXG5cdFx0XG5cdF9hZGRUb0hpc3Rvcnk6IChzdGF0ZU5hbWUpID0+XG5cdFx0QF9oaXN0b3J5ID0gQF9oaXN0b3J5LnNsaWNlKDAsIEBfaGlzdG9yeUluZGV4KVxuXHRcdEBfaGlzdG9yeS5wdXNoKHN0YXRlTmFtZSlcblx0XG5cdF9zZXRTdGF0ZTogKHN0YXRlTmFtZSwgZGlyZWN0aW9uKSA9PlxuXHRcdHN0YXRlID0gQF9nZXRTdGF0ZShzdGF0ZU5hbWUpXG5cdFx0XG5cdFx0dW5sZXNzIHN0YXRlP1xuXHRcdFx0cmV0dXJuO1xuXHRcdFxuXHRcdHRoaXMuX3NldEN1cnJlbnQoc3RhdGUsIGRpcmVjdGlvbilcblx0XG5cdFxuXHQjIFB1YmxpYyBtZXRob2RzXG5cdFxuXHRoYW5kbGU6IChldmVudE5hbWUpID0+XG5cdFx0Y3VycmVudCA9IEBfZ2V0Q3VycmVudCgpXG5cdFx0bmV3U3RhdGVOYW1lID0gY3VycmVudC5ldmVudHNbZXZlbnROYW1lXVxuXHRcdFxuXHRcdGlmIF8uaXNVbmRlZmluZWQobmV3U3RhdGVOYW1lKVxuXHRcdFx0cmV0dXJuXG5cdFx0XG5cdFx0QF9zZXRTdGF0ZShuZXdTdGF0ZU5hbWUpXG5cdFx0XG5cdHVuZG86ID0+XG5cdFx0cmV0dXJuIGlmIEBfaGlzdG9yeUluZGV4IGlzIDBcblx0XHRcdFx0XG5cdFx0QF9zZXRTdGF0ZShAX2hpc3RvcnlbQF9oaXN0b3J5SW5kZXggLSAxXSwgXCJ1bmRvXCIpXG5cdFx0XG5cdHJlZG86ID0+XG5cdFx0cmV0dXJuIGlmIEBfaGlzdG9yeUluZGV4IGlzIEBfaGlzdG9yeS5sZW5ndGhcblx0XHRcblx0XHRAX3NldFN0YXRlKEBfaGlzdG9yeVtAX2hpc3RvcnlJbmRleCArIDFdLCBcInJlZG9cIilcblx0XG5cdG9uQ2hhbmdlQ3VycmVudDogKGZuKSA9PlxuXHRcdEBvbihcImNoYW5nZTpjdXJyZW50XCIsIGZuKVxuXG5cdG9uQ2hhbmdlU3RhdGU6IChmbikgPT5cblx0XHRAb24oXCJjaGFuZ2U6c3RhdGVcIiwgZm4pXG5cdFx0XG5cdFx0XG5cdCMgRGVmaW5pdGlvbnNcblx0XG5cdEBkZWZpbmUgXCJoaXN0b3J5XCIsXG5cdFx0Z2V0OiAtPiByZXR1cm4gQF9oaXN0b3J5XG5cblx0QGRlZmluZSBcImhpc3RvcnlJbmRleFwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfaGlzdG9yeUluZGV4XG5cdFx0XG5cdEBkZWZpbmUgXCJzdGF0ZVwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBjdXJyZW50XG5cdFx0c2V0OiAoc3RhdGVOYW1lKSAtPlxuXHRcdFx0cmV0dXJuIHVubGVzcyBzdGF0ZU5hbWU/XG5cdFx0XHRcblx0XHRcdEBfc2V0U3RhdGUoc3RhdGVOYW1lKVxuXHRcdFxuXHRAZGVmaW5lIFwiY3VycmVudFwiLFxuXHRcdGdldDogLT4gcmV0dXJuIChAX2N1cnJlbnQgPyBAaW5pdGlhbCk/Lm5hbWUgPyB1bmRlZmluZWRcblx0XHRcblx0QGRlZmluZSBcImluaXRpYWxcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2luaXRpYWxcblx0XHRzZXQ6ICh2YWx1ZSkgLT4gXG5cdFx0XHRAX2luaXRpYWwgPSB2YWx1ZVxuXHRcblx0QGRlZmluZSBcInN0YXRlc1wiLFxuXHRcdGdldDogLT4gQF9zdGF0ZXNcblx0XHRzZXQ6IChzdGF0ZXMpIC0+XG5cdFx0XHRuZXdTdGF0ZXMgPSBfLm1hcChzdGF0ZXMsICh2YWx1ZSwga2V5KSA9PlxuXHRcdFx0XHRyZXR1cm4ge25hbWU6IGtleSwgZXZlbnRzOiB2YWx1ZX1cblx0XHRcdFx0KVxuXHRcdFx0XG5cdFx0XHRAX3N0YXRlcyA9IG5ld1N0YXRlc1xuXHRcdFx0XG5cdFx0XHQjIHNldCBpbml0aWFsIHN0YXRlIChkZWxheWVkIGZvciBsaXN0ZW5lcnMpXG5cdFx0XHRAX3NldEluaXRpYWxTdGF0ZXMoKSIsIiMgQWRkIHRoZSBmb2xsb3dpbmcgbGluZSB0byB5b3VyIHByb2plY3QgaW4gRnJhbWVyIFN0dWRpby4gXG4jIG15TW9kdWxlID0gcmVxdWlyZSBcIm15TW9kdWxlXCJcbiMgUmVmZXJlbmNlIHRoZSBjb250ZW50cyBieSBuYW1lLCBsaWtlIG15TW9kdWxlLm15RnVuY3Rpb24oKSBvciBteU1vZHVsZS5teVZhclxuXG5leHBvcnRzLm15VmFyID0gXCJteVZhcmlhYmxlXCJcblxuZXhwb3J0cy5teUZ1bmN0aW9uID0gLT5cblx0cHJpbnQgXCJteUZ1bmN0aW9uIGlzIHJ1bm5pbmdcIlxuXG5leHBvcnRzLm15QXJyYXkgPSBbMSwgMiwgM10iLCIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7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

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
    this.onStateChange = bind(this.onStateChange, this);
    this.redo = bind(this.redo, this);
    this.undo = bind(this.undo, this);
    this.dispatch = bind(this.dispatch, this);
    this.isInState = bind(this.isInState, this);
    this._setState = bind(this._setState, this);
    this._addToHistory = bind(this._addToHistory, this);
    this._setInitialStates = bind(this._setInitialStates, this);
    this._getNewState = bind(this._getNewState, this);
    this._setCurrent = bind(this._setCurrent, this);
    this._getCurrent = bind(this._getCurrent, this);
    _.assign(this, {
      _states: {},
      _current: void 0,
      _history: [],
      _historyIndex: 0,
      initial: options.initial,
      states: []
    });
    this.states = options.states;
  }

  StateMachine.prototype._getCurrent = function() {
    return this._current;
  };

  StateMachine.prototype._setCurrent = function(state) {
    if (state == null) {
      return;
    }
    switch (state.direction) {
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
    this.emit("change:current", state, this);
    return this.emit("change:state", state, this);
  };

  StateMachine.prototype._getNewState = function(stateName) {
    var getAtPath, handleState, newState, path;
    if (_.includes(stateName, ".")) {
      path = stateName.split(".").join(".states.");
      newState = _.get(this.states, path);
      return newState;
    }
    path = this._current.path;
    handleState = function(state) {
      if (typeof state === "function") {
        return state();
      } else {
        return state;
      }
    };
    getAtPath = (function(_this) {
      return function(array) {
        var p, state;
        if (array.length === 0) {
          if (!_this.states[stateName]) {
            throw "Couldn't find that state (" + stateName + ").";
            return;
          }
          return _this.states[stateName];
        }
        p = array.join('.states.');
        state = _.get(_this.states, p + ".states." + stateName);
        if (state) {
          return state;
        }
        return state != null ? state : getAtPath(_.dropRight(array));
      };
    })(this);
    newState = getAtPath(path);
    return newState;
  };

  StateMachine.prototype._setInitialStates = function() {
    var state;
    if (this.initial) {
      state = _.get(this.states, this.initial);
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
    this._current = this.states[_.keys(this.states)[0]];
    return Utils.delay(0, (function(_this) {
      return function() {
        return _this._setCurrent(_this._current);
      };
    })(this));
  };

  StateMachine.prototype._addToHistory = function(state, payload) {
    this._history = this._history.slice(0, this._historyIndex);
    return this._history.push(state);
  };

  StateMachine.prototype._setState = function(stateName, payload, direction) {
    var state;
    state = this._getNewState(stateName);
    if (state == null) {
      return;
    }
    _.assign(state, {
      payload: payload,
      direction: direction
    });
    return this._setCurrent(state);
  };

  StateMachine.prototype.isInState = function(stateName) {
    var ref;
    return _.includes((ref = this.current) != null ? ref.path : void 0, stateName);
  };

  StateMachine.prototype.dispatch = function(actionName, payload) {
    var current, newStateName;
    current = this._getCurrent();
    newStateName = current.actions[actionName];
    if (typeof newStateName === "function") {
      newStateName = newStateName();
    }
    if (_.isUndefined(newStateName)) {
      return;
    }
    return this._setState(newStateName, payload);
  };

  StateMachine.prototype.undo = function() {
    var state;
    if (this._historyIndex === 0) {
      return;
    }
    state = this._history[this._historyIndex - 1];
    return this._setState(state.name, state.payload, "undo");
  };

  StateMachine.prototype.redo = function() {
    var state;
    if (this._historyIndex === this._history.length) {
      return;
    }
    state = this._history[this._historyIndex + 1];
    return this._setState(state.name, state.payload, "redo");
  };

  StateMachine.prototype.onStateChange = function(fn) {
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
      return this.current.name;
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
      return this._current;
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
    set: function(newStates) {
      var getStates;
      getStates = (function(_this) {
        return function(statesObject, target) {
          var markupState;
          target._states = {};
          markupState = function(value, key, obj) {
            var state;
            state = {
              name: key,
              path: [],
              states: {},
              actions: {}
            };
            if (obj.path != null) {
              state.path = _.concat(obj.path, key);
            } else {
              state.path = [key];
            }
            _.forEach(value, function(v, k) {
              switch (typeof v) {
                case "string":
                  return state.actions[k] = v;
                case "function":
                  return state.actions[k] = v;
                case "object":
                  return state.states[k] = markupState(v, k, state);
              }
            });
            return state;
          };
          _.forEach(statesObject, function(v, k) {
            return target._states[k] = markupState(v, k, statesObject);
          });
          return target;
        };
      })(this);
      getStates(newStates, this);
      return this._setInitialStates();
    }
  });

  return StateMachine;

})(Framer.BaseClass);


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3N0ZXBoZW5ydWl6L0dpdEh1Yi9TdGF0ZU1hY2hpbmUvZXhhbXBsZXMvbmVzdGVkLmZyYW1lci9tb2R1bGVzL3N0YXRlbWFjaGluZS5jb2ZmZWUiLCIuLi8uLi8uLi8uLi8uLi9Vc2Vycy9zdGVwaGVucnVpei9HaXRIdWIvU3RhdGVNYWNoaW5lL2V4YW1wbGVzL25lc3RlZC5mcmFtZXIvbW9kdWxlcy9teU1vZHVsZS5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiMgU3RhdGVNYWNoaW5lXG4jIEBzdGV2ZXJ1aXpva1xuXG4jIFN0YXRlTWFjaGluZSBpcyBhIG1vZHVsZSB0aGF0IGFsbG93cyB5b3UgdG8gZGVzaWduIHN0YXRlLWJhc2VkIGNvbXBvbmVudHMuIFlvdSdsbCBjcmVhdGUgdGhlIG1hY2hpbmUgYnkgZGVmaW5pbmcgYSBzZXQgb2YgXCJzdGF0ZXNcIi4gRWFjaCBvZiB0aGVzZSBzdGF0ZXMgbWF5IGhhdmUgb25lIG9yIG1vcmUgXCJhY3Rpb25zXCIsIGFuZCBlYWNoIGFjdGlvbnMgcG9pbnRzIHRvIGEgZGlmZmVyZW50IHN0YXRlICggdGhlIGFjdGlvbidzIFwidGFyZ2V0IHN0YXRlXCIpLiBcblxuIyBUaGUgbWFjaGluZSBhbHdheXMgaGFzIGEgXCJjdXJyZW50IHN0YXRlXCIsIGVpdGhlciBpdHMgXCJpbml0aWFsIHN0YXRlXCIgb3IgYSBkaWZmZXJlbnQgc3RhdGUgdGhhdCBpdCBoYXMgY2hhbmdlZCB0byBhZnRlciByZWNpZXZpbmcgc29tZSBhY3Rpb25zLiBXaGVuIHRoZSBtYWNoaW5lIHJlY2lldmVzIGFuIGFjdGlvbnMsIGl0IGNoZWNrcyB0byBzZWUgaWYgaXRzIGN1cnJlbnQgc3RhdGUgb3ducyBhbiBhY3Rpb25zIHdpdGggdGhhdCBuYW1lLiBJZiBpdCBkb2VzLCB0aGUgbWFjaGluZSBjaGFuZ2VzIGl0cyBzdGF0ZSB0byB0aGF0IGFjdGlvbnMncyB0YXJnZXQgc3RhdGUuXG5cbiMgQFByb3BlcnRpZXNcblxuIyBoaXN0b3J5IDogc3RyaW5nW10gXG4jIFx0UmV0dXJucyB0aGUgbWFjaGluZSdzIGhpc3RvcnkuIChyZWFkLW9ubHkpXG5cbiMgaGlzdG9yeUluZGV4IDogbnVtYmVyIFxuIyBcdFJldHVybnMgdGhlIG1hY2hpbmUncyBoaXN0b3J5IGluZGV4LiAocmVhZC1vbmx5KVxuXG4jIGN1cnJlbnQgOiBzdHJpbmcgXG4jIFx0UmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgbWFjaGluZSdzIGN1cnJlbnQgc3RhdGUuIChyZWFkLW9ubHkpXG5cbiMgc3RhdGUgOiBzdHJpbmdcbiMgXHRHZXRzIGFuZCBzZXRzIHRoZSBtYWNoaW5lJ3MgY3VycmVudCBzdGF0ZSAoYnkgaXRzIG5hbWUpLlxuXG4jIGluaXRpYWwgOiBzdHJpbmdcbiMgXHRSZXR1cm5zIHRoZSBtYWNoaW5lJ3MgaGlzdG9yeSBpbmRleC5cblxuXG4jIEBNZXRob2RzXG5cbiMgZGlzcGF0Y2goIGFjdGlvbiA6IHN0cmluZywgcGF5bG9hZDogYW55IClcbiMgXHRTZW5kcyBhbiBhY3Rpb24gdG8gdGhlIG1hY2hpbmUuXG5cbiMgb25DaGFuZ2VTdGF0ZSggZm46IEV2ZW50TGlzdGVuZXIgKVxuIyBcdFNldHMgYW4gZXZlbnQgbGlzdGVuZXIgdGhhdCBmaXJlcyB3aGVuIHRoZSBtYWNoaW5lJ3Mgc3RhdGUgY2hhbmdlcy5cbiMgXHRBbGlhcyBmb3Igc3RhdGVtYWNoaW5lLm9uKFwiY2hhbmdlOnN0YXRlXCIpLlxuXG4jIG9uQ2hhbmdlQ3VycmVudCggZm46IEV2ZW50TGlzdGVuZXIgKVxuIyBcdElkZW50aWNhbCB0byBvbkNoYW5nZVN0YXRlIChyZWR1bmRhbmN5KS5cblxuIyB1bmRvKClcdFxuIyBcdE1vdmVzIHRoZSBTdGF0ZU1hY2hpbmUgdG8gaXRzIHByZXZpb3VzIHN0YXRlLCBpZiBvbmUgZXhpc3RzLlxuXG4jIHJlZG8oKVx0XG4jIFx0TW92ZXMgdGhlIFN0YXRlTWFjaGluZSB0byBpdHMgbmV4dCBzdGF0ZSwgaWYgb25lIGV4aXN0cy5cblxuXG5cbmNsYXNzIGV4cG9ydHMuU3RhdGVNYWNoaW5lIGV4dGVuZHMgRnJhbWVyLkJhc2VDbGFzc1xuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMgPSB7fSkgLT5cblx0XHRfLmFzc2lnbiBALFxuXHRcdFx0X3N0YXRlczoge31cblx0XHRcdF9jdXJyZW50OiB1bmRlZmluZWRcblx0XHRcdF9oaXN0b3J5OiBbXVxuXHRcdFx0X2hpc3RvcnlJbmRleDogMFxuXHRcdFx0XG5cdFx0XHRpbml0aWFsOiBvcHRpb25zLmluaXRpYWxcblx0XHRcdHN0YXRlczogW11cblx0XHRcblx0XHRAc3RhdGVzID0gb3B0aW9ucy5zdGF0ZXNcblx0XG5cdCMgUHJpdmF0ZSBtZXRob2RzXG5cdFxuXHRfZ2V0Q3VycmVudDogPT5cblx0XHRyZXR1cm4gQF9jdXJyZW50XG5cdFxuXHRfc2V0Q3VycmVudDogKHN0YXRlKSA9PlxuXHRcdHJldHVybiB1bmxlc3Mgc3RhdGU/XG5cdFx0XG5cdFx0c3dpdGNoIHN0YXRlLmRpcmVjdGlvblxuXHRcdFx0d2hlbiBcInVuZG9cIlxuXHRcdFx0XHRAX2hpc3RvcnlJbmRleC0tXG5cdFx0XHR3aGVuIFwicmVkb1wiXG5cdFx0XHRcdEBfaGlzdG9yeUluZGV4Kytcblx0XHRcdGVsc2UgXG5cdFx0XHRcdGlmIEBjdXJyZW50P1xuXHRcdFx0XHRcdEBfYWRkVG9IaXN0b3J5KEBjdXJyZW50KVxuXHRcdFx0XHRcdEBfaGlzdG9yeUluZGV4Kytcblx0XHRcblx0XHRAX2N1cnJlbnQgPSBzdGF0ZVxuXG5cdFx0QGVtaXQoXCJjaGFuZ2U6Y3VycmVudFwiLCBzdGF0ZSwgQClcblx0XHRAZW1pdChcImNoYW5nZTpzdGF0ZVwiLCBzdGF0ZSwgQClcblx0XG5cdF9nZXROZXdTdGF0ZTogKHN0YXRlTmFtZSkgPT5cblx0XHRpZiBfLmluY2x1ZGVzKHN0YXRlTmFtZSwgXCIuXCIpXG5cdFx0XHQjIGlzIGEgcGF0aFxuXHRcdFx0cGF0aCA9IHN0YXRlTmFtZS5zcGxpdChcIi5cIikuam9pbihcIi5zdGF0ZXMuXCIpXG5cdFx0XHRuZXdTdGF0ZSA9IF8uZ2V0KEBzdGF0ZXMsIHBhdGgpXG5cdFx0XHRyZXR1cm4gbmV3U3RhdGVcblxuXHRcdCMgd29yayB1cCBjdXJyZW50IHN0YXRlIHRyZWVcblx0XHRwYXRoID0gQF9jdXJyZW50LnBhdGhcblxuXHRcdGhhbmRsZVN0YXRlID0gKHN0YXRlKSAtPlxuXHRcdFx0aWYgdHlwZW9mIHN0YXRlIGlzIFwiZnVuY3Rpb25cIlxuXHRcdFx0XHRyZXR1cm4gc3RhdGUoKVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRyZXR1cm4gc3RhdGVcblxuXG5cdFx0Z2V0QXRQYXRoID0gKGFycmF5KSA9PlxuXG5cdFx0XHRpZiBhcnJheS5sZW5ndGggaXMgMFxuXHRcdFx0XHR1bmxlc3MgQHN0YXRlc1tzdGF0ZU5hbWVdXG5cdFx0XHRcdFx0dGhyb3cgXCJDb3VsZG4ndCBmaW5kIHRoYXQgc3RhdGUgKCN7c3RhdGVOYW1lfSkuXCJcblx0XHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0XHRyZXR1cm4gQHN0YXRlc1tzdGF0ZU5hbWVdXG5cblx0XHRcdHAgPSBhcnJheS5qb2luKCcuc3RhdGVzLicpXG5cblx0XHRcdHN0YXRlID0gXy5nZXQoQHN0YXRlcywgcCArIFwiLnN0YXRlcy5cIiArIHN0YXRlTmFtZSlcblx0XHRcdGlmIHN0YXRlXG5cdFx0XHRcdHJldHVybiBzdGF0ZVxuXG5cdFx0XHRyZXR1cm4gc3RhdGUgPyBnZXRBdFBhdGgoXy5kcm9wUmlnaHQoYXJyYXkpKVxuXG5cdFx0bmV3U3RhdGUgPSBnZXRBdFBhdGgocGF0aClcblx0XHRyZXR1cm4gbmV3U3RhdGVcblxuXHRcdFxuXHRfc2V0SW5pdGlhbFN0YXRlczogPT5cblx0XHRpZiBAaW5pdGlhbFxuXHRcdFx0c3RhdGUgPSBfLmdldChAc3RhdGVzLCBAaW5pdGlhbClcblx0XHRcdGlmIHN0YXRlP1xuXHRcdFx0XHRAX2N1cnJlbnQgPSBzdGF0ZVxuXHRcdFx0XHRVdGlscy5kZWxheSAwLCA9PiBAX3NldEN1cnJlbnQoc3RhdGUpXG5cdFx0XHRcdHJldHVyblxuXG5cdFx0IyBmaXJzdCA9IF8ua2V5cyhAc3RhdGVzKVxuXHRcdEBfY3VycmVudCA9IEBzdGF0ZXNbXy5rZXlzKEBzdGF0ZXMpWzBdXVxuXHRcdFV0aWxzLmRlbGF5IDAsID0+IEBfc2V0Q3VycmVudChAX2N1cnJlbnQpXG5cdFx0XG5cdF9hZGRUb0hpc3Rvcnk6IChzdGF0ZSwgcGF5bG9hZCkgPT5cblx0XHRAX2hpc3RvcnkgPSBAX2hpc3Rvcnkuc2xpY2UoMCwgQF9oaXN0b3J5SW5kZXgpXG5cdFx0QF9oaXN0b3J5LnB1c2goc3RhdGUpXG5cdFxuXHRfc2V0U3RhdGU6IChzdGF0ZU5hbWUsIHBheWxvYWQsIGRpcmVjdGlvbikgPT5cblx0XHRzdGF0ZSA9IEBfZ2V0TmV3U3RhdGUoc3RhdGVOYW1lKVxuXHRcdFxuXHRcdHVubGVzcyBzdGF0ZT9cblx0XHRcdHJldHVybjtcblx0XHRcblx0XHRfLmFzc2lnbiBzdGF0ZSxcblx0XHRcdHBheWxvYWQ6IHBheWxvYWRcblx0XHRcdGRpcmVjdGlvbjogZGlyZWN0aW9uXG5cblx0XHR0aGlzLl9zZXRDdXJyZW50KHN0YXRlKVxuXHRcblx0XG5cdCMgUHVibGljIG1ldGhvZHNcblxuXHRpc0luU3RhdGU6IChzdGF0ZU5hbWUpID0+XG5cdFx0cmV0dXJuIF8uaW5jbHVkZXMoQGN1cnJlbnQ/LnBhdGgsIHN0YXRlTmFtZSlcblx0XG5cdGRpc3BhdGNoOiAoYWN0aW9uTmFtZSwgcGF5bG9hZCkgPT5cblx0XHRjdXJyZW50ID0gQF9nZXRDdXJyZW50KClcblxuXHRcdG5ld1N0YXRlTmFtZSA9IGN1cnJlbnQuYWN0aW9uc1thY3Rpb25OYW1lXVxuXHRcdGlmIHR5cGVvZiBuZXdTdGF0ZU5hbWUgaXMgXCJmdW5jdGlvblwiIHRoZW4gbmV3U3RhdGVOYW1lID0gbmV3U3RhdGVOYW1lKClcblx0XHRcblx0XHRpZiBfLmlzVW5kZWZpbmVkKG5ld1N0YXRlTmFtZSlcblx0XHRcdHJldHVyblxuXG5cdFx0QF9zZXRTdGF0ZShuZXdTdGF0ZU5hbWUsIHBheWxvYWQpXG5cdFx0XG5cdHVuZG86ID0+XG5cdFx0cmV0dXJuIGlmIEBfaGlzdG9yeUluZGV4IGlzIDBcblx0XHRcblx0XHRzdGF0ZSA9IEBfaGlzdG9yeVtAX2hpc3RvcnlJbmRleCAtIDFdXG5cdFx0QF9zZXRTdGF0ZShzdGF0ZS5uYW1lLCBzdGF0ZS5wYXlsb2FkLCBcInVuZG9cIilcblx0XHRcblx0cmVkbzogPT5cblx0XHRyZXR1cm4gaWYgQF9oaXN0b3J5SW5kZXggaXMgQF9oaXN0b3J5Lmxlbmd0aFxuXG5cdFx0c3RhdGUgPSBAX2hpc3RvcnlbQF9oaXN0b3J5SW5kZXggKyAxXVxuXHRcdEBfc2V0U3RhdGUoc3RhdGUubmFtZSwgc3RhdGUucGF5bG9hZCwgXCJyZWRvXCIpXG5cblx0b25TdGF0ZUNoYW5nZTogKGZuKSA9PlxuXHRcdEBvbihcImNoYW5nZTpzdGF0ZVwiLCBmbilcblx0XHRcblx0XHRcblx0IyBEZWZpbml0aW9uc1xuXHRcblx0QGRlZmluZSBcImhpc3RvcnlcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2hpc3RvcnlcblxuXHRAZGVmaW5lIFwiaGlzdG9yeUluZGV4XCIsXG5cdFx0Z2V0OiAtPiByZXR1cm4gQF9oaXN0b3J5SW5kZXhcblx0XHRcblx0QGRlZmluZSBcInN0YXRlXCIsXG5cdFx0Z2V0OiAtPiByZXR1cm4gQGN1cnJlbnQubmFtZVxuXHRcdHNldDogKHN0YXRlTmFtZSkgLT5cblx0XHRcdHJldHVybiB1bmxlc3Mgc3RhdGVOYW1lP1xuXHRcdFx0XG5cdFx0XHRAX3NldFN0YXRlKHN0YXRlTmFtZSlcblx0XHRcblx0QGRlZmluZSBcImN1cnJlbnRcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2N1cnJlbnRcblx0XHRcblx0QGRlZmluZSBcImluaXRpYWxcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2luaXRpYWxcblx0XHRzZXQ6ICh2YWx1ZSkgLT4gXG5cdFx0XHRAX2luaXRpYWwgPSB2YWx1ZVxuXHRcblx0QGRlZmluZSBcInN0YXRlc1wiLFxuXHRcdGdldDogLT4gQF9zdGF0ZXNcblx0XHRzZXQ6IChuZXdTdGF0ZXMpIC0+XG5cblx0XHRcdGdldFN0YXRlcyA9IChzdGF0ZXNPYmplY3QsIHRhcmdldCkgPT5cblx0XHRcdFx0dGFyZ2V0Ll9zdGF0ZXMgPSB7fVxuXG5cdFx0XHRcdG1hcmt1cFN0YXRlID0gKHZhbHVlLCBrZXksIG9iaikgPT5cblx0XHRcdFx0XHRzdGF0ZSA9XG5cdFx0XHRcdFx0XHRuYW1lOiBrZXlcblx0XHRcdFx0XHRcdHBhdGg6IFtdXG5cdFx0XHRcdFx0XHRzdGF0ZXM6IHt9XG5cdFx0XHRcdFx0XHRhY3Rpb25zOiB7fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIG9iai5wYXRoP1xuXHRcdFx0XHRcdFx0c3RhdGUucGF0aCA9IF8uY29uY2F0KG9iai5wYXRoLCBrZXkpXG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdGUucGF0aCA9IFtrZXldXG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdF8uZm9yRWFjaCB2YWx1ZSwgKHYsIGspID0+XG5cdFx0XHRcdFx0XHRzd2l0Y2ggdHlwZW9mIHZcblx0XHRcdFx0XHRcdFx0d2hlbiBcInN0cmluZ1wiXG5cdFx0XHRcdFx0XHRcdFx0c3RhdGUuYWN0aW9uc1trXSA9IHZcblx0XHRcdFx0XHRcdFx0d2hlbiBcImZ1bmN0aW9uXCJcblx0XHRcdFx0XHRcdFx0XHRzdGF0ZS5hY3Rpb25zW2tdID0gdlxuXHRcdFx0XHRcdFx0XHR3aGVuIFwib2JqZWN0XCJcblx0XHRcdFx0XHRcdFx0XHRzdGF0ZS5zdGF0ZXNba10gPSBtYXJrdXBTdGF0ZSh2LCBrLCBzdGF0ZSlcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRyZXR1cm4gc3RhdGVcblx0XHRcblx0XHRcdFx0Xy5mb3JFYWNoIHN0YXRlc09iamVjdCwgKHYsIGspIC0+IFxuXHRcdFx0XHRcdHRhcmdldC5fc3RhdGVzW2tdID0gbWFya3VwU3RhdGUodiwgaywgc3RhdGVzT2JqZWN0KVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gdGFyZ2V0XG5cdFx0XHRcblx0XHRcdGdldFN0YXRlcyhuZXdTdGF0ZXMsIEApXG5cblx0XHRcdCMgc2V0IGluaXRpYWwgc3RhdGUgKGRlbGF5ZWQgZm9yIGxpc3RlbmVycylcblx0XHRcdEBfc2V0SW5pdGlhbFN0YXRlcygpIiwiIyBBZGQgdGhlIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgcHJvamVjdCBpbiBGcmFtZXIgU3R1ZGlvLiBcbiMgbXlNb2R1bGUgPSByZXF1aXJlIFwibXlNb2R1bGVcIlxuIyBSZWZlcmVuY2UgdGhlIGNvbnRlbnRzIGJ5IG5hbWUsIGxpa2UgbXlNb2R1bGUubXlGdW5jdGlvbigpIG9yIG15TW9kdWxlLm15VmFyXG5cbmV4cG9ydHMubXlWYXIgPSBcIm15VmFyaWFibGVcIlxuXG5leHBvcnRzLm15RnVuY3Rpb24gPSAtPlxuXHRwcmludCBcIm15RnVuY3Rpb24gaXMgcnVubmluZ1wiXG5cbmV4cG9ydHMubXlBcnJheSA9IFsxLCAyLCAzXSIsIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBRUFBO0FESUEsT0FBTyxDQUFDLEtBQVIsR0FBZ0I7O0FBRWhCLE9BQU8sQ0FBQyxVQUFSLEdBQXFCLFNBQUE7U0FDcEIsS0FBQSxDQUFNLHVCQUFOO0FBRG9COztBQUdyQixPQUFPLENBQUMsT0FBUixHQUFrQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUDs7OztBRG9DbEIsSUFBQTs7OztBQUFNLE9BQU8sQ0FBQzs7O0VBQ0Esc0JBQUMsT0FBRDs7TUFBQyxVQUFVOzs7Ozs7Ozs7Ozs7O0lBQ3ZCLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUNDO01BQUEsT0FBQSxFQUFTLEVBQVQ7TUFDQSxRQUFBLEVBQVUsTUFEVjtNQUVBLFFBQUEsRUFBVSxFQUZWO01BR0EsYUFBQSxFQUFlLENBSGY7TUFLQSxPQUFBLEVBQVMsT0FBTyxDQUFDLE9BTGpCO01BTUEsTUFBQSxFQUFRLEVBTlI7S0FERDtJQVNBLElBQUMsQ0FBQSxNQUFELEdBQVUsT0FBTyxDQUFDO0VBVk47O3lCQWNiLFdBQUEsR0FBYSxTQUFBO0FBQ1osV0FBTyxJQUFDLENBQUE7RUFESTs7eUJBR2IsV0FBQSxHQUFhLFNBQUMsS0FBRDtJQUNaLElBQWMsYUFBZDtBQUFBLGFBQUE7O0FBRUEsWUFBTyxLQUFLLENBQUMsU0FBYjtBQUFBLFdBQ00sTUFETjtRQUVFLElBQUMsQ0FBQSxhQUFEO0FBREk7QUFETixXQUdNLE1BSE47UUFJRSxJQUFDLENBQUEsYUFBRDtBQURJO0FBSE47UUFNRSxJQUFHLG9CQUFIO1VBQ0MsSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFDLENBQUEsT0FBaEI7VUFDQSxJQUFDLENBQUEsYUFBRCxHQUZEOztBQU5GO0lBVUEsSUFBQyxDQUFBLFFBQUQsR0FBWTtJQUVaLElBQUMsQ0FBQSxJQUFELENBQU0sZ0JBQU4sRUFBd0IsS0FBeEIsRUFBK0IsSUFBL0I7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

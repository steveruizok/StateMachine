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

  StateMachine.prototype._setCurrent = function(state, payload, direction) {
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
          this._addToHistory(this.current, payload);
          this._historyIndex++;
        }
    }
    this._current = state;
    this.emit("change:current", state.name, payload, this);
    return this.emit("change:state", state.name, payload, this);
  };

  StateMachine.prototype._getNewState = function(stateName) {
    var getAtPath, handleState, newState, path;
    path = this._current.path.split('.');
    handleState = function(state) {
      if (typeof state === "function") {
        return state();
      } else {
        return state;
      }
    };
    getAtPath = (function(_this) {
      return function(array) {
        var state;
        if (array.length === 0) {
          if (!_this.states[stateName]) {
            throw "Couldn't find that state.";
            return;
          }
          return _this.states[stateName];
        }
        path = array.join('.');
        state = _.get(_this.states, path);
        if (state != null ? state.states[stateName] : void 0) {
          return state.states[stateName];
        }
        return getAtPath(_.dropRight(array));
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

  StateMachine.prototype._addToHistory = function(stateName, payload) {
    this._history = this._history.slice(0, this._historyIndex);
    return this._history.push({
      name: stateName,
      payload: payload
    });
  };

  StateMachine.prototype._setState = function(stateName, payload, direction) {
    var state;
    state = this._getNewState(stateName);
    if (state == null) {
      return;
    }
    return this._setCurrent(state, payload, direction);
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
              path: void 0,
              states: {},
              actions: {}
            };
            if (obj.path) {
              state.path = obj.path + "." + key;
            } else {
              state.path = key;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3N0ZXBoZW5ydWl6L0dpdEh1Yi9TdGF0ZU1hY2hpbmUvZXhhbXBsZXMvcGxheWVyLmZyYW1lci9tb2R1bGVzL3N0YXRlbWFjaGluZS5jb2ZmZWUiLCIuLi8uLi8uLi8uLi8uLi9Vc2Vycy9zdGVwaGVucnVpei9HaXRIdWIvU3RhdGVNYWNoaW5lL2V4YW1wbGVzL3BsYXllci5mcmFtZXIvbW9kdWxlcy9teU1vZHVsZS5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiMgU3RhdGVNYWNoaW5lXG4jIEBzdGV2ZXJ1aXpva1xuXG4jIFN0YXRlTWFjaGluZSBpcyBhIG1vZHVsZSB0aGF0IGFsbG93cyB5b3UgdG8gZGVzaWduIHN0YXRlLWJhc2VkIGNvbXBvbmVudHMuIFlvdSdsbCBjcmVhdGUgdGhlIG1hY2hpbmUgYnkgZGVmaW5pbmcgYSBzZXQgb2YgXCJzdGF0ZXNcIi4gRWFjaCBvZiB0aGVzZSBzdGF0ZXMgbWF5IGhhdmUgb25lIG9yIG1vcmUgXCJhY3Rpb25zXCIsIGFuZCBlYWNoIGFjdGlvbnMgcG9pbnRzIHRvIGEgZGlmZmVyZW50IHN0YXRlICggdGhlIGFjdGlvbidzIFwidGFyZ2V0IHN0YXRlXCIpLiBcblxuIyBUaGUgbWFjaGluZSBhbHdheXMgaGFzIGEgXCJjdXJyZW50IHN0YXRlXCIsIGVpdGhlciBpdHMgXCJpbml0aWFsIHN0YXRlXCIgb3IgYSBkaWZmZXJlbnQgc3RhdGUgdGhhdCBpdCBoYXMgY2hhbmdlZCB0byBhZnRlciByZWNpZXZpbmcgc29tZSBhY3Rpb25zLiBXaGVuIHRoZSBtYWNoaW5lIHJlY2lldmVzIGFuIGFjdGlvbnMsIGl0IGNoZWNrcyB0byBzZWUgaWYgaXRzIGN1cnJlbnQgc3RhdGUgb3ducyBhbiBhY3Rpb25zIHdpdGggdGhhdCBuYW1lLiBJZiBpdCBkb2VzLCB0aGUgbWFjaGluZSBjaGFuZ2VzIGl0cyBzdGF0ZSB0byB0aGF0IGFjdGlvbnMncyB0YXJnZXQgc3RhdGUuXG5cbiMgQFByb3BlcnRpZXNcblxuIyBoaXN0b3J5IDogc3RyaW5nW10gXG4jIFx0UmV0dXJucyB0aGUgbWFjaGluZSdzIGhpc3RvcnkuIChyZWFkLW9ubHkpXG5cbiMgaGlzdG9yeUluZGV4IDogbnVtYmVyIFxuIyBcdFJldHVybnMgdGhlIG1hY2hpbmUncyBoaXN0b3J5IGluZGV4LiAocmVhZC1vbmx5KVxuXG4jIGN1cnJlbnQgOiBzdHJpbmcgXG4jIFx0UmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgbWFjaGluZSdzIGN1cnJlbnQgc3RhdGUuIChyZWFkLW9ubHkpXG5cbiMgc3RhdGUgOiBzdHJpbmdcbiMgXHRHZXRzIGFuZCBzZXRzIHRoZSBtYWNoaW5lJ3MgY3VycmVudCBzdGF0ZSAoYnkgaXRzIG5hbWUpLlxuXG4jIGluaXRpYWwgOiBzdHJpbmdcbiMgXHRSZXR1cm5zIHRoZSBtYWNoaW5lJ3MgaGlzdG9yeSBpbmRleC5cblxuXG4jIEBNZXRob2RzXG5cbiMgZGlzcGF0Y2goIGFjdGlvbiA6IHN0cmluZywgcGF5bG9hZDogYW55IClcbiMgXHRTZW5kcyBhbiBhY3Rpb24gdG8gdGhlIG1hY2hpbmUuXG5cbiMgb25DaGFuZ2VTdGF0ZSggZm46IEV2ZW50TGlzdGVuZXIgKVxuIyBcdFNldHMgYW4gZXZlbnQgbGlzdGVuZXIgdGhhdCBmaXJlcyB3aGVuIHRoZSBtYWNoaW5lJ3Mgc3RhdGUgY2hhbmdlcy5cbiMgXHRBbGlhcyBmb3Igc3RhdGVtYWNoaW5lLm9uKFwiY2hhbmdlOnN0YXRlXCIpLlxuXG4jIG9uQ2hhbmdlQ3VycmVudCggZm46IEV2ZW50TGlzdGVuZXIgKVxuIyBcdElkZW50aWNhbCB0byBvbkNoYW5nZVN0YXRlIChyZWR1bmRhbmN5KS5cblxuIyB1bmRvKClcdFxuIyBcdE1vdmVzIHRoZSBTdGF0ZU1hY2hpbmUgdG8gaXRzIHByZXZpb3VzIHN0YXRlLCBpZiBvbmUgZXhpc3RzLlxuXG4jIHJlZG8oKVx0XG4jIFx0TW92ZXMgdGhlIFN0YXRlTWFjaGluZSB0byBpdHMgbmV4dCBzdGF0ZSwgaWYgb25lIGV4aXN0cy5cblxuXG5cbmNsYXNzIGV4cG9ydHMuU3RhdGVNYWNoaW5lIGV4dGVuZHMgRnJhbWVyLkJhc2VDbGFzc1xuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMgPSB7fSkgLT5cblx0XHRfLmFzc2lnbiBALFxuXHRcdFx0X3N0YXRlczoge31cblx0XHRcdF9jdXJyZW50OiB1bmRlZmluZWRcblx0XHRcdF9oaXN0b3J5OiBbXVxuXHRcdFx0X2hpc3RvcnlJbmRleDogMFxuXHRcdFx0XG5cdFx0XHRpbml0aWFsOiBvcHRpb25zLmluaXRpYWxcblx0XHRcdHN0YXRlczogW11cblx0XHRcblx0XHRAc3RhdGVzID0gb3B0aW9ucy5zdGF0ZXNcblx0XG5cdCMgUHJpdmF0ZSBtZXRob2RzXG5cdFxuXHRfZ2V0Q3VycmVudDogPT5cblx0XHRyZXR1cm4gQF9jdXJyZW50XG5cdFxuXHRfc2V0Q3VycmVudDogKHN0YXRlLCBwYXlsb2FkLCBkaXJlY3Rpb24pID0+XG5cdFx0cmV0dXJuIHVubGVzcyBzdGF0ZT9cblx0XHRcblx0XHRzd2l0Y2ggZGlyZWN0aW9uXG5cdFx0XHR3aGVuIFwidW5kb1wiXG5cdFx0XHRcdEBfaGlzdG9yeUluZGV4LS1cblx0XHRcdHdoZW4gXCJyZWRvXCJcblx0XHRcdFx0QF9oaXN0b3J5SW5kZXgrK1xuXHRcdFx0ZWxzZSBcblx0XHRcdFx0aWYgQGN1cnJlbnQ/XG5cdFx0XHRcdFx0QF9hZGRUb0hpc3RvcnkoQGN1cnJlbnQsIHBheWxvYWQpXG5cdFx0XHRcdFx0QF9oaXN0b3J5SW5kZXgrK1xuXHRcdFxuXHRcdEBfY3VycmVudCA9IHN0YXRlXG5cblx0XHRAZW1pdChcImNoYW5nZTpjdXJyZW50XCIsIHN0YXRlLm5hbWUsIHBheWxvYWQsIEApXG5cdFx0QGVtaXQoXCJjaGFuZ2U6c3RhdGVcIiwgc3RhdGUubmFtZSwgcGF5bG9hZCwgQClcblx0XG5cdF9nZXROZXdTdGF0ZTogKHN0YXRlTmFtZSkgPT5cblx0XHRwYXRoID0gQF9jdXJyZW50LnBhdGguc3BsaXQoJy4nKVxuXG5cdFx0aGFuZGxlU3RhdGUgPSAoc3RhdGUpIC0+XG5cdFx0XHRpZiB0eXBlb2Ygc3RhdGUgaXMgXCJmdW5jdGlvblwiXG5cdFx0XHRcdHJldHVybiBzdGF0ZSgpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJldHVybiBzdGF0ZVxuXG5cblx0XHRnZXRBdFBhdGggPSAoYXJyYXkpID0+XG5cdFx0XHRpZiBhcnJheS5sZW5ndGggaXMgMFxuXHRcdFx0XHR1bmxlc3MgQHN0YXRlc1tzdGF0ZU5hbWVdXG5cdFx0XHRcdFx0dGhyb3cgXCJDb3VsZG4ndCBmaW5kIHRoYXQgc3RhdGUuXCJcblx0XHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0XHRyZXR1cm4gQHN0YXRlc1tzdGF0ZU5hbWVdXG5cblx0XHRcdHBhdGggPSBhcnJheS5qb2luKCcuJylcblx0XHRcdHN0YXRlID0gXy5nZXQoQHN0YXRlcywgcGF0aClcblxuXHRcdFx0aWYgc3RhdGU/LnN0YXRlc1tzdGF0ZU5hbWVdXG5cdFx0XHRcdHJldHVybiBzdGF0ZS5zdGF0ZXNbc3RhdGVOYW1lXVxuXG5cdFx0XHRnZXRBdFBhdGgoXy5kcm9wUmlnaHQoYXJyYXkpKVxuXG5cdFx0bmV3U3RhdGUgPSBnZXRBdFBhdGgocGF0aClcblx0XHRyZXR1cm4gbmV3U3RhdGVcblxuXHRcdFxuXHRfc2V0SW5pdGlhbFN0YXRlczogPT5cblx0XHRpZiBAaW5pdGlhbFxuXHRcdFx0c3RhdGUgPSBfLmdldChAc3RhdGVzLCBAaW5pdGlhbClcblx0XHRcdGlmIHN0YXRlP1xuXHRcdFx0XHRAX2N1cnJlbnQgPSBzdGF0ZVxuXHRcdFx0XHRVdGlscy5kZWxheSAwLCA9PiBAX3NldEN1cnJlbnQoc3RhdGUpXG5cdFx0XHRcdHJldHVyblxuXG5cdFx0IyBmaXJzdCA9IF8ua2V5cyhAc3RhdGVzKVxuXHRcdEBfY3VycmVudCA9IEBzdGF0ZXNbXy5rZXlzKEBzdGF0ZXMpWzBdXVxuXHRcdFV0aWxzLmRlbGF5IDAsID0+IEBfc2V0Q3VycmVudChAX2N1cnJlbnQpXG5cdFx0XG5cdF9hZGRUb0hpc3Rvcnk6IChzdGF0ZU5hbWUsIHBheWxvYWQpID0+XG5cdFx0QF9oaXN0b3J5ID0gQF9oaXN0b3J5LnNsaWNlKDAsIEBfaGlzdG9yeUluZGV4KVxuXHRcdEBfaGlzdG9yeS5wdXNoKHtuYW1lOiBzdGF0ZU5hbWUsIHBheWxvYWQ6IHBheWxvYWR9KVxuXHRcblx0X3NldFN0YXRlOiAoc3RhdGVOYW1lLCBwYXlsb2FkLCBkaXJlY3Rpb24pID0+XG5cdFx0c3RhdGUgPSBAX2dldE5ld1N0YXRlKHN0YXRlTmFtZSlcblx0XHRcblx0XHR1bmxlc3Mgc3RhdGU/XG5cdFx0XHRyZXR1cm47XG5cdFx0XG5cdFx0dGhpcy5fc2V0Q3VycmVudChzdGF0ZSwgcGF5bG9hZCwgZGlyZWN0aW9uKVxuXHRcblx0XG5cdCMgUHVibGljIG1ldGhvZHNcblx0XG5cdGRpc3BhdGNoOiAoYWN0aW9uTmFtZSwgcGF5bG9hZCkgPT5cblx0XHRjdXJyZW50ID0gQF9nZXRDdXJyZW50KClcblxuXHRcdG5ld1N0YXRlTmFtZSA9IGN1cnJlbnQuYWN0aW9uc1thY3Rpb25OYW1lXVxuXHRcdGlmIHR5cGVvZiBuZXdTdGF0ZU5hbWUgaXMgXCJmdW5jdGlvblwiIHRoZW4gbmV3U3RhdGVOYW1lID0gbmV3U3RhdGVOYW1lKClcblx0XHRcblx0XHRpZiBfLmlzVW5kZWZpbmVkKG5ld1N0YXRlTmFtZSlcblx0XHRcdHJldHVyblxuXG5cdFx0QF9zZXRTdGF0ZShuZXdTdGF0ZU5hbWUsIHBheWxvYWQpXG5cdFx0XG5cdHVuZG86ID0+XG5cdFx0cmV0dXJuIGlmIEBfaGlzdG9yeUluZGV4IGlzIDBcblx0XHRcblx0XHRzdGF0ZSA9IEBfaGlzdG9yeVtAX2hpc3RvcnlJbmRleCAtIDFdXG5cdFx0QF9zZXRTdGF0ZShzdGF0ZS5uYW1lLCBzdGF0ZS5wYXlsb2FkLCBcInVuZG9cIilcblx0XHRcblx0cmVkbzogPT5cblx0XHRyZXR1cm4gaWYgQF9oaXN0b3J5SW5kZXggaXMgQF9oaXN0b3J5Lmxlbmd0aFxuXG5cdFx0c3RhdGUgPSBAX2hpc3RvcnlbQF9oaXN0b3J5SW5kZXggKyAxXVxuXHRcdEBfc2V0U3RhdGUoc3RhdGUubmFtZSwgc3RhdGUucGF5bG9hZCwgXCJyZWRvXCIpXG5cblx0b25TdGF0ZUNoYW5nZTogKGZuKSA9PlxuXHRcdEBvbihcImNoYW5nZTpzdGF0ZVwiLCBmbilcblx0XHRcblx0XHRcblx0IyBEZWZpbml0aW9uc1xuXHRcblx0QGRlZmluZSBcImhpc3RvcnlcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2hpc3RvcnlcblxuXHRAZGVmaW5lIFwiaGlzdG9yeUluZGV4XCIsXG5cdFx0Z2V0OiAtPiByZXR1cm4gQF9oaXN0b3J5SW5kZXhcblx0XHRcblx0QGRlZmluZSBcInN0YXRlXCIsXG5cdFx0Z2V0OiAtPiByZXR1cm4gQGN1cnJlbnQubmFtZVxuXHRcdHNldDogKHN0YXRlTmFtZSkgLT5cblx0XHRcdHJldHVybiB1bmxlc3Mgc3RhdGVOYW1lP1xuXHRcdFx0XG5cdFx0XHRAX3NldFN0YXRlKHN0YXRlTmFtZSlcblx0XHRcblx0QGRlZmluZSBcImN1cnJlbnRcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2N1cnJlbnRcblx0XHRcblx0QGRlZmluZSBcImluaXRpYWxcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2luaXRpYWxcblx0XHRzZXQ6ICh2YWx1ZSkgLT4gXG5cdFx0XHRAX2luaXRpYWwgPSB2YWx1ZVxuXHRcblx0QGRlZmluZSBcInN0YXRlc1wiLFxuXHRcdGdldDogLT4gQF9zdGF0ZXNcblx0XHRzZXQ6IChuZXdTdGF0ZXMpIC0+XG5cblx0XHRcdGdldFN0YXRlcyA9IChzdGF0ZXNPYmplY3QsIHRhcmdldCkgPT5cblx0XHRcdFx0dGFyZ2V0Ll9zdGF0ZXMgPSB7fVxuXG5cdFx0XHRcdG1hcmt1cFN0YXRlID0gKHZhbHVlLCBrZXksIG9iaikgPT5cblx0XHRcdFx0XHRzdGF0ZSA9XG5cdFx0XHRcdFx0XHRuYW1lOiBrZXlcblx0XHRcdFx0XHRcdHBhdGg6IHVuZGVmaW5lZFxuXHRcdFx0XHRcdFx0c3RhdGVzOiB7fVxuXHRcdFx0XHRcdFx0YWN0aW9uczoge31cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiBvYmoucGF0aCBcblx0XHRcdFx0XHRcdHN0YXRlLnBhdGggPSBvYmoucGF0aCArIFwiLlwiICsga2V5XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0c3RhdGUucGF0aCA9IGtleVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRfLmZvckVhY2ggdmFsdWUsICh2LCBrKSA9PlxuXHRcdFx0XHRcdFx0c3dpdGNoIHR5cGVvZiB2XG5cdFx0XHRcdFx0XHRcdHdoZW4gXCJzdHJpbmdcIlxuXHRcdFx0XHRcdFx0XHRcdHN0YXRlLmFjdGlvbnNba10gPSB2XG5cdFx0XHRcdFx0XHRcdHdoZW4gXCJmdW5jdGlvblwiXG5cdFx0XHRcdFx0XHRcdFx0c3RhdGUuYWN0aW9uc1trXSA9IHZcblx0XHRcdFx0XHRcdFx0d2hlbiBcIm9iamVjdFwiXG5cdFx0XHRcdFx0XHRcdFx0c3RhdGUuc3RhdGVzW2tdID0gbWFya3VwU3RhdGUodiwgaywgc3RhdGUpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0cmV0dXJuIHN0YXRlXG5cdFx0XG5cdFx0XHRcdF8uZm9yRWFjaCBzdGF0ZXNPYmplY3QsICh2LCBrKSAtPiBcblx0XHRcdFx0XHR0YXJnZXQuX3N0YXRlc1trXSA9IG1hcmt1cFN0YXRlKHYsIGssIHN0YXRlc09iamVjdClcblx0XHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIHRhcmdldFxuXHRcdFx0XG5cdFx0XHRnZXRTdGF0ZXMobmV3U3RhdGVzLCBAKVxuXG5cdFx0XHQjIHNldCBpbml0aWFsIHN0YXRlIChkZWxheWVkIGZvciBsaXN0ZW5lcnMpXG5cdFx0XHRAX3NldEluaXRpYWxTdGF0ZXMoKSIsIiMgQWRkIHRoZSBmb2xsb3dpbmcgbGluZSB0byB5b3VyIHByb2plY3QgaW4gRnJhbWVyIFN0dWRpby4gXG4jIG15TW9kdWxlID0gcmVxdWlyZSBcIm15TW9kdWxlXCJcbiMgUmVmZXJlbmNlIHRoZSBjb250ZW50cyBieSBuYW1lLCBsaWtlIG15TW9kdWxlLm15RnVuY3Rpb24oKSBvciBteU1vZHVsZS5teVZhclxuXG5leHBvcnRzLm15VmFyID0gXCJteVZhcmlhYmxlXCJcblxuZXhwb3J0cy5teUZ1bmN0aW9uID0gLT5cblx0cHJpbnQgXCJteUZ1bmN0aW9uIGlzIHJ1bm5pbmdcIlxuXG5leHBvcnRzLm15QXJyYXkgPSBbMSwgMiwgM10iLCIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUVBQTtBRElBLE9BQU8sQ0FBQyxLQUFSLEdBQWdCOztBQUVoQixPQUFPLENBQUMsVUFBUixHQUFxQixTQUFBO1NBQ3BCLEtBQUEsQ0FBTSx1QkFBTjtBQURvQjs7QUFHckIsT0FBTyxDQUFDLE9BQVIsR0FBa0IsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVA7Ozs7QURvQ2xCLElBQUE7Ozs7QUFBTSxPQUFPLENBQUM7OztFQUNBLHNCQUFDLE9BQUQ7O01BQUMsVUFBVTs7Ozs7Ozs7Ozs7O0lBQ3ZCLENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBVCxFQUNDO01BQUEsT0FBQSxFQUFTLEVBQVQ7TUFDQSxRQUFBLEVBQVUsTUFEVjtNQUVBLFFBQUEsRUFBVSxFQUZWO01BR0EsYUFBQSxFQUFlLENBSGY7TUFLQSxPQUFBLEVBQVMsT0FBTyxDQUFDLE9BTGpCO01BTUEsTUFBQSxFQUFRLEVBTlI7S0FERDtJQVNBLElBQUMsQ0FBQSxNQUFELEdBQVUsT0FBTyxDQUFDO0VBVk47O3lCQWNiLFdBQUEsR0FBYSxTQUFBO0FBQ1osV0FBTyxJQUFDLENBQUE7RUFESTs7eUJBR2IsV0FBQSxHQUFhLFNBQUMsS0FBRCxFQUFRLE9BQVIsRUFBaUIsU0FBakI7SUFDWixJQUFjLGFBQWQ7QUFBQSxhQUFBOztBQUVBLFlBQU8sU0FBUDtBQUFBLFdBQ00sTUFETjtRQUVFLElBQUMsQ0FBQSxhQUFEO0FBREk7QUFETixXQUdNLE1BSE47UUFJRSxJQUFDLENBQUEsYUFBRDtBQURJO0FBSE47UUFNRSxJQUFHLG9CQUFIO1VBQ0MsSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFDLENBQUEsT0FBaEIsRUFBeUIsT0FBekI7VUFDQSxJQUFDLENBQUEsYUFBRCxHQUZEOztBQU5GO0lBVUEsSUFBQyxDQUFBLFFBQUQsR0FBWTtJQUVaLElBQUMsQ0FBQSxJQUFELENBQU0sZ0JBQU4sRUFBd0IsS0FBSyxDQUFDLElBQTlCLEVBQW9DLE9BQXBDLEVBQTZDLElBQTdDO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxjQUFOLEVBQXNCLEtBQUssQ0FBQyxJQUE1QixFQUFrQyxPQUFsQyxFQUEyQyxJQUEzQztFQWhCWTs7eUJBa0JiLFlBQUEsR0FBYyxTQUFDLFNBQUQ7QUFDYixRQUFBO0lBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQWYsQ0FBcUIsR0FBckI7SUFFUCxXQUFBLEdBQWMsU0FBQyxLQUFEO01BQ2IsSUFBRyxPQUFPLEtBQVAsS0FBZ0IsVUFBbkI7QUFDQyxlQUFPLEtBQUEsQ0FBQSxFQURSO09BQUEsTUFBQTtBQUdDLGVBQU8sTUFIUjs7SUFEYTtJQU9kLFNBQUEsR0FBWSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUMsS0FBRDtBQUNYLFlBQUE7UUFBQSxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1VBQ0MsSUFBQSxDQUFPLEtBQUMsQ0FBQSxNQUFPLENBQUEsU0FBQSxDQUFmO0FBQ0Msa0JBQU07QUFDTixtQkFGRDs7QUFJQSxpQkFBTyxLQUFDLENBQUEsTUFBTyxDQUFBLFNBQUEsRUFMaEI7O1FBT0EsSUFBQSxHQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWDtRQUNQLEtBQUEsR0FBUSxDQUFDLENBQUMsR0FBRixDQUFNLEtBQUMsQ0FBQSxNQUFQLEVBQWUsSUFBZjtRQUVSLG9CQUFHLEtBQUssQ0FBRSxNQUFPLENBQUEsU0FBQSxVQUFqQjtBQUNDLGlCQUFPLEtBQUssQ0FBQyxNQUFPLENBQUEsU0FBQSxFQURyQjs7ZUFHQSxTQUFBLENBQVUsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxLQUFaLENBQVY7TUFkVztJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7SUFnQlosUUFBQSxHQUFXLFNBQUEsQ0FBVSxJQUFWO0FBQ1gsV0FBTztFQTNCTTs7eUJBOEJkLGlCQUFBLEdBQW1CLFNBQUE7QUFDbEIsUUFBQTtJQUFBLElBQUcsSUFBQyxDQUFBLE9BQUo7TUFDQyxLQUFBLEdBQVEsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxJQUFDLENBQUEsTUFBUCxFQUFlLElBQUMsQ0FBQSxPQUFoQjtNQUNSLElBQUcsYUFBSDtRQUNDLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFDWixLQUFLLENBQUMsS0FBTixDQUFZLENBQVosRUFBZSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxXQUFELENBQWEsS0FBYjtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmO0FBQ0EsZUFIRDtPQUZEOztJQVFBLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLE1BQU8sQ0FBQSxDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxNQUFSLENBQWdCLENBQUEsQ0FBQSxDQUFoQjtXQUNwQixLQUFLLENBQUMsS0FBTixDQUFZLENBQVosRUFBZSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7ZUFBRyxLQUFDLENBQUEsV0FBRCxDQUFhLEtBQUMsQ0FBQSxRQUFkO01BQUg7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7RUFWa0I7O3lCQVluQixhQUFBLEdBQWUsU0FBQyxTQUFELEVBQVksT0FBWjtJQUNkLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFWLENBQWdCLENBQWhCLEVBQW1CLElBQUMsQ0FBQSxhQUFwQjtXQUNaLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlO01BQUMsSUFBQSxFQUFNLFNBQVA7TUFBa0IsT0FBQSxFQUFTLE9BQTNCO0tBQWY7RUFGYzs7eUJBSWYsU0FBQSxHQUFXLFNBQUMsU0FBRCxFQUFZLE9BQVosRUFBcUIsU0FBckI7QUFDVixRQUFBO0lBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxZQUFELENBQWMsU0FBZDtJQUVSLElBQU8sYUFBUDtBQUNDLGFBREQ7O1dBR0EsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsS0FBakIsRUFBd0IsT0FBeEIsRUFBaUMsU0FBakM7RUFOVTs7eUJBV1gsUUFBQSxHQUFVLFNBQUMsVUFBRCxFQUFhLE9BQWI7QUFDVCxRQUFBO0lBQUEsT0FBQSxHQUFVLElBQUMsQ0FBQSxXQUFELENBQUE7SUFFVixZQUFBLEdBQWUsT0FBTyxDQUFDLE9BQVEsQ0FBQSxVQUFBO0lBQy9CLElBQUcsT0FBTyxZQUFQLEtBQXVCLFVBQTFCO01BQTBDLFlBQUEsR0FBZSxZQUFBLENBQUEsRUFBekQ7O0lBRUEsSUFBRyxDQUFDLENBQUMsV0FBRixDQUFjLFlBQWQsQ0FBSDtBQUNDLGFBREQ7O1dBR0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxZQUFYLEVBQXlCLE9BQXpCO0VBVFM7O3lCQVdWLElBQUEsR0FBTSxTQUFBO0FBQ0wsUUFBQTtJQUFBLElBQVUsSUFBQyxDQUFBLGFBQUQsS0FBa0IsQ0FBNUI7QUFBQSxhQUFBOztJQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUMsQ0FBQSxhQUFELEdBQWlCLENBQWpCO1dBQ2xCLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBSyxDQUFDLElBQWpCLEVBQXVCLEtBQUssQ0FBQyxPQUE3QixFQUFzQyxNQUF0QztFQUpLOzt5QkFNTixJQUFBLEdBQU0sU0FBQTtBQUNMLFFBQUE7SUFBQSxJQUFVLElBQUMsQ0FBQSxhQUFELEtBQWtCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBdEM7QUFBQSxhQUFBOztJQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUMsQ0FBQSxhQUFELEdBQWlCLENBQWpCO1dBQ2xCLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBSyxDQUFDLElBQWpCLEVBQXVCLEtBQUssQ0FBQyxPQUE3QixFQUFzQyxNQUF0QztFQUpLOzt5QkFNTixhQUFBLEdBQWUsU0FBQyxFQUFEO1dBQ2QsSUFBQyxDQUFBLEVBQUQsQ0FBSSxjQUFKLEVBQW9CLEVBQXBCO0VBRGM7O0VBTWYsWUFBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLEVBQ0M7SUFBQSxHQUFBLEVBQUssU0FBQTtBQUFHLGFBQU8sSUFBQyxDQUFBO0lBQVgsQ0FBTDtHQUREOztFQUdBLFlBQUMsQ0FBQSxNQUFELENBQVEsY0FBUixFQUNDO0lBQUEsR0FBQSxFQUFLLFNBQUE7QUFBRyxhQUFPLElBQUMsQ0FBQTtJQUFYLENBQUw7R0FERDs7RUFHQSxZQUFDLENBQUEsTUFBRCxDQUFRLE9BQVIsRUFDQztJQUFBLEdBQUEsRUFBSyxTQUFBO0FBQUcsYUFBTyxJQUFDLENBQUEsT0FBTyxDQUFDO0lBQW5CLENBQUw7SUFDQSxHQUFBLEVBQUssU0FBQyxTQUFEO01BQ0osSUFBYyxpQkFBZDtBQUFBLGVBQUE7O2FBRUEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxTQUFYO0lBSEksQ0FETDtHQUREOztFQU9BLFlBQUMsQ0FBQSxNQUFELENBQVEsU0FBUixFQUNDO0lBQUEsR0FBQSxFQUFLLFNBQUE7QUFBRyxhQUFPLElBQUMsQ0FBQTtJQUFYLENBQUw7R0FERDs7RUFHQSxZQUFDLENBQUEsTUFBRCxDQUFRLFNBQVIsRUFDQztJQUFBLEdBQUEsRUFBSyxTQUFBO0FBQUcsYUFBTyxJQUFDLENBQUE7SUFBWCxDQUFMO0lBQ0EsR0FBQSxFQUFLLFNBQUMsS0FBRDthQUNKLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFEUixDQURMO0dBREQ7O0VBS0EsWUFBQyxDQUFBLE1BQUQsQ0FBUSxRQUFSLEVBQ0M7SUFBQSxHQUFBLEVBQUssU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKLENBQUw7SUFDQSxHQUFBLEVBQUssU0FBQyxTQUFEO0FBRUosVUFBQTtNQUFBLFNBQUEsR0FBWSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsWUFBRCxFQUFlLE1BQWY7QUFDWCxjQUFBO1VBQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUI7VUFFakIsV0FBQSxHQUFjLFNBQUMsS0FBRCxFQUFRLEdBQVIsRUFBYSxHQUFiO0FBQ2IsZ0JBQUE7WUFBQSxLQUFBLEdBQ0M7Y0FBQSxJQUFBLEVBQU0sR0FBTjtjQUNBLElBQUEsRUFBTSxNQUROO2NBRUEsTUFBQSxFQUFRLEVBRlI7Y0FHQSxPQUFBLEVBQVMsRUFIVDs7WUFLRCxJQUFHLEdBQUcsQ0FBQyxJQUFQO2NBQ0MsS0FBSyxDQUFDLElBQU4sR0FBYSxHQUFHLENBQUMsSUFBSixHQUFXLEdBQVgsR0FBaUIsSUFEL0I7YUFBQSxNQUFBO2NBR0MsS0FBSyxDQUFDLElBQU4sR0FBYSxJQUhkOztZQUtBLENBQUMsQ0FBQyxPQUFGLENBQVUsS0FBVixFQUFpQixTQUFDLENBQUQsRUFBSSxDQUFKO0FBQ2hCLHNCQUFPLE9BQU8sQ0FBZDtBQUFBLHFCQUNNLFFBRE47eUJBRUUsS0FBSyxDQUFDLE9BQVEsQ0FBQSxDQUFBLENBQWQsR0FBbUI7QUFGckIscUJBR00sVUFITjt5QkFJRSxLQUFLLENBQUMsT0FBUSxDQUFBLENBQUEsQ0FBZCxHQUFtQjtBQUpyQixxQkFLTSxRQUxOO3lCQU1FLEtBQUssQ0FBQyxNQUFPLENBQUEsQ0FBQSxDQUFiLEdBQWtCLFdBQUEsQ0FBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixLQUFsQjtBQU5wQjtZQURnQixDQUFqQjtBQVNBLG1CQUFPO1VBckJNO1VBdUJkLENBQUMsQ0FBQyxPQUFGLENBQVUsWUFBVixFQUF3QixTQUFDLENBQUQsRUFBSSxDQUFKO21CQUN2QixNQUFNLENBQUMsT0FBUSxDQUFBLENBQUEsQ0FBZixHQUFvQixXQUFBLENBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsWUFBbEI7VUFERyxDQUF4QjtBQUdBLGlCQUFPO1FBN0JJO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQStCWixTQUFBLENBQVUsU0FBVixFQUFxQixJQUFyQjthQUdBLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBcENJLENBREw7R0FERDs7OztHQS9Ja0MsTUFBTSxDQUFDIn0=

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3N0ZXBoZW5ydWl6L0dpdEh1Yi9TdGF0ZU1hY2hpbmUvZXhhbXBsZXMvZm9ybS5mcmFtZXIvbW9kdWxlcy9zdGF0ZW1hY2hpbmUuY29mZmVlIiwiLi4vLi4vLi4vLi4vLi4vVXNlcnMvc3RlcGhlbnJ1aXovR2l0SHViL1N0YXRlTWFjaGluZS9leGFtcGxlcy9mb3JtLmZyYW1lci9tb2R1bGVzL215TW9kdWxlLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyBTdGF0ZU1hY2hpbmVcbiMgQHN0ZXZlcnVpem9rXG5cbiMgU3RhdGVNYWNoaW5lIGlzIGEgbW9kdWxlIHRoYXQgYWxsb3dzIHlvdSB0byBkZXNpZ24gc3RhdGUtYmFzZWQgY29tcG9uZW50cy4gWW91J2xsIGNyZWF0ZSB0aGUgbWFjaGluZSBieSBkZWZpbmluZyBhIHNldCBvZiBcInN0YXRlc1wiLiBFYWNoIG9mIHRoZXNlIHN0YXRlcyBtYXkgaGF2ZSBvbmUgb3IgbW9yZSBcImFjdGlvbnNcIiwgYW5kIGVhY2ggYWN0aW9ucyBwb2ludHMgdG8gYSBkaWZmZXJlbnQgc3RhdGUgKCB0aGUgYWN0aW9uJ3MgXCJ0YXJnZXQgc3RhdGVcIikuIFxuXG4jIFRoZSBtYWNoaW5lIGFsd2F5cyBoYXMgYSBcImN1cnJlbnQgc3RhdGVcIiwgZWl0aGVyIGl0cyBcImluaXRpYWwgc3RhdGVcIiBvciBhIGRpZmZlcmVudCBzdGF0ZSB0aGF0IGl0IGhhcyBjaGFuZ2VkIHRvIGFmdGVyIHJlY2lldmluZyBzb21lIGFjdGlvbnMuIFdoZW4gdGhlIG1hY2hpbmUgcmVjaWV2ZXMgYW4gYWN0aW9ucywgaXQgY2hlY2tzIHRvIHNlZSBpZiBpdHMgY3VycmVudCBzdGF0ZSBvd25zIGFuIGFjdGlvbnMgd2l0aCB0aGF0IG5hbWUuIElmIGl0IGRvZXMsIHRoZSBtYWNoaW5lIGNoYW5nZXMgaXRzIHN0YXRlIHRvIHRoYXQgYWN0aW9ucydzIHRhcmdldCBzdGF0ZS5cblxuIyBAUHJvcGVydGllc1xuXG4jIGhpc3RvcnkgOiBzdHJpbmdbXSBcbiMgXHRSZXR1cm5zIHRoZSBtYWNoaW5lJ3MgaGlzdG9yeS4gKHJlYWQtb25seSlcblxuIyBoaXN0b3J5SW5kZXggOiBudW1iZXIgXG4jIFx0UmV0dXJucyB0aGUgbWFjaGluZSdzIGhpc3RvcnkgaW5kZXguIChyZWFkLW9ubHkpXG5cbiMgY3VycmVudCA6IHN0cmluZyBcbiMgXHRSZXR1cm5zIHRoZSBuYW1lIG9mIHRoZSBtYWNoaW5lJ3MgY3VycmVudCBzdGF0ZS4gKHJlYWQtb25seSlcblxuIyBzdGF0ZSA6IHN0cmluZ1xuIyBcdEdldHMgYW5kIHNldHMgdGhlIG1hY2hpbmUncyBjdXJyZW50IHN0YXRlIChieSBpdHMgbmFtZSkuXG5cbiMgaW5pdGlhbCA6IHN0cmluZ1xuIyBcdFJldHVybnMgdGhlIG1hY2hpbmUncyBoaXN0b3J5IGluZGV4LlxuXG5cbiMgQE1ldGhvZHNcblxuIyBkaXNwYXRjaCggYWN0aW9uIDogc3RyaW5nLCBwYXlsb2FkOiBhbnkgKVxuIyBcdFNlbmRzIGFuIGFjdGlvbiB0byB0aGUgbWFjaGluZS5cblxuIyBvbkNoYW5nZVN0YXRlKCBmbjogRXZlbnRMaXN0ZW5lciApXG4jIFx0U2V0cyBhbiBldmVudCBsaXN0ZW5lciB0aGF0IGZpcmVzIHdoZW4gdGhlIG1hY2hpbmUncyBzdGF0ZSBjaGFuZ2VzLlxuIyBcdEFsaWFzIGZvciBzdGF0ZW1hY2hpbmUub24oXCJjaGFuZ2U6c3RhdGVcIikuXG5cbiMgb25DaGFuZ2VDdXJyZW50KCBmbjogRXZlbnRMaXN0ZW5lciApXG4jIFx0SWRlbnRpY2FsIHRvIG9uQ2hhbmdlU3RhdGUgKHJlZHVuZGFuY3kpLlxuXG4jIHVuZG8oKVx0XG4jIFx0TW92ZXMgdGhlIFN0YXRlTWFjaGluZSB0byBpdHMgcHJldmlvdXMgc3RhdGUsIGlmIG9uZSBleGlzdHMuXG5cbiMgcmVkbygpXHRcbiMgXHRNb3ZlcyB0aGUgU3RhdGVNYWNoaW5lIHRvIGl0cyBuZXh0IHN0YXRlLCBpZiBvbmUgZXhpc3RzLlxuXG5cblxuY2xhc3MgZXhwb3J0cy5TdGF0ZU1hY2hpbmUgZXh0ZW5kcyBGcmFtZXIuQmFzZUNsYXNzXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucyA9IHt9KSAtPlxuXHRcdF8uYXNzaWduIEAsXG5cdFx0XHRfc3RhdGVzOiB7fVxuXHRcdFx0X2N1cnJlbnQ6IHVuZGVmaW5lZFxuXHRcdFx0X2hpc3Rvcnk6IFtdXG5cdFx0XHRfaGlzdG9yeUluZGV4OiAwXG5cdFx0XHRcblx0XHRcdGluaXRpYWw6IG9wdGlvbnMuaW5pdGlhbFxuXHRcdFx0c3RhdGVzOiBbXVxuXHRcdFxuXHRcdEBzdGF0ZXMgPSBvcHRpb25zLnN0YXRlc1xuXHRcblx0IyBQcml2YXRlIG1ldGhvZHNcblx0XG5cdF9nZXRDdXJyZW50OiA9PlxuXHRcdHJldHVybiBAX2N1cnJlbnRcblx0XG5cdF9zZXRDdXJyZW50OiAoc3RhdGUpID0+XG5cdFx0cmV0dXJuIHVubGVzcyBzdGF0ZT9cblx0XHRcblx0XHRzd2l0Y2ggc3RhdGUuZGlyZWN0aW9uXG5cdFx0XHR3aGVuIFwidW5kb1wiXG5cdFx0XHRcdEBfaGlzdG9yeUluZGV4LS1cblx0XHRcdHdoZW4gXCJyZWRvXCJcblx0XHRcdFx0QF9oaXN0b3J5SW5kZXgrK1xuXHRcdFx0ZWxzZSBcblx0XHRcdFx0aWYgQGN1cnJlbnQ/XG5cdFx0XHRcdFx0QF9hZGRUb0hpc3RvcnkoQGN1cnJlbnQpXG5cdFx0XHRcdFx0QF9oaXN0b3J5SW5kZXgrK1xuXHRcdFxuXHRcdEBfY3VycmVudCA9IHN0YXRlXG5cblx0XHRAZW1pdChcImNoYW5nZTpjdXJyZW50XCIsIHN0YXRlLCBAKVxuXHRcdEBlbWl0KFwiY2hhbmdlOnN0YXRlXCIsIHN0YXRlLCBAKVxuXHRcblx0X2dldE5ld1N0YXRlOiAoc3RhdGVOYW1lKSA9PlxuXHRcdGlmIF8uaW5jbHVkZXMoc3RhdGVOYW1lLCBcIi5cIilcblx0XHRcdCMgaXMgYSBwYXRoXG5cdFx0XHRwYXRoID0gc3RhdGVOYW1lLnNwbGl0KFwiLlwiKS5qb2luKFwiLnN0YXRlcy5cIilcblx0XHRcdG5ld1N0YXRlID0gXy5nZXQoQHN0YXRlcywgcGF0aClcblx0XHRcdHJldHVybiBuZXdTdGF0ZVxuXG5cdFx0IyB3b3JrIHVwIGN1cnJlbnQgc3RhdGUgdHJlZVxuXHRcdHBhdGggPSBAX2N1cnJlbnQucGF0aFxuXG5cdFx0aGFuZGxlU3RhdGUgPSAoc3RhdGUpIC0+XG5cdFx0XHRpZiB0eXBlb2Ygc3RhdGUgaXMgXCJmdW5jdGlvblwiXG5cdFx0XHRcdHJldHVybiBzdGF0ZSgpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJldHVybiBzdGF0ZVxuXG5cblx0XHRnZXRBdFBhdGggPSAoYXJyYXkpID0+XG5cblx0XHRcdGlmIGFycmF5Lmxlbmd0aCBpcyAwXG5cdFx0XHRcdHVubGVzcyBAc3RhdGVzW3N0YXRlTmFtZV1cblx0XHRcdFx0XHR0aHJvdyBcIkNvdWxkbid0IGZpbmQgdGhhdCBzdGF0ZSAoI3tzdGF0ZU5hbWV9KS5cIlxuXHRcdFx0XHRcdHJldHVyblxuXG5cdFx0XHRcdHJldHVybiBAc3RhdGVzW3N0YXRlTmFtZV1cblxuXHRcdFx0cCA9IGFycmF5LmpvaW4oJy5zdGF0ZXMuJylcblxuXHRcdFx0c3RhdGUgPSBfLmdldChAc3RhdGVzLCBwICsgXCIuc3RhdGVzLlwiICsgc3RhdGVOYW1lKVxuXHRcdFx0aWYgc3RhdGVcblx0XHRcdFx0cmV0dXJuIHN0YXRlXG5cblx0XHRcdHJldHVybiBzdGF0ZSA/IGdldEF0UGF0aChfLmRyb3BSaWdodChhcnJheSkpXG5cblx0XHRuZXdTdGF0ZSA9IGdldEF0UGF0aChwYXRoKVxuXHRcdHJldHVybiBuZXdTdGF0ZVxuXG5cdFx0XG5cdF9zZXRJbml0aWFsU3RhdGVzOiA9PlxuXHRcdGlmIEBpbml0aWFsXG5cdFx0XHRzdGF0ZSA9IF8uZ2V0KEBzdGF0ZXMsIEBpbml0aWFsKVxuXHRcdFx0aWYgc3RhdGU/XG5cdFx0XHRcdEBfY3VycmVudCA9IHN0YXRlXG5cdFx0XHRcdFV0aWxzLmRlbGF5IDAsID0+IEBfc2V0Q3VycmVudChzdGF0ZSlcblx0XHRcdFx0cmV0dXJuXG5cblx0XHQjIGZpcnN0ID0gXy5rZXlzKEBzdGF0ZXMpXG5cdFx0QF9jdXJyZW50ID0gQHN0YXRlc1tfLmtleXMoQHN0YXRlcylbMF1dXG5cdFx0VXRpbHMuZGVsYXkgMCwgPT4gQF9zZXRDdXJyZW50KEBfY3VycmVudClcblx0XHRcblx0X2FkZFRvSGlzdG9yeTogKHN0YXRlLCBwYXlsb2FkKSA9PlxuXHRcdEBfaGlzdG9yeSA9IEBfaGlzdG9yeS5zbGljZSgwLCBAX2hpc3RvcnlJbmRleClcblx0XHRAX2hpc3RvcnkucHVzaChzdGF0ZSlcblx0XG5cdF9zZXRTdGF0ZTogKHN0YXRlTmFtZSwgcGF5bG9hZCwgZGlyZWN0aW9uKSA9PlxuXHRcdHN0YXRlID0gQF9nZXROZXdTdGF0ZShzdGF0ZU5hbWUpXG5cdFx0XG5cdFx0dW5sZXNzIHN0YXRlP1xuXHRcdFx0cmV0dXJuO1xuXHRcdFxuXHRcdF8uYXNzaWduIHN0YXRlLFxuXHRcdFx0cGF5bG9hZDogcGF5bG9hZFxuXHRcdFx0ZGlyZWN0aW9uOiBkaXJlY3Rpb25cblxuXHRcdHRoaXMuX3NldEN1cnJlbnQoc3RhdGUpXG5cdFxuXHRcblx0IyBQdWJsaWMgbWV0aG9kc1xuXG5cdGlzSW5TdGF0ZTogKHN0YXRlTmFtZSkgPT5cblx0XHRyZXR1cm4gXy5pbmNsdWRlcyhAY3VycmVudD8ucGF0aCwgc3RhdGVOYW1lKVxuXHRcblx0ZGlzcGF0Y2g6IChhY3Rpb25OYW1lLCBwYXlsb2FkKSA9PlxuXHRcdGN1cnJlbnQgPSBAX2dldEN1cnJlbnQoKVxuXG5cdFx0bmV3U3RhdGVOYW1lID0gY3VycmVudC5hY3Rpb25zW2FjdGlvbk5hbWVdXG5cdFx0aWYgdHlwZW9mIG5ld1N0YXRlTmFtZSBpcyBcImZ1bmN0aW9uXCIgdGhlbiBuZXdTdGF0ZU5hbWUgPSBuZXdTdGF0ZU5hbWUoKVxuXHRcdFxuXHRcdGlmIF8uaXNVbmRlZmluZWQobmV3U3RhdGVOYW1lKVxuXHRcdFx0cmV0dXJuXG5cblx0XHRAX3NldFN0YXRlKG5ld1N0YXRlTmFtZSwgcGF5bG9hZClcblx0XHRcblx0dW5kbzogPT5cblx0XHRyZXR1cm4gaWYgQF9oaXN0b3J5SW5kZXggaXMgMFxuXHRcdFxuXHRcdHN0YXRlID0gQF9oaXN0b3J5W0BfaGlzdG9yeUluZGV4IC0gMV1cblx0XHRAX3NldFN0YXRlKHN0YXRlLm5hbWUsIHN0YXRlLnBheWxvYWQsIFwidW5kb1wiKVxuXHRcdFxuXHRyZWRvOiA9PlxuXHRcdHJldHVybiBpZiBAX2hpc3RvcnlJbmRleCBpcyBAX2hpc3RvcnkubGVuZ3RoXG5cblx0XHRzdGF0ZSA9IEBfaGlzdG9yeVtAX2hpc3RvcnlJbmRleCArIDFdXG5cdFx0QF9zZXRTdGF0ZShzdGF0ZS5uYW1lLCBzdGF0ZS5wYXlsb2FkLCBcInJlZG9cIilcblxuXHRvblN0YXRlQ2hhbmdlOiAoZm4pID0+XG5cdFx0QG9uKFwiY2hhbmdlOnN0YXRlXCIsIGZuKVxuXHRcdFxuXHRcdFxuXHQjIERlZmluaXRpb25zXG5cdFxuXHRAZGVmaW5lIFwiaGlzdG9yeVwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfaGlzdG9yeVxuXG5cdEBkZWZpbmUgXCJoaXN0b3J5SW5kZXhcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2hpc3RvcnlJbmRleFxuXHRcdFxuXHRAZGVmaW5lIFwic3RhdGVcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAY3VycmVudC5uYW1lXG5cdFx0c2V0OiAoc3RhdGVOYW1lKSAtPlxuXHRcdFx0cmV0dXJuIHVubGVzcyBzdGF0ZU5hbWU/XG5cdFx0XHRcblx0XHRcdEBfc2V0U3RhdGUoc3RhdGVOYW1lKVxuXHRcdFxuXHRAZGVmaW5lIFwiY3VycmVudFwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfY3VycmVudFxuXHRcdFxuXHRAZGVmaW5lIFwiaW5pdGlhbFwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfaW5pdGlhbFxuXHRcdHNldDogKHZhbHVlKSAtPiBcblx0XHRcdEBfaW5pdGlhbCA9IHZhbHVlXG5cdFxuXHRAZGVmaW5lIFwic3RhdGVzXCIsXG5cdFx0Z2V0OiAtPiBAX3N0YXRlc1xuXHRcdHNldDogKG5ld1N0YXRlcykgLT5cblxuXHRcdFx0Z2V0U3RhdGVzID0gKHN0YXRlc09iamVjdCwgdGFyZ2V0KSA9PlxuXHRcdFx0XHR0YXJnZXQuX3N0YXRlcyA9IHt9XG5cblx0XHRcdFx0bWFya3VwU3RhdGUgPSAodmFsdWUsIGtleSwgb2JqKSA9PlxuXHRcdFx0XHRcdHN0YXRlID1cblx0XHRcdFx0XHRcdG5hbWU6IGtleVxuXHRcdFx0XHRcdFx0cGF0aDogW11cblx0XHRcdFx0XHRcdHN0YXRlczoge31cblx0XHRcdFx0XHRcdGFjdGlvbnM6IHt9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgb2JqLnBhdGg/XG5cdFx0XHRcdFx0XHRzdGF0ZS5wYXRoID0gXy5jb25jYXQob2JqLnBhdGgsIGtleSlcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRzdGF0ZS5wYXRoID0gW2tleV1cblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0Xy5mb3JFYWNoIHZhbHVlLCAodiwgaykgPT5cblx0XHRcdFx0XHRcdHN3aXRjaCB0eXBlb2YgdlxuXHRcdFx0XHRcdFx0XHR3aGVuIFwic3RyaW5nXCJcblx0XHRcdFx0XHRcdFx0XHRzdGF0ZS5hY3Rpb25zW2tdID0gdlxuXHRcdFx0XHRcdFx0XHR3aGVuIFwiZnVuY3Rpb25cIlxuXHRcdFx0XHRcdFx0XHRcdHN0YXRlLmFjdGlvbnNba10gPSB2XG5cdFx0XHRcdFx0XHRcdHdoZW4gXCJvYmplY3RcIlxuXHRcdFx0XHRcdFx0XHRcdHN0YXRlLnN0YXRlc1trXSA9IG1hcmt1cFN0YXRlKHYsIGssIHN0YXRlKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHJldHVybiBzdGF0ZVxuXHRcdFxuXHRcdFx0XHRfLmZvckVhY2ggc3RhdGVzT2JqZWN0LCAodiwgaykgLT4gXG5cdFx0XHRcdFx0dGFyZ2V0Ll9zdGF0ZXNba10gPSBtYXJrdXBTdGF0ZSh2LCBrLCBzdGF0ZXNPYmplY3QpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiB0YXJnZXRcblx0XHRcdFxuXHRcdFx0Z2V0U3RhdGVzKG5ld1N0YXRlcywgQClcblxuXHRcdFx0IyBzZXQgaW5pdGlhbCBzdGF0ZSAoZGVsYXllZCBmb3IgbGlzdGVuZXJzKVxuXHRcdFx0QF9zZXRJbml0aWFsU3RhdGVzKCkiLCIjIEFkZCB0aGUgZm9sbG93aW5nIGxpbmUgdG8geW91ciBwcm9qZWN0IGluIEZyYW1lciBTdHVkaW8uIFxuIyBteU1vZHVsZSA9IHJlcXVpcmUgXCJteU1vZHVsZVwiXG4jIFJlZmVyZW5jZSB0aGUgY29udGVudHMgYnkgbmFtZSwgbGlrZSBteU1vZHVsZS5teUZ1bmN0aW9uKCkgb3IgbXlNb2R1bGUubXlWYXJcblxuZXhwb3J0cy5teVZhciA9IFwibXlWYXJpYWJsZVwiXG5cbmV4cG9ydHMubXlGdW5jdGlvbiA9IC0+XG5cdHByaW50IFwibXlGdW5jdGlvbiBpcyBydW5uaW5nXCJcblxuZXhwb3J0cy5teUFycmF5ID0gWzEsIDIsIDNdIiwiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFFQUE7QURJQSxPQUFPLENBQUMsS0FBUixHQUFnQjs7QUFFaEIsT0FBTyxDQUFDLFVBQVIsR0FBcUIsU0FBQTtTQUNwQixLQUFBLENBQU0sdUJBQU47QUFEb0I7O0FBR3JCLE9BQU8sQ0FBQyxPQUFSLEdBQWtCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQOzs7O0FEb0NsQixJQUFBOzs7O0FBQU0sT0FBTyxDQUFDOzs7RUFDQSxzQkFBQyxPQUFEOztNQUFDLFVBQVU7Ozs7Ozs7Ozs7Ozs7SUFDdkIsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFULEVBQ0M7TUFBQSxPQUFBLEVBQVMsRUFBVDtNQUNBLFFBQUEsRUFBVSxNQURWO01BRUEsUUFBQSxFQUFVLEVBRlY7TUFHQSxhQUFBLEVBQWUsQ0FIZjtNQUtBLE9BQUEsRUFBUyxPQUFPLENBQUMsT0FMakI7TUFNQSxNQUFBLEVBQVEsRUFOUjtLQUREO0lBU0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxPQUFPLENBQUM7RUFWTjs7eUJBY2IsV0FBQSxHQUFhLFNBQUE7QUFDWixXQUFPLElBQUMsQ0FBQTtFQURJOzt5QkFHYixXQUFBLEdBQWEsU0FBQyxLQUFEO0lBQ1osSUFBYyxhQUFkO0FBQUEsYUFBQTs7QUFFQSxZQUFPLEtBQUssQ0FBQyxTQUFiO0FBQUEsV0FDTSxNQUROO1FBRUUsSUFBQyxDQUFBLGFBQUQ7QUFESTtBQUROLFdBR00sTUFITjtRQUlFLElBQUMsQ0FBQSxhQUFEO0FBREk7QUFITjtRQU1FLElBQUcsb0JBQUg7VUFDQyxJQUFDLENBQUEsYUFBRCxDQUFlLElBQUMsQ0FBQSxPQUFoQjtVQUNBLElBQUMsQ0FBQSxhQUFELEdBRkQ7O0FBTkY7SUFVQSxJQUFDLENBQUEsUUFBRCxHQUFZO0lBRVosSUFBQyxDQUFBLElBQUQsQ0FBTSxnQkFBTixFQUF3QixLQUF4QixFQUErQixJQUEvQjtXQUNB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

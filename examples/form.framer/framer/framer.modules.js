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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3N0ZXBoZW5ydWl6L0dpdEh1Yi9TdGF0ZU1hY2hpbmUvZXhhbXBsZXMvZm9ybS5mcmFtZXIvbW9kdWxlcy9zdGF0ZW1hY2hpbmUuY29mZmVlIiwiLi4vLi4vLi4vLi4vLi4vVXNlcnMvc3RlcGhlbnJ1aXovR2l0SHViL1N0YXRlTWFjaGluZS9leGFtcGxlcy9mb3JtLmZyYW1lci9tb2R1bGVzL215TW9kdWxlLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyBTdGF0ZU1hY2hpbmVcbiMgQHN0ZXZlcnVpem9rXG5cbiMgU3RhdGVNYWNoaW5lIGlzIGEgbW9kdWxlIHRoYXQgYWxsb3dzIHlvdSB0byBkZXNpZ24gc3RhdGUtYmFzZWQgY29tcG9uZW50cy4gWW91J2xsIGNyZWF0ZSB0aGUgbWFjaGluZSBieSBkZWZpbmluZyBhIHNldCBvZiBcInN0YXRlc1wiLiBFYWNoIG9mIHRoZXNlIHN0YXRlcyBtYXkgaGF2ZSBvbmUgb3IgbW9yZSBcImFjdGlvbnNcIiwgYW5kIGVhY2ggYWN0aW9ucyBwb2ludHMgdG8gYSBkaWZmZXJlbnQgc3RhdGUgKCB0aGUgYWN0aW9uJ3MgXCJ0YXJnZXQgc3RhdGVcIikuIFxuXG4jIFRoZSBtYWNoaW5lIGFsd2F5cyBoYXMgYSBcImN1cnJlbnQgc3RhdGVcIiwgZWl0aGVyIGl0cyBcImluaXRpYWwgc3RhdGVcIiBvciBhIGRpZmZlcmVudCBzdGF0ZSB0aGF0IGl0IGhhcyBjaGFuZ2VkIHRvIGFmdGVyIHJlY2lldmluZyBzb21lIGFjdGlvbnMuIFdoZW4gdGhlIG1hY2hpbmUgcmVjaWV2ZXMgYW4gYWN0aW9ucywgaXQgY2hlY2tzIHRvIHNlZSBpZiBpdHMgY3VycmVudCBzdGF0ZSBvd25zIGFuIGFjdGlvbnMgd2l0aCB0aGF0IG5hbWUuIElmIGl0IGRvZXMsIHRoZSBtYWNoaW5lIGNoYW5nZXMgaXRzIHN0YXRlIHRvIHRoYXQgYWN0aW9ucydzIHRhcmdldCBzdGF0ZS5cblxuIyBAUHJvcGVydGllc1xuXG4jIGhpc3RvcnkgOiBzdHJpbmdbXSBcbiMgXHRSZXR1cm5zIHRoZSBtYWNoaW5lJ3MgaGlzdG9yeS4gKHJlYWQtb25seSlcblxuIyBoaXN0b3J5SW5kZXggOiBudW1iZXIgXG4jIFx0UmV0dXJucyB0aGUgbWFjaGluZSdzIGhpc3RvcnkgaW5kZXguIChyZWFkLW9ubHkpXG5cbiMgY3VycmVudCA6IHN0cmluZyBcbiMgXHRSZXR1cm5zIHRoZSBuYW1lIG9mIHRoZSBtYWNoaW5lJ3MgY3VycmVudCBzdGF0ZS4gKHJlYWQtb25seSlcblxuIyBzdGF0ZSA6IHN0cmluZ1xuIyBcdEdldHMgYW5kIHNldHMgdGhlIG1hY2hpbmUncyBjdXJyZW50IHN0YXRlIChieSBpdHMgbmFtZSkuXG5cbiMgaW5pdGlhbCA6IHN0cmluZ1xuIyBcdFJldHVybnMgdGhlIG1hY2hpbmUncyBoaXN0b3J5IGluZGV4LlxuXG5cbiMgQE1ldGhvZHNcblxuIyBkaXNwYXRjaCggYWN0aW9uIDogc3RyaW5nLCBwYXlsb2FkOiBhbnkgKVxuIyBcdFNlbmRzIGFuIGFjdGlvbiB0byB0aGUgbWFjaGluZS5cblxuIyBvbkNoYW5nZVN0YXRlKCBmbjogRXZlbnRMaXN0ZW5lciApXG4jIFx0U2V0cyBhbiBldmVudCBsaXN0ZW5lciB0aGF0IGZpcmVzIHdoZW4gdGhlIG1hY2hpbmUncyBzdGF0ZSBjaGFuZ2VzLlxuIyBcdEFsaWFzIGZvciBzdGF0ZW1hY2hpbmUub24oXCJjaGFuZ2U6c3RhdGVcIikuXG5cbiMgb25DaGFuZ2VDdXJyZW50KCBmbjogRXZlbnRMaXN0ZW5lciApXG4jIFx0SWRlbnRpY2FsIHRvIG9uQ2hhbmdlU3RhdGUgKHJlZHVuZGFuY3kpLlxuXG4jIHVuZG8oKVx0XG4jIFx0TW92ZXMgdGhlIFN0YXRlTWFjaGluZSB0byBpdHMgcHJldmlvdXMgc3RhdGUsIGlmIG9uZSBleGlzdHMuXG5cbiMgcmVkbygpXHRcbiMgXHRNb3ZlcyB0aGUgU3RhdGVNYWNoaW5lIHRvIGl0cyBuZXh0IHN0YXRlLCBpZiBvbmUgZXhpc3RzLlxuXG5cblxuY2xhc3MgZXhwb3J0cy5TdGF0ZU1hY2hpbmUgZXh0ZW5kcyBGcmFtZXIuQmFzZUNsYXNzXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucyA9IHt9KSAtPlxuXHRcdF8uYXNzaWduIEAsXG5cdFx0XHRfc3RhdGVzOiB7fVxuXHRcdFx0X2N1cnJlbnQ6IHVuZGVmaW5lZFxuXHRcdFx0X2hpc3Rvcnk6IFtdXG5cdFx0XHRfaGlzdG9yeUluZGV4OiAwXG5cdFx0XHRcblx0XHRcdGluaXRpYWw6IG9wdGlvbnMuaW5pdGlhbFxuXHRcdFx0c3RhdGVzOiBbXVxuXHRcdFxuXHRcdEBzdGF0ZXMgPSBvcHRpb25zLnN0YXRlc1xuXHRcblx0IyBQcml2YXRlIG1ldGhvZHNcblx0XG5cdF9nZXRDdXJyZW50OiA9PlxuXHRcdHJldHVybiBAX2N1cnJlbnRcblx0XG5cdF9zZXRDdXJyZW50OiAoc3RhdGUsIHBheWxvYWQsIGRpcmVjdGlvbikgPT5cblx0XHRyZXR1cm4gdW5sZXNzIHN0YXRlP1xuXHRcdFxuXHRcdHN3aXRjaCBkaXJlY3Rpb25cblx0XHRcdHdoZW4gXCJ1bmRvXCJcblx0XHRcdFx0QF9oaXN0b3J5SW5kZXgtLVxuXHRcdFx0d2hlbiBcInJlZG9cIlxuXHRcdFx0XHRAX2hpc3RvcnlJbmRleCsrXG5cdFx0XHRlbHNlIFxuXHRcdFx0XHRpZiBAY3VycmVudD9cblx0XHRcdFx0XHRAX2FkZFRvSGlzdG9yeShAY3VycmVudCwgcGF5bG9hZClcblx0XHRcdFx0XHRAX2hpc3RvcnlJbmRleCsrXG5cdFx0XG5cdFx0QF9jdXJyZW50ID0gc3RhdGVcblxuXHRcdEBlbWl0KFwiY2hhbmdlOmN1cnJlbnRcIiwgc3RhdGUubmFtZSwgcGF5bG9hZCwgQClcblx0XHRAZW1pdChcImNoYW5nZTpzdGF0ZVwiLCBzdGF0ZS5uYW1lLCBwYXlsb2FkLCBAKVxuXHRcblx0X2dldE5ld1N0YXRlOiAoc3RhdGVOYW1lKSA9PlxuXHRcdHBhdGggPSBAX2N1cnJlbnQucGF0aC5zcGxpdCgnLicpXG5cblx0XHRoYW5kbGVTdGF0ZSA9IChzdGF0ZSkgLT5cblx0XHRcdGlmIHR5cGVvZiBzdGF0ZSBpcyBcImZ1bmN0aW9uXCJcblx0XHRcdFx0cmV0dXJuIHN0YXRlKClcblx0XHRcdGVsc2Vcblx0XHRcdFx0cmV0dXJuIHN0YXRlXG5cblxuXHRcdGdldEF0UGF0aCA9IChhcnJheSkgPT5cblx0XHRcdGlmIGFycmF5Lmxlbmd0aCBpcyAwXG5cdFx0XHRcdHVubGVzcyBAc3RhdGVzW3N0YXRlTmFtZV1cblx0XHRcdFx0XHR0aHJvdyBcIkNvdWxkbid0IGZpbmQgdGhhdCBzdGF0ZS5cIlxuXHRcdFx0XHRcdHJldHVyblxuXG5cdFx0XHRcdHJldHVybiBAc3RhdGVzW3N0YXRlTmFtZV1cblxuXHRcdFx0cGF0aCA9IGFycmF5LmpvaW4oJy4nKVxuXHRcdFx0c3RhdGUgPSBfLmdldChAc3RhdGVzLCBwYXRoKVxuXG5cdFx0XHRpZiBzdGF0ZT8uc3RhdGVzW3N0YXRlTmFtZV1cblx0XHRcdFx0cmV0dXJuIHN0YXRlLnN0YXRlc1tzdGF0ZU5hbWVdXG5cblx0XHRcdGdldEF0UGF0aChfLmRyb3BSaWdodChhcnJheSkpXG5cblx0XHRuZXdTdGF0ZSA9IGdldEF0UGF0aChwYXRoKVxuXHRcdHJldHVybiBuZXdTdGF0ZVxuXG5cdFx0XG5cdF9zZXRJbml0aWFsU3RhdGVzOiA9PlxuXHRcdGlmIEBpbml0aWFsXG5cdFx0XHRzdGF0ZSA9IF8uZ2V0KEBzdGF0ZXMsIEBpbml0aWFsKVxuXHRcdFx0aWYgc3RhdGU/XG5cdFx0XHRcdEBfY3VycmVudCA9IHN0YXRlXG5cdFx0XHRcdFV0aWxzLmRlbGF5IDAsID0+IEBfc2V0Q3VycmVudChzdGF0ZSlcblx0XHRcdFx0cmV0dXJuXG5cblx0XHQjIGZpcnN0ID0gXy5rZXlzKEBzdGF0ZXMpXG5cdFx0QF9jdXJyZW50ID0gQHN0YXRlc1tfLmtleXMoQHN0YXRlcylbMF1dXG5cdFx0VXRpbHMuZGVsYXkgMCwgPT4gQF9zZXRDdXJyZW50KEBfY3VycmVudClcblx0XHRcblx0X2FkZFRvSGlzdG9yeTogKHN0YXRlTmFtZSwgcGF5bG9hZCkgPT5cblx0XHRAX2hpc3RvcnkgPSBAX2hpc3Rvcnkuc2xpY2UoMCwgQF9oaXN0b3J5SW5kZXgpXG5cdFx0QF9oaXN0b3J5LnB1c2goe25hbWU6IHN0YXRlTmFtZSwgcGF5bG9hZDogcGF5bG9hZH0pXG5cdFxuXHRfc2V0U3RhdGU6IChzdGF0ZU5hbWUsIHBheWxvYWQsIGRpcmVjdGlvbikgPT5cblx0XHRzdGF0ZSA9IEBfZ2V0TmV3U3RhdGUoc3RhdGVOYW1lKVxuXHRcdFxuXHRcdHVubGVzcyBzdGF0ZT9cblx0XHRcdHJldHVybjtcblx0XHRcblx0XHR0aGlzLl9zZXRDdXJyZW50KHN0YXRlLCBwYXlsb2FkLCBkaXJlY3Rpb24pXG5cdFxuXHRcblx0IyBQdWJsaWMgbWV0aG9kc1xuXHRcblx0ZGlzcGF0Y2g6IChhY3Rpb25OYW1lLCBwYXlsb2FkKSA9PlxuXHRcdGN1cnJlbnQgPSBAX2dldEN1cnJlbnQoKVxuXG5cdFx0bmV3U3RhdGVOYW1lID0gY3VycmVudC5hY3Rpb25zW2FjdGlvbk5hbWVdXG5cdFx0aWYgdHlwZW9mIG5ld1N0YXRlTmFtZSBpcyBcImZ1bmN0aW9uXCIgdGhlbiBuZXdTdGF0ZU5hbWUgPSBuZXdTdGF0ZU5hbWUoKVxuXHRcdFxuXHRcdGlmIF8uaXNVbmRlZmluZWQobmV3U3RhdGVOYW1lKVxuXHRcdFx0cmV0dXJuXG5cblx0XHRAX3NldFN0YXRlKG5ld1N0YXRlTmFtZSwgcGF5bG9hZClcblx0XHRcblx0dW5kbzogPT5cblx0XHRyZXR1cm4gaWYgQF9oaXN0b3J5SW5kZXggaXMgMFxuXHRcdFxuXHRcdHN0YXRlID0gQF9oaXN0b3J5W0BfaGlzdG9yeUluZGV4IC0gMV1cblx0XHRAX3NldFN0YXRlKHN0YXRlLm5hbWUsIHN0YXRlLnBheWxvYWQsIFwidW5kb1wiKVxuXHRcdFxuXHRyZWRvOiA9PlxuXHRcdHJldHVybiBpZiBAX2hpc3RvcnlJbmRleCBpcyBAX2hpc3RvcnkubGVuZ3RoXG5cblx0XHRzdGF0ZSA9IEBfaGlzdG9yeVtAX2hpc3RvcnlJbmRleCArIDFdXG5cdFx0QF9zZXRTdGF0ZShzdGF0ZS5uYW1lLCBzdGF0ZS5wYXlsb2FkLCBcInJlZG9cIilcblxuXHRvblN0YXRlQ2hhbmdlOiAoZm4pID0+XG5cdFx0QG9uKFwiY2hhbmdlOnN0YXRlXCIsIGZuKVxuXHRcdFxuXHRcdFxuXHQjIERlZmluaXRpb25zXG5cdFxuXHRAZGVmaW5lIFwiaGlzdG9yeVwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfaGlzdG9yeVxuXG5cdEBkZWZpbmUgXCJoaXN0b3J5SW5kZXhcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2hpc3RvcnlJbmRleFxuXHRcdFxuXHRAZGVmaW5lIFwic3RhdGVcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAY3VycmVudC5uYW1lXG5cdFx0c2V0OiAoc3RhdGVOYW1lKSAtPlxuXHRcdFx0cmV0dXJuIHVubGVzcyBzdGF0ZU5hbWU/XG5cdFx0XHRcblx0XHRcdEBfc2V0U3RhdGUoc3RhdGVOYW1lKVxuXHRcdFxuXHRAZGVmaW5lIFwiY3VycmVudFwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfY3VycmVudFxuXHRcdFxuXHRAZGVmaW5lIFwiaW5pdGlhbFwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfaW5pdGlhbFxuXHRcdHNldDogKHZhbHVlKSAtPiBcblx0XHRcdEBfaW5pdGlhbCA9IHZhbHVlXG5cdFxuXHRAZGVmaW5lIFwic3RhdGVzXCIsXG5cdFx0Z2V0OiAtPiBAX3N0YXRlc1xuXHRcdHNldDogKG5ld1N0YXRlcykgLT5cblxuXHRcdFx0Z2V0U3RhdGVzID0gKHN0YXRlc09iamVjdCwgdGFyZ2V0KSA9PlxuXHRcdFx0XHR0YXJnZXQuX3N0YXRlcyA9IHt9XG5cblx0XHRcdFx0bWFya3VwU3RhdGUgPSAodmFsdWUsIGtleSwgb2JqKSA9PlxuXHRcdFx0XHRcdHN0YXRlID1cblx0XHRcdFx0XHRcdG5hbWU6IGtleVxuXHRcdFx0XHRcdFx0cGF0aDogdW5kZWZpbmVkXG5cdFx0XHRcdFx0XHRzdGF0ZXM6IHt9XG5cdFx0XHRcdFx0XHRhY3Rpb25zOiB7fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIG9iai5wYXRoIFxuXHRcdFx0XHRcdFx0c3RhdGUucGF0aCA9IG9iai5wYXRoICsgXCIuXCIgKyBrZXlcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRzdGF0ZS5wYXRoID0ga2V5XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdF8uZm9yRWFjaCB2YWx1ZSwgKHYsIGspID0+XG5cdFx0XHRcdFx0XHRzd2l0Y2ggdHlwZW9mIHZcblx0XHRcdFx0XHRcdFx0d2hlbiBcInN0cmluZ1wiXG5cdFx0XHRcdFx0XHRcdFx0c3RhdGUuYWN0aW9uc1trXSA9IHZcblx0XHRcdFx0XHRcdFx0d2hlbiBcImZ1bmN0aW9uXCJcblx0XHRcdFx0XHRcdFx0XHRzdGF0ZS5hY3Rpb25zW2tdID0gdlxuXHRcdFx0XHRcdFx0XHR3aGVuIFwib2JqZWN0XCJcblx0XHRcdFx0XHRcdFx0XHRzdGF0ZS5zdGF0ZXNba10gPSBtYXJrdXBTdGF0ZSh2LCBrLCBzdGF0ZSlcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRyZXR1cm4gc3RhdGVcblx0XHRcblx0XHRcdFx0Xy5mb3JFYWNoIHN0YXRlc09iamVjdCwgKHYsIGspIC0+IFxuXHRcdFx0XHRcdHRhcmdldC5fc3RhdGVzW2tdID0gbWFya3VwU3RhdGUodiwgaywgc3RhdGVzT2JqZWN0KVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gdGFyZ2V0XG5cdFx0XHRcblx0XHRcdGdldFN0YXRlcyhuZXdTdGF0ZXMsIEApXG5cblx0XHRcdCMgc2V0IGluaXRpYWwgc3RhdGUgKGRlbGF5ZWQgZm9yIGxpc3RlbmVycylcblx0XHRcdEBfc2V0SW5pdGlhbFN0YXRlcygpIiwiIyBBZGQgdGhlIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgcHJvamVjdCBpbiBGcmFtZXIgU3R1ZGlvLiBcbiMgbXlNb2R1bGUgPSByZXF1aXJlIFwibXlNb2R1bGVcIlxuIyBSZWZlcmVuY2UgdGhlIGNvbnRlbnRzIGJ5IG5hbWUsIGxpa2UgbXlNb2R1bGUubXlGdW5jdGlvbigpIG9yIG15TW9kdWxlLm15VmFyXG5cbmV4cG9ydHMubXlWYXIgPSBcIm15VmFyaWFibGVcIlxuXG5leHBvcnRzLm15RnVuY3Rpb24gPSAtPlxuXHRwcmludCBcIm15RnVuY3Rpb24gaXMgcnVubmluZ1wiXG5cbmV4cG9ydHMubXlBcnJheSA9IFsxLCAyLCAzXSIsIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBRUFBO0FESUEsT0FBTyxDQUFDLEtBQVIsR0FBZ0I7O0FBRWhCLE9BQU8sQ0FBQyxVQUFSLEdBQXFCLFNBQUE7U0FDcEIsS0FBQSxDQUFNLHVCQUFOO0FBRG9COztBQUdyQixPQUFPLENBQUMsT0FBUixHQUFrQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUDs7OztBRG9DbEIsSUFBQTs7OztBQUFNLE9BQU8sQ0FBQzs7O0VB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

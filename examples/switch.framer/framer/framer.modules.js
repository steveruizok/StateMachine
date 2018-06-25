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

  StateMachine.prototype._addToHistory = function(stateName, payload) {
    this._history = this._history.slice(0, this._historyIndex);
    return this._history.push({
      name: stateName,
      payload: payload
    });
  };

  StateMachine.prototype._setState = function(stateName, payload, direction) {
    var state;
    state = this._getState(stateName);
    if (state == null) {
      return;
    }
    return this._setCurrent(state, payload, direction);
  };

  StateMachine.prototype.dispatch = function(actionName, payload) {
    var current, newStateName;
    current = this._getCurrent();
    newStateName = current.actions[actionName];
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
            actions: value
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3N0ZXBoZW5ydWl6L0dpdEh1Yi9TdGF0ZU1hY2hpbmUvZXhhbXBsZXMvc3dpdGNoLmZyYW1lci9tb2R1bGVzL3N0YXRlbWFjaGluZS5jb2ZmZWUiLCIuLi8uLi8uLi8uLi8uLi9Vc2Vycy9zdGVwaGVucnVpei9HaXRIdWIvU3RhdGVNYWNoaW5lL2V4YW1wbGVzL3N3aXRjaC5mcmFtZXIvbW9kdWxlcy9teU1vZHVsZS5jb2ZmZWUiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiMgU3RhdGVNYWNoaW5lXG4jIEBzdGV2ZXJ1aXpva1xuXG4jIFN0YXRlTWFjaGluZSBpcyBhIG1vZHVsZSB0aGF0IGFsbG93cyB5b3UgdG8gZGVzaWduIHN0YXRlLWJhc2VkIGNvbXBvbmVudHMuIFlvdSdsbCBjcmVhdGUgdGhlIG1hY2hpbmUgYnkgZGVmaW5pbmcgYSBzZXQgb2YgXCJzdGF0ZXNcIi4gRWFjaCBvZiB0aGVzZSBzdGF0ZXMgbWF5IGhhdmUgb25lIG9yIG1vcmUgXCJhY3Rpb25zXCIsIGFuZCBlYWNoIGFjdGlvbnMgcG9pbnRzIHRvIGEgZGlmZmVyZW50IHN0YXRlICggdGhlIGFjdGlvbidzIFwidGFyZ2V0IHN0YXRlXCIpLiBcblxuIyBUaGUgbWFjaGluZSBhbHdheXMgaGFzIGEgXCJjdXJyZW50IHN0YXRlXCIsIGVpdGhlciBpdHMgXCJpbml0aWFsIHN0YXRlXCIgb3IgYSBkaWZmZXJlbnQgc3RhdGUgdGhhdCBpdCBoYXMgY2hhbmdlZCB0byBhZnRlciByZWNpZXZpbmcgc29tZSBhY3Rpb25zLiBXaGVuIHRoZSBtYWNoaW5lIHJlY2lldmVzIGFuIGFjdGlvbnMsIGl0IGNoZWNrcyB0byBzZWUgaWYgaXRzIGN1cnJlbnQgc3RhdGUgb3ducyBhbiBhY3Rpb25zIHdpdGggdGhhdCBuYW1lLiBJZiBpdCBkb2VzLCB0aGUgbWFjaGluZSBjaGFuZ2VzIGl0cyBzdGF0ZSB0byB0aGF0IGFjdGlvbnMncyB0YXJnZXQgc3RhdGUuXG5cbiMgQFByb3BlcnRpZXNcblxuIyBoaXN0b3J5IDogc3RyaW5nW10gXG4jIFx0UmV0dXJucyB0aGUgbWFjaGluZSdzIGhpc3RvcnkuIChyZWFkLW9ubHkpXG5cbiMgaGlzdG9yeUluZGV4IDogbnVtYmVyIFxuIyBcdFJldHVybnMgdGhlIG1hY2hpbmUncyBoaXN0b3J5IGluZGV4LiAocmVhZC1vbmx5KVxuXG4jIGN1cnJlbnQgOiBzdHJpbmcgXG4jIFx0UmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgbWFjaGluZSdzIGN1cnJlbnQgc3RhdGUuIChyZWFkLW9ubHkpXG5cbiMgc3RhdGUgOiBzdHJpbmdcbiMgXHRHZXRzIGFuZCBzZXRzIHRoZSBtYWNoaW5lJ3MgY3VycmVudCBzdGF0ZSAoYnkgaXRzIG5hbWUpLlxuXG4jIGluaXRpYWwgOiBzdHJpbmdcbiMgXHRSZXR1cm5zIHRoZSBtYWNoaW5lJ3MgaGlzdG9yeSBpbmRleC5cblxuXG4jIEBNZXRob2RzXG5cbiMgZGlzcGF0Y2goIGFjdGlvbiA6IHN0cmluZywgcGF5bG9hZDogYW55IClcbiMgXHRTZW5kcyBhbiBhY3Rpb24gdG8gdGhlIG1hY2hpbmUuXG5cbiMgb25DaGFuZ2VTdGF0ZSggZm46IEV2ZW50TGlzdGVuZXIgKVxuIyBcdFNldHMgYW4gZXZlbnQgbGlzdGVuZXIgdGhhdCBmaXJlcyB3aGVuIHRoZSBtYWNoaW5lJ3Mgc3RhdGUgY2hhbmdlcy5cbiMgXHRBbGlhcyBmb3Igc3RhdGVtYWNoaW5lLm9uKFwiY2hhbmdlOnN0YXRlXCIpLlxuXG4jIG9uQ2hhbmdlQ3VycmVudCggZm46IEV2ZW50TGlzdGVuZXIgKVxuIyBcdElkZW50aWNhbCB0byBvbkNoYW5nZVN0YXRlIChyZWR1bmRhbmN5KS5cblxuIyB1bmRvKClcdFxuIyBcdE1vdmVzIHRoZSBTdGF0ZU1hY2hpbmUgdG8gaXRzIHByZXZpb3VzIHN0YXRlLCBpZiBvbmUgZXhpc3RzLlxuXG4jIHJlZG8oKVx0XG4jIFx0TW92ZXMgdGhlIFN0YXRlTWFjaGluZSB0byBpdHMgbmV4dCBzdGF0ZSwgaWYgb25lIGV4aXN0cy5cblxuXG5cbmNsYXNzIGV4cG9ydHMuU3RhdGVNYWNoaW5lIGV4dGVuZHMgRnJhbWVyLkJhc2VDbGFzc1xuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMgPSB7fSkgLT5cblx0XHRfLmFzc2lnbiBALFxuXHRcdFx0X3N0YXRlczogW11cblx0XHRcdF9jdXJyZW50OiB1bmRlZmluZWRcblx0XHRcdF9oaXN0b3J5OiBbXVxuXHRcdFx0X2hpc3RvcnlJbmRleDogMFxuXHRcdFx0XG5cdFx0XHRpbml0aWFsOiBvcHRpb25zLmluaXRpYWxcblx0XHRcdHN0YXRlczogW11cblx0XHRcblx0XHRAc3RhdGVzID0gb3B0aW9ucy5zdGF0ZXNcblx0XG5cdCMgUHJpdmF0ZSBtZXRob2RzXG5cdFxuXHRfc2V0Q3VycmVudDogKHN0YXRlLCBwYXlsb2FkLCBkaXJlY3Rpb24pID0+XG5cdFx0cmV0dXJuIHVubGVzcyBzdGF0ZT9cblx0XHRcblx0XHRzd2l0Y2ggZGlyZWN0aW9uXG5cdFx0XHR3aGVuIFwidW5kb1wiXG5cdFx0XHRcdEBfaGlzdG9yeUluZGV4LS1cblx0XHRcdHdoZW4gXCJyZWRvXCJcblx0XHRcdFx0QF9oaXN0b3J5SW5kZXgrK1xuXHRcdFx0ZWxzZSBcblx0XHRcdFx0aWYgQGN1cnJlbnQ/XG5cdFx0XHRcdFx0QF9hZGRUb0hpc3RvcnkoQGN1cnJlbnQsIHBheWxvYWQpXG5cdFx0XHRcdFx0QF9oaXN0b3J5SW5kZXgrK1xuXHRcdFxuXHRcdEBfY3VycmVudCA9IHN0YXRlXG5cdFx0QGVtaXQoXCJjaGFuZ2U6Y3VycmVudFwiLCBzdGF0ZS5uYW1lLCBwYXlsb2FkLCBAKVxuXHRcdEBlbWl0KFwiY2hhbmdlOnN0YXRlXCIsIHN0YXRlLm5hbWUsIHBheWxvYWQsIEApXG5cdFxuXHRfZ2V0Q3VycmVudDogPT5cblx0XHRyZXR1cm4gQF9nZXRTdGF0ZShAY3VycmVudClcblx0XHRcblx0X2dldFN0YXRlOiAoc3RhdGVOYW1lKSA9PlxuXHRcdHJldHVybiBfLmZpbmQoQHN0YXRlcywge25hbWU6IHN0YXRlTmFtZX0pXG5cdFx0XG5cdF9zZXRJbml0aWFsU3RhdGVzOiA9PlxuXHRcdGlmIEBpbml0aWFsXG5cdFx0XHRzdGF0ZSA9IF8uZmluZChAc3RhdGVzLCB7bmFtZTogQGluaXRpYWx9KVxuXHRcdFx0aWYgc3RhdGU/XG5cdFx0XHRcdEBfY3VycmVudCA9IHN0YXRlXG5cdFx0XHRcdFV0aWxzLmRlbGF5IDAsID0+IEBfc2V0Q3VycmVudChzdGF0ZSlcblx0XHRcdFx0cmV0dXJuXG5cdFx0XG5cdFx0QF9jdXJyZW50ID0gQHN0YXRlc1swXVxuXHRcdFV0aWxzLmRlbGF5IDAsID0+IEBfc2V0Q3VycmVudChAc3RhdGVzWzBdKVxuXHRcdFxuXHRfYWRkVG9IaXN0b3J5OiAoc3RhdGVOYW1lLCBwYXlsb2FkKSA9PlxuXHRcdEBfaGlzdG9yeSA9IEBfaGlzdG9yeS5zbGljZSgwLCBAX2hpc3RvcnlJbmRleClcblx0XHRAX2hpc3RvcnkucHVzaCh7bmFtZTogc3RhdGVOYW1lLCBwYXlsb2FkOiBwYXlsb2FkfSlcblx0XG5cdF9zZXRTdGF0ZTogKHN0YXRlTmFtZSwgcGF5bG9hZCwgZGlyZWN0aW9uKSA9PlxuXHRcdHN0YXRlID0gQF9nZXRTdGF0ZShzdGF0ZU5hbWUpXG5cdFx0XG5cdFx0dW5sZXNzIHN0YXRlP1xuXHRcdFx0cmV0dXJuO1xuXHRcdFxuXHRcdHRoaXMuX3NldEN1cnJlbnQoc3RhdGUsIHBheWxvYWQsIGRpcmVjdGlvbilcblx0XG5cdFxuXHQjIFB1YmxpYyBtZXRob2RzXG5cdFxuXHRkaXNwYXRjaDogKGFjdGlvbk5hbWUsIHBheWxvYWQpID0+XG5cdFx0Y3VycmVudCA9IEBfZ2V0Q3VycmVudCgpXG5cdFx0bmV3U3RhdGVOYW1lID0gY3VycmVudC5hY3Rpb25zW2FjdGlvbk5hbWVdXG5cdFx0XG5cdFx0aWYgXy5pc1VuZGVmaW5lZChuZXdTdGF0ZU5hbWUpXG5cdFx0XHRyZXR1cm5cblx0XHRcblx0XHRAX3NldFN0YXRlKG5ld1N0YXRlTmFtZSwgcGF5bG9hZClcblx0XHRcblx0dW5kbzogPT5cblx0XHRyZXR1cm4gaWYgQF9oaXN0b3J5SW5kZXggaXMgMFxuXHRcdFxuXHRcdHN0YXRlID0gQF9oaXN0b3J5W0BfaGlzdG9yeUluZGV4IC0gMV1cblx0XHRAX3NldFN0YXRlKHN0YXRlLm5hbWUsIHN0YXRlLnBheWxvYWQsIFwidW5kb1wiKVxuXHRcdFxuXHRyZWRvOiA9PlxuXHRcdHJldHVybiBpZiBAX2hpc3RvcnlJbmRleCBpcyBAX2hpc3RvcnkubGVuZ3RoXG5cblx0XHRzdGF0ZSA9IEBfaGlzdG9yeVtAX2hpc3RvcnlJbmRleCArIDFdXG5cdFx0QF9zZXRTdGF0ZShzdGF0ZS5uYW1lLCBzdGF0ZS5wYXlsb2FkLCBcInJlZG9cIilcblxuXHRvblN0YXRlQ2hhbmdlOiAoZm4pID0+XG5cdFx0QG9uKFwiY2hhbmdlOnN0YXRlXCIsIGZuKVxuXHRcdFxuXHRcdFxuXHQjIERlZmluaXRpb25zXG5cdFxuXHRAZGVmaW5lIFwiaGlzdG9yeVwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfaGlzdG9yeVxuXG5cdEBkZWZpbmUgXCJoaXN0b3J5SW5kZXhcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2hpc3RvcnlJbmRleFxuXHRcdFxuXHRAZGVmaW5lIFwic3RhdGVcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAY3VycmVudFxuXHRcdHNldDogKHN0YXRlTmFtZSkgLT5cblx0XHRcdHJldHVybiB1bmxlc3Mgc3RhdGVOYW1lP1xuXHRcdFx0XG5cdFx0XHRAX3NldFN0YXRlKHN0YXRlTmFtZSlcblx0XHRcblx0QGRlZmluZSBcImN1cnJlbnRcIixcblx0XHRnZXQ6IC0+IHJldHVybiAoQF9jdXJyZW50ID8gQGluaXRpYWwpPy5uYW1lID8gdW5kZWZpbmVkXG5cdFx0XG5cdEBkZWZpbmUgXCJpbml0aWFsXCIsXG5cdFx0Z2V0OiAtPiByZXR1cm4gQF9pbml0aWFsXG5cdFx0c2V0OiAodmFsdWUpIC0+IFxuXHRcdFx0QF9pbml0aWFsID0gdmFsdWVcblx0XG5cdEBkZWZpbmUgXCJzdGF0ZXNcIixcblx0XHRnZXQ6IC0+IEBfc3RhdGVzXG5cdFx0c2V0OiAoc3RhdGVzKSAtPlxuXHRcdFx0bmV3U3RhdGVzID0gXy5tYXAoc3RhdGVzLCAodmFsdWUsIGtleSkgPT5cblx0XHRcdFx0cmV0dXJuIHtuYW1lOiBrZXksIGFjdGlvbnM6IHZhbHVlfVxuXHRcdFx0XHQpXG5cdFx0XHRcblx0XHRcdEBfc3RhdGVzID0gbmV3U3RhdGVzXG5cdFx0XHRcblx0XHRcdCMgc2V0IGluaXRpYWwgc3RhdGUgKGRlbGF5ZWQgZm9yIGxpc3RlbmVycylcblx0XHRcdEBfc2V0SW5pdGlhbFN0YXRlcygpIiwiIyBBZGQgdGhlIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgcHJvamVjdCBpbiBGcmFtZXIgU3R1ZGlvLiBcbiMgbXlNb2R1bGUgPSByZXF1aXJlIFwibXlNb2R1bGVcIlxuIyBSZWZlcmVuY2UgdGhlIGNvbnRlbnRzIGJ5IG5hbWUsIGxpa2UgbXlNb2R1bGUubXlGdW5jdGlvbigpIG9yIG15TW9kdWxlLm15VmFyXG5cbmV4cG9ydHMubXlWYXIgPSBcIm15VmFyaWFibGVcIlxuXG5leHBvcnRzLm15RnVuY3Rpb24gPSAtPlxuXHRwcmludCBcIm15RnVuY3Rpb24gaXMgcnVubmluZ1wiXG5cbmV4cG9ydHMubXlBcnJheSA9IFsxLCAyLCAzXSIsIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBRUFBO0FESUEsT0FBTyxDQUFDLEtBQVIsR0FBZ0I7O0FBRWhCLE9BQU8sQ0FBQyxVQUFSLEdBQXFCLFNBQUE7U0FDcEIsS0FBQSxDQUFNLHVCQUFOO0FBRG9COztBQUdyQixPQUFPLENBQUMsT0FBUixHQUFrQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUDs7OztBRG9DbEIsSUFBQTs7OztBQUFNLE9BQU8sQ0FBQzs7O0VBQ0Esc0JBQUMsT0FBRDs7TUFBQyxVQUFVOzs7Ozs7Ozs7Ozs7SUFDdkIsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFULEVBQ0M7TUFBQSxPQUFBLEVBQVMsRUFBVDtNQUNBLFFBQUEsRUFBVSxNQURWO01BRUEsUUFBQSxFQUFVLEVBRlY7TUFHQSxhQUFBLEVBQWUsQ0FIZjtNQUtBLE9BQUEsRUFBUyxPQUFPLENBQUMsT0FMakI7TUFNQSxNQUFBLEVBQVEsRUFOUjtLQUREO0lBU0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxPQUFPLENBQUM7RUFWTjs7eUJBY2IsV0FBQSxHQUFhLFNBQUMsS0FBRCxFQUFRLE9BQVIsRUFBaUIsU0FBakI7SUFDWixJQUFjLGFBQWQ7QUFBQSxhQUFBOztBQUVBLFlBQU8sU0FBUDtBQUFBLFdBQ00sTUFETjtRQUVFLElBQUMsQ0FBQSxhQUFEO0FBREk7QUFETixXQUdNLE1BSE47UUFJRSxJQUFDLENBQUEsYUFBRDtBQURJO0FBSE47UUFNRSxJQUFHLG9CQUFIO1VBQ0MsSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFDLENBQUEsT0FBaEIsRUFBeUIsT0FBekI7VUFDQSxJQUFD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

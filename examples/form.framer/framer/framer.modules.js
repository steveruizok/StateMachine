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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL3N0ZXBoZW5ydWl6L0dpdEh1Yi9TdGF0ZU1hY2hpbmUvZXhhbXBsZXMvZm9ybS5mcmFtZXIvbW9kdWxlcy9zdGF0ZW1hY2hpbmUuY29mZmVlIiwiLi4vLi4vLi4vLi4vLi4vVXNlcnMvc3RlcGhlbnJ1aXovR2l0SHViL1N0YXRlTWFjaGluZS9leGFtcGxlcy9mb3JtLmZyYW1lci9tb2R1bGVzL215TW9kdWxlLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyBTdGF0ZU1hY2hpbmVcbiMgQHN0ZXZlcnVpem9rXG5cbiMgU3RhdGVNYWNoaW5lIGlzIGEgbW9kdWxlIHRoYXQgYWxsb3dzIHlvdSB0byBkZXNpZ24gc3RhdGUtYmFzZWQgY29tcG9uZW50cy4gWW91J2xsIGNyZWF0ZSB0aGUgbWFjaGluZSBieSBkZWZpbmluZyBhIHNldCBvZiBcInN0YXRlc1wiLiBFYWNoIG9mIHRoZXNlIHN0YXRlcyBtYXkgaGF2ZSBvbmUgb3IgbW9yZSBcImFjdGlvbnNcIiwgYW5kIGVhY2ggYWN0aW9ucyBwb2ludHMgdG8gYSBkaWZmZXJlbnQgc3RhdGUgKCB0aGUgYWN0aW9uJ3MgXCJ0YXJnZXQgc3RhdGVcIikuIFxuXG4jIFRoZSBtYWNoaW5lIGFsd2F5cyBoYXMgYSBcImN1cnJlbnQgc3RhdGVcIiwgZWl0aGVyIGl0cyBcImluaXRpYWwgc3RhdGVcIiBvciBhIGRpZmZlcmVudCBzdGF0ZSB0aGF0IGl0IGhhcyBjaGFuZ2VkIHRvIGFmdGVyIHJlY2lldmluZyBzb21lIGFjdGlvbnMuIFdoZW4gdGhlIG1hY2hpbmUgcmVjaWV2ZXMgYW4gYWN0aW9ucywgaXQgY2hlY2tzIHRvIHNlZSBpZiBpdHMgY3VycmVudCBzdGF0ZSBvd25zIGFuIGFjdGlvbnMgd2l0aCB0aGF0IG5hbWUuIElmIGl0IGRvZXMsIHRoZSBtYWNoaW5lIGNoYW5nZXMgaXRzIHN0YXRlIHRvIHRoYXQgYWN0aW9ucydzIHRhcmdldCBzdGF0ZS5cblxuIyBAUHJvcGVydGllc1xuXG4jIGhpc3RvcnkgOiBzdHJpbmdbXSBcbiMgXHRSZXR1cm5zIHRoZSBtYWNoaW5lJ3MgaGlzdG9yeS4gKHJlYWQtb25seSlcblxuIyBoaXN0b3J5SW5kZXggOiBudW1iZXIgXG4jIFx0UmV0dXJucyB0aGUgbWFjaGluZSdzIGhpc3RvcnkgaW5kZXguIChyZWFkLW9ubHkpXG5cbiMgY3VycmVudCA6IHN0cmluZyBcbiMgXHRSZXR1cm5zIHRoZSBuYW1lIG9mIHRoZSBtYWNoaW5lJ3MgY3VycmVudCBzdGF0ZS4gKHJlYWQtb25seSlcblxuIyBzdGF0ZSA6IHN0cmluZ1xuIyBcdEdldHMgYW5kIHNldHMgdGhlIG1hY2hpbmUncyBjdXJyZW50IHN0YXRlIChieSBpdHMgbmFtZSkuXG5cbiMgaW5pdGlhbCA6IHN0cmluZ1xuIyBcdFJldHVybnMgdGhlIG1hY2hpbmUncyBoaXN0b3J5IGluZGV4LlxuXG5cbiMgQE1ldGhvZHNcblxuIyBkaXNwYXRjaCggYWN0aW9uIDogc3RyaW5nLCBwYXlsb2FkOiBhbnkgKVxuIyBcdFNlbmRzIGFuIGFjdGlvbiB0byB0aGUgbWFjaGluZS5cblxuIyBvbkNoYW5nZVN0YXRlKCBmbjogRXZlbnRMaXN0ZW5lciApXG4jIFx0U2V0cyBhbiBldmVudCBsaXN0ZW5lciB0aGF0IGZpcmVzIHdoZW4gdGhlIG1hY2hpbmUncyBzdGF0ZSBjaGFuZ2VzLlxuIyBcdEFsaWFzIGZvciBzdGF0ZW1hY2hpbmUub24oXCJjaGFuZ2U6c3RhdGVcIikuXG5cbiMgb25DaGFuZ2VDdXJyZW50KCBmbjogRXZlbnRMaXN0ZW5lciApXG4jIFx0SWRlbnRpY2FsIHRvIG9uQ2hhbmdlU3RhdGUgKHJlZHVuZGFuY3kpLlxuXG4jIHVuZG8oKVx0XG4jIFx0TW92ZXMgdGhlIFN0YXRlTWFjaGluZSB0byBpdHMgcHJldmlvdXMgc3RhdGUsIGlmIG9uZSBleGlzdHMuXG5cbiMgcmVkbygpXHRcbiMgXHRNb3ZlcyB0aGUgU3RhdGVNYWNoaW5lIHRvIGl0cyBuZXh0IHN0YXRlLCBpZiBvbmUgZXhpc3RzLlxuXG5cblxuY2xhc3MgZXhwb3J0cy5TdGF0ZU1hY2hpbmUgZXh0ZW5kcyBGcmFtZXIuQmFzZUNsYXNzXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucyA9IHt9KSAtPlxuXHRcdF8uYXNzaWduIEAsXG5cdFx0XHRfc3RhdGVzOiBbXVxuXHRcdFx0X2N1cnJlbnQ6IHVuZGVmaW5lZFxuXHRcdFx0X2hpc3Rvcnk6IFtdXG5cdFx0XHRfaGlzdG9yeUluZGV4OiAwXG5cdFx0XHRcblx0XHRcdGluaXRpYWw6IG9wdGlvbnMuaW5pdGlhbFxuXHRcdFx0c3RhdGVzOiBbXVxuXHRcdFxuXHRcdEBzdGF0ZXMgPSBvcHRpb25zLnN0YXRlc1xuXHRcblx0IyBQcml2YXRlIG1ldGhvZHNcblx0XG5cdF9zZXRDdXJyZW50OiAoc3RhdGUsIHBheWxvYWQsIGRpcmVjdGlvbikgPT5cblx0XHRyZXR1cm4gdW5sZXNzIHN0YXRlP1xuXHRcdFxuXHRcdHN3aXRjaCBkaXJlY3Rpb25cblx0XHRcdHdoZW4gXCJ1bmRvXCJcblx0XHRcdFx0QF9oaXN0b3J5SW5kZXgtLVxuXHRcdFx0d2hlbiBcInJlZG9cIlxuXHRcdFx0XHRAX2hpc3RvcnlJbmRleCsrXG5cdFx0XHRlbHNlIFxuXHRcdFx0XHRpZiBAY3VycmVudD9cblx0XHRcdFx0XHRAX2FkZFRvSGlzdG9yeShAY3VycmVudCwgcGF5bG9hZClcblx0XHRcdFx0XHRAX2hpc3RvcnlJbmRleCsrXG5cdFx0XG5cdFx0QF9jdXJyZW50ID0gc3RhdGVcblx0XHRAZW1pdChcImNoYW5nZTpjdXJyZW50XCIsIHN0YXRlLm5hbWUsIHBheWxvYWQsIEApXG5cdFx0QGVtaXQoXCJjaGFuZ2U6c3RhdGVcIiwgc3RhdGUubmFtZSwgcGF5bG9hZCwgQClcblx0XG5cdF9nZXRDdXJyZW50OiA9PlxuXHRcdHJldHVybiBAX2dldFN0YXRlKEBjdXJyZW50KVxuXHRcdFxuXHRfZ2V0U3RhdGU6IChzdGF0ZU5hbWUpID0+XG5cdFx0cmV0dXJuIF8uZmluZChAc3RhdGVzLCB7bmFtZTogc3RhdGVOYW1lfSlcblx0XHRcblx0X3NldEluaXRpYWxTdGF0ZXM6ID0+XG5cdFx0aWYgQGluaXRpYWxcblx0XHRcdHN0YXRlID0gXy5maW5kKEBzdGF0ZXMsIHtuYW1lOiBAaW5pdGlhbH0pXG5cdFx0XHRpZiBzdGF0ZT9cblx0XHRcdFx0QF9jdXJyZW50ID0gc3RhdGVcblx0XHRcdFx0VXRpbHMuZGVsYXkgMCwgPT4gQF9zZXRDdXJyZW50KHN0YXRlKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcblx0XHRAX2N1cnJlbnQgPSBAc3RhdGVzWzBdXG5cdFx0VXRpbHMuZGVsYXkgMCwgPT4gQF9zZXRDdXJyZW50KEBzdGF0ZXNbMF0pXG5cdFx0XG5cdF9hZGRUb0hpc3Rvcnk6IChzdGF0ZU5hbWUsIHBheWxvYWQpID0+XG5cdFx0QF9oaXN0b3J5ID0gQF9oaXN0b3J5LnNsaWNlKDAsIEBfaGlzdG9yeUluZGV4KVxuXHRcdEBfaGlzdG9yeS5wdXNoKHtuYW1lOiBzdGF0ZU5hbWUsIHBheWxvYWQ6IHBheWxvYWR9KVxuXHRcblx0X3NldFN0YXRlOiAoc3RhdGVOYW1lLCBwYXlsb2FkLCBkaXJlY3Rpb24pID0+XG5cdFx0c3RhdGUgPSBAX2dldFN0YXRlKHN0YXRlTmFtZSlcblx0XHRcblx0XHR1bmxlc3Mgc3RhdGU/XG5cdFx0XHRyZXR1cm47XG5cdFx0XG5cdFx0dGhpcy5fc2V0Q3VycmVudChzdGF0ZSwgcGF5bG9hZCwgZGlyZWN0aW9uKVxuXHRcblx0XG5cdCMgUHVibGljIG1ldGhvZHNcblx0XG5cdGRpc3BhdGNoOiAoYWN0aW9uTmFtZSwgcGF5bG9hZCkgPT5cblx0XHRjdXJyZW50ID0gQF9nZXRDdXJyZW50KClcblx0XHRuZXdTdGF0ZU5hbWUgPSBjdXJyZW50LmFjdGlvbnNbYWN0aW9uTmFtZV1cblx0XHRcblx0XHRpZiBfLmlzVW5kZWZpbmVkKG5ld1N0YXRlTmFtZSlcblx0XHRcdHJldHVyblxuXHRcdFxuXHRcdEBfc2V0U3RhdGUobmV3U3RhdGVOYW1lLCBwYXlsb2FkKVxuXHRcdFxuXHR1bmRvOiA9PlxuXHRcdHJldHVybiBpZiBAX2hpc3RvcnlJbmRleCBpcyAwXG5cdFx0XG5cdFx0c3RhdGUgPSBAX2hpc3RvcnlbQF9oaXN0b3J5SW5kZXggLSAxXVxuXHRcdEBfc2V0U3RhdGUoc3RhdGUubmFtZSwgc3RhdGUucGF5bG9hZCwgXCJ1bmRvXCIpXG5cdFx0XG5cdHJlZG86ID0+XG5cdFx0cmV0dXJuIGlmIEBfaGlzdG9yeUluZGV4IGlzIEBfaGlzdG9yeS5sZW5ndGhcblxuXHRcdHN0YXRlID0gQF9oaXN0b3J5W0BfaGlzdG9yeUluZGV4ICsgMV1cblx0XHRAX3NldFN0YXRlKHN0YXRlLm5hbWUsIHN0YXRlLnBheWxvYWQsIFwicmVkb1wiKVxuXG5cdG9uU3RhdGVDaGFuZ2U6IChmbikgPT5cblx0XHRAb24oXCJjaGFuZ2U6c3RhdGVcIiwgZm4pXG5cdFx0XG5cdFx0XG5cdCMgRGVmaW5pdGlvbnNcblx0XG5cdEBkZWZpbmUgXCJoaXN0b3J5XCIsXG5cdFx0Z2V0OiAtPiByZXR1cm4gQF9oaXN0b3J5XG5cblx0QGRlZmluZSBcImhpc3RvcnlJbmRleFwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBfaGlzdG9yeUluZGV4XG5cdFx0XG5cdEBkZWZpbmUgXCJzdGF0ZVwiLFxuXHRcdGdldDogLT4gcmV0dXJuIEBjdXJyZW50XG5cdFx0c2V0OiAoc3RhdGVOYW1lKSAtPlxuXHRcdFx0cmV0dXJuIHVubGVzcyBzdGF0ZU5hbWU/XG5cdFx0XHRcblx0XHRcdEBfc2V0U3RhdGUoc3RhdGVOYW1lKVxuXHRcdFxuXHRAZGVmaW5lIFwiY3VycmVudFwiLFxuXHRcdGdldDogLT4gcmV0dXJuIChAX2N1cnJlbnQgPyBAaW5pdGlhbCk/Lm5hbWUgPyB1bmRlZmluZWRcblx0XHRcblx0QGRlZmluZSBcImluaXRpYWxcIixcblx0XHRnZXQ6IC0+IHJldHVybiBAX2luaXRpYWxcblx0XHRzZXQ6ICh2YWx1ZSkgLT4gXG5cdFx0XHRAX2luaXRpYWwgPSB2YWx1ZVxuXHRcblx0QGRlZmluZSBcInN0YXRlc1wiLFxuXHRcdGdldDogLT4gQF9zdGF0ZXNcblx0XHRzZXQ6IChzdGF0ZXMpIC0+XG5cdFx0XHRuZXdTdGF0ZXMgPSBfLm1hcChzdGF0ZXMsICh2YWx1ZSwga2V5KSA9PlxuXHRcdFx0XHRyZXR1cm4ge25hbWU6IGtleSwgYWN0aW9uczogdmFsdWV9XG5cdFx0XHRcdClcblx0XHRcdFxuXHRcdFx0QF9zdGF0ZXMgPSBuZXdTdGF0ZXNcblx0XHRcdFxuXHRcdFx0IyBzZXQgaW5pdGlhbCBzdGF0ZSAoZGVsYXllZCBmb3IgbGlzdGVuZXJzKVxuXHRcdFx0QF9zZXRJbml0aWFsU3RhdGVzKCkiLCIjIEFkZCB0aGUgZm9sbG93aW5nIGxpbmUgdG8geW91ciBwcm9qZWN0IGluIEZyYW1lciBTdHVkaW8uIFxuIyBteU1vZHVsZSA9IHJlcXVpcmUgXCJteU1vZHVsZVwiXG4jIFJlZmVyZW5jZSB0aGUgY29udGVudHMgYnkgbmFtZSwgbGlrZSBteU1vZHVsZS5teUZ1bmN0aW9uKCkgb3IgbXlNb2R1bGUubXlWYXJcblxuZXhwb3J0cy5teVZhciA9IFwibXlWYXJpYWJsZVwiXG5cbmV4cG9ydHMubXlGdW5jdGlvbiA9IC0+XG5cdHByaW50IFwibXlGdW5jdGlvbiBpcyBydW5uaW5nXCJcblxuZXhwb3J0cy5teUFycmF5ID0gWzEsIDIsIDNdIiwiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFFQUE7QURJQSxPQUFPLENBQUMsS0FBUixHQUFnQjs7QUFFaEIsT0FBTyxDQUFDLFVBQVIsR0FBcUIsU0FBQTtTQUNwQixLQUFBLENBQU0sdUJBQU47QUFEb0I7O0FBR3JCLE9BQU8sQ0FBQyxPQUFSLEdBQWtCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQOzs7O0FEb0NsQixJQUFBOzs7O0FBQU0sT0FBTyxDQUFDOzs7RUFDQSxzQkFBQyxPQUFEOztNQUFDLFVBQVU7Ozs7Ozs7Ozs7OztJQUN2QixDQUFDLENBQUMsTUFBRixDQUFTLElBQVQsRUFDQztNQUFBLE9BQUEsRUFBUyxFQUFUO01BQ0EsUUFBQSxFQUFVLE1BRFY7TUFFQSxRQUFBLEVBQVUsRUFGVjtNQUdBLGFBQUEsRUFBZSxDQUhmO01BS0EsT0FBQSxFQUFTLE9BQU8sQ0FBQyxPQUxqQjtNQU1BLE1BQUEsRUFBUSxFQU5SO0tBREQ7SUFTQSxJQUFDLENBQUEsTUFBRCxHQUFVLE9BQU8sQ0FBQztFQVZOOzt5QkFjYixXQUFBLEdBQWEsU0FBQyxLQUFELEVBQVEsT0FBUixFQUFpQixTQUFqQjtJQUNaLElBQWMsYUFBZDtBQUFBLGFBQUE7O0FBRUEsWUFBTyxTQUFQO0FBQUEsV0FDTSxNQUROO1FBRUUsSUFBQyxDQUFBLGFBQUQ7QUFESTtBQUROLFdBR00sTUFITjtRQUlFLElBQUMsQ0FBQSxhQUFEO0FBREk7QUFITjtRQU1FLElBQUcsb0JBQUg7VUFDQyxJQUFDLENBQUEsYUFBRCxDQUFlLElBQUMsQ0FBQSxPQUFoQixFQUF5QixPQUF6QjtVQUNBLElBQUMsQ0FBQSxhQUFELEdBRkQ7O0FBTkY7SUFVQSxJQUFDLENBQUEsUUFBRCxHQUFZO0lBQ1osSUFBQyxDQUFBLElBQUQsQ0FBTSxnQkFBTixFQUF3QixLQUFLLENBQUMsSUFBOUIsRUFBb0MsT0FBcEMsRUFBNkMsSUFBN0M7V0FDQSxJQUFDLENBQUEsSUFBRCxDQUFNLGNBQU4sRUFBc0IsS0FBSyxDQUFDLElBQTVCLEVBQWtDLE9BQWxDLEVBQTJDLElBQTNDO0VBZlk7O3lCQWlCYixXQUFBLEdBQWEsU0FBQTtBQUNaLFdBQU8sSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFDLENBQUEsT0FBWjtFQURLOzt5QkFHYixTQUFBLEdBQVcsU0FBQyxTQUFEO0FBQ1YsV0FBTyxDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxNQUFSLEVBQWdCO01BQUMsSUFBQSxFQUFNLFNBQVA7S0FBaEI7RUFERzs7eUJBR1gsaUJBQUEsR0FBbUIsU0FBQTtBQUNsQixRQUFBO0lBQUEsSUFBRyxJQUFDLENBQUEsT0FBSjtNQUNDLEtBQUEsR0FBUSxDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxNQUFSLEVBQWdCO1FBQUMsSUFBQSxFQUFNLElBQUMsQ0FBQSxPQUFSO09BQWhCO01BQ1IsSUFBRyxhQUFIO1FBQ0MsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUNaLEtBQUssQ0FBQyxLQUFOLENBQVksQ0FBWixFQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFdBQUQsQ0FBYSxLQUFiO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7QUFDQSxlQUhEO09BRkQ7O0lBT0EsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsTUFBTyxDQUFBLENBQUE7V0FDcEIsS0FBSyxDQUFDLEtBQU4sQ0FBWSxDQUFaLEVBQWUsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO2VBQUcsS0FBQyxDQUFBLFdBQUQsQ0FBYSxLQUFDLENBQUEsTUFBTyxDQUFBLENBQUEsQ0FBckI7TUFBSDtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZjtFQVRrQjs7eUJBV25CLGFBQUEsR0FBZSxTQUFDLFNBQUQsRUFBWSxPQUFaO0lBQ2QsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsQ0FBZ0IsQ0FBaEIsRUFBbUIsSUFBQyxDQUFBLGFBQXBCO1dBQ1osSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFWLENBQWU7TUFBQyxJQUFBLEVBQU0sU0FBUDtNQUFrQixPQUFBLEVBQVMsT0FBM0I7S0FBZjtFQUZjOzt5QkFJZixTQUFBLEdBQVcsU0FBQyxTQUFELEVBQVksT0FBWixFQUFxQixTQUFyQjtBQUNWLFFBQUE7SUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFNBQUQsQ0FBVyxTQUFYO0lBRVIsSUFBTyxhQUFQO0FBQ0MsYUFERDs7V0FHQSxJQUFJLENBQUMsV0FBTCxDQUFpQixLQUFqQixFQUF3QixPQUF4QixFQUFpQyxTQUFqQztFQU5VOzt5QkFXWCxRQUFBLEdBQVUsU0FBQyxVQUFELEVBQWEsT0FBYjtBQUNULFFBQUE7SUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFdBQUQsQ0FBQTtJQUNWLFlBQUEsR0FBZSxPQUFPLENBQUMsT0FBUSxDQUFBLFVBQUE7SUFFL0IsSUFBRyxDQUFDLENBQUMsV0FBRixDQUFjLFlBQWQsQ0FBSDtBQUNDLGFBREQ7O1dBR0EsSUFBQyxDQUFBLFNBQUQsQ0FBVyxZQUFYLEVBQXlCLE9BQXpCO0VBUFM7O3lCQVNWLElBQUEsR0FBTSxTQUFBO0FBQ0wsUUFBQTtJQUFBLElBQVUsSUFBQyxDQUFBLGFBQUQsS0FBa0IsQ0FBNUI7QUFBQSxhQUFBOztJQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUMsQ0FBQSxhQUFELEdBQWlCLENBQWpCO1dBQ2xCLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBSyxDQUFDLElBQWpCLEVBQXVCLEtBQUssQ0FBQyxPQUE3QixFQUFzQyxNQUF0QztFQUpLOzt5QkFNTixJQUFBLEdBQU0sU0FBQTtBQUNMLFFBQUE7SUFBQSxJQUFVLElBQUMsQ0FBQSxhQUFELEtBQWtCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBdEM7QUFBQSxhQUFBOztJQUVBLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBUyxDQUFBLElBQUMsQ0FBQSxhQUFELEdBQWlCLENBQWpCO1dBQ2xCLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBSyxDQUFDLElBQWpCLEVBQXVCLEtBQUssQ0FBQyxPQUE3QixFQUFzQyxNQUF0QztFQUpLOzt5QkFNTixhQUFBLEdBQWUsU0FBQyxFQUFEO1dBQ2QsSUFBQyxDQUFBLEVBQUQsQ0FBSSxjQUFKLEVBQW9CLEVBQXBCO0VBRGM7O0VBTWYsWUFBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLEVBQ0M7SUFBQSxHQUFBLEVBQUssU0FBQTtBQUFHLGFBQU8sSUFBQyxDQUFBO0lBQVgsQ0FBTDtHQUREOztFQUdBLFlBQUMsQ0FBQSxNQUFELENBQVEsY0FBUixFQUNDO0lBQUEsR0FBQSxFQUFLLFNBQUE7QUFBRyxhQUFPLElBQUMsQ0FBQTtJQUFYLENBQUw7R0FERDs7RUFHQSxZQUFDLENBQUEsTUFBRCxDQUFRLE9BQVIsRUFDQztJQUFBLEdBQUEsRUFBSyxTQUFBO0FBQUcsYUFBTyxJQUFDLENBQUE7SUFBWCxDQUFMO0lBQ0EsR0FBQSxFQUFLLFNBQUMsU0FBRDtNQUNKLElBQWMsaUJBQWQ7QUFBQSxlQUFBOzthQUVBLElBQUMsQ0FBQSxTQUFELENBQVcsU0FBWDtJQUhJLENBREw7R0FERDs7RUFPQSxZQUFDLENBQUEsTUFBRCxDQUFRLFNBQVIsRUFDQztJQUFBLEdBQUEsRUFBSyxTQUFBO0FBQUcsVUFBQTtBQUFBLGdJQUFzQztJQUF6QyxDQUFMO0dBREQ7O0VBR0EsWUFBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLEVBQ0M7SUFBQSxHQUFBLEVBQUssU0FBQTtBQUFHLGFBQU8sSUFBQyxDQUFBO0lBQVgsQ0FBTDtJQUNBLEdBQUEsRUFBSyxTQUFDLEtBQUQ7YUFDSixJQUFDLENBQUEsUUFBRCxHQUFZO0lBRFIsQ0FETDtHQUREOztFQUtBLFlBQUMsQ0FBQSxNQUFELENBQVEsUUFBUixFQUNDO0lBQUEsR0FBQSxFQUFLLFNBQUE7YUFBRyxJQUFDLENBQUE7SUFBSixDQUFMO0lBQ0EsR0FBQSxFQUFLLFNBQUMsTUFBRDtBQUNKLFVBQUE7TUFBQSxTQUFBLEdBQVksQ0FBQyxDQUFDLEdBQUYsQ0FBTSxNQUFOLEVBQWMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQsRUFBUSxHQUFSO0FBQ3pCLGlCQUFPO1lBQUMsSUFBQSxFQUFNLEdBQVA7WUFBWSxPQUFBLEVBQVMsS0FBckI7O1FBRGtCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkO01BSVosSUFBQyxDQUFBLE9BQUQsR0FBVzthQUdYLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBUkksQ0FETDtHQUREOzs7O0dBaEhrQyxNQUFNLENBQUMifQ==

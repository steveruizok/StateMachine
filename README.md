# StateMachine

**[@steveruizok](http://twitter.com/steveruizok)**

A Framer module for designing with finite state machines. Easily define a component's states and the manage the actions that connect them. Inspired by [sketch.systems](http://sketch.systems).

<div style="text-align: center">
	<img src="assets/code_snippet_2.png" alt="Form demo"/><br/>
	<img src="assets/form_demo_1.gif" alt="Form demo"/>
</div>

## Contents:

- [Installation](#installation)
- [Usage](#usage)
- [Demo: Toggle Button](#demo-toggle-button)
- [Demo: Form](#demo-form)
- [Documentation](#documentation)

# Installation

## Automatic

<a href='https://open.framermodules.com/StateMachine'>
    <img alt='Install with Framer Modules'
    src='https://www.framermodules.com/assets/badge@2x.png' width='160' height='40' />
</a>

## Manual

First download the **statemachine.coffee** file and drag it into your Framer project's `modules` folder.

Then, at the top of your Framer project's code, type `{ StateMachine } = require "statemachine"`.

# Usage

StateMachine is a module that allows you to design "finite state machine"s to control the logic of your components.

![Demo Diagram](assets/diagram.svg "Toggle demo")

To see this example in action, [click here](https://framer.cloud/lpCQp).

### States

The StateMachine itself is made up of a set of states. At any given time, the machine will always be in one of these states; and it will never be more than one state at a time. In the example below, we're creating a machine with three states: `default`, `state_a`, and `state_b`.

```coffeescript
myStateMachine = new StateMachine
	initial: "default"
	states:
		default:
			action_a: "state_a"
			action_b: "state_b"
		state_a:
			reset: "default"
		state_b:
			reset: "default"
```

### Actions

Each of a StateMachine's states may have one or more "response"s. These pair the name of an action and the name of a state. In the example above, `state_a`'s first response, `{action_b: "state_b"}` pairs the action `action_b` and to the state name `"state_b"`.

### Dispatching Actions

You can send "actions" to the machine using the `machine.dispatch()` method. The method accepts two arguments: 1) the name of the action you're sending, and 2) an optional "payload" of data.

```coffeescript
layer_a.onTap =>
	myStateMachine.dispatch( "action_a", new Date() )

layer_b.onTap =>
	myStateMachine.dispatch( "action_b", new Date() )

reset_button.onTap =>
	myStateMachine.dispatch( "reset", new Date() )
```

In this example, tapping on the layer `layer_a` dispatches the action `action_a` to the machine, along with a payload (a `Date` object).

### Responding to an Action

When the machine recieves an action, it checks to see if its current state has an response for that action. If it does not have a response for the action, the machine will ignore the action -- but if it does have a response, the machine will change its state to the state indicated in that response.

If our example machine was in `default` and we tapped on `layer_a`, the machine would respond to the dispatched action, `action_a`, by changing its state to `state_a`. If we then tapped `layer_a` again, the machine would ignore the action, as its now-current state, `state_a`, has no response for `action_a`.

Likewise, our machine has no path between `state_a` and `state_b`: the machine would ignore all `action_a` and `action_b` dispatches while in either of these states. In order to move from one to the other, the machine would have to first return to the `default` state (using a `reset` action).

### Listening for State Changes

When a state machine changes its state, it emits an event, `"change:state"` that can be called with two arguments: 1) its new current state, and 2) the payload sent with the preceding action. (This event has an alias, `machine.onStateChange`.) You can use this event, along with a `switch` statement, to decide how to represent the machine's current state to your user.

```coffeescript
myStateMachine.onStateChange, (state, payload) ->

	switch state.name
		when "state_a"
			layer_a.backgroundColor = "#ff0000"
			layer_b.backgroundColor = "#cccccc"
		when "state_b"
			layer_a.backgroundColor = "#cccccc"
			layer_b.backgroundColor = "#ff0000"
		when "default"
			layer_a.backgroundColor = "#cccccc"
			layer_b.backgroundColor = "#cccccc"
```

You can also use the payload send with the state change event to make more complex changes in your project.

```coffeescript
myStateMachine.onStateChange (state, payload) ->
	if payload instanceof Date
		print payload.toLocaleString() +  ": changed state to " + current
```

To see this example in action, [click here](https://framer.cloud/lpCQp).

## Advanced

### Responding with functions

What if there's some logic in the machine's response to a given action? Instead of defining an action's value as the name of a state, you may also use a function that returns the name of a state.

```coffeescript
coin.machine = new StateMachine
	states:
		heads:
			turn_over: "tails"
			flip: -> if Math.random() >= 0.5 then "heads" else "tails"
		tails:
			turn_over: "heads"
			flip: -> if Math.random() >= 0.5 then "heads" else "tails"
```

### Nesting states

What about when a state has its own states? When defining your machines's states, you may include sub-states by placing one state object inside of another. You can include as many levels of nestedness as you like.

```coffeescript
button.machine = new StateMachine
	initial: "off"
	states:
		off:
			mouseEnter: "hovered"
			hovered:
				mouseLeave: "off"
				press: "pressed"
				pressed:
					release: "on.hovered"
		on:
			mouseEnter: "hovered"
			hovered:
				mouseLeave: "on"
				press: "pressed"
				pressed:
					release: "off.hovered"
```

Notice that the `release` action for the `off.hovered.pressed` state points to `on.hovered`, a direct route to a particular unique state. We'll called this a "path". When given a state name, the machine will work its way back up the state tree, checking at each level whether a state with that name exists, and terminating at the root of its `states` object. However, you may link directly to a given state by using a path (a string that will always include at least one `.`)

Presenting components that own nested states usually involves checking against the machine's `state.path`, rather than `state.name`, as you may wish to represent the parent state rather than the newest child state. Because `state.path` comes is an array, you can check against different state levels using bracket notation. In our example, `state.path[0]` will always be either `"on"` or `"off"`, while `state.path[1]` will be either `hovered` or `undefined`. To check whether the machine's path includes a given state name (at any level), use the `machine.isInState()` method.

```coffeescript
button.machine.onStateChange (state) ->
	switch state.path[0]
		when "on"
			button.animate
				shadowY: 1
				brightness: 75
		when "off"
			button.animate
				shadowY: 4
				brightness: 100

	if state.name is "pressed"
		button.animate
			shadowY: 0
			brightness: 50

	if state.name is "hovered"
		button.opacity = .9
	else
		button.opacity = 1
```

# Demo: Toggle Button

[Click here](https://framer.cloud/rNtID) to see a live demo of this example.

In this example, we build a simple toggle button: it cna be either on or off.

![alt text](assets/toggle_demo.gif "Toggle demo")

# Demo: Form

[Click here](https://framer.cloud/CXRGL) to see a live demo of this example.

In this second example, we deal with a more complex set of states and relationships that model an asynchronous submission form.

![Form Diagram](assets/diagram_form.svg "Form demo")
![alt text](assets/form_demo_1.gif "Form demo")

# Documentation

## Properties

| Name           | Type            | Description                                                         | readonly |
| -------------- | --------------- | ------------------------------------------------------------------- | -------- |
| `state`        | `string`        | Gets and sets the machine's current state by its name (a `string`). | false    |
| `current`      | `string`        | Returns the name of the machine's current state.                    | false    |
| `initial`      | `string`        | Gets and sets the machine's initial state.                          | true     |
| `history`      | `Array<string>` | Returns the machine's history.                                      | true     |
| `historyIndex` | `number`        | Returns the machine's history index.                                | true     |

## Methods

| Name                        | Argument Types                    | Description                                                                                                 |
| --------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `dispatch(action, paylaod)` | `action : string`, `payload: any` | Dispatches an action to the machine.                                                                        |
| `onChangeState(fn)`         | `fn: EventHandler`                | Sets an event listener that fires when the machine's state changes. Alias for `machine.on("change:state")`. |  |
| `undo()`                    | n/a                               | Moves the StateMachine to its previous state, if one exists.                                                |
| `redo()`                    | n/a                               | Moves the StateMachine to its next state, if one exists.                                                    |

# Contact

Follow me at: **[@steveruizok](http://twitter.com/steveruizok)**

See more projects at: **[Github](http://github.com/steveruizok)**

Find me in the **[Framer Slack channel](https://framer-slack-signup.herokuapp.com/)**

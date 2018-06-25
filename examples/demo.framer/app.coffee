# StateMachine demo
# @steveruizok

{ StateMachine } = require 'statemachine'

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
			
layer_a.onTap =>
	myStateMachine.dispatch( "action_a", new Date() )

layer_b.onTap =>
	myStateMachine.dispatch( "action_b", new Date() )

reset_button.onTap =>
	myStateMachine.dispatch( "reset", new Date() )
	
myStateMachine.on "change:state", (current, payload) ->

	switch current
		when "state_a"
			layer_a.backgroundColor = "#ff0000"
			layer_b.backgroundColor = "#cccccc"
		when "state_b"
			layer_a.backgroundColor = "#cccccc"
			layer_b.backgroundColor = "#ff0000"
		when "default"
			layer_a.backgroundColor = "#cccccc"
			layer_b.backgroundColor = "#cccccc"
			
	if payload instanceof Date
		print payload.toLocaleString() +  ": changed state to " + current
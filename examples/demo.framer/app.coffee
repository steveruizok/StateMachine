# StateMachine demo
# @steveruizok

{ StateMachine } = require 'statemachine'

# Machine

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


# Actions
			
layer_a.onTap =>
	myStateMachine.dispatch( "action_a", new Date() )

layer_b.onTap =>
	myStateMachine.dispatch( "action_b", new Date() )

reset_button.onTap =>
	myStateMachine.dispatch( "reset", new Date() )

# Layer states (presentational)

for layer in [layer_a, layer_b]
	layer.states =
		default:
			backgroundColor: "#cccccc"
		active:
			backgroundColor: "#ff0000"
		animationOptions:
			time: .16
			

# Respond to state changes
	
myStateMachine.onStateChange (state) ->
	switch state.name
		when "state_a"
			layer_a.animate("active")
			layer_b.animate("default")
		when "state_b"
			layer_a.animate("default")
			layer_b.animate("active")
		when "default"
			layer_a.animate("default")
			layer_b.animate("default")
			
	if state.payload instanceof Date
		print state.payload.toLocaleString() +  ": changed state to " + state.name
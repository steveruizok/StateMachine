# StateMachine: Toggle demo
# @steveruizok

{ StateMachine } = require "statemachine"
Screen.backgroundColor = "#FFF"

# Machine

toggleMachine = new StateMachine
	initial: "off"
	states:
		on:
			"press": "off"
		off:
			"press": "on"


# Layers
			
toggleButton = new Layer
	size: 80
	x: Align.center()
	y: Align.center(-64)
	borderRadius: 8
	shadowColor: "rgba(0,0,0,.5)"
	animationOptions: 
		time: .25
		
toggleButton.states =
	on:
		backgroundColor: "#777"
		shadowY: 0
		shadowBlur: 0
	off:
		backgroundColor: "#AAA"
		shadowY: 5
		shadowBlur: 3
		
toggleButton.stateSwitch("off")


# Actions

toggleButton.onTap =>
	toggleMachine.dispatch("press")


# Responding to State Changes

toggleMachine.onStateChange (state, payload) ->
	switch state 
		when "on"
			toggleButton.animate("on")
		when "off"
			toggleButton.animate("off")


# Bonus Stuff 

toggleMachine.onStateChange (state, payload) ->
	currentState.template = state
	
currentState = new TextLayer
	fontSize: 12
	fontWeight: 600
	text: "Current state: {stateName}"
	width: 200
	textAlign: "center"
	x: Align.center()
	y: toggleButton.maxY + 46
	textAlign: "center"
	color: "#777"
	borderColor: "#777" 


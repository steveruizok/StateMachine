# StateMachine Demo: Tape Player
# @steveruizok

{ StateMachine } = require 'statemachine'
Screen.backgroundColor = "#efefef"

state_label.x = 128
path_label.x = 128

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

button.onTapStart -> this.machine.dispatch("press")
button.onMouseEnter -> this.machine.dispatch("mouseEnter")
button.onMouseLeave -> this.machine.dispatch("mouseLeave")
button.onTapEnd -> this.machine.dispatch("release")

button.animationOptions =
	time: .16

button.machine.onStateChange (state) ->
	state_label.template = state.name 
	path_label.template = state.path.join('.')
	
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
			brightness: 50
			shadowY: 0
			
	if state.name is "hovered"
		button.opacity = .9
	else
		button.opacity = 1

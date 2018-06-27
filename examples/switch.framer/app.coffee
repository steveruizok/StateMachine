{ StateMachine } = require 'statemachine'

# [1] Machine

machine = new StateMachine	
	initial: "b"
	states:
		a:
			"press_b": "b"
		b:
			"press_a": "a"			
			
# [2] Events

button_a.onTap =>
	machine.dispatch("press_a", new Date())
	
button_b.onTap =>
	machine.dispatch("press_b", new Date())

# [4] Presentation Logic

machine.on "change:state", (state) ->
	switch state.name
		when "a"
			button_a.animate
				backgroundColor: "#ff0400"
				options: {time: .15}
			button_b.animate
				backgroundColor: "#858585"
				options: {time: .15}
		when "b"
			button_a.animate
				backgroundColor: "#858585"
				options: {time: .15}
			button_b.animate
				backgroundColor: "#ff0400"
				options: {time: .15}
			
	current_state_label.template = state

# Graph Logic


machine.on "change:state", (state) ->
# 	if date?
	print state.payload?.toLocaleTimeString() +  ": changed state to " + state.name
		
	switch state
		when "a"
			a_to_b_arrow.fill = "#ff0400"
			a_to_b_path.stroke = "#ff0400"
			b_to_a_arrow.fill = "#000"
			b_to_a_path.stroke = "#000"
			a_oval.stroke = "#ff0400"
			b_oval.stroke = "#000"
			Utils.delay .5, ->
				a_to_b_arrow.animate fill: "#000"
				a_to_b_path.animate stroke: "#000"
		when "b"
			b_to_a_path.stroke = "#ff0400"
			b_to_a_arrow.fill = "#ff0400"
			a_to_b_path.stroke = "#000"
			a_to_b_arrow.fill = "#000"
			b_oval.stroke = "#ff0400"
			a_oval.stroke = "#000"
			Utils.delay .5, ->
				b_to_a_arrow.animate fill: "#000"
				b_to_a_path.animate stroke: "#000"
	
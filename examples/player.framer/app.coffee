{ StateMachine } = require 'statemachine'

Screen.backgroundColor = "#efefef"
player.x = Align.center()

recorderMachine = new StateMachine
	initial: "stopped"
	states:
		playing:
			stop: "stopped"
			rewind: "rewinding"
			fastforward: "fastforwarding"
			rewinding:
				rewind_end: "playing"
			fastforwarding: 
				rewind_end: "playing"
		
		rewinding:
			rewind_end: "stopped"
		fastforwarding: {}
		stopped:
			play: "playing"
		paused: {}
		
recorderMachine.onStateChange (state) ->
	print recorderMachine.states
	switch state 
		when "playing"
			for layer in [left_spool, right_spool]
				layer.animate
					rotation: layer.rotation + 360
					time: 5
					options:
						curve: "linear"
						looping: true
		when "stopped"
			for layer in [left_spool, right_spool]
				layer.animateStop()

[pause, play, fast_rewind, fast_forward, stopp].forEach (button) ->
	buttonMachine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
				pressed:
					release: -> 
						print recorderMachine.state
						if recorderMachine.state is "stopped"
							return "on"
			on:
				press: "pressed"
				pressed:
					release: "on"
	
	button.states =
		off:
			brightness: 100
			options:
				time: .24
		on:
			brightness: 60
			options:
				time: .24
		pressed:
			brightness: 40
			options:
				time: .16
		
	button.onTapStart -> 
		buttonMachine.dispatch("press")
	button.onTapEnd -> 
		buttonMachine.dispatch("release")
	
	buttonMachine.onStateChange (state, payload) ->
		button.animate(state)
	
	button.machine = buttonMachine

# Play

play.machine.states =
	off:
		press: "pressed"
		pressed:
			release: -> 
				print recorderMachine.state
				if recorderMachine.state is "stopped"
					return "on"
	on:
		press: "pressed"
		pressed:
			release: "on"

play.machine.onStateChange (state) ->
	switch state
		when "pressed"
			stopp.machine.state = "off"
		when "on"
			recorderMachine.dispatch("play")
		when "off"
			recorderMachine.dispatch("stop")

# Rewind

fast_rewind.machine.states =
	off:
		press: "pressed"
		pressed:
			release: -> 
				if recorderMachine.state is "stopped"
					return "on"
				else
					return "off"
	on:
		press: "pressed"
		pressed:
			release: "on"

fast_rewind.machine.onStateChange (state) ->
	switch state
		when "pressed"
			recorderMachine.dispatch("rewind")
		when "on"
			recorderMachine.dispatch("rewind")
		when "off"
			recorderMachine.dispatch("rewind_end")

# Stop

stopp.machine.states = 
	off:
		press: "pressed"
		pressed:
			release: "off"
			
stopp.machine.onStateChange (state) ->
	switch state
		when "pressed"
			play.machine.state = "off"
			fast_rewind.machine.state = "off"
			fast_forward.machine.state = "off"
			pause.machine.state = "off"
			recorderMachine.dispatch("stop")
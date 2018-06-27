# StateMachine Demo: Tape Player
# @steveruizok

{ StateMachine } = require 'statemachine'

Screen.backgroundColor = "#efefef"
player.x = Align.center()
state_label.x = Align.center()
path_label.x = Align.center()


# Animations (playing, tracking)

showPlaying = (bool) ->
	unless bool
		for layer in [left_spool, right_spool]
			layer.animateStop()
		return
	
	for layer in [left_spool, right_spool]
		layer.animate
			rotation: layer.rotation + 360
			options:
				time: 5
				curve: "linear"
				looping: true
				
showTracking = (direction) ->
	switch direction
		when "rewind"
			[left_spool, right_spool].forEach (layer) ->
				layer.animateStop()
				layer.animate
					rotation: layer.rotation - 360
					options:
						time: .5
						curve: "linear"
						looping: true
		
		when "forward"
			[left_spool, right_spool].forEach (layer) ->
				layer.animateStop()
				layer.animate
					rotation: layer.rotation + 360
					options:
						time: .5
						curve: "linear"
						looping: true
	

# Player Machine

player.machine = new StateMachine
	initial: "stopped"
	states:
		playing:
			pause: "paused"
			stop: "stopped"
			fast_rewind: "fast_rewinding"
			fast_forward: "fast_forwarding"
			paused:
				stop: "stopped"
				resume: "playing"
			fast_rewinding:
				stop: "stopped"
				pause: "paused"
				paused:
					resume: "fast_rewinding"
				track_end: "playing"
			fast_forwarding: 
				stop: "stopped"
				track_end: "playing"
		fast_rewinding:
			stop: "stopped"
			play: "playing"
			pause: "paused"
			paused:
				resume: "fast_rewinding"
		fast_forwarding:
			stop: "stopped"
			play: "playing"
			pause: "paused"
			paused:
				resume: "fast_forwarding"
		stopped:
			play: "playing"
			stop: "stopped"
			fast_rewind: "fast_rewinding"
			fast_forward: "fast_forwarding"

player.machine.onStateChange (state) ->
	state_label.template = state.name
	path_label.template = state.path.join('.')
	resets = []
	
	switch state.name
		when "playing"
			showPlaying(true)
			resets = [stopp, fast_rewind, fast_forward]
		when "stopped"
			showPlaying(false)
			resets = [play, fast_rewind, fast_forward, pause]
		when "fast_rewinding"
			showTracking("rewind")
			resets = [stopp]
		when "fast_forwarding"
			showTracking("forward")
			resets = [stopp]
		when "play_rewinding"
			showTracking("rewind")
			null
		when "play_forwarding"
			showTracking("forward")
			null
		when "paused"
			showPlaying(false)
	
	for button in resets
		button.machine.dispatch("reset")

# Buttons (Presentation)

[pause, play, fast_rewind, 
fast_forward, stopp].forEach (button) ->
	
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
		button.machine.dispatch("press")
		
	button.onTapEnd -> 
		button.machine.dispatch("release")

# Stopp

[stopp].forEach (button) ->

	button.machine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
				pressed:
					release: "off"
	
	button.machine.onStateChange (state, payload) ->
		button.animate(state.name)
	
	button.machine.onStateChange (state) ->
		switch state.name
			when "pressed"
				player.machine.dispatch("stop")

# Pause

[pause].forEach (button) ->

	button.machine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
				pressed:
					release: "off"
	
	button.machine.onStateChange (state, payload) ->
		button.animate(state.name)
	
	button.machine.onStateChange (state) ->
		switch state.name
			when "pressed"
				player.machine.dispatch("pause")
			when "off"
				player.machine.dispatch("resume")

# Fast Rewind

[fast_rewind].forEach (button) ->
	button.machine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
				pressed:
					release: ->
						if player.machine.isInState("playing")
							return "off"
						else if player.machine.isInState("fast_forwarding")
							return "off"
						else
							return "on"
			on:
				reset: "off"
				press: "pressed"
				pressed:
					release: "on"
		
	button.machine.onStateChange (state, payload) ->
		button.animate(state.name)

	button.machine.onStateChange (state) ->
		switch state.name
			when "pressed"
				player.machine.dispatch("fast_rewind")
			when "off"
				player.machine.dispatch("track_end")


# Fast Forward

[fast_forward].forEach (button) ->
	button.machine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
				pressed:
					release: ->
						if player.machine.isInState("playing")
							return "off"
						else if player.machine.isInState("fast_rewinding")
							return "off"
						else
							return "on"
			on:
				reset: "off"
				press: "pressed"
				pressed:
					release: "on"
		
	button.machine.onStateChange (state, payload) ->
		button.animate(state.name)

	button.machine.onStateChange (state) ->
		switch state.name
			when "pressed"
				player.machine.dispatch("fast_forward")
			when "off"
				player.machine.dispatch("track_end")

# Play 

[play].forEach (button) ->
	button.machine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
			on:
				reset: "off"
				press: "pressed"
			pressed:
				release: "on"
			
	button.machine.onStateChange (state, payload) ->
		button.animate(state.name)
		switch state.name
			when "pressed"
				player.machine.dispatch("play")
			when "off"
				player.machine.dispatch("stop")

{ StateMachine } = require 'statemachine'

Screen.backgroundColor = "#efefef"
player.x = Align.center()
state_label.x = Align.center()


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
			fast_rewind: "play_rewinding"
			fast_forward: "play_forwarding"
			paused:
				stop: "stopped"
				resume: "playing"
			play_rewinding:
				stop: "stopped"
				track_end: "playing"
			play_forwarding: 
				stop: "stopped"
				track_end: "playing"
		fast_rewinding:
			stop: "stopped"
			play: "playing"
		fast_forwarding:
			stop: "stopped"
			play: "playing"
		stopped:
			play: "playing"
			stop: "stopped"
			fast_rewind: "fast_rewinding"
			fast_forward: "fast_forwarding"

player.machine.onStateChange (state) ->
	state_label.template = state
	resets = []
	
	switch state
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

[pause, play, fast_rewind, fast_forward, stopp].forEach (button) ->
	
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

# Stop / Pause (Machine Logic)

[stopp, pause].forEach (button) ->

	button.machine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
				pressed:
					release: "off"
	
	button.machine.onStateChange (state, payload) ->
		button.animate(state)


stopp.machine.onStateChange (state) ->
	switch state
		when "pressed"
			player.machine.dispatch("stop")
			
pause.machine.onStateChange (state) ->
	switch state
		when "pressed"
			player.machine.dispatch("pause")
		when "off"
			player.machine.dispatch("resume")
			
# Rewind, Forward (Machine Logic)

[fast_rewind, fast_forward].forEach (button) ->
	button.machine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
				pressed:
					release: ->
						if player.machine.state is "fast_forwarding" or
						player.machine.state is "fast_rewinding"
							return "on"
						else
							return "off"
			on:
				reset: "off"
		
	button.machine.onStateChange (state, payload) ->
		button.animate(state)


fast_rewind.machine.onStateChange (state) ->
	switch state
		when "pressed"
			player.machine.dispatch("fast_rewind")
		when "off"
			player.machine.dispatch("track_end")

fast_forward.machine.onStateChange (state) ->
	switch state
		when "pressed"
			player.machine.dispatch("fast_forward")
		when "off"
			player.machine.dispatch("track_end")

# Play (Machine Logic)

[play].forEach (button) ->
	button.machine = new StateMachine
		initial: "off"
		states:
			off:
				press: "pressed"
				pressed:
					release: "on"
			on:
				reset: "off"
				
	button.machine.onStateChange (state, payload) ->
		button.animate(state)
		switch state
			when "pressed"
				player.machine.dispatch("play")
			when "off"
				player.machine.dispatch("stop")
			
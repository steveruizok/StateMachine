# StateMachine
# @steveruizok

{ StateMachine } = require "statemachine"

# StateMachine is a module that allows you to design state-based components. You'll create the machine by defining a set of "states". Each of these states may have one or more "events", and each event points to a different state ( the event's "target state"). 

# The machine always has a "current state", either its "initial state" or a different state that it has changed to after recieving some event. When the machine recieves an event, it checks to see if its current state owns an event with that name. If it does, the machine changes its state to that event's target state.

# [1] Example: Toggle Button

# A simple example is a toggle button. Its machine has two states, "on" and "off". Both states respond to the "press" event, but each handles it differently: in its "on" state, the "press" event targets the machine's "off" state; while in its "off" state, "press" targets "on".

# With the StateMachine module, we'd model this machine as follows:

toggleMachine = new StateMachine
	initial: "off"
	states:
		on:
			"press": "off"
		off:
			"press": "on"

# Now let's create a layer for the toggle. This layer will do two things: it ill display the state of toggleMachine to the user, and it will pass events back to the toggle machine, translating Framer events (like "taps") into the machine's events (like "press").
			
toggleButton = new Layer
	size: 80
	x: Align.center()
	y: 128
	borderRadius: 8
	shadowColor: "rgba(0,0,0,.5)"
	animationOptions: 
		time: .25
		
# Let's also give the Layer some Framer states. These "layer states" are different from toggleMachine's "machine states". While they don't affect the StateMachine in any way, we'll be using them below to show the machine's current state.
	
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

# Now we'll set an event listener on the toggle button that will send a "press" event the toggleMachine each time the layer is tapped.

toggleButton.onTap =>
	toggleMachine.handle("press")
	
# Finally, we'll set an event listener on toggleMachine so that we can do things in Framer when the the machine changes its state.

toggleMachine.on "change:current", (state) ->
	currentState.template = state
	
	switch state 
		when "on"
			toggleButton.animate("on")
		when "off"
			toggleButton.animate("off")
			
# And that's it! Our toggleMachine starts in the "off" state, each time we tap it the button sends a "press" event to toggleMachine, and toggleMachine changes to the next state, depending on its current state and that state's target state for the "press" event. 

# While this may seems like a lot of work for such a simple component, StateMachine really shines for more complex components, like the form in the next example.

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

# [2] Example: Form

# [2.0] Layers and States

layers = {}


# Field parent

layers.form = new Layer
	name: "Form Container"
	x: Align.center()
	y: Align.center(64)
	width: 280 + 8 + 64
	height: 44 + 8 + 20
	backgroundColor: null
	
layers.label = new TextLayer
	parent: layers.form
	fontSize: 12
	padding: {bottom: 8}
	fontWeight: 500
	text: "Name:"
	color: "#333"


# Create our input
	
layers.input = new Layer
	name: "Input Layer"
	y: layers.label.maxY
	parent: layers.form
	height: 44
	width: 280
	borderWidth: 1
	borderRadius: 4
	clip: true

input = document.createElement("input")

# A helper function for setting pixels in Framer
Utils.px = (num) -> (num * Framer.Device.context.scale) + 'px'

_.assign input.style,
	height: Utils.px(layers.input.height - 16)
	width: Utils.px(layers.input.width - 32)
	fontSize: Utils.px(14)
	padding:  Utils.px(8) + " " + Utils.px(16)
layers.input._element.appendChild(input);


# Button

layers.button = new Layer
	name: "Submit Button"
	parent: layers.form
	x: layers.input.maxX + 8
	y: layers.label.maxY
	height: 44
	borderRadius: 4
	width: 64
	animationOptions:
		time: .15
		colorModel: "rgb"
		
layers.button.states =
	enabled:
		gradient:
			start: "#478dff"
			end: "#2f7dfc"
		color: "#AAA"
	disabled:
		gradient:
			start: "#CCC"
			end: "#CCC"
		color: "#AAA"

layers.button.stateSwitch("disabled")

# Button text

layers.buttonText = new TextLayer
	name: "Button Text"
	parent: layers.button
	fontSize: 12
	color: "#FFF"
	y: Align.center()
	width: layers.button.width
	textAlign: "center"
	text: ""


# Error text

layers.errorText = new TextLayer
	name: "Error Text"
	parent: layers.form
	x: 16
	y: layers.input.maxY + 8
	height: 20
	fontSize: 12
	text: ""

layers.errorText.states =
	warn:
		color: "#AAA"
	success:
		color: "#348958"
	error:
		color: "#ff5554"
		
layers.errorText.stateSwitch("warn")


# [2.1] Creating our state machine

stateMachine = new StateMachine
	initial: "empty"
	states:
		empty:
			textEnter: "ready"
			emptySubmit: "warn"
		warn:
			textEnter: "ready"
		ready:
			textClear: "empty"
			submit: "fetching"
		fetching:
			error: "error"
			success: "success"
		success:
			textEnter: "ready"
			emptySubmit: "warn"
		error:
			textClear: "empty"
			submit: "fetching"


# [2.2] Responding to changes in StateMachine's state 

stateMachine.onChangeState (state) ->
	
	layers.currentState.template = state
	
	# default properties
	layers.buttonText.text = "Submit"
	layers.errorText.text = ""
	layers.errorText.animate("warn")
	layers.button.animate("enabled")
	input.readOnly = false
	
	# overrides (depending on state)
	switch state
		when "empty"
			layers.button.animate("disabled")
		when "warn"
			layers.button.animate("disabled")
			layers.errorText.text = "You'll need to enter your name first."
		when "ready"
			null # matches default properties
		when "fetching"
			layers.button.animate("disabled")
			layers.buttonText.text = "..."
			input.readOnly = true
		when "success"
			layers.button.animate("disabled")
			layers.errorText.stateSwitch("success")
			layers.errorText.text = "Thanks #{input.value}! We got your name ok."
			input.value = ""
		when "error"
			layers.errorText.stateSwitch("error")
			layers.buttonText.text = "Retry"
			layers.errorText.text = "Sorry, something went wrong. Try again?"
			null
		else
			null
			
	if state is "fetching"
		if Math.random() > .5
			Utils.delay 1, => stateMachine.handle("success")
		else
			Utils.delay 1, => stateMachine.handle("error")

# [2.3] Using Framer events to drive StateMachine's state

input.oninput = (event) ->
	value = input.value
	
	if value.length is 0
		stateMachine.handle("textClear")
		return
		
	stateMachine.handle("textEnter")

layers.button.onTap =>
	value = input.value
	
	if value.length is 0
		stateMachine.handle("emptySubmit")
		return
	
	stateMachine.handle("submit")

# [2.4] extras: state name, undo and Redo

layers.currentState = new TextLayer
	parent: layers.form
	fontSize: 12
	fontWeight: 600
	text: "Current state: {stateName}"
	x: 0
	y: layers.errorText.maxY + 46
	textAlign: "center"
	color: "#777"
	borderColor: "#777" 

layers.undo = new Layer
	parent: layers.form
	x:  Align.right(-72)
	y: layers.errorText.maxY + 32
	height: 44
	width: 64
	backgroundColor: null
	
layers.undoText = new TextLayer
	parent: layers.undo
	fontSize: 12
	fontWeight: 600
	text: "UNDO"
	width: layers.undo.width
	y: Align.center()
	textAlign: "center"
	color: "#777"
	borderColor: "#777"
	
layers.undo.onTap => stateMachine.undo()

layers.redo = new Layer
	parent: layers.form
	x: Align.right()
	y: layers.errorText.maxY + 32
	height: 44
	width: 64
	backgroundColor: null
	
layers.redoText = new TextLayer
	parent: layers.redo
	fontSize: 12
	fontWeight: 600
	text: "REDO"
	width: layers.redo.width
	y: Align.center()
	textAlign: "center"
	color: "#777"
	borderColor: "#777"
	
layers.redo.onTap => stateMachine.redo()

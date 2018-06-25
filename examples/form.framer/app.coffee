# StateMachine: form demo
# @steveruizok

{ StateMachine } = require "statemachine"
Screen.backgroundColor = "#FFF"

# Helpers

Utils.px = (num) -> (num * Framer.Device.context.scale) + 'px'


# Machine

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



# Layers

layers = {}

layers.form = new Layer
	name: "Form Container"
	x: Align.center()
	y: Align.center(-64)
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

_.assign input.style,
	height: Utils.px(layers.input.height - 16)
	width: Utils.px(layers.input.width - 32)
	fontSize: Utils.px(14)
	padding:  Utils.px(8) + " " + Utils.px(16)
layers.input._element.appendChild(input);

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

layers.buttonText = new TextLayer
	name: "Button Text"
	parent: layers.button
	fontSize: 12
	color: "#FFF"
	y: Align.center()
	width: layers.button.width
	textAlign: "center"
	text: ""

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
		color: "#555"
	success:
		color: "#348958"
	error:
		color: "#ff5554"
		
layers.errorText.stateSwitch("warn")



# Responding to State Changes

stateMachine.onStateChange (state, payload) ->
	
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
			layers.errorText.text = "Thanks #{payload}! We got your name ok."
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
			Utils.delay 1, => stateMachine.dispatch("success", payload)
		else
			Utils.delay 1, => stateMachine.dispatch("error")




# Actions

input.oninput = (event) ->
	value = input.value
	
	if value.length is 0
		stateMachine.dispatch("textClear")
		return
		
	stateMachine.dispatch("textEnter")

layers.button.onTap =>
	value = input.value
	
	if value.length is 0
		stateMachine.dispatch("emptySubmit")
		return
	
	stateMachine.dispatch("submit", value)




# Bonus Stuff

stateMachine.onStateChange (state, payload) ->
	layers.currentState.template = state

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

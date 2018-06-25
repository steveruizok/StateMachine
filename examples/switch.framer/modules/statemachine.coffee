# StateMachine
# @steveruizok

# StateMachine is a module that allows you to design state-based components. You'll create the machine by defining a set of "states". Each of these states may have one or more "events", and each event points to a different state ( the event's "target state"). 

# The machine always has a "current state", either its "initial state" or a different state that it has changed to after recieving some event. When the machine recieves an event, it checks to see if its current state owns an event with that name. If it does, the machine changes its state to that event's target state.

# @Properties

# history : string[] 
# 	Returns the machine's history. (read-only)

# historyIndex : number 
# 	Returns the machine's history index. (read-only)

# current : string 
# 	Returns the name of the machine's current state. (read-only)

# state : string
# 	Gets and sets the machine's current state (by its name).

# initial : string
# 	Returns the machine's history index.


# @Methods

# handle( event : string )
# 	Sends an event to the machine.

# onChangeState( fn: EventListener )
# 	Sets an event listener that fires when the machine's state changes.
# 	Alias for statemachine.on("change:state").

# onChangeCurrent( fn: EventListener )
# 	Identical to onChangeState (redundancy).

# undo()	
# 	Moves the StateMachine to its previous state, if one exists.

# redo()	
# 	Moves the StateMachine to its next state, if one exists.



class exports.StateMachine extends Framer.BaseClass
	constructor: (options = {}) ->
		_.assign @,
			_states: []
			_current: undefined
			_history: []
			_historyIndex: 0
			
			initial: options.initial
			states: []
		
		@states = options.states
	
	# Private methods
	
	_setCurrent: (state, direction) =>
		return unless state?
		
		switch direction
			when "undo"
				@_historyIndex--
			when "redo"
				@_historyIndex++
			else 
				if @current?
					@_addToHistory(@current)
					@_historyIndex++
		
		@_current = state
		@emit("change:current", state.name, @)
		@emit("change:state", state.name, @)
	
	_getCurrent: =>
		return @_getState(@current)
		
	_getState: (stateName) =>
		return _.find(@states, {name: stateName})
		
	_setInitialStates: =>
		if @initial
			state = _.find(@states, {name: @initial})
			if state?
				@_current = state
				Utils.delay 0, => @_setCurrent(state)
				return
		
		@_current = @states[0]
		Utils.delay 0, => @_setCurrent(@states[0])
		
	_addToHistory: (stateName) =>
		@_history = @_history.slice(0, @_historyIndex)
		@_history.push(stateName)
	
	_setState: (stateName, direction) =>
		state = @_getState(stateName)
		
		unless state?
			return;
		
		this._setCurrent(state, direction)
	
	
	# Public methods
	
	handle: (eventName) =>
		current = @_getCurrent()
		newStateName = current.events[eventName]
		
		if _.isUndefined(newStateName)
			return
		
		@_setState(newStateName)
		
	undo: =>
		return if @_historyIndex is 0
				
		@_setState(@_history[@_historyIndex - 1], "undo")
		
	redo: =>
		return if @_historyIndex is @_history.length
		
		@_setState(@_history[@_historyIndex + 1], "redo")
	
	onChangeCurrent: (fn) =>
		@on("change:current", fn)

	onChangeState: (fn) =>
		@on("change:state", fn)
		
		
	# Definitions
	
	@define "history",
		get: -> return @_history

	@define "historyIndex",
		get: -> return @_historyIndex
		
	@define "state",
		get: -> return @current
		set: (stateName) ->
			return unless stateName?
			
			@_setState(stateName)
		
	@define "current",
		get: -> return (@_current ? @initial)?.name ? undefined
		
	@define "initial",
		get: -> return @_initial
		set: (value) -> 
			@_initial = value
	
	@define "states",
		get: -> @_states
		set: (states) ->
			newStates = _.map(states, (value, key) =>
				return {name: key, events: value}
				)
			
			@_states = newStates
			
			# set initial state (delayed for listeners)
			@_setInitialStates()
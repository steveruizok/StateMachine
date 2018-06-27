# StateMachine
# @steveruizok

# StateMachine is a module that allows you to design state-based components. You'll create the machine by defining a set of "states". Each of these states may have one or more "actions", and each actions points to a different state ( the action's "target state"). 

# The machine always has a "current state", either its "initial state" or a different state that it has changed to after recieving some actions. When the machine recieves an actions, it checks to see if its current state owns an actions with that name. If it does, the machine changes its state to that actions's target state.

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

# dispatch( action : string, payload: any )
# 	Sends an action to the machine.

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
			_states: {}
			_current: undefined
			_history: []
			_historyIndex: 0
			
			initial: options.initial
			states: []
		
		@states = options.states
	
	# Private methods
	
	_getCurrent: =>
		return @_current
	
	_setCurrent: (state, payload, direction) =>
		return unless state?
		
		switch direction
			when "undo"
				@_historyIndex--
			when "redo"
				@_historyIndex++
			else 
				if @current?
					@_addToHistory(@current, payload)
					@_historyIndex++
		
		@_current = state

		@emit("change:current", state.name, payload, @)
		@emit("change:state", state.name, payload, @)
	
	_getNewState: (stateName) =>
		path = @_current.path.split('.')

		handleState = (state) ->
			if typeof state is "function"
				return state()
			else
				return state


		getAtPath = (array) =>
			if array.length is 0
				unless @states[stateName]
					throw "Couldn't find that state."
					return

				return @states[stateName]

			path = array.join('.')
			state = _.get(@states, path)

			if state?.states[stateName]
				return state.states[stateName]

			getAtPath(_.dropRight(array))

		newState = getAtPath(path)
		return newState

		
	_setInitialStates: =>
		if @initial
			state = _.get(@states, @initial)
			if state?
				@_current = state
				Utils.delay 0, => @_setCurrent(state)
				return

		# first = _.keys(@states)
		@_current = @states[_.keys(@states)[0]]
		Utils.delay 0, => @_setCurrent(@_current)
		
	_addToHistory: (stateName, payload) =>
		@_history = @_history.slice(0, @_historyIndex)
		@_history.push({name: stateName, payload: payload})
	
	_setState: (stateName, payload, direction) =>
		state = @_getNewState(stateName)
		
		unless state?
			return;
		
		this._setCurrent(state, payload, direction)
	
	
	# Public methods
	
	dispatch: (actionName, payload) =>
		current = @_getCurrent()

		newStateName = current.actions[actionName]
		if typeof newStateName is "function" then newStateName = newStateName()
		
		if _.isUndefined(newStateName)
			return

		@_setState(newStateName, payload)
		
	undo: =>
		return if @_historyIndex is 0
		
		state = @_history[@_historyIndex - 1]
		@_setState(state.name, state.payload, "undo")
		
	redo: =>
		return if @_historyIndex is @_history.length

		state = @_history[@_historyIndex + 1]
		@_setState(state.name, state.payload, "redo")

	onStateChange: (fn) =>
		@on("change:state", fn)
		
		
	# Definitions
	
	@define "history",
		get: -> return @_history

	@define "historyIndex",
		get: -> return @_historyIndex
		
	@define "state",
		get: -> return @current.name
		set: (stateName) ->
			return unless stateName?
			
			@_setState(stateName)
		
	@define "current",
		get: -> return @_current
		
	@define "initial",
		get: -> return @_initial
		set: (value) -> 
			@_initial = value
	
	@define "states",
		get: -> @_states
		set: (newStates) ->

			getStates = (statesObject, target) =>
				target._states = {}

				markupState = (value, key, obj) =>
					state =
						name: key
						path: undefined
						states: {}
						actions: {}
					
					if obj.path 
						state.path = obj.path + "." + key
					else
						state.path = key
							
					_.forEach value, (v, k) =>
						switch typeof v
							when "string"
								state.actions[k] = v
							when "function"
								state.actions[k] = v
							when "object"
								state.states[k] = markupState(v, k, state)
					
					return state
		
				_.forEach statesObject, (v, k) -> 
					target._states[k] = markupState(v, k, statesObject)
					
				return target
			
			getStates(newStates, @)

			# set initial state (delayed for listeners)
			@_setInitialStates()
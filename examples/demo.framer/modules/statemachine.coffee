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
	
	_setCurrent: (state) =>
		return unless state?
		
		switch state.direction
			when "undo"
				@_historyIndex--
			when "redo"
				@_historyIndex++
			else 
				if @current?
					@_addToHistory(@current)
					@_historyIndex++
		
		@_current = state

		@emit("change:current", state, @)
		@emit("change:state", state, @)
	
	_getNewState: (stateName) =>
		if _.includes(stateName, ".")
			# is a path
			path = stateName.split(".").join(".states.")
			newState = _.get(@states, path)
			return newState

		# work up current state tree
		path = @_current.path

		handleState = (state) ->
			if typeof state is "function"
				return state()
			else
				return state


		getAtPath = (array) =>

			if array.length is 0
				unless @states[stateName]
					throw "Couldn't find that state (#{stateName})."
					return

				return @states[stateName]

			p = array.join('.states.')

			state = _.get(@states, p + ".states." + stateName)
			if state
				return state

			return state ? getAtPath(_.dropRight(array))

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
		
	_addToHistory: (state, payload) =>
		@_history = @_history.slice(0, @_historyIndex)
		@_history.push(state)
	
	_setState: (stateName, payload, direction) =>
		state = @_getNewState(stateName)
		
		unless state?
			return;
		
		_.assign state,
			payload: payload
			direction: direction

		this._setCurrent(state)
	
	
	# Public methods

	isInState: (stateName) =>
		return _.includes(@current?.path, stateName)
	
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
						path: []
						states: {}
						actions: {}
					
					if obj.path?
						state.path = _.concat(obj.path, key)
					else
						state.path = [key]
							
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
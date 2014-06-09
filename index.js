var UsersAPI = require('ecapi.users')
	, util = require('util')
  , EventEmitter = require('events').EventEmitter;
  // , ResponseHandler = require('response-handler');

var GateKeeper = function( options ){
	console.log('instantiating gatekeeper');
	this.options = options;
	this.registerEvents();
};

// inherit the prototype methods from EventEmitter
util.inherits(GateKeeper, EventEmitter);


GateKeeper.prototype.registerEvents = function() {
	// var _this = this;

	
	// on data from user module, trigger response
	this.on('User:data', function( req, res, next, data ) {
		if( data.hasOwnProperty('id') ) {
			req.user = data;
			next();
		}
		else {
			// TODO: replace this with something like event based response handler, ie:
			// this.emit('response:error', req, res, next, {message: 'Invalid API key.'})
			res.send(403)
		}

	});
};

GateKeeper.prototype.auth = function(req, res, next) {

	console.log("Emitting user:find event");
	// var _this = this;

	var apikey = 'abc123';
	_this.emit('User:find', req, res, next, {api_key: apikey});

	// var data = { 
	// 	user: {
	// 		id: 1,
	// 		name: 'Alex'
	// 	} };

	// this.emit('gatekeeper:auth:res', req, res, next, data)
};

module.exports = exports = GateKeeper;

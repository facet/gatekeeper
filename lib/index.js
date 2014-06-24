
var util = require('util')
  , UsersAPI = require('./api/Users');
  // , RolesAPI = require('./api/Roles');


var GateKeeper = function( options ){
	this.options = options;
	this.intercom = options.intercom;

  // get API instances
  this.Users = new UsersAPI(this.options);

  // register the events
  this.registerEvents();
};


GateKeeper.prototype.registerEvents = function() {	
	
	// on data from user module, trigger response
	this.intercom.on('user:data', function( req, res, next, data ) {
		res.json(data);
	});

	this.intercom.on('user:auth:res', function( req, res, next, data ) {
		if( data.hasOwnProperty('id') ) {

			console.log('got user data in gatekeeper: ', data);

			req.user = data;
			next();
		}
		else {
			// TODO: replace this with something like event based response handler, ie:
			// this.emit('response:error', req, res, next, {message: 'Invalid API key.'})
			res.send(403);
		}
	});

};

GateKeeper.prototype.bindAuth = function() {
	var _this = this;

	return function auth(req, res, next){
		console.log("Emitting user:find event");
		var apikey = 'abc123';
		_this.intercom.emit('user:auth', req, res, next, {api_key: apikey});
	};
};

// get the routes object after setting up the router
GateKeeper.prototype.bindRoutes = function( router, options ) {
	this.router = router;

	for( var route in options.routes ) {
		var api = options.routes[route];

		if( this.hasOwnProperty(api) ) {
			console.log('binding '+route+' to '+api);

			this[api].bindRoutes( this.router, {'route': route} );
		}
		else {
			// TODO: emit or log error about incorrect route binding attempt
		}
	}

  return this.router;
};

exports = module.exports = GateKeeper;
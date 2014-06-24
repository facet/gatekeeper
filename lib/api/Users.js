
// require the libraries we will need
var User = require('../model/User');

// setup the main function
var UsersAPI = function( options ) {
  this.router = null;
  this.options = options;
  this.intercom = options.intercom;

  // get the user instance
  this.User = new User( this.options );

  this.registerEvents();
}

// register the module event listeners
UsersAPI.prototype.registerEvents = function () {
	// var _this = this;
  // we want to query data
  this.intercom.on('user:auth', this.auth.bind(this) );
  this.intercom.on('user:find', this.query.bind(this) );
  this.intercom.on('user:all', this.query.bind(this) ); // 'all' is just a query w/o conditions
};


// bind routes
UsersAPI.prototype.bindRoutes = function( router, routeOptions ) {
	this.router = router;
	var _this = this;

	var routeBase = routeOptions.route;

	console.log( "routeBase in UsersAPI: ", routeBase);

  // setup the GET /:userId routes
  this.router.route( routeBase + '/:userId' )
	  .get( function ( req, res, next ) {
	    _this.intercom.emit('user:find', req, res, next, userId)
	  });

  // setup the GET / routes
  this.router.route( routeBase )
	  // route our get call
	  .get( function ( req, res, next ) {
			_this.intercom.emit("user:all", req, res, next);
	  })
	  // route our get response.. yep, magical
	  .get( function ( req, res, next ) {
	    res.json( req.jsonObject );
	  });
  
  // process the POST /:product_id route
  this.router.route( routeBase )
	  .post( function ( req, res, next ) {
	    // create a new product
	    var rand = Math.random();
	    var newUserData = {
	      name: "User " + Math.floor(rand)
	      , email: Math.floor(rand) + '@facetapi.com'
	    };
	    _this.intercom.emit("user:create", newUserData, [req, res, next]);
	  })
	  .post( function ( req, res, next ) {
	    res.json( req.jsonObject );
	  });
}



UsersAPI.prototype.auth = function(req, res, next, query) {
	if(typeof query !== 'undefined' && query.hasOwnProperty('api_key')) {
		// we got an id hash
		var data = { 
			id: 1,
			name: 'Alex'
		};
	}
	else {
		// TODO: emit 403 error
	}

	this.intercom.emit('user:auth:res', req, res, next, data);
};


// querying functions for those that want direct access w/o event system
UsersAPI.prototype.query = function(req, res, next, query) {
	if(typeof query !== 'undefined' && query.hasOwnProperty('api_key')) {
		// we got an id hash
		var data = { 
			id: 1,
			name: 'Alex'
		};
	}
	else {
		var data = [{ 
			id: 1,
			name: 'Alex'
		},
		{ 
			id: 2,
			name: 'Bob'
		}];
	}

	this.intercom.emit('user:data', req, res, next, data);
};


exports = module.exports = UsersAPI;

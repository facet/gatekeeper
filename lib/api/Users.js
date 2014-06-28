
// require the libraries we will need
var User = require('../model/User');


/** API constructor
 *
 * @param 	Object 	options 	Options object - must contain 'db' (mongoose instance)
 * 												and 'intercom' (EventEmitter instance) keys.
 *
 * @return void
 */
var UsersAPI = function( options ) {
  this.router = null;
  this.options = options;
  this.intercom = options.intercom;

  // get the user instance
  this.User = new User( this.options );

  this.registerEvents();
}


/** Registers this API's event listeners
 *
 * @return void
 */
UsersAPI.prototype.registerEvents = function () {
	// var _this = this;
  // we want to query data
  this.intercom.on('user:auth', this.find.bind(this) );
  this.intercom.on('user:find', this.find.bind(this) );
  this.intercom.on('user:all', this.find.bind(this) ); // 'all' is just a query w/o conditions
};


/** Binds groups routes to the provided router instance.
 *
 * @param 	Object 	router				Router instance (express, koa, custom, etc)
 * @param 	Object	routeOptions	Options for route setup.
 *
 * @return void
 */
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



/**
 * Finds User documents with requested fields based on query and options
 * 
 * @param 	query 	 		object	mongoose query
 * @param 	fields			string	which fields to return
 * @param 	options 		object 	mongoose options
 * @param 	nodeStack		object	Contains keys for req, res, next
 *
 * @return 	promise
 */
UsersAPI.prototype.find = function(query, nodeStack) {
	if( typeof query === 'undefined' || query === null ) {
		// TODO: emit error to error handler
		console.log('No query was specified.');
		return false;
	}

	if( typeof query.fields === 'undefined' || query.fields === null ) {
		query.fields = '';
	}

	if( typeof query.options === 'undefined' || query.options === null ) {
		query.options = {lean: true};
	}

	if( query.hasOwnProperty('id') ) {
		var queryBuilder = this.User.findById(query.id, query.fields, query.options);
	}
	else if( query.hasOwnProperty('conditions') ) {
		var queryBuilder = this.User.find(query.conditions, query.fields, query.options);
	}
	else {
		// TODO: emit error to error handler
		console.log('No conditions or id specified.');
		return false;
	}

	var promise = queryBuilder.exec();

	this.intercom.emit('facet:response:user:data', promise, nodeStack);
	return promise;
};


/**
 * Finds User documents with requested fields based on query and options
 * 
 * @param 	query 	 		object	contains keys for: id, fields, options
 * @param 	nodeStack		object	Contains keys for: req, res, next
 *
 * @return 	promise
 */
UsersAPI.prototype.findById = function(query, nodeStack) {
	if( typeof query === 'undefined' || query === null || !query.hasOwnProperty('id') ) {
		// TODO: emit error to error handler
		console.log('No query/id was specified.');
		return false;
	}

	if( typeof query.fields === 'undefined' || query.fields === null ) {
		query.fields = '';
	}

	if( typeof query.options === 'undefined' || query.options === null ) {
		query.options = {lean: true};
	}

	var queryBuilder = this.User.findById(query.id, query.fields, query.options);
	var promise = queryBuilder.exec();

	this.intercom.emit('facet:response:user:data', promise, nodeStack);
	return promise;
};


/**
 * Finds User documents with requested fields based on query and options
 * 
 * @param 	query 	 		object	contains keys for: conditions, fields, options
 * @param 	nodeStack		object	Contains keys for req, res, next
 *
 * @return 	promise
 */
UsersAPI.prototype.findOne = function(query, nodeStack) {
	if( typeof query === 'undefined' || query === null ) {
		query = {};
	}

	if( typeof fields === 'undefined' || fields === null ) {
		fields = '';
	}

	if( typeof options === 'undefined' || options === null ) {
		options = { lean: true };
	}

	var promise = this.User.findOne(query, fields, options).exec();
	this.intercom.emit('facet:response:user:data', promise, nodeStack);
	return promise;
};


/**
 * Updates User documents with requested fields based on query and options
 * 
 * @param 	query 	 		object	contains keys for: conditions, updates, options
 * @param 	nodeStack		object	Contains keys for req, res, next
 *
 * @return 	promise
 */
UsersAPI.prototype.update = function(query, nodeStack) {
	if( typeof query === 'undefined' || query === null || !query.hasOwnProperty('conditions') ) {
		// TODO: emit error to error handler
		console.log('No query conditions were specified.');
		return false;
	}

	if( !query.hasOwnProperty('updates') ) {
		// TODO: emit error to error handler
		console.log('No updates were specified.');
		return false;	
	}

	if( typeof query.options === 'undefined' || query.options === null ) {
		query.options = {};
	}
	
	var promise = this.User.update(query.conditions, query.updates, query.options).exec();
	this.intercom.emit('facet:response:user:update', promise, nodeStack);
	return promise;
};


/**
 * Creates single/multiple Users
 * 
 * @param 	data 	 		object | array	either object w/ User properties
 * 																		or array containing such objects
 * @param 	nodeStack		object	Contains keys for req, res, next
 *
 * @return 	promise
 */
UsersAPI.prototype.create = function(data, nodeStack) {
	var promise = this.User.create(data);
	this.intercom.emit('facet:response:user:insert', promise, nodeStack);
	return promise;
};


/**
 * Removes Users that match conditions specified in query
 * 
 * @param 	query 	 		object	mongoose query, if {} all Users are deleted
 *
 * @return 	promise
 */
UsersAPI.prototype.remove = function(conditions, nodeStack) {
	if( typeof conditions === 'undefined' || conditions === null ) {
		// TODO: emit error to error handler
		console.log('No query conditions were specified.');
		return false;
	}

	var promise = this.User.remove(conditions).exec();
	this.intercom.emit('facet:response:user:remove', promise, nodeStack);
	return promise;
};




exports = module.exports = UsersAPI;

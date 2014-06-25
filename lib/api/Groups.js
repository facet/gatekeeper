
// require the libraries we will need
var Group = require('../model/Group');

// setup the main function
var GroupsAPI = function( options ) {
  this.router = null;
  this.options = options;
  this.intercom = options.intercom;

  // get the user instance
  this.Group = new Group( this.options );

  this.registerEvents();
}

// register the module event listeners
GroupsAPI.prototype.registerEvents = function () {
	// TODO: bind listeners
	this.intercom.on('facet:group:find', this.find.bind(this) );
	this.intercom.on('facet:group:insert', this.insert.bind(this) );
};


// bind routes
GroupsAPI.prototype.bindRoutes = function( router, routeOptions ) {
	this.router = router;
	var routeBase = routeOptions.route;

	// TODO: add routes
}



/**
 * Finds group documents with requested fields based on query and options
 * 
 * @param 	nodeStack		object	Contains keys for req, res, next
 * @param 	query 	 		object	mongoose query
 * @param 	fields			string	which fields to return
 * @param 	options 		object 	mongoose options
 *
 * @return 	promise
 */
GroupsAPI.prototype.find = function(nodeStack, query, fields, options) {
	if( typeof query === 'undefined' ) {
		query = {};
	}

	if( typeof fields === 'undefined' ) {
		fields = '';
	}

	if( typeof options === 'undefined' ) {
		options = {};
	}

	// check for pagination, add if not present
	// if( !query.hasOwnProperty('limit') ) {
	// 	query.limit = 25;
	// }

	// if( !query.hasOwnProperty('page') ) {
	// 	query.page = 0;
	// }

	var queryBuilder = this.Group.find(query, fields, options);
	var promise = queryBuilder.exec();

	this.intercom.emit('facet:response:group:data', promise, nodeStack);
	return promise;
};


GroupsAPI.prototype.insert = function(data, nodeStack) {
	var promise = this.Group.create(data);
	this.intercom.emit('facet:response:group:insert', promise, nodeStack);
	return promise;
};


exports = module.exports = GroupsAPI;

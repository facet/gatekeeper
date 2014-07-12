var util = require('util');

/** 
 * API constructor
 *
 * @param   Object  options   Options object - must contain 'db' (mongoose instance)
 *                            and 'intercom' (EventEmitter instance) keys.
 * @return void
 */
var AuthAPI = function( options ) {
  if(options.intercom) {
    this.intercom = options.intercom;
  }
  this.options = options;

  this.registerEvents();
}

/** 
 * Registers this API's event listeners
 *
 * @return void
 */
AuthAPI.prototype.registerEvents = function () {
  this.intercom.on('facet:auth:api', this.apiAuth.bind(this) );
};


/**
 * Authenticates API requests based on req.headers['Authorization'] key
 * 
 * @param   query       object  contains keys for conditions, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  void
 */
AuthAPI.prototype.apiAuth = function(query, nodeStack) {
  if(typeof query === 'undefined' || typeof query === null || !query.hasOwnProperty('conditions')) {
    this.intercom.emit('facet:response:error', 401, 'No API credentials specified.');
    // TOOD: return Promise.reject? or better yet is probably nodeStack.next(new Error(...))?
    return false;
  }
  
  if( !query.hasOwnProperty('options') ) {
    query.options = {};
  }

  query.options.lean = false;
  query.options.populate = 'groups';
  var _this = this;

  var successCb = function apiAuthSuccess(apiUser) {
    _this.intercom.emit('facet:auth:api:done', apiUser, nodeStack);
  };

  var errorCb = function apiAuthError(err) {
    var error = {
      status: 401,
      message: 'The API key you specified is invalid.'
    };

    _this.intercom.emit('facet:response:error', error);
  };

  // look up user
  this.intercom.emit('facet:user:findone', query, successCb, errorCb);
};


/** 
 * Binds groups routes to the provided router instance.
 *
 * @param   Object  router        Router instance (express, koa, custom, etc)
 * @param   Object  routeOptions  Options for route setup.
 *
 * @return void
 */
AuthAPI.prototype.bindRoutes = function( router, routeOptions ) {
  this.router = router;
  var _this = this,
    routeBase = routeOptions.route;
}


exports = module.exports = AuthAPI;

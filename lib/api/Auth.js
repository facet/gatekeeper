"use strict";
var util = require('util'),
  ApiCore = require('facet-core').ApiCore;

/** 
 * API constructor
 *
 * @param   Object  options   Options object - must contain 'db' (mongoose instance)
 *                            and 'intercom' (EventEmitter instance) keys.
 * @return void
 */
var AuthAPI = function( options ) {
  // set the options
  this.setCommonAttributes( options );

  // set the router for automation
  this.setupRouterManifest();

  // register the api events
  this.registerEvents();
}


/**
 * Product API inherits from Core API
 */
util.inherits(AuthAPI, ApiCore);



/**
 * Sets up the router manifest for route automation
 *
 * @return   {void}
 */
AuthAPI.prototype.setupRouterManifest = function () {

  // update the router manifest 
  this.routerManifest
    .setApiEventType('auth')
    .setRouteBase('/auth')
    .setRoutes([
      { verb: 'POST',   route: '',         emit: 'facet:auth:login'  },  // POST login attempt
    ])
    .extendRouteErrorMessages({
      container: 'The API user does not have a valid container id.',
      accountAuth: 'Invalid credentials.' // notion of account is different from api user
    });
};


/** 
 * Registers this API's event listeners
 *
 * @return void
 */
AuthAPI.prototype.registerEvents = function () {
  this.intercom.on('facet:auth:api', this.apiAuth.bind(this) );
  this.intercom.on('facet:auth:login', this.login.bind(this) );
};

/**
 * Authenticates user login attempt
 * 
 * @param   query       object  contains keys for conditions, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  void
 */
AuthAPI.prototype.login = function(query, nodeStack) {
  var _this = this;
  var condition = {};
  var returnPromise = new this.options.db.Promise();

  // find user account
  if( query.email !== undefined ) {
    condition.email = query.email;
  }
  else if( query.username !== undefined ) {
    condition.username = query.username;
  }

  var query = {
    conditions: condition
  };

  // test password
  this.intercom.emit('facet:user:findone', query, function(user) {
    if( user !== null ){
      returnPromise.fulfill(user);
    }
    else {
      returnPromise.reject('No user matching the criteria was found.');
    }

    _this.respond( 'facet:response:' + this.routerManifest.manifest.apiEventType + ':result', 
      returnPromise, 
      this.routerManifest.manifest.routeErrorMessages.accountAuth );

  }, function(err) {
    returnPromise.reject(err.message);
  });

  return returnPromise;
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
  query.populate = 'groups';
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

  query.initialApiAuth = true;

  // look up user
  this.intercom.emit('facet:user:findone', query, successCb, errorCb);
};



exports = module.exports = AuthAPI;

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
  // this.setupRouterManifest();

  // register the api events
  this.registerEvents();
}


/**
 * Product API inherits from Core API
 */
util.inherits(AuthAPI, ApiCore);


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

  // look up user
  this.intercom.emit('facet:user:findone', query, successCb, errorCb);
};



exports = module.exports = AuthAPI;

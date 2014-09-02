"use strict";
var util = require('util'),
  fs = require('fs'),
  _ = require('underscore'),
  Core = require('facet-core').Core,
  GroupsAPI = require('./api/Groups'),
  UsersAPI = require('./api/Users'),
  AuthAPI = require('./api/Auth');


/** 
 * Gatekeeper API constructor
 *
 * @param   Object  options   Options object - must contain 'db' (mongoose instance)
 *                            and 'intercom' (EventEmitter instance) keys.
 *
 * @return void
 */
var GateKeeper = function( options ){
  GateKeeper.super_.call(this, options);

  // check the contraints and set the custom modules
  if( this.options.hasOwnProperty("GroupsAPI") && this.checkConstraints( this.options.GroupsAPI ) ) {
    GroupsAPI = this.options.GroupsAPI;
  }
  if( this.options.hasOwnProperty("UsersAPI") && this.checkConstraints( this.options.UsersAPI ) ) {
    UsersAPI = this.options.UsersAPI;
  }
  if( this.options.hasOwnProperty("AuthAPI") && this.checkConstraints( this.options.AuthAPI ) ) {
    AuthAPI = this.options.AuthAPI;
  }

  // instantiate the api modules
  this.Groups = new GroupsAPI(this.options);
  this.Users = new UsersAPI(this.options);
  this.Auth = new AuthAPI(this.options);

  // register the events
  this.registerEvents();
};


/**
 * Catalog API inherits from Core
 */
util.inherits(GateKeeper, Core);



/** 
 * Registers Gatekeeper API event listeners
 *
 * @return void
 */
GateKeeper.prototype.registerEvents = function() {
  var _this = this;

  this.intercom.on('facet:check:access', this.checkAccess.bind(this) );

  this.intercom.on('facet:user:data', function handleUserData( data, nodeStack ) {
    data.then(function(userData) {
      if( userData === null ) {
        _this.intercom.emit('facet:response:error', 404, 'User was not found.');
      }
      else {
        _this.intercom.emit('facet:response:user:data', userData);
      }
    },
    function(err) {
      _this.intercom.emit('facet:response:error', 404, 'Error querying for user(s): ' + err.message);
    }).end();
    
  });


  this.intercom.on('facet:auth:api:done', function handleApiAuthData(apiUser, nodeStack) {
    if( apiUser === null ) {

      // TODO: check if subscriber exists to error listener and only emit if so, do not call next() otherwise
      _this.intercom.emit('facet:response:error', 403, 'Invalid API key/token.');

      if( _.isFunction(nodeStack.next) ) {
        // TODO: abstract this to a FacetError class
        var error = new Error('Invalid API key/token.');
        error.http_code = 403;
        nodeStack.next(error);
      }
    }
    else {
      nodeStack.req.apiUser = apiUser;
    
      if( _.isFunction(nodeStack.next) ) {
        nodeStack.next();
      }
    }
  });

};


GateKeeper.prototype.checkAccess = function(action, cb) {
  // this.nodeStack.req.apiUser only exists if apiAuthMiddleware was use()'d
  // console.log(this.nodeStack.req.apiUser);
  
  // TOOO: allow passing an app_id to checkAccess
  this.nodeStack.req.apiUser.checkAccess(action, cb);
};


/**
 * Middleware function to authenticate API requests for express/koa apps
 * Upon successful auth, a apiUser key containing a mongoose user model
 * will be set on the request object
 * 
 * @param {function} fn - a function that returns a middleware function,
 *                        this fn is invoked with a 'this' argument to provide
 *                        access to the Gatekeeper instance
 *
 * @return  function
 */
GateKeeper.prototype.apiAuthMiddleware = function(fn) {
  this.apiAuthInitialized = true;

  if( _.isFunction(fn) && this.doAccessCheck === true ) {
    return fn(this);
  }
  else {
    if( _.isString(this.middlewareType) ) {
      this.middlewareType = this.middlewareType.toLowerCase();
    }
    
    // load the requested middleware
    if( this.middlewareType === 'express' ) this.middlewareType = 'connect';
    var apiAuthFn = require('./middleware/apiauth/' + this.middlewareType)(this);
    return apiAuthFn;
  }

  
};


/** 
 * Binds groups routes to the provided router instance.
 *
 * @param   Object  router        Router instance (express, koa, custom, etc)
 * @param   Object  routeOptions  Options for route setup.
 *
 * @return void
 */
// GateKeeper.prototype.bindRoutes = function( router, routeOptions ) {
//   this.router = router;

//   for( var route in routeOptions.routes ) {
//     var api = routeOptions.routes[route];

//     if( this.hasOwnProperty(api) ) {
//       this[api].bindRoutes( this.router, {'route': route} );
//     }
//     else {
//       // TODO: emit or log error about incorrect route binding attempt
//     }
//   }

//   return this.router;
// };


exports = module.exports = GateKeeper;

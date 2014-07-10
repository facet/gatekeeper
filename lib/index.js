
var util = require('util')
  , _ = require('underscore')
  , UsersAPI = require('./api/Users')
  , GroupsAPI = require('./api/Groups')
  , AuthAPI = require('./api/Auth');


/** 
 * Gatekeeper API constructor
 *
 * @param   Object  options   Options object - must contain 'db' (mongoose instance)
 *                            and 'intercom' (EventEmitter instance) keys.
 *
 * @return void
 */
var GateKeeper = function( options ){
  this.options = options;
  this.intercom = options.intercom;

  // get API instances
  this.Users = new UsersAPI(this.options);
  this.Groups = new GroupsAPI(this.options);
  this.Auth = new AuthAPI(this.options);

  // register the events
  this.registerEvents();
};


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
console.log('user data success in facet:user:data', userData);
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
      _this.intercom.emit('facet:response:error', 401, 'Invalid API key.');

      if( _.isFunction(nodeStack.next) ) {
        // TODO: abstract this to a FacetError class
        var error = new Error('Invalid API key.');
        error.http_code = 401;
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
  var accessIsGranted = true; // false
  if( accessIsGranted ){
    cb(true);
  } else { 
    // this.intercom.emit('facet:response:error', 401, 'Sorry you dont have access.');
    cb(false);
  }
}


/**
 * Middleware function to authenticate API requests for express/koa apps
 * Upon successful auth, a apiUser key containing a mongoose user model
 * will be set on the request object
 * 
 * @param   req         object  node request object
 * @param   res         object  node response object
 * @param   nest        object  node next function
 *
 * @return  function
 */
GateKeeper.prototype.apiAuthMiddleware = function(req, res, next) {
  var _this = this;

  return function doApiAuth(req, res, next) {
    var nodeStack = {
      req: req,
      res: res,
      next: next
    };

    var query = {
      conditions: {
        api_key: req.headers['Authorization'] || ''
      }
    };

    // emit event to auth user (see api/Users.js for event listner)
    _this.intercom.emit('facet:auth:api', query, nodeStack);
  };
  
};


/** 
 * Binds groups routes to the provided router instance.
 *
 * @param   Object  router        Router instance (express, koa, custom, etc)
 * @param   Object  routeOptions  Options for route setup.
 *
 * @return void
 */
GateKeeper.prototype.bindRoutes = function( router, routeOptions ) {
  this.router = router;

  for( var route in routeOptions.routes ) {
    var api = routeOptions.routes[route];

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

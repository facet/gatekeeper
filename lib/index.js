
var util = require('util')
  , UsersAPI = require('./api/Users')
  , GroupsAPI = require('./api/Groups');


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

  this.intercom.on('facet:user:data', function( data, nodeStack ) {
    data.then(function(userData) {
      if( userData === null ) {
        _this.intercom.emit('facet:response:error', 404, 'User was not found.');
      }
      else {
        _this.intercom.emit('facet:response:user:data', userData);
      }
    },
    function(err) {
      _this.intercom.emit('facet:response:error', 404, 'User was not found.');
    }).end();
    
  });

  this.intercom.on('facet:user:auth:api:done', function(apiUser, nodeStack) {
    console.log('api user after auth: ', apiUser);

    if( apiUser === null ) {
      _this.intercom.emit('facet:response:error', 403, 'Invalid API key.');
    }
    else {
      nodeStack.req.apiUser = apiUser;
    
      if( typeof nodeStack !== 'undefined' && nodeStack.hasOwnProperty('next') ) {
        nodeStack.next();
      }  
    }
  });

};

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

  console.log('returning api auth middleware func');

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

    console.log('emitting facet:user:auth:api event in auth middleware');

    // emit event to auth user (see api/Users.js for event listner)
    _this.intercom.emit('facet:user:auth:api', query, nodeStack);
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
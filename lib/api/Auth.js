"use strict";
var util = require('util'),
  ApiCore = require('facet-core').ApiCore,
  jwt = require('jwt-simple'),
  _ = require('underscore');

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
      { verb: 'POST',   route: '/account',         emit: 'facet:auth:login:account'  },  // POST login attempt
      { verb: 'POST',   route: '/jwt',             emit: 'facet:auth:login:jwt'  },  // POST login attempt
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
  this.intercom.on('facet:auth:api:basic', this.apiAuthBasic.bind(this) );
  this.intercom.on('facet:auth:api:jwt', this.apiAuthJwt.bind(this) );
  this.intercom.on('facet:auth:login:account', this.loginAccount.bind(this) );
  this.intercom.on('facet:auth:login:jwt', this.loginJwt.bind(this) );
  
};


/**
 * Exchange API user credentials for a JWT
 * 
 * @param   query       object  contains keys for conditions, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  string
 */
AuthAPI.prototype.loginJwt = function(query, nodeStack) {
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

  var userQuery = {
    conditions: condition,
    options: {
      lean: false
    },
    fields: '+password'
  };

  // test password
  this.intercom.emit('facet:user:findone', userQuery, function jwtLoginSuccess(user) {

    if( user !== null ){
      user.comparePassword(query.password, function comparePwSuccess(err, isMatch) {
        // console.log('error in AuthAPI::login: ', err);
        // console.log('isMatch in AuthAPI::login: ', isMatch);

        if( err ) {
          // console.log( 'error from comparePassword: ', err );
          returnPromise.reject(err.message);
          _this.respond( 'facet:response:error', returnPromise);
          return;
        }

        if( isMatch ) {
          // generate token
          var expires = new Date().getTime() + (24*60*60*1000); // expire token in 1 day

          var token = jwt.encode({
            iss: user.id,
            exp: expires
          }, _this.apiSecret);

          var returnObj = {
            token: token,
            expires: expires,
            user: user.toJSON()
          };
          returnPromise.fulfill(returnObj);
        }
        else {
          var errResponse = {message: 'Invalid credentials.'};
          returnPromise.reject(errResponse);
        }
      });
      
    }
    else {
      var errResponse = {message: 'No user matching the criteria was found.', status: 404};
      returnPromise.reject(errResponse);
    }

    _this.respond( 'facet:response:' + _this.routerManifest.manifest.apiEventType + ':login:jwt', returnPromise );

  }, function jwtLoginError(err) {
    returnPromise.reject(err.message);
    _this.respond( 'facet:response:error', returnPromise);
  });


  return returnPromise;
};


/**
 * Authenticates user login attempt
 * 
 * @param   query       object  contains keys for conditions, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  void
 */
AuthAPI.prototype.loginAccount = function(query, nodeStack) {
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

  var userQuery = {
    conditions: condition,
    fields: '+password',
    options: {
      lean: false
    }
  };

  // test password
  this.intercom.emit('facet:user:findone', userQuery, function accountLoginSuccess(user) {

    // console.log('done with findone: ', user);

    if( user !== null ){
      user.comparePassword(query.password, function comparePwSuccess(err, isMatch) {
        // console.log('error in AuthAPI::login: ', err);
        // console.log('isMatch in AuthAPI::login: ', isMatch);

        if( err ) {
          // console.log( 'error from comparePassword: ', err, typeof err );
          

          returnPromise.reject({
            message: 'Invalid credentials.'
          });
          // _this.respond( 'facet:response:error', returnPromise);
          // return;
        }

        if( isMatch ) {
          returnPromise.fulfill(user);
        }
        else {
          var errResponse = {message: 'Invalid credentials.'};
          returnPromise.reject(errResponse);
        }
      });
      
    }
    else {
      var errResponse = {message: 'No user matching the criteria was found.', status: 404};
      returnPromise.reject(errResponse);
    }

    // console.log('... responding from accountLoginSuccess');

    _this.respond( 'facet:response:' + _this.routerManifest.manifest.apiEventType + ':login', returnPromise );

  }, function accountLoginError(err) {
    
    // console.log('got an error from findone in AuthAPI::loginAccount');
    
    returnPromise.reject(err.message);
    _this.respond( 'facet:response:error', returnPromise);
  });


  return returnPromise;

};


/**
 * Verify a JWT and return the API user
 * 
 * @param   query       object  contains keys for conditions, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  string
 */
AuthAPI.prototype.apiAuthJwt = function(query, nodeStack) {
  var _this = this;
  var token = (nodeStack.req.body && nodeStack.req.body.access_token) || (nodeStack.req.query && nodeStack.req.query.access_token) || nodeStack.req.headers['x-access-token'];
  var returnPromise = new this.options.db.Promise();
  
  if (token) {
    try {
      var decoded = jwt.decode(token, this.apiSecret);

      if (decoded.exp <= Date.now()) {
        // TODO: handle expired token error
      }

      var userQuery = {
        conditions: {_id: decoded.iss},
        options: {
          lean: false
        },
        populate: 'groups'
      };

      // get user by decoded.id
      this.intercom.emit('facet:user:findone', userQuery, function accountLoginSuccess(user) {
        if( user !== null ){
          nodeStack.req.apiUser = user;
          if( _.isFunction(nodeStack.next) ) nodeStack.next()
        }
        else {
          var errResponse = {message: 'No user matching the criteria was found.', status: 404};
          returnPromise.reject(errResponse);
        }

        _this.respond( 'facet:response:' + _this.routerManifest.manifest.apiEventType + ':login', returnPromise );
        return returnPromise;

      }, function accountLoginError(err) {
        // console.log('got an error from findone in AuthAPI::login');
        returnPromise.reject(err.message);
        _this.respond( 'facet:response:error', returnPromise);
        return returnPromise;
      });
    } catch (err) {
      // TODO: handle decode token error
      console.log(err);
      returnPromise.reject({message: err.message});
      _this.respond( 'facet:response:error', returnPromise);
      return returnPromise;
    }
  } else {
    // TODO: handle no token error
    // console.log('no token bro...');
    returnPromise.reject({message: 'Invalid api token'});
    _this.respond( 'facet:response:error', returnPromise);
    return returnPromise;
  }
};


/**
 * Authenticates API requests based on api key
 * 
 * @param   query       object  contains keys for conditions, options
 * @param   nodeStack   object  Contains keys for req, res, next
 *
 * @return  void
 */
AuthAPI.prototype.apiAuthBasic = function(query, nodeStack) {
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
    _this.intercom.emit('facet:response:error', 403, 'The API key you specified is invalid.');
  };

  // TODO:
  // is this unsafe? a malicious user could include a 'initialApiAuth' field with 'true'
  // as the value in the request... won't pass strict bool check but seems like a bad idea
  query.initialApiAuth = true;

  // look up user
  this.intercom.emit('facet:user:findone', query, successCb, errorCb);
};



exports = module.exports = AuthAPI;
